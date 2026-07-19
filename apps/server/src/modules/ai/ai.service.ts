import { z } from "zod";
import type {
  CompareCandidatesInput,
  DraftNoteInput,
  GenerateEmailInput,
  GenerateJdInput,
  GenerateQuestionsInput,
  InsightsFiltersInput,
  NormalizeSkillsInput,
} from "@roms/shared";
import { AI_FIELD_CONFIDENCE } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import { reportsRepository } from "../reports/reports.repository.js";
import { resolveReportFilters } from "../reports/reports.scope.js";
import { clampScore, recommendationFromScore } from "./match-score.js";
import {
  aiDisclaimer,
  chatJson,
  truncateText,
  wrapUntrusted,
} from "./openai.client.js";
import { assertAiRateLimit } from "./rate-limit.js";
import {
  extractResumeTextFromFile,
  extractResumeTextFromUpload,
} from "./resume-text.js";
import {
  experienceScore,
  locationScore,
  normalizeSkillList,
  skillOverlapScore,
  tokenizeSkills,
} from "./skills.js";

type Actor = AuthenticatedUser;

function candidateScope(actor: Actor) {
  if (actor.role === "HR_ADMIN") return {};
  if (actor.role === "RECRUITER") {
    return { requisition: { createdById: actor.id } };
  }
  if (actor.role === "HIRING_MANAGER") {
    return { requisition: { hiringManagerId: actor.id } };
  }
  throw new ForbiddenError("You do not have access to AI features");
}

function assertCanGenerate(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }
  throw new ForbiddenError("Only HR Admin or Recruiter can run AI generation");
}

async function getScopedCandidate(id: string, actor: Actor) {
  const candidate = await prisma.candidate.findFirst({
    where: { id, deletedAt: null, ...candidateScope(actor) },
    include: {
      requisition: {
        include: { department: true },
      },
      interviews: {
        where: { deletedAt: null },
        include: { feedbackItems: true },
        orderBy: { scheduledAt: "desc" },
      },
    },
  });
  if (!candidate) {
    throw new NotFoundError("Candidate not found");
  }
  return candidate;
}

async function getScopedRequisition(id: string, actor: Actor) {
  const where =
    actor.role === "HR_ADMIN"
      ? { id, deletedAt: null }
      : actor.role === "RECRUITER"
        ? { id, deletedAt: null, createdById: actor.id }
        : { id, deletedAt: null, hiringManagerId: actor.id };

  const requisition = await prisma.jobRequisition.findFirst({
    where,
    include: { department: true },
  });
  if (!requisition) {
    throw new NotFoundError("Requisition not found");
  }
  return requisition;
}

async function loadResumeText(candidate: {
  resumeFilePath: string | null;
  resumeMimeType: string | null;
  resumeFileName: string | null;
}) {
  if (!candidate.resumeFilePath) {
    throw new BadRequestError("Candidate has no resume uploaded", "RESUME_REQUIRED");
  }
  return extractResumeTextFromFile(
    candidate.resumeFilePath,
    candidate.resumeMimeType,
    candidate.resumeFileName,
  );
}

/** Coerce common LLM quirks (omitted keys, string numbers, skills arrays). */
const nullableString = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return value;
}, z.string().nullable());

const nullableNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return value;
}, z.number().nullable());

const nullableInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "number") {
    return Math.round(value);
  }
  return value;
}, z.number().int().nullable());

const nullableSkills = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");
    return joined || null;
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}, z.string().nullable());

const confidenceSchema = z.preprocess((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const allowed = new Set<string>(AI_FIELD_CONFIDENCE);
  const normalized: Record<string, (typeof AI_FIELD_CONFIDENCE)[number]> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== "string") {
      continue;
    }
    const level = raw.trim().toLowerCase();
    if (allowed.has(level)) {
      normalized[key] = level as (typeof AI_FIELD_CONFIDENCE)[number];
    }
  }
  return normalized;
}, z.record(z.enum(AI_FIELD_CONFIDENCE)).default({}));

const extractedSchema = z.object({
  fullName: nullableString,
  email: nullableString,
  phone: nullableString,
  totalExperienceYears: nullableNumber,
  skills: nullableSkills,
  currentCompany: nullableString,
  currentLocation: nullableString,
  noticePeriodDays: nullableInt,
  confidence: confidenceSchema,
});

const summarySchema = z.object({ summary: z.string().min(1) });
const tagsSchema = z.object({ tags: z.array(z.string()).max(8) });
const qualitySchema = z.object({
  score: z.coerce.number().min(0).max(100),
  reasons: z.array(z.string()).min(1).max(10),
  improvements: z.array(z.string()).min(1).max(10),
});
const matchLlmSchema = z.object({
  adjustment: z.coerce.number().min(0).max(30),
  reasons: z.array(z.string()).min(1).max(8),
  summary: z.string(),
  rationale: z.string(),
});
const riskSchema = z.object({
  risks: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      detail: z.string(),
    }),
  ),
});
const jdSchema = z.object({
  description: z.string().min(1).max(5000),
  suggestedSkills: z.string().max(2000),
});
const improveSchema = z.object({
  suggestions: z.array(z.string()).min(1).max(12),
  revisedDescription: z.string().nullable(),
});
const questionsSchema = z.object({
  questions: z.array(z.string()).min(5).max(15),
});
const emailSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});
const noteSchema = z.object({ content: z.string().min(1).max(2000) });
const salarySchema = z.object({
  suggestedMin: z.number().nullable(),
  suggestedMax: z.number().nullable(),
  midpoint: z.number().nullable(),
  rationale: z.array(z.string()).min(1).max(8),
});
const feedbackSchema = z.object({
  summary: z.string(),
  consensus: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
});
const insightsSchema = z.object({
  bullets: z.array(z.string()).min(1).max(8),
});
const compareSchema = z.object({
  narrative: z.string(),
});
const weeklySchema = z.object({
  title: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()).min(1).max(10),
});

function guard(actor: Actor) {
  assertAiRateLimit(actor.id);
}

const RESUME_EXTRACT_SYSTEM =
  "Extract candidate profile fields from a resume. Use null when unknown. skills must be a single comma-separated string (not an array). Numbers must be numeric types, not strings.";

export const aiService = {
  async parseResumeUpload(file: Express.Multer.File, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const text = await extractResumeTextFromUpload(file);
    const result = await chatJson(
      extractedSchema,
      RESUME_EXTRACT_SYSTEM,
      wrapUntrusted("RESUME", text),
    );
    return {
      extracted: {
        fullName: result.fullName,
        email: result.email,
        phone: result.phone,
        totalExperienceYears: result.totalExperienceYears,
        skills: result.skills,
        currentCompany: result.currentCompany,
        currentLocation: result.currentLocation,
        noticePeriodDays: result.noticePeriodDays,
      },
      confidence: result.confidence,
      rawTextPreview: text.slice(0, 500),
      disclaimer: aiDisclaimer(),
    };
  },

  async parseCandidateResume(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const text = await loadResumeText(candidate);
    const result = await chatJson(
      extractedSchema,
      RESUME_EXTRACT_SYSTEM,
      wrapUntrusted("RESUME", text),
    );
    return {
      extracted: {
        fullName: result.fullName,
        email: result.email,
        phone: result.phone,
        totalExperienceYears: result.totalExperienceYears,
        skills: result.skills,
        currentCompany: result.currentCompany,
        currentLocation: result.currentLocation,
        noticePeriodDays: result.noticePeriodDays,
      },
      confidence: result.confidence,
      rawTextPreview: text.slice(0, 500),
      disclaimer: aiDisclaimer(),
    };
  },

  async summarizeResume(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const text = await loadResumeText(candidate);
    const result = await chatJson(
      summarySchema,
      "Write a concise 5-8 line recruiter-facing resume summary. No medical or sensitive inferences.",
      `${wrapUntrusted("RESUME", text)}\nRole context: ${candidate.requisition.title}`,
    );
    return { summary: result.summary, disclaimer: aiDisclaimer() };
  },

  normalizeSkills(input: NormalizeSkillsInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const result = normalizeSkillList(input.skills);
    return { ...result, disclaimer: aiDisclaimer("Deterministic normalization with alias map.") };
  },

  async suggestTags(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const text = candidate.resumeFilePath
      ? await loadResumeText(candidate)
      : [
          candidate.fullName,
          candidate.skills,
          candidate.currentCompany,
          candidate.notes,
        ]
          .filter(Boolean)
          .join("\n");
    const result = await chatJson(
      tagsSchema,
      "Suggest up to 8 short hiring tags (lowercase-kebab or short words) for a candidate.",
      wrapUntrusted("CANDIDATE", truncateText(text, 8000)),
    );
    return { tags: result.tags, disclaimer: aiDisclaimer() };
  },

  async resumeQuality(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const text = await loadResumeText(candidate);
    const result = await chatJson(
      qualitySchema,
      "Score resume quality 0-100. Explain missing projects, GitHub, certifications, formatting, impact metrics. Suggest improvements.",
      wrapUntrusted("RESUME", text),
    );
    return {
      score: clampScore(result.score),
      reasons: result.reasons,
      improvements: result.improvements,
      disclaimer: aiDisclaimer(),
    };
  },

  async match(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const req = candidate.requisition;
    const skillsPart = skillOverlapScore(candidate.skills, req.skills);
    const expPart = experienceScore(
      candidate.totalExperienceYears
        ? Number(candidate.totalExperienceYears)
        : null,
      req.experienceMin ? Number(req.experienceMin) : null,
      req.experienceMax ? Number(req.experienceMax) : null,
    );
    const locPart = locationScore(
      candidate.currentLocation,
      `${req.title}\n${req.description ?? ""}`,
    );

    const llm = await chatJson(
      matchLlmSchema,
      "Adjust match score by 0-30 based on qualitative fit. Provide reasons citing skills/experience. Do not invent employers.",
      `Candidate skills: ${candidate.skills ?? ""}\nExperience years: ${candidate.totalExperienceYears ?? "unknown"}\nLocation: ${candidate.currentLocation ?? ""}\n\nRequisition: ${req.title}\nSkills: ${req.skills ?? ""}\nDescription: ${truncateText(req.description ?? "", 3000)}\nDeterministic: skills=${skillsPart.score}, experience=${expPart}, location=${locPart}`,
    );

    const score = clampScore(
      skillsPart.score + expPart + locPart + llm.adjustment,
    );
    const recommendation = recommendationFromScore(score);

    return {
      score,
      breakdown: {
        skills: skillsPart.score,
        experience: expPart,
        location: locPart,
        llmAdjustment: llm.adjustment,
      },
      reasons: llm.reasons,
      summary: llm.summary,
      recommendation: {
        code: recommendation.code,
        label: recommendation.label,
        rationale: llm.rationale,
      },
      disclaimer: aiDisclaimer(),
    };
  },

  async skillGap(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const gap = skillOverlapScore(
      candidate.skills,
      candidate.requisition.skills,
    );
    return {
      matched: gap.matched,
      missing: gap.missing,
      extra: gap.extra,
      notes:
        gap.missing.length === 0
          ? ["All listed requisition skills appear present."]
          : [`Missing ${gap.missing.length} required skill(s).`],
      disclaimer: aiDisclaimer("Deterministic skill comparison after normalization."),
    };
  },

  async compare(input: CompareCandidatesInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidates = await Promise.all(
      input.candidateIds.map((id) => getScopedCandidate(id, actor)),
    );
    const requisitionId =
      input.requisitionId ?? candidates[0]?.requisitionId;
    if (!requisitionId) {
      throw new BadRequestError("requisitionId is required");
    }
    if (candidates.some((c) => c.requisitionId !== requisitionId)) {
      throw new BadRequestError(
        "All candidates must belong to the same requisition",
      );
    }

    const rows = [];
    for (const candidate of candidates) {
      const match = await this.match(candidate.id, actor);
      const gap = skillOverlapScore(
        candidate.skills,
        candidate.requisition.skills,
      );
      rows.push({
        candidateId: candidate.id,
        fullName: candidate.fullName,
        score: match.score,
        recommendation: match.recommendation.code,
        topSkills: tokenizeSkills(candidate.skills ?? "").slice(0, 6),
        experienceYears: candidate.totalExperienceYears
          ? Number(candidate.totalExperienceYears)
          : null,
        missingSkills: gap.missing.slice(0, 8),
      });
    }

    const narrative = await chatJson(
      compareSchema,
      "Compare candidates briefly for a recruiter. Be fair and cite skills/experience. Suggestion only.",
      JSON.stringify(rows),
    );

    return {
      rows,
      narrative: narrative.narrative,
      disclaimer: aiDisclaimer(),
    };
  },

  async riskAnalysis(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const text = candidate.resumeFilePath
      ? await loadResumeText(candidate)
      : `${candidate.fullName}\n${candidate.skills}\n${candidate.notes ?? ""}`;
    const gap = skillOverlapScore(
      candidate.skills,
      candidate.requisition.skills,
    );
    const result = await chatJson(
      riskSchema,
      "Identify possible hiring risks as suggestions only: long notice, employment gaps, frequent job changes, missing info, skill gaps. Use severity low|medium|high. Do not accuse.",
      `${wrapUntrusted("CANDIDATE", truncateText(text, 8000))}\nNotice period days: ${candidate.noticePeriodDays ?? "unknown"}\nMissing skills: ${gap.missing.join(", ") || "none"}`,
    );
    return {
      risks: result.risks,
      disclaimer: aiDisclaimer(
        "These are AI suggestions only, not verified facts or hiring decisions.",
      ),
    };
  },

  async generateJd(input: GenerateJdInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const result = await chatJson(
      jdSchema,
      "Write a professional job description under 5000 chars and suggestedSkills comma-separated under 2000 chars.",
      JSON.stringify(input),
    );
    return { ...result, disclaimer: aiDisclaimer() };
  },

  async generateJdForRequisition(id: string, actor: Actor) {
    const requisition = await getScopedRequisition(id, actor);
    return this.generateJd(
      {
        title: requisition.title,
        departmentName: requisition.department.name,
        employmentType: requisition.employmentType,
        workMode: requisition.workMode,
        experienceMin: requisition.experienceMin
          ? Number(requisition.experienceMin)
          : undefined,
        experienceMax: requisition.experienceMax
          ? Number(requisition.experienceMax)
          : undefined,
        skills: requisition.skills ?? undefined,
      },
      actor,
    );
  },

  async improveRequisition(id: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const requisition = await getScopedRequisition(id, actor);
    const result = await chatJson(
      improveSchema,
      "Critique an existing JD. Suggest improvements (missing responsibilities, vague wording, missing salary/benefits). Optionally provide revisedDescription or null. Do not invent company policies.",
      JSON.stringify({
        title: requisition.title,
        description: requisition.description,
        skills: requisition.skills,
        salaryMin: requisition.salaryMin,
        salaryMax: requisition.salaryMax,
        employmentType: requisition.employmentType,
        workMode: requisition.workMode,
      }),
    );
    return {
      suggestions: result.suggestions,
      revisedDescription: result.revisedDescription,
      disclaimer: aiDisclaimer(),
    };
  },

  async generateQuestions(input: GenerateQuestionsInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(input.candidateId, actor);
    const result = await chatJson(
      questionsSchema,
      "Generate 8-12 interview questions for the round. Practical and role-specific.",
      JSON.stringify({
        roundType: input.roundType,
        customRoundLabel: input.customRoundLabel,
        candidate: {
          name: candidate.fullName,
          skills: candidate.skills,
          experience: candidate.totalExperienceYears,
        },
        requisition: {
          title: candidate.requisition.title,
          skills: candidate.requisition.skills,
        },
      }),
    );
    return {
      questions: result.questions,
      instructionsText: result.questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      disclaimer: aiDisclaimer(),
    };
  },

  async generateEmail(input: GenerateEmailInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(input.candidateId, actor);
    const result = await chatJson(
      emailSchema,
      "Draft a professional recruiting email. Do not claim the email was sent. Keep body under 5000 chars.",
      JSON.stringify({
        template: input.template,
        candidateName: candidate.fullName,
        role: candidate.requisition.title,
        offerLink: input.offerLink,
        joiningDate: input.joiningDate,
      }),
    );
    return {
      subject: result.subject,
      body: result.body,
      template: input.template,
      disclaimer: aiDisclaimer("Draft only — ROMS does not send email."),
    };
  },

  async draftNote(candidateId: string, input: DraftNoteInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const feedbackBits = candidate.interviews
      .flatMap((interview) => interview.feedbackItems)
      .slice(0, 5)
      .map((item) => item.summary ?? item.recommendation)
      .filter(Boolean);
    const result = await chatJson(
      noteSchema,
      "Draft a short recruiter note. Do not invent facts not present in context.",
      JSON.stringify({
        intent: input.intent,
        hint: input.hint,
        status: candidate.status,
        role: candidate.requisition.title,
        feedbackBits,
      }),
    );
    return {
      content: result.content,
      intent: input.intent,
      disclaimer: aiDisclaimer(),
    };
  },

  async suggestSalary(candidateId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const candidate = await getScopedCandidate(candidateId, actor);
    const req = candidate.requisition;
    const result = await chatJson(
      salarySchema,
      "Suggest a salary range guidance. Prefer requisition salary band. If missing, return null numbers with rationale. Currency INR unless stated.",
      JSON.stringify({
        title: req.title,
        salaryMin: req.salaryMin,
        salaryMax: req.salaryMax,
        experienceYears: candidate.totalExperienceYears,
        skills: candidate.skills,
      }),
    );
    return {
      currency: "INR",
      suggestedMin: result.suggestedMin,
      suggestedMax: result.suggestedMax,
      midpoint: result.midpoint,
      rationale: result.rationale,
      disclaimer: aiDisclaimer(
        "Guidance only — not compensation policy.",
      ),
    };
  },

  async feedbackIntelligence(interviewId: string, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        deletedAt: null,
        ...candidateScope(actor),
      },
      include: {
        feedbackItems: {
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!interview) {
      throw new NotFoundError("Interview not found");
    }

    const payload = interview.feedbackItems.map((item) => ({
      interviewer: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
      rating: item.rating,
      recommendation: item.recommendation,
      strengths: item.strengths,
      concerns: item.concerns,
      summary: item.summary,
    }));

    if (payload.length === 0) {
      return {
        summary: "No interviewer feedback has been submitted yet.",
        consensus: "N/A",
        strengths: [],
        concerns: [],
        interviewerCount: 0,
        disclaimer: aiDisclaimer(
          "Does not replace or modify original feedback.",
        ),
      };
    }

    const result = await chatJson(
      feedbackSchema,
      "Summarize interviewer feedback. Show consensus and key strengths/concerns. Never invent feedback.",
      JSON.stringify(payload),
    );

    return {
      ...result,
      interviewerCount: payload.length,
      disclaimer: aiDisclaimer(
        "Does not replace or modify original feedback.",
      ),
    };
  },

  async hiringInsights(input: InsightsFiltersInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const filters = resolveReportFilters(input);
    const overview = await reportsRepository.overview(actor, filters);
    const funnel = await reportsRepository.funnel(actor, filters);
    const metricsRef = {
      openRequisitions: overview.kpis.openRequisitions,
      activeCandidates: overview.kpis.activeCandidates,
      offerAcceptRate: overview.kpis.offerAcceptRate,
      avgTimeToHireDays: overview.kpis.avgTimeToHireDays,
      interviewsCompleted: overview.recentActivity.interviewsCompleted,
    };
    const result = await chatJson(
      insightsSchema,
      "Produce 4-6 hiring insight bullets from metrics. Be practical. Suggestion only.",
      JSON.stringify({ metricsRef, funnel: funnel.stages, exits: funnel.exits }),
    );
    return {
      bullets: result.bullets,
      metricsRef,
      disclaimer: aiDisclaimer(),
    };
  },

  async departmentInsights(input: InsightsFiltersInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const filters = resolveReportFilters(input);
    const departments = await reportsRepository.departments(actor, filters);
    const metricsRef = Object.fromEntries(
      departments.rows.map((row) => [
        row.departmentName,
        row.openRequisitions + row.candidates,
      ]),
    );
    const result = await chatJson(
      insightsSchema,
      "Produce department hiring insight bullets from the table. Suggestion only.",
      JSON.stringify(departments.rows),
    );
    return {
      bullets: result.bullets,
      metricsRef,
      disclaimer: aiDisclaimer(),
    };
  },

  async missingSkills(input: InsightsFiltersInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const filters = resolveReportFilters(input);
    const reqFilter =
      actor.role === "HR_ADMIN"
        ? { deletedAt: null as null }
        : actor.role === "RECRUITER"
          ? { deletedAt: null as null, createdById: actor.id }
          : { deletedAt: null as null, hiringManagerId: actor.id };

    const requisitions = await prisma.jobRequisition.findMany({
      where: {
        ...reqFilter,
        status: "OPEN",
        ...(filters.departmentId
          ? { departmentId: filters.departmentId }
          : {}),
        ...(filters.requisitionId ? { id: filters.requisitionId } : {}),
      },
      select: {
        title: true,
        skills: true,
        candidates: {
          where: { deletedAt: null },
          select: { skills: true },
        },
      },
    });

    const counts = new Map<string, { count: number; titles: Set<string> }>();
    for (const req of requisitions) {
      const required = normalizeSkillList(req.skills ?? "").normalized;
      const candidateSkills = new Set(
        req.candidates.flatMap((c) =>
          normalizeSkillList(c.skills ?? "").normalized.map((s) =>
            s.toLowerCase(),
          ),
        ),
      );
      for (const skill of required) {
        if (!candidateSkills.has(skill.toLowerCase())) {
          const entry = counts.get(skill) ?? {
            count: 0,
            titles: new Set<string>(),
          };
          entry.count += 1;
          entry.titles.add(req.title);
          counts.set(skill, entry);
        }
      }
    }

    const skills = [...counts.entries()]
      .map(([skill, value]) => ({
        skill,
        count: value.count,
        requisitionTitles: [...value.titles],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    let commentary: string | null = null;
    if (skills.length > 0) {
      const result = await chatJson(
        insightsSchema,
        "One short commentary bullet about top missing skills for recruiters.",
        JSON.stringify(skills.slice(0, 5)),
      );
      commentary = result.bullets[0] ?? null;
    }

    return {
      skills,
      commentary,
      disclaimer: aiDisclaimer("Primarily deterministic skill frequency."),
    };
  },

  async weeklySummary(input: InsightsFiltersInput, actor: Actor) {
    assertCanGenerate(actor);
    guard(actor);
    const filters = resolveReportFilters(input);
    const overview = await reportsRepository.overview(actor, filters);
    const offers = await reportsRepository.offers(actor, filters);
    const metricsRef = {
      openRequisitions: overview.kpis.openRequisitions,
      joined: overview.kpis.employeesJoinedInPeriod,
      offerAcceptRate: overview.kpis.offerAcceptRate,
      interviewsCompleted: overview.recentActivity.interviewsCompleted,
      offersExtended: overview.recentActivity.offersExtended,
      pendingOffers: offers.pipeline.extendedAwaitingResponse,
    };
    const result = await chatJson(
      weeklySchema,
      "Write a weekly hiring management summary: progress, bottlenecks, offer trends, departments needing attention. Suggestion only.",
      JSON.stringify({
        metricsRef,
        topDepartments: overview.topDepartments,
        recentActivity: overview.recentActivity,
      }),
    );
    return {
      title: result.title,
      summary: result.summary,
      bullets: result.bullets,
      metricsRef,
      disclaimer: aiDisclaimer(),
    };
  },
};

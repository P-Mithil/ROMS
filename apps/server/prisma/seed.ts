import { config } from "dotenv";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { DEMO_CANDIDATES } from "./seed-data/candidates.js";
import { DEPARTMENTS } from "./seed-data/departments.js";
import { DEMO_INTERVIEWS } from "./seed-data/interviews.js";
import { DEMO_OFFERS, DEMO_OFFER_RESPONSE_TOKEN } from "./seed-data/offers.js";
import {
  DEFAULT_ONBOARDING_DOCUMENTS,
  DEFAULT_ONBOARDING_TASKS,
  DEMO_ONBOARDING_CASES,
} from "./seed-data/onboarding.js";
import { DEMO_REQUISITIONS } from "./seed-data/requisitions.js";
import { ROLES } from "./seed-data/roles.js";
import { DEMO_PASSWORD, DEMO_USERS } from "./seed-data/users.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main(): Promise<void> {
  console.log("Seeding ROMS database...");

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  for (const department of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: { description: department.description, isActive: true },
      create: department,
    });
  }

  const roles = await prisma.role.findMany();
  const roleByName = new Map(roles.map((r) => [r.name, r]));
  const departments = await prisma.department.findMany();
  const departmentByName = new Map(departments.map((d) => [d.name, d]));
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  for (const user of DEMO_USERS) {
    const role = roleByName.get(user.role);
    if (!role) {
      throw new Error(`Role not found for user: ${user.email}`);
    }

    const department = user.departmentName
      ? departmentByName.get(user.departmentName)
      : null;

    if (user.departmentName && !department) {
      throw new Error(`Department not found for user: ${user.email}`);
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: role.id,
        departmentId: department?.id ?? null,
        passwordHash,
        isActive: true,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: role.id,
        departmentId: department?.id ?? null,
        passwordHash,
        isActive: true,
      },
    });
  }

  const users = await prisma.user.findMany();
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  for (const req of DEMO_REQUISITIONS) {
    const department = departmentByName.get(req.departmentName);
    const hiringManager = userByEmail.get(req.hiringManagerEmail);
    const createdBy = userByEmail.get(req.createdByEmail);

    if (!department || !hiringManager || !createdBy) {
      throw new Error(`Missing seed data for requisition: ${req.title}`);
    }

    const existing = await prisma.jobRequisition.findFirst({
      where: { title: req.title, createdById: createdBy.id },
    });

    const approvedAt = req.status === "OPEN" ? new Date() : null;
    const approvedById = req.status === "OPEN" ? hiringManager.id : null;
    const submittedAt =
      req.status === "PENDING_APPROVAL" || req.status === "OPEN"
        ? new Date()
        : null;
    const closedById = req.status === "CLOSED" ? createdBy.id : null;

    const data = {
      title: req.title,
      description: req.description,
      status: req.status,
      departmentId: department.id,
      hiringManagerId: hiringManager.id,
      createdById: createdBy.id,
      approvedById,
      approvedAt,
      submittedAt,
      rejectedAt: null,
      rejectionReason: req.rejectionReason ?? null,
      closedById,
      closedAt: null,
      closeReason: req.closeReason ?? null,
      deletedAt: null,
    };

    if (existing) {
      await prisma.jobRequisition.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.jobRequisition.create({ data });
    }
  }

  const requisitions = await prisma.jobRequisition.findMany();
  const requisitionByTitle = new Map(requisitions.map((req) => [req.title, req]));

  for (const candidate of DEMO_CANDIDATES) {
    const requisition = requisitionByTitle.get(candidate.requisitionTitle);
    const createdBy = userByEmail.get(candidate.createdByEmail);

    if (!requisition || !createdBy) {
      throw new Error(`Missing seed data for candidate: ${candidate.email}`);
    }

    await prisma.candidate.upsert({
      where: {
        requisitionId_email: {
          requisitionId: requisition.id,
          email: candidate.email.toLowerCase(),
        },
      },
      update: {
        fullName: candidate.fullName,
        phone: candidate.phone,
        totalExperienceYears: candidate.totalExperienceYears
          ? new Prisma.Decimal(candidate.totalExperienceYears)
          : null,
        skills: candidate.skills ?? null,
        currentCompany: candidate.currentCompany ?? null,
        currentLocation: candidate.currentLocation ?? null,
        noticePeriodDays: candidate.noticePeriodDays ?? null,
        status: candidate.status,
        notes: candidate.notes ?? null,
        createdById: createdBy.id,
        updatedById: createdBy.id,
        deletedAt: null,
      },
      create: {
        requisitionId: requisition.id,
        fullName: candidate.fullName,
        email: candidate.email.toLowerCase(),
        phone: candidate.phone,
        totalExperienceYears: candidate.totalExperienceYears
          ? new Prisma.Decimal(candidate.totalExperienceYears)
          : null,
        skills: candidate.skills ?? null,
        currentCompany: candidate.currentCompany ?? null,
        currentLocation: candidate.currentLocation ?? null,
        noticePeriodDays: candidate.noticePeriodDays ?? null,
        status: candidate.status,
        notes: candidate.notes ?? null,
        createdById: createdBy.id,
        updatedById: createdBy.id,
      },
    });
  }

  const candidates = await prisma.candidate.findMany({
    include: { requisition: true },
  });
  const candidateByEmailAndTitle = new Map(
    candidates.map((candidate) => [
      `${candidate.email}:${candidate.requisition.title}`,
      candidate,
    ]),
  );

  function daysFromNow(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  function dateFromNow(days: number) {
    const date = daysFromNow(days);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  for (const interviewSeed of DEMO_INTERVIEWS) {
    const candidate = candidateByEmailAndTitle.get(
      `${interviewSeed.candidateEmail.toLowerCase()}:${interviewSeed.requisitionTitle}`,
    );
    const createdBy = userByEmail.get(interviewSeed.createdByEmail);
    const completedBy = interviewSeed.completedByEmail
      ? userByEmail.get(interviewSeed.completedByEmail)
      : null;

    if (!candidate || !createdBy) {
      throw new Error(
        `Missing seed data for interview: ${interviewSeed.roundType} round ${interviewSeed.sequence}`,
      );
    }

    if (interviewSeed.completedByEmail && !completedBy) {
      throw new Error(
        `Missing completed-by user for interview: ${interviewSeed.roundType} round ${interviewSeed.sequence}`,
      );
    }

    const scheduledAt = daysFromNow(interviewSeed.scheduledDaysFromNow);
    const completedAt =
      interviewSeed.completedDaysFromNow != null
        ? daysFromNow(interviewSeed.completedDaysFromNow)
        : null;

    const existing = await prisma.interview.findFirst({
      where: {
        candidateId: candidate.id,
        roundType: interviewSeed.roundType,
        sequence: interviewSeed.sequence,
        deletedAt: null,
      },
    });

    const interviewData = {
      candidateId: candidate.id,
      requisitionId: candidate.requisitionId,
      roundType: interviewSeed.roundType,
      customRoundLabel: interviewSeed.customRoundLabel ?? null,
      sequence: interviewSeed.sequence,
      status: interviewSeed.status,
      scheduledAt,
      durationMinutes: interviewSeed.durationMinutes,
      mode: interviewSeed.mode,
      location: interviewSeed.location ?? null,
      meetingLink: interviewSeed.meetingLink ?? null,
      instructions: interviewSeed.instructions ?? null,
      completionNotes: interviewSeed.completionNotes ?? null,
      cancellationReason: null,
      feedbackSummary: interviewSeed.feedbackSummary ?? null,
      createdById: createdBy.id,
      updatedById: completedBy?.id ?? createdBy.id,
      completedById: completedBy?.id ?? null,
      completedAt,
      cancelledById: null,
      cancelledAt: null,
      deletedAt: null,
    };

    const interview = existing
      ? await prisma.interview.update({
          where: { id: existing.id },
          data: interviewData,
        })
      : await prisma.interview.create({
          data: interviewData,
        });

    await prisma.interviewInterviewer.deleteMany({
      where: { interviewId: interview.id },
    });

    for (const interviewerEmail of interviewSeed.interviewerEmails) {
      const interviewer = userByEmail.get(interviewerEmail);
      if (!interviewer) {
        throw new Error(
          `Interviewer not found for interview seed: ${interviewerEmail}`,
        );
      }

      await prisma.interviewInterviewer.create({
        data: {
          interviewId: interview.id,
          userId: interviewer.id,
        },
      });
    }

    await prisma.interviewFeedback.deleteMany({
      where: { interviewId: interview.id },
    });

    for (const feedbackSeed of interviewSeed.feedback ?? []) {
      const author = userByEmail.get(feedbackSeed.authorEmail);
      if (!author) {
        throw new Error(
          `Feedback author not found for interview seed: ${feedbackSeed.authorEmail}`,
        );
      }

      await prisma.interviewFeedback.create({
        data: {
          interviewId: interview.id,
          createdById: author.id,
          rating: feedbackSeed.rating ?? null,
          recommendation: feedbackSeed.recommendation ?? null,
          strengths: feedbackSeed.strengths ?? null,
          concerns: feedbackSeed.concerns ?? null,
          summary: feedbackSeed.summary ?? null,
        },
      });
    }
  }

  for (const offerSeed of DEMO_OFFERS) {
    const candidate = candidateByEmailAndTitle.get(
      `${offerSeed.candidateEmail.toLowerCase()}:${offerSeed.requisitionTitle}`,
    );
    const createdBy = userByEmail.get(offerSeed.createdByEmail);
    const approvedBy = offerSeed.approvedByEmail
      ? userByEmail.get(offerSeed.approvedByEmail)
      : null;
    const extendedBy = offerSeed.extendedByEmail
      ? userByEmail.get(offerSeed.extendedByEmail)
      : null;

    if (!candidate || !createdBy) {
      throw new Error(
        `Missing seed data for offer: ${offerSeed.jobTitle} (${offerSeed.status})`,
      );
    }

    if (offerSeed.approvedByEmail && !approvedBy) {
      throw new Error(`Missing approver for offer seed: ${offerSeed.jobTitle}`);
    }

    if (offerSeed.extendedByEmail && !extendedBy) {
      throw new Error(`Missing extender for offer seed: ${offerSeed.jobTitle}`);
    }

    const existing = await prisma.offer.findFirst({
      where: {
        candidateId: candidate.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const offerData = {
      candidateId: candidate.id,
      requisitionId: candidate.requisitionId,
      status: offerSeed.status,
      jobTitle: offerSeed.jobTitle,
      employmentType: offerSeed.employmentType,
      workMode: offerSeed.workMode,
      baseSalary: offerSeed.baseSalary,
      currency: offerSeed.currency ?? "INR",
      joiningDate: dateFromNow(offerSeed.joiningDaysFromNow),
      validUntil: daysFromNow(offerSeed.validUntilDaysFromNow),
      terms: offerSeed.terms ?? null,
      internalNotes: offerSeed.internalNotes ?? null,
      submittedAt:
        offerSeed.submittedDaysFromNow != null
          ? daysFromNow(offerSeed.submittedDaysFromNow)
          : null,
      approvedById: approvedBy?.id ?? null,
      approvedAt:
        offerSeed.approvedDaysFromNow != null
          ? daysFromNow(offerSeed.approvedDaysFromNow)
          : null,
      approvalRejectionReason: offerSeed.approvalRejectionReason ?? null,
      extendedAt:
        offerSeed.extendedDaysFromNow != null
          ? daysFromNow(offerSeed.extendedDaysFromNow)
          : null,
      extendedById: extendedBy?.id ?? null,
      respondedAt:
        offerSeed.respondedDaysFromNow != null
          ? daysFromNow(offerSeed.respondedDaysFromNow)
          : null,
      declineReason: offerSeed.declineReason ?? null,
      responseNotes: offerSeed.responseNotes ?? null,
      createdById: createdBy.id,
      updatedById: extendedBy?.id ?? approvedBy?.id ?? createdBy.id,
      deletedAt: null,
    };

    const offer = existing
      ? await prisma.offer.update({
          where: { id: existing.id },
          data: offerData,
        })
      : await prisma.offer.create({
          data: offerData,
        });

    await prisma.offerResponseToken.deleteMany({
      where: { offerId: offer.id },
    });

    if (offerSeed.responseToken) {
      await prisma.offerResponseToken.create({
        data: {
          offerId: offer.id,
          tokenHash: hashToken(offerSeed.responseToken),
          expiresAt: offer.validUntil,
        },
      });
    }
  }

  const acceptedOffers = await prisma.offer.findMany({
    where: {
      status: "ACCEPTED",
      deletedAt: null,
    },
    include: {
      candidate: {
        include: {
          requisition: true,
        },
      },
    },
  });

  for (const onboardingSeed of DEMO_ONBOARDING_CASES) {
    const offer = acceptedOffers.find(
      (item) =>
        item.candidate.email === onboardingSeed.candidateEmail.toLowerCase() &&
        item.candidate.requisition.title === onboardingSeed.requisitionTitle,
    );

    if (!offer) {
      throw new Error(
        `Missing accepted offer for onboarding seed: ${onboardingSeed.candidateEmail}`,
      );
    }

    const existingCase = await prisma.onboardingCase.findUnique({
      where: { offerId: offer.id },
    });

    if (existingCase) {
      await prisma.onboardingTask.deleteMany({
        where: { onboardingCaseId: existingCase.id },
      });
      await prisma.onboardingDocument.deleteMany({
        where: { onboardingCaseId: existingCase.id },
      });
      if (existingCase.employeeId) {
        await prisma.employee.delete({
          where: { id: existingCase.employeeId },
        });
      }
      await prisma.onboardingCase.delete({
        where: { id: existingCase.id },
      });
    }

    const startedBy = onboardingSeed.startedByEmail
      ? userByEmail.get(onboardingSeed.startedByEmail)
      : null;
    const joinedBy = onboardingSeed.joinedByEmail
      ? userByEmail.get(onboardingSeed.joinedByEmail)
      : null;
    const completedBy = onboardingSeed.completedByEmail
      ? userByEmail.get(onboardingSeed.completedByEmail)
      : null;
    const recruiter = userByEmail.get("recruiter@roms.local");
    const admin = userByEmail.get("admin@roms.local");

    let employeeId: string | null = null;

    if (onboardingSeed.employeeStatus && onboardingSeed.employeeCode) {
      const requisition = await prisma.jobRequisition.findUniqueOrThrow({
        where: { id: offer.requisitionId },
      });

      const employee = await prisma.employee.create({
        data: {
          employeeCode: onboardingSeed.employeeCode,
          fullName: offer.candidate.fullName,
          email: offer.candidate.email,
          phone: offer.candidate.phone,
          workEmail: onboardingSeed.workEmail ?? null,
          jobTitle: offer.jobTitle,
          departmentId: requisition.departmentId,
          employmentType: offer.employmentType,
          workMode: offer.workMode,
          baseSalary: offer.baseSalary,
          currency: offer.currency,
          expectedJoiningDate: offer.joiningDate,
          actualJoiningDate:
            onboardingSeed.actualJoiningDaysFromNow != null
              ? dateFromNow(onboardingSeed.actualJoiningDaysFromNow)
              : null,
          hiringManagerId: requisition.hiringManagerId,
          candidateId: offer.candidateId,
          offerId: offer.id,
          requisitionId: offer.requisitionId,
          status: onboardingSeed.employeeStatus,
          createdById: startedBy?.id ?? offer.createdById,
          updatedById: completedBy?.id ?? joinedBy?.id ?? startedBy?.id ?? offer.createdById,
        },
      });

      employeeId = employee.id;
    }

    const onboardingCase = await prisma.onboardingCase.create({
      data: {
        offerId: offer.id,
        candidateId: offer.candidateId,
        requisitionId: offer.requisitionId,
        employeeId,
        status: onboardingSeed.caseStatus,
        startedAt:
          onboardingSeed.startedDaysFromNow != null
            ? daysFromNow(onboardingSeed.startedDaysFromNow)
            : null,
        joinedAt:
          onboardingSeed.joinedDaysFromNow != null
            ? daysFromNow(onboardingSeed.joinedDaysFromNow)
            : null,
        completedAt:
          onboardingSeed.completedDaysFromNow != null
            ? daysFromNow(onboardingSeed.completedDaysFromNow)
            : null,
        startedById: startedBy?.id ?? null,
        joinedById: joinedBy?.id ?? null,
        completedById: completedBy?.id ?? null,
      },
    });

    for (const taskTemplate of DEFAULT_ONBOARDING_TASKS) {
      const isCompleted = onboardingSeed.completedTaskTitles?.includes(
        taskTemplate.title,
      );
      const skipped = onboardingSeed.skippedTaskTitles?.find(
        (item) => item.title === taskTemplate.title,
      );

      let status: "PENDING" | "COMPLETED" | "SKIPPED" = "PENDING";
      if (isCompleted) {
        status = "COMPLETED";
      }
      if (skipped) {
        status = "SKIPPED";
      }

      await prisma.onboardingTask.create({
        data: {
          onboardingCaseId: onboardingCase.id,
          title: taskTemplate.title,
          description: taskTemplate.description ?? null,
          phase: taskTemplate.phase,
          ownerRole: taskTemplate.ownerRole,
          isRequired: taskTemplate.isRequired ?? true,
          status,
          sortOrder: taskTemplate.sortOrder,
          completedAt: isCompleted ? daysFromNow(-1) : null,
          completedById: isCompleted ? recruiter?.id ?? null : null,
          skipReason: skipped?.reason ?? null,
        },
      });
    }

    for (const documentTemplate of DEFAULT_ONBOARDING_DOCUMENTS) {
      const status =
        onboardingSeed.documentStatuses?.[documentTemplate.documentType] ??
        "PENDING";

      await prisma.onboardingDocument.create({
        data: {
          onboardingCaseId: onboardingCase.id,
          documentType: documentTemplate.documentType,
          isRequired: documentTemplate.isRequired ?? true,
          status,
          verifiedAt:
            status === "VERIFIED" || status === "WAIVED"
              ? daysFromNow(-1)
              : null,
          verifiedById:
            status === "VERIFIED" || status === "WAIVED"
              ? admin?.id ?? null
              : null,
          waiveReason:
            status === "WAIVED"
              ? "Verified offline during onboarding completion."
              : null,
        },
      });
    }
  }

  console.log("Seed complete:");
  console.log(`  Roles: ${await prisma.role.count()}`);
  console.log(`  Departments: ${await prisma.department.count()}`);
  console.log(`  Users: ${await prisma.user.count()}`);
  console.log(`  Requisitions: ${await prisma.jobRequisition.count()}`);
  console.log(`  Candidates: ${await prisma.candidate.count()}`);
  console.log(`  Interviews: ${await prisma.interview.count()}`);
  console.log(`  Interview feedback: ${await prisma.interviewFeedback.count()}`);
  console.log(`  Offers: ${await prisma.offer.count()}`);
  console.log(`  Offer response tokens: ${await prisma.offerResponseToken.count()}`);
  console.log(`  Onboarding cases: ${await prisma.onboardingCase.count()}`);
  console.log(`  Onboarding tasks: ${await prisma.onboardingTask.count()}`);
  console.log(`  Onboarding documents: ${await prisma.onboardingDocument.count()}`);
  console.log(`  Employees: ${await prisma.employee.count()}`);
  console.log(`  Demo password: ${DEMO_PASSWORD}`);
  console.log(`  Demo offer response token: ${DEMO_OFFER_RESPONSE_TOKEN}`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

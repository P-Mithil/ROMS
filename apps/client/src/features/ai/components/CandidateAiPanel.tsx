import { useState } from "react";
import type {
  AiExtractedCandidateFields,
  AiMatchResult,
  AiNormalizeSkillsResult,
  AiResumeQualityResult,
  AiResumeSummaryResult,
  AiRiskAnalysisResult,
  AiSkillGapResult,
  AiSuggestTagsResult,
  AiEmailTemplate,
  AiNoteIntent,
} from "@roms/shared";
import { AI_EMAIL_TEMPLATES, AI_NOTE_INTENTS } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import {
  analyzeCandidateRisk,
  draftCandidateNote,
  generateEmailDraft,
  getSkillGap,
  matchCandidate,
  normalizeSkills,
  parseCandidateResume,
  scoreResumeQuality,
  suggestCandidateTags,
  suggestSalary,
  summarizeCandidateResume,
} from "../api/ai-api.js";
import { copyText, formatAiError } from "../utils/ai-helpers.js";
import { AiButton } from "./AiButton.js";
import { AiPanel } from "./AiPanel.js";

export type CandidateAiApplyFields = {
  fullName?: string;
  email?: string;
  phone?: string;
  totalExperienceYears?: number | null;
  skills?: string;
  currentCompany?: string;
  currentLocation?: string;
  noticePeriodDays?: number | null;
};

type CandidateAiPanelProps = {
  candidateId: string;
  hasResume: boolean;
  currentSkills: string;
  onApplyFields: (fields: CandidateAiApplyFields) => void;
  onApplySkills: (skills: string) => void;
  onAppendNotes: (text: string) => void;
  onApplyNote: (content: string) => void;
};

export function CandidateAiPanel({
  candidateId,
  hasResume,
  currentSkills,
  onApplyFields,
  onApplySkills,
  onAppendNotes,
  onApplyNote,
}: CandidateAiPanelProps) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsePreview, setParsePreview] =
    useState<AiExtractedCandidateFields | null>(null);
  const [normalizePreview, setNormalizePreview] =
    useState<AiNormalizeSkillsResult | null>(null);
  const [summary, setSummary] = useState<AiResumeSummaryResult | null>(null);
  const [quality, setQuality] = useState<AiResumeQualityResult | null>(null);
  const [match, setMatch] = useState<AiMatchResult | null>(null);
  const [gap, setGap] = useState<AiSkillGapResult | null>(null);
  const [risk, setRisk] = useState<AiRiskAnalysisResult | null>(null);
  const [tags, setTags] = useState<AiSuggestTagsResult | null>(null);
  const [emailTemplate, setEmailTemplate] =
    useState<AiEmailTemplate>("INTERVIEW_INVITE");
  const [emailDraft, setEmailDraft] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [noteIntent, setNoteIntent] = useState<AiNoteIntent>("GENERAL");
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [salaryText, setSalaryText] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (err) {
      const message = formatAiError(err);
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="ai-sidebar">
      <AiPanel title="Resume intelligence" error={error}>
        <div className="button-row">
          <AiButton
            label="Parse resume"
            loading={busy === "parse"}
            disabled={!hasResume}
            onClick={() =>
              void run("parse", async () => {
                const result = await parseCandidateResume(candidateId);
                setParsePreview(result.extracted);
              })
            }
          />
          <AiButton
            label="Summary"
            loading={busy === "summary"}
            disabled={!hasResume}
            onClick={() =>
              void run("summary", async () => {
                setSummary(await summarizeCandidateResume(candidateId));
              })
            }
          />
          <AiButton
            label="Quality score"
            loading={busy === "quality"}
            disabled={!hasResume}
            onClick={() =>
              void run("quality", async () => {
                setQuality(await scoreResumeQuality(candidateId));
              })
            }
          />
          <AiButton
            label="Normalize skills"
            loading={busy === "normalize"}
            disabled={!currentSkills.trim()}
            onClick={() =>
              void run("normalize", async () => {
                setNormalizePreview(await normalizeSkills(currentSkills));
              })
            }
          />
          <AiButton
            label="Suggest tags"
            loading={busy === "tags"}
            onClick={() =>
              void run("tags", async () => {
                setTags(await suggestCandidateTags(candidateId));
              })
            }
          />
        </div>

        {parsePreview ? (
          <div className="ai-result">
            <h3>AI prefill preview</h3>
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{parsePreview.fullName ?? "—"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{parsePreview.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{parsePreview.phone ?? "—"}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{parsePreview.totalExperienceYears ?? "—"}</dd>
              </div>
              <div>
                <dt>Skills</dt>
                <dd>{parsePreview.skills ?? "—"}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{parsePreview.currentCompany ?? "—"}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{parsePreview.currentLocation ?? "—"}</dd>
              </div>
              <div>
                <dt>Notice</dt>
                <dd>{parsePreview.noticePeriodDays ?? "—"}</dd>
              </div>
            </dl>
            <div className="button-row">
              <AiButton
                label="Apply to edit form"
                onClick={() => {
                  onApplyFields({
                    fullName: parsePreview.fullName ?? undefined,
                    email: parsePreview.email ?? undefined,
                    phone: parsePreview.phone ?? undefined,
                    totalExperienceYears: parsePreview.totalExperienceYears,
                    skills: parsePreview.skills ?? undefined,
                    currentCompany: parsePreview.currentCompany ?? undefined,
                    currentLocation: parsePreview.currentLocation ?? undefined,
                    noticePeriodDays: parsePreview.noticePeriodDays,
                  });
                  showToast(
                    "AI fields staged for edit — review and save to persist.",
                  );
                }}
              />
              <AiButton
                label="Copy"
                variant="ghost"
                onClick={() =>
                  void copyText(JSON.stringify(parsePreview, null, 2)).then(
                    () => showToast("Parsed fields copied."),
                  )
                }
              />
            </div>
          </div>
        ) : null}

        {normalizePreview ? (
          <div className="ai-result">
            <h3>Normalized skills</h3>
            <div className="skills-picker__selected">
              {normalizePreview.normalized.map((skill) => (
                <span key={skill} className="badge badge--skill">
                  {skill}
                </span>
              ))}
            </div>
            {normalizePreview.unknown.length > 0 ? (
              <p className="meta-text">
                Unknown: {normalizePreview.unknown.join(", ")}
              </p>
            ) : null}
            <div className="button-row">
              <AiButton
                label="Apply skills"
                onClick={() => {
                  onApplySkills(normalizePreview.normalized.join(", "));
                  showToast(
                    "Normalized skills staged — review and save to persist.",
                  );
                }}
              />
              <AiButton
                label="Copy"
                variant="ghost"
                onClick={() =>
                  void copyText(normalizePreview.normalized.join(", ")).then(
                    () => showToast("Skills copied."),
                  )
                }
              />
            </div>
          </div>
        ) : null}

        {summary ? (
          <div className="ai-result">
            <h3>Resume summary</h3>
            <p>{summary.summary}</p>
            <div className="button-row">
              <AiButton
                label="Copy"
                variant="ghost"
                onClick={() =>
                  void copyText(summary.summary).then(() =>
                    showToast("Summary copied."),
                  )
                }
              />
              <AiButton
                label="Append to notes"
                onClick={() => {
                  onAppendNotes(`\n\n[AI Summary]\n${summary.summary}`);
                  showToast("Appended to notes draft — save to persist.");
                }}
              />
            </div>
          </div>
        ) : null}

        {quality ? (
          <div className="ai-result">
            <h3>Quality score: {quality.score}/100</h3>
            <ul>
              {quality.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <h4>Improvements</h4>
            <ul>
              {quality.improvements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {tags ? (
          <div className="ai-result">
            <h3>Suggested tags</h3>
            <div className="skills-picker__selected">
              {tags.tags.map((tag) => (
                <span key={tag} className="badge badge--skill">
                  {tag}
                </span>
              ))}
            </div>
            <AiButton
              label="Append tags to notes"
              onClick={() => {
                onAppendNotes(`\nTags: ${tags.tags.join(", ")}`);
                showToast("Tags appended to notes draft — save to persist.");
              }}
            />
          </div>
        ) : null}
      </AiPanel>

      <AiPanel title="Candidate intelligence">
        <div className="button-row">
          <AiButton
            label="Match score"
            loading={busy === "match"}
            onClick={() =>
              void run("match", async () => {
                setMatch(await matchCandidate(candidateId));
              })
            }
          />
          <AiButton
            label="Skill gap"
            loading={busy === "gap"}
            onClick={() =>
              void run("gap", async () => {
                setGap(await getSkillGap(candidateId));
              })
            }
          />
          <AiButton
            label="Risk analysis"
            loading={busy === "risk"}
            onClick={() =>
              void run("risk", async () => {
                setRisk(await analyzeCandidateRisk(candidateId));
              })
            }
          />
        </div>

        {match ? (
          <div className="ai-result">
            <div className="ai-score-row">
              <strong className="ai-score">{match.score}</strong>
              <span className="badge badge--skill">
                {match.recommendation.label}
              </span>
            </div>
            <p>{match.summary}</p>
            <p className="meta-text">{match.recommendation.rationale}</p>
            <ul>
              {match.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="meta-text">
              Skills {match.breakdown.skills} · Experience{" "}
              {match.breakdown.experience} · Location {match.breakdown.location}{" "}
              · AI {match.breakdown.llmAdjustment}
            </p>
          </div>
        ) : null}

        {gap ? (
          <div className="ai-result">
            <h3>Skill gap</h3>
            <p>
              <strong>Matched:</strong> {gap.matched.join(", ") || "—"}
            </p>
            <p>
              <strong>Missing:</strong> {gap.missing.join(", ") || "—"}
            </p>
            <p>
              <strong>Extra:</strong> {gap.extra.join(", ") || "—"}
            </p>
          </div>
        ) : null}

        {risk ? (
          <div className="ai-result">
            <h3>Risk analysis (AI suggestions only)</h3>
            <ul>
              {risk.risks.map((item) => (
                <li key={`${item.code}-${item.label}`}>
                  <strong>
                    [{item.severity}] {item.label}
                  </strong>
                  : {item.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </AiPanel>

      <AiPanel title="Recruiter productivity">
        <div className="form-field">
          <span className="form-field__label">Email template</span>
          <select
            className="form-field__input"
            value={emailTemplate}
            onChange={(event) =>
              setEmailTemplate(event.target.value as AiEmailTemplate)
            }
          >
            {AI_EMAIL_TEMPLATES.map((template) => (
              <option key={template} value={template}>
                {template.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="button-row">
          <AiButton
            label="Draft email"
            loading={busy === "email"}
            onClick={() =>
              void run("email", async () => {
                const result = await generateEmailDraft({
                  template: emailTemplate,
                  candidateId,
                });
                setEmailDraft({ subject: result.subject, body: result.body });
              })
            }
          />
          <AiButton
            label="Suggest salary"
            loading={busy === "salary"}
            onClick={() =>
              void run("salary", async () => {
                const result = await suggestSalary(candidateId);
                setSalaryText(
                  [
                    `Currency: ${result.currency}`,
                    `Min: ${result.suggestedMin ?? "—"}`,
                    `Max: ${result.suggestedMax ?? "—"}`,
                    `Mid: ${result.midpoint ?? "—"}`,
                    ...result.rationale,
                  ].join("\n"),
                );
              })
            }
          />
        </div>

        {emailDraft ? (
          <div className="ai-result">
            <h3>{emailDraft.subject}</h3>
            <pre className="ai-pre">{emailDraft.body}</pre>
            <AiButton
              label="Copy email"
              onClick={() =>
                void copyText(
                  `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`,
                ).then(() => showToast("Email draft copied."))
              }
            />
          </div>
        ) : null}

        {salaryText ? (
          <div className="ai-result">
            <h3>Salary guidance</h3>
            <pre className="ai-pre">{salaryText}</pre>
            <AiButton
              label="Copy"
              onClick={() =>
                void copyText(salaryText).then(() =>
                  showToast("Salary guidance copied."),
                )
              }
            />
          </div>
        ) : null}

        <div className="form-field">
          <span className="form-field__label">Note intent</span>
          <select
            className="form-field__input"
            value={noteIntent}
            onChange={(event) =>
              setNoteIntent(event.target.value as AiNoteIntent)
            }
          >
            {AI_NOTE_INTENTS.map((intent) => (
              <option key={intent} value={intent}>
                {intent.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <AiButton
          label="Draft recruiter note"
          loading={busy === "note"}
          onClick={() =>
            void run("note", async () => {
              const result = await draftCandidateNote(candidateId, {
                intent: noteIntent,
              });
              setNoteDraft(result.content);
            })
          }
        />
        {noteDraft ? (
          <div className="ai-result">
            <p>{noteDraft}</p>
            <div className="button-row">
              <AiButton
                label="Copy"
                variant="ghost"
                onClick={() =>
                  void copyText(noteDraft).then(() =>
                    showToast("Note copied."),
                  )
                }
              />
              <AiButton
                label="Apply to note form"
                onClick={() => {
                  onApplyNote(noteDraft);
                  showToast("Applied to note form — submit to save.");
                }}
              />
            </div>
          </div>
        ) : null}
      </AiPanel>
    </div>
  );
}

import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { CandidateDto, InterviewDto, OfferDto, OnboardingCaseDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { parseSkills } from "../../../lib/skills.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { CandidateAiPanel } from "../../ai/components/CandidateAiPanel.js";
import type { CandidateAiApplyFields } from "../../ai/components/CandidateAiPanel.js";
import { canUseAi } from "../../ai/utils/permissions.js";
import {
  addCandidateNote,
  deleteCandidateResume,
  downloadCandidateResume,
  getCandidate,
  uploadCandidateResume,
} from "../api/candidates-api.js";
import { CandidateActions } from "../components/CandidateActions.js";
import { StatusBadge } from "../components/StatusBadge.js";
import {
  canCreateCandidate,
  canDownloadResume,
} from "../utils/permissions.js";
import { listInterviews } from "../../interviews/api/interviews-api.js";
import { StatusBadge as InterviewStatusBadge } from "../../interviews/components/StatusBadge.js";
import { FeedbackProgressBadge } from "../../interviews/components/FeedbackProgressBadge.js";
import { formatInterviewRoundLabel } from "../../interviews/utils/interview-labels.js";
import {
  INTERVIEW_RECOMMENDATION_LABELS,
  type InterviewRecommendation,
} from "@roms/shared";
import { canScheduleForCandidate } from "../../interviews/utils/permissions.js";
import { listOffers } from "../../offers/api/offers-api.js";
import { StatusBadge as OfferStatusBadge } from "../../offers/components/StatusBadge.js";
import {
  canCreateOfferForCandidate,
  canAccessOffers,
} from "../../offers/utils/permissions.js";
import {
  formatCurrency,
  formatOfferDate,
} from "../../offers/utils/offer-labels.js";
import { listOnboardingCases } from "../../onboarding/api/onboarding-api.js";
import { StatusBadge as OnboardingStatusBadge } from "../../onboarding/components/StatusBadge.js";
import { canAccessOnboarding } from "../../onboarding/utils/permissions.js";
import {
  calcOverallProgress,
  formatDate,
} from "../../onboarding/utils/onboarding-labels.js";

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

function formatFeedbackSnippet(interview: InterviewDto) {
  if (interview.feedbackSummary) {
    return interview.feedbackSummary;
  }

  const primary = interview.feedbackItems[0];
  if (!primary) {
    return null;
  }

  if (
    primary.recommendation &&
    primary.recommendation in INTERVIEW_RECOMMENDATION_LABELS
  ) {
    return INTERVIEW_RECOMMENDATION_LABELS[
      primary.recommendation as InterviewRecommendation
    ];
  }

  return primary.summary;
}

type TimelineStep = {
  key: string;
  date: string;
  title: string;
  detail?: string;
  tone: "neutral" | "pending" | "success" | "danger" | "muted";
};

function buildTimeline(candidate: CandidateDto) {
  const steps: Array<TimelineStep | null> = [
    {
      key: "created",
      date: candidate.createdAt,
      title: `Candidate created by ${formatUserName(candidate.createdBy)}`,
      tone: "neutral",
    },
    candidate.resume?.uploadedAt
      ? {
          key: "resume-uploaded",
          date: candidate.resume.uploadedAt,
          title: candidate.resume.uploadedBy
            ? `Resume uploaded by ${formatUserName(candidate.resume.uploadedBy)}`
            : "Resume uploaded",
          detail: candidate.resume.fileName,
          tone: "pending",
        }
      : null,
    candidate.rejectedAt
      ? {
          key: "rejected",
          date: candidate.rejectedAt,
          title: candidate.rejectedBy
            ? `Rejected by ${formatUserName(candidate.rejectedBy)}`
            : "Rejected",
          detail: [candidate.rejectionReason, candidate.rejectionComments]
            .filter(Boolean)
            .join(" - "),
          tone: "danger",
        }
      : null,
  ];

  return steps.filter((step): step is TimelineStep => step !== null);
}

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const candidateId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<CandidateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [noteValue, setNoteValue] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [interviews, setInterviews] = useState<InterviewDto[]>([]);
  const [interviewsLoading, setInterviewsLoading] = useState(true);
  const [offers, setOffers] = useState<OfferDto[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [onboardingCases, setOnboardingCases] = useState<OnboardingCaseDto[]>(
    [],
  );
  const [onboardingLoading, setOnboardingLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    const reqId = candidateId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getCandidate(reqId);
        if (!cancelled) {
          setCandidate(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load candidate";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    const currentCandidateId = candidateId;
    let cancelled = false;

    async function loadInterviews() {
      setInterviewsLoading(true);
      try {
        const result = await listInterviews({
          page: 1,
          limit: 10,
          candidateId: currentCandidateId,
        });
        if (!cancelled) {
          setInterviews(result.items);
        }
      } catch {
        if (!cancelled) {
          setInterviews([]);
        }
      } finally {
        if (!cancelled) {
          setInterviewsLoading(false);
        }
      }
    }

    void loadInterviews();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    const currentCandidateId = candidateId;
    let cancelled = false;

    async function loadOffers() {
      setOffersLoading(true);
      try {
        const result = await listOffers({
          page: 1,
          limit: 10,
          candidateId: currentCandidateId,
        });
        if (!cancelled) {
          setOffers(result.items);
        }
      } catch {
        if (!cancelled) {
          setOffers([]);
        }
      } finally {
        if (!cancelled) {
          setOffersLoading(false);
        }
      }
    }

    void loadOffers();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    const currentCandidateId = candidateId;
    let cancelled = false;

    async function loadOnboarding() {
      setOnboardingLoading(true);
      try {
        const result = await listOnboardingCases({
          page: 1,
          limit: 10,
          candidateId: currentCandidateId,
        });
        if (!cancelled) {
          setOnboardingCases(result.items);
        }
      } catch {
        if (!cancelled) {
          setOnboardingCases([]);
        }
      } finally {
        if (!cancelled) {
          setOnboardingLoading(false);
        }
      }
    }

    void loadOnboarding();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (!candidateId) {
    return <p className="form-error">Invalid candidate id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading candidate workspace…</span>
      </div>
    );
  }

  if (error || !candidate) {
    return <p className="form-error">{error ?? "Candidate not found."}</p>;
  }

  const currentCandidate = candidate;
  const canManageResume = user ? canCreateCandidate(user) : false;
  const canDownload = user ? canDownloadResume(user) : false;
  const canScheduleInterview = user
    ? canScheduleForCandidate(user, currentCandidate)
    : false;
  const canCreateOffer = user
    ? canCreateOfferForCandidate(user, currentCandidate)
    : false;
  const canViewOffers = user ? canAccessOffers(user) : false;
  const canViewOnboarding = user ? canAccessOnboarding(user) : false;
  const showAi = canUseAi(user);
  const skills = parseSkills(currentCandidate.skills);

  function stageAiPrefill(fields: CandidateAiApplyFields, skillsOnly = false) {
    navigate(`/candidates/${currentCandidate.id}/edit`, {
      state: {
        aiPrefill: fields,
        aiSkillsOnly: skillsOnly,
      },
    });
  }
  const timeline = buildTimeline(currentCandidate);
  const feedbackInterviews = interviews.filter(
    (interview) =>
      interview.status === "COMPLETED" ||
      interview.status === "NO_SHOW" ||
      interview.feedbackItems.length > 0 ||
      interview.feedbackSummary,
  );

  async function handleDownloadResume() {
    if (!currentCandidate.resume) {
      return;
    }

    setResumeError(null);
    setResumeBusy(true);
    try {
      await downloadCandidateResume(
        currentCandidate.id,
        currentCandidate.resume.fileName,
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Download failed";
      setResumeError(message);
    } finally {
      setResumeBusy(false);
    }
  }

  async function handleUploadResume(file: File) {
    setResumeError(null);
    setResumeBusy(true);
    try {
      const updated = await uploadCandidateResume(currentCandidate.id, file);
      setCandidate(updated);
      setNotice(
        currentCandidate.resume
          ? "Resume replaced successfully."
          : "Resume uploaded successfully.",
      );
      showToast(
        currentCandidate.resume
          ? "Resume replaced successfully."
          : "Resume uploaded successfully.",
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Upload failed";
      setResumeError(message);
      showToast(message, "error");
    } finally {
      setResumeBusy(false);
    }
  }

  async function handleDeleteResume() {
    if (!window.confirm("Remove this candidate's resume?")) {
      return;
    }

    setResumeError(null);
    setResumeBusy(true);
    try {
      await deleteCandidateResume(currentCandidate.id);
      const refreshed = await getCandidate(currentCandidate.id);
      setCandidate(refreshed);
      setNotice("Resume removed.");
      showToast("Resume removed.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Delete failed";
      setResumeError(message);
      showToast(message, "error");
    } finally {
      setResumeBusy(false);
    }
  }

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteValue.trim()) {
      return;
    }

    setNoteBusy(true);
    setError(null);
    try {
      const updated = await addCandidateNote(currentCandidate.id, {
        content: noteValue.trim(),
      });
      setCandidate(updated);
      setNoteValue("");
      setNotice("Recruiter note added.");
      showToast("Recruiter note added.");
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Unable to add note";
      setError(message);
      showToast(message, "error");
    } finally {
      setNoteBusy(false);
    }
  }

  return (
    <div className="candidates-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/candidates">Candidates</Link>
          </p>
          <h1>{candidate.fullName}</h1>
          <div className="page-badges">
            <StatusBadge status={candidate.status} />
            {!candidate.resume ? (
              <span className="badge badge--warning">Resume missing</span>
            ) : null}
          </div>
        </div>
        <div className="page-header__actions">
          {canCreateOffer ? (
            <Link
              className="btn btn--primary"
              to={`/offers/new?candidateId=${currentCandidate.id}`}
            >
              Create offer
            </Link>
          ) : null}
          {canViewOffers ? (
            <Link
              className="btn btn--secondary"
              to={`/offers?candidateId=${currentCandidate.id}`}
            >
              View offers
            </Link>
          ) : null}
          {canViewOnboarding && onboardingCases.length > 0 ? (
            <Link
              className="btn btn--secondary"
              to={`/onboarding?candidateId=${currentCandidate.id}`}
            >
              View onboarding
            </Link>
          ) : null}
          {canScheduleInterview ? (
            <Link
              className="btn btn--primary"
              to={`/interviews/new?candidateId=${currentCandidate.id}`}
            >
              Schedule interview
            </Link>
          ) : null}
          <Link
            className="btn btn--secondary"
            to={`/interviews?candidateId=${currentCandidate.id}`}
          >
            View interviews
          </Link>
        </div>
      </div>

      {notice ? <div className="page-notice">{notice}</div> : null}

      <div className="detail-grid">
        <div className="detail-column">
          <div className="card">
            <h2>Personal Information</h2>
            <dl className="detail-list">
              <div>
                <dt>Requisition</dt>
                <dd>
                  <Link to={`/requisitions/${candidate.requisition.id}`}>
                    {candidate.requisition.title}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{candidate.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{candidate.phone}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{candidate.currentLocation ?? "—"}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(candidate.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(candidate.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2>Professional Information</h2>
            <dl className="detail-list">
              <div>
                <dt>Experience</dt>
                <dd>
                  {candidate.totalExperienceYears
                    ? `${candidate.totalExperienceYears} years`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Current company</dt>
                <dd>{candidate.currentCompany ?? "—"}</dd>
              </div>
              <div>
                <dt>Notice period</dt>
                <dd>
                  {candidate.noticePeriodDays != null
                    ? `${candidate.noticePeriodDays} days`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{formatUserName(candidate.createdBy)}</dd>
              </div>
            </dl>

            {skills.length > 0 ? (
              <div className="skills-picker__selected">
                {skills.map((skill) => (
                  <span key={skill} className="badge badge--skill">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="meta-text">No skills captured for this candidate yet.</p>
            )}

            {candidate.notes ? (
              <>
                <h3>Profile notes</h3>
                <p className="description-text">{candidate.notes}</p>
              </>
            ) : null}
          </div>

          <div className="card">
            <h2>Resume</h2>
            {candidate.resume ? (
              <dl className="detail-list">
                <div>
                  <dt>Filename</dt>
                  <dd>{candidate.resume.fileName}</dd>
                </div>
                <div>
                  <dt>Uploaded</dt>
                  <dd>
                    {candidate.resume.uploadedAt
                      ? new Date(candidate.resume.uploadedAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Uploaded by</dt>
                  <dd>
                    {candidate.resume.uploadedBy
                      ? formatUserName(candidate.resume.uploadedBy)
                      : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="meta-text meta-text--danger">
                Resume is missing for this candidate.
              </p>
            )}

            <div className="button-row">
              {canDownload && candidate.resume ? (
                <button
                  className="btn btn--secondary"
                  type="button"
                  disabled={resumeBusy}
                  onClick={() => void handleDownloadResume()}
                >
                  Download resume
                </button>
              ) : null}

              {canManageResume ? (
                <label className="btn btn--secondary">
                  {candidate.resume ? "Replace resume" : "Upload resume"}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={resumeBusy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleUploadResume(file);
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
              ) : null}

              {canManageResume && candidate.resume ? (
                <button
                  className="btn btn--danger"
                  type="button"
                  disabled={resumeBusy}
                  onClick={() => void handleDeleteResume()}
                >
                  Remove resume
                </button>
              ) : null}
            </div>

            {resumeError ? <p className="form-error">{resumeError}</p> : null}
          </div>

          <div className="card">
            <h2>Notes</h2>
            {canManageResume ? (
              <form className="stack-sm" onSubmit={handleAddNote}>
                <label className="form-field">
                  <span className="form-field__label">Add recruiter note</span>
                  <textarea
                    className="form-field__textarea"
                    value={noteValue}
                    onChange={(event) => setNoteValue(event.target.value)}
                    rows={3}
                    maxLength={2000}
                  />
                </label>
                <div className="form-actions form-actions--left">
                  <button className="btn btn--primary" type="submit" disabled={noteBusy}>
                    {noteBusy ? "Saving…" : "Add note"}
                  </button>
                </div>
              </form>
            ) : null}

            {candidate.recruiterNotes.length > 0 ? (
              <div className="notes-list">
                {candidate.recruiterNotes.map((note) => (
                  <article key={note.id} className="notes-list__item">
                    <p>{note.content}</p>
                    <p className="meta-text">
                      {formatUserName(note.createdBy)} on{" "}
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="meta-text">No recruiter notes yet.</p>
            )}
          </div>

          <div className="card">
            <div className="card__header-row">
              <h2>Offers</h2>
              {canViewOffers ? (
                <Link
                  className="btn btn--ghost"
                  to={`/offers?candidateId=${currentCandidate.id}`}
                >
                  View all
                </Link>
              ) : null}
            </div>

            {offersLoading ? (
              <span className="badge badge--loading">Loading offers…</span>
            ) : offers.length > 0 ? (
              <ul className="plain-list interviews-preview-list">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <Link to={`/offers/${offer.id}`}>{offer.jobTitle}</Link>
                    <span className="meta-text">
                      {" "}
                      · {formatCurrency(offer.baseSalary, offer.currency)} ·{" "}
                      {formatOfferDate(offer.joiningDate)}
                    </span>
                    <OfferStatusBadge status={offer.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta-text">No offers created yet.</p>
            )}
          </div>

          {canViewOnboarding ? (
            <div className="card">
              <div className="card__header-row">
                <h2>Onboarding</h2>
                {onboardingCases.length > 0 ? (
                  <Link
                    className="btn btn--ghost"
                    to={`/onboarding?candidateId=${currentCandidate.id}`}
                  >
                    View all
                  </Link>
                ) : null}
              </div>

              {onboardingLoading ? (
                <span className="badge badge--loading">Loading onboarding…</span>
              ) : onboardingCases.length > 0 ? (
                <ul className="plain-list interviews-preview-list">
                  {onboardingCases.map((onboardingCase) => (
                    <li key={onboardingCase.id}>
                      <Link to={`/onboarding/${onboardingCase.id}`}>
                        {onboardingCase.offer.jobTitle}
                      </Link>
                      <span className="meta-text">
                        {" "}
                        · Joining {formatDate(onboardingCase.offer.joiningDate)} ·{" "}
                        {calcOverallProgress(onboardingCase.progress)}%
                      </span>
                      <OnboardingStatusBadge status={onboardingCase.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="meta-text">
                  Onboarding cases appear here after an offer is accepted.
                </p>
              )}
            </div>
          ) : null}

          <div className="card">
            <div className="card__header-row">
              <h2>Interviews</h2>
              <Link
                className="btn btn--ghost"
                to={`/interviews?candidateId=${currentCandidate.id}`}
              >
                View all
              </Link>
            </div>

            {interviewsLoading ? (
              <span className="badge badge--loading">Loading interviews…</span>
            ) : interviews.length > 0 ? (
              <ul className="plain-list interviews-preview-list">
                {interviews.map((interview) => (
                  <li key={interview.id}>
                    <Link to={`/interviews/${interview.id}`}>
                      {formatInterviewRoundLabel(
                        interview.roundType,
                        interview.sequence,
                        interview.customRoundLabel,
                      )}
                    </Link>
                    <span className="meta-text">
                      {" "}
                      · {new Date(interview.scheduledAt).toLocaleString()}
                    </span>
                    <InterviewStatusBadge status={interview.status} />
                    <FeedbackProgressBadge interview={interview} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta-text">No interviews scheduled yet.</p>
            )}
          </div>

          <div className="card">
            <h2>Interview feedback</h2>
            {interviewsLoading ? (
              <span className="badge badge--loading">Loading feedback…</span>
            ) : feedbackInterviews.length > 0 ? (
              <ul className="plain-list interviews-preview-list">
                {feedbackInterviews.map((interview) => {
                  const snippet = formatFeedbackSnippet(interview);
                  return (
                    <li key={interview.id}>
                      <Link to={`/interviews/${interview.id}#interview-feedback`}>
                        {formatInterviewRoundLabel(
                          interview.roundType,
                          interview.sequence,
                          interview.customRoundLabel,
                        )}
                      </Link>
                      <FeedbackProgressBadge interview={interview} />
                      {snippet ? (
                        <p className="meta-text feedback-snippet">{snippet}</p>
                      ) : (
                        <p className="meta-text">No feedback captured yet.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="meta-text">
                Feedback will appear here after interviews are completed.
              </p>
            )}
          </div>

          <div className="card">
            <h2>Timeline</h2>
            <ol className="timeline">
              {timeline.map((step) => (
                <li key={step.key} className={`timeline__item timeline__item--${step.tone}`}>
                  <p className="timeline__date">
                    {new Date(step.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="timeline__title">{step.title}</p>
                  {step.detail ? <p className="timeline__detail">{step.detail}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="detail-column">
          <CandidateActions
            candidate={candidate}
            onUpdated={setCandidate}
            onDeleted={() => navigate("/candidates")}
            onSuccess={setNotice}
          />
          {showAi ? (
            <CandidateAiPanel
              candidateId={currentCandidate.id}
              hasResume={Boolean(currentCandidate.resume)}
              currentSkills={currentCandidate.skills ?? ""}
              onApplyFields={(fields) => stageAiPrefill(fields)}
              onApplySkills={(skillsText) =>
                stageAiPrefill({ skills: skillsText }, true)
              }
              onAppendNotes={(text) =>
                setNoteValue((current) => `${current}${text}`.trimStart())
              }
              onApplyNote={(content) => setNoteValue(content)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

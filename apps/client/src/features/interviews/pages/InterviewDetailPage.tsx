import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { InterviewDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { getInterview } from "../api/interviews-api.js";
import { InterviewActions } from "../components/InterviewActions.js";
import { FeedbackProgressBadge } from "../components/FeedbackProgressBadge.js";
import { InterviewFeedbackSection } from "../components/InterviewFeedbackSection.js";
import { StatusBadge } from "../components/StatusBadge.js";
import {
  formatInterviewMode,
  formatInterviewRoundLabel,
} from "../utils/interview-labels.js";

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timelineTone(key: string) {
  if (key === "completed") {
    return "success";
  }
  if (key.startsWith("feedback-")) {
    return "pending";
  }
  if (key === "cancelled" || key === "no-show") {
    return "danger";
  }
  return "neutral";
}

export function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const interviewId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState<InterviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) {
      return;
    }

    const currentId = interviewId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getInterview(currentId);
        if (!cancelled) {
          setInterview(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load interview";
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
  }, [interviewId]);

  if (!interviewId) {
    return <p className="form-error">Invalid interview id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading interview…</span>
      </div>
    );
  }

  if (error || !interview) {
    return <p className="form-error">{error ?? "Interview not found."}</p>;
  }

  const roundLabel = formatInterviewRoundLabel(
    interview.roundType,
    interview.sequence,
    interview.customRoundLabel,
  );

  return (
    <div className="interviews-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/interviews">Interviews</Link>
          </p>
          <h1>{roundLabel}</h1>
          <div className="page-badges">
            <StatusBadge status={interview.status} />
            <FeedbackProgressBadge interview={interview} />
          </div>
        </div>
      </div>

      {notice ? <div className="page-notice">{notice}</div> : null}

      <div className="detail-grid">
        <div className="detail-column">
          <div className="card">
            <h2>Schedule</h2>
            <dl className="detail-list">
              <div>
                <dt>Candidate</dt>
                <dd>
                  <Link to={`/candidates/${interview.candidate.id}`}>
                    {interview.candidate.fullName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Requisition</dt>
                <dd>
                  <Link to={`/requisitions/${interview.requisition.id}`}>
                    {interview.requisition.title}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Scheduled at</dt>
                <dd>{new Date(interview.scheduledAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{interview.durationMinutes} minutes</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{formatInterviewMode(interview.mode)}</dd>
              </div>
              {interview.location ? (
                <div>
                  <dt>Location</dt>
                  <dd>{interview.location}</dd>
                </div>
              ) : null}
              {interview.meetingLink ? (
                <div>
                  <dt>Meeting link</dt>
                  <dd>
                    <a href={interview.meetingLink} target="_blank" rel="noreferrer">
                      {interview.meetingLink}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Created by</dt>
                <dd>{formatUserName(interview.createdBy)}</dd>
              </div>
            </dl>

            {interview.instructions ? (
              <>
                <h3>Instructions</h3>
                <p className="description-text">{interview.instructions}</p>
              </>
            ) : null}
          </div>

          <div className="card">
            <h2>Interviewers</h2>
            {interview.interviewers.length > 0 ? (
              <ul className="plain-list">
                {interview.interviewers.map((person) => (
                  <li key={person.id}>
                    {formatUserName(person)} ({person.email})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="meta-text">No interviewers assigned.</p>
            )}
          </div>

          {interview.completionNotes || interview.cancellationReason ? (
            <div className="card">
              <h2>Outcome</h2>
              {interview.completionNotes ? (
                <p className="description-text">{interview.completionNotes}</p>
              ) : null}
              {interview.cancellationReason ? (
                <p className="meta-text meta-text--danger">
                  {interview.status === "NO_SHOW" ? "No-show reason" : "Cancellation reason"}:{" "}
                  {interview.cancellationReason}
                </p>
              ) : null}
            </div>
          ) : null}

          <InterviewFeedbackSection
            interview={interview}
            onUpdated={setInterview}
          />

          <div className="card">
            <h2>Timeline</h2>
            <ol className="timeline">
              {interview.timeline.map((step) => (
                <li
                  key={step.key}
                  className={`timeline__item timeline__item--${timelineTone(step.key)}`}
                >
                  <p className="timeline__date">{formatDate(step.at)}</p>
                  <p className="timeline__title">{step.title}</p>
                  {step.detail ? (
                    <p className="timeline__detail">{step.detail}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {user ? (
          <InterviewActions
            interview={interview}
            onUpdated={setInterview}
            onDeleted={() => navigate("/interviews")}
            onSuccess={setNotice}
          />
        ) : null}
      </div>
    </div>
  );
}

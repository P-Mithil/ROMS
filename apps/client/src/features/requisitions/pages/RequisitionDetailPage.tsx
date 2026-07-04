import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { JobRequisitionDto } from "@roms/shared";
import { parseSkills } from "../../../lib/skills.js";
import { useAuth } from "../../auth/useAuth.js";
import { canAccessCandidates } from "../../candidates/utils/permissions.js";
import { canAccessInterviews } from "../../interviews/utils/permissions.js";
import { canAccessOffers } from "../../offers/utils/permissions.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { getRequisition } from "../api/requisitions-api.js";
import { RequisitionActions } from "../components/RequisitionActions.js";
import { StatusBadge } from "../components/StatusBadge.js";

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

type TimelineStep = {
  key: string;
  date: string;
  title: string;
  detail?: string;
  tone: "neutral" | "pending" | "success" | "danger" | "muted";
};

function buildTimeline(requisition: JobRequisitionDto) {
  const steps: Array<TimelineStep | null> = [
    {
      key: "created",
      date: requisition.createdAt,
      title: `Created by ${formatUserName(requisition.createdBy)}`,
      tone: "neutral",
    },
    requisition.submittedAt
      ? {
          key: "submitted",
          date: requisition.submittedAt,
          title: "Submitted for approval",
          tone: "pending",
        }
      : null,
    requisition.approvedAt && requisition.approvedBy
      ? {
          key: "approved",
          date: requisition.approvedAt,
          title: `Approved by ${formatUserName(requisition.approvedBy)}`,
          tone: "success",
        }
      : null,
    requisition.rejectedAt
      ? {
          key: "rejected",
          date: requisition.rejectedAt,
          title: "Rejected",
          detail: requisition.rejectionReason ?? undefined,
          tone: "danger",
        }
      : null,
    requisition.closedAt
      ? {
          key: "closed",
          date: requisition.closedAt,
          title: requisition.closedBy
            ? `Closed by ${formatUserName(requisition.closedBy)}`
            : "Closed",
          detail: requisition.closeReason ?? undefined,
          tone: "muted",
        }
      : null,
  ];

  return steps.filter((step): step is TimelineStep => step !== null);
}

export function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const requisitionId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requisition, setRequisition] = useState<JobRequisitionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!requisitionId) {
      return;
    }

    const reqId = requisitionId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getRequisition(reqId);
        if (!cancelled) {
          setRequisition(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load requisition";
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
  }, [requisitionId]);

  if (!requisitionId) {
    return <p className="form-error">Invalid requisition id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading requisition…</span>
      </div>
    );
  }

  if (error || !requisition) {
    return <p className="form-error">{error ?? "Requisition not found."}</p>;
  }

  const timeline = buildTimeline(requisition);
  const skills = parseSkills(requisition.skills);
  const remainingPositions = Math.max(
    requisition.openings - requisition.filledPositions,
    0,
  );

  return (
    <div className="requisitions-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/requisitions">Requisitions</Link>
          </p>
          <h1>{requisition.title}</h1>
          <StatusBadge status={requisition.status} />
        </div>
        <div className="page-header__actions">
          {user && canAccessCandidates(user) ? (
            <Link
              className="btn btn--secondary"
              to={`/candidates?requisitionId=${requisition.id}`}
            >
              View candidates
            </Link>
          ) : null}
          {user && canAccessInterviews(user) ? (
            <Link
              className="btn btn--secondary"
              to={`/interviews?requisitionId=${requisition.id}`}
            >
              View interviews
            </Link>
          ) : null}
          {user && canAccessOffers(user) ? (
            <Link
              className="btn btn--secondary"
              to={`/offers?requisitionId=${requisition.id}`}
            >
              View offers
            </Link>
          ) : null}
        </div>
      </div>

      {notice ? <div className="page-notice">{notice}</div> : null}

      <div className="detail-grid">
        <div className="detail-column">
          <div className="card">
            <h2>Hiring Overview</h2>
            <dl className="detail-list">
              <div>
                <dt>Department</dt>
                <dd>{requisition.department.name}</dd>
              </div>
              <div>
                <dt>Hiring manager</dt>
                <dd>{formatUserName(requisition.hiringManager)}</dd>
              </div>
              <div>
                <dt>Created by</dt>
                <dd>{formatUserName(requisition.createdBy)}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{requisition.hiringPriority.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Openings</dt>
                <dd>{requisition.openings}</dd>
              </div>
              <div>
                <dt>Employment type</dt>
                <dd>{requisition.employmentType.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Work mode</dt>
                <dd>{requisition.workMode.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt>Salary range</dt>
                <dd>
                  {requisition.salaryMin != null || requisition.salaryMax != null
                    ? `${requisition.salaryMin ?? "—"} to ${requisition.salaryMax ?? "—"}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Experience range</dt>
                <dd>
                  {requisition.experienceMin || requisition.experienceMax
                    ? `${requisition.experienceMin ?? "—"} to ${requisition.experienceMax ?? "—"} years`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Candidates</dt>
                <dd>{requisition.candidateCount}</dd>
              </div>
              <div>
                <dt>Shortlisted</dt>
                <dd>{requisition.shortlistedCount}</dd>
              </div>
              <div>
                <dt>Filled positions</dt>
                <dd>{requisition.filledPositions}</dd>
              </div>
              <div>
                <dt>Remaining positions</dt>
                <dd>{remainingPositions}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(requisition.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{new Date(requisition.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>

            {skills.length > 0 ? (
              <>
                <h3>Required skills</h3>
                <div className="skills-picker__selected">
                  {skills.map((skill) => (
                    <span key={skill} className="badge badge--skill">
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            {requisition.description ? (
              <>
                <h3>Description</h3>
                <p className="description-text">{requisition.description}</p>
              </>
            ) : null}
          </div>

          <div className="card">
            <h2>Timeline</h2>
            <ol className="timeline">
              {timeline.map((step) => (
                <li key={step.key} className={`timeline__item timeline__item--${step.tone}`}>
                  <p className="timeline__date">{formatDate(step.date)}</p>
                  <p className="timeline__title">{step.title}</p>
                  {"detail" in step && step.detail ? (
                    <p className="timeline__detail">{step.detail}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <RequisitionActions
          requisition={requisition}
          onUpdated={setRequisition}
          onDeleted={() => navigate("/requisitions")}
          onSuccess={setNotice}
        />
      </div>
    </div>
  );
}

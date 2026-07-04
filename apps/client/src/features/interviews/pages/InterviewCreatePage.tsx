import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import type { CandidateStatus, CreateInterviewRequest } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { getCandidate } from "../../candidates/api/candidates-api.js";
import { createInterview } from "../api/interviews-api.js";
import { InterviewForm } from "../components/InterviewForm.js";
import {
  canManageInterviews,
  canScheduleForCandidate,
} from "../utils/permissions.js";

export function InterviewCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const candidateId = searchParams.get("candidateId") ?? "";
  const [lockedCandidate, setLockedCandidate] = useState<{
    id: string;
    fullName: string;
    email: string;
    status: CandidateStatus;
  } | null>(null);
  const [loadingCandidate, setLoadingCandidate] = useState(Boolean(candidateId));
  const [candidateError, setCandidateError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      return;
    }

    let cancelled = false;

    async function loadCandidate() {
      setLoadingCandidate(true);
      setCandidateError(null);
      try {
        const candidate = await getCandidate(candidateId);
        if (!cancelled) {
          setLockedCandidate({
            id: candidate.id,
            fullName: candidate.fullName,
            email: candidate.email,
            status: candidate.status,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load candidate";
          setCandidateError(message);
        }
      } finally {
        if (!cancelled) {
          setLoadingCandidate(false);
        }
      }
    }

    void loadCandidate();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (!user || !canManageInterviews(user)) {
    return <Navigate to="/interviews" replace />;
  }

  if (loadingCandidate) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading candidate…</span>
      </div>
    );
  }

  if (candidateError) {
    return <p className="form-error">{candidateError}</p>;
  }

  if (
    lockedCandidate &&
    !canScheduleForCandidate(user, { status: lockedCandidate.status })
  ) {
    return (
      <div className="interviews-page">
        <p className="form-error">
          Only shortlisted candidates can be scheduled for interviews.
        </p>
        <Link className="btn btn--secondary" to={`/candidates/${lockedCandidate.id}`}>
          Back to candidate
        </Link>
      </div>
    );
  }

  return (
    <div className="interviews-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/interviews">Interviews</Link>
          </p>
          <h1>Schedule interview</h1>
          <p className="page-header__subtitle">
            Assign interviewers and pick a time slot without conflicts.
          </p>
        </div>
      </div>

      <InterviewForm
        mode="create"
        submitLabel="Schedule interview"
        lockedCandidate={
          lockedCandidate
            ? {
                id: lockedCandidate.id,
                fullName: lockedCandidate.fullName,
                email: lockedCandidate.email,
              }
            : undefined
        }
        onCancel={() =>
          navigate(
            lockedCandidate
              ? `/candidates/${lockedCandidate.id}`
              : "/interviews",
          )
        }
        onSubmit={async (values) => {
          const created = await createInterview(values as CreateInterviewRequest);
          navigate(`/interviews/${created.id}`);
        }}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { InterviewDto, UpdateInterviewRequest } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { getInterview, updateInterview } from "../api/interviews-api.js";
import {
  InterviewForm,
  interviewToFormValues,
} from "../components/InterviewForm.js";
import { canEditInterview, canManageInterviews } from "../utils/permissions.js";

export function InterviewEditPage() {
  const { id } = useParams<{ id: string }>();
  const interviewId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState<InterviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!user || !canManageInterviews(user)) {
    return <Navigate to="/interviews" replace />;
  }

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

  if (!canEditInterview(user, interview)) {
    return <Navigate to={`/interviews/${interview.id}`} replace />;
  }

  return (
    <div className="interviews-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/interviews/${interview.id}`}>Interview</Link>
          </p>
          <h1>Edit interview</h1>
        </div>
      </div>

      <InterviewForm
        mode="edit"
        initialValues={interviewToFormValues(interview)}
        submitLabel="Save changes"
        onCancel={() => navigate(`/interviews/${interview.id}`)}
        onSubmit={async (values) => {
          await updateInterview(interview.id, values as UpdateInterviewRequest);
          navigate(`/interviews/${interview.id}`);
        }}
      />
    </div>
  );
}

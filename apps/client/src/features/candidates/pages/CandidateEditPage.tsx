import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { CandidateDto, UpdateCandidateRequest } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { parseSkills } from "../../../lib/skills.js";
import { useAuth } from "../../auth/useAuth.js";
import {
  getCandidate,
  updateCandidate,
  uploadCandidateResume,
} from "../api/candidates-api.js";
import { CandidateForm } from "../components/CandidateForm.js";
import { canEditCandidate } from "../utils/permissions.js";

function toFormValues(candidate: CandidateDto) {
  return {
    requisitionId: candidate.requisition.id,
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    totalExperienceYears: candidate.totalExperienceYears ?? "",
    skills: parseSkills(candidate.skills),
    currentCompany: candidate.currentCompany ?? "",
    currentLocation: candidate.currentLocation ?? "",
    noticePeriodDays:
      candidate.noticePeriodDays != null
        ? String(candidate.noticePeriodDays)
        : "",
    notes: candidate.notes ?? "",
  };
}

export function CandidateEditPage() {
  const { id } = useParams<{ id: string }>();
  const candidateId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<CandidateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!user || !canEditCandidate(user)) {
    return <Navigate to="/candidates" replace />;
  }

  if (!candidateId) {
    return <p className="form-error">Invalid candidate id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading candidate…</span>
      </div>
    );
  }

  if (error || !candidate) {
    return <p className="form-error">{error ?? "Candidate not found."}</p>;
  }

  return (
    <div className="candidates-page">
      <div className="page-header">
        <div>
          <h1>Edit candidate</h1>
          <p className="page-header__subtitle">{candidate.fullName}</p>
        </div>
      </div>

      <CandidateForm
        mode="edit"
        submitLabel="Save changes"
        allowResume
        readOnlyRequisitionTitle={candidate.requisition.title}
        initialValues={toFormValues(candidate)}
        onCancel={() => navigate(`/candidates/${candidate.id}`)}
        onSubmit={async (values, resumeFile) => {
          await updateCandidate(
            candidate.id,
            values as UpdateCandidateRequest,
          );
          if (resumeFile) {
            await uploadCandidateResume(candidate.id, resumeFile);
          }
          navigate(`/candidates/${candidate.id}`);
        }}
      />
    </div>
  );
}

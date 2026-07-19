import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import type { CandidateDto, UpdateCandidateRequest } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { parseSkills } from "../../../lib/skills.js";
import { useAuth } from "../../auth/useAuth.js";
import type { CandidateAiApplyFields } from "../../ai/components/CandidateAiPanel.js";
import {
  getCandidate,
  updateCandidate,
  uploadCandidateResume,
} from "../api/candidates-api.js";
import {
  CandidateForm,
  type CandidateAiFilledFields,
  type CandidateFormValues,
} from "../components/CandidateForm.js";
import { canEditCandidate } from "../utils/permissions.js";

function toFormValues(candidate: CandidateDto): CandidateFormValues {
  return {
    requisitionId: candidate.requisition.id,
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    totalExperienceYears:
      candidate.totalExperienceYears != null
        ? String(candidate.totalExperienceYears)
        : "",
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

type EditLocationState = {
  aiPrefill?: CandidateAiApplyFields;
  aiSkillsOnly?: boolean;
};

function mergeAiPrefill(
  base: CandidateFormValues,
  prefill: CandidateAiApplyFields | undefined,
  skillsOnly?: boolean,
): { values: CandidateFormValues; aiFilled: CandidateAiFilledFields } {
  if (!prefill) {
    return { values: base, aiFilled: {} };
  }

  const values = { ...base };
  const aiFilled: CandidateAiFilledFields = {};

  if (skillsOnly) {
    if (prefill.skills) {
      values.skills = parseSkills(prefill.skills);
      aiFilled.skills = true;
    }
    return { values, aiFilled };
  }

  if (prefill.fullName) {
    values.fullName = prefill.fullName;
    aiFilled.fullName = true;
  }
  if (prefill.email) {
    values.email = prefill.email;
    aiFilled.email = true;
  }
  if (prefill.phone) {
    values.phone = prefill.phone;
    aiFilled.phone = true;
  }
  if (prefill.totalExperienceYears != null) {
    values.totalExperienceYears = String(prefill.totalExperienceYears);
    aiFilled.totalExperienceYears = true;
  }
  if (prefill.skills) {
    values.skills = parseSkills(prefill.skills);
    aiFilled.skills = true;
  }
  if (prefill.currentCompany) {
    values.currentCompany = prefill.currentCompany;
    aiFilled.currentCompany = true;
  }
  if (prefill.currentLocation) {
    values.currentLocation = prefill.currentLocation;
    aiFilled.currentLocation = true;
  }
  if (prefill.noticePeriodDays != null) {
    values.noticePeriodDays = String(prefill.noticePeriodDays);
    aiFilled.noticePeriodDays = true;
  }

  return { values, aiFilled };
}

export function CandidateEditPage() {
  const { id } = useParams<{ id: string }>();
  const candidateId = id;
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [candidate, setCandidate] = useState<CandidateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locationState = (location.state as EditLocationState | null) ?? null;

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

  const merged = useMemo(() => {
    if (!candidate) {
      return null;
    }
    return mergeAiPrefill(
      toFormValues(candidate),
      locationState?.aiPrefill,
      locationState?.aiSkillsOnly,
    );
  }, [candidate, locationState?.aiPrefill, locationState?.aiSkillsOnly]);

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

  if (error || !candidate || !merged) {
    return <p className="form-error">{error ?? "Candidate not found."}</p>;
  }

  return (
    <div className="candidates-page">
      <div className="page-header">
        <div>
          <h1>Edit candidate</h1>
          <p className="page-header__subtitle">{candidate.fullName}</p>
          {locationState?.aiPrefill ? (
            <p className="meta-text">
              AI suggestions are highlighted. Review and save to persist — nothing
              was auto-saved.
            </p>
          ) : null}
        </div>
      </div>

      <CandidateForm
        mode="edit"
        submitLabel="Save changes"
        allowResume
        readOnlyRequisitionTitle={candidate.requisition.title}
        initialValues={merged.values}
        initialAiFilled={merged.aiFilled}
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

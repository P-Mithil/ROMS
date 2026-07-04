import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import type { CreateCandidateRequest } from "@roms/shared";
import { useAuth } from "../../auth/useAuth.js";
import {
  createCandidate,
  uploadCandidateResume,
} from "../api/candidates-api.js";
import { CandidateForm } from "../components/CandidateForm.js";
import { canCreateCandidate } from "../utils/permissions.js";

export function CandidateCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const preselectedRequisitionId = searchParams.get("requisitionId") ?? "";

  if (!user || !canCreateCandidate(user)) {
    return <Navigate to="/candidates" replace />;
  }

  return (
    <div className="candidates-page">
      <div className="page-header">
        <div>
          <h1>Add candidate</h1>
          <p className="page-header__subtitle">
            Add a candidate to an open requisition.
          </p>
        </div>
      </div>

      <CandidateForm
        mode="create"
        submitLabel="Create candidate"
        allowResume
        initialValues={
          preselectedRequisitionId
            ? {
                requisitionId: preselectedRequisitionId,
                fullName: "",
                email: "",
                phone: "",
                totalExperienceYears: "",
                skills: [],
                currentCompany: "",
                currentLocation: "",
                noticePeriodDays: "",
                notes: "",
              }
            : undefined
        }
        onCancel={() => navigate("/candidates")}
        onSubmit={async (values, resumeFile) => {
          const created = await createCandidate(values as CreateCandidateRequest);
          if (resumeFile) {
            await uploadCandidateResume(created.id, resumeFile);
          }
          navigate(`/candidates/${created.id}`);
        }}
      />
    </div>
  );
}

import { Navigate, useNavigate } from "react-router-dom";
import type { CreateRequisitionRequest } from "@roms/shared";
import { useAuth } from "../../auth/useAuth.js";
import { createRequisition } from "../api/requisitions-api.js";
import { RequisitionForm } from "../components/RequisitionForm.js";
import { canCreateRequisition } from "../utils/permissions.js";

export function RequisitionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user || !canCreateRequisition(user)) {
    return <Navigate to="/requisitions" replace />;
  }

  return (
    <div className="requisitions-page">
      <div className="page-header">
        <div>
          <h1>New requisition</h1>
          <p className="page-header__subtitle">
            Create a draft requisition and submit it for hiring manager approval.
          </p>
        </div>
      </div>

      <RequisitionForm
        mode="create"
        submitLabel="Create requisition"
        onCancel={() => navigate("/requisitions")}
        onSubmit={async (values) => {
          const created = await createRequisition(
            values as CreateRequisitionRequest,
          );
          navigate(`/requisitions/${created.id}`);
        }}
      />
    </div>
  );
}

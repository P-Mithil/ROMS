import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { JobRequisitionDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { parseSkills } from "../../../lib/skills.js";
import { useAuth } from "../../auth/useAuth.js";
import { getRequisition, updateRequisition } from "../api/requisitions-api.js";
import { RequisitionForm } from "../components/RequisitionForm.js";
import {
  canEditRequisition,
  isDescriptionOnlyEdit,
} from "../utils/permissions.js";

export function RequisitionEditPage() {
  const { id } = useParams<{ id: string }>();
  const requisitionId = id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requisition, setRequisition] = useState<JobRequisitionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (!user || !canEditRequisition(user, requisition)) {
    return <Navigate to={`/requisitions/${requisition.id}`} replace />;
  }

  const descriptionOnly = isDescriptionOnlyEdit(requisition);

  return (
    <div className="requisitions-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/requisitions/${requisition.id}`}>
              Back to requisition
            </Link>
          </p>
          <h1>Edit requisition</h1>
          <p className="page-header__subtitle">{requisition.title}</p>
        </div>
      </div>

      <RequisitionForm
        mode="edit"
        submitLabel={descriptionOnly ? "Save description" : "Save changes"}
        descriptionOnly={descriptionOnly}
        initialValues={{
          title: requisition.title,
          description: requisition.description ?? "",
          skills: parseSkills(requisition.skills),
          departmentId: requisition.department.id,
          hiringManagerId: requisition.hiringManager.id,
          hiringPriority: requisition.hiringPriority,
          openings: String(requisition.openings),
          employmentType: requisition.employmentType,
          workMode: requisition.workMode,
          salaryMin: requisition.salaryMin != null ? String(requisition.salaryMin) : "",
          salaryMax: requisition.salaryMax != null ? String(requisition.salaryMax) : "",
          experienceMin: requisition.experienceMin ?? "",
          experienceMax: requisition.experienceMax ?? "",
        }}
        readOnlyDetails={{
          departmentName: requisition.department.name,
          hiringManagerName: `${requisition.hiringManager.firstName} ${requisition.hiringManager.lastName}`,
        }}
        onCancel={() => navigate(`/requisitions/${requisition.id}`)}
        onSubmit={async (values) => {
          const updated = await updateRequisition(requisition.id, values);
          navigate(`/requisitions/${updated.id}`);
        }}
      />
    </div>
  );
}

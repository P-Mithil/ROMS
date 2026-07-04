import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { EmployeeDto } from "@roms/shared";
import { useToast } from "../../../components/feedback/ToastContext.js";
import { ApiClientError } from "../../../lib/api-client.js";
import { useAuth } from "../../auth/useAuth.js";
import { getEmployee, updateEmployee } from "../api/employees-api.js";
import { listOnboardingCases } from "../api/onboarding-api.js";
import { EmployeeStatusBadge } from "../components/EmployeeStatusBadge.js";
import {
  formatCurrency,
  formatDate,
} from "../utils/onboarding-labels.js";
import { canEditEmployee } from "../utils/permissions.js";

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id;
  const { user } = useAuth();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<EmployeeDto | null>(null);
  const [onboardingCaseId, setOnboardingCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    const currentId = employeeId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getEmployee(currentId);
        if (!cancelled) {
          setEmployee(data);
          setWorkEmail(data.workEmail ?? "");
          setPhone(data.phone);
        }

        const onboarding = await listOnboardingCases({
          page: 1,
          limit: 1,
          candidateId: data.candidateId,
        });
        if (!cancelled) {
          setOnboardingCaseId(onboarding.items[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load employee";
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
  }, [employeeId]);

  if (!employeeId) {
    return <p className="form-error">Invalid employee id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading employee…</span>
      </div>
    );
  }

  if (error || !employee) {
    return <p className="form-error">{error ?? "Employee not found."}</p>;
  }

  const canEdit = user ? canEditEmployee(user, employee) : false;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!employee) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateEmployee(employee.id, {
        phone: phone.trim(),
        workEmail: workEmail.trim() || null,
      });
      setEmployee(updated);
      setEditing(false);
      showToast("Employee updated.");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Update failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="onboarding-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/employees">Employees</Link>
          </p>
          <h1>{employee.fullName}</h1>
          <div className="page-badges">
            <EmployeeStatusBadge status={employee.status} />
            <span className="badge badge--skill">{employee.employeeCode}</span>
          </div>
        </div>
        <div className="page-header__actions">
          <Link
            className="btn btn--secondary"
            to={`/candidates/${employee.candidateId}`}
          >
            View candidate
          </Link>
          {onboardingCaseId ? (
            <Link
              className="btn btn--secondary"
              to={`/onboarding/${onboardingCaseId}`}
            >
              View onboarding
            </Link>
          ) : null}
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="detail-grid">
        <div className="detail-column">
          <div className="card">
            <div className="card__header-row">
              <h2>Employee profile</h2>
              {canEdit && !editing ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              ) : null}
            </div>

            {editing ? (
              <form className="form" onSubmit={handleSave}>
                <label className="form-field">
                  <span className="form-field__label">Work email</span>
                  <input
                    className="form-field__input"
                    type="email"
                    value={workEmail}
                    onChange={(event) => setWorkEmail(event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-field__label">Phone</span>
                  <input
                    className="form-field__input"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="btn btn--secondary"
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setEditing(false);
                      setWorkEmail(employee.workEmail ?? "");
                      setPhone(employee.phone);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <dl className="detail-list">
                <div>
                  <dt>Employee code</dt>
                  <dd>{employee.employeeCode}</dd>
                </div>
                <div>
                  <dt>Personal email</dt>
                  <dd>{employee.email}</dd>
                </div>
                <div>
                  <dt>Work email</dt>
                  <dd>{employee.workEmail ?? "—"}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{employee.phone}</dd>
                </div>
                <div>
                  <dt>Job title</dt>
                  <dd>{employee.jobTitle}</dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>{employee.department.name}</dd>
                </div>
                <div>
                  <dt>Employment type</dt>
                  <dd>{employee.employmentType.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>Work mode</dt>
                  <dd>{employee.workMode.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>Base salary</dt>
                  <dd>{formatCurrency(employee.baseSalary, employee.currency)}</dd>
                </div>
                <div>
                  <dt>Expected joining</dt>
                  <dd>{formatDate(employee.expectedJoiningDate)}</dd>
                </div>
                <div>
                  <dt>Actual joining</dt>
                  <dd>
                    {employee.actualJoiningDate
                      ? formatDate(employee.actualJoiningDate)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Hiring manager</dt>
                  <dd>{formatUserName(employee.hiringManager)}</dd>
                </div>
                <div>
                  <dt>Created by</dt>
                  <dd>{formatUserName(employee.createdBy)}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

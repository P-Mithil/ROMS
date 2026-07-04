import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { OnboardingCaseDto } from "@roms/shared";
import { ApiClientError } from "../../../lib/api-client.js";
import { getOnboardingCase } from "../api/onboarding-api.js";
import { DocumentChecklist } from "../components/DocumentChecklist.js";
import { EmployeeStatusBadge } from "../components/EmployeeStatusBadge.js";
import { OnboardingActions } from "../components/OnboardingActions.js";
import { OnboardingTimeline } from "../components/OnboardingTimeline.js";
import { ProgressSummary } from "../components/ProgressSummary.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { TaskChecklist } from "../components/TaskChecklist.js";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../utils/onboarding-labels.js";

function formatUserName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function OnboardingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const caseId = id;
  const [onboardingCase, setOnboardingCase] = useState<OnboardingCaseDto | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      return;
    }

    const currentId = caseId;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getOnboardingCase(currentId);
        if (!cancelled) {
          setOnboardingCase(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : "Failed to load onboarding case";
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
  }, [caseId]);

  if (!caseId) {
    return <p className="form-error">Invalid onboarding case id.</p>;
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="badge badge--loading">Loading onboarding case…</span>
      </div>
    );
  }

  if (error || !onboardingCase) {
    return <p className="form-error">{error ?? "Onboarding case not found."}</p>;
  }

  const hiringManagerId = onboardingCase.employee?.hiringManager.id ?? "";

  return (
    <div className="onboarding-page">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/onboarding">Onboarding</Link>
          </p>
          <h1>{onboardingCase.candidate.fullName}</h1>
          <div className="page-badges">
            <StatusBadge status={onboardingCase.status} />
            {onboardingCase.employee ? (
              <EmployeeStatusBadge status={onboardingCase.employee.status} />
            ) : null}
          </div>
        </div>
        <div className="page-header__actions">
          <Link
            className="btn btn--secondary"
            to={`/candidates/${onboardingCase.candidate.id}`}
          >
            View candidate
          </Link>
          <Link
            className="btn btn--secondary"
            to={`/offers/${onboardingCase.offer.id}`}
          >
            View offer
          </Link>
        </div>
      </div>

      {notice ? <div className="page-notice">{notice}</div> : null}

      <div className="detail-grid">
        <div className="detail-column">
          <div className="card">
            <h2>Case overview</h2>
            <ProgressSummary
              progress={onboardingCase.progress}
              joinedAt={onboardingCase.joinedAt}
            />
          </div>

          <div className="card">
            <h2>Handoff details</h2>
            <dl className="detail-list">
              <div>
                <dt>Candidate</dt>
                <dd>
                  <Link to={`/candidates/${onboardingCase.candidate.id}`}>
                    {onboardingCase.candidate.fullName}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Requisition</dt>
                <dd>
                  <Link to={`/requisitions/${onboardingCase.requisition.id}`}>
                    {onboardingCase.requisition.title}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Offer</dt>
                <dd>
                  <Link to={`/offers/${onboardingCase.offer.id}`}>
                    {onboardingCase.offer.jobTitle}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Expected joining</dt>
                <dd>{formatDate(onboardingCase.offer.joiningDate)}</dd>
              </div>
              {onboardingCase.employee ? (
                <>
                  <div>
                    <dt>Employee code</dt>
                    <dd>
                      <Link to={`/employees/${onboardingCase.employee.id}`}>
                        {onboardingCase.employee.employeeCode}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Salary</dt>
                    <dd>
                      {formatCurrency(
                        onboardingCase.employee.baseSalary,
                        onboardingCase.employee.currency,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Hiring manager</dt>
                    <dd>
                      {formatUserName(onboardingCase.employee.hiringManager)}
                    </dd>
                  </div>
                </>
              ) : null}
              {onboardingCase.startedAt ? (
                <div>
                  <dt>Started</dt>
                  <dd>{formatDateTime(onboardingCase.startedAt)}</dd>
                </div>
              ) : null}
              {onboardingCase.cancelReason ? (
                <div>
                  <dt>Cancel reason</dt>
                  <dd>{onboardingCase.cancelReason}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {onboardingCase.status !== "PENDING" ? (
            <>
              <TaskChecklist
                onboardingCase={onboardingCase}
                hiringManagerId={hiringManagerId}
                onUpdated={setOnboardingCase}
              />
              <DocumentChecklist
                onboardingCase={onboardingCase}
                onUpdated={setOnboardingCase}
              />
            </>
          ) : (
            <div className="card">
              <h2>Checklists</h2>
              <p className="meta-text">
                Start onboarding to generate the task and document checklists.
              </p>
            </div>
          )}

          <div className="card">
            <h2>Timeline</h2>
            <OnboardingTimeline items={onboardingCase.timeline} />
          </div>
        </div>

        <OnboardingActions
          onboardingCase={onboardingCase}
          onUpdated={setOnboardingCase}
          onSuccess={setNotice}
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { HealthData, ReportOverviewDto } from "@roms/shared";
import { Icon } from "../components/ui/Icon.js";
import { SkeletonList } from "../components/ui/Skeleton.js";
import { apiGet, ApiClientError } from "../lib/api-client.js";
import { useAuth } from "../features/auth/useAuth.js";
import { canAccessCandidates } from "../features/candidates/utils/permissions.js";
import { canAccessInterviews } from "../features/interviews/utils/permissions.js";
import { canAccessOffers } from "../features/offers/utils/permissions.js";
import { canAccessOnboarding } from "../features/onboarding/utils/permissions.js";
import { getReportOverview } from "../features/reports/api/reports-api.js";
import { ExportButtons } from "../features/reports/components/ExportButtons.js";
import { FunnelChart } from "../features/reports/components/FunnelChart.js";
import { KpiCard } from "../features/reports/components/KpiCard.js";
import { canAccessReports } from "../features/reports/utils/permissions.js";
import {
  defaultReportFilters,
  formatNumber,
  formatPercent,
} from "../features/reports/utils/report-labels.js";
import { canAccessRequisitions } from "../features/requisitions/utils/permissions.js";

type HealthState =
  | { status: "loading" }
  | { status: "connected"; data: HealthData }
  | { status: "error"; message: string };

export function HomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [overview, setOverview] = useState<ReportOverviewDto | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const filters = defaultReportFilters();

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const data = await apiGet<HealthData>("/health");
        if (!cancelled) {
          setHealth({ status: "connected", data });
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiClientError
              ? error.message
              : "Unable to reach API";
          setHealth({ status: "error", message });
        }
      }
    }

    void checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !canAccessReports(user)) {
      setOverview(null);
      return;
    }

    let cancelled = false;
    async function loadOverview() {
      setOverviewLoading(true);
      try {
        const data = await getReportOverview(filters);
        if (!cancelled) {
          setOverview(data);
        }
      } catch {
        if (!cancelled) {
          setOverview(null);
        }
      } finally {
        if (!cancelled) {
          setOverviewLoading(false);
        }
      }
    }

    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="home-hero__eyebrow">Recruitment operations</p>
        <h1>ROMS</h1>
        <p className="home-page__tagline">
          Recruitment to Onboarding Management System
        </p>
        <div className="home-hero__actions">
          {user && canAccessRequisitions(user) ? (
            <Link className="btn btn--primary" to="/requisitions">
              <Icon name="briefcase" /> Requisitions
            </Link>
          ) : null}
          {user && canAccessCandidates(user) ? (
            <Link className="btn btn--secondary" to="/candidates">
              <Icon name="users" /> Candidates
            </Link>
          ) : null}
          {user && canAccessInterviews(user) ? (
            <Link className="btn btn--secondary" to="/interviews">
              <Icon name="calendar" /> Interviews
            </Link>
          ) : null}
          {user && canAccessOffers(user) ? (
            <Link className="btn btn--secondary" to="/offers">
              <Icon name="fileText" /> Offers
            </Link>
          ) : null}
          {user && canAccessOnboarding(user) ? (
            <Link className="btn btn--secondary" to="/onboarding">
              <Icon name="clipboard" /> Onboarding
            </Link>
          ) : null}
          {user && canAccessReports(user) ? (
            <Link className="btn btn--secondary" to="/reports">
              <Icon name="barChart" /> Reports
            </Link>
          ) : null}
        </div>
      </section>

      {user && canAccessReports(user) ? (
        <section className="home-dashboard" aria-label="Hiring snapshot">
          <div className="card__header-row">
            <h2>Hiring snapshot</h2>
            <ExportButtons dataset="funnel" filters={filters} />
          </div>
          {overviewLoading ? (
            <SkeletonList rows={2} label="Loading dashboard" />
          ) : overview ? (
            <>
              <div className="summary-grid">
                <KpiCard
                  label="Open requisitions"
                  value={formatNumber(overview.kpis.openRequisitions)}
                  to="/requisitions?status=OPEN"
                  hint="Open roles"
                />
                <KpiCard
                  label="Active candidates"
                  value={formatNumber(overview.kpis.activeCandidates)}
                  to="/candidates"
                  hint="In pipeline"
                />
                <KpiCard
                  label="Interviews scheduled"
                  value={formatNumber(overview.kpis.interviewsScheduled)}
                  to="/interviews?status=SCHEDULED"
                  hint="Upcoming"
                />
                <KpiCard
                  label="Offers pending"
                  value={formatNumber(overview.kpis.offersPendingResponse)}
                  to="/offers"
                  hint="Awaiting response"
                />
                <KpiCard
                  label="Onboarding in progress"
                  value={formatNumber(overview.kpis.onboardingInProgress)}
                  to="/onboarding"
                  hint="Active cases"
                />
                <KpiCard
                  label="Offer accept rate"
                  value={formatPercent(overview.kpis.offerAcceptRate)}
                  to="/reports/offers"
                  hint="Period to date"
                />
              </div>
              <div className="home-dashboard__charts">
                <FunnelChart stages={overview.funnelSnapshot} />
                <div className="card">
                  <h2>Quick links</h2>
                  <ul className="plain-list home-quick-links">
                    <li>
                      <Link to="/reports">Full reports workspace</Link>
                    </li>
                    <li>
                      <Link to="/reports/funnel">Funnel deep dive</Link>
                    </li>
                    <li>
                      <Link to="/reports/recruitment">Recruitment report</Link>
                    </li>
                    <li>
                      <Link to="/candidates/new">Add candidate</Link>
                    </li>
                    <li>
                      <Link to="/requisitions/new">New requisition</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="meta-text">Dashboard metrics are temporarily unavailable.</p>
          )}
        </section>
      ) : null}

      <div className="health-card" aria-live="polite">
        <h2>API Health</h2>
        {health.status === "loading" && (
          <span className="badge badge--loading">Checking...</span>
        )}
        {health.status === "connected" && (
          <>
            <span className="badge badge--success">Connected</span>
            <dl className="health-details">
              <div>
                <dt>Status</dt>
                <dd>{health.data.status}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{health.data.database}</dd>
              </div>
              <div>
                <dt>Timestamp</dt>
                <dd>{health.data.timestamp}</dd>
              </div>
            </dl>
          </>
        )}
        {health.status === "error" && (
          <>
            <span className="badge badge--error">Error</span>
            <p className="health-error">{health.message}</p>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { HealthData } from "@roms/shared";
import { apiGet, ApiClientError } from "../lib/api-client.js";
import { useAuth } from "../features/auth/useAuth.js";
import { canAccessCandidates } from "../features/candidates/utils/permissions.js";
import { canAccessInterviews } from "../features/interviews/utils/permissions.js";
import { canAccessRequisitions } from "../features/requisitions/utils/permissions.js";

type HealthState =
  | { status: "loading" }
  | { status: "connected"; data: HealthData }
  | { status: "error"; message: string };

export function HomePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

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

  return (
    <div className="home-page">
      <h1>ROMS</h1>
      <p className="home-page__tagline">
        Recruitment to Onboarding Management System
      </p>

      {user && canAccessRequisitions(user) ? (
        <p className="home-page__cta">
          <Link className="btn btn--primary" to="/requisitions">
            View requisitions
          </Link>
        </p>
      ) : null}

      {user && canAccessCandidates(user) ? (
        <p className="home-page__cta">
          <Link className="btn btn--secondary" to="/candidates">
            View candidates
          </Link>
        </p>
      ) : null}

      {user && canAccessInterviews(user) ? (
        <p className="home-page__cta">
          <Link className="btn btn--secondary" to="/interviews">
            View interviews
          </Link>
        </p>
      ) : null}

      <div className="health-card">
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

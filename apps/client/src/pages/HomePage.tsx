import { useEffect, useState } from "react";
import type { HealthData } from "@roms/shared";
import { apiGet, ApiClientError } from "../lib/api-client.js";

type HealthState =
  | { status: "loading" }
  | { status: "connected"; data: HealthData }
  | { status: "error"; message: string };

export function HomePage() {
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
        Foundation setup complete. Sprint 1 will add authentication and RBAC.
      </p>

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

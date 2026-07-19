import { useState } from "react";

type FunnelChartProps = {
  stages: Array<{ key: string; label: string; count: number }>;
  onStageSelect?: (stageKey: string) => void;
};

export function FunnelChart({ stages, onStageSelect }: FunnelChartProps) {
  const max = Math.max(...stages.map((stage) => stage.count), 1);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const active = stages.find((stage) => stage.key === activeKey) ?? null;
  const previous =
    active == null
      ? null
      : stages[stages.findIndex((stage) => stage.key === active.key) - 1] ??
        null;
  const conversion =
    active && previous && previous.count > 0
      ? Math.round((active.count / previous.count) * 100)
      : null;

  return (
    <div className="card">
      <h2>Hiring funnel</h2>
      <ul className="report-funnel">
        {stages.map((stage) => (
          <li key={stage.key} className="report-funnel__item">
            <button
              type="button"
              className={`report-funnel__button${
                activeKey === stage.key ? " report-funnel__button--active" : ""
              }`}
              onClick={() => {
                setActiveKey(stage.key);
                onStageSelect?.(stage.key);
              }}
            >
              <div className="report-funnel__meta">
                <span>{stage.label}</span>
                <strong>{stage.count}</strong>
              </div>
              <div className="report-funnel__bar-track">
                <div
                  className="report-funnel__bar"
                  style={{ width: `${Math.round((stage.count / max) * 100)}%` }}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
      {active ? (
        <p className="meta-text report-funnel__detail" role="status">
          <strong>{active.label}</strong>: {active.count} records
          {conversion != null ? ` · ${conversion}% from previous stage` : null}
        </p>
      ) : (
        <p className="meta-text">Select a stage to inspect conversion.</p>
      )}
    </div>
  );
}

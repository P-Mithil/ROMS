import { AiDisclaimer } from "./AiDisclaimer.js";

type AiPanelProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  error?: string | null;
  loading?: boolean;
  disclaimer?: string;
};

export function AiPanel({
  title,
  children,
  actions,
  error,
  loading,
  disclaimer,
}: AiPanelProps) {
  return (
    <div className="card ai-panel">
      <div className="card__header-row">
        <h2>
          <span className="ai-badge">AI</span> {title}
        </h2>
        {actions}
      </div>
      {loading ? (
        <span className="badge badge--loading">Generating…</span>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {children}
      <AiDisclaimer text={disclaimer} />
    </div>
  );
}

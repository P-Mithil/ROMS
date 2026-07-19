import { Link } from "react-router-dom";

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  to?: string;
  onClick?: () => void;
};

export function KpiCard({ label, value, hint, to, onClick }: KpiCardProps) {
  const body = (
    <>
      <span className="summary-card__label">{label}</span>
      <strong className="summary-card__value">{value}</strong>
      {hint ? <p className="meta-text">{hint}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link className="card summary-card summary-card--link" to={to}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className="card summary-card summary-card--link"
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return <div className="card summary-card">{body}</div>;
}

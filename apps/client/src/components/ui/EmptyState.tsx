import { Link } from "react-router-dom";
import { Icon } from "./Icon.js";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  icon?: "inbox" | "search" | "users" | "briefcase" | "calendar" | "fileText";
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon = "inbox",
}: EmptyStateProps) {
  return (
    <div className="card empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && actionTo ? (
        <Link className="btn btn--primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button className="btn btn--primary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

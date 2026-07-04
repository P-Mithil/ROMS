import type { RequisitionStatus } from "@roms/shared";

const STATUS_LABELS: Record<RequisitionStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  OPEN: "Open",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

type StatusBadgeProps = {
  status: RequisitionStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge--status badge--status-${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

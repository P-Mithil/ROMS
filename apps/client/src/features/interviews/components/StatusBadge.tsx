import type { InterviewStatus } from "@roms/shared";

const STATUS_LABELS: Record<InterviewStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
};

type StatusBadgeProps = {
  status: InterviewStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge badge--status badge--interview-${status.toLowerCase()}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

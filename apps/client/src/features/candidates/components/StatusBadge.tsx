import type { CandidateStatus } from "@roms/shared";

const STATUS_LABELS: Record<CandidateStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  SELECTED: "Selected",
  OFFER_ACCEPTED: "Offer accepted",
  JOINED: "Joined",
  ONBOARDED: "Onboarded",
  WITHDRAWN: "Withdrawn",
  OFFER_DECLINED: "Offer declined",
  REJECTED: "Rejected",
};

type StatusBadgeProps = {
  status: CandidateStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge badge--status badge--candidate-${status.toLowerCase()}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

import type { OfferStatus } from "@roms/shared";
import { OFFER_STATUS_LABELS } from "../utils/offer-labels.js";

type StatusBadgeProps = {
  status: OfferStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge badge--status badge--offer-${status.toLowerCase()}`}
    >
      {OFFER_STATUS_LABELS[status]}
    </span>
  );
}

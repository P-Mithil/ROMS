export const OFFER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVAL_REJECTED",
  "APPROVED",
  "EXTENDED",
  "ACCEPTED",
  "DECLINED",
  "WITHDRAWN",
  "EXPIRED",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const ACTIVE_OFFER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVAL_REJECTED",
  "APPROVED",
  "EXTENDED",
] as const satisfies readonly OfferStatus[];

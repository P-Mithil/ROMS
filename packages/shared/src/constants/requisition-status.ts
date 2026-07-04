export const REQUISITION_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "OPEN",
  "CLOSED",
  "REJECTED",
] as const;

export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];

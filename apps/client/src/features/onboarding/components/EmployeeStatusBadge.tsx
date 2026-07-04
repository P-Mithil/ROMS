import type { EmployeeStatus } from "@roms/shared";
import { formatEmployeeStatus } from "../utils/onboarding-labels.js";

type EmployeeStatusBadgeProps = {
  status: EmployeeStatus;
};

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  return (
    <span
      className={`badge badge--status badge--employee-${status.toLowerCase()}`}
    >
      {formatEmployeeStatus(status)}
    </span>
  );
}

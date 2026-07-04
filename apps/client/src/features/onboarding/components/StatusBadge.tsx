import type { OnboardingCaseStatus } from "@roms/shared";
import { formatOnboardingCaseStatus } from "../utils/onboarding-labels.js";

type StatusBadgeProps = {
  status: OnboardingCaseStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge badge--status badge--onboarding-${status.toLowerCase()}`}
    >
      {formatOnboardingCaseStatus(status)}
    </span>
  );
}

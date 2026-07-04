import type { InterviewRoundType } from "@roms/shared";

const ROUND_LABELS: Record<InterviewRoundType, string> = {
  HR: "HR",
  TECHNICAL: "Technical",
  MANAGERIAL: "Managerial",
  FINAL: "Final",
  CUSTOM: "Custom",
};

export function formatInterviewRoundLabel(
  roundType: InterviewRoundType,
  sequence: number,
  customRoundLabel: string | null,
): string {
  if (roundType === "CUSTOM" && customRoundLabel?.trim()) {
    return sequence > 1
      ? `${customRoundLabel.trim()} ${sequence}`
      : customRoundLabel.trim();
  }

  return `${ROUND_LABELS[roundType]} Round ${sequence}`;
}

export function formatInterviewMode(mode: string): string {
  return mode.replaceAll("_", " ");
}

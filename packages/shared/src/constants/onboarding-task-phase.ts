export const ONBOARDING_TASK_PHASES = ["PRE_JOINING", "POST_JOINING"] as const;

export type OnboardingTaskPhase = (typeof ONBOARDING_TASK_PHASES)[number];

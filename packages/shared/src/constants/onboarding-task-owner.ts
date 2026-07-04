export const ONBOARDING_TASK_OWNERS = ["HR", "IT", "HIRING_MANAGER"] as const;

export type OnboardingTaskOwner = (typeof ONBOARDING_TASK_OWNERS)[number];

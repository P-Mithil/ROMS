import type {
  AuthUser,
  EmployeeDto,
  OnboardingCaseDto,
  OnboardingDocumentDto,
  OnboardingTaskDto,
} from "@roms/shared";

export function canAccessOnboarding(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}

export function canManageOnboarding(user: AuthUser): boolean {
  return user.role === "HR_ADMIN" || user.role === "RECRUITER";
}

export function canCompleteOnboarding(user: AuthUser): boolean {
  return user.role === "HR_ADMIN";
}

export function canStartOnboarding(
  user: AuthUser,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  return canManageOnboarding(user) && onboardingCase.status === "PENDING";
}

export function canConfirmJoining(
  user: AuthUser,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  return canManageOnboarding(user) && onboardingCase.status === "IN_PROGRESS";
}

export function canCancelOnboarding(
  user: AuthUser,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  return (
    canCompleteOnboarding(user) &&
    onboardingCase.status !== "COMPLETED" &&
    onboardingCase.status !== "CANCELLED"
  );
}

export function canFinalizeOnboarding(
  user: AuthUser,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  return canCompleteOnboarding(user) && onboardingCase.status === "JOINED";
}

export function canCompleteTask(
  user: AuthUser,
  task: Pick<OnboardingTaskDto, "ownerRole" | "phase" | "status">,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
  hiringManagerId: string,
): boolean {
  if (task.status === "COMPLETED" || task.status === "SKIPPED") {
    return false;
  }

  if (task.phase === "POST_JOINING" && onboardingCase.status !== "JOINED") {
    return false;
  }

  if (
    task.phase === "PRE_JOINING" &&
    onboardingCase.status !== "IN_PROGRESS" &&
    onboardingCase.status !== "JOINED"
  ) {
    return false;
  }

  if (task.ownerRole === "IT") {
    return user.role === "HR_ADMIN";
  }

  if (task.ownerRole === "HIRING_MANAGER") {
    return (
      user.role === "HR_ADMIN" ||
      (user.role === "HIRING_MANAGER" && user.id === hiringManagerId)
    );
  }

  return canManageOnboarding(user);
}

export function canSkipTask(
  user: AuthUser,
  task: Pick<OnboardingTaskDto, "isRequired" | "status">,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  if (!canManageOnboarding(user)) {
    return false;
  }

  if (task.status === "COMPLETED" || task.status === "SKIPPED") {
    return false;
  }

  if (
    onboardingCase.status !== "IN_PROGRESS" &&
    onboardingCase.status !== "JOINED"
  ) {
    return false;
  }

  if (task.isRequired && user.role !== "HR_ADMIN") {
    return false;
  }

  return true;
}

export function canUploadDocument(
  user: AuthUser,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  return (
    canManageOnboarding(user) &&
    (onboardingCase.status === "IN_PROGRESS" ||
      onboardingCase.status === "JOINED")
  );
}

export function canVerifyDocument(
  user: AuthUser,
  document: Pick<OnboardingDocumentDto, "status">,
  onboardingCase: Pick<OnboardingCaseDto, "status">,
): boolean {
  return (
    canManageOnboarding(user) &&
    document.status === "RECEIVED" &&
    onboardingCase.status !== "PENDING" &&
    onboardingCase.status !== "COMPLETED" &&
    onboardingCase.status !== "CANCELLED"
  );
}

export function canWaiveDocument(
  user: AuthUser,
  document: Pick<OnboardingDocumentDto, "status">,
): boolean {
  return (
    canCompleteOnboarding(user) &&
    document.status !== "VERIFIED"
  );
}

export function canEditEmployee(
  user: AuthUser,
  employee: Pick<EmployeeDto, "status">,
): boolean {
  return (
    canManageOnboarding(user) &&
    (employee.status === "ONBOARDING" || employee.status === "JOINED")
  );
}

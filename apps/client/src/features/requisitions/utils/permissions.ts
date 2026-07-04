import type { AuthUser, JobRequisitionDto } from "@roms/shared";

export function canAccessRequisitions(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}

export function canCreateRequisition(user: AuthUser): boolean {
  return user.role === "HR_ADMIN" || user.role === "RECRUITER";
}

export function canEditRequisition(
  user: AuthUser,
  requisition: JobRequisitionDto,
): boolean {
  if (user.role === "HR_ADMIN") {
    return (
      requisition.status === "DRAFT" ||
      requisition.status === "REJECTED" ||
      requisition.status === "OPEN"
    );
  }

  if (user.role === "RECRUITER" && requisition.createdBy.id === user.id) {
    return (
      requisition.status === "DRAFT" ||
      requisition.status === "REJECTED" ||
      requisition.status === "OPEN"
    );
  }

  return (
    user.role === "HIRING_MANAGER" &&
    requisition.hiringManager.id === user.id &&
    requisition.status === "OPEN"
  );
}

export function canSubmitRequisition(
  user: AuthUser,
  requisition: JobRequisitionDto,
): boolean {
  return canEditRequisition(user, requisition);
}

export function canApproveOrReject(
  user: AuthUser,
  requisition: JobRequisitionDto,
): boolean {
  if (requisition.status !== "PENDING_APPROVAL") {
    return false;
  }

  if (user.role === "HR_ADMIN") {
    return true;
  }

  return (
    user.role === "HIRING_MANAGER" &&
    requisition.hiringManager.id === user.id
  );
}

export function canCloseRequisition(
  user: AuthUser,
  requisition: JobRequisitionDto,
): boolean {
  if (requisition.status !== "OPEN") {
    return false;
  }

  if (user.role === "HR_ADMIN") {
    return true;
  }

  if (user.role === "RECRUITER" && requisition.createdBy.id === user.id) {
    return true;
  }

  return (
    user.role === "HIRING_MANAGER" &&
    requisition.hiringManager.id === user.id
  );
}

export function canDeleteRequisition(
  user: AuthUser,
  requisition: JobRequisitionDto,
): boolean {
  if (requisition.status !== "DRAFT") {
    return false;
  }

  if (user.role === "HR_ADMIN") {
    return true;
  }

  return user.role === "RECRUITER" && requisition.createdBy.id === user.id;
}

export function isDescriptionOnlyEdit(requisition: JobRequisitionDto): boolean {
  return requisition.status === "OPEN";
}

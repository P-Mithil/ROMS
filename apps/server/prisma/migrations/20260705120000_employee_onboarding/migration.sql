-- Extend candidate lifecycle for onboarding handoff
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'JOINED';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'ONBOARDED';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

CREATE TYPE "EmployeeStatus" AS ENUM (
  'ONBOARDING',
  'JOINED',
  'ACTIVE',
  'WITHDRAWN'
);

CREATE TYPE "OnboardingCaseStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'JOINED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "OnboardingTaskPhase" AS ENUM (
  'PRE_JOINING',
  'POST_JOINING'
);

CREATE TYPE "OnboardingTaskOwner" AS ENUM (
  'HR',
  'IT',
  'HIRING_MANAGER'
);

CREATE TYPE "OnboardingTaskStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED'
);

CREATE TYPE "OnboardingDocumentType" AS ENUM (
  'SIGNED_OFFER',
  'GOVERNMENT_ID',
  'ADDRESS_PROOF',
  'EDUCATION_CERTIFICATE',
  'PREVIOUS_EMPLOYMENT_PROOF',
  'TAX_ID_PAN',
  'BANK_DETAILS',
  'PHOTO',
  'OTHER'
);

CREATE TYPE "OnboardingDocumentStatus" AS ENUM (
  'PENDING',
  'RECEIVED',
  'VERIFIED',
  'WAIVED'
);

CREATE TABLE "employees" (
  "id" UUID NOT NULL,
  "employee_code" VARCHAR(20) NOT NULL,
  "full_name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(30) NOT NULL,
  "work_email" VARCHAR(255),
  "job_title" VARCHAR(200) NOT NULL,
  "department_id" UUID NOT NULL,
  "employment_type" "EmploymentType" NOT NULL,
  "work_mode" "WorkMode" NOT NULL,
  "base_salary" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "expected_joining_date" DATE NOT NULL,
  "actual_joining_date" DATE,
  "hiring_manager_id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "offer_id" UUID NOT NULL,
  "requisition_id" UUID NOT NULL,
  "status" "EmployeeStatus" NOT NULL DEFAULT 'ONBOARDING',
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_cases" (
  "id" UUID NOT NULL,
  "offer_id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "requisition_id" UUID NOT NULL,
  "employee_id" UUID,
  "status" "OnboardingCaseStatus" NOT NULL DEFAULT 'PENDING',
  "started_at" TIMESTAMP(3),
  "joined_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "cancel_reason" TEXT,
  "started_by_id" UUID,
  "joined_by_id" UUID,
  "completed_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onboarding_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_tasks" (
  "id" UUID NOT NULL,
  "onboarding_case_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "phase" "OnboardingTaskPhase" NOT NULL,
  "owner_role" "OnboardingTaskOwner" NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "status" "OnboardingTaskStatus" NOT NULL DEFAULT 'PENDING',
  "due_date" DATE,
  "sort_order" INTEGER NOT NULL,
  "completed_at" TIMESTAMP(3),
  "completed_by_id" UUID,
  "skip_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onboarding_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "onboarding_documents" (
  "id" UUID NOT NULL,
  "onboarding_case_id" UUID NOT NULL,
  "document_type" "OnboardingDocumentType" NOT NULL,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "status" "OnboardingDocumentStatus" NOT NULL DEFAULT 'PENDING',
  "file_name" VARCHAR(255),
  "file_path" VARCHAR(500),
  "mime_type" VARCHAR(100),
  "uploaded_at" TIMESTAMP(3),
  "uploaded_by_id" UUID,
  "verified_at" TIMESTAMP(3),
  "verified_by_id" UUID,
  "waive_reason" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "onboarding_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
CREATE UNIQUE INDEX "employees_candidate_id_key" ON "employees"("candidate_id");
CREATE UNIQUE INDEX "employees_offer_id_key" ON "employees"("offer_id");
CREATE INDEX "employees_status_idx" ON "employees"("status");
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");
CREATE INDEX "employees_requisition_id_idx" ON "employees"("requisition_id");
CREATE INDEX "employees_hiring_manager_id_idx" ON "employees"("hiring_manager_id");
CREATE INDEX "employees_created_by_id_idx" ON "employees"("created_by_id");

CREATE UNIQUE INDEX "onboarding_cases_offer_id_key" ON "onboarding_cases"("offer_id");
CREATE UNIQUE INDEX "onboarding_cases_employee_id_key" ON "onboarding_cases"("employee_id");
CREATE INDEX "onboarding_cases_status_idx" ON "onboarding_cases"("status");
CREATE INDEX "onboarding_cases_candidate_id_idx" ON "onboarding_cases"("candidate_id");
CREATE INDEX "onboarding_cases_requisition_id_idx" ON "onboarding_cases"("requisition_id");

CREATE INDEX "onboarding_tasks_onboarding_case_id_phase_idx" ON "onboarding_tasks"("onboarding_case_id", "phase");
CREATE UNIQUE INDEX "onboarding_documents_onboarding_case_id_document_type_key" ON "onboarding_documents"("onboarding_case_id", "document_type");
CREATE INDEX "onboarding_documents_onboarding_case_id_idx" ON "onboarding_documents"("onboarding_case_id");

ALTER TABLE "employees"
ADD CONSTRAINT "employees_department_id_fkey"
FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_hiring_manager_id_fkey"
FOREIGN KEY ("hiring_manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_offer_id_fkey"
FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_requisition_id_fkey"
FOREIGN KEY ("requisition_id") REFERENCES "job_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employees"
ADD CONSTRAINT "employees_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_offer_id_fkey"
FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_requisition_id_fkey"
FOREIGN KEY ("requisition_id") REFERENCES "job_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_started_by_id_fkey"
FOREIGN KEY ("started_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_joined_by_id_fkey"
FOREIGN KEY ("joined_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_cases"
ADD CONSTRAINT "onboarding_cases_completed_by_id_fkey"
FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_tasks"
ADD CONSTRAINT "onboarding_tasks_onboarding_case_id_fkey"
FOREIGN KEY ("onboarding_case_id") REFERENCES "onboarding_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "onboarding_tasks"
ADD CONSTRAINT "onboarding_tasks_completed_by_id_fkey"
FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_documents"
ADD CONSTRAINT "onboarding_documents_onboarding_case_id_fkey"
FOREIGN KEY ("onboarding_case_id") REFERENCES "onboarding_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "onboarding_documents"
ADD CONSTRAINT "onboarding_documents_uploaded_by_id_fkey"
FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "onboarding_documents"
ADD CONSTRAINT "onboarding_documents_verified_by_id_fkey"
FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

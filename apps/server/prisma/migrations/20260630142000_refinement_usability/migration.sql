CREATE TYPE "HiringPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'INTERNSHIP', 'CONTRACT', 'PART_TIME');
CREATE TYPE "WorkMode" AS ENUM ('OFFICE', 'HYBRID', 'REMOTE');

ALTER TABLE "job_requisitions"
ADD COLUMN "skills" TEXT,
ADD COLUMN "hiring_priority" "HiringPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "employment_type" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN "work_mode" "WorkMode" NOT NULL DEFAULT 'HYBRID',
ADD COLUMN "salary_min" INTEGER,
ADD COLUMN "salary_max" INTEGER,
ADD COLUMN "experience_min" DECIMAL(4,1),
ADD COLUMN "experience_max" DECIMAL(4,1);

ALTER TABLE "candidates"
ADD COLUMN "resume_uploaded_at" TIMESTAMP(3),
ADD COLUMN "resume_uploaded_by_id" UUID,
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "rejection_comments" TEXT,
ADD COLUMN "rejected_at" TIMESTAMP(3),
ADD COLUMN "rejected_by_id" UUID;

CREATE TABLE "candidate_notes" (
  "id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "candidate_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "candidates_resume_uploaded_by_id_idx" ON "candidates"("resume_uploaded_by_id");
CREATE INDEX "candidates_rejected_by_id_idx" ON "candidates"("rejected_by_id");
CREATE INDEX "candidate_notes_candidate_id_idx" ON "candidate_notes"("candidate_id");
CREATE INDEX "candidate_notes_created_by_id_idx" ON "candidate_notes"("created_by_id");

ALTER TABLE "candidates"
ADD CONSTRAINT "candidates_resume_uploaded_by_id_fkey"
FOREIGN KEY ("resume_uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "candidates"
ADD CONSTRAINT "candidates_rejected_by_id_fkey"
FOREIGN KEY ("rejected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "candidate_notes"
ADD CONSTRAINT "candidate_notes_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "candidate_notes"
ADD CONSTRAINT "candidate_notes_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

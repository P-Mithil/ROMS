-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('APPLIED', 'SCREENING', 'SHORTLISTED', 'REJECTED');

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "requisition_id" UUID NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "total_experience_years" DECIMAL(4,1),
    "skills" TEXT,
    "current_company" VARCHAR(150),
    "current_location" VARCHAR(150),
    "notice_period_days" INTEGER,
    "resume_file_name" VARCHAR(255),
    "resume_file_path" VARCHAR(500),
    "resume_mime_type" VARCHAR(100),
    "status" "CandidateStatus" NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidates_requisition_id_email_key" ON "candidates"("requisition_id", "email");

-- CreateIndex
CREATE INDEX "candidates_requisition_id_idx" ON "candidates"("requisition_id");

-- CreateIndex
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- CreateIndex
CREATE INDEX "candidates_created_by_id_idx" ON "candidates"("created_by_id");

-- CreateIndex
CREATE INDEX "candidates_updated_by_id_idx" ON "candidates"("updated_by_id");

-- CreateIndex
CREATE INDEX "candidates_deleted_at_idx" ON "candidates"("deleted_at");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "job_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

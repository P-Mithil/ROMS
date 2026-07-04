-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'OPEN', 'CLOSED', 'REJECTED');

-- CreateTable
CREATE TABLE "job_requisitions" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "RequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "department_id" UUID NOT NULL,
    "hiring_manager_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "closed_at" TIMESTAMP(3),
    "close_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_requisitions_status_idx" ON "job_requisitions"("status");

-- CreateIndex
CREATE INDEX "job_requisitions_department_id_idx" ON "job_requisitions"("department_id");

-- CreateIndex
CREATE INDEX "job_requisitions_hiring_manager_id_idx" ON "job_requisitions"("hiring_manager_id");

-- CreateIndex
CREATE INDEX "job_requisitions_created_by_id_idx" ON "job_requisitions"("created_by_id");

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_hiring_manager_id_fkey" FOREIGN KEY ("hiring_manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requisitions" ADD CONSTRAINT "job_requisitions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "job_requisitions"
ADD COLUMN "submitted_at" TIMESTAMP(3),
ADD COLUMN "closed_by_id" UUID,
ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "job_requisitions_deleted_at_idx" ON "job_requisitions"("deleted_at");

-- AddForeignKey
ALTER TABLE "job_requisitions"
ADD CONSTRAINT "job_requisitions_closed_by_id_fkey"
FOREIGN KEY ("closed_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

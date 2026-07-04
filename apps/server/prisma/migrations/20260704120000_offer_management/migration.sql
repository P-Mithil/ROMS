-- Extend candidate lifecycle for offer management
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'SELECTED';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'OFFER_ACCEPTED';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'OFFER_DECLINED';

CREATE TYPE "OfferStatus" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVAL_REJECTED',
  'APPROVED',
  'EXTENDED',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
  'EXPIRED'
);

CREATE TABLE "offers" (
  "id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "requisition_id" UUID NOT NULL,
  "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "job_title" VARCHAR(200) NOT NULL,
  "employment_type" "EmploymentType" NOT NULL,
  "work_mode" "WorkMode" NOT NULL,
  "base_salary" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "joining_date" DATE NOT NULL,
  "valid_until" TIMESTAMP(3) NOT NULL,
  "terms" TEXT,
  "internal_notes" TEXT,
  "submitted_at" TIMESTAMP(3),
  "approved_by_id" UUID,
  "approved_at" TIMESTAMP(3),
  "approval_rejection_reason" TEXT,
  "extended_at" TIMESTAMP(3),
  "extended_by_id" UUID,
  "responded_at" TIMESTAMP(3),
  "decline_reason" TEXT,
  "response_notes" TEXT,
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_response_tokens" (
  "id" UUID NOT NULL,
  "offer_id" UUID NOT NULL,
  "token_hash" VARCHAR(255) NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "offer_response_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "offers_candidate_id_idx" ON "offers"("candidate_id");
CREATE INDEX "offers_requisition_id_idx" ON "offers"("requisition_id");
CREATE INDEX "offers_status_idx" ON "offers"("status");
CREATE INDEX "offers_created_by_id_idx" ON "offers"("created_by_id");
CREATE INDEX "offers_updated_by_id_idx" ON "offers"("updated_by_id");
CREATE INDEX "offers_approved_by_id_idx" ON "offers"("approved_by_id");
CREATE INDEX "offers_extended_by_id_idx" ON "offers"("extended_by_id");
CREATE INDEX "offers_deleted_at_idx" ON "offers"("deleted_at");

CREATE UNIQUE INDEX "offers_one_active_per_candidate_idx"
ON "offers"("candidate_id")
WHERE "status" IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVAL_REJECTED', 'APPROVED', 'EXTENDED')
  AND "deleted_at" IS NULL;

CREATE INDEX "offer_response_tokens_offer_id_idx" ON "offer_response_tokens"("offer_id");
CREATE INDEX "offer_response_tokens_token_hash_idx" ON "offer_response_tokens"("token_hash");

ALTER TABLE "offers"
ADD CONSTRAINT "offers_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "offers"
ADD CONSTRAINT "offers_requisition_id_fkey"
FOREIGN KEY ("requisition_id") REFERENCES "job_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "offers"
ADD CONSTRAINT "offers_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "offers"
ADD CONSTRAINT "offers_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "offers"
ADD CONSTRAINT "offers_approved_by_id_fkey"
FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "offers"
ADD CONSTRAINT "offers_extended_by_id_fkey"
FOREIGN KEY ("extended_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "offer_response_tokens"
ADD CONSTRAINT "offer_response_tokens_offer_id_fkey"
FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

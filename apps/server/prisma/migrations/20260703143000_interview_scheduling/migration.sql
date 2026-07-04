CREATE TYPE "InterviewRoundType" AS ENUM ('HR', 'TECHNICAL', 'MANAGERIAL', 'FINAL', 'CUSTOM');
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "InterviewMode" AS ENUM ('IN_PERSON', 'VIRTUAL', 'PHONE');

CREATE TABLE "interviews" (
  "id" UUID NOT NULL,
  "candidate_id" UUID NOT NULL,
  "requisition_id" UUID NOT NULL,
  "round_type" "InterviewRoundType" NOT NULL,
  "custom_round_label" VARCHAR(100),
  "sequence" INTEGER NOT NULL,
  "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "duration_minutes" INTEGER NOT NULL,
  "mode" "InterviewMode" NOT NULL,
  "location" VARCHAR(255),
  "meeting_link" VARCHAR(500),
  "instructions" TEXT,
  "completion_notes" TEXT,
  "cancellation_reason" TEXT,
  "feedback_summary" TEXT,
  "created_by_id" UUID NOT NULL,
  "updated_by_id" UUID,
  "completed_by_id" UUID,
  "completed_at" TIMESTAMP(3),
  "cancelled_by_id" UUID,
  "cancelled_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview_interviewers" (
  "id" UUID NOT NULL,
  "interview_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "interview_interviewers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interview_feedback" (
  "id" UUID NOT NULL,
  "interview_id" UUID NOT NULL,
  "created_by_id" UUID NOT NULL,
  "rating" INTEGER,
  "recommendation" VARCHAR(50),
  "strengths" TEXT,
  "concerns" TEXT,
  "summary" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "interview_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "interviews_candidate_id_round_type_sequence_key" ON "interviews"("candidate_id", "round_type", "sequence");
CREATE INDEX "interviews_candidate_id_idx" ON "interviews"("candidate_id");
CREATE INDEX "interviews_requisition_id_idx" ON "interviews"("requisition_id");
CREATE INDEX "interviews_status_idx" ON "interviews"("status");
CREATE INDEX "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");
CREATE INDEX "interviews_created_by_id_idx" ON "interviews"("created_by_id");
CREATE INDEX "interviews_updated_by_id_idx" ON "interviews"("updated_by_id");
CREATE INDEX "interviews_completed_by_id_idx" ON "interviews"("completed_by_id");
CREATE INDEX "interviews_cancelled_by_id_idx" ON "interviews"("cancelled_by_id");
CREATE INDEX "interviews_deleted_at_idx" ON "interviews"("deleted_at");

CREATE UNIQUE INDEX "interview_interviewers_interview_id_user_id_key" ON "interview_interviewers"("interview_id", "user_id");
CREATE INDEX "interview_interviewers_interview_id_idx" ON "interview_interviewers"("interview_id");
CREATE INDEX "interview_interviewers_user_id_idx" ON "interview_interviewers"("user_id");

CREATE UNIQUE INDEX "interview_feedback_interview_id_created_by_id_key" ON "interview_feedback"("interview_id", "created_by_id");
CREATE INDEX "interview_feedback_interview_id_idx" ON "interview_feedback"("interview_id");
CREATE INDEX "interview_feedback_created_by_id_idx" ON "interview_feedback"("created_by_id");

ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_requisition_id_fkey"
FOREIGN KEY ("requisition_id") REFERENCES "job_requisitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_updated_by_id_fkey"
FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_completed_by_id_fkey"
FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interviews"
ADD CONSTRAINT "interviews_cancelled_by_id_fkey"
FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interview_interviewers"
ADD CONSTRAINT "interview_interviewers_interview_id_fkey"
FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview_interviewers"
ADD CONSTRAINT "interview_interviewers_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "interview_feedback"
ADD CONSTRAINT "interview_feedback_interview_id_fkey"
FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview_feedback"
ADD CONSTRAINT "interview_feedback_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

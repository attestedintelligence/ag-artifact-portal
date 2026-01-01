-- Incremental Migration for AGA Evolution
-- Only adds NEW types, tables, and columns that don't exist yet

-- ============================================================================
-- NEW ENUMS (only if they don't exist)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "UserTier" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ArtifactStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'REVOKED', 'EXPIRED', 'TERMINATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EnforcementAction" AS ENUM ('BLOCK_START', 'KILL', 'ALERT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AnchorStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'ENDED', 'TERMINATED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "KeyClass" AS ENUM ('POLICY_ISSUER', 'ENFORCEMENT', 'CHAIN', 'CHECKPOINT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AttestorRole" AS ENUM ('WITNESS', 'AUDITOR', 'APPROVER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TxType" AS ENUM ('ARTIFACT_SEAL', 'CHECKPOINT_ANCHOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReceiptEventType" AS ENUM ('POLICY_LOADED', 'RUN_STARTED', 'MEASUREMENT_OK', 'DRIFT_DETECTED', 'MISSING_DATA', 'LATE_DATA', 'ENFORCEMENT_ACTION', 'RUN_ENDED', 'CHECKPOINT', 'BUNDLE_EXPORTED', 'ATTESTATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- KeyClass enum created above with correct values

-- ============================================================================
-- NEW COLUMNS ON EXISTING TABLES
-- ============================================================================

-- Add new columns to artifacts table
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "salt" VARCHAR(32);
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "evidence_commitment" VARCHAR(64);
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "issuer_identifier" VARCHAR(64);
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "disclosure_policy" JSONB;
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "policy_id" TEXT;
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "policy_version" INTEGER DEFAULT 1;
ALTER TABLE "artifacts" ADD COLUMN IF NOT EXISTS "policy_hash" VARCHAR(64);

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- CreateTable: policies
CREATE TABLE IF NOT EXISTS "policies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "policy_name" VARCHAR(255) NOT NULL,
    "policy_version" INTEGER NOT NULL DEFAULT 1,
    "policy_hash" VARCHAR(64) NOT NULL,
    "policy_rules" JSONB NOT NULL,
    "permitted_claim_types" JSONB NOT NULL,
    "substitution_rules" JSONB NOT NULL,
    "sensitivity_classifications" JSONB NOT NULL,
    "measurement_requirements" JSONB NOT NULL,
    "enforcement_actions_mapping" JSONB NOT NULL,
    "signature_b64" TEXT NOT NULL,
    "signing_key_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: governed_runs
CREATE TABLE IF NOT EXISTS "governed_runs" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "run_id" VARCHAR(64) NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "receipt_count" INTEGER NOT NULL DEFAULT 0,
    "head_sequence_number" INTEGER NOT NULL DEFAULT 0,
    "head_receipt_hash" VARCHAR(64),

    CONSTRAINT "governed_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: checkpoint_records
CREATE TABLE IF NOT EXISTS "checkpoint_records" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "start_sequence" INTEGER NOT NULL,
    "end_sequence" INTEGER NOT NULL,
    "event_count" INTEGER NOT NULL,
    "merkle_root" VARCHAR(64) NOT NULL,
    "anchor_network_id" VARCHAR(32),
    "anchor_tx_id" VARCHAR(64),
    "anchor_block_number" INTEGER,
    "anchor_block_hash" VARCHAR(64),
    "anchor_timestamp" TIMESTAMP(3),
    "anchor_confirmations" INTEGER NOT NULL DEFAULT 0,
    "signature_b64" TEXT NOT NULL,
    "signing_key_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoint_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: attestation_invites
CREATE TABLE IF NOT EXISTS "attestation_invites" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "email" VARCHAR(255),
    "role" "AttestorRole" NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "attestor_name" VARCHAR(255),
    "attestor_signature_b64" TEXT,
    "attestor_public_key_b64" VARCHAR(64),

    CONSTRAINT "attestation_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: arweave_transactions
CREATE TABLE IF NOT EXISTS "arweave_transactions" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT,
    "tx_id" VARCHAR(64) NOT NULL,
    "tx_type" "TxType" NOT NULL,
    "data_hash" VARCHAR(64) NOT NULL,
    "data_size_bytes" INTEGER NOT NULL,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arweave_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: action_records
CREATE TABLE IF NOT EXISTS "action_records" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "action_type" "EnforcementAction" NOT NULL,
    "reason_code" VARCHAR(64) NOT NULL,
    "receipt_hash" VARCHAR(64) NOT NULL,
    "local_time" TIMESTAMP(3) NOT NULL,
    "time_source" VARCHAR(32) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_records_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES (create if not exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS "policies_user_id_idx" ON "policies"("user_id");
CREATE INDEX IF NOT EXISTS "policies_policy_hash_idx" ON "policies"("policy_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "policies_user_id_policy_name_policy_version_key" ON "policies"("user_id", "policy_name", "policy_version");

CREATE UNIQUE INDEX IF NOT EXISTS "governed_runs_run_id_key" ON "governed_runs"("run_id");
CREATE INDEX IF NOT EXISTS "governed_runs_artifact_id_idx" ON "governed_runs"("artifact_id");

CREATE INDEX IF NOT EXISTS "checkpoint_records_run_id_idx" ON "checkpoint_records"("run_id");

CREATE UNIQUE INDEX IF NOT EXISTS "attestation_invites_token_key" ON "attestation_invites"("token");
CREATE INDEX IF NOT EXISTS "attestation_invites_token_idx" ON "attestation_invites"("token");

CREATE INDEX IF NOT EXISTS "artifacts_policy_id_idx" ON "artifacts"("policy_id");

CREATE INDEX IF NOT EXISTS "action_records_artifact_id_idx" ON "action_records"("artifact_id");
CREATE INDEX IF NOT EXISTS "action_records_run_id_idx" ON "action_records"("run_id");

-- ============================================================================
-- FOREIGN KEYS (add if not exist)
-- ============================================================================

DO $$ BEGIN
    ALTER TABLE "policies" ADD CONSTRAINT "policies_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_policy_id_fkey"
    FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "governed_runs" ADD CONSTRAINT "governed_runs_artifact_id_fkey"
    FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "checkpoint_records" ADD CONSTRAINT "checkpoint_records_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "governed_runs"("run_id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "attestation_invites" ADD CONSTRAINT "attestation_invites_artifact_id_fkey"
    FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "arweave_transactions" ADD CONSTRAINT "arweave_transactions_artifact_id_fkey"
    FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'AGA Evolution migration completed successfully' as status;

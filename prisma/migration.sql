-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ArtifactStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'REVOKED', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EnforcementAction" AS ENUM ('BLOCK_START', 'KILL', 'ALERT');

-- CreateEnum
CREATE TYPE "AnchorStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'ENDED', 'TERMINATED', 'FAILED');

-- CreateEnum
CREATE TYPE "KeyClass" AS ENUM ('POLICY_ISSUER', 'ENFORCEMENT', 'CHAIN', 'CHECKPOINT');

-- CreateEnum
CREATE TYPE "ReceiptEventType" AS ENUM ('POLICY_LOADED', 'RUN_STARTED', 'MEASUREMENT_OK', 'DRIFT_DETECTED', 'MISSING_DATA', 'LATE_DATA', 'ENFORCEMENT_ACTION', 'RUN_ENDED', 'CHECKPOINT', 'BUNDLE_EXPORTED', 'ATTESTATION');

-- CreateEnum
CREATE TYPE "AttestorRole" AS ENUM ('WITNESS', 'AUDITOR', 'APPROVER');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('ARTIFACT_SEAL', 'CHECKPOINT_ANCHOR');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "vault_id" TEXT NOT NULL,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "bytes_hash" VARCHAR(64) NOT NULL,
    "metadata_hash" VARCHAR(64) NOT NULL,
    "sealed_hash" VARCHAR(64) NOT NULL,
    "policy_id" TEXT,
    "policy_version" INTEGER NOT NULL DEFAULT 1,
    "policy_hash" VARCHAR(64),
    "status" "ArtifactStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "effective_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "measurement_cadence_ms" INTEGER NOT NULL DEFAULT 60000,
    "ttl_seconds" INTEGER,
    "enforcement_action" "EnforcementAction" NOT NULL DEFAULT 'KILL',
    "payload_included" BOOLEAN NOT NULL DEFAULT false,
    "payload_storage_ref" VARCHAR(255),
    "signing_key_id" VARCHAR(64) NOT NULL,
    "arweave_tx_id" VARCHAR(64),
    "arweave_anchor_status" "AnchorStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "salt" VARCHAR(32),
    "evidence_commitment" VARCHAR(64),
    "issuer_identifier" VARCHAR(64),
    "disclosure_policy" JSONB,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governed_runs" (
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

-- CreateTable
CREATE TABLE "checkpoint_records" (
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

-- CreateTable
CREATE TABLE "signing_keys" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" TEXT NOT NULL,
    "public_key_b64" VARCHAR(64) NOT NULL,
    "encrypted_private_key" TEXT,
    "key_encryption_salt" VARCHAR(64),
    "key_class" "KeyClass" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revocation_reason" VARCHAR(255),

    CONSTRAINT "signing_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "previous_leaf_hash" VARCHAR(64),
    "leaf_hash" VARCHAR(64) NOT NULL,
    "event_type" "ReceiptEventType" NOT NULL,
    "event_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "signature_b64" TEXT NOT NULL,
    "signing_key_id" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestation_invites" (
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

-- CreateTable
CREATE TABLE "arweave_transactions" (
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

-- CreateTable
CREATE TABLE "vault_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "status" "ArtifactStatus" NOT NULL,
    "settings_snapshot" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vault_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_records" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_vault_id_key" ON "users"("vault_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "magic_link_tokens_token_key" ON "magic_link_tokens"("token");

-- CreateIndex
CREATE INDEX "magic_link_tokens_token_idx" ON "magic_link_tokens"("token");

-- CreateIndex
CREATE INDEX "artifacts_user_id_idx" ON "artifacts"("user_id");

-- CreateIndex
CREATE INDEX "artifacts_status_idx" ON "artifacts"("status");

-- CreateIndex
CREATE INDEX "artifacts_sealed_hash_idx" ON "artifacts"("sealed_hash");

-- CreateIndex
CREATE INDEX "artifacts_policy_id_idx" ON "artifacts"("policy_id");

-- CreateIndex
CREATE INDEX "policies_user_id_idx" ON "policies"("user_id");

-- CreateIndex
CREATE INDEX "policies_policy_hash_idx" ON "policies"("policy_hash");

-- CreateIndex
CREATE UNIQUE INDEX "policies_user_id_policy_name_policy_version_key" ON "policies"("user_id", "policy_name", "policy_version");

-- CreateIndex
CREATE UNIQUE INDEX "governed_runs_run_id_key" ON "governed_runs"("run_id");

-- CreateIndex
CREATE INDEX "governed_runs_artifact_id_idx" ON "governed_runs"("artifact_id");

-- CreateIndex
CREATE INDEX "checkpoint_records_run_id_idx" ON "checkpoint_records"("run_id");

-- CreateIndex
CREATE INDEX "signing_keys_user_id_idx" ON "signing_keys"("user_id");

-- CreateIndex
CREATE INDEX "receipts_artifact_id_idx" ON "receipts"("artifact_id");

-- CreateIndex
CREATE INDEX "receipts_artifact_id_sequence_number_idx" ON "receipts"("artifact_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_artifact_id_sequence_number_key" ON "receipts"("artifact_id", "sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "attestation_invites_token_key" ON "attestation_invites"("token");

-- CreateIndex
CREATE INDEX "attestation_invites_token_idx" ON "attestation_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "vault_cards_artifact_id_key" ON "vault_cards"("artifact_id");

-- CreateIndex
CREATE INDEX "vault_cards_user_id_idx" ON "vault_cards"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vault_cards_user_id_artifact_id_key" ON "vault_cards"("user_id", "artifact_id");

-- CreateIndex
CREATE INDEX "action_records_artifact_id_idx" ON "action_records"("artifact_id");

-- CreateIndex
CREATE INDEX "action_records_run_id_idx" ON "action_records"("run_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "governed_runs" ADD CONSTRAINT "governed_runs_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_records" ADD CONSTRAINT "checkpoint_records_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "governed_runs"("run_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_keys" ADD CONSTRAINT "signing_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestation_invites" ADD CONSTRAINT "attestation_invites_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arweave_transactions" ADD CONSTRAINT "arweave_transactions_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_cards" ADD CONSTRAINT "vault_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vault_cards" ADD CONSTRAINT "vault_cards_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


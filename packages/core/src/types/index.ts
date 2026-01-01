/**
 * Attested Governance Artifacts (AGA) Core Types
 * Based on AGA Build Guide v1.0 and Spec v1.1.6
 */

// ============================================================================
// DOMAIN SEPARATORS (per spec Section 1.3)
// ============================================================================

export const DOMAIN_SEPARATORS = {
  BUNDLE: 'ai.bundle.v1:',
  RELEASE: 'ai.release.v1:',
  KEYRING: 'ai.keyring.v1:',
  SUBJECT: 'ai.subject.v1:',
} as const;

export type DomainSeparator = typeof DOMAIN_SEPARATORS[keyof typeof DOMAIN_SEPARATORS];

// ============================================================================
// ENFORCEMENT ACTIONS (per spec Section 10)
// ============================================================================

export type EnforcementAction = 'BLOCK_START' | 'KILL' | 'ALERT';
export type EnforcementDecision = 'CONTINUE' | 'QUARANTINE' | 'KILL' | 'NONE';

// ============================================================================
// RECEIPT TYPES (per spec Section 12.2)
// ============================================================================

export type ReceiptEventType =
  | 'POLICY_LOADED'
  | 'RUN_STARTED'
  | 'MEASUREMENT_OK'
  | 'DRIFT_DETECTED'
  | 'MISSING_DATA'
  | 'LATE_DATA'
  | 'ENFORCEMENT_ACTION'
  | 'RUN_ENDED'
  | 'CHECKPOINT'
  | 'BUNDLE_EXPORTED'
  | 'ATTESTATION';

export type ReasonCode =
  | 'OK'
  | 'HASH_MISMATCH_FILE'
  | 'TTL_EXPIRED'
  | 'SIGNATURE_INVALID'
  | 'SUBJECT_MISSING'
  | 'POLICY_MISMATCH'
  | 'DRIFT_INTEGRITY'
  | 'DRIFT_TELEMETRY'
  | 'MISSING_DATA'
  | 'LATE_DATA'
  | 'EXPIRED_ARTIFACT'
  | 'INVALID_SIGNATURE'
  | 'TSA_UNAVAILABLE'
  | 'REPLAY_DETECTED'
  | 'SEQUENCE_INVALID';

export type TimeSource = 'TSA' | 'DEGRADED_LOCAL';

// ============================================================================
// ARTIFACT STATUS (per spec Section 15.1)
// ============================================================================

export type ArtifactStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'REVOKED' | 'EXPIRED' | 'TERMINATED';

// ============================================================================
// KEY TYPES
// ============================================================================

export type KeyClass = 'BUNDLE' | 'RELEASE';

export interface SigningKey {
  public_key: string;      // Base64-encoded Ed25519 public key
  key_id: string;          // First 16 hex chars of SHA-256(public_key_bytes)
}

export interface Signer extends SigningKey {
  signature: string;       // Base64-encoded Ed25519 signature
}

export interface KeyScheduleEntry {
  key_id: string;
  public_key: string;
  stream_id?: string;
  created_at: string;
  revoked_at?: string;
}

// ============================================================================
// POLICY ARTIFACT (per spec Section 5 & Build Guide 2.2)
// ============================================================================

export interface MeasurementSpec {
  type: 'FILE_DIGEST';
  path: string;            // Relative POSIX path
  normalize: {
    line_endings: 'LF' | 'CRLF' | 'NONE';
    trim_trailing_whitespace: boolean;
    encoding: 'UTF-8' | 'BINARY';
  };
}

export interface IntegrityPolicy {
  container_image_digest?: string;   // sha256:<hex>
  config_digest: string;
  config_source: 'CONFIG_SOURCE_A' | 'CONFIG_SOURCE_B' | 'CONFIG_SOURCE_C';
  sbom_digest?: string;
}

export interface StreamDefinition {
  stream_id: string;
  cadence_seconds: number;
  drift_rule: {
    type: 'RANGE' | 'THRESHOLD';
    min?: number;
    max?: number;
    comparator?: '<' | '<=' | '>' | '>=' | '==' | '!=';
    value?: number;
  };
  missing_data_tolerance_seconds: number;
  late_data_policy: {
    grace_seconds: number;
  };
  enforcement_mapping: {
    on_drift: EnforcementAction;
    on_missing: EnforcementAction;
    on_late: EnforcementAction;
  };
}

export interface TelemetryPolicy {
  streams: StreamDefinition[];   // Max 5 per artifact
}

export interface EnforcementPolicy {
  on_drift: EnforcementDecision;
  on_ttl_expired: EnforcementDecision;
  on_signature_invalid: Exclude<EnforcementDecision, 'CONTINUE'>;  // CONTINUE forbidden
}

export interface PolicyArtifact {
  // Schema versioning
  schema_version: '1.0';
  protocol_version: '1.0';

  // Identity
  policy_version: number;
  vault_id: string;
  artifact_id: string;

  // Timestamps
  issued_at: string;         // ISO 8601 UTC with Z
  not_before: string;
  not_after: string | null;

  // Issuer
  issuer: Signer;

  // Subject binding
  subject_identifier: {
    bytes_hash: string;       // 64 char hex SHA-256
    metadata_hash: string;    // 64 char hex SHA-256
  };
  sealed_hash: string;        // Combined binding hash

  // Policies
  integrity_policy: IntegrityPolicy;
  telemetry_policy?: TelemetryPolicy;
  enforcement_policy: EnforcementPolicy;

  // Keys
  key_schedule: KeyScheduleEntry[];

  // Policy hash (computed)
  policy_hash: string;

  // Disclosure
  disclosure_policy: {
    payload_included: boolean;
    claims: string[];
  };

  // Attestations
  attestations: Attestation[];

  // Previous version linkage
  previous_artifact_ref?: {
    prior_artifact_id: string;
    prior_policy_hash: string;
  };
}

// ============================================================================
// RECEIPT (per spec Section 12 & Build Guide 6.3)
// ============================================================================

export interface Receipt {
  // Schema version
  receipt_v: '1';

  // Identity
  receipt_id: string;        // Hex SHA-256
  run_id: string;            // Hex (16-64 chars)

  // Chain linkage
  sequence_number: number;   // Starts at 1, monotonically increasing

  // Timestamps
  timestamp: string;         // ISO 8601 UTC with Z
  local_time: string;
  monotonic_counter: number;
  time_source: TimeSource;
  tsa_token?: string;

  // Event data
  event_type: ReceiptEventType;

  // Decision
  decision: {
    action: EnforcementDecision;
    reason_code: ReasonCode;
    details?: string;
  };

  // Policy reference
  policy: {
    policy_id: string;
  };

  // Measurement data (when applicable)
  measurement?: {
    composite_hash: string;
    mismatched_paths: string[];
  };

  // Chain hashes
  chain: {
    prev_receipt_hash: string;   // "0"*64 for first receipt
    this_receipt_hash: string;
  };

  // Signer
  signer: Signer;
}

// ============================================================================
// CHAIN HEAD (per Build Guide 6.4)
// ============================================================================

export interface ChainHead {
  chain_v: '1';
  run_id: string;
  receipt_count: number;
  head_counter: number;
  head_receipt_hash: string;
  head_receipt_path: string;
}

// ============================================================================
// ATTESTATION
// ============================================================================

export interface Attestation {
  attestor_id: string;
  role: 'witness' | 'auditor' | 'approver';
  attestor_name?: string;
  attestor_organization?: string;
  signature: string;
  public_key: string;
  timestamp: string;
}

export interface AttestationInvite {
  id: string;
  artifact_id: string;
  token: string;
  email?: string;
  role: 'witness' | 'auditor' | 'approver';
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
}

// ============================================================================
// BUNDLE MANIFEST (per Build Guide 6.5)
// ============================================================================

export interface BundleFile {
  path: string;              // POSIX path in ZIP
  sha256: string;            // 64 char hex
  size_bytes: number;
}

export interface BundleManifest {
  format_version: '1.0';
  min_verifier_version: '1.0.0';

  // Metadata
  created_at: string;
  bundle_id: string;

  // References
  policy_id: string;
  artifact_id: string;
  run_id: string;

  // Chain summary
  receipt_count: number;
  chain_head_hash: string;

  // Contents
  files: BundleFile[];
  components: string[];

  // Payload
  payload_included: boolean;

  // Verifier
  verifier: {
    name: string;
    version: string;
    entrypoint: string;
  };

  // Optional extensions
  optional: {
    merkle: 'SKIPPED' | object;
    anchor: 'SKIPPED' | object;
  };
}

// ============================================================================
// SUBJECT MANIFEST (per Build Guide 6.2)
// ============================================================================

export interface SubjectEntry {
  path: string;
  sha256: string;            // 64 char hex
  size_bytes: number;
  last_modified_at: string;  // Informational
}

export interface SubjectManifest {
  subject_v: '1';
  subject_root_hint: string;
  entries: SubjectEntry[];
  composite_subject_hash: string;   // 64 char hex
}

// ============================================================================
// VERIFIER OUTPUT (per spec Section 13.3)
// ============================================================================

export type VerifierVerdict = 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL';

export interface VerifierCheck {
  name: string;
  result: 'PASS' | 'FAIL';
  reason?: string;
}

export interface VerifierWarning {
  code: 'KEY_REVOKED_AFTER_SIGN' | 'KEY_REVOKED_NO_ANCHOR' | 'VERIFIER_OUTDATED';
  message: string;
}

export interface VerifierOutput {
  result: VerifierVerdict;
  exit_code: 0 | 1 | 2 | 3;   // 0=PASS, 1=FAIL, 2=WARN, 3=ERROR
  bundle_id: string;

  // Detailed checks
  checks: VerifierCheck[];
  warnings: VerifierWarning[];

  // Verified hashes
  verified_artifact_hash: string;
  verified_receipt_chain_head: string;

  // Metadata
  metadata: {
    format_version: string;
    payload_included: boolean;
    time_anchor: 'self-attested' | 'rfc3161';
    signing_key_id: string;
  };

  // Report hash for determinism verification
  report_hash: string;
  verifier_version: string;
}

// ============================================================================
// ACTION RECORD (per spec Section 10.4)
// ============================================================================

export interface ActionRecord {
  action_type: EnforcementAction;
  reason_code: ReasonCode;
  vault_id: string;
  artifact_id: string;
  run_id: string;
  receipt_hash: string;
  local_time: string;
  time_source: TimeSource;
  timestamp: string;
}

// ============================================================================
// ARWEAVE TRANSACTION
// ============================================================================

export interface ArweaveTransaction {
  id: string;
  tx_id: string;
  artifact_id?: string;
  tx_type: 'artifact_seal' | 'checkpoint_anchor';
  data_hash: string;
  data_size_bytes: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  confirmations: number;
  submitted_at?: string;
  confirmed_at?: string;
  created_at: string;
}

// ============================================================================
// VAULT CARD (for dashboard display)
// ============================================================================

export interface VaultCard {
  id: string;
  user_id: string;
  artifact_id: string;
  display_name: string;
  status: ArtifactStatus;
  created_at: string;
  expires_at?: string;
  settings_snapshot: {
    measurement_cadence_ms: number;
    enforcement_action: EnforcementAction;
    payload_included: boolean;
  };
  position: number;
  pinned: boolean;
  receipt_count?: number;
  last_measurement_at?: string;
}

// ============================================================================
// FILE METADATA (for client-side hashing)
// ============================================================================

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface HashedFile {
  bytes_hash: string;        // SHA-256 hex of file bytes
  metadata: FileMetadata;
  metadata_hash: string;     // SHA-256 hex of canonical metadata JSON
  sealed_hash: string;       // Combined subject identifier
}

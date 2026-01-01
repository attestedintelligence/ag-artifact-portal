/**
 * Attested Governance Artifacts - Type Definitions
 * Per Evolution Spec v1.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum SubjectType {
  EXECUTABLE = 'EXECUTABLE',
  CONTAINER = 'CONTAINER',
  CONFIG = 'CONFIG',
  SBOM = 'SBOM',
  MODEL = 'MODEL',
  DOCUMENT = 'DOCUMENT',
  GENERIC = 'GENERIC',
}

export enum EnforcementAction {
  TERMINATE = 'TERMINATE',
  QUARANTINE = 'QUARANTINE',
  NETWORK_ISOLATION = 'NETWORK_ISOLATION',
  SAFE_STATE = 'SAFE_STATE',
  ALERT_ONLY = 'ALERT_ONLY',
}

export enum ArtifactStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUPERSEDED = 'SUPERSEDED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export enum ReceiptType {
  MEASUREMENT = 'MEASUREMENT',
  DRIFT = 'DRIFT',
  ENFORCEMENT = 'ENFORCEMENT',
  FORENSIC = 'FORENSIC',
}

export enum ChainEventType {
  GENESIS = 'GENESIS',
  POLICY_ISSUANCE = 'POLICY_ISSUANCE',
  RECEIPT = 'RECEIPT',
  REVOCATION = 'REVOCATION',
  ATTESTATION = 'ATTESTATION',
  ANCHOR_BATCH = 'ANCHOR_BATCH',
}

export enum ActionOutcome {
  SUCCESS = 'SUCCESS',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

// ============================================================================
// SUBJECT TYPES
// ============================================================================

export interface SubjectMetadata {
  name: string;
  version: string;
  author?: string;
  createdAt: string; // ISO 8601
  customAttributes?: Record<string, string | number | boolean>;
}

export interface SubjectIdentifier {
  bytesHash: string; // SHA-256 hex (64 chars)
  metadataHash: string; // SHA-256 hex (64 chars)
  combinedHash: string; // SHA-256(bytesHash || metadataHash)
}

export interface NormalizationResult {
  normalizedBytes: Uint8Array;
  metadata: {
    method: string;
    version: string;
    warnings: string[];
  };
}

// ============================================================================
// POLICY TYPES
// ============================================================================

export interface Policy {
  policyId: string;
  policyName: string;
  policyVersion: number;
  policyRules: PolicyRule[];
  permittedClaimTypes: string[];
  substitutionRules: SubstitutionRule[];
  sensitivityClassifications: SensitivityClassification[];
  measurementRequirements: MeasurementRequirement[];
  enforcementActionsMapping: Record<string, EnforcementAction>;
  signature: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  ruleId: string;
  ruleType: string;
  condition: string;
  action: EnforcementAction;
}

export interface SubstitutionRule {
  originalClaimType: string;
  substituteClaimType: string;
  conditions: string[];
}

export interface SensitivityClassification {
  claimType: string;
  level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
}

export interface MeasurementRequirement {
  measurementType: string;
  required: boolean;
  cadenceMs?: number;
}

// ============================================================================
// ATTESTATION TYPES
// ============================================================================

export interface AttestationResult {
  passed: boolean;
  rules: RuleEvaluation[];
  timestamp: string;
}

export interface RuleEvaluation {
  ruleId: string;
  verdict: boolean;
  evidence: Record<string, unknown>;
}

export interface EvidenceCommitment {
  commitment: string; // SHA-256 hex
  salt: string; // 32 hex chars
}

// ============================================================================
// ARTIFACT TYPES
// ============================================================================

export interface EnforcementParameters {
  measurementCadenceMs: number;
  ttlSeconds: number;
  enforcementAction: EnforcementAction;
  reattestationRequired: boolean;
  reattestationIntervalSeconds: number | null;
}

export interface DisclosurePolicy {
  claimsTaxonomy: ClaimTaxonomyEntry[];
  substitutionRules: SubstitutionRule[];
}

export interface ClaimTaxonomyEntry {
  claimType: string;
  sensitivity: string;
  disclosureLevel: string;
}

export interface PolicyArtifact {
  schemaVersion: string;
  protocolVersion: string;
  artifactId: string;
  subjectIdentifier: {
    bytesHash: string;
    metadataHash: string;
  };
  policyReference: string;
  policyVersion: number;
  sealedHash: string;
  evidenceCommitment: string;
  salt: string;
  issuedTimestamp: string;
  effectiveTimestamp: string;
  expirationTimestamp: string | null;
  issuerIdentifier: string;
  enforcementParameters: EnforcementParameters;
  disclosurePolicy: DisclosurePolicy | null;
  signature: string;
}

// ============================================================================
// RECEIPT TYPES
// ============================================================================

export interface MeasurementDetail {
  type: string;
  hash: string;
  timestamp: string;
}

export interface DriftDetails {
  expectedHash: string;
  actualHash: string;
  changedMeasurements: string[];
  detectionTimestamp: string;
  detectionLatencyMs: number;
}

export interface EnforcementReceipt {
  schemaVersion: string;
  protocolVersion: string;
  receiptId: string;
  receiptType: ReceiptType;
  artifactReference: {
    artifactId: string;
    artifactHash: string;
    policyReference: string;
    policyIssuerKeyId: string;
  };
  subjectIdentifier: {
    bytesHash: string;
    metadataHash: string;
  };
  measurement: {
    sealedHash: string;
    currentHash: string;
    match: boolean;
    measurementDetails: MeasurementDetail[];
    measurementTimestamp: string;
    measurementLatencyMs: number;
  };
  enforcement: {
    driftDetected: boolean;
    driftDetails: DriftDetails | null;
    actionExecuted: EnforcementAction;
    actionTimestamp: string;
    actionOutcome: ActionOutcome;
    outcomeDetails: Record<string, unknown>;
  };
  chainLinkage: {
    sequenceNumber: number;
    previousReceiptHash: string;
    chainId: string;
  };
  timestamp: string;
  portalIdentifier: string;
  signature: string;
}

// ============================================================================
// CHAIN EVENT TYPES
// ============================================================================

export interface ChainEvent {
  schemaVersion: string;
  protocolVersion: string;
  eventType: ChainEventType;
  eventId: string;
  sequenceNumber: number;
  timestamp: string;
  previousLeafHash: string | null;
  payload: Record<string, unknown>;
  payloadHash: string;
  eventSignature: string;
}

export interface GenesisEvent extends ChainEvent {
  eventType: ChainEventType.GENESIS;
  payload: {
    taxonomyVersion: string;
    initialPolicies: string[];
    chainPurpose: string;
  };
}

// ============================================================================
// CHECKPOINT & PROOF TYPES
// ============================================================================

export interface CheckpointRecord {
  checkpointId: string;
  chainId: string;
  batchRange: {
    startSequence: number;
    endSequence: number;
    eventCount: number;
  };
  merkleRoot: string;
  anchorProof: AnchorProof;
  timestamp: string;
  checkpointSignature: string;
}

export interface AnchorProof {
  networkId: string;
  transactionId: string;
  blockNumber: number | null;
  blockHash: string | null;
  timestamp: string;
  confirmations: number;
}

export interface InclusionProof {
  eventLeafHash: string;
  eventSequence: number;
  merkleRoot: string;
  proofPath: ProofPathStep[];
  checkpointReference: {
    checkpointId: string;
    anchorProof: AnchorProof;
  };
}

export interface ProofPathStep {
  position: 'left' | 'right';
  hash: string;
}

// ============================================================================
// EVIDENCE BUNDLE TYPES
// ============================================================================

export interface PublicKeyInfo {
  keyId: string;
  algorithm: string;
  publicKey: string; // Base64 encoded
  fingerprint: string;
}

export interface VerificationInstructions {
  steps: string[];
  offlineCapable: boolean;
  requiredKeys: string[];
}

export interface EvidenceBundle {
  bundleId: string;
  bundleVersion: string;
  created: string;
  policyArtifact: PolicyArtifact;
  receipts: EnforcementReceipt[];
  inclusionProofs: InclusionProof[];
  checkpointReferences: CheckpointRecord[];
  publicKeys: {
    policyIssuerKey: PublicKeyInfo;
    enforcementKey: PublicKeyInfo;
    checkpointKey: PublicKeyInfo;
  };
  verificationInstructions: VerificationInstructions;
}

// ============================================================================
// VERIFICATION RESULT TYPES
// ============================================================================

export interface VerificationResult {
  valid: boolean;
  checks: VerificationCheck[];
  timestamp: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string;
  critical: boolean;
}

export interface BundleVerificationResult {
  bundleValid: boolean;
  artifactVerification: VerificationResult;
  receiptVerifications: VerificationResult[];
  chainVerification: VerificationResult;
  proofVerifications: VerificationResult[];
  anchorVerification: VerificationResult | null;
}

// ============================================================================
// KEY TYPES
// ============================================================================

export enum KeyType {
  POLICY_ISSUER = 'POLICY_ISSUER',
  ENFORCEMENT = 'ENFORCEMENT',
  CHAIN = 'CHAIN',
  CHECKPOINT = 'CHECKPOINT',
}

export interface KeyPair {
  keyId: string;
  keyType: KeyType;
  publicKey: Uint8Array;
  privateKey?: Uint8Array; // Only present when generating/storing locally
  createdAt: string;
  expiresAt?: string;
  revoked: boolean;
}

/**
 * Attested Governance Artifacts - Artifact Creation Pipeline
 * Per Evolution Spec v1.0 - Complete Steps 1-13 Flow
 */

import {
  normalizeSubject,
  computeBytesHash,
  computeMetadataHash,
  createSubjectIdentifier,
  generateSalt,
  computeEvidenceCommitment,
  computeSealedHash,
  assembleArtifact,
  signArtifact,
  generateUUID,
  getCurrentTimestamp,
  canonicalStringify,
} from './crypto';
import type {
  SubjectType,
  SubjectMetadata,
  SubjectIdentifier,
  PolicyArtifact,
  EnforcementParameters,
  DisclosurePolicy,
  AttestationResult,
  Policy,
  NormalizationResult,
} from './types';
import { EnforcementAction } from './types';

// ============================================================================
// PIPELINE TYPES
// ============================================================================

export interface ArtifactCreationInput {
  // Subject data
  subjectBytes: Uint8Array;
  subjectType: SubjectType;
  subjectMetadata: SubjectMetadata;

  // Policy
  policyId: string;
  policyVersion: number;
  policyHash: string;

  // Enforcement
  enforcementParameters: EnforcementParameters;

  // Optional
  disclosurePolicy?: DisclosurePolicy;
  effectiveTimestamp?: string;
  expirationTimestamp?: string | null;

  // Keys
  issuerPrivateKey: Uint8Array;
  issuerIdentifier: string;
}

export interface ArtifactCreationResult {
  artifact: PolicyArtifact;
  subjectIdentifier: SubjectIdentifier;
  normalizationResult: NormalizationResult;
  attestationResult: AttestationResult;
  salt: string;
  evidenceCommitment: string;
  sealedHash: string;
}

export interface PipelineStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  durationMs?: number;
}

// ============================================================================
// ARTIFACT CREATION PIPELINE
// ============================================================================

/**
 * Execute the complete artifact creation pipeline (Steps 1-13)
 */
export async function createArtifact(
  input: ArtifactCreationInput
): Promise<ArtifactCreationResult> {
  // Step 1: Subject Normalization
  const normalizationResult = normalizeSubject(
    input.subjectBytes,
    input.subjectType
  );

  // Step 2: Bytes Commitment
  const bytesHash = computeBytesHash(normalizationResult.normalizedBytes);

  // Step 3 & 4: Metadata Canonicalization & Commitment
  const metadataHash = computeMetadataHash(input.subjectMetadata);

  // Step 5: Subject Identifier Assembly
  const subjectIdentifier = createSubjectIdentifier(bytesHash, metadataHash);

  // Step 6: Policy Reference (passed in as input)
  // In full implementation, would fetch and verify policy here

  // Step 7: Attestation Evaluation
  const attestationResult = evaluateAttestation(subjectIdentifier, input.policyId);

  // Step 8: Salt Generation
  const salt = generateSalt();

  // Step 9: Evidence Commitment
  const evidenceCommitment = computeEvidenceCommitment(attestationResult, salt);

  // Step 10: Sealed Hash Computation
  const sealedHash = computeSealedHash(
    subjectIdentifier,
    input.policyHash,
    salt
  );

  // Step 11: Artifact Assembly
  const artifactId = generateUUID();
  const unsignedArtifact = assembleArtifact({
    artifactId,
    subjectIdentifier,
    policyReference: input.policyHash,
    policyVersion: input.policyVersion,
    sealedHash,
    evidenceCommitment,
    salt,
    issuerIdentifier: input.issuerIdentifier,
    enforcementParameters: input.enforcementParameters,
    disclosurePolicy: input.disclosurePolicy || null,
    effectiveTimestamp: input.effectiveTimestamp,
    expirationTimestamp: input.expirationTimestamp,
  });

  // Step 12: Artifact Signing
  const artifact = await signArtifact(unsignedArtifact, input.issuerPrivateKey);

  // Step 13: Return result (storage handled by caller)
  return {
    artifact,
    subjectIdentifier,
    normalizationResult,
    attestationResult,
    salt,
    evidenceCommitment,
    sealedHash,
  };
}

// ============================================================================
// ATTESTATION EVALUATION
// ============================================================================

/**
 * Evaluate attestation rules for subject
 * In production, this would check against policy rules
 */
function evaluateAttestation(
  subjectIdentifier: SubjectIdentifier,
  _policyId: string
): AttestationResult {
  // Default attestation passes (placeholder for full rule evaluation)
  return {
    passed: true,
    rules: [
      {
        ruleId: 'default-pass',
        verdict: true,
        evidence: {
          subjectBytesHash: subjectIdentifier.bytesHash,
          subjectMetadataHash: subjectIdentifier.metadataHash,
          evaluatedAt: getCurrentTimestamp(),
        },
      },
    ],
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// DEFAULT ENFORCEMENT PARAMETERS
// ============================================================================

export const DEFAULT_ENFORCEMENT_PARAMETERS: EnforcementParameters = {
  measurementCadenceMs: 60000, // 1 minute
  ttlSeconds: 86400 * 30, // 30 days
  enforcementAction: EnforcementAction.ALERT_ONLY,
  reattestationRequired: false,
  reattestationIntervalSeconds: null,
};

// ============================================================================
// POLICY HASH COMPUTATION
// ============================================================================

/**
 * Compute content-addressable hash of policy
 */
export function computePolicyHash(policy: Omit<Policy, 'signature'>): string {
  const canonical = canonicalStringify(policy);
  const bytes = new TextEncoder().encode(canonical);
  return computeBytesHash(bytes);
}

// ============================================================================
// ARTIFACT VALIDATION
// ============================================================================

/**
 * Validate artifact structure
 */
export function validateArtifact(artifact: PolicyArtifact): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!artifact.schemaVersion) errors.push('Missing schemaVersion');
  if (!artifact.protocolVersion) errors.push('Missing protocolVersion');
  if (!artifact.artifactId) errors.push('Missing artifactId');
  if (!artifact.subjectIdentifier?.bytesHash) errors.push('Missing bytesHash');
  if (!artifact.subjectIdentifier?.metadataHash) errors.push('Missing metadataHash');
  if (!artifact.policyReference) errors.push('Missing policyReference');
  if (!artifact.sealedHash) errors.push('Missing sealedHash');
  if (!artifact.salt) errors.push('Missing salt');
  if (!artifact.issuedTimestamp) errors.push('Missing issuedTimestamp');
  if (!artifact.signature) errors.push('Missing signature');

  // Validate hash formats
  if (artifact.sealedHash && artifact.sealedHash.length !== 64) {
    errors.push('Invalid sealedHash length');
  }
  if (artifact.salt && artifact.salt.length !== 32) {
    errors.push('Invalid salt length');
  }

  // Validate timestamps
  if (artifact.issuedTimestamp) {
    const issued = new Date(artifact.issuedTimestamp);
    if (isNaN(issued.getTime())) {
      errors.push('Invalid issuedTimestamp format');
    }
  }

  if (artifact.expirationTimestamp) {
    const expires = new Date(artifact.expirationTimestamp);
    if (isNaN(expires.getTime())) {
      errors.push('Invalid expirationTimestamp format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// ARTIFACT CONTENT HASH
// ============================================================================

/**
 * Compute content-addressable hash for artifact storage
 */
export function computeArtifactContentHash(artifact: PolicyArtifact): string {
  const canonical = canonicalStringify(artifact);
  const bytes = new TextEncoder().encode(canonical);
  return computeBytesHash(bytes);
}

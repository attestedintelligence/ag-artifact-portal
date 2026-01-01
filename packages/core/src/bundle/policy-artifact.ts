/**
 * PolicyArtifact Builder
 * Per AGA Build Guide Phase 2.2 and Spec v1.1.6
 *
 * Creates, signs, and validates Policy Artifacts with deterministic hashing.
 */

import {
  canonicalize,
  canonicalizeWithOmit,
  nowISO,
} from '../crypto/canonical';
import {
  signObject,
  verifyObject,
  bytesToBase64,
} from '../crypto/signature';
import { sha256String } from '../crypto/hash';
import { generateKeyIdHash } from '../crypto/keys';
import { DOMAIN_SEPARATORS } from '../types';
import type {
  PolicyArtifact,
  IntegrityPolicy,
  TelemetryPolicy,
  EnforcementPolicy,
  EnforcementDecision,
  EnforcementAction,
  KeyScheduleEntry,
  Attestation,
  Signer,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface ArtifactInput {
  // Subject binding
  bytesHash: string;           // 64 char hex
  metadataHash: string;        // 64 char hex

  // Metadata
  name: string;
  description?: string;

  // Runtime configuration
  measurementCadenceMs: number;
  ttlSeconds: number | null;
  enforcementAction: EnforcementAction;

  // Optional payload inclusion
  payloadIncluded?: boolean;
}

export interface CreateArtifactOptions {
  vaultId: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  input: ArtifactInput;
  previousArtifact?: {
    artifactId: string;
    policyHash: string;
  };
}

export interface ArtifactValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHEMA_VERSION = '1.0' as const;
const PROTOCOL_VERSION = '1.0' as const;

// Domain separator for sealed hash
const DOMAIN_SEPARATOR_SEAL = 'ai.bundle.v1:';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique artifact ID
 */
function generateArtifactId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(8));
  const randomPart = Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `art_${timestamp}${randomPart}`.slice(0, 32);
}

/**
 * Compute the sealed hash from bytes_hash and metadata_hash
 * Formula: SHA-256(domain_separator || bytes_hash || metadata_hash)
 */
export async function computeSealedHash(
  bytesHash: string,
  metadataHash: string
): Promise<string> {
  const input = `${DOMAIN_SEPARATOR_SEAL}${bytesHash}${metadataHash}`;
  return sha256String(input);
}

/**
 * Compute the policy_hash of a PolicyArtifact
 * Hash of canonical JSON with issuer.signature and policy_hash omitted
 */
export async function computePolicyHash(
  artifact: Omit<PolicyArtifact, 'policy_hash' | 'issuer'> & {
    issuer: Omit<Signer, 'signature'>;
  }
): Promise<string> {
  const canonical = canonicalize(artifact);
  return sha256String(canonical);
}

/**
 * Create the integrity policy from input
 */
function createIntegrityPolicy(input: ArtifactInput): IntegrityPolicy {
  return {
    config_digest: input.metadataHash,
    config_source: 'CONFIG_SOURCE_C', // Customer-provided canonical config
  };
}

/**
 * Create the enforcement policy from input
 */
function createEnforcementPolicy(
  action: EnforcementAction
): EnforcementPolicy {
  // Map the action to decisions
  const decisionMap: Record<EnforcementAction, EnforcementDecision> = {
    KILL: 'KILL',
    ALERT: 'CONTINUE',
    BLOCK_START: 'QUARANTINE',
  };

  return {
    on_drift: decisionMap[action],
    on_ttl_expired: decisionMap[action],
    on_signature_invalid: action === 'ALERT' ? 'QUARANTINE' : decisionMap[action] as Exclude<EnforcementDecision, 'CONTINUE'>,
  };
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Create and sign a new PolicyArtifact
 */
export async function createPolicyArtifact(
  options: CreateArtifactOptions
): Promise<PolicyArtifact> {
  const { vaultId, privateKey, publicKey, input, previousArtifact } = options;

  // Generate artifact ID
  const artifactId = generateArtifactId();

  // Compute sealed hash
  const sealedHash = await computeSealedHash(input.bytesHash, input.metadataHash);

  // Current timestamp
  const now = nowISO();

  // Calculate expiration
  const notAfter = input.ttlSeconds
    ? new Date(Date.now() + input.ttlSeconds * 1000).toISOString()
    : null;

  // Create key ID from public key hash
  const keyId = await generateKeyIdHash(publicKey);

  // Build the unsigned artifact
  const unsignedArtifact = {
    schema_version: SCHEMA_VERSION,
    protocol_version: PROTOCOL_VERSION,

    policy_version: 1,
    vault_id: vaultId,
    artifact_id: artifactId,

    issued_at: now,
    not_before: now,
    not_after: notAfter,

    issuer: {
      public_key: bytesToBase64(publicKey),
      key_id: keyId,
    },

    subject_identifier: {
      bytes_hash: input.bytesHash,
      metadata_hash: input.metadataHash,
    },
    sealed_hash: sealedHash,

    integrity_policy: createIntegrityPolicy(input),
    enforcement_policy: createEnforcementPolicy(input.enforcementAction),

    key_schedule: [
      {
        key_id: keyId,
        public_key: bytesToBase64(publicKey),
        created_at: now,
      },
    ] as KeyScheduleEntry[],

    disclosure_policy: {
      payload_included: input.payloadIncluded ?? false,
      claims: ['bytes_hash', 'metadata_hash', 'sealed_hash'],
    },

    attestations: [] as Attestation[],

    ...(previousArtifact && {
      previous_artifact_ref: {
        prior_artifact_id: previousArtifact.artifactId,
        prior_policy_hash: previousArtifact.policyHash,
      },
    }),
  };

  // Compute policy hash
  const policyHash = await computePolicyHash(unsignedArtifact);

  // Add policy hash
  const artifactWithHash = {
    ...unsignedArtifact,
    policy_hash: policyHash,
  };

  // Sign the artifact
  const signResult = await signObject(
    privateKey,
    DOMAIN_SEPARATORS.BUNDLE,
    artifactWithHash as unknown as Record<string, unknown>,
    ['issuer.signature']
  );

  // Create the final artifact
  const artifact: PolicyArtifact = {
    ...artifactWithHash,
    issuer: {
      ...artifactWithHash.issuer,
      signature: signResult.signature,
    },
  };

  return artifact;
}

/**
 * Verify a PolicyArtifact's signature and integrity
 */
export async function verifyPolicyArtifact(
  artifact: PolicyArtifact
): Promise<ArtifactValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verify schema version
  if (artifact.schema_version !== SCHEMA_VERSION) {
    errors.push(`Invalid schema version: ${artifact.schema_version}`);
  }

  // 2. Verify policy hash
  const artifactWithoutSignature = {
    ...artifact,
    issuer: {
      public_key: artifact.issuer.public_key,
      key_id: artifact.issuer.key_id,
    },
    policy_hash: undefined,
  };

  const computedPolicyHash = await computePolicyHash(
    artifactWithoutSignature as Parameters<typeof computePolicyHash>[0]
  );

  if (computedPolicyHash !== artifact.policy_hash) {
    errors.push('Policy hash mismatch');
  }

  // 3. Verify sealed hash
  const computedSealedHash = await computeSealedHash(
    artifact.subject_identifier.bytes_hash,
    artifact.subject_identifier.metadata_hash
  );

  if (computedSealedHash !== artifact.sealed_hash) {
    errors.push('Sealed hash mismatch');
  }

  // 4. Verify signature
  try {
    const isValid = await verifyObject(
      artifact.issuer.public_key,
      artifact.issuer.signature,
      DOMAIN_SEPARATORS.BUNDLE,
      artifact as unknown as Record<string, unknown>,
      ['issuer.signature']
    );

    if (!isValid) {
      errors.push('Invalid issuer signature');
    }
  } catch (err) {
    errors.push(`Signature verification failed: ${err}`);
  }

  // 5. Check validity window
  const now = new Date();
  const notBefore = new Date(artifact.not_before);

  if (now < notBefore) {
    warnings.push('Artifact not yet valid (not_before is in future)');
  }

  if (artifact.not_after) {
    const notAfter = new Date(artifact.not_after);
    if (now > notAfter) {
      errors.push('Artifact has expired');
    }
  }

  // 6. Verify key schedule
  const issuerKeyInSchedule = artifact.key_schedule.some(
    (k) => k.key_id === artifact.issuer.key_id
  );

  if (!issuerKeyInSchedule) {
    warnings.push('Issuer key not found in key schedule');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Add an attestation to a PolicyArtifact
 * Returns a new artifact with the attestation added
 */
export async function addAttestation(
  artifact: PolicyArtifact,
  attestation: Omit<Attestation, 'signature'>,
  privateKey: Uint8Array
): Promise<PolicyArtifact> {
  // Sign the attestation
  const attestationData = {
    artifact_id: artifact.artifact_id,
    policy_hash: artifact.policy_hash,
    attestor_id: attestation.attestor_id,
    role: attestation.role,
    timestamp: attestation.timestamp,
  };

  const signResult = await signObject(
    privateKey,
    DOMAIN_SEPARATORS.BUNDLE,
    attestationData
  );

  const signedAttestation: Attestation = {
    ...attestation,
    signature: signResult.signature,
  };

  // Return new artifact with attestation added
  return {
    ...artifact,
    attestations: [...artifact.attestations, signedAttestation],
  };
}

/**
 * Serialize a PolicyArtifact to canonical JSON
 */
export function serializeArtifact(artifact: PolicyArtifact): string {
  return canonicalize(artifact);
}

/**
 * Parse and validate a PolicyArtifact from JSON
 */
export async function parseArtifact(
  json: string
): Promise<{ artifact: PolicyArtifact; validation: ArtifactValidationResult }> {
  const artifact = JSON.parse(json) as PolicyArtifact;
  const validation = await verifyPolicyArtifact(artifact);
  return { artifact, validation };
}

/**
 * Extract display information from an artifact
 */
export function getArtifactDisplayInfo(artifact: PolicyArtifact) {
  return {
    id: artifact.artifact_id,
    vaultId: artifact.vault_id,
    issuedAt: artifact.issued_at,
    expiresAt: artifact.not_after,
    sealedHash: artifact.sealed_hash,
    policyHash: artifact.policy_hash,
    issuerId: artifact.issuer.key_id,
    attestationCount: artifact.attestations.length,
    payloadIncluded: artifact.disclosure_policy.payload_included,
    hasExpiration: artifact.not_after !== null,
  };
}

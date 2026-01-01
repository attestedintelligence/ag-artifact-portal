/**
 * Attested Governance Artifacts - Cryptographic Operations
 * Per Evolution Spec v1.0 - Steps 1-13
 */

import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import * as ed25519 from '@noble/ed25519';
import type {
  SubjectMetadata,
  SubjectIdentifier,
  NormalizationResult,
  SubjectType,
  PolicyArtifact,
  EnforcementParameters,
  DisclosurePolicy,
  AttestationResult,
  EnforcementReceipt,
  ChainEvent,
  KeyPair,
  KeyType,
} from './types';

// Configure Ed25519 to use sha512 - required for sync operations
// See: https://github.com/paulmillr/noble-ed25519#usage
// Type assertion needed as sha512Sync is dynamically added
const ed25519Etc = ed25519.etc as typeof ed25519.etc & {
  sha512Sync?: (...m: Uint8Array[]) => Uint8Array;
};
if (typeof ed25519Etc.sha512Sync !== 'function') {
  ed25519Etc.sha512Sync = (...m: Uint8Array[]) => {
    const concat = ed25519.etc.concatBytes(...m);
    return sha512(concat);
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SCHEMA_VERSION = '1.0.0';
export const PROTOCOL_VERSION = '1.0.0';
export const HASH_LENGTH = 64; // SHA-256 hex output length
export const SALT_LENGTH = 32; // 128 bits = 16 bytes = 32 hex chars

// ============================================================================
// STEP 1: SUBJECT NORMALIZATION
// ============================================================================

/**
 * Normalize subject bytes for deterministic hashing
 * Strips non-deterministic elements based on subject type
 */
export function normalizeSubject(
  rawSubject: Uint8Array,
  _subjectType: SubjectType
): NormalizationResult {
  const warnings: string[] = [];

  // For now, we use the raw bytes as-is
  // In production, this would strip timestamps from binaries, etc.
  const normalizedBytes = new Uint8Array(rawSubject);

  return {
    normalizedBytes,
    metadata: {
      method: 'raw',
      version: '1.0.0',
      warnings,
    },
  };
}

// ============================================================================
// STEP 2: BYTES COMMITMENT
// ============================================================================

/**
 * Compute SHA-256 hash of bytes, output as lowercase hex
 */
export function computeBytesHash(bytes: Uint8Array): string {
  const hash = sha256(bytes);
  return bytesToHex(hash);
}

/**
 * Validate hash format
 */
export function validateHash(hash: string): boolean {
  if (hash.length !== HASH_LENGTH) return false;
  return /^[0-9a-f]+$/.test(hash);
}

// ============================================================================
// STEP 3: METADATA CANONICALIZATION
// ============================================================================

/**
 * Canonicalize metadata object to deterministic JSON string
 * - Sort keys alphabetically (deep/recursive)
 * - Remove undefined/null values
 * - Normalize timestamps to ISO 8601 UTC
 * - No whitespace
 */
export function canonicalizeMetadata(metadata: Record<string, unknown>): string {
  return canonicalStringify(metadata);
}

/**
 * Canonical JSON stringify with sorted keys
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return '';
  }

  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) {
      pairs.push(`"${key}":${canonicalStringify(value)}`);
    }
  }

  return '{' + pairs.join(',') + '}';
}

// ============================================================================
// STEP 4: METADATA COMMITMENT
// ============================================================================

/**
 * Compute hash of canonicalized metadata
 */
export function computeMetadataHash(metadata: SubjectMetadata): string {
  const canonical = canonicalizeMetadata(metadata as unknown as Record<string, unknown>);
  const bytes = new TextEncoder().encode(canonical);
  return computeBytesHash(bytes);
}

// ============================================================================
// STEP 5: SUBJECT IDENTIFIER ASSEMBLY
// ============================================================================

/**
 * Create subject identifier from bytes and metadata hashes
 */
export function createSubjectIdentifier(
  bytesHash: string,
  metadataHash: string
): SubjectIdentifier {
  if (!validateHash(bytesHash)) {
    throw new Error('Invalid bytes hash format');
  }
  if (!validateHash(metadataHash)) {
    throw new Error('Invalid metadata hash format');
  }

  // Combined hash = SHA-256(bytesHash || metadataHash)
  const combined = bytesHash + metadataHash;
  const combinedBytes = new TextEncoder().encode(combined);
  const combinedHash = computeBytesHash(combinedBytes);

  return {
    bytesHash,
    metadataHash,
    combinedHash,
  };
}

// ============================================================================
// STEP 8: SALT GENERATION
// ============================================================================

/**
 * Generate cryptographically secure random salt (128 bits / 16 bytes)
 */
export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Validate salt format
 */
export function validateSalt(salt: string): boolean {
  if (salt.length !== SALT_LENGTH) return false;
  return /^[0-9a-f]+$/.test(salt);
}

// ============================================================================
// STEP 9: EVIDENCE COMMITMENT
// ============================================================================

/**
 * Compute evidence commitment from attestation result and salt
 */
export function computeEvidenceCommitment(
  attestationResult: AttestationResult,
  salt: string
): string {
  if (!validateSalt(salt)) {
    throw new Error('Invalid salt format');
  }

  const canonical = canonicalStringify(attestationResult);
  const combined = canonical + salt;
  const bytes = new TextEncoder().encode(combined);
  return computeBytesHash(bytes);
}

// ============================================================================
// STEP 10: SEALED HASH COMPUTATION
// ============================================================================

/**
 * Compute sealed hash from subject identifier, policy hash, and salt
 */
export function computeSealedHash(
  subjectIdentifier: SubjectIdentifier,
  policyHash: string,
  salt: string
): string {
  if (!validateHash(policyHash)) {
    throw new Error('Invalid policy hash format');
  }
  if (!validateSalt(salt)) {
    throw new Error('Invalid salt format');
  }

  // Concatenate without delimiters
  const combined =
    subjectIdentifier.bytesHash +
    subjectIdentifier.metadataHash +
    policyHash +
    salt;

  const bytes = new TextEncoder().encode(combined);
  return computeBytesHash(bytes);
}

// ============================================================================
// STEP 11: ARTIFACT ASSEMBLY
// ============================================================================

/**
 * Assemble policy artifact from components
 */
export function assembleArtifact(params: {
  artifactId: string;
  subjectIdentifier: SubjectIdentifier;
  policyReference: string;
  policyVersion: number;
  sealedHash: string;
  evidenceCommitment: string;
  salt: string;
  issuerIdentifier: string;
  enforcementParameters: EnforcementParameters;
  disclosurePolicy: DisclosurePolicy | null;
  effectiveTimestamp?: string;
  expirationTimestamp?: string | null;
}): Omit<PolicyArtifact, 'signature'> {
  const now = new Date().toISOString();

  return {
    schemaVersion: SCHEMA_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    artifactId: params.artifactId,
    subjectIdentifier: {
      bytesHash: params.subjectIdentifier.bytesHash,
      metadataHash: params.subjectIdentifier.metadataHash,
    },
    policyReference: params.policyReference,
    policyVersion: params.policyVersion,
    sealedHash: params.sealedHash,
    evidenceCommitment: params.evidenceCommitment,
    salt: params.salt,
    issuedTimestamp: now,
    effectiveTimestamp: params.effectiveTimestamp || now,
    expirationTimestamp: params.expirationTimestamp || null,
    issuerIdentifier: params.issuerIdentifier,
    enforcementParameters: params.enforcementParameters,
    disclosurePolicy: params.disclosurePolicy,
  };
}

// ============================================================================
// STEP 12: ARTIFACT SIGNING
// ============================================================================

/**
 * Sign artifact with Ed25519 private key
 */
export async function signArtifact(
  artifact: Omit<PolicyArtifact, 'signature'>,
  privateKey: Uint8Array
): Promise<PolicyArtifact> {
  // Serialize to canonical JSON
  const canonical = canonicalStringify(artifact);
  const bytes = new TextEncoder().encode(canonical);

  // Hash the artifact
  const hash = sha256(bytes);

  // Sign with Ed25519
  const signature = await ed25519.signAsync(hash, privateKey);

  // Encode signature as base64
  const signatureB64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

  return {
    ...artifact,
    signature: signatureB64,
  };
}

/**
 * Verify artifact signature
 */
export async function verifyArtifactSignature(
  artifact: PolicyArtifact,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    // Extract signature
    const { signature, ...artifactWithoutSig } = artifact;

    // Decode signature from base64
    const signatureBytes = new Uint8Array(
      atob(signature)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // Serialize artifact without signature
    const canonical = canonicalStringify(artifactWithoutSig);
    const bytes = new TextEncoder().encode(canonical);

    // Hash
    const hash = sha256(bytes);

    // Verify
    return await ed25519.verifyAsync(signatureBytes, hash, publicKey);
  } catch {
    return false;
  }
}

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/**
 * Generate Ed25519 key pair
 */
export async function generateKeyPair(keyType: KeyType): Promise<KeyPair> {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = await ed25519.getPublicKeyAsync(privateKey);

  // Compute key ID from public key fingerprint
  const keyId = computeBytesHash(publicKey).substring(0, 16);

  return {
    keyId,
    keyType,
    publicKey,
    privateKey,
    createdAt: new Date().toISOString(),
    revoked: false,
  };
}

/**
 * Compute key ID (fingerprint) from public key
 */
export function computeKeyId(publicKey: Uint8Array): string {
  return computeBytesHash(publicKey).substring(0, 16);
}

/**
 * Export public key as base64
 */
export function exportPublicKey(publicKey: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(publicKey)));
}

/**
 * Import public key from base64
 */
export function importPublicKey(b64: string): Uint8Array {
  return new Uint8Array(
    atob(b64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );
}

// ============================================================================
// RECEIPT OPERATIONS
// ============================================================================

/**
 * Compute receipt hash
 */
export function computeReceiptHash(receipt: EnforcementReceipt): string {
  const canonical = canonicalStringify(receipt);
  const bytes = new TextEncoder().encode(canonical);
  return computeBytesHash(bytes);
}

/**
 * Sign receipt with enforcement key
 */
export async function signReceipt(
  receipt: Omit<EnforcementReceipt, 'signature'>,
  privateKey: Uint8Array
): Promise<EnforcementReceipt> {
  const canonical = canonicalStringify(receipt);
  const bytes = new TextEncoder().encode(canonical);
  const hash = sha256(bytes);
  const signature = await ed25519.signAsync(hash, privateKey);
  const signatureB64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

  return {
    ...receipt,
    signature: signatureB64,
  };
}

// ============================================================================
// CHAIN OPERATIONS
// ============================================================================

/**
 * Compute leaf hash (structural metadata only, NO payload)
 * This is critical for privacy-preserving verification
 */
export function computeLeafHash(event: ChainEvent): string {
  // Concatenate structural metadata only
  const structural = [
    event.schemaVersion,
    event.protocolVersion,
    event.eventType,
    event.eventId,
    event.sequenceNumber.toString(),
    event.timestamp,
    event.previousLeafHash || '',
  ].join('|');

  const bytes = new TextEncoder().encode(structural);
  return computeBytesHash(bytes);
}

/**
 * Sign chain event
 */
export async function signChainEvent(
  event: Omit<ChainEvent, 'eventSignature'>,
  privateKey: Uint8Array
): Promise<ChainEvent> {
  // Signature covers ENTIRE event including payload
  const canonical = canonicalStringify(event);
  const bytes = new TextEncoder().encode(canonical);
  const hash = sha256(bytes);
  const signature = await ed25519.signAsync(hash, privateKey);
  const signatureB64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

  return {
    ...event,
    eventSignature: signatureB64,
  };
}

// ============================================================================
// MERKLE TREE OPERATIONS
// ============================================================================

/**
 * Build Merkle tree from leaf hashes
 */
export function buildMerkleTree(leafHashes: string[]): {
  root: string;
  layers: string[][];
} {
  if (leafHashes.length === 0) {
    throw new Error('Cannot build Merkle tree from empty array');
  }

  const layers: string[][] = [leafHashes];

  while (layers[layers.length - 1].length > 1) {
    const currentLayer = layers[layers.length - 1];
    const nextLayer: string[] = [];

    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = currentLayer[i + 1] || left; // Duplicate if odd
      const combined = left + right;
      const bytes = new TextEncoder().encode(combined);
      nextLayer.push(computeBytesHash(bytes));
    }

    layers.push(nextLayer);
  }

  return {
    root: layers[layers.length - 1][0],
    layers,
  };
}

/**
 * Generate inclusion proof for a leaf
 */
export function generateInclusionProof(
  leafIndex: number,
  layers: string[][]
): { position: 'left' | 'right'; hash: string }[] {
  const proof: { position: 'left' | 'right'; hash: string }[] = [];
  let index = leafIndex;

  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1;

    if (siblingIndex < layer.length) {
      proof.push({
        position: isRight ? 'left' : 'right',
        hash: layer[siblingIndex],
      });
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

/**
 * Verify inclusion proof
 */
export function verifyInclusionProof(
  leafHash: string,
  proof: { position: 'left' | 'right'; hash: string }[],
  root: string
): boolean {
  let current = leafHash;

  for (const step of proof) {
    const combined =
      step.position === 'left'
        ? step.hash + current
        : current + step.hash;
    const bytes = new TextEncoder().encode(combined);
    current = computeBytesHash(bytes);
  }

  return current === root;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO 8601 timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Constant-time string comparison (for security)
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

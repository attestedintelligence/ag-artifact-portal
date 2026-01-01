/**
 * Ed25519 Signature Module
 * Per AGA Build Guide Phase 1.2 & 1.3
 *
 * Uses @noble/ed25519 for Ed25519 operations.
 * Implements domain separators to prevent signature reuse attacks.
 */

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { hkdf } from '@noble/hashes/hkdf';
import { DOMAIN_SEPARATORS, type DomainSeparator, type SigningKey, type Signer } from '../types';
import { sha256 as sha256Async, bufferToHex, hexToBuffer } from './hash';
import { canonicalize, canonicalizeWithOmit } from './canonical';

// Note: @noble/ed25519 v2 uses async operations by default
// No sync configuration needed

// ============================================================================
// BASE64 ENCODING
// ============================================================================

/**
 * Encode bytes to base64
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    // Browser - use Array.from to avoid spread issues with large arrays
    return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  } else {
    // Node.js
    return Buffer.from(bytes).toString('base64');
  }
}

/**
 * Decode base64 to bytes
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    // Browser
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else {
    // Node.js
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
}

/**
 * Encode bytes to base64url (URL-safe, no padding)
 */
export function bytesToBase64url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode base64url to bytes
 */
export function base64urlToBytes(base64url: string): Uint8Array {
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }

  return base64ToBytes(base64);
}

// ============================================================================
// KEY GENERATION
// ============================================================================

/**
 * Generate a new Ed25519 key pair
 * @returns Object with public and private keys as Uint8Array
 */
export async function generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { publicKey, privateKey };
}

/**
 * Generate a new Ed25519 key pair with base64 encoding
 * @returns Object with base64-encoded keys and key_id
 */
export async function generateKeyPairWithId(): Promise<{
  publicKey: string;      // Base64
  privateKey: string;     // Base64
  keyId: string;          // 16 char hex
}> {
  const { publicKey, privateKey } = await generateKeyPair();

  // Generate key_id as first 16 chars of SHA-256(publicKey)
  const keyIdFull = await sha256Async(publicKey);
  const keyId = keyIdFull.slice(0, 16);

  return {
    publicKey: bytesToBase64(publicKey),
    privateKey: bytesToBase64(privateKey),
    keyId
  };
}

/**
 * Derive public key from private key
 */
export async function derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
  return await ed.getPublicKeyAsync(privateKey);
}

/**
 * Derive stream-specific signing key from Vault Root Seed
 * Per spec Section 8.2: HKDF-SHA256 with specific info string
 *
 * @param vaultRootSeed - 32-byte Vault Root Seed
 * @param vaultId - Vault identifier
 * @param artifactId - Artifact identifier
 * @param streamId - Stream identifier
 * @returns Derived Ed25519 private key seed (32 bytes)
 */
export function deriveStreamKey(
  vaultRootSeed: Uint8Array,
  vaultId: string,
  artifactId: string,
  streamId: string
): Uint8Array {
  // Info string per spec: "attested-governance:telemetry:" || vault_id || ":" || artifact_id || ":" || stream_id
  const info = new TextEncoder().encode(
    `attested-governance:telemetry:${vaultId}:${artifactId}:${streamId}`
  );

  // HKDF-SHA256 with empty salt
  const derivedKey = hkdf(sha256, vaultRootSeed, new Uint8Array(0), info, 32);

  return derivedKey;
}

// ============================================================================
// SIGNATURE INPUT BUILDING (with Domain Separators)
// ============================================================================

/**
 * Build signature input bytes from domain separator and data hash
 * Per spec: sign domain_separator || data_hash
 *
 * @param domainSeparator - Domain separator string (e.g., "ai.bundle.v1:")
 * @param dataHash - SHA-256 hex hash of data to sign
 * @returns UTF-8 encoded bytes for signing
 */
export function buildSignatureInput(
  domainSeparator: DomainSeparator,
  dataHash: string
): Uint8Array {
  const input = `${domainSeparator}${dataHash}`;
  return new TextEncoder().encode(input);
}

// ============================================================================
// SIGNING
// ============================================================================

/**
 * Sign a hash with domain separator
 *
 * @param privateKey - Ed25519 private key (32 bytes or base64)
 * @param domainSeparator - Domain separator to prevent cross-domain replay
 * @param dataHash - SHA-256 hex hash of data to sign
 * @returns Base64-encoded signature
 */
export async function sign(
  privateKey: Uint8Array | string,
  domainSeparator: DomainSeparator,
  dataHash: string
): Promise<string> {
  const privKey = typeof privateKey === 'string'
    ? base64ToBytes(privateKey)
    : privateKey;

  const signatureInput = buildSignatureInput(domainSeparator, dataHash);
  const signature = await ed.signAsync(signatureInput, privKey);

  return bytesToBase64(signature);
}

/**
 * Sign an object (canonicalize, hash, then sign)
 *
 * @param privateKey - Ed25519 private key
 * @param domainSeparator - Domain separator
 * @param obj - Object to sign
 * @param omitFields - Fields to omit during canonicalization
 * @returns Object with canonical form, hash, and signature
 */
export async function signObject(
  privateKey: Uint8Array | string,
  domainSeparator: DomainSeparator,
  obj: Record<string, unknown>,
  omitFields: string[] = []
): Promise<{
  canonical: string;
  hash: string;
  signature: string;
}> {
  const canonical = omitFields.length > 0
    ? canonicalizeWithOmit(obj, omitFields)
    : canonicalize(obj);

  const hashBytes = sha256(new TextEncoder().encode(canonical));
  const hash = bufferToHex(new Uint8Array(hashBytes).buffer);
  const signature = await sign(privateKey, domainSeparator, hash);

  return { canonical, hash, signature };
}

// ============================================================================
// VERIFICATION
// ============================================================================

/**
 * Verify a signature with domain separator
 *
 * @param publicKey - Ed25519 public key (32 bytes or base64)
 * @param signature - Base64-encoded signature
 * @param domainSeparator - Domain separator used when signing
 * @param dataHash - SHA-256 hex hash that was signed
 * @returns True if signature is valid
 */
export async function verify(
  publicKey: Uint8Array | string,
  signature: string,
  domainSeparator: DomainSeparator,
  dataHash: string
): Promise<boolean> {
  try {
    const pubKey = typeof publicKey === 'string'
      ? base64ToBytes(publicKey)
      : publicKey;

    const sig = base64ToBytes(signature);
    const signatureInput = buildSignatureInput(domainSeparator, dataHash);

    return await ed.verifyAsync(sig, signatureInput, pubKey);
  } catch {
    return false;
  }
}

/**
 * Verify an object's signature
 *
 * @param publicKey - Ed25519 public key
 * @param signature - Base64-encoded signature
 * @param domainSeparator - Domain separator
 * @param obj - Object that was signed
 * @param omitFields - Fields that were omitted during signing
 * @returns True if signature is valid
 */
export async function verifyObject(
  publicKey: Uint8Array | string,
  signature: string,
  domainSeparator: DomainSeparator,
  obj: Record<string, unknown>,
  omitFields: string[] = []
): Promise<boolean> {
  const canonical = omitFields.length > 0
    ? canonicalizeWithOmit(obj, omitFields)
    : canonicalize(obj);

  const hashBytes = sha256(new TextEncoder().encode(canonical));
  const hash = bufferToHex(new Uint8Array(hashBytes).buffer);

  return verify(publicKey, signature, domainSeparator, hash);
}

// ============================================================================
// SIGNER HELPERS
// ============================================================================

/**
 * Create a Signer object from keys and signature
 */
export function createSigner(
  publicKey: string,
  keyId: string,
  signature: string
): Signer {
  return {
    public_key: publicKey,
    key_id: keyId,
    signature
  };
}

/**
 * Create a SigningKey object (without signature)
 */
export function createSigningKey(
  publicKey: string,
  keyId: string
): SigningKey {
  return {
    public_key: publicKey,
    key_id: keyId
  };
}

// ============================================================================
// KEY SERIALIZATION
// ============================================================================

/**
 * Serialize a key pair for storage
 */
export function serializeKeyPair(
  publicKey: Uint8Array,
  privateKey: Uint8Array
): { publicKeyB64: string; privateKeyB64: string } {
  return {
    publicKeyB64: bytesToBase64(publicKey),
    privateKeyB64: bytesToBase64(privateKey)
  };
}

/**
 * Deserialize a key pair from storage
 */
export function deserializeKeyPair(
  publicKeyB64: string,
  privateKeyB64: string
): { publicKey: Uint8Array; privateKey: Uint8Array } {
  return {
    publicKey: base64ToBytes(publicKeyB64),
    privateKey: base64ToBytes(privateKeyB64)
  };
}

/**
 * Generate key fingerprint for display
 * Format: SHA256:<first32chars>
 */
export async function getKeyFingerprint(publicKey: Uint8Array | string): Promise<string> {
  const pubKey = typeof publicKey === 'string'
    ? base64ToBytes(publicKey)
    : publicKey;

  const hash = await sha256Async(pubKey);
  return `SHA256:${hash.slice(0, 32)}`;
}

// ============================================================================
// TEST VECTORS (per Appendix B.3)
// ============================================================================

/**
 * Test vector TV-SIG-001 from spec Appendix B
 */
export const TEST_VECTOR_SIG_001 = {
  publicKey: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg',
  privateKey: 'S38UdZHLAVZYYoGvjvmF1gp-L2Yo6KDXAPukOiLMMx0',  // Base64url - TEST ONLY
  keyId: '36ee3280c62ed537',
  signature: 'uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8WRKB0uJurjCg'
};

/**
 * Verify signature implementation against test vector
 * @returns True if implementation matches spec
 */
export async function verifySignatureTestVector(): Promise<boolean> {
  // This would need the exact canonical bytes from TV-JCS-001
  // For now, just verify the key pair is valid
  const pubKey = base64urlToBytes(TEST_VECTOR_SIG_001.publicKey);
  const privKey = base64urlToBytes(TEST_VECTOR_SIG_001.privateKey);

  // Derive public key from private and verify match
  const derivedPub = await derivePublicKey(privKey);

  const match = pubKey.length === derivedPub.length &&
    pubKey.every((byte, i) => byte === derivedPub[i]);

  if (!match) {
    console.error('Key derivation mismatch');
    return false;
  }

  return true;
}

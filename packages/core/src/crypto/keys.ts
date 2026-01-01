/**
 * Ed25519 Key Management Module
 * Per AGA Build Guide Phase 1.2
 *
 * Handles key generation, storage, encryption, and BYOK import.
 */

import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { randomBytes } from '@noble/hashes/utils';
import { bytesToBase64, base64ToBytes, bytesToBase64url, base64urlToBytes } from './signature';
import { sha256 as sha256Async, bufferToHex } from './hash';
import type { KeyClass } from '../types';

// ============================================================================
// KEY ID GENERATION
// ============================================================================

/**
 * Generate a key ID in the format: ai_<class>_<timestamp>_ed25519
 * @param keyClass - BUNDLE or RELEASE
 * @returns Formatted key ID string
 */
export function generateKeyIdString(keyClass: KeyClass): string {
  const timestamp = Date.now();
  const classStr = keyClass.toLowerCase();
  return `ai_${classStr}_${timestamp}_ed25519`;
}

/**
 * Generate key_id hash from public key bytes
 * key_id = HEX(SHA-256(raw_public_key_bytes))[0:16]
 * @param publicKeyBytes - Raw Ed25519 public key bytes
 * @returns 16 character hex key ID
 */
export async function generateKeyIdHash(publicKeyBytes: Uint8Array): Promise<string> {
  const hash = await sha256Async(publicKeyBytes);
  return hash.slice(0, 16);
}

// ============================================================================
// KEY PAIR GENERATION
// ============================================================================

export interface GeneratedKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicKeyB64: string;
  privateKeyB64: string;
  keyId: string;
  keyIdHash: string;
  fingerprint: string;
  createdAt: number;
}

/**
 * Generate a new Ed25519 key pair with all metadata
 * @param keyClass - BUNDLE or RELEASE
 * @returns Complete key pair with IDs and fingerprint
 */
export async function generateFullKeyPair(keyClass: KeyClass): Promise<GeneratedKeyPair> {
  // Generate raw keys
  const privateKey = ed.utils.randomSecretKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  // Generate IDs
  const keyId = generateKeyIdString(keyClass);
  const keyIdHash = await generateKeyIdHash(publicKey);

  // Generate fingerprint
  const fingerprint = await getKeyFingerprint(publicKey);

  return {
    publicKey,
    privateKey,
    publicKeyB64: bytesToBase64(publicKey),
    privateKeyB64: bytesToBase64(privateKey),
    keyId,
    keyIdHash,
    fingerprint,
    createdAt: Date.now(),
  };
}

// ============================================================================
// KEY FINGERPRINT
// ============================================================================

/**
 * Generate key fingerprint for display
 * Format: SHA256:<first32chars>
 * @param publicKey - Public key bytes or base64
 * @returns Fingerprint string
 */
export async function getKeyFingerprint(publicKey: Uint8Array | string): Promise<string> {
  const pubKey = typeof publicKey === 'string'
    ? base64ToBytes(publicKey)
    : publicKey;

  const hash = await sha256Async(pubKey);
  return `SHA256:${hash.slice(0, 32)}`;
}

/**
 * Get short fingerprint (last 8 chars) for compact display
 */
export async function getShortFingerprint(publicKey: Uint8Array | string): Promise<string> {
  const full = await getKeyFingerprint(publicKey);
  return full.slice(-8);
}

// ============================================================================
// KEY SERIALIZATION
// ============================================================================

/**
 * Serialize public key to base64
 */
export function publicKeyToBase64(key: Uint8Array): string {
  return bytesToBase64(key);
}

/**
 * Serialize private key to base64
 */
export function privateKeyToBase64(key: Uint8Array): string {
  return bytesToBase64(key);
}

/**
 * Deserialize base64 to public key
 */
export function base64ToPublicKey(b64: string): Uint8Array {
  const bytes = base64ToBytes(b64);
  if (bytes.length !== 32) {
    throw new Error(`Invalid public key length: expected 32 bytes, got ${bytes.length}`);
  }
  return bytes;
}

/**
 * Deserialize base64 to private key
 */
export function base64ToPrivateKey(b64: string): Uint8Array {
  const bytes = base64ToBytes(b64);
  if (bytes.length !== 32 && bytes.length !== 64) {
    throw new Error(`Invalid private key length: expected 32 or 64 bytes, got ${bytes.length}`);
  }
  // If 64 bytes, take first 32 (seed portion)
  return bytes.length === 64 ? bytes.slice(0, 32) : bytes;
}

// ============================================================================
// KEY ENCRYPTION FOR STORAGE
// ============================================================================

export interface EncryptedKey {
  encryptedPrivateKey: string;  // Base64
  salt: string;                  // Base64 (PBKDF2 salt)
  iv: string;                    // Base64 (AES-GCM IV)
  algorithm: 'AES-256-GCM';
  kdfIterations: number;
}

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;

/**
 * Encrypt a private key for secure storage
 * Uses PBKDF2 to derive key from password, then AES-256-GCM
 * @param privateKey - Raw private key bytes
 * @param password - User password
 * @returns Encrypted key bundle
 */
export async function encryptPrivateKey(
  privateKey: Uint8Array,
  password: string
): Promise<EncryptedKey> {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive encryption key from password using PBKDF2
  const derivedKey = await pbkdf2Async(
    sha256,
    new TextEncoder().encode(password),
    salt,
    { c: PBKDF2_ITERATIONS, dkLen: 32 }
  );

  // Import derived key for AES-GCM
  // Create proper ArrayBuffer copies for crypto.subtle
  const derivedKeyBuffer = new Uint8Array(derivedKey).buffer;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    derivedKeyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt private key
  const ivBuffer = new Uint8Array(iv).buffer;
  const privateKeyBuffer = new Uint8Array(privateKey).buffer;
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    cryptoKey,
    privateKeyBuffer
  );

  return {
    encryptedPrivateKey: bytesToBase64(new Uint8Array(encryptedBuffer)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    algorithm: 'AES-256-GCM',
    kdfIterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Decrypt a private key from storage
 * @param encrypted - Encrypted key bundle
 * @param password - User password
 * @returns Raw private key bytes
 */
export async function decryptPrivateKey(
  encrypted: EncryptedKey,
  password: string
): Promise<Uint8Array> {
  const salt = base64ToBytes(encrypted.salt);
  const iv = base64ToBytes(encrypted.iv);
  const encryptedData = base64ToBytes(encrypted.encryptedPrivateKey);

  // Derive encryption key from password using PBKDF2
  const derivedKey = await pbkdf2Async(
    sha256,
    new TextEncoder().encode(password),
    salt,
    { c: encrypted.kdfIterations, dkLen: 32 }
  );

  // Import derived key for AES-GCM
  // Create proper ArrayBuffer copies for crypto.subtle
  const derivedKeyBuffer = new Uint8Array(derivedKey).buffer;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    derivedKeyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt private key
  const ivBuffer = new Uint8Array(iv).buffer;
  const encryptedDataBuffer = new Uint8Array(encryptedData).buffer;
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    cryptoKey,
    encryptedDataBuffer
  );

  return new Uint8Array(decryptedBuffer);
}

// ============================================================================
// BYOK (BRING YOUR OWN KEY) IMPORT
// ============================================================================

export interface ImportedKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicKeyB64: string;
  privateKeyB64: string;
  keyIdHash: string;
  fingerprint: string;
  importedAt: number;
  source: 'PEM' | 'BASE64' | 'HEX';
}

/**
 * Import a private key from various formats
 * Supports: PEM, raw base64, base64url, hex
 * @param input - Key in any supported format
 * @returns Standardized key pair
 */
export async function importPrivateKey(input: string): Promise<ImportedKeyPair> {
  let privateKey: Uint8Array;
  let source: 'PEM' | 'BASE64' | 'HEX';

  const trimmed = input.trim();

  // Try to detect format
  if (trimmed.includes('-----BEGIN')) {
    // PEM format
    privateKey = parsePemPrivateKey(trimmed);
    source = 'PEM';
  } else if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === 64) {
    // Hex format (32 bytes = 64 hex chars)
    privateKey = hexToBytes(trimmed);
    source = 'HEX';
  } else {
    // Try base64/base64url
    try {
      // Handle base64url
      if (trimmed.includes('-') || trimmed.includes('_')) {
        privateKey = base64urlToBytes(trimmed);
      } else {
        privateKey = base64ToBytes(trimmed);
      }
      source = 'BASE64';
    } catch {
      throw new Error('Invalid key format. Expected PEM, base64, base64url, or hex.');
    }
  }

  // Validate key length
  if (privateKey.length !== 32 && privateKey.length !== 64) {
    throw new Error(`Invalid private key length: expected 32 or 64 bytes, got ${privateKey.length}`);
  }

  // Take seed portion if 64 bytes
  if (privateKey.length === 64) {
    privateKey = privateKey.slice(0, 32);
  }

  // Derive public key
  const publicKey = await ed.getPublicKeyAsync(privateKey);

  // Generate metadata
  const keyIdHash = await generateKeyIdHash(publicKey);
  const fingerprint = await getKeyFingerprint(publicKey);

  return {
    publicKey,
    privateKey,
    publicKeyB64: bytesToBase64(publicKey),
    privateKeyB64: bytesToBase64(privateKey),
    keyIdHash,
    fingerprint,
    importedAt: Date.now(),
    source,
  };
}

/**
 * Parse PEM-encoded private key
 * Handles both PKCS#8 and raw Ed25519 PEM formats
 */
function parsePemPrivateKey(pem: string): Uint8Array {
  // Remove PEM headers and whitespace
  const b64 = pem
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/\s/g, '');

  const decoded = base64ToBytes(b64);

  // Check for PKCS#8 wrapper (common format)
  // Ed25519 PKCS#8 has OID 1.3.101.112 and key at offset 16
  if (decoded.length > 32) {
    // Look for Ed25519 OID: 06 03 2b 65 70
    const oidOffset = findSubarray(decoded, new Uint8Array([0x06, 0x03, 0x2b, 0x65, 0x70]));
    if (oidOffset !== -1) {
      // PKCS#8 format - key is after OID and some wrapper bytes
      // Usually at offset 16 for Ed25519
      const keyStart = oidOffset + 7; // Skip OID + octet string wrapper
      if (decoded.length >= keyStart + 32) {
        return decoded.slice(keyStart, keyStart + 32);
      }
    }

    // Try extracting last 32 bytes as fallback
    if (decoded.length >= 32) {
      return decoded.slice(-32);
    }
  }

  if (decoded.length === 32) {
    return decoded;
  }

  throw new Error('Could not parse PEM private key');
}

/**
 * Find subarray within array
 */
function findSubarray(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hex string');
  }
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// ============================================================================
// KEY VALIDATION
// ============================================================================

/**
 * Validate that a key pair is consistent
 * @param publicKey - Public key bytes or base64
 * @param privateKey - Private key bytes or base64
 * @returns True if public key matches private key
 */
export async function validateKeyPair(
  publicKey: Uint8Array | string,
  privateKey: Uint8Array | string
): Promise<boolean> {
  try {
    const privKey = typeof privateKey === 'string'
      ? base64ToPrivateKey(privateKey)
      : privateKey;

    const pubKey = typeof publicKey === 'string'
      ? base64ToPublicKey(publicKey)
      : publicKey;

    // Derive public key from private
    const derivedPub = await ed.getPublicKeyAsync(privKey);

    // Compare
    if (pubKey.length !== derivedPub.length) return false;
    return pubKey.every((byte, i) => byte === derivedPub[i]);
  } catch {
    return false;
  }
}

/**
 * Check if a public key is valid Ed25519 format
 */
export function isValidPublicKey(key: Uint8Array | string): boolean {
  try {
    const keyBytes = typeof key === 'string' ? base64ToPublicKey(key) : key;
    return keyBytes.length === 32;
  } catch {
    return false;
  }
}

/**
 * Check if a private key is valid Ed25519 format
 */
export function isValidPrivateKey(key: Uint8Array | string): boolean {
  try {
    const keyBytes = typeof key === 'string' ? base64ToPrivateKey(key) : key;
    return keyBytes.length === 32;
  } catch {
    return false;
  }
}

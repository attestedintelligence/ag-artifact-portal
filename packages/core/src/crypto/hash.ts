/**
 * SHA-256 Hashing Module
 * Per AGA Build Guide Phase 1.1
 *
 * Uses Web Crypto API for client-side hashing.
 * Server never sees plaintext in hash-only mode.
 */

import { DOMAIN_SEPARATORS, type DomainSeparator, type FileMetadata } from '../types';

// ============================================================================
// CORE HASH FUNCTIONS
// ============================================================================

/**
 * Hash bytes using SHA-256
 * @param data - ArrayBuffer or Uint8Array to hash
 * @returns Lowercase hex string (64 chars)
 */
export async function sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  // Ensure we have a proper ArrayBuffer for crypto.subtle.digest
  let buffer: ArrayBuffer;
  if (data instanceof Uint8Array) {
    // Create a copy to ensure we have a proper ArrayBuffer
    buffer = new Uint8Array(data).buffer;
  } else {
    buffer = data;
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

/**
 * Hash a string using SHA-256
 * @param str - UTF-8 string to hash
 * @returns Lowercase hex string (64 chars)
 */
export async function sha256String(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return sha256(data);
}

/**
 * Convert ArrayBuffer to lowercase hex string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBuffer(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hex string');
  }
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// ============================================================================
// FILE HASHING (with progress)
// ============================================================================

export interface HashProgress {
  bytesProcessed: number;
  totalBytes: number;
  percentage: number;
}

export type ProgressCallback = (progress: HashProgress) => void;

/**
 * Hash a file with optional progress callback
 * Uses chunked reading for files up to 500MB
 * @param file - File to hash
 * @param onProgress - Optional progress callback
 * @returns SHA-256 hex hash
 */
export async function hashFile(
  file: File,
  onProgress?: ProgressCallback
): Promise<string> {
  const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks

  // For small files, hash directly
  if (file.size < CHUNK_SIZE) {
    const buffer = await file.arrayBuffer();
    const hash = await sha256(buffer);
    onProgress?.({
      bytesProcessed: file.size,
      totalBytes: file.size,
      percentage: 100
    });
    return hash;
  }

  // For large files, use streaming approach
  // Note: Web Crypto doesn't support incremental hashing natively
  // We'll read the whole file but report progress
  const buffer = await readFileWithProgress(file, onProgress);
  return sha256(buffer);
}

/**
 * Read file with progress reporting
 */
async function readFileWithProgress(
  file: File,
  onProgress?: ProgressCallback
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };

    reader.onerror = () => reject(reader.error);

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          bytesProcessed: event.loaded,
          totalBytes: event.total,
          percentage: Math.round((event.loaded / event.total) * 100)
        });
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract file metadata for hashing
 */
export function extractFileMetadata(file: File): FileMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified
  };
}

// ============================================================================
// SUBJECT IDENTIFIER (per Build Guide 1.1.5)
// ============================================================================

/**
 * Generate a subject identifier by combining bytes_hash and metadata_hash
 * with domain separator
 * @param bytesHash - SHA-256 hex of file bytes
 * @param metadataHash - SHA-256 hex of canonical metadata JSON
 * @returns Sealed hash (64 char hex)
 */
export async function generateSubjectIdentifier(
  bytesHash: string,
  metadataHash: string
): Promise<string> {
  const combined = `${DOMAIN_SEPARATORS.SUBJECT}${bytesHash}:${metadataHash}`;
  return sha256String(combined);
}

/**
 * Hash file and compute full subject identifier
 * @param file - File to hash
 * @param onProgress - Optional progress callback
 * @returns Object with all hashes
 */
export async function computeFileHashes(
  file: File,
  onProgress?: ProgressCallback
): Promise<{
  bytes_hash: string;
  metadata: FileMetadata;
  metadata_hash: string;
  sealed_hash: string;
}> {
  // Hash file bytes
  const bytes_hash = await hashFile(file, onProgress);

  // Extract and hash metadata
  const metadata = extractFileMetadata(file);

  // Import canonical function dynamically to avoid circular deps
  const { canonicalize } = await import('./canonical');
  const canonicalMetadata = canonicalize(metadata);
  const metadata_hash = await sha256String(canonicalMetadata);

  // Generate sealed hash with domain separator
  const sealed_hash = await generateSubjectIdentifier(bytes_hash, metadata_hash);

  return {
    bytes_hash,
    metadata,
    metadata_hash,
    sealed_hash
  };
}

// ============================================================================
// COMPOSITE HASH (per Build Guide 7.2)
// ============================================================================

/**
 * Compute composite subject hash from multiple file digests
 * composite_subject_hash = SHA-256(digest_1 || digest_2 || ...)
 * @param digests - Array of hex digest strings (in order)
 * @returns Composite hash (64 char hex)
 */
export async function computeCompositeHash(digests: string[]): Promise<string> {
  // Concatenate all digest bytes
  const totalLength = digests.length * 32; // Each SHA-256 is 32 bytes
  const combined = new Uint8Array(totalLength);

  digests.forEach((digest, index) => {
    const bytes = hexToBuffer(digest);
    combined.set(bytes, index * 32);
  });

  return sha256(combined);
}

// ============================================================================
// KEY ID GENERATION (per spec)
// ============================================================================

/**
 * Generate key_id from public key bytes
 * key_id = HEX(SHA-256(raw_public_key_bytes))[0:16]
 * @param publicKeyBytes - Raw Ed25519 public key bytes
 * @returns 16 character hex key ID
 */
export async function generateKeyId(publicKeyBytes: Uint8Array): Promise<string> {
  const hash = await sha256(publicKeyBytes);
  return hash.slice(0, 16);
}

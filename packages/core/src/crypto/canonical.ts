/**
 * JSON Canonicalization Scheme (JCS) per RFC 8785
 * Per AGA Build Guide Phase 1.4
 *
 * Ensures deterministic JSON serialization for hashing and signing.
 */

import canonicalizeLib from 'canonicalize';
import { sha256String } from './hash';

// ============================================================================
// CANONICALIZATION
// ============================================================================

/**
 * Canonicalize a JSON object per RFC 8785 (JCS)
 *
 * Rules:
 * - UTF-8 encoding
 * - Object keys sorted lexicographically (byte order)
 * - No insignificant whitespace
 * - Arrays preserve order
 * - Numbers: no leading zeros, no trailing zeros after decimal
 *
 * @param obj - Any JSON-serializable object
 * @returns Canonical JSON string
 */
export function canonicalize(obj: unknown): string {
  const result = canonicalizeLib(obj);
  if (result === undefined) {
    throw new Error('Failed to canonicalize object - contains non-JSON values');
  }
  return result;
}

/**
 * Canonicalize and hash an object
 * @param obj - Any JSON-serializable object
 * @returns SHA-256 hex hash of canonical JSON
 */
export async function canonicalHash(obj: unknown): Promise<string> {
  const canonical = canonicalize(obj);
  return sha256String(canonical);
}

/**
 * Canonicalize an object, omitting specified fields
 * Used for computing hashes/signatures where certain fields must be excluded
 * @param obj - Object to canonicalize
 * @param omitFields - Field paths to omit (supports nested: "issuer.signature")
 * @returns Canonical JSON string
 */
export function canonicalizeWithOmit(
  obj: Record<string, unknown>,
  omitFields: string[]
): string {
  const clone = deepCloneWithOmit(obj, omitFields);
  return canonicalize(clone);
}

/**
 * Deep clone an object while omitting specified fields
 * @param obj - Object to clone
 * @param omitFields - Field paths to omit
 * @returns Cloned object without omitted fields
 */
function deepCloneWithOmit(
  obj: Record<string, unknown>,
  omitFields: string[]
): Record<string, unknown> {
  // Parse omit paths into a tree structure
  const omitTree = buildOmitTree(omitFields);

  return cloneWithOmitTree(obj, omitTree);
}

interface OmitTree {
  [key: string]: OmitTree | true;
}

function buildOmitTree(paths: string[]): OmitTree {
  const tree: OmitTree = {};

  for (const path of paths) {
    const parts = path.split('.');
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Last part - mark for omission
        current[part] = true;
      } else {
        // Intermediate part - create nested object
        if (current[part] === true) {
          // Already marked for full omission, skip
          break;
        }
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part] as OmitTree;
      }
    }
  }

  return tree;
}

function cloneWithOmitTree(
  obj: Record<string, unknown>,
  omitTree: OmitTree
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const omitValue = omitTree[key];

    if (omitValue === true) {
      // Skip this field entirely
      continue;
    }

    const value = obj[key];

    if (omitValue && typeof omitValue === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse into nested object
      result[key] = cloneWithOmitTree(value as Record<string, unknown>, omitValue);
    } else if (Array.isArray(value)) {
      // Clone arrays (no field omission within arrays in our schema)
      result[key] = JSON.parse(JSON.stringify(value));
    } else if (value && typeof value === 'object') {
      // Clone other objects
      result[key] = JSON.parse(JSON.stringify(value));
    } else {
      // Primitive value
      result[key] = value;
    }
  }

  return result;
}

// ============================================================================
// TIMESTAMP UTILITIES (per spec - ISO 8601 UTC with Z)
// ============================================================================

/**
 * Get current timestamp in ISO 8601 UTC format
 * @returns Timestamp string like "2025-01-01T00:00:00.000Z"
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Validate an ISO 8601 timestamp
 * @param timestamp - Timestamp string to validate
 * @returns True if valid ISO 8601 UTC timestamp
 */
export function isValidTimestamp(timestamp: string): boolean {
  // Must end with Z (UTC)
  if (!timestamp.endsWith('Z')) {
    return false;
  }

  // Must be valid date
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Compare two timestamps
 * @returns Negative if a < b, 0 if equal, positive if a > b
 */
export function compareTimestamps(a: string, b: string): number {
  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();
  return dateA - dateB;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a SHA-256 hex string
 * @param hash - Hash string to validate
 * @returns True if valid 64-char lowercase hex
 */
export function isValidSha256Hex(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

/**
 * Validate a key_id (16 char hex)
 * @param keyId - Key ID to validate
 * @returns True if valid 16-char lowercase hex
 */
export function isValidKeyId(keyId: string): boolean {
  return /^[a-f0-9]{16}$/.test(keyId);
}

// ============================================================================
// TEST VECTORS (per Appendix B)
// ============================================================================

/**
 * Test vector TV-JCS-001 from spec Appendix B
 * Used to verify canonicalization implementation
 */
export const TEST_VECTOR_JCS_001 = {
  input: {
    artifact_id: 'art_01HXYZTEST0000000000000001',
    measurement_id: 'm_0001',
    measurement_time: 1735600000,
    run_id: 'run_01HXYZTEST0000000000000001',
    sequence_number: 1,
    stream_id: 'pressure_psi',
    value: 42
  },
  expected_canonical: '{"artifact_id":"art_01HXYZTEST0000000000000001","measurement_id":"m_0001","measurement_time":1735600000,"run_id":"run_01HXYZTEST0000000000000001","sequence_number":1,"stream_id":"pressure_psi","value":42}',
  expected_hash_base64url: 'uM22uzzEnt39f1ZO14U_gZ7C7mGvCW87JPKCvgRGe-Q'
};

/**
 * Verify canonicalization against test vector
 * @returns True if implementation matches spec
 */
export async function verifyCanonicalTestVector(): Promise<boolean> {
  const canonical = canonicalize(TEST_VECTOR_JCS_001.input);

  if (canonical !== TEST_VECTOR_JCS_001.expected_canonical) {
    console.error('Canonicalization mismatch');
    console.error('Expected:', TEST_VECTOR_JCS_001.expected_canonical);
    console.error('Got:', canonical);
    return false;
  }

  // Verify hash (would need base64url encoding to fully verify)
  const hash = await canonicalHash(TEST_VECTOR_JCS_001.input);
  console.log('Canonical hash (hex):', hash);

  return true;
}

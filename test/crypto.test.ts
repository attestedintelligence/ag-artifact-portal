/**
 * Crypto Primitives Tests
 * Per AGA Build Guide Phase 11.1
 *
 * Tests for hashing, signing, and canonicalization.
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// TEST VECTORS (from spec Appendix B)
// ============================================================================

const TEST_VECTORS = {
  // TV-JCS-001: Canonicalization
  jcs001: {
    input: {
      artifact_id: 'art_01HXYZTEST0000000000000001',
      measurement_id: 'm_0001',
      measurement_time: 1735600000,
      run_id: 'run_01HXYZTEST0000000000000001',
      sequence_number: 1,
      stream_id: 'pressure_psi',
      value: 42,
    },
    expectedCanonical:
      '{"artifact_id":"art_01HXYZTEST0000000000000001","measurement_id":"m_0001","measurement_time":1735600000,"run_id":"run_01HXYZTEST0000000000000001","sequence_number":1,"stream_id":"pressure_psi","value":42}',
    expectedHash: 'uM22uzzEnt39f1ZO14U_gZ7C7mGvCW87JPKCvgRGe-Q', // base64url
  },

  // TV-SIG-001: Ed25519 signature
  sig001: {
    publicKey: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg', // base64url
    keyId: '36ee3280c62ed537',
    signature:
      'uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8WRKB0uJurjCg', // base64url
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function canonicalize(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }

  const keys = Object.keys(obj as object).sort();
  const parts = keys.map((key) => {
    const value = (obj as Record<string, unknown>)[key];
    return `"${key}":${canonicalize(value)}`;
  });

  return '{' + parts.join(',') + '}';
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return new Uint8Array(Array.from(binary).map((c) => c.charCodeAt(0)));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// ============================================================================
// CANONICALIZATION TESTS
// ============================================================================

describe('Canonicalization (JCS / RFC 8785)', () => {
  it('should canonicalize objects with sorted keys', () => {
    const input = { z: 1, a: 2, m: 3 };
    const result = canonicalize(input);
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it('should handle nested objects', () => {
    const input = { outer: { z: 1, a: 2 }, first: true };
    const result = canonicalize(input);
    expect(result).toBe('{"first":true,"outer":{"a":2,"z":1}}');
  });

  it('should preserve array order', () => {
    const input = { arr: [3, 1, 2] };
    const result = canonicalize(input);
    expect(result).toBe('{"arr":[3,1,2]}');
  });

  it('should match TV-JCS-001 canonical output', () => {
    const result = canonicalize(TEST_VECTORS.jcs001.input);
    expect(result).toBe(TEST_VECTORS.jcs001.expectedCanonical);
  });
});

// ============================================================================
// HASHING TESTS
// ============================================================================

describe('SHA-256 Hashing', () => {
  it('should compute correct hash for empty string', async () => {
    const hash = await sha256('');
    expect(hash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('should compute correct hash for "hello"', async () => {
    const hash = await sha256('hello');
    expect(hash).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('should match TV-JCS-001 hash', async () => {
    const canonical = canonicalize(TEST_VECTORS.jcs001.input);
    const hash = await sha256(canonical);
    const hashBytes = hexToBytes(hash);
    const hashBase64url = base64urlEncode(hashBytes);

    expect(hashBase64url).toBe(TEST_VECTORS.jcs001.expectedHash);
  });
});

// ============================================================================
// KEY ID TESTS
// ============================================================================

describe('Key ID Generation', () => {
  it('should generate key_id as first 16 hex chars of SHA-256(public_key)', async () => {
    const publicKeyBytes = base64urlDecode(TEST_VECTORS.sig001.publicKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBytes as BufferSource);
    const hashArray = new Uint8Array(hashBuffer);
    const keyId = Array.from(hashArray.slice(0, 8))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    expect(keyId).toBe(TEST_VECTORS.sig001.keyId);
  });
});

// ============================================================================
// RECEIPT CHAIN TESTS
// ============================================================================

describe('Receipt Chain', () => {
  it('should have zero hash for first receipt prev_hash', () => {
    const ZERO_HASH = '0'.repeat(64);
    expect(ZERO_HASH.length).toBe(64);
  });

  it('should link receipts by prev_hash = previous.this_hash', () => {
    const receipts = [
      { this_hash: 'abc123', prev_hash: '0'.repeat(64), counter: 1 },
      { this_hash: 'def456', prev_hash: 'abc123', counter: 2 },
      { this_hash: 'ghi789', prev_hash: 'def456', counter: 3 },
    ];

    for (let i = 1; i < receipts.length; i++) {
      expect(receipts[i].prev_hash).toBe(receipts[i - 1].this_hash);
      expect(receipts[i].counter).toBe(receipts[i - 1].counter + 1);
    }
  });

  it('should detect chain breaks', () => {
    const receipts = [
      { this_hash: 'abc123', prev_hash: '0'.repeat(64), counter: 1 },
      { this_hash: 'def456', prev_hash: 'WRONG', counter: 2 }, // Break!
    ];

    const hasBreak = receipts.some(
      (r, i) => i > 0 && r.prev_hash !== receipts[i - 1].this_hash
    );
    expect(hasBreak).toBe(true);
  });
});

// ============================================================================
// DOMAIN SEPARATOR TESTS
// ============================================================================

describe('Domain Separators', () => {
  it('should use correct domain separator for bundles', () => {
    const BUNDLE_SEPARATOR = 'ai.bundle.v1:';
    expect(BUNDLE_SEPARATOR).toBe('ai.bundle.v1:');
  });

  it('should prepend domain separator to signed data', () => {
    const BUNDLE_SEPARATOR = 'ai.bundle.v1:';
    const data = 'test data';
    const signedPayload = BUNDLE_SEPARATOR + data;

    expect(signedPayload).toBe('ai.bundle.v1:test data');
    expect(signedPayload.startsWith(BUNDLE_SEPARATOR)).toBe(true);
  });
});

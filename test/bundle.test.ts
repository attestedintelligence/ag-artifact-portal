/**
 * Bundle Generation & Verification Tests
 * Per AGA Build Guide Phase 11.2
 *
 * Tests for evidence bundle creation and offline verification.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// TYPES
// ============================================================================

interface BundleManifest {
  format_version: string;
  bundle_id: string;
  created_at: string;
  artifact_id: string;
  vault_id: string;
  receipt_count: number;
  payload_included: boolean;
  files: Array<{
    path: string;
    sha256: string;
    size_bytes: number;
  }>;
}

interface PolicyArtifact {
  artifact_id: string;
  vault_id: string;
  policy_hash: string;
  issuer: {
    public_key: string;
    key_id: string;
    signature: string;
  };
}

interface Receipt {
  receipt_id: string;
  sequence_number: number;
  event_type: string;
  timestamp: string;
  chain: {
    prev_receipt_hash: string;
    this_receipt_hash: string;
  };
  signer: {
    public_key: string;
    key_id: string;
    signature: string;
  };
}

interface VerifierOutput {
  result: 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL';
  exit_code: 0 | 1 | 2;
  bundle_id: string;
  checks: Array<{
    name: string;
    result: 'PASS' | 'FAIL';
    reason?: string;
  }>;
  warnings: string[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

function createMockManifest(): BundleManifest {
  return {
    format_version: '1.0',
    bundle_id: 'bnd_test_001',
    created_at: new Date().toISOString(),
    artifact_id: 'art_test_001',
    vault_id: '1234-56789-0123',
    receipt_count: 3,
    payload_included: false,
    files: [
      { path: 'manifest.json', sha256: 'abc123', size_bytes: 512 },
      { path: 'artifact.json', sha256: 'def456', size_bytes: 1024 },
      { path: 'ledger.jsonl', sha256: 'ghi789', size_bytes: 2048 },
    ],
  };
}

function createMockArtifact(): PolicyArtifact {
  return {
    artifact_id: 'art_test_001',
    vault_id: '1234-56789-0123',
    policy_hash: 'f5d6e7890123456789abcdef0123456789abcdef0123456789abcdef01234567',
    issuer: {
      public_key: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg',
      key_id: '36ee3280c62ed537',
      signature: 'test_signature_base64',
    },
  };
}

function createMockReceipts(): Receipt[] {
  const ZERO_HASH = '0'.repeat(64);
  return [
    {
      receipt_id: 'rec_001',
      sequence_number: 1,
      event_type: 'POLICY_LOADED',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      chain: {
        prev_receipt_hash: ZERO_HASH,
        this_receipt_hash: 'abc123' + '0'.repeat(58),
      },
      signer: {
        public_key: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg',
        key_id: '36ee3280c62ed537',
        signature: 'sig1',
      },
    },
    {
      receipt_id: 'rec_002',
      sequence_number: 2,
      event_type: 'MEASUREMENT_OK',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      chain: {
        prev_receipt_hash: 'abc123' + '0'.repeat(58),
        this_receipt_hash: 'def456' + '0'.repeat(58),
      },
      signer: {
        public_key: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg',
        key_id: '36ee3280c62ed537',
        signature: 'sig2',
      },
    },
    {
      receipt_id: 'rec_003',
      sequence_number: 3,
      event_type: 'BUNDLE_EXPORTED',
      timestamp: new Date().toISOString(),
      chain: {
        prev_receipt_hash: 'def456' + '0'.repeat(58),
        this_receipt_hash: 'ghi789' + '0'.repeat(58),
      },
      signer: {
        public_key: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg',
        key_id: '36ee3280c62ed537',
        signature: 'sig3',
      },
    },
  ];
}

// ============================================================================
// VERIFIER SIMULATION
// ============================================================================

function verifyBundle(
  manifest: BundleManifest,
  artifact: PolicyArtifact,
  receipts: Receipt[]
): VerifierOutput {
  const checks: Array<{ name: string; result: 'PASS' | 'FAIL'; reason?: string }> = [];
  const warnings: string[] = [];

  // Check 1: Manifest format
  if (manifest.format_version === '1.0') {
    checks.push({ name: 'manifest_format', result: 'PASS' });
  } else {
    checks.push({
      name: 'manifest_format',
      result: 'FAIL',
      reason: `Unsupported format: ${manifest.format_version}`,
    });
  }

  // Check 2: Receipt count matches
  if (manifest.receipt_count === receipts.length) {
    checks.push({ name: 'receipt_count', result: 'PASS' });
  } else {
    checks.push({
      name: 'receipt_count',
      result: 'FAIL',
      reason: `Expected ${manifest.receipt_count}, got ${receipts.length}`,
    });
  }

  // Check 3: Receipt chain continuity
  const ZERO_HASH = '0'.repeat(64);
  let chainValid = true;

  if (receipts.length > 0 && receipts[0].chain.prev_receipt_hash !== ZERO_HASH) {
    chainValid = false;
  }

  for (let i = 1; i < receipts.length; i++) {
    if (receipts[i].chain.prev_receipt_hash !== receipts[i - 1].chain.this_receipt_hash) {
      chainValid = false;
      break;
    }
  }

  if (chainValid) {
    checks.push({ name: 'receipt_chain', result: 'PASS' });
  } else {
    checks.push({ name: 'receipt_chain', result: 'FAIL', reason: 'Chain break detected' });
  }

  // Check 4: Counter monotonicity
  let countersValid = true;
  for (let i = 1; i < receipts.length; i++) {
    if (receipts[i].sequence_number !== receipts[i - 1].sequence_number + 1) {
      countersValid = false;
      break;
    }
  }

  if (countersValid) {
    checks.push({ name: 'counter_monotonicity', result: 'PASS' });
  } else {
    checks.push({ name: 'counter_monotonicity', result: 'FAIL', reason: 'Counter gap' });
  }

  // Check 5: Artifact ID matches
  if (manifest.artifact_id === artifact.artifact_id) {
    checks.push({ name: 'artifact_match', result: 'PASS' });
  } else {
    checks.push({ name: 'artifact_match', result: 'FAIL', reason: 'Artifact ID mismatch' });
  }

  // Determine result
  const failedChecks = checks.filter((c) => c.result === 'FAIL');
  let result: 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL' = 'PASS';
  let exitCode: 0 | 1 | 2 = 0;

  if (failedChecks.length > 0) {
    result = 'FAIL';
    exitCode = 1;
  } else if (warnings.length > 0) {
    result = 'PASS_WITH_CAVEATS';
    exitCode = 2;
  }

  return {
    result,
    exit_code: exitCode,
    bundle_id: manifest.bundle_id,
    checks,
    warnings,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Bundle Manifest', () => {
  it('should have required fields', () => {
    const manifest = createMockManifest();

    expect(manifest.format_version).toBeDefined();
    expect(manifest.bundle_id).toBeDefined();
    expect(manifest.created_at).toBeDefined();
    expect(manifest.artifact_id).toBeDefined();
    expect(manifest.vault_id).toBeDefined();
    expect(manifest.receipt_count).toBeDefined();
    expect(manifest.files).toBeDefined();
    expect(Array.isArray(manifest.files)).toBe(true);
  });

  it('should list all bundle files with checksums', () => {
    const manifest = createMockManifest();

    for (const file of manifest.files) {
      expect(file.path).toBeDefined();
      expect(file.sha256).toBeDefined();
      expect(file.size_bytes).toBeGreaterThan(0);
    }
  });
});

describe('Bundle Verification', () => {
  let manifest: BundleManifest;
  let artifact: PolicyArtifact;
  let receipts: Receipt[];

  beforeEach(() => {
    manifest = createMockManifest();
    artifact = createMockArtifact();
    receipts = createMockReceipts();
  });

  it('should PASS for valid bundle', () => {
    const result = verifyBundle(manifest, artifact, receipts);

    expect(result.result).toBe('PASS');
    expect(result.exit_code).toBe(0);
    expect(result.checks.every((c) => c.result === 'PASS')).toBe(true);
  });

  it('should FAIL when receipt count mismatches', () => {
    manifest.receipt_count = 5; // Wrong count

    const result = verifyBundle(manifest, artifact, receipts);

    expect(result.result).toBe('FAIL');
    expect(result.exit_code).toBe(1);

    const receiptCheck = result.checks.find((c) => c.name === 'receipt_count');
    expect(receiptCheck?.result).toBe('FAIL');
  });

  it('should FAIL when chain is broken', () => {
    receipts[1].chain.prev_receipt_hash = 'WRONG_HASH' + '0'.repeat(54);

    const result = verifyBundle(manifest, artifact, receipts);

    expect(result.result).toBe('FAIL');

    const chainCheck = result.checks.find((c) => c.name === 'receipt_chain');
    expect(chainCheck?.result).toBe('FAIL');
  });

  it('should FAIL when counters have gaps', () => {
    receipts[2].sequence_number = 5; // Gap from 2 to 5

    const result = verifyBundle(manifest, artifact, receipts);

    expect(result.result).toBe('FAIL');

    const counterCheck = result.checks.find((c) => c.name === 'counter_monotonicity');
    expect(counterCheck?.result).toBe('FAIL');
  });

  it('should FAIL when artifact ID mismatches', () => {
    artifact.artifact_id = 'art_different_001';

    const result = verifyBundle(manifest, artifact, receipts);

    expect(result.result).toBe('FAIL');

    const artifactCheck = result.checks.find((c) => c.name === 'artifact_match');
    expect(artifactCheck?.result).toBe('FAIL');
  });
});

describe('Tamper Detection', () => {
  it('should detect modified receipt hash', () => {
    const receipts = createMockReceipts();

    // Tamper with a receipt hash
    const originalHash = receipts[1].chain.this_receipt_hash;
    receipts[1].chain.this_receipt_hash = 'TAMPERED' + '0'.repeat(56);

    // Next receipt still references old hash
    const chainBroken =
      receipts[2].chain.prev_receipt_hash !== receipts[1].chain.this_receipt_hash;

    expect(chainBroken).toBe(true);
  });

  it('should detect missing receipts', () => {
    const receipts = createMockReceipts();
    const manifest = createMockManifest();

    // Remove middle receipt
    receipts.splice(1, 1);

    // Chain should be broken
    const chainBroken =
      receipts[1].chain.prev_receipt_hash !== receipts[0].chain.this_receipt_hash;

    expect(chainBroken).toBe(true);
    expect(receipts.length).not.toBe(manifest.receipt_count);
  });

  it('should detect reordered receipts', () => {
    const receipts = createMockReceipts();

    // Swap receipts 1 and 2
    [receipts[1], receipts[2]] = [receipts[2], receipts[1]];

    // Chain should be broken (prev_hash won't match)
    const chainBroken =
      receipts[1].chain.prev_receipt_hash !== receipts[0].chain.this_receipt_hash;

    expect(chainBroken).toBe(true);
  });
});

describe('Verifier Output', () => {
  it('should return exit code 0 for PASS', () => {
    const manifest = createMockManifest();
    const artifact = createMockArtifact();
    const receipts = createMockReceipts();

    const result = verifyBundle(manifest, artifact, receipts);

    expect(result.result).toBe('PASS');
    expect(result.exit_code).toBe(0);
  });

  it('should return exit code 1 for FAIL', () => {
    const manifest = createMockManifest();
    manifest.receipt_count = 999; // Invalid

    const result = verifyBundle(manifest, createMockArtifact(), createMockReceipts());

    expect(result.result).toBe('FAIL');
    expect(result.exit_code).toBe(1);
  });

  it('should include bundle_id in output', () => {
    const manifest = createMockManifest();
    const result = verifyBundle(manifest, createMockArtifact(), createMockReceipts());

    expect(result.bundle_id).toBe(manifest.bundle_id);
  });

  it('should provide detailed check results', () => {
    const result = verifyBundle(
      createMockManifest(),
      createMockArtifact(),
      createMockReceipts()
    );

    expect(result.checks.length).toBeGreaterThan(0);

    for (const check of result.checks) {
      expect(check.name).toBeDefined();
      expect(['PASS', 'FAIL']).toContain(check.result);
    }
  });
});

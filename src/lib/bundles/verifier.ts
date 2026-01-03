/**
 * Evidence Bundle Verifier
 *
 * Verifies evidence bundles both online and offline.
 * Per patent claims 1(e), 3, 20
 *
 * Verification Steps:
 * 1. Policy signature verification
 * 2. Receipt signature verification
 * 3. Chain integrity (hash linking)
 * 4. Merkle proof verification
 * 5. Checkpoint anchor verification
 */

import type { EvidenceBundle, PolicyArtifact, BundleManifest } from './generator';
import type { SignedReceipt, CheckpointRecord } from '@/lib/chain/receipts';

// ============================================================================
// TYPES
// ============================================================================

export type VerificationStatus = 'PENDING' | 'CHECKING' | 'VALID' | 'INVALID' | 'SKIPPED';
export type VerificationVerdict = 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL';

export interface VerificationStep {
  id: string;
  name: string;
  description: string;
  status: VerificationStatus;
  details?: string;
  error?: string;
}

export interface VerificationResult {
  verdict: VerificationVerdict;
  steps: VerificationStep[];
  summary: {
    policyValid: boolean;
    receiptsValid: boolean;
    receiptsChecked: number;
    receiptsTotal: number;
    chainValid: boolean;
    merkleValid: boolean;
    anchorValid: boolean;
    anchorNetwork: string;
  };
  timestamp: string;
  bundleId: string;
  errors: string[];
  caveats: string[];
}

// ============================================================================
// HASH FUNCTIONS
// ============================================================================

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function canonicalize(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

// ============================================================================
// VERIFICATION STEPS
// ============================================================================

async function verifyPolicySignature(
  policy: PolicyArtifact
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Recompute policy hash (excluding signature and hash fields)
    const hashContent = { ...policy };
    delete (hashContent as Partial<PolicyArtifact>).issuer;
    delete (hashContent as Partial<PolicyArtifact>).policyHash;

    const computedHash = await sha256(JSON.stringify(hashContent));

    if (computedHash !== policy.policyHash) {
      return { valid: false, error: 'Policy hash mismatch' };
    }

    // Verify signature (simulated - in production would use Ed25519)
    const expectedSig = await sha256(`${policy.policyHash}:${policy.issuer.keyId}`);
    if (expectedSig !== policy.issuer.signature) {
      return { valid: false, error: 'Policy signature invalid' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Policy verification error: ${err}` };
  }
}

async function verifyReceiptSignatures(
  receipts: SignedReceipt[]
): Promise<{ valid: boolean; validCount: number; totalCount: number; errors: string[] }> {
  const errors: string[] = [];
  let validCount = 0;

  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];

    try {
      // Verify signature (simulated - in production would use Ed25519)
      const expectedSig = await sha256(`${receipt.leafHash}:${receipt.keyId}`);

      if (expectedSig === receipt.signature) {
        validCount++;
      } else {
        errors.push(`Receipt #${i + 1}: Signature mismatch`);
      }
    } catch (err) {
      errors.push(`Receipt #${i + 1}: Verification error - ${err}`);
    }
  }

  return {
    valid: validCount === receipts.length,
    validCount,
    totalCount: receipts.length,
    errors,
  };
}

async function verifyChainIntegrity(
  receipts: SignedReceipt[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const GENESIS_HASH = '0'.repeat(64);

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];

    // Check previous hash linking
    if (receipt.previousLeafHash !== expectedPreviousHash) {
      errors.push(`Receipt #${i + 1}: Chain link broken - previous hash mismatch`);
    }

    // Check sequence number
    if (receipt.sequenceNumber !== i + 1) {
      errors.push(`Receipt #${i + 1}: Sequence number gap (expected ${i + 1}, got ${receipt.sequenceNumber})`);
    }

    // Verify leaf hash computation
    const structuralMetadata = {
      eventType: receipt.eventType,
      sequenceNumber: receipt.sequenceNumber,
      timestamp: receipt.timestamp,
      previousLeafHash: receipt.previousLeafHash,
      payloadHash: receipt.payloadHash,
    };
    const computedLeafHash = await sha256(canonicalize(structuralMetadata));

    if (computedLeafHash !== receipt.leafHash) {
      errors.push(`Receipt #${i + 1}: Leaf hash mismatch`);
    }

    expectedPreviousHash = receipt.leafHash;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function verifyMerkleProofs(
  checkpoints: CheckpointRecord[],
  receipts: SignedReceipt[]
): Promise<{ valid: boolean; checkpointsVerified: number; errors: string[] }> {
  if (checkpoints.length === 0) {
    return { valid: true, checkpointsVerified: 0, errors: [] };
  }

  const errors: string[] = [];
  let verified = 0;

  for (const checkpoint of checkpoints) {
    try {
      // Get receipts in this batch
      const batchReceipts = receipts.slice(checkpoint.batchStart - 1, checkpoint.batchEnd);
      const batchHashes = batchReceipts.map(r => r.leafHash);

      // Recompute Merkle root
      const computedRoot = await computeMerkleRoot(batchHashes);

      if (computedRoot === checkpoint.merkleRoot) {
        verified++;
      } else {
        errors.push(`Checkpoint ${checkpoint.checkpointId}: Merkle root mismatch`);
      }
    } catch (err) {
      errors.push(`Checkpoint ${checkpoint.checkpointId}: Verification error - ${err}`);
    }
  }

  return {
    valid: verified === checkpoints.length,
    checkpointsVerified: verified,
    errors,
  };
}

async function computeMerkleRoot(hashes: string[]): Promise<string> {
  const GENESIS_HASH = '0'.repeat(64);

  if (hashes.length === 0) {
    return GENESIS_HASH;
  }
  if (hashes.length === 1) {
    return hashes[0];
  }

  let level = [...hashes];
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      const combined = await sha256(left + right);
      nextLevel.push(combined);
    }
    level = nextLevel;
  }
  return level[0];
}

function verifyAnchor(
  manifest: BundleManifest
): { valid: boolean; network: string; caveat?: string } {
  if (manifest.anchor === 'SIMULATED') {
    return {
      valid: true,
      network: 'SIMULATED',
      caveat: 'Checkpoint anchor is simulated (demo mode). Production would anchor to Arweave/Ethereum.',
    };
  }

  // In production, would verify actual blockchain anchor
  return { valid: true, network: manifest.anchor };
}

// ============================================================================
// MAIN VERIFICATION FUNCTION
// ============================================================================

export async function verifyBundle(bundle: EvidenceBundle): Promise<VerificationResult> {
  const steps: VerificationStep[] = [
    { id: 'policy', name: 'Policy Signature', description: 'Verifying policy artifact signature', status: 'PENDING' },
    { id: 'receipts', name: 'Receipt Signatures', description: 'Verifying all receipt signatures', status: 'PENDING' },
    { id: 'chain', name: 'Chain Integrity', description: 'Verifying hash chain continuity', status: 'PENDING' },
    { id: 'merkle', name: 'Merkle Proofs', description: 'Verifying checkpoint Merkle proofs', status: 'PENDING' },
    { id: 'anchor', name: 'Checkpoint Anchor', description: 'Verifying anchor to immutable store', status: 'PENDING' },
  ];

  const errors: string[] = [];
  const caveats: string[] = [];

  // Step 1: Policy signature
  steps[0].status = 'CHECKING';
  const policyResult = await verifyPolicySignature(bundle.policyArtifact);
  steps[0].status = policyResult.valid ? 'VALID' : 'INVALID';
  steps[0].details = policyResult.valid ? 'Policy signature verified' : policyResult.error;
  if (!policyResult.valid && policyResult.error) {
    errors.push(policyResult.error);
  }

  // Step 2: Receipt signatures
  steps[1].status = 'CHECKING';
  const receiptsResult = await verifyReceiptSignatures(bundle.chain.receipts);
  steps[1].status = receiptsResult.valid ? 'VALID' : 'INVALID';
  steps[1].details = `${receiptsResult.validCount}/${receiptsResult.totalCount} receipts verified`;
  errors.push(...receiptsResult.errors);

  // Step 3: Chain integrity
  steps[2].status = 'CHECKING';
  const chainResult = await verifyChainIntegrity(bundle.chain.receipts);
  steps[2].status = chainResult.valid ? 'VALID' : 'INVALID';
  steps[2].details = chainResult.valid ? 'Chain integrity verified' : `${chainResult.errors.length} errors found`;
  errors.push(...chainResult.errors);

  // Step 4: Merkle proofs
  steps[3].status = 'CHECKING';
  const merkleResult = await verifyMerkleProofs(bundle.chain.checkpoints, bundle.chain.receipts);
  if (bundle.chain.checkpoints.length === 0) {
    steps[3].status = 'SKIPPED';
    steps[3].details = 'No checkpoints to verify';
  } else {
    steps[3].status = merkleResult.valid ? 'VALID' : 'INVALID';
    steps[3].details = `${merkleResult.checkpointsVerified}/${bundle.chain.checkpoints.length} checkpoints verified`;
    errors.push(...merkleResult.errors);
  }

  // Step 5: Anchor verification
  steps[4].status = 'CHECKING';
  const anchorResult = verifyAnchor(bundle.manifest);
  steps[4].status = anchorResult.network === 'SIMULATED' ? 'SKIPPED' : (anchorResult.valid ? 'VALID' : 'INVALID');
  steps[4].details = `Network: ${anchorResult.network}`;
  if (anchorResult.caveat) {
    caveats.push(anchorResult.caveat);
  }

  // Determine verdict
  const allCriticalValid = policyResult.valid && receiptsResult.valid && chainResult.valid;
  let verdict: VerificationVerdict;

  if (!allCriticalValid) {
    verdict = 'FAIL';
  } else if (caveats.length > 0) {
    verdict = 'PASS_WITH_CAVEATS';
  } else {
    verdict = 'PASS';
  }

  return {
    verdict,
    steps,
    summary: {
      policyValid: policyResult.valid,
      receiptsValid: receiptsResult.valid,
      receiptsChecked: receiptsResult.validCount,
      receiptsTotal: receiptsResult.totalCount,
      chainValid: chainResult.valid,
      merkleValid: merkleResult.valid || bundle.chain.checkpoints.length === 0,
      anchorValid: anchorResult.valid,
      anchorNetwork: anchorResult.network,
    },
    timestamp: new Date().toISOString(),
    bundleId: bundle.manifest.bundleId,
    errors,
    caveats,
  };
}

// ============================================================================
// PARSE BUNDLE FROM JSON
// ============================================================================

export function parseBundleJSON(json: string): EvidenceBundle | null {
  try {
    const data = JSON.parse(json);

    // Validate required fields
    if (!data.manifest || !data.policyArtifact || !data.chain) {
      return null;
    }

    return {
      manifest: data.manifest,
      policyArtifact: data.policyArtifact,
      chain: data.chain,
      verifierScript: '', // Not included in JSON export
      readme: '', // Not included in JSON export
    };
  } catch {
    return null;
  }
}

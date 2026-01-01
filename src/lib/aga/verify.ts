/**
 * Attested Governance Artifacts - Offline Verification
 * Per Evolution Spec v1.0 - Verifier Output Contract
 */

import { sha256 } from '@noble/hashes/sha2.js';
import * as ed25519 from '@noble/ed25519';
import {
  canonicalStringify,
  computeBytesHash,
  verifyInclusionProof,
  importPublicKey,
  getCurrentTimestamp,
} from './crypto';
import { verifyReceiptChain, computeReceiptLeafHash } from './receipts';
import type {
  EvidenceBundle,
  PolicyArtifact,
  EnforcementReceipt,
  CheckpointRecord,
  InclusionProof,
  VerificationResult,
  VerificationCheck,
} from './types';

// ============================================================================
// VERIFICATION RESULT TYPES
// ============================================================================

export type VerificationVerdict = 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL';

export interface FullVerificationResult {
  verdict: VerificationVerdict;
  reasons: string[];
  artifactVerification: VerificationResult;
  receiptVerifications: VerificationResult;
  chainVerification: VerificationResult;
  checkpointVerification: VerificationResult;
  proofVerification: VerificationResult;
  timestamp: string;
  reportHash: string;
}

// ============================================================================
// ARTIFACT VERIFICATION
// ============================================================================

/**
 * Verify policy artifact signature
 */
export async function verifyArtifactSignature(
  artifact: PolicyArtifact,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const { signature, ...artifactWithoutSig } = artifact;
    const canonical = canonicalStringify(artifactWithoutSig);
    const bytes = new TextEncoder().encode(canonical);
    const hash = sha256(bytes);
    const signatureBytes = new Uint8Array(
      atob(signature)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    return await ed25519.verifyAsync(signatureBytes, hash, publicKey);
  } catch {
    return false;
  }
}

/**
 * Verify artifact structure and validity
 */
export function verifyArtifactStructure(
  artifact: PolicyArtifact
): VerificationResult {
  const checks: VerificationCheck[] = [];
  const now = new Date();

  // Check required fields
  checks.push({
    name: 'schema_version',
    passed: !!artifact.schemaVersion,
    details: artifact.schemaVersion || 'missing',
    critical: true,
  });

  checks.push({
    name: 'protocol_version',
    passed: !!artifact.protocolVersion,
    details: artifact.protocolVersion || 'missing',
    critical: true,
  });

  checks.push({
    name: 'artifact_id',
    passed: !!artifact.artifactId,
    details: artifact.artifactId || 'missing',
    critical: true,
  });

  checks.push({
    name: 'subject_identifier',
    passed: !!artifact.subjectIdentifier?.bytesHash && !!artifact.subjectIdentifier?.metadataHash,
    details: artifact.subjectIdentifier ? 'present' : 'missing',
    critical: true,
  });

  checks.push({
    name: 'sealed_hash',
    passed: !!artifact.sealedHash && artifact.sealedHash.length === 64,
    details: artifact.sealedHash ? `${artifact.sealedHash.substring(0, 16)}...` : 'missing',
    critical: true,
  });

  checks.push({
    name: 'salt',
    passed: !!artifact.salt && artifact.salt.length === 32,
    details: artifact.salt ? 'present (32 chars)' : 'missing',
    critical: true,
  });

  checks.push({
    name: 'signature',
    passed: !!artifact.signature,
    details: artifact.signature ? 'present' : 'missing',
    critical: true,
  });

  // Check validity window
  if (artifact.effectiveTimestamp) {
    const effective = new Date(artifact.effectiveTimestamp);
    checks.push({
      name: 'effective_timestamp',
      passed: now >= effective,
      details: `effective from ${artifact.effectiveTimestamp}`,
      critical: false,
    });
  }

  if (artifact.expirationTimestamp) {
    const expires = new Date(artifact.expirationTimestamp);
    checks.push({
      name: 'expiration_timestamp',
      passed: now < expires,
      details: `expires at ${artifact.expirationTimestamp}`,
      critical: false,
    });
  }

  const valid = checks.filter((c) => c.critical).every((c) => c.passed);

  return {
    valid,
    checks,
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// RECEIPT VERIFICATION
// ============================================================================

/**
 * Verify receipt signature
 */
export async function verifyReceiptSignature(
  receipt: EnforcementReceipt,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const { signature, ...receiptWithoutSig } = receipt;
    const canonical = canonicalStringify(receiptWithoutSig);
    const bytes = new TextEncoder().encode(canonical);
    const hash = sha256(bytes);
    const signatureBytes = new Uint8Array(
      atob(signature)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    return await ed25519.verifyAsync(signatureBytes, hash, publicKey);
  } catch {
    return false;
  }
}

/**
 * Verify all receipts in bundle
 */
export async function verifyAllReceipts(
  receipts: EnforcementReceipt[],
  publicKey: Uint8Array
): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];
  let allValid = true;

  for (const receipt of receipts) {
    const sigValid = await verifyReceiptSignature(receipt, publicKey);
    if (!sigValid) {
      allValid = false;
    }

    checks.push({
      name: `receipt_${receipt.chainLinkage.sequenceNumber}`,
      passed: sigValid,
      details: sigValid ? 'signature valid' : 'SIGNATURE_INVALID',
      critical: true,
    });
  }

  return {
    valid: allValid,
    checks,
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// CHAIN VERIFICATION
// ============================================================================

/**
 * Verify receipt chain integrity
 */
export function verifyChainIntegrity(
  receipts: EnforcementReceipt[]
): VerificationResult {
  const checks: VerificationCheck[] = [];
  const { valid, errors } = verifyReceiptChain(receipts);

  checks.push({
    name: 'chain_linkage',
    passed: valid,
    details: valid ? 'all links valid' : errors.join('; '),
    critical: true,
  });

  // Check for required events
  const eventTypes = new Set(receipts.map((r) => r.receiptType));

  // Check if there's any measurement-related receipt type
  const hasMeasurement = eventTypes.has('MEASUREMENT' as unknown as never) ||
    receipts.some((r) => r.measurement?.measurementDetails?.length > 0);

  checks.push({
    name: 'has_measurement_receipt',
    passed: hasMeasurement,
    details: hasMeasurement ? 'present' : 'missing (caveat)',
    critical: false,
  });

  return {
    valid,
    checks,
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// CHECKPOINT VERIFICATION
// ============================================================================

/**
 * Verify checkpoint signature
 */
export async function verifyCheckpointSignature(
  checkpoint: CheckpointRecord,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    const { checkpointSignature, ...checkpointWithoutSig } = checkpoint;
    const canonical = canonicalStringify(checkpointWithoutSig);
    const bytes = new TextEncoder().encode(canonical);
    const hash = sha256(bytes);
    const signatureBytes = new Uint8Array(
      atob(checkpointSignature)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    return await ed25519.verifyAsync(signatureBytes, hash, publicKey);
  } catch {
    return false;
  }
}

/**
 * Verify all checkpoints
 */
export async function verifyAllCheckpoints(
  checkpoints: CheckpointRecord[],
  publicKey: Uint8Array
): Promise<VerificationResult> {
  const checks: VerificationCheck[] = [];
  let allValid = true;

  if (checkpoints.length === 0) {
    checks.push({
      name: 'checkpoints',
      passed: true,
      details: 'SKIPPED (no checkpoints)',
      critical: false,
    });
  } else {
    for (const checkpoint of checkpoints) {
      const sigValid = await verifyCheckpointSignature(checkpoint, publicKey);
      if (!sigValid) {
        allValid = false;
      }

      checks.push({
        name: `checkpoint_${checkpoint.checkpointId.substring(0, 8)}`,
        passed: sigValid,
        details: sigValid ? 'signature valid' : 'SIGNATURE_INVALID',
        critical: true,
      });
    }
  }

  return {
    valid: allValid,
    checks,
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// INCLUSION PROOF VERIFICATION
// ============================================================================

/**
 * Verify all inclusion proofs
 */
export function verifyAllInclusionProofs(
  proofs: InclusionProof[],
  receipts: EnforcementReceipt[]
): VerificationResult {
  const checks: VerificationCheck[] = [];
  let allValid = true;

  if (proofs.length === 0) {
    checks.push({
      name: 'inclusion_proofs',
      passed: true,
      details: 'SKIPPED (no proofs)',
      critical: false,
    });
  } else {
    for (const proof of proofs) {
      // Find corresponding receipt
      const receipt = receipts.find(
        (r) => r.chainLinkage.sequenceNumber === proof.eventSequence
      );

      if (!receipt) {
        checks.push({
          name: `proof_seq_${proof.eventSequence}`,
          passed: false,
          details: 'RECEIPT_NOT_FOUND',
          critical: true,
        });
        allValid = false;
        continue;
      }

      // Verify leaf hash matches
      const leafHash = computeReceiptLeafHash(receipt);
      if (leafHash !== proof.eventLeafHash) {
        checks.push({
          name: `proof_seq_${proof.eventSequence}`,
          passed: false,
          details: 'LEAF_HASH_MISMATCH',
          critical: true,
        });
        allValid = false;
        continue;
      }

      // Verify Merkle proof
      const proofValid = verifyInclusionProof(
        proof.eventLeafHash,
        proof.proofPath,
        proof.merkleRoot
      );

      if (!proofValid) {
        allValid = false;
      }

      checks.push({
        name: `proof_seq_${proof.eventSequence}`,
        passed: proofValid,
        details: proofValid ? 'proof valid' : 'PROOF_INVALID',
        critical: true,
      });
    }
  }

  return {
    valid: allValid,
    checks,
    timestamp: getCurrentTimestamp(),
  };
}

// ============================================================================
// FULL BUNDLE VERIFICATION
// ============================================================================

/**
 * Perform full verification of evidence bundle
 */
export async function verifyBundle(
  bundle: EvidenceBundle
): Promise<FullVerificationResult> {
  const reasons: string[] = [];
  const timestamp = getCurrentTimestamp();

  // Import public keys
  const policyIssuerKey = importPublicKey(bundle.publicKeys.policyIssuerKey.publicKey);
  const enforcementKey = importPublicKey(bundle.publicKeys.enforcementKey.publicKey);
  const checkpointKey = importPublicKey(bundle.publicKeys.checkpointKey.publicKey);

  // 1. Verify artifact
  const artifactStructure = verifyArtifactStructure(bundle.policyArtifact);
  const artifactSigValid = await verifyArtifactSignature(bundle.policyArtifact, policyIssuerKey);

  if (!artifactStructure.valid) {
    reasons.push('ARTIFACT_STRUCTURE_INVALID');
  }
  if (!artifactSigValid) {
    reasons.push('ARTIFACT_SIGNATURE_INVALID');
  }

  const artifactVerification: VerificationResult = {
    valid: artifactStructure.valid && artifactSigValid,
    checks: [
      ...artifactStructure.checks,
      {
        name: 'artifact_signature',
        passed: artifactSigValid,
        details: artifactSigValid ? 'signature valid' : 'SIGNATURE_INVALID',
        critical: true,
      },
    ],
    timestamp,
  };

  // 2. Verify receipts
  const receiptVerifications = await verifyAllReceipts(bundle.receipts, enforcementKey);
  if (!receiptVerifications.valid) {
    reasons.push('RECEIPT_SIGNATURE_INVALID');
  }

  // 3. Verify chain
  const chainVerification = verifyChainIntegrity(bundle.receipts);
  if (!chainVerification.valid) {
    reasons.push('CHAIN_INTEGRITY_INVALID');
  }

  // 4. Verify checkpoints
  const checkpointVerification = await verifyAllCheckpoints(
    bundle.checkpointReferences,
    checkpointKey
  );
  if (!checkpointVerification.valid) {
    reasons.push('CHECKPOINT_INVALID');
  }

  // 5. Verify inclusion proofs
  const proofVerification = verifyAllInclusionProofs(
    bundle.inclusionProofs,
    bundle.receipts
  );
  if (!proofVerification.valid) {
    reasons.push('INCLUSION_PROOF_INVALID');
  }

  // Determine verdict
  let verdict: VerificationVerdict;
  const criticalFailures = reasons.filter(
    (r) =>
      r.includes('SIGNATURE_INVALID') ||
      r.includes('CHAIN_INTEGRITY') ||
      r.includes('STRUCTURE_INVALID')
  );

  if (criticalFailures.length > 0) {
    verdict = 'FAIL';
  } else if (reasons.length > 0) {
    verdict = 'PASS_WITH_CAVEATS';
  } else {
    verdict = 'PASS';
  }

  // Compute report hash
  const report = {
    verdict,
    reasons,
    timestamp,
    artifactId: bundle.policyArtifact.artifactId,
    receiptCount: bundle.receipts.length,
    checkpointCount: bundle.checkpointReferences.length,
  };
  const reportHash = computeBytesHash(
    new TextEncoder().encode(canonicalStringify(report))
  );

  return {
    verdict,
    reasons,
    artifactVerification,
    receiptVerifications,
    chainVerification,
    checkpointVerification,
    proofVerification,
    timestamp,
    reportHash,
  };
}

// ============================================================================
// VERIFICATION REPORT GENERATION
// ============================================================================

/**
 * Generate human-readable verification report
 */
export function generateVerificationReport(
  result: FullVerificationResult
): string {
  const lines: string[] = [];

  lines.push('ATTESTED GOVERNANCE ARTIFACT - VERIFICATION REPORT');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push(`Report Hash: ${result.reportHash}`);
  lines.push('');
  lines.push('RESULTS');
  lines.push('-'.repeat(30));
  lines.push(`artifact: ${result.artifactVerification.valid ? 'OK' : 'FAIL'}`);
  lines.push(`receipts: ${result.receiptVerifications.valid ? 'OK' : 'FAIL'}`);
  lines.push(`chain: ${result.chainVerification.valid ? 'OK' : 'FAIL'}`);
  lines.push(`checkpoints: ${result.checkpointVerification.valid ? 'OK' : 'FAIL'}`);
  lines.push(`proofs: ${result.proofVerification.valid ? 'OK' : 'FAIL'}`);
  lines.push('');
  lines.push(`overall: ${result.verdict}`);

  if (result.reasons.length > 0) {
    lines.push('');
    lines.push('ISSUES');
    lines.push('-'.repeat(30));
    for (const reason of result.reasons) {
      lines.push(`- ${reason}`);
    }
  }

  return lines.join('\n');
}

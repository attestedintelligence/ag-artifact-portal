/**
 * Offline Verifier Module
 * Per AGA Build Guide Phase 6
 *
 * Standalone verification tool for .agb bundles.
 * Outputs PASS / PASS_WITH_CAVEATS / FAIL
 */

import { canonicalize } from '../crypto/canonical';
import { sha256String } from '../crypto/hash';
import { verifyObject } from '../crypto/signature';
import { DOMAIN_SEPARATORS } from '../types';
import type {
  BundleManifest,
  PolicyArtifact,
  Receipt,
  ChainHead,
  VerifierOutput,
  VerifierCheck,
  VerifierWarning,
  VerifierVerdict,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface BundleContents {
  manifest: BundleManifest;
  artifact: PolicyArtifact;
  receipts: Receipt[];
  chainHead?: ChainHead;
  keyring?: unknown;
  merkleProofs?: unknown;
}

export interface VerificationOptions {
  trustIssuerKey?: boolean;
  trustedKeyIds?: string[];
  verifyTimestamps?: boolean;
  checkExpiration?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VERIFIER_VERSION = '1.0.0';
const ZERO_HASH = '0'.repeat(64);

// ============================================================================
// VERIFICATION CHECKS
// ============================================================================

async function checkManifestFormat(manifest: BundleManifest): Promise<VerifierCheck> {
  if (!manifest.format_version) {
    return { name: 'manifest_format', result: 'FAIL', reason: 'Missing format_version' };
  }

  if (manifest.format_version !== '1.0') {
    return {
      name: 'manifest_format',
      result: 'FAIL',
      reason: `Unsupported format version: ${manifest.format_version}`,
    };
  }

  return { name: 'manifest_format', result: 'PASS' };
}

async function checkManifestChecksums(
  manifest: BundleManifest,
  files: Map<string, Uint8Array>
): Promise<VerifierCheck> {
  for (const fileEntry of manifest.files) {
    const content = files.get(fileEntry.path);
    if (!content) {
      return {
        name: 'manifest_checksums',
        result: 'FAIL',
        reason: `Missing file: ${fileEntry.path}`,
      };
    }

    const computed = await sha256String(new TextDecoder().decode(content));
    if (computed !== fileEntry.sha256) {
      return {
        name: 'manifest_checksums',
        result: 'FAIL',
        reason: `Checksum mismatch for ${fileEntry.path}`,
      };
    }
  }

  return { name: 'manifest_checksums', result: 'PASS' };
}

async function checkPolicyArtifactSignature(
  artifact: PolicyArtifact
): Promise<VerifierCheck> {
  try {
    const isValid = await verifyObject(
      artifact.issuer.public_key,
      artifact.issuer.signature,
      DOMAIN_SEPARATORS.BUNDLE,
      artifact as unknown as Record<string, unknown>,
      ['issuer.signature']
    );

    if (!isValid) {
      return {
        name: 'artifact_signature',
        result: 'FAIL',
        reason: 'Invalid artifact signature',
      };
    }

    return { name: 'artifact_signature', result: 'PASS' };
  } catch (error) {
    return {
      name: 'artifact_signature',
      result: 'FAIL',
      reason: `Signature verification error: ${error}`,
    };
  }
}

async function checkPolicyHash(artifact: PolicyArtifact): Promise<VerifierCheck> {
  // Recompute policy hash
  const artifactForHash = {
    ...artifact,
    issuer: {
      public_key: artifact.issuer.public_key,
      key_id: artifact.issuer.key_id,
    },
    policy_hash: undefined,
  };

  const computed = await sha256String(canonicalize(artifactForHash));

  if (computed !== artifact.policy_hash) {
    return {
      name: 'policy_hash',
      result: 'FAIL',
      reason: 'Policy hash mismatch',
    };
  }

  return { name: 'policy_hash', result: 'PASS' };
}

async function checkReceiptSignatures(
  receipts: Receipt[],
  artifact: PolicyArtifact
): Promise<VerifierCheck> {
  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];

    try {
      const isValid = await verifyObject(
        receipt.signer.public_key,
        receipt.signer.signature,
        DOMAIN_SEPARATORS.BUNDLE,
        receipt as unknown as Record<string, unknown>,
        ['signer.signature']
      );

      if (!isValid) {
        return {
          name: 'receipt_signatures',
          result: 'FAIL',
          reason: `Invalid signature on receipt ${i + 1}`,
        };
      }
    } catch (error) {
      return {
        name: 'receipt_signatures',
        result: 'FAIL',
        reason: `Signature verification error on receipt ${i + 1}: ${error}`,
      };
    }
  }

  return { name: 'receipt_signatures', result: 'PASS' };
}

async function checkReceiptChain(receipts: Receipt[]): Promise<VerifierCheck> {
  if (receipts.length === 0) {
    return { name: 'receipt_chain', result: 'PASS' };
  }

  // Check first receipt has zero prev_hash
  if (receipts[0].chain.prev_receipt_hash !== ZERO_HASH) {
    return {
      name: 'receipt_chain',
      result: 'FAIL',
      reason: 'First receipt must have zero prev_hash',
    };
  }

  // Check chain linkage
  for (let i = 1; i < receipts.length; i++) {
    const prev = receipts[i - 1];
    const curr = receipts[i];

    if (curr.chain.prev_receipt_hash !== prev.chain.this_receipt_hash) {
      return {
        name: 'receipt_chain',
        result: 'FAIL',
        reason: `Chain break between receipts ${i} and ${i + 1}`,
      };
    }
  }

  // Check counter monotonicity
  for (let i = 1; i < receipts.length; i++) {
    if (receipts[i].sequence_number !== receipts[i - 1].sequence_number + 1) {
      return {
        name: 'receipt_chain',
        result: 'FAIL',
        reason: `Counter gap between receipts ${i} and ${i + 1}`,
      };
    }
  }

  return { name: 'receipt_chain', result: 'PASS' };
}

async function checkChainHead(
  receipts: Receipt[],
  chainHead?: ChainHead
): Promise<VerifierCheck> {
  if (!chainHead) {
    return { name: 'chain_head', result: 'PASS' };
  }

  if (receipts.length === 0) {
    if (chainHead.receipt_count !== 0) {
      return {
        name: 'chain_head',
        result: 'FAIL',
        reason: 'Chain head receipt_count mismatch',
      };
    }
    return { name: 'chain_head', result: 'PASS' };
  }

  const lastReceipt = receipts[receipts.length - 1];

  if (chainHead.receipt_count !== receipts.length) {
    return {
      name: 'chain_head',
      result: 'FAIL',
      reason: 'Chain head receipt_count mismatch',
    };
  }

  if (chainHead.head_receipt_hash !== lastReceipt.chain.this_receipt_hash) {
    return {
      name: 'chain_head',
      result: 'FAIL',
      reason: 'Chain head hash mismatch',
    };
  }

  return { name: 'chain_head', result: 'PASS' };
}

async function checkValidityWindow(artifact: PolicyArtifact): Promise<VerifierCheck> {
  const now = new Date();
  const notBefore = new Date(artifact.not_before);

  if (now < notBefore) {
    return {
      name: 'validity_window',
      result: 'FAIL',
      reason: 'Artifact not yet valid',
    };
  }

  if (artifact.not_after) {
    const notAfter = new Date(artifact.not_after);
    if (now > notAfter) {
      return {
        name: 'validity_window',
        result: 'FAIL',
        reason: 'Artifact has expired',
      };
    }
  }

  return { name: 'validity_window', result: 'PASS' };
}

// ============================================================================
// MAIN VERIFIER
// ============================================================================

export async function verifyBundle(
  contents: BundleContents,
  files: Map<string, Uint8Array>,
  options: VerificationOptions = {}
): Promise<VerifierOutput> {
  const checks: VerifierCheck[] = [];
  const warnings: VerifierWarning[] = [];

  // 1. Check manifest format
  checks.push(await checkManifestFormat(contents.manifest));

  // 2. Check manifest checksums
  checks.push(await checkManifestChecksums(contents.manifest, files));

  // 3. Check policy artifact signature
  checks.push(await checkPolicyArtifactSignature(contents.artifact));

  // 4. Check policy hash
  checks.push(await checkPolicyHash(contents.artifact));

  // 5. Check receipt signatures
  checks.push(await checkReceiptSignatures(contents.receipts, contents.artifact));

  // 6. Check receipt chain
  checks.push(await checkReceiptChain(contents.receipts));

  // 7. Check chain head
  checks.push(await checkChainHead(contents.receipts, contents.chainHead));

  // 8. Check validity window (optional)
  if (options.checkExpiration !== false) {
    checks.push(await checkValidityWindow(contents.artifact));
  }

  // Determine verdict
  const failedChecks = checks.filter((c) => c.result === 'FAIL');
  let verdict: VerifierVerdict;
  let exitCode: 0 | 1 | 2 | 3;

  if (failedChecks.length > 0) {
    verdict = 'FAIL';
    exitCode = 1;
  } else if (warnings.length > 0) {
    verdict = 'PASS_WITH_CAVEATS';
    exitCode = 2;
  } else {
    verdict = 'PASS';
    exitCode = 0;
  }

  // Compute report hash
  const reportData = {
    verdict,
    checks,
    warnings,
    bundle_id: contents.manifest.bundle_id,
    verified_at: new Date().toISOString(),
  };
  const reportHash = await sha256String(canonicalize(reportData));

  return {
    result: verdict,
    exit_code: exitCode,
    bundle_id: contents.manifest.bundle_id,
    checks,
    warnings,
    verified_artifact_hash: contents.artifact.policy_hash,
    verified_receipt_chain_head: contents.chainHead?.head_receipt_hash || ZERO_HASH,
    metadata: {
      format_version: contents.manifest.format_version,
      payload_included: contents.manifest.payload_included,
      time_anchor: 'self-attested',
      signing_key_id: contents.artifact.issuer.key_id,
    },
    report_hash: reportHash,
    verifier_version: VERIFIER_VERSION,
  };
}

// ============================================================================
// HELPER: Format output for CLI
// ============================================================================

export function formatVerifierOutput(output: VerifierOutput): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    BUNDLE VERIFICATION REPORT                  ');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Bundle ID:      ${output.bundle_id}`);
  lines.push(`Verifier:       ag-verify v${output.verifier_version}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────');
  lines.push('                         CHECKS                                 ');
  lines.push('───────────────────────────────────────────────────────────────');

  for (const check of output.checks) {
    const status = check.result === 'PASS' ? '✓' : '✗';
    const line = `  ${status} ${check.name.padEnd(25)} ${check.result}`;
    lines.push(line);
    if (check.reason) {
      lines.push(`      └─ ${check.reason}`);
    }
  }

  if (output.warnings.length > 0) {
    lines.push('');
    lines.push('───────────────────────────────────────────────────────────────');
    lines.push('                        WARNINGS                               ');
    lines.push('───────────────────────────────────────────────────────────────');

    for (const warning of output.warnings) {
      lines.push(`  ⚠ ${warning.code}: ${warning.message}`);
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`                      VERDICT: ${output.result}                `);
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Artifact Hash:  ${output.verified_artifact_hash}`);
  lines.push(`Chain Head:     ${output.verified_receipt_chain_head}`);
  lines.push(`Report Hash:    ${output.report_hash}`);
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// HELPER: Quick verify (returns boolean)
// ============================================================================

export async function quickVerify(contents: BundleContents): Promise<boolean> {
  const files = new Map<string, Uint8Array>();
  const output = await verifyBundle(contents, files, { checkExpiration: false });
  return output.result === 'PASS' || output.result === 'PASS_WITH_CAVEATS';
}

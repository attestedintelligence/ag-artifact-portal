/**
 * Attested Governance Artifacts - Evidence Bundle System
 * Per Evolution Spec v1.0 - Evidence Bundle Export
 */

import {
  canonicalStringify,
  computeBytesHash,
  generateUUID,
  getCurrentTimestamp,
  computeKeyId,
  exportPublicKey,
} from './crypto';
import type {
  PolicyArtifact,
  EnforcementReceipt,
  CheckpointRecord,
  InclusionProof,
  EvidenceBundle,
  PublicKeyInfo,
  VerificationInstructions,
} from './types';

// ============================================================================
// BUNDLE CREATION
// ============================================================================

export interface CreateBundleInput {
  artifact: PolicyArtifact;
  receipts: EnforcementReceipt[];
  inclusionProofs: InclusionProof[];
  checkpoints: CheckpointRecord[];
  policyIssuerPublicKey: Uint8Array;
  enforcementPublicKey: Uint8Array;
  checkpointPublicKey: Uint8Array;
}

/**
 * Create an evidence bundle for offline verification
 */
export function createEvidenceBundle(
  input: CreateBundleInput
): EvidenceBundle {
  const bundleId = generateUUID();
  const now = getCurrentTimestamp();

  // Create public key info
  const policyIssuerKey: PublicKeyInfo = {
    keyId: computeKeyId(input.policyIssuerPublicKey),
    algorithm: 'Ed25519',
    publicKey: exportPublicKey(input.policyIssuerPublicKey),
    fingerprint: computeBytesHash(input.policyIssuerPublicKey),
  };

  const enforcementKey: PublicKeyInfo = {
    keyId: computeKeyId(input.enforcementPublicKey),
    algorithm: 'Ed25519',
    publicKey: exportPublicKey(input.enforcementPublicKey),
    fingerprint: computeBytesHash(input.enforcementPublicKey),
  };

  const checkpointKey: PublicKeyInfo = {
    keyId: computeKeyId(input.checkpointPublicKey),
    algorithm: 'Ed25519',
    publicKey: exportPublicKey(input.checkpointPublicKey),
    fingerprint: computeBytesHash(input.checkpointPublicKey),
  };

  // Create verification instructions
  const verificationInstructions: VerificationInstructions = {
    steps: [
      '1. Verify policy artifact signature using policyIssuerKey',
      '2. Verify all receipt signatures using enforcementKey',
      '3. Verify receipt chain integrity (prev_hash linkage)',
      '4. Verify checkpoint signatures using checkpointKey',
      '5. Verify inclusion proofs against checkpoint Merkle roots',
      '6. Verify artifact sealed hash matches policy reference',
      '7. Check artifact validity window (not_before/not_after)',
    ],
    offlineCapable: true,
    requiredKeys: [
      policyIssuerKey.keyId,
      enforcementKey.keyId,
      checkpointKey.keyId,
    ],
  };

  return {
    bundleId,
    bundleVersion: '1.0.0',
    created: now,
    policyArtifact: input.artifact,
    receipts: input.receipts,
    inclusionProofs: input.inclusionProofs,
    checkpointReferences: input.checkpoints,
    publicKeys: {
      policyIssuerKey,
      enforcementKey,
      checkpointKey,
    },
    verificationInstructions,
  };
}

// ============================================================================
// BUNDLE SERIALIZATION
// ============================================================================

/**
 * Serialize bundle to JSON
 */
export function serializeBundle(bundle: EvidenceBundle): string {
  return canonicalStringify(bundle);
}

/**
 * Parse bundle from JSON
 */
export function parseBundle(json: string): EvidenceBundle {
  return JSON.parse(json) as EvidenceBundle;
}

/**
 * Compute bundle hash
 */
export function computeBundleHash(bundle: EvidenceBundle): string {
  const canonical = canonicalStringify(bundle);
  const bytes = new TextEncoder().encode(canonical);
  return computeBytesHash(bytes);
}

// ============================================================================
// BUNDLE MANIFEST
// ============================================================================

export interface BundleManifest {
  bundleVersion: string;
  createdAt: string;
  artifactId: string;
  policyHash: string;
  receiptCount: number;
  checkpointCount: number;
  bundleHash: string;
  files: BundleFile[];
  verifier: {
    name: string;
    version: string;
    entrypoint: string;
  };
  optional: {
    merkle: 'SKIPPED' | string;
    anchor: 'SKIPPED' | string;
  };
}

export interface BundleFile {
  path: string;
  sha256: string;
  sizeBytes: number;
}

/**
 * Create bundle manifest
 */
export function createBundleManifest(
  bundle: EvidenceBundle,
  files: BundleFile[]
): BundleManifest {
  return {
    bundleVersion: bundle.bundleVersion,
    createdAt: bundle.created,
    artifactId: bundle.policyArtifact.artifactId,
    policyHash: bundle.policyArtifact.policyReference,
    receiptCount: bundle.receipts.length,
    checkpointCount: bundle.checkpointReferences.length,
    bundleHash: computeBundleHash(bundle),
    files,
    verifier: {
      name: 'aga-verifier',
      version: '1.0.0',
      entrypoint: 'verifier/verify.js',
    },
    optional: {
      merkle: bundle.checkpointReferences.length > 0
        ? bundle.checkpointReferences[0].merkleRoot
        : 'SKIPPED',
      anchor: bundle.checkpointReferences.length > 0 &&
        bundle.checkpointReferences[0].anchorProof.transactionId
        ? bundle.checkpointReferences[0].anchorProof.transactionId
        : 'SKIPPED',
    },
  };
}

// ============================================================================
// ZIP BUNDLE GENERATION (for client-side)
// ============================================================================

export interface ZipBundleContent {
  'bundle_manifest.json': string;
  'policy/policy_artifact.json': string;
  'receipts/receipts.json': string;
  'receipts/chain_head.json': string;
  'checkpoints/checkpoints.json': string;
  'proofs/inclusion_proofs.json': string;
  'keys/public_keys.json': string;
  'verifier/instructions.json': string;
  'README.txt': string;
}

/**
 * Generate ZIP bundle content structure
 */
export function generateZipBundleContent(
  bundle: EvidenceBundle
): ZipBundleContent {
  const files: BundleFile[] = [];

  const policyJson = canonicalStringify(bundle.policyArtifact);
  files.push({
    path: 'policy/policy_artifact.json',
    sha256: computeBytesHash(new TextEncoder().encode(policyJson)),
    sizeBytes: new TextEncoder().encode(policyJson).length,
  });

  const receiptsJson = canonicalStringify(bundle.receipts);
  files.push({
    path: 'receipts/receipts.json',
    sha256: computeBytesHash(new TextEncoder().encode(receiptsJson)),
    sizeBytes: new TextEncoder().encode(receiptsJson).length,
  });

  const chainHead = {
    chainVersion: '1',
    receiptCount: bundle.receipts.length,
    headSequenceNumber: bundle.receipts.length > 0
      ? bundle.receipts[bundle.receipts.length - 1].chainLinkage.sequenceNumber
      : 0,
    headReceiptHash: bundle.receipts.length > 0
      ? computeBytesHash(
          new TextEncoder().encode(
            canonicalStringify(bundle.receipts[bundle.receipts.length - 1])
          )
        )
      : '',
  };
  const chainHeadJson = canonicalStringify(chainHead);
  files.push({
    path: 'receipts/chain_head.json',
    sha256: computeBytesHash(new TextEncoder().encode(chainHeadJson)),
    sizeBytes: new TextEncoder().encode(chainHeadJson).length,
  });

  const checkpointsJson = canonicalStringify(bundle.checkpointReferences);
  files.push({
    path: 'checkpoints/checkpoints.json',
    sha256: computeBytesHash(new TextEncoder().encode(checkpointsJson)),
    sizeBytes: new TextEncoder().encode(checkpointsJson).length,
  });

  const proofsJson = canonicalStringify(bundle.inclusionProofs);
  files.push({
    path: 'proofs/inclusion_proofs.json',
    sha256: computeBytesHash(new TextEncoder().encode(proofsJson)),
    sizeBytes: new TextEncoder().encode(proofsJson).length,
  });

  const keysJson = canonicalStringify(bundle.publicKeys);
  files.push({
    path: 'keys/public_keys.json',
    sha256: computeBytesHash(new TextEncoder().encode(keysJson)),
    sizeBytes: new TextEncoder().encode(keysJson).length,
  });

  const instructionsJson = canonicalStringify(bundle.verificationInstructions);
  files.push({
    path: 'verifier/instructions.json',
    sha256: computeBytesHash(new TextEncoder().encode(instructionsJson)),
    sizeBytes: new TextEncoder().encode(instructionsJson).length,
  });

  const manifest = createBundleManifest(bundle, files);
  const manifestJson = canonicalStringify(manifest);

  const readme = generateReadme(bundle);

  return {
    'bundle_manifest.json': manifestJson,
    'policy/policy_artifact.json': policyJson,
    'receipts/receipts.json': receiptsJson,
    'receipts/chain_head.json': chainHeadJson,
    'checkpoints/checkpoints.json': checkpointsJson,
    'proofs/inclusion_proofs.json': proofsJson,
    'keys/public_keys.json': keysJson,
    'verifier/instructions.json': instructionsJson,
    'README.txt': readme,
  };
}

/**
 * Generate README content
 */
function generateReadme(bundle: EvidenceBundle): string {
  return `ATTESTED GOVERNANCE ARTIFACT - EVIDENCE BUNDLE
=============================================

Bundle ID: ${bundle.bundleId}
Created: ${bundle.created}
Artifact ID: ${bundle.policyArtifact.artifactId}

VERIFICATION
------------
This bundle can be verified offline using the included verifier.

Command: node verifier/verify.js bundle.zip

Expected output on valid bundle:
  artifact: OK
  receipts: OK (${bundle.receipts.length}/${bundle.receipts.length})
  chain: OK
  checkpoints: OK
  overall: PASS

TAMPER TEST
-----------
To test tamper detection, modify any file in this bundle.
The verifier should output:
  overall: FAIL
  error_code: SIGNATURE_INVALID or HASH_MISMATCH

CONTENTS
--------
- bundle_manifest.json: Bundle metadata and file checksums
- policy/: Policy artifact with issuer signature
- receipts/: Signed enforcement receipts and chain head
- checkpoints/: Merkle checkpoints and anchor proofs
- proofs/: Inclusion proofs for critical receipts
- keys/: Public keys for signature verification
- verifier/: Offline verification instructions

KEYS
----
Policy Issuer Key ID: ${bundle.publicKeys.policyIssuerKey.keyId}
Enforcement Key ID: ${bundle.publicKeys.enforcementKey.keyId}
Checkpoint Key ID: ${bundle.publicKeys.checkpointKey.keyId}

Generated by AGA Portal
Attested Intelligence - The Integrity Layer for Autonomous Defense
`;
}

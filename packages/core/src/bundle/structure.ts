/**
 * Bundle Structure Module
 * Per AGA Build Guide Phase 4.1
 *
 * Defines the .agb bundle format structure and manifest.
 */

import { canonicalize } from '../crypto/canonical';
import { sha256String } from '../crypto/hash';
import type {
  BundleManifest,
  BundleFile,
  PolicyArtifact,
  Receipt,
  ChainHead,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

export const BUNDLE_FORMAT_VERSION = '1.0' as const;
export const MIN_VERIFIER_VERSION = '1.0.0' as const;

// Standard paths in the bundle
export const BUNDLE_PATHS = {
  MANIFEST: 'manifest.json',
  POLICY_ARTIFACT: 'PolicyArtifact.json',
  LEDGER: 'ledger.jsonl',
  MERKLE_PROOFS: 'merkle/proofs.json',
  KEYRING: 'keys/keyring.json',
  TIMESTAMP_TOKEN: 'timestamp_token.tst',
  PAYLOAD_DIR: 'payload/',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface BundleOptions {
  includePayload: boolean;
  includeMerkleProofs: boolean;
  includeTimestampToken: boolean;
}

export interface LedgerEntry {
  receipt: Receipt;
  sequence: number;
}

export interface KeyringEntry {
  key_id: string;
  public_key: string;
  role: 'issuer' | 'attestor' | 'platform';
  name?: string;
  valid_from: string;
  valid_until?: string;
}

export interface Keyring {
  version: '1.0';
  keys: KeyringEntry[];
}

export interface MerkleProofEntry {
  receipt_id: string;
  checkpoint_id: string;
  proof: {
    leaf_hash: string;
    leaf_index: number;
    siblings: Array<{ hash: string; position: 'left' | 'right' }>;
    root: string;
  };
}

export interface MerkleProofsFile {
  version: '1.0';
  proofs: MerkleProofEntry[];
}

// ============================================================================
// MANIFEST GENERATOR
// ============================================================================

export async function generateManifest(
  artifact: PolicyArtifact,
  receipts: Receipt[],
  chainHead: ChainHead,
  options: BundleOptions,
  files: Map<string, Uint8Array>
): Promise<BundleManifest> {
  // Compute checksums for all files
  const bundleFiles: BundleFile[] = [];

  const entries = Array.from(files.entries());
  for (const entry of entries) {
    const [path, content] = entry;
    const hash = await sha256String(new TextDecoder().decode(content));
    bundleFiles.push({
      path,
      sha256: hash,
      size_bytes: content.length,
    });
  }

  // Determine included components
  const components: string[] = ['PolicyArtifact', 'ledger', 'keyring'];
  if (options.includeMerkleProofs) {
    components.push('merkle');
  }
  if (options.includeTimestampToken) {
    components.push('timestamp');
  }
  if (options.includePayload) {
    components.push('payload');
  }

  const manifest: BundleManifest = {
    format_version: BUNDLE_FORMAT_VERSION,
    min_verifier_version: MIN_VERIFIER_VERSION,
    created_at: new Date().toISOString(),
    bundle_id: `bnd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    policy_id: artifact.policy_hash,
    artifact_id: artifact.artifact_id,
    run_id: chainHead.run_id,
    receipt_count: receipts.length,
    chain_head_hash: chainHead.head_receipt_hash,
    files: bundleFiles,
    components,
    payload_included: options.includePayload,
    verifier: {
      name: 'ag-verify',
      version: MIN_VERIFIER_VERSION,
      entrypoint: 'ag-verify',
    },
    optional: {
      merkle: options.includeMerkleProofs ? {} : 'SKIPPED',
      anchor: 'SKIPPED', // Arweave anchor is separate
    },
  };

  return manifest;
}

// ============================================================================
// LEDGER FORMATTER
// ============================================================================

export function formatLedger(receipts: Receipt[]): string {
  // Convert receipts to JSON Lines format
  return receipts
    .map((receipt) => canonicalize(receipt))
    .join('\n');
}

export function parseLedger(jsonl: string): Receipt[] {
  return jsonl
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Receipt);
}

// ============================================================================
// KEYRING GENERATOR
// ============================================================================

export function generateKeyring(
  artifact: PolicyArtifact,
  platformPublicKey?: string
): Keyring {
  const keys: KeyringEntry[] = [];

  // Add issuer key
  keys.push({
    key_id: artifact.issuer.key_id,
    public_key: artifact.issuer.public_key,
    role: 'issuer',
    valid_from: artifact.issued_at,
    valid_until: artifact.not_after || undefined,
  });

  // Add attestor keys
  for (const attestation of artifact.attestations) {
    keys.push({
      key_id: attestation.attestor_id,
      public_key: attestation.public_key,
      role: 'attestor',
      name: attestation.attestor_name,
      valid_from: attestation.timestamp,
    });
  }

  // Add key schedule keys
  for (const key of artifact.key_schedule) {
    // Avoid duplicates
    if (!keys.some((k) => k.key_id === key.key_id)) {
      keys.push({
        key_id: key.key_id,
        public_key: key.public_key,
        role: 'issuer',
        valid_from: key.created_at,
        valid_until: key.revoked_at,
      });
    }
  }

  // Add platform key if provided
  if (platformPublicKey) {
    keys.push({
      key_id: 'platform',
      public_key: platformPublicKey,
      role: 'platform',
      name: 'Attested Intelligence',
      valid_from: '2024-01-01T00:00:00Z',
    });
  }

  return {
    version: '1.0',
    keys,
  };
}

// ============================================================================
// MERKLE PROOFS AGGREGATOR
// ============================================================================

export function generateMerkleProofsFile(
  proofs: MerkleProofEntry[]
): MerkleProofsFile {
  return {
    version: '1.0',
    proofs,
  };
}

// ============================================================================
// CHECKSUM CALCULATOR
// ============================================================================

export async function calculateChecksums(
  files: Map<string, Uint8Array>
): Promise<Record<string, string>> {
  const checksums: Record<string, string> = {};

  const entries = Array.from(files.entries());
  for (const entry of entries) {
    const [path, content] = entry;
    const hash = await sha256String(new TextDecoder().decode(content));
    checksums[path] = hash;
  }

  return checksums;
}

// ============================================================================
// BUNDLE FILE HELPERS
// ============================================================================

export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function jsonToBytes(obj: unknown): Uint8Array {
  return stringToBytes(JSON.stringify(obj, null, 2));
}

export function canonicalJsonToBytes(obj: unknown): Uint8Array {
  return stringToBytes(canonicalize(obj));
}

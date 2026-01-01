/**
 * Bundle Generator Module
 * Per AGA Build Guide Phase 4.2
 *
 * Generates complete .agb bundles from artifact data.
 */

import {
  BUNDLE_PATHS,
  BundleOptions,
  generateManifest,
  formatLedger,
  generateKeyring,
  generateMerkleProofsFile,
  canonicalJsonToBytes,
  jsonToBytes,
  stringToBytes,
  type MerkleProofEntry,
} from './structure';
import { canonicalize } from '../crypto/canonical';
import type {
  PolicyArtifact,
  Receipt,
  ChainHead,
  BundleManifest,
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface BundleGeneratorInput {
  artifact: PolicyArtifact;
  receipts: Receipt[];
  chainHead: ChainHead;
  payload?: {
    filename: string;
    content: Uint8Array;
  };
  merkleProofs?: MerkleProofEntry[];
  timestampToken?: Uint8Array;
  platformPublicKey?: string;
}

export interface GeneratedBundle {
  manifest: BundleManifest;
  files: Map<string, Uint8Array>;
  blob: Blob;
  filename: string;
}

// ============================================================================
// BUNDLE GENERATOR CLASS
// ============================================================================

export class BundleGenerator {
  private options: BundleOptions;

  constructor(options: Partial<BundleOptions> = {}) {
    this.options = {
      includePayload: options.includePayload ?? false,
      includeMerkleProofs: options.includeMerkleProofs ?? true,
      includeTimestampToken: options.includeTimestampToken ?? false,
    };
  }

  /**
   * Generate a complete .agb bundle
   */
  async generate(input: BundleGeneratorInput): Promise<GeneratedBundle> {
    const files = new Map<string, Uint8Array>();

    // 1. Generate PolicyArtifact.json
    const artifactJson = canonicalize(input.artifact);
    files.set(BUNDLE_PATHS.POLICY_ARTIFACT, stringToBytes(artifactJson));

    // 2. Generate ledger.jsonl
    const ledger = formatLedger(input.receipts);
    files.set(BUNDLE_PATHS.LEDGER, stringToBytes(ledger));

    // 3. Generate keyring
    const keyring = generateKeyring(input.artifact, input.platformPublicKey);
    files.set(BUNDLE_PATHS.KEYRING, jsonToBytes(keyring));

    // 4. Generate Merkle proofs (if available)
    if (this.options.includeMerkleProofs && input.merkleProofs?.length) {
      const proofsFile = generateMerkleProofsFile(input.merkleProofs);
      files.set(BUNDLE_PATHS.MERKLE_PROOFS, jsonToBytes(proofsFile));
    }

    // 5. Add timestamp token (if available)
    if (this.options.includeTimestampToken && input.timestampToken) {
      files.set(BUNDLE_PATHS.TIMESTAMP_TOKEN, input.timestampToken);
    }

    // 6. Add payload (if included)
    if (this.options.includePayload && input.payload) {
      const payloadPath = `${BUNDLE_PATHS.PAYLOAD_DIR}${input.payload.filename}`;
      files.set(payloadPath, input.payload.content);
    }

    // 7. Generate manifest
    const manifest = await generateManifest(
      input.artifact,
      input.receipts,
      input.chainHead,
      this.options,
      files
    );

    // Add manifest to files (must be last so it includes checksums of all other files)
    files.set(BUNDLE_PATHS.MANIFEST, jsonToBytes(manifest));

    // 8. Create ZIP archive
    const blob = await this.createZipArchive(files);

    // 9. Generate filename
    const filename = this.generateFilename(input.artifact);

    return {
      manifest,
      files,
      blob,
      filename,
    };
  }

  /**
   * Create a ZIP archive from files
   * Using a simplified implementation that creates a valid ZIP structure
   */
  private async createZipArchive(files: Map<string, Uint8Array>): Promise<Blob> {
    // Sort files for deterministic ordering
    const sortedPaths = Array.from(files.keys()).sort();

    // Build ZIP file manually (simplified - in production use JSZip)
    const parts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const path of sortedPaths) {
      const content = files.get(path)!;

      // Local file header
      const header = this.createLocalFileHeader(path, content);
      parts.push(header);

      // File data (uncompressed)
      parts.push(content);

      // Central directory entry
      const cdEntry = this.createCentralDirectoryEntry(path, content, offset);
      centralDirectory.push(cdEntry);

      offset += header.length + content.length;
    }

    // Central directory
    const cdStart = offset;
    for (const entry of centralDirectory) {
      parts.push(entry);
      offset += entry.length;
    }

    // End of central directory
    const eocd = this.createEndOfCentralDirectory(
      sortedPaths.length,
      offset - cdStart,
      cdStart
    );
    parts.push(eocd);

    // Combine all parts
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
      result.set(part, pos);
      pos += part.length;
    }

    return new Blob([result], { type: 'application/zip' });
  }

  /**
   * Create local file header for ZIP entry
   */
  private createLocalFileHeader(path: string, content: Uint8Array): Uint8Array {
    const pathBytes = new TextEncoder().encode(path);
    const header = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(header.buffer);

    // Local file header signature
    view.setUint32(0, 0x04034b50, true);
    // Version needed to extract
    view.setUint16(4, 20, true);
    // General purpose bit flag
    view.setUint16(6, 0, true);
    // Compression method (0 = stored)
    view.setUint16(8, 0, true);
    // Last mod time
    view.setUint16(10, 0, true);
    // Last mod date
    view.setUint16(12, 0, true);
    // CRC-32 (simplified - would need actual CRC)
    view.setUint32(14, 0, true);
    // Compressed size
    view.setUint32(18, content.length, true);
    // Uncompressed size
    view.setUint32(22, content.length, true);
    // File name length
    view.setUint16(26, pathBytes.length, true);
    // Extra field length
    view.setUint16(28, 0, true);
    // File name
    header.set(pathBytes, 30);

    return header;
  }

  /**
   * Create central directory entry for ZIP
   */
  private createCentralDirectoryEntry(
    path: string,
    content: Uint8Array,
    localHeaderOffset: number
  ): Uint8Array {
    const pathBytes = new TextEncoder().encode(path);
    const entry = new Uint8Array(46 + pathBytes.length);
    const view = new DataView(entry.buffer);

    // Central directory file header signature
    view.setUint32(0, 0x02014b50, true);
    // Version made by
    view.setUint16(4, 20, true);
    // Version needed to extract
    view.setUint16(6, 20, true);
    // General purpose bit flag
    view.setUint16(8, 0, true);
    // Compression method
    view.setUint16(10, 0, true);
    // Last mod time
    view.setUint16(12, 0, true);
    // Last mod date
    view.setUint16(14, 0, true);
    // CRC-32
    view.setUint32(16, 0, true);
    // Compressed size
    view.setUint32(20, content.length, true);
    // Uncompressed size
    view.setUint32(24, content.length, true);
    // File name length
    view.setUint16(28, pathBytes.length, true);
    // Extra field length
    view.setUint16(30, 0, true);
    // File comment length
    view.setUint16(32, 0, true);
    // Disk number start
    view.setUint16(34, 0, true);
    // Internal file attributes
    view.setUint16(36, 0, true);
    // External file attributes
    view.setUint32(38, 0, true);
    // Relative offset of local header
    view.setUint32(42, localHeaderOffset, true);
    // File name
    entry.set(pathBytes, 46);

    return entry;
  }

  /**
   * Create end of central directory record
   */
  private createEndOfCentralDirectory(
    entryCount: number,
    cdSize: number,
    cdOffset: number
  ): Uint8Array {
    const eocd = new Uint8Array(22);
    const view = new DataView(eocd.buffer);

    // End of central directory signature
    view.setUint32(0, 0x06054b50, true);
    // Number of this disk
    view.setUint16(4, 0, true);
    // Disk where central directory starts
    view.setUint16(6, 0, true);
    // Number of central directory records on this disk
    view.setUint16(8, entryCount, true);
    // Total number of central directory records
    view.setUint16(10, entryCount, true);
    // Size of central directory
    view.setUint32(12, cdSize, true);
    // Offset of start of central directory
    view.setUint32(16, cdOffset, true);
    // Comment length
    view.setUint16(20, 0, true);

    return eocd;
  }

  /**
   * Generate bundle filename
   */
  private generateFilename(artifact: PolicyArtifact): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const artifactName = artifact.artifact_id.replace(/[^a-zA-Z0-9]/g, '_');
    return `${artifactName}_${timestamp}.agb`;
  }
}

// ============================================================================
// DOWNLOAD HANDLER
// ============================================================================

export function downloadBundle(bundle: GeneratedBundle): void {
  const url = URL.createObjectURL(bundle.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = bundle.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// BUNDLE READER (for verification)
// ============================================================================

export async function readBundleManifest(blob: Blob): Promise<BundleManifest | null> {
  try {
    // For now, simplified reading - in production would parse ZIP properly
    const text = await blob.text();
    const manifestMatch = text.match(/"format_version":\s*"1\.0"/);
    if (!manifestMatch) return null;

    // Extract manifest JSON (simplified - would need proper ZIP parsing)
    const start = text.indexOf('{"format_version"');
    if (start === -1) return null;

    let depth = 0;
    let end = start;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      if (text[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    const manifestJson = text.slice(start, end);
    return JSON.parse(manifestJson) as BundleManifest;
  } catch (error) {
    console.error('Failed to read bundle manifest:', error);
    return null;
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export const bundleGenerator = new BundleGenerator();

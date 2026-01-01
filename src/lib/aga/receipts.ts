/**
 * Attested Governance Artifacts - Receipt Chain System
 * Per Evolution Spec v1.0 - Steps 26-33
 */

import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import * as ed25519 from '@noble/ed25519';
import {
  canonicalStringify,
  computeBytesHash,
  generateUUID,
  getCurrentTimestamp,
  buildMerkleTree,
  generateInclusionProof,
} from './crypto';
import type {
  EnforcementReceipt,
  ReceiptType,
  ChainEvent,
  ChainEventType,
  EnforcementAction,
  ActionOutcome,
  MeasurementDetail,
  DriftDetails,
  CheckpointRecord,
  InclusionProof,
} from './types';
import { SCHEMA_VERSION, PROTOCOL_VERSION } from './crypto';

// ============================================================================
// RECEIPT CREATION
// ============================================================================

export interface CreateReceiptInput {
  receiptType: ReceiptType;
  artifactId: string;
  artifactHash: string;
  policyReference: string;
  policyIssuerKeyId: string;
  subjectBytesHash: string;
  subjectMetadataHash: string;
  sealedHash: string;
  currentHash: string;
  measurementDetails: MeasurementDetail[];
  driftDetected: boolean;
  driftDetails: DriftDetails | null;
  actionExecuted: EnforcementAction;
  actionOutcome: ActionOutcome;
  outcomeDetails: Record<string, unknown>;
  chainId: string;
  sequenceNumber: number;
  previousReceiptHash: string;
  portalIdentifier: string;
  signingPrivateKey: Uint8Array;
}

/**
 * Create a signed enforcement receipt
 */
export async function createReceipt(
  input: CreateReceiptInput
): Promise<EnforcementReceipt> {
  const receiptId = generateUUID();
  const now = getCurrentTimestamp();
  const measurementTimestamp = now;
  const actionTimestamp = now;

  // Build unsigned receipt
  const unsignedReceipt: Omit<EnforcementReceipt, 'signature'> = {
    schemaVersion: SCHEMA_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    receiptId,
    receiptType: input.receiptType,
    artifactReference: {
      artifactId: input.artifactId,
      artifactHash: input.artifactHash,
      policyReference: input.policyReference,
      policyIssuerKeyId: input.policyIssuerKeyId,
    },
    subjectIdentifier: {
      bytesHash: input.subjectBytesHash,
      metadataHash: input.subjectMetadataHash,
    },
    measurement: {
      sealedHash: input.sealedHash,
      currentHash: input.currentHash,
      match: input.sealedHash === input.currentHash,
      measurementDetails: input.measurementDetails,
      measurementTimestamp,
      measurementLatencyMs: 0,
    },
    enforcement: {
      driftDetected: input.driftDetected,
      driftDetails: input.driftDetails,
      actionExecuted: input.actionExecuted,
      actionTimestamp,
      actionOutcome: input.actionOutcome,
      outcomeDetails: input.outcomeDetails,
    },
    chainLinkage: {
      sequenceNumber: input.sequenceNumber,
      previousReceiptHash: input.previousReceiptHash,
      chainId: input.chainId,
    },
    timestamp: now,
    portalIdentifier: input.portalIdentifier,
  };

  // Sign the receipt
  const canonical = canonicalStringify(unsignedReceipt);
  const bytes = new TextEncoder().encode(canonical);
  const hash = sha256(bytes);
  const signature = await ed25519.signAsync(hash, input.signingPrivateKey);
  const signatureB64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

  return {
    ...unsignedReceipt,
    signature: signatureB64,
  };
}

// ============================================================================
// RECEIPT HASH COMPUTATION
// ============================================================================

/**
 * Compute receipt hash for chain linkage
 */
export function computeReceiptHash(
  receipt: EnforcementReceipt
): string {
  const canonical = canonicalStringify(receipt);
  const bytes = new TextEncoder().encode(canonical);
  return computeBytesHash(bytes);
}

/**
 * Compute leaf hash for privacy-preserving verification
 * Uses structural metadata only (no payload)
 */
export function computeReceiptLeafHash(
  receipt: EnforcementReceipt
): string {
  // Structural metadata only
  const structural = [
    receipt.schemaVersion,
    receipt.protocolVersion,
    receipt.receiptId,
    receipt.receiptType,
    receipt.chainLinkage.sequenceNumber.toString(),
    receipt.chainLinkage.previousReceiptHash,
    receipt.chainLinkage.chainId,
    receipt.timestamp,
  ].join('|');

  const bytes = new TextEncoder().encode(structural);
  return computeBytesHash(bytes);
}

// ============================================================================
// CHAIN EVENT CREATION
// ============================================================================

export interface CreateChainEventInput {
  eventType: ChainEventType;
  payload: Record<string, unknown>;
  sequenceNumber: number;
  previousLeafHash: string | null;
  signingPrivateKey: Uint8Array;
}

/**
 * Create a signed chain event
 */
export async function createChainEvent(
  input: CreateChainEventInput
): Promise<ChainEvent> {
  const eventId = generateUUID();
  const now = getCurrentTimestamp();

  // Compute payload hash
  const payloadCanonical = canonicalStringify(input.payload);
  const payloadBytes = new TextEncoder().encode(payloadCanonical);
  const payloadHash = computeBytesHash(payloadBytes);

  // Build unsigned event
  const unsignedEvent: Omit<ChainEvent, 'eventSignature'> = {
    schemaVersion: SCHEMA_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    eventType: input.eventType,
    eventId,
    sequenceNumber: input.sequenceNumber,
    timestamp: now,
    previousLeafHash: input.previousLeafHash,
    payload: input.payload,
    payloadHash,
  };

  // Sign the event
  const canonical = canonicalStringify(unsignedEvent);
  const bytes = new TextEncoder().encode(canonical);
  const hash = sha256(bytes);
  const signature = await ed25519.signAsync(hash, input.signingPrivateKey);
  const signatureB64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

  return {
    ...unsignedEvent,
    eventSignature: signatureB64,
  };
}

// ============================================================================
// GENESIS EVENT
// ============================================================================

export interface CreateGenesisEventInput {
  chainId: string;
  taxonomyVersion: string;
  initialPolicies: string[];
  chainPurpose: string;
  signingPrivateKey: Uint8Array;
}

/**
 * Create genesis event for a new chain
 */
export async function createGenesisEvent(
  input: CreateGenesisEventInput
): Promise<ChainEvent> {
  return createChainEvent({
    eventType: 'GENESIS' as ChainEventType,
    payload: {
      chainId: input.chainId,
      taxonomyVersion: input.taxonomyVersion,
      initialPolicies: input.initialPolicies,
      chainPurpose: input.chainPurpose,
    },
    sequenceNumber: 0,
    previousLeafHash: null,
    signingPrivateKey: input.signingPrivateKey,
  });
}

// ============================================================================
// CHAIN OPERATIONS
// ============================================================================

/**
 * Verify receipt chain integrity
 */
export function verifyReceiptChain(
  receipts: EnforcementReceipt[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (receipts.length === 0) {
    return { valid: true, errors: [] };
  }

  // Sort by sequence number
  const sorted = [...receipts].sort(
    (a, b) => a.chainLinkage.sequenceNumber - b.chainLinkage.sequenceNumber
  );

  // Verify chain linkage
  for (let i = 0; i < sorted.length; i++) {
    const receipt = sorted[i];
    const expectedSeq = i + 1;

    // Check sequence number
    if (receipt.chainLinkage.sequenceNumber !== expectedSeq) {
      errors.push(
        `Sequence gap: expected ${expectedSeq}, got ${receipt.chainLinkage.sequenceNumber}`
      );
    }

    // Check previous hash linkage
    if (i === 0) {
      // First receipt should have zero hash
      const zeroHash = '0'.repeat(64);
      if (
        receipt.chainLinkage.previousReceiptHash !== zeroHash &&
        receipt.chainLinkage.previousReceiptHash !== ''
      ) {
        errors.push('First receipt should have zero/empty previous hash');
      }
    } else {
      const prevReceipt = sorted[i - 1];
      const expectedPrevHash = computeReceiptHash(prevReceipt);
      if (receipt.chainLinkage.previousReceiptHash !== expectedPrevHash) {
        errors.push(
          `Chain break at sequence ${receipt.chainLinkage.sequenceNumber}: ` +
          `expected prev hash ${expectedPrevHash.substring(0, 16)}..., ` +
          `got ${receipt.chainLinkage.previousReceiptHash.substring(0, 16)}...`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// CHECKPOINT CREATION
// ============================================================================

export interface CreateCheckpointInput {
  chainId: string;
  receipts: EnforcementReceipt[];
  startSequence: number;
  endSequence: number;
  signingPrivateKey: Uint8Array;
  signingKeyId: string;
  anchorNetworkId?: string;
  anchorTxId?: string;
  anchorBlockNumber?: number;
  anchorBlockHash?: string;
}

/**
 * Create a checkpoint record with Merkle root
 */
export async function createCheckpoint(
  input: CreateCheckpointInput
): Promise<CheckpointRecord> {
  const checkpointId = generateUUID();
  const now = getCurrentTimestamp();

  // Filter receipts in range
  const rangeReceipts = input.receipts.filter(
    (r) =>
      r.chainLinkage.sequenceNumber >= input.startSequence &&
      r.chainLinkage.sequenceNumber <= input.endSequence
  );

  // Compute leaf hashes
  const leafHashes = rangeReceipts.map((r) => computeReceiptLeafHash(r));

  // Build Merkle tree
  const { root: merkleRoot } = buildMerkleTree(
    leafHashes.length > 0 ? leafHashes : ['0'.repeat(64)]
  );

  // Build unsigned checkpoint
  const unsignedCheckpoint: Omit<CheckpointRecord, 'checkpointSignature'> = {
    checkpointId,
    chainId: input.chainId,
    batchRange: {
      startSequence: input.startSequence,
      endSequence: input.endSequence,
      eventCount: rangeReceipts.length,
    },
    merkleRoot,
    anchorProof: {
      networkId: input.anchorNetworkId || 'none',
      transactionId: input.anchorTxId || '',
      blockNumber: input.anchorBlockNumber || null,
      blockHash: input.anchorBlockHash || null,
      timestamp: now,
      confirmations: 0,
    },
    timestamp: now,
  };

  // Sign checkpoint
  const canonical = canonicalStringify(unsignedCheckpoint);
  const bytes = new TextEncoder().encode(canonical);
  const hash = sha256(bytes);
  const signature = await ed25519.signAsync(hash, input.signingPrivateKey);
  const signatureB64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));

  return {
    ...unsignedCheckpoint,
    checkpointSignature: signatureB64,
  };
}

// ============================================================================
// INCLUSION PROOF GENERATION
// ============================================================================

/**
 * Generate inclusion proof for a receipt in a checkpoint
 */
export function generateReceiptInclusionProof(
  receipt: EnforcementReceipt,
  allReceipts: EnforcementReceipt[],
  checkpoint: CheckpointRecord
): InclusionProof | null {
  // Get receipts in checkpoint range
  const rangeReceipts = allReceipts.filter(
    (r) =>
      r.chainLinkage.sequenceNumber >= checkpoint.batchRange.startSequence &&
      r.chainLinkage.sequenceNumber <= checkpoint.batchRange.endSequence
  );

  // Find index of receipt
  const index = rangeReceipts.findIndex(
    (r) => r.receiptId === receipt.receiptId
  );

  if (index === -1) {
    return null;
  }

  // Compute leaf hashes
  const leafHashes = rangeReceipts.map((r) => computeReceiptLeafHash(r));

  // Build Merkle tree
  const { layers } = buildMerkleTree(leafHashes);

  // Generate proof path
  const proofPath = generateInclusionProof(index, layers);

  return {
    eventLeafHash: computeReceiptLeafHash(receipt),
    eventSequence: receipt.chainLinkage.sequenceNumber,
    merkleRoot: checkpoint.merkleRoot,
    proofPath,
    checkpointReference: {
      checkpointId: checkpoint.checkpointId,
      anchorProof: checkpoint.anchorProof,
    },
  };
}

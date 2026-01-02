/**
 * Continuity Chain Receipts
 *
 * Real cryptographic receipts with proper linking per patent claims.
 * Uses structural metadata leaf hashing for privacy preservation.
 *
 * Patent Claims: 1(e), 3, 17, 18, 19
 */

import type { SimulationEvent, EventType } from '@/lib/simulation/engine';

// ============================================================================
// TYPES
// ============================================================================

export interface SignedReceipt {
  schemaVersion: '1.0';
  protocolVersion: '1.0.0';
  receiptId: string;
  eventType: EventType;
  eventId: string;
  sequenceNumber: number;
  timestamp: string;
  runId: string;
  artifactId: string;
  previousLeafHash: string;
  payload: {
    state: string;
    description: string;
    measurementType?: string;
    currentHash?: string;
    expectedHash?: string;
    enforcementAction?: string;
    mismatchedPaths?: string[];
    reason?: string;
  };
  payloadHash: string;
  leafHash: string;
  signature: string;
  keyId: string;
}

export interface ChainHead {
  chainVersion: '1.0';
  runId: string;
  artifactId: string;
  receiptCount: number;
  headSequenceNumber: number;
  headLeafHash: string;
  headReceiptId: string;
  createdAt: string;
}

export interface ReceiptChain {
  head: ChainHead;
  receipts: SignedReceipt[];
  checkpoints: CheckpointRecord[];
}

export interface CheckpointRecord {
  checkpointId: string;
  runId: string;
  merkleRoot: string;
  batchStart: number;
  batchEnd: number;
  timestamp: string;
  anchorNetwork: 'SIMULATED' | 'ARWEAVE' | 'ETHEREUM';
  transactionId: string;
}

// ============================================================================
// GENESIS HASH
// ============================================================================

const GENESIS_HASH = '0'.repeat(64);

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
  // Simple canonical JSON (sorted keys, no whitespace)
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

// ============================================================================
// RECEIPT GENERATION
// ============================================================================

export async function createReceipt(
  event: SimulationEvent,
  runId: string,
  artifactId: string,
  previousLeafHash: string,
  keyId: string
): Promise<SignedReceipt> {
  const payload: SignedReceipt['payload'] = {
    state: event.state,
    description: event.description,
    measurementType: event.data.measurementType,
    currentHash: event.data.currentHash,
    expectedHash: event.data.expectedHash,
    enforcementAction: event.data.enforcementAction,
    mismatchedPaths: event.data.mismatchedPaths,
    reason: event.data.reason,
  };

  // Compute payload hash
  const payloadHash = await sha256(canonicalize(payload as unknown as Record<string, unknown>));

  // Compute leaf hash from structural metadata (privacy-preserving per patent)
  const structuralMetadata = {
    eventType: event.type,
    sequenceNumber: event.sequenceNumber,
    timestamp: event.timestamp,
    previousLeafHash,
    payloadHash,
  };
  const leafHash = await sha256(canonicalize(structuralMetadata));

  // Generate receipt ID
  const receiptId = await sha256(`${runId}:${event.sequenceNumber}:${event.timestamp}`);

  // Simulate signature (in production, this would be Ed25519)
  const signatureInput = `${leafHash}:${keyId}`;
  const signature = await sha256(signatureInput);

  return {
    schemaVersion: '1.0',
    protocolVersion: '1.0.0',
    receiptId: receiptId.substring(0, 32),
    eventType: event.type,
    eventId: event.id,
    sequenceNumber: event.sequenceNumber,
    timestamp: event.timestamp,
    runId,
    artifactId,
    previousLeafHash,
    payload,
    payloadHash,
    leafHash,
    signature,
    keyId,
  };
}

// ============================================================================
// CHAIN MANAGEMENT
// ============================================================================

export class ReceiptChainManager {
  private receipts: SignedReceipt[] = [];
  private checkpoints: CheckpointRecord[] = [];
  private runId: string;
  private artifactId: string;
  private keyId: string;
  private lastLeafHash: string = GENESIS_HASH;

  constructor(runId: string, artifactId: string, keyId: string) {
    this.runId = runId;
    this.artifactId = artifactId;
    this.keyId = keyId;
  }

  async appendEvent(event: SimulationEvent): Promise<SignedReceipt> {
    const receipt = await createReceipt(
      event,
      this.runId,
      this.artifactId,
      this.lastLeafHash,
      this.keyId
    );

    this.receipts.push(receipt);
    this.lastLeafHash = receipt.leafHash;

    return receipt;
  }

  async createCheckpoint(): Promise<CheckpointRecord> {
    const batchStart = this.checkpoints.length > 0
      ? this.checkpoints[this.checkpoints.length - 1].batchEnd + 1
      : 1;
    const batchEnd = this.receipts.length;

    // Compute Merkle root over batch leaf hashes
    const batchHashes = this.receipts
      .slice(batchStart - 1, batchEnd)
      .map(r => r.leafHash);

    const merkleRoot = await this.computeMerkleRoot(batchHashes);

    const checkpoint: CheckpointRecord = {
      checkpointId: `cp_${Date.now().toString(36)}`,
      runId: this.runId,
      merkleRoot,
      batchStart,
      batchEnd,
      timestamp: new Date().toISOString(),
      anchorNetwork: 'SIMULATED',
      transactionId: `sim_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`,
    };

    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  private async computeMerkleRoot(hashes: string[]): Promise<string> {
    if (hashes.length === 0) {
      return GENESIS_HASH;
    }
    if (hashes.length === 1) {
      return hashes[0];
    }

    // Simple Merkle tree construction
    let level = [...hashes];
    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left; // Duplicate last if odd
        const combined = await sha256(left + right);
        nextLevel.push(combined);
      }
      level = nextLevel;
    }
    return level[0];
  }

  getChain(): ReceiptChain {
    const lastReceipt = this.receipts[this.receipts.length - 1];

    return {
      head: {
        chainVersion: '1.0',
        runId: this.runId,
        artifactId: this.artifactId,
        receiptCount: this.receipts.length,
        headSequenceNumber: lastReceipt?.sequenceNumber || 0,
        headLeafHash: lastReceipt?.leafHash || GENESIS_HASH,
        headReceiptId: lastReceipt?.receiptId || '',
        createdAt: new Date().toISOString(),
      },
      receipts: this.receipts,
      checkpoints: this.checkpoints,
    };
  }

  getReceipts(): SignedReceipt[] {
    return this.receipts;
  }

  getCheckpoints(): CheckpointRecord[] {
    return this.checkpoints;
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

export async function verifyChainIntegrity(chain: ReceiptChain): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Verify chain linking
  let expectedPreviousHash = GENESIS_HASH;
  for (let i = 0; i < chain.receipts.length; i++) {
    const receipt = chain.receipts[i];

    // Check previous hash linking
    if (receipt.previousLeafHash !== expectedPreviousHash) {
      errors.push(`Receipt ${i + 1}: Previous hash mismatch`);
    }

    // Check sequence number
    if (receipt.sequenceNumber !== i + 1) {
      errors.push(`Receipt ${i + 1}: Sequence number gap`);
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
      errors.push(`Receipt ${i + 1}: Leaf hash mismatch`);
    }

    expectedPreviousHash = receipt.leafHash;
  }

  // Verify head matches
  const lastReceipt = chain.receipts[chain.receipts.length - 1];
  if (lastReceipt && chain.head.headLeafHash !== lastReceipt.leafHash) {
    errors.push('Chain head does not match last receipt');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checkpoint Anchoring Module
 * Per AGA Build Guide Phase 3.3
 *
 * Handles Merkle tree construction and Arweave checkpoint anchoring.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  leafIndex?: number;
}

export interface MerkleProof {
  leafHash: string;
  leafIndex: number;
  siblings: Array<{
    hash: string;
    position: 'left' | 'right';
  }>;
  root: string;
}

export interface MerkleTree {
  root: string;
  leaves: string[];
  nodeCount: number;
  height: number;
  proofs: Map<string, MerkleProof>;
}

export interface CheckpointData {
  id: string;
  merkleRoot: string;
  receiptHashes: string[];
  artifactIds: string[];
  createdAt: string;
  anchoredAt?: string;
  txId?: string;
}

export interface AnchorConfig {
  intervalMs: number;           // Default: 1 hour
  maxReceiptsPerCheckpoint: number;  // Default: 100
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_ANCHOR_CONFIG: AnchorConfig = {
  intervalMs: 60 * 60 * 1000, // 1 hour
  maxReceiptsPerCheckpoint: 100,
};

// ============================================================================
// HASH UTILITY (using Web Crypto API)
// ============================================================================

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPair(left: string, right: string): Promise<string> {
  // Ensure consistent ordering for deterministic hashing
  return sha256(left + right);
}

// ============================================================================
// MERKLE TREE BUILDER
// ============================================================================

export class MerkleTreeBuilder {
  /**
   * Build a Merkle tree from an array of leaf hashes
   */
  async build(leafHashes: string[]): Promise<MerkleTree> {
    if (leafHashes.length === 0) {
      throw new Error('Cannot build Merkle tree with no leaves');
    }

    const leaves = [...leafHashes];
    const proofs = new Map<string, MerkleProof>();

    // Pad to power of 2 if necessary (using empty hash for padding)
    const paddedLeaves = this.padToPowerOfTwo(leaves);

    // Build the tree bottom-up
    const root = await this.buildTree(paddedLeaves, leaves.length, proofs);

    // Calculate tree height
    const height = Math.ceil(Math.log2(paddedLeaves.length));

    return {
      root: root.hash,
      leaves,
      nodeCount: this.calculateNodeCount(paddedLeaves.length),
      height,
      proofs,
    };
  }

  /**
   * Pad leaves array to the nearest power of 2
   */
  private padToPowerOfTwo(leaves: string[]): string[] {
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(leaves.length)));
    const padding = new Array(nextPowerOfTwo - leaves.length).fill('');
    return [...leaves, ...padding];
  }

  /**
   * Calculate total node count in a complete binary tree
   */
  private calculateNodeCount(leafCount: number): number {
    // For a complete binary tree: 2n - 1 nodes
    return 2 * leafCount - 1;
  }

  /**
   * Recursively build the tree and collect proofs
   */
  private async buildTree(
    level: string[],
    originalLeafCount: number,
    proofs: Map<string, MerkleProof>,
    depth: number = 0,
    proofPaths: Map<number, Array<{ hash: string; position: 'left' | 'right' }>> = new Map()
  ): Promise<MerkleNode> {
    // Initialize proof paths for leaves
    if (depth === 0) {
      for (let i = 0; i < originalLeafCount; i++) {
        proofPaths.set(i, []);
      }
    }

    // Base case: single node is the root
    if (level.length === 1) {
      // Finalize proofs
      for (let i = 0; i < originalLeafCount; i++) {
        const leafHash = proofPaths.get(i);
        if (leafHash) {
          proofs.set(level[0], {
            leafHash: '', // Will be set properly
            leafIndex: i,
            siblings: [...proofPaths.get(i)!],
            root: level[0],
          });
        }
      }

      return {
        hash: level[0],
        isLeaf: false,
      };
    }

    // Build next level
    const nextLevel: string[] = [];

    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left; // Duplicate last if odd

      const parentHash = await hashPair(left, right);
      nextLevel.push(parentHash);

      // Update proof paths for leaves under this subtree
      const leftLeafStart = i * Math.pow(2, depth);
      const rightLeafStart = (i + 1) * Math.pow(2, depth);
      const subtreeSize = Math.pow(2, depth);

      // Add sibling to proof paths for left subtree leaves
      for (let j = leftLeafStart; j < leftLeafStart + subtreeSize && j < originalLeafCount; j++) {
        proofPaths.get(j)?.push({ hash: right, position: 'right' });
      }

      // Add sibling to proof paths for right subtree leaves
      for (let j = rightLeafStart; j < rightLeafStart + subtreeSize && j < originalLeafCount; j++) {
        proofPaths.get(j)?.push({ hash: left, position: 'left' });
      }
    }

    return this.buildTree(nextLevel, originalLeafCount, proofs, depth + 1, proofPaths);
  }

  /**
   * Generate a proof for a specific leaf
   */
  async generateProof(tree: MerkleTree, leafIndex: number): Promise<MerkleProof> {
    if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
      throw new Error(`Leaf index ${leafIndex} out of range`);
    }

    const leafHash = tree.leaves[leafIndex];

    // Find the proof in the map (keyed by root since we built it that way)
    // We need to rebuild for specific leaf
    const siblings: Array<{ hash: string; position: 'left' | 'right' }> = [];
    const paddedLeaves = this.padToPowerOfTwo([...tree.leaves]);

    let currentLevel = paddedLeaves;
    let currentIndex = leafIndex;

    while (currentLevel.length > 1) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      const sibling = currentLevel[siblingIndex] || currentLevel[currentIndex];
      const position = currentIndex % 2 === 0 ? 'right' : 'left';

      siblings.push({ hash: sibling, position });

      // Build next level
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        nextLevel.push(await hashPair(left, right));
      }

      currentLevel = nextLevel;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leafHash,
      leafIndex,
      siblings,
      root: tree.root,
    };
  }

  /**
   * Verify a Merkle proof
   */
  async verifyProof(proof: MerkleProof): Promise<boolean> {
    let currentHash = proof.leafHash;

    for (const sibling of proof.siblings) {
      if (sibling.position === 'right') {
        currentHash = await hashPair(currentHash, sibling.hash);
      } else {
        currentHash = await hashPair(sibling.hash, currentHash);
      }
    }

    return currentHash === proof.root;
  }
}

// ============================================================================
// CHECKPOINT SCHEDULER
// ============================================================================

export class CheckpointScheduler {
  private config: AnchorConfig;
  private pendingReceipts: Map<string, { hash: string; artifactId: string }> = new Map();
  private checkpoints: CheckpointData[] = [];
  private scheduledTimeout: ReturnType<typeof setTimeout> | null = null;
  private onCheckpointReady?: (checkpoint: CheckpointData) => Promise<void>;

  constructor(config: Partial<AnchorConfig> = {}) {
    this.config = { ...DEFAULT_ANCHOR_CONFIG, ...config };
  }

  /**
   * Set callback for when a checkpoint is ready for anchoring
   */
  setCheckpointCallback(callback: (checkpoint: CheckpointData) => Promise<void>): void {
    this.onCheckpointReady = callback;
  }

  /**
   * Add a receipt to be included in the next checkpoint
   */
  addReceipt(receiptId: string, receiptHash: string, artifactId: string): void {
    this.pendingReceipts.set(receiptId, { hash: receiptHash, artifactId });

    // Check if we've hit the max receipts threshold
    if (this.pendingReceipts.size >= this.config.maxReceiptsPerCheckpoint) {
      this.createCheckpoint();
    } else if (!this.scheduledTimeout) {
      // Schedule the next checkpoint
      this.scheduledTimeout = setTimeout(() => {
        this.createCheckpoint();
      }, this.config.intervalMs);
    }
  }

  /**
   * Create a checkpoint from pending receipts
   */
  async createCheckpoint(): Promise<CheckpointData | null> {
    // Clear the scheduled timeout
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = null;
    }

    // Check if we have receipts
    if (this.pendingReceipts.size === 0) {
      return null;
    }

    // Collect receipt data
    const receiptHashes: string[] = [];
    const artifactIds = new Set<string>();

    this.pendingReceipts.forEach(({ hash, artifactId }) => {
      receiptHashes.push(hash);
      artifactIds.add(artifactId);
    });

    // Build Merkle tree
    const treeBuilder = new MerkleTreeBuilder();
    const tree = await treeBuilder.build(receiptHashes);

    // Create checkpoint
    const checkpoint: CheckpointData = {
      id: `ckpt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      merkleRoot: tree.root,
      receiptHashes,
      artifactIds: Array.from(artifactIds),
      createdAt: new Date().toISOString(),
    };

    // Store checkpoint
    this.checkpoints.push(checkpoint);

    // Clear pending receipts
    this.pendingReceipts.clear();

    // Notify callback
    if (this.onCheckpointReady) {
      await this.onCheckpointReady(checkpoint);
    }

    return checkpoint;
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): CheckpointData[] {
    return [...this.checkpoints];
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(id: string): CheckpointData | undefined {
    return this.checkpoints.find((c) => c.id === id);
  }

  /**
   * Update checkpoint with anchor transaction
   */
  updateCheckpointAnchor(checkpointId: string, txId: string): void {
    const checkpoint = this.checkpoints.find((c) => c.id === checkpointId);
    if (checkpoint) {
      checkpoint.txId = txId;
      checkpoint.anchoredAt = new Date().toISOString();
    }
  }

  /**
   * Get pending receipt count
   */
  getPendingCount(): number {
    return this.pendingReceipts.size;
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = null;
    }
  }
}

// ============================================================================
// INCLUSION PROOF GENERATOR
// ============================================================================

export class InclusionProofGenerator {
  private treeBuilder: MerkleTreeBuilder;

  constructor() {
    this.treeBuilder = new MerkleTreeBuilder();
  }

  /**
   * Generate an inclusion proof for a receipt in a checkpoint
   */
  async generateProof(
    receiptHash: string,
    checkpoint: CheckpointData
  ): Promise<MerkleProof | null> {
    // Find the receipt index
    const leafIndex = checkpoint.receiptHashes.indexOf(receiptHash);
    if (leafIndex === -1) {
      return null;
    }

    // Rebuild the tree
    const tree = await this.treeBuilder.build(checkpoint.receiptHashes);

    // Generate proof
    return this.treeBuilder.generateProof(tree, leafIndex);
  }

  /**
   * Verify an inclusion proof against a checkpoint
   */
  async verifyProof(proof: MerkleProof, expectedRoot: string): Promise<boolean> {
    if (proof.root !== expectedRoot) {
      return false;
    }

    return this.treeBuilder.verifyProof(proof);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const merkleTreeBuilder = new MerkleTreeBuilder();
export const inclusionProofGenerator = new InclusionProofGenerator();

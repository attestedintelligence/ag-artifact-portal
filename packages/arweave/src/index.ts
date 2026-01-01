/**
 * Arweave Package Exports
 * Per AGA Build Guide Phase 3
 */

// Client
export {
  ArweaveClient,
  arweaveClient,
  type ArweaveConfig,
  type ArweaveWallet,
  type TransactionTags,
  type PreparedTransaction,
} from './client';

// Transaction Submission
export {
  TransactionManager,
  getTransactionManager,
  type TransactionType,
  type TransactionStatus,
  type TransactionRecord,
  type SubmitResult,
} from './submit';

// Anchoring
export {
  MerkleTreeBuilder,
  CheckpointScheduler,
  InclusionProofGenerator,
  merkleTreeBuilder,
  inclusionProofGenerator,
  type MerkleNode,
  type MerkleProof,
  type MerkleTree,
  type CheckpointData,
  type AnchorConfig,
} from './anchor';

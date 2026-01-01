/**
 * Attested Governance Artifacts - Main Library Export
 * Per Evolution Spec v1.0
 */

// Types
export * from './types';

// Crypto operations (Steps 1-13)
export {
  SCHEMA_VERSION,
  PROTOCOL_VERSION,
  HASH_LENGTH,
  SALT_LENGTH,
  normalizeSubject,
  computeBytesHash,
  validateHash,
  canonicalizeMetadata,
  canonicalStringify,
  computeMetadataHash,
  createSubjectIdentifier,
  generateSalt,
  validateSalt,
  computeEvidenceCommitment,
  computeSealedHash,
  assembleArtifact,
  signArtifact,
  verifyArtifactSignature,
  generateKeyPair,
  computeKeyId,
  exportPublicKey,
  importPublicKey,
  computeReceiptHash,
  signReceipt,
  computeLeafHash,
  signChainEvent,
  buildMerkleTree,
  generateInclusionProof,
  verifyInclusionProof,
  generateUUID,
  getCurrentTimestamp,
  constantTimeEqual,
} from './crypto';

// Artifact creation pipeline
export * from './pipeline';

// Receipt chain operations
export {
  createReceipt,
  computeReceiptLeafHash,
  createChainEvent,
  createGenesisEvent,
  verifyReceiptChain,
  createCheckpoint,
  generateReceiptInclusionProof,
} from './receipts';

// Evidence bundle operations
export * from './bundle';

// Verification operations
export {
  verifyArtifactStructure,
  verifyReceiptSignature,
  verifyAllReceipts,
  verifyChainIntegrity,
  verifyCheckpointSignature,
  verifyAllCheckpoints,
  verifyAllInclusionProofs,
  verifyBundle,
  generateVerificationReport,
} from './verify';

export type { VerificationVerdict, FullVerificationResult } from './verify';

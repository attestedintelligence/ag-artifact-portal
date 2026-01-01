/**
 * Bundle Module Exports
 * Per AGA Build Guide Phase 2
 */

export {
  // Creation
  createPolicyArtifact,
  type CreateArtifactOptions,
  type ArtifactInput,

  // Validation
  verifyPolicyArtifact,
  type ArtifactValidationResult,

  // Attestations
  addAttestation,

  // Hashing
  computeSealedHash,
  computePolicyHash,

  // Serialization
  serializeArtifact,
  parseArtifact,

  // Display helpers
  getArtifactDisplayInfo,
} from './policy-artifact';

export {
  // Genesis receipt creation
  createGenesisReceipt,
  type GenesisReceiptInput,

  // Subsequent receipts
  createReceipt,
  type CreateReceiptOptions,

  // Chain management
  generateRunId,
  updateChainHead,

  // Verification
  verifyReceipt,

  // Serialization
  serializeReceipt,
  parseReceipt,
} from './genesis-receipt';

export {
  // Bundle structure constants
  BUNDLE_FORMAT_VERSION,
  MIN_VERIFIER_VERSION,
  BUNDLE_PATHS,

  // Manifest generation
  generateManifest,

  // Ledger formatting
  formatLedger,
  parseLedger,

  // Keyring
  generateKeyring,
  type Keyring,
  type KeyringEntry,

  // Merkle proofs
  generateMerkleProofsFile,
  type MerkleProofEntry,
  type MerkleProofsFile,

  // Utilities
  calculateChecksums,
  stringToBytes,
  bytesToString,
  jsonToBytes,
  canonicalJsonToBytes,

  // Types
  type BundleOptions,
  type LedgerEntry,
} from './structure';

export {
  // Bundle generator
  BundleGenerator,
  bundleGenerator,
  type BundleGeneratorInput,
  type GeneratedBundle,

  // Download
  downloadBundle,

  // Reader
  readBundleManifest,
} from './generator';

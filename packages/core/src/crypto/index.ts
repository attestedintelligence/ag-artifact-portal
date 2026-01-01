/**
 * Crypto Module Exports
 * Per AGA Build Guide Phase 1
 */

// Hash functions
export {
  sha256,
  sha256String,
  bufferToHex,
  hexToBuffer,
  hashFile,
  extractFileMetadata,
  generateSubjectIdentifier,
  computeFileHashes,
  computeCompositeHash,
  generateKeyId,
  type HashProgress,
  type ProgressCallback
} from './hash';

// Canonicalization (JCS / RFC 8785)
export {
  canonicalize,
  canonicalHash,
  canonicalizeWithOmit,
  nowISO,
  isValidTimestamp,
  compareTimestamps,
  isValidSha256Hex,
  isValidKeyId,
  TEST_VECTOR_JCS_001,
  verifyCanonicalTestVector
} from './canonical';

// Ed25519 Signatures
export {
  // Base64 encoding
  bytesToBase64,
  base64ToBytes,
  bytesToBase64url,
  base64urlToBytes,

  // Key generation
  generateKeyPair,
  generateKeyPairWithId,
  derivePublicKey,
  deriveStreamKey,

  // Signing
  buildSignatureInput,
  sign,
  signObject,

  // Verification
  verify,
  verifyObject,

  // Helpers
  createSigner,
  createSigningKey,
  serializeKeyPair,
  deserializeKeyPair,
  getKeyFingerprint,

  // Test vectors
  TEST_VECTOR_SIG_001,
  verifySignatureTestVector
} from './signature';

// Key Management
export {
  // Key ID generation
  generateKeyIdString,
  generateKeyIdHash,

  // Key pair generation
  generateFullKeyPair,
  type GeneratedKeyPair,

  // Fingerprints
  getShortFingerprint,

  // Serialization
  publicKeyToBase64,
  privateKeyToBase64,
  base64ToPublicKey,
  base64ToPrivateKey,

  // Encryption for storage
  encryptPrivateKey,
  decryptPrivateKey,
  type EncryptedKey,

  // BYOK import
  importPrivateKey,
  type ImportedKeyPair,

  // Validation
  validateKeyPair,
  isValidPublicKey,
  isValidPrivateKey,
} from './keys';

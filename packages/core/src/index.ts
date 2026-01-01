/**
 * @attested/core
 * Shared core logic for Attested Governance Artifacts (AGA)
 *
 * This package contains:
 * - TypeScript types for all AGA data structures
 * - Cryptographic primitives (SHA-256, Ed25519, JCS)
 * - Bundle format utilities
 * - Receipt chain logic
 * - Policy artifact logic
 * - Offline verifier
 */

// Types
export * from './types';

// Crypto
export * from './crypto';

// Bundle
export * from './bundle';

// Verifier
export * from './verifier';

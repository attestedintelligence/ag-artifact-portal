/**
 * Genesis Receipt Builder
 * Per AGA Build Guide Phase 2.1 and Spec Section 12
 *
 * Creates the first receipt in the chain when an artifact is sealed.
 */

import { canonicalize, canonicalizeWithOmit, nowISO } from '../crypto/canonical';
import { signObject, bytesToBase64 } from '../crypto/signature';
import { sha256String } from '../crypto/hash';
import { generateKeyIdHash } from '../crypto/keys';
import { DOMAIN_SEPARATORS } from '../types';
import type {
  Receipt,
  ReceiptEventType,
  ReasonCode,
  EnforcementDecision,
  TimeSource,
  ChainHead,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const RECEIPT_VERSION = '1' as const;
const ZERO_HASH = '0'.repeat(64);

// ============================================================================
// TYPES
// ============================================================================

export interface GenesisReceiptInput {
  artifactId: string;
  policyHash: string;
  sealedHash: string;
  vaultId: string;
}

export interface CreateReceiptOptions {
  runId: string;
  sequenceNumber: number;
  eventType: ReceiptEventType;
  policyId: string;
  decision: {
    action: EnforcementDecision;
    reasonCode: ReasonCode;
    details?: string;
  };
  measurement?: {
    compositeHash: string;
    mismatchedPaths: string[];
  };
  prevReceiptHash: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  timeSource?: TimeSource;
  tsaToken?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique run ID
 */
export function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(16));
  const randomPart = Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `run_${timestamp}${randomPart}`.slice(0, 48);
}

/**
 * Compute receipt_id from receipt content
 * receipt_id = HEX(SHA-256(canonicalize(Receipt WITHOUT signer.signature AND WITHOUT receipt_id)))
 */
async function computeReceiptId(
  receipt: Omit<Receipt, 'receipt_id' | 'signer'> & { signer: Omit<Receipt['signer'], 'signature'> }
): Promise<string> {
  const canonical = canonicalize(receipt);
  return sha256String(canonical);
}

/**
 * Compute this_receipt_hash
 * this_receipt_hash = HEX(SHA-256(canonicalize(Receipt WITHOUT signer.signature AND WITHOUT chain.this_receipt_hash)))
 */
async function computeThisReceiptHash(
  receipt: Omit<Receipt, 'signer'> & { signer: Omit<Receipt['signer'], 'signature'>; chain: Omit<Receipt['chain'], 'this_receipt_hash'> }
): Promise<string> {
  const canonical = canonicalize(receipt);
  return sha256String(canonical);
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Create a genesis receipt for an artifact seal
 * This is the first receipt in the chain, emitted when POLICY_LOADED
 */
export async function createGenesisReceipt(
  input: GenesisReceiptInput,
  privateKey: Uint8Array,
  publicKey: Uint8Array
): Promise<{ receipt: Receipt; chainHead: ChainHead }> {
  const runId = generateRunId();
  const now = nowISO();
  const keyId = await generateKeyIdHash(publicKey);

  // Build the unsigned receipt (without computed fields)
  const baseReceipt = {
    receipt_v: RECEIPT_VERSION,
    run_id: runId,
    sequence_number: 1,
    timestamp: now,
    local_time: now,
    monotonic_counter: 1,
    time_source: 'DEGRADED_LOCAL' as TimeSource,
    event_type: 'POLICY_LOADED' as ReceiptEventType,
    decision: {
      action: 'NONE' as EnforcementDecision,
      reason_code: 'OK' as ReasonCode,
      details: 'Artifact sealed successfully',
    },
    policy: {
      policy_id: input.policyHash,
    },
    measurement: {
      composite_hash: input.sealedHash,
      mismatched_paths: [],
    },
    signer: {
      public_key: bytesToBase64(publicKey),
      key_id: keyId,
    },
  };

  // Compute receipt_id
  const receiptWithoutId = {
    ...baseReceipt,
    chain: {
      prev_receipt_hash: ZERO_HASH,
    },
  };
  const receiptId = await computeReceiptId(receiptWithoutId as unknown as Parameters<typeof computeReceiptId>[0]);

  // Compute this_receipt_hash
  const receiptForHash = {
    ...baseReceipt,
    receipt_id: receiptId,
    chain: {
      prev_receipt_hash: ZERO_HASH,
    },
  };
  const thisReceiptHash = await computeThisReceiptHash(receiptForHash as unknown as Parameters<typeof computeThisReceiptHash>[0]);

  // Build complete receipt for signing
  const unsignedReceipt = {
    ...baseReceipt,
    receipt_id: receiptId,
    chain: {
      prev_receipt_hash: ZERO_HASH,
      this_receipt_hash: thisReceiptHash,
    },
  };

  // Sign the receipt
  const signResult = await signObject(
    privateKey,
    DOMAIN_SEPARATORS.BUNDLE,
    unsignedReceipt as unknown as Record<string, unknown>,
    ['signer.signature']
  );

  // Create final signed receipt
  const receipt: Receipt = {
    ...unsignedReceipt,
    signer: {
      ...unsignedReceipt.signer,
      signature: signResult.signature,
    },
  };

  // Create chain head
  const chainHead: ChainHead = {
    chain_v: '1',
    run_id: runId,
    receipt_count: 1,
    head_counter: 1,
    head_receipt_hash: thisReceiptHash,
    head_receipt_path: 'receipts/0001.json',
  };

  return { receipt, chainHead };
}

/**
 * Create a subsequent receipt in the chain
 */
export async function createReceipt(
  options: CreateReceiptOptions
): Promise<Receipt> {
  const now = nowISO();
  const keyId = await generateKeyIdHash(options.publicKey);

  // Build the unsigned receipt
  const baseReceipt = {
    receipt_v: RECEIPT_VERSION,
    run_id: options.runId,
    sequence_number: options.sequenceNumber,
    timestamp: now,
    local_time: now,
    monotonic_counter: options.sequenceNumber,
    time_source: options.timeSource || ('DEGRADED_LOCAL' as TimeSource),
    tsa_token: options.tsaToken,
    event_type: options.eventType,
    decision: {
      action: options.decision.action,
      reason_code: options.decision.reasonCode,
      details: options.decision.details,
    },
    policy: {
      policy_id: options.policyId,
    },
    ...(options.measurement && {
      measurement: {
        composite_hash: options.measurement.compositeHash,
        mismatched_paths: options.measurement.mismatchedPaths,
      },
    }),
    signer: {
      public_key: bytesToBase64(options.publicKey),
      key_id: keyId,
    },
  };

  // Compute receipt_id
  const receiptWithoutId = {
    ...baseReceipt,
    chain: {
      prev_receipt_hash: options.prevReceiptHash,
    },
  };
  const receiptId = await computeReceiptId(receiptWithoutId as unknown as Parameters<typeof computeReceiptId>[0]);

  // Compute this_receipt_hash
  const receiptForHash = {
    ...baseReceipt,
    receipt_id: receiptId,
    chain: {
      prev_receipt_hash: options.prevReceiptHash,
    },
  };
  const thisReceiptHash = await computeThisReceiptHash(receiptForHash as unknown as Parameters<typeof computeThisReceiptHash>[0]);

  // Build complete receipt for signing
  const unsignedReceipt = {
    ...baseReceipt,
    receipt_id: receiptId,
    chain: {
      prev_receipt_hash: options.prevReceiptHash,
      this_receipt_hash: thisReceiptHash,
    },
  };

  // Sign the receipt
  const signResult = await signObject(
    options.privateKey,
    DOMAIN_SEPARATORS.BUNDLE,
    unsignedReceipt as unknown as Record<string, unknown>,
    ['signer.signature']
  );

  // Create final signed receipt
  const receipt: Receipt = {
    ...unsignedReceipt,
    signer: {
      ...unsignedReceipt.signer,
      signature: signResult.signature,
    },
  };

  return receipt;
}

/**
 * Update chain head after adding a receipt
 */
export function updateChainHead(
  currentHead: ChainHead,
  newReceipt: Receipt
): ChainHead {
  return {
    ...currentHead,
    receipt_count: currentHead.receipt_count + 1,
    head_counter: newReceipt.sequence_number,
    head_receipt_hash: newReceipt.chain.this_receipt_hash,
    head_receipt_path: `receipts/${String(newReceipt.sequence_number).padStart(4, '0')}.json`,
  };
}

/**
 * Verify a receipt's integrity
 */
export async function verifyReceipt(
  receipt: Receipt,
  expectedPrevHash: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check prev_hash linkage
  if (receipt.chain.prev_receipt_hash !== expectedPrevHash) {
    errors.push(`Chain break: expected prev_hash ${expectedPrevHash.slice(0, 16)}..., got ${receipt.chain.prev_receipt_hash.slice(0, 16)}...`);
  }

  // Recompute receipt_id
  const receiptWithoutId = {
    ...receipt,
    receipt_id: undefined,
    signer: {
      public_key: receipt.signer.public_key,
      key_id: receipt.signer.key_id,
    },
    chain: {
      prev_receipt_hash: receipt.chain.prev_receipt_hash,
    },
  };
  const computedId = await computeReceiptId(receiptWithoutId as unknown as Parameters<typeof computeReceiptId>[0]);
  if (computedId !== receipt.receipt_id) {
    errors.push('Receipt ID mismatch');
  }

  // Recompute this_receipt_hash
  const receiptForHash = {
    ...receipt,
    signer: {
      public_key: receipt.signer.public_key,
      key_id: receipt.signer.key_id,
    },
    chain: {
      prev_receipt_hash: receipt.chain.prev_receipt_hash,
    },
  };
  const computedHash = await computeThisReceiptHash(receiptForHash as unknown as Parameters<typeof computeThisReceiptHash>[0]);
  if (computedHash !== receipt.chain.this_receipt_hash) {
    errors.push('Receipt hash mismatch');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serialize a receipt to canonical JSON
 */
export function serializeReceipt(receipt: Receipt): string {
  return canonicalize(receipt);
}

/**
 * Parse a receipt from JSON
 */
export function parseReceipt(json: string): Receipt {
  return JSON.parse(json) as Receipt;
}

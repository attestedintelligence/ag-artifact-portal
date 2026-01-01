/**
 * Arweave Transaction Submission Module
 * Per AGA Build Guide Phase 3.2
 *
 * Handles transaction submission with retry logic and status tracking.
 */

import { ArweaveClient, PreparedTransaction } from './client';

// ============================================================================
// TYPES
// ============================================================================

export type TransactionType = 'artifact_seal' | 'checkpoint_anchor';

export type TransactionStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

export interface TransactionRecord {
  id: string;
  txId: string;
  type: TransactionType;
  artifactId?: string;
  checkpointId?: string;
  dataHash: string;
  dataSizeBytes: number;
  status: TransactionStatus;
  confirmations: number;
  submittedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  error?: string;
}

export interface SubmitResult {
  success: boolean;
  txId?: string;
  error?: string;
  record: TransactionRecord;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CONFIRMATION_THRESHOLD = 10;
const POLL_INTERVAL_MS = 30000; // 30 seconds

// ============================================================================
// TRANSACTION MANAGER CLASS
// ============================================================================

export class TransactionManager {
  private client: ArweaveClient;
  private pendingTransactions: Map<string, TransactionRecord> = new Map();
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private onStatusChange?: (record: TransactionRecord) => void;

  constructor(client: ArweaveClient) {
    this.client = client;
  }

  /**
   * Set callback for status changes
   */
  setStatusChangeCallback(callback: (record: TransactionRecord) => void): void {
    this.onStatusChange = callback;
  }

  /**
   * Submit artifact seal transaction
   */
  async submitArtifactSeal(
    artifactId: string,
    sealedHash: string,
    policyHash: string,
    metadata: {
      name: string;
      description?: string;
      vaultId: string;
    }
  ): Promise<SubmitResult> {
    // Create the transaction
    const tx = await this.client.createSealTransaction(
      artifactId,
      sealedHash,
      policyHash,
      metadata
    );

    // Create record
    const record: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      txId: '',
      type: 'artifact_seal',
      artifactId,
      dataHash: sealedHash,
      dataSizeBytes: tx.dataSize,
      status: 'pending',
      confirmations: 0,
      createdAt: new Date().toISOString(),
    };

    return this.submitWithRetry(tx, record);
  }

  /**
   * Submit checkpoint anchor transaction
   */
  async submitCheckpointAnchor(
    checkpointId: string,
    merkleRoot: string,
    receiptCount: number,
    artifactIds: string[]
  ): Promise<SubmitResult> {
    // Create the transaction
    const tx = await this.client.createAnchorTransaction(
      checkpointId,
      merkleRoot,
      receiptCount,
      artifactIds
    );

    // Create record
    const record: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      txId: '',
      type: 'checkpoint_anchor',
      checkpointId,
      dataHash: merkleRoot,
      dataSizeBytes: tx.dataSize,
      status: 'pending',
      confirmations: 0,
      createdAt: new Date().toISOString(),
    };

    return this.submitWithRetry(tx, record);
  }

  /**
   * Submit transaction with retry logic
   */
  private async submitWithRetry(
    tx: PreparedTransaction,
    record: TransactionRecord
  ): Promise<SubmitResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Submit transaction
        const txId = await this.client.submitTransaction(tx);

        // Update record
        record.txId = txId;
        record.status = 'submitted';
        record.submittedAt = new Date().toISOString();

        // Add to pending transactions
        this.pendingTransactions.set(record.id, record);

        // Start polling if not already running
        this.startPolling();

        // Notify status change
        this.onStatusChange?.(record);

        return {
          success: true,
          txId,
          record,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Transaction attempt ${attempt + 1} failed:`, lastError);

        // Wait before retrying
        if (attempt < MAX_RETRIES - 1) {
          await this.delay(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    // All retries failed
    record.status = 'failed';
    record.error = lastError?.message || 'Unknown error';

    return {
      success: false,
      error: record.error,
      record,
    };
  }

  /**
   * Start polling for transaction confirmations
   */
  private startPolling(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(async () => {
      await this.pollPendingTransactions();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll all pending transactions
   */
  private async pollPendingTransactions(): Promise<void> {
    const pending = Array.from(this.pendingTransactions.values()).filter(
      (r) => r.status === 'submitted'
    );

    for (const record of pending) {
      try {
        const status = await this.client.getTransactionStatus(record.txId);

        if (status.confirmations >= CONFIRMATION_THRESHOLD) {
          record.status = 'confirmed';
          record.confirmations = status.confirmations;
          record.confirmedAt = new Date().toISOString();
          this.onStatusChange?.(record);

          // Remove from pending
          this.pendingTransactions.delete(record.id);
        } else if (status.status === 'failed') {
          record.status = 'failed';
          record.error = 'Transaction failed on network';
          this.onStatusChange?.(record);

          // Remove from pending
          this.pendingTransactions.delete(record.id);
        } else {
          // Update confirmations
          record.confirmations = status.confirmations;
        }
      } catch (error) {
        console.error(`Error polling transaction ${record.id}:`, error);
      }
    }

    // Stop polling if no more pending
    if (this.pendingTransactions.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions(): TransactionRecord[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): TransactionRecord | undefined {
    return this.pendingTransactions.get(id);
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let transactionManager: TransactionManager | null = null;

export function getTransactionManager(client: ArweaveClient): TransactionManager {
  if (!transactionManager) {
    transactionManager = new TransactionManager(client);
  }
  return transactionManager;
}

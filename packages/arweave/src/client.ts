/**
 * Arweave Client Module
 * Per AGA Build Guide Phase 3.1
 *
 * Handles Arweave wallet connection and transaction preparation.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ArweaveConfig {
  host: string;
  port: number;
  protocol: 'http' | 'https';
}

export interface ArweaveWallet {
  address: string;
  balance: string;
  connected: boolean;
}

export interface TransactionTags {
  [key: string]: string;
}

export interface PreparedTransaction {
  id: string;
  owner: string;
  target: string;
  quantity: string;
  reward: string;
  data: string;
  dataSize: number;
  tags: Array<{ name: string; value: string }>;
  signature?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ArweaveConfig = {
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
};

// Standard AGA tags for all transactions
const AGA_BASE_TAGS = {
  'App-Name': 'AttestatedGovernance',
  'App-Version': '1.0.0',
  'Content-Type': 'application/json',
};

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class ArweaveClient {
  private config: ArweaveConfig;
  private wallet: ArweaveWallet | null = null;

  constructor(config: Partial<ArweaveConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the base URL for the Arweave gateway
   */
  get gatewayUrl(): string {
    return `${this.config.protocol}://${this.config.host}:${this.config.port}`;
  }

  /**
   * Connect to ArConnect browser extension
   */
  async connectWallet(): Promise<ArweaveWallet> {
    // Check if ArConnect is available
    if (typeof window === 'undefined' || !window.arweaveWallet) {
      throw new Error('ArConnect extension not found. Please install ArConnect.');
    }

    try {
      // Request permissions
      await window.arweaveWallet.connect([
        'ACCESS_ADDRESS',
        'ACCESS_PUBLIC_KEY',
        'SIGN_TRANSACTION',
        'DISPATCH',
      ]);

      // Get wallet address
      const address = await window.arweaveWallet.getActiveAddress();

      // Get balance
      const balance = await this.getBalance(address);

      this.wallet = {
        address,
        balance,
        connected: true,
      };

      return this.wallet;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`);
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    if (typeof window !== 'undefined' && window.arweaveWallet) {
      try {
        await window.arweaveWallet.disconnect();
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }
    this.wallet = null;
  }

  /**
   * Get current wallet
   */
  getWallet(): ArweaveWallet | null {
    return this.wallet;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.wallet?.connected ?? false;
  }

  /**
   * Get wallet balance in AR
   */
  async getBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`${this.gatewayUrl}/wallet/${address}/balance`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const winston = await response.text();
      // Convert winston to AR (1 AR = 10^12 winston)
      const ar = (BigInt(winston) / BigInt(10 ** 12)).toString();
      return ar;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  /**
   * Estimate transaction cost
   */
  async estimateCost(dataSize: number): Promise<string> {
    try {
      const response = await fetch(`${this.gatewayUrl}/price/${dataSize}`);
      if (!response.ok) {
        throw new Error('Failed to estimate cost');
      }
      const winston = await response.text();
      // Convert to AR for display
      const arValue = Number(winston) / 10 ** 12;
      return arValue.toFixed(6);
    } catch (error) {
      console.error('Error estimating cost:', error);
      return '0';
    }
  }

  /**
   * Create artifact seal transaction
   */
  async createSealTransaction(
    artifactId: string,
    sealedHash: string,
    policyHash: string,
    metadata: {
      name: string;
      description?: string;
      vaultId: string;
    }
  ): Promise<PreparedTransaction> {
    const data = JSON.stringify({
      type: 'artifact_seal',
      artifact_id: artifactId,
      sealed_hash: sealedHash,
      policy_hash: policyHash,
      vault_id: metadata.vaultId,
      name: metadata.name,
      description: metadata.description,
      timestamp: new Date().toISOString(),
    });

    const tags = {
      ...AGA_BASE_TAGS,
      'AGA-Type': 'artifact-seal',
      'AGA-Artifact-Id': artifactId,
      'AGA-Sealed-Hash': sealedHash,
      'AGA-Policy-Hash': policyHash,
      'AGA-Vault-Id': metadata.vaultId,
    };

    return this.prepareTransaction(data, tags);
  }

  /**
   * Create checkpoint anchor transaction
   */
  async createAnchorTransaction(
    checkpointId: string,
    merkleRoot: string,
    receiptCount: number,
    artifactIds: string[]
  ): Promise<PreparedTransaction> {
    const data = JSON.stringify({
      type: 'checkpoint_anchor',
      checkpoint_id: checkpointId,
      merkle_root: merkleRoot,
      receipt_count: receiptCount,
      artifact_ids: artifactIds,
      timestamp: new Date().toISOString(),
    });

    const tags = {
      ...AGA_BASE_TAGS,
      'AGA-Type': 'checkpoint-anchor',
      'AGA-Checkpoint-Id': checkpointId,
      'AGA-Merkle-Root': merkleRoot,
      'AGA-Receipt-Count': receiptCount.toString(),
    };

    return this.prepareTransaction(data, tags);
  }

  /**
   * Prepare a transaction (common logic)
   */
  private async prepareTransaction(
    data: string,
    customTags: TransactionTags
  ): Promise<PreparedTransaction> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    const dataBytes = new TextEncoder().encode(data);
    const dataSize = dataBytes.length;

    // Estimate reward
    const reward = await this.estimateCost(dataSize);

    // Convert tags to array format
    const tags = Object.entries(customTags).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      id: '', // Will be set after signing
      owner: this.wallet.address,
      target: '',
      quantity: '0',
      reward,
      data: btoa(String.fromCharCode.apply(null, Array.from(dataBytes))),
      dataSize,
      tags,
    };
  }

  /**
   * Sign and submit transaction via ArConnect
   */
  async submitTransaction(tx: PreparedTransaction): Promise<string> {
    if (typeof window === 'undefined' || !window.arweaveWallet) {
      throw new Error('ArConnect not available');
    }

    // Use ArConnect's dispatch method for easy submission
    const result = await window.arweaveWallet.dispatch({
      target: tx.target || '',
      quantity: tx.quantity || '0',
      data: Uint8Array.from(atob(tx.data), (c) => c.charCodeAt(0)),
      tags: tx.tags,
    });

    return result.id;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txId: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/tx/${txId}/status`);

      if (response.status === 404) {
        return { status: 'pending', confirmations: 0 };
      }

      if (!response.ok) {
        throw new Error('Failed to get transaction status');
      }

      const data = await response.json();

      return {
        status: data.number_of_confirmations >= 10 ? 'confirmed' : 'pending',
        confirmations: data.number_of_confirmations || 0,
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return { status: 'pending', confirmations: 0 };
    }
  }

  /**
   * Fetch transaction data
   */
  async getTransactionData(txId: string): Promise<unknown> {
    try {
      const response = await fetch(`${this.gatewayUrl}/${txId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction data');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      return null;
    }
  }
}

// ============================================================================
// GLOBAL TYPE AUGMENTATION
// ============================================================================

declare global {
  interface Window {
    arweaveWallet?: {
      connect: (permissions: string[]) => Promise<void>;
      disconnect: () => Promise<void>;
      getActiveAddress: () => Promise<string>;
      getActivePublicKey: () => Promise<string>;
      sign: (transaction: unknown) => Promise<unknown>;
      dispatch: (tx: {
        target?: string;
        quantity?: string;
        data?: Uint8Array;
        tags?: Array<{ name: string; value: string }>;
      }) => Promise<{ id: string }>;
    };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export const arweaveClient = new ArweaveClient();

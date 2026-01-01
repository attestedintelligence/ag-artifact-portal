/**
 * Runtime Engine Core
 * Per AGA Build Guide Phase 5.1
 *
 * Executes runtime enforcement for deployed artifacts.
 */

import type {
  PolicyArtifact,
  Receipt,
  ChainHead,
  EnforcementAction,
  EnforcementDecision,
} from '../../core/src/types';

// ============================================================================
// TYPES
// ============================================================================

export type EngineState =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

export interface RuntimeConfig {
  artifactId: string;
  vaultId: string;
  measurementCadenceMs: number;
  enforcementAction: EnforcementAction;
  ttlSeconds: number | null;
}

export interface EngineEvents {
  onStateChange?: (state: EngineState, previousState: EngineState) => void;
  onMeasurement?: (result: MeasurementResult) => void;
  onDriftDetected?: (details: DriftDetails) => void;
  onEnforcementAction?: (action: EnforcementRecord) => void;
  onReceipt?: (receipt: Receipt) => void;
  onError?: (error: Error) => void;
}

export interface MeasurementResult {
  timestamp: string;
  currentHash: string;
  expectedHash: string;
  match: boolean;
  source: 'file' | 'api' | 'database';
  metadata?: Record<string, unknown>;
}

export interface DriftDetails {
  type: 'integrity' | 'telemetry' | 'ttl';
  currentValue: string;
  expectedValue: string;
  detectedAt: string;
  source?: string;
}

export interface EnforcementRecord {
  action: EnforcementAction;
  decision: EnforcementDecision;
  reason: string;
  timestamp: string;
  receiptId?: string;
}

// ============================================================================
// RUNTIME ENGINE CLASS
// ============================================================================

export class RuntimeEngine {
  private state: EngineState = 'idle';
  private config: RuntimeConfig | null = null;
  private artifact: PolicyArtifact | null = null;
  private chainHead: ChainHead | null = null;
  private receipts: Receipt[] = [];
  private measurementInterval: ReturnType<typeof setInterval> | null = null;
  private ttlTimeout: ReturnType<typeof setTimeout> | null = null;
  private events: EngineEvents = {};
  private startTime: number | null = null;

  constructor(events?: EngineEvents) {
    this.events = events || {};
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * Get current configuration
   */
  getConfig(): RuntimeConfig | null {
    return this.config;
  }

  /**
   * Get current artifact
   */
  getArtifact(): PolicyArtifact | null {
    return this.artifact;
  }

  /**
   * Get all receipts
   */
  getReceipts(): Receipt[] {
    return [...this.receipts];
  }

  /**
   * Get chain head
   */
  getChainHead(): ChainHead | null {
    return this.chainHead;
  }

  /**
   * Initialize the engine with an artifact
   */
  async initialize(
    artifact: PolicyArtifact,
    config: RuntimeConfig
  ): Promise<void> {
    if (this.state !== 'idle' && this.state !== 'stopped') {
      throw new Error(`Cannot initialize engine in state: ${this.state}`);
    }

    this.setState('initializing');

    try {
      // Validate artifact
      await this.validateArtifact(artifact);

      // Store configuration
      this.config = config;
      this.artifact = artifact;
      this.receipts = [];

      // Initialize chain head (would be loaded from storage in production)
      this.chainHead = {
        chain_v: '1',
        run_id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        receipt_count: 0,
        head_counter: 0,
        head_receipt_hash: '0'.repeat(64),
        head_receipt_path: '',
      };

      this.setState('running');
      this.startTime = Date.now();

      // Start measurement scheduler
      this.startMeasurementScheduler();

      // Start TTL monitor if applicable
      if (config.ttlSeconds) {
        this.startTtlMonitor(config.ttlSeconds);
      }
    } catch (error) {
      this.setState('error');
      this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Pause the engine
   */
  pause(): void {
    if (this.state !== 'running') {
      throw new Error(`Cannot pause engine in state: ${this.state}`);
    }

    this.stopSchedulers();
    this.setState('paused');
  }

  /**
   * Resume the engine
   */
  resume(): void {
    if (this.state !== 'paused') {
      throw new Error(`Cannot resume engine in state: ${this.state}`);
    }

    this.setState('running');
    this.startMeasurementScheduler();

    if (this.config?.ttlSeconds) {
      // Calculate remaining TTL
      const elapsed = Date.now() - (this.startTime || 0);
      const remaining = (this.config.ttlSeconds * 1000) - elapsed;
      if (remaining > 0) {
        this.startTtlMonitor(remaining / 1000);
      } else {
        this.handleTtlExpired();
      }
    }
  }

  /**
   * Stop the engine
   */
  async stop(): Promise<void> {
    if (this.state === 'idle' || this.state === 'stopped') {
      return;
    }

    this.stopSchedulers();
    this.setState('stopped');
  }

  /**
   * Perform a manual measurement
   */
  async measure(): Promise<MeasurementResult> {
    if (this.state !== 'running') {
      throw new Error(`Cannot measure in state: ${this.state}`);
    }

    return this.performMeasurement();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setState(newState: EngineState): void {
    const previousState = this.state;
    this.state = newState;
    this.events.onStateChange?.(newState, previousState);
  }

  private async validateArtifact(artifact: PolicyArtifact): Promise<void> {
    // Check validity window
    const now = new Date();
    const notBefore = new Date(artifact.not_before);

    if (now < notBefore) {
      throw new Error('Artifact not yet valid');
    }

    if (artifact.not_after) {
      const notAfter = new Date(artifact.not_after);
      if (now > notAfter) {
        throw new Error('Artifact has expired');
      }
    }

    // Additional validation would go here
    // - Signature verification
    // - Policy hash verification
    // - Key schedule validation
  }

  private startMeasurementScheduler(): void {
    if (!this.config) return;

    this.measurementInterval = setInterval(async () => {
      try {
        await this.performMeasurement();
      } catch (error) {
        console.error('Measurement error:', error);
        this.events.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }, this.config.measurementCadenceMs);
  }

  private startTtlMonitor(ttlSeconds: number): void {
    this.ttlTimeout = setTimeout(() => {
      this.handleTtlExpired();
    }, ttlSeconds * 1000);
  }

  private stopSchedulers(): void {
    if (this.measurementInterval) {
      clearInterval(this.measurementInterval);
      this.measurementInterval = null;
    }

    if (this.ttlTimeout) {
      clearTimeout(this.ttlTimeout);
      this.ttlTimeout = null;
    }
  }

  private async performMeasurement(): Promise<MeasurementResult> {
    if (!this.artifact) {
      throw new Error('No artifact loaded');
    }

    // In production, this would:
    // 1. Fetch current state from the source
    // 2. Compute hash using same algorithm as sealing
    // 3. Compare to sealed hash
    const result: MeasurementResult = {
      timestamp: new Date().toISOString(),
      currentHash: this.artifact.sealed_hash, // Placeholder
      expectedHash: this.artifact.sealed_hash,
      match: true, // Placeholder
      source: 'file',
    };

    this.events.onMeasurement?.(result);

    if (!result.match) {
      this.handleDriftDetected({
        type: 'integrity',
        currentValue: result.currentHash,
        expectedValue: result.expectedHash,
        detectedAt: result.timestamp,
        source: result.source,
      });
    }

    return result;
  }

  private handleDriftDetected(details: DriftDetails): void {
    this.events.onDriftDetected?.(details);

    // Execute enforcement action
    if (this.config) {
      this.executeEnforcement(this.config.enforcementAction, details);
    }
  }

  private handleTtlExpired(): void {
    this.events.onDriftDetected?.({
      type: 'ttl',
      currentValue: 'expired',
      expectedValue: 'valid',
      detectedAt: new Date().toISOString(),
    });

    // Execute enforcement action
    if (this.config) {
      this.executeEnforcement(this.config.enforcementAction, {
        type: 'ttl',
        currentValue: 'expired',
        expectedValue: 'valid',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  private executeEnforcement(
    action: EnforcementAction,
    details: DriftDetails
  ): void {
    let decision: EnforcementDecision;

    switch (action) {
      case 'KILL':
        decision = 'KILL';
        this.stop();
        break;
      case 'BLOCK_START':
        decision = 'QUARANTINE';
        this.pause();
        break;
      case 'ALERT':
      default:
        decision = 'CONTINUE';
        break;
    }

    const record: EnforcementRecord = {
      action,
      decision,
      reason: `${details.type} detected: ${details.currentValue} != ${details.expectedValue}`,
      timestamp: new Date().toISOString(),
    };

    this.events.onEnforcementAction?.(record);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createRuntimeEngine(events?: EngineEvents): RuntimeEngine {
  return new RuntimeEngine(events);
}

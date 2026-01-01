/**
 * Artifact Lifecycle Manager
 * Per AGA Build Guide Phase 5.5
 *
 * Handles TTL monitoring and auto-bundling at expiration.
 */

import type { PolicyArtifact, ArtifactStatus } from '../../core/src/types';

// ============================================================================
// TYPES
// ============================================================================

export interface LifecycleConfig {
  bundleBeforeExpirationMs: number;  // Default: 1 hour
  notifyBeforeExpirationMs: number;  // Default: 24 hours
  cleanupAfterExpirationMs: number;  // Default: 7 days
}

export interface ArtifactLifecycle {
  artifactId: string;
  vaultId: string;
  status: ArtifactStatus;
  createdAt: string;
  expiresAt: string | null;
  bundledAt?: string;
  bundleId?: string;
}

export interface LifecycleEvent {
  type: 'expiring_soon' | 'expired' | 'bundled' | 'cleaned_up';
  artifactId: string;
  vaultId: string;
  timestamp: string;
  details?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: LifecycleConfig = {
  bundleBeforeExpirationMs: 60 * 60 * 1000,      // 1 hour
  notifyBeforeExpirationMs: 24 * 60 * 60 * 1000, // 24 hours
  cleanupAfterExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ============================================================================
// TTL MONITOR
// ============================================================================

export class TtlMonitor {
  private config: LifecycleConfig;
  private artifacts: Map<string, ArtifactLifecycle> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>[]> = new Map();
  private eventHandlers: Array<(event: LifecycleEvent) => Promise<void>> = [];

  constructor(config: Partial<LifecycleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register an event handler
   */
  onEvent(handler: (event: LifecycleEvent) => Promise<void>): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Register an artifact for monitoring
   */
  register(artifact: PolicyArtifact): void {
    const lifecycle: ArtifactLifecycle = {
      artifactId: artifact.artifact_id,
      vaultId: artifact.vault_id,
      status: 'ACTIVE',
      createdAt: artifact.issued_at,
      expiresAt: artifact.not_after,
    };

    this.artifacts.set(artifact.artifact_id, lifecycle);

    if (artifact.not_after) {
      this.scheduleExpirationHandlers(lifecycle);
    }
  }

  /**
   * Unregister an artifact
   */
  unregister(artifactId: string): void {
    this.clearTimers(artifactId);
    this.artifacts.delete(artifactId);
  }

  /**
   * Get artifact lifecycle status
   */
  getStatus(artifactId: string): ArtifactLifecycle | undefined {
    return this.artifacts.get(artifactId);
  }

  /**
   * Get all artifacts approaching expiration
   */
  getExpiringArtifacts(withinMs: number = this.config.notifyBeforeExpirationMs): ArtifactLifecycle[] {
    const now = Date.now();
    const cutoff = now + withinMs;

    return Array.from(this.artifacts.values()).filter((lifecycle) => {
      if (!lifecycle.expiresAt) return false;
      const expiresAt = new Date(lifecycle.expiresAt).getTime();
      return expiresAt > now && expiresAt <= cutoff;
    });
  }

  /**
   * Get all expired artifacts
   */
  getExpiredArtifacts(): ArtifactLifecycle[] {
    const now = Date.now();

    return Array.from(this.artifacts.values()).filter((lifecycle) => {
      if (!lifecycle.expiresAt) return false;
      const expiresAt = new Date(lifecycle.expiresAt).getTime();
      return expiresAt <= now;
    });
  }

  /**
   * Check if artifact is expired
   */
  isExpired(artifactId: string): boolean {
    const lifecycle = this.artifacts.get(artifactId);
    if (!lifecycle || !lifecycle.expiresAt) return false;
    return new Date(lifecycle.expiresAt).getTime() <= Date.now();
  }

  /**
   * Stop all monitoring
   */
  stop(): void {
    const artifactIds = Array.from(this.artifacts.keys());
    for (const artifactId of artifactIds) {
      this.clearTimers(artifactId);
    }
    this.artifacts.clear();
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private scheduleExpirationHandlers(lifecycle: ArtifactLifecycle): void {
    if (!lifecycle.expiresAt) return;

    const expiresAt = new Date(lifecycle.expiresAt).getTime();
    const now = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Schedule notification before expiration
    const notifyTime = expiresAt - this.config.notifyBeforeExpirationMs;
    if (notifyTime > now) {
      const timer = setTimeout(() => {
        this.emitEvent({
          type: 'expiring_soon',
          artifactId: lifecycle.artifactId,
          vaultId: lifecycle.vaultId,
          timestamp: new Date().toISOString(),
          details: `Artifact expires in ${Math.round(this.config.notifyBeforeExpirationMs / 3600000)} hours`,
        });
      }, notifyTime - now);
      timers.push(timer);
    }

    // Schedule auto-bundle before expiration
    const bundleTime = expiresAt - this.config.bundleBeforeExpirationMs;
    if (bundleTime > now) {
      const timer = setTimeout(() => {
        this.handleAutoBundling(lifecycle);
      }, bundleTime - now);
      timers.push(timer);
    }

    // Schedule expiration event
    if (expiresAt > now) {
      const timer = setTimeout(() => {
        this.handleExpiration(lifecycle);
      }, expiresAt - now);
      timers.push(timer);
    }

    // Schedule cleanup after expiration
    const cleanupTime = expiresAt + this.config.cleanupAfterExpirationMs;
    if (cleanupTime > now) {
      const timer = setTimeout(() => {
        this.handleCleanup(lifecycle);
      }, cleanupTime - now);
      timers.push(timer);
    }

    this.timers.set(lifecycle.artifactId, timers);
  }

  private clearTimers(artifactId: string): void {
    const timers = this.timers.get(artifactId);
    if (timers) {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      this.timers.delete(artifactId);
    }
  }

  private async handleAutoBundling(lifecycle: ArtifactLifecycle): Promise<void> {
    // In production, this would:
    // 1. Generate complete evidence bundle
    // 2. Include all receipts up to this point
    // 3. Store bundle (Arweave or temporary storage)

    const bundleId = `bnd_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    lifecycle.bundledAt = new Date().toISOString();
    lifecycle.bundleId = bundleId;

    await this.emitEvent({
      type: 'bundled',
      artifactId: lifecycle.artifactId,
      vaultId: lifecycle.vaultId,
      timestamp: lifecycle.bundledAt,
      details: `Auto-bundle created: ${bundleId}`,
    });
  }

  private async handleExpiration(lifecycle: ArtifactLifecycle): Promise<void> {
    lifecycle.status = 'EXPIRED';

    await this.emitEvent({
      type: 'expired',
      artifactId: lifecycle.artifactId,
      vaultId: lifecycle.vaultId,
      timestamp: new Date().toISOString(),
      details: 'Artifact TTL expired',
    });
  }

  private async handleCleanup(lifecycle: ArtifactLifecycle): Promise<void> {
    // In production, this would:
    // 1. Archive artifact data
    // 2. Remove from active monitoring
    // 3. Update database status

    await this.emitEvent({
      type: 'cleaned_up',
      artifactId: lifecycle.artifactId,
      vaultId: lifecycle.vaultId,
      timestamp: new Date().toISOString(),
      details: 'Artifact data archived',
    });

    this.unregister(lifecycle.artifactId);
  }

  private async emitEvent(event: LifecycleEvent): Promise<void> {
    await Promise.all(
      this.eventHandlers.map((handler) =>
        handler(event).catch((error) => {
          console.error('Lifecycle event handler error:', error);
        })
      )
    );
  }
}

// ============================================================================
// AUTO-BUNDLE GENERATOR
// ============================================================================

export async function generateAutoBundleAtExpiration(
  artifactId: string,
  vaultId: string
): Promise<string> {
  // In production, this would:
  // 1. Fetch all receipts for the artifact
  // 2. Add final EXPIRATION receipt
  // 3. Generate complete evidence bundle
  // 4. Store and return bundle ID

  const bundleId = `bnd_exp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  console.log(`Auto-bundle generated for artifact ${artifactId}: ${bundleId}`);
  return bundleId;
}

// ============================================================================
// NOTIFICATION SENDER
// ============================================================================

export interface ExpirationNotification {
  artifactId: string;
  vaultId: string;
  expiresAt: string;
  bundleId?: string;
  downloadUrl?: string;
}

export async function sendExpirationNotification(
  notification: ExpirationNotification
): Promise<void> {
  // In production, this would:
  // 1. Email user about expiration
  // 2. Include download link for bundle
  // 3. Set download link expiration

  console.log('Expiration notification:', notification);
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const ttlMonitor = new TtlMonitor();

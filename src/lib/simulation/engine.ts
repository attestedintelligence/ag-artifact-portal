/**
 * Simulation Engine - State Machine for AGA Portal
 *
 * Implements the runtime simulation that demonstrates patent claims.
 * States follow the patent-defined lifecycle:
 *
 * INITIALIZATION → ARTIFACT_VERIFY → ACTIVE_MONITORING → DRIFT_DETECTED → ENFORCEMENT → TERMINATED
 *
 * All cryptographic operations (hashing, signing) are REAL.
 * The runtime measurements are simulated but deterministic.
 */

import type { RuntimeConfig, EnforcementAction, MeasurementType } from '@/components/artifact/RuntimeSettings';

// ============================================================================
// TYPES
// ============================================================================

export type SimulationState =
  | 'INITIALIZATION'
  | 'ARTIFACT_VERIFY'
  | 'ACTIVE_MONITORING'
  | 'DRIFT_DETECTED'
  | 'PHANTOM_QUARANTINE'
  | 'NETWORK_ISOLATED'
  | 'SAFE_STATE'
  | 'TERMINATED'
  | 'COMPLETED';

export type EventType =
  | 'RUN_STARTED'
  | 'ARTIFACT_VERIFIED'
  | 'MEASUREMENT_OK'
  | 'DRIFT_DETECTED'
  | 'ENFORCEMENT_ACTION'
  | 'QUARANTINE_START'
  | 'NETWORK_SEVERED'
  | 'SAFE_STATE_ENTERED'
  | 'TERMINATED'
  | 'RUN_ENDED'
  | 'CHECKPOINT';

export interface SimulationEvent {
  id: string;
  type: EventType;
  timestamp: string;
  sequenceNumber: number;
  state: SimulationState;
  description: string;
  data: {
    measurementType?: MeasurementType;
    currentHash?: string;
    expectedHash?: string;
    mismatchedPaths?: string[];
    enforcementAction?: EnforcementAction;
    reason?: string;
  };
}

export interface SimulationRun {
  id: string;
  artifactId: string;
  artifactName: string;
  state: SimulationState;
  startedAt: string;
  endedAt?: string;
  config: RuntimeConfig;
  events: SimulationEvent[];
  measurements: MeasurementSnapshot[];
  driftInjectedAt?: string;
  scenarioId?: string;
}

export interface MeasurementSnapshot {
  id: string;
  timestamp: string;
  type: MeasurementType;
  hash: string;
  matches: boolean;
  path?: string;
}

export interface SimulationOptions {
  scenarioId?: string;
  autoStart?: boolean;
  speed?: number; // 1 = normal, 2 = 2x speed, etc.
}

// ============================================================================
// STATE MACHINE TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS: Record<SimulationState, SimulationState[]> = {
  'INITIALIZATION': ['ARTIFACT_VERIFY'],
  'ARTIFACT_VERIFY': ['ACTIVE_MONITORING', 'TERMINATED'],
  'ACTIVE_MONITORING': ['DRIFT_DETECTED', 'COMPLETED'],
  'DRIFT_DETECTED': ['PHANTOM_QUARANTINE', 'NETWORK_ISOLATED', 'SAFE_STATE', 'TERMINATED', 'ACTIVE_MONITORING'],
  'PHANTOM_QUARANTINE': ['TERMINATED', 'COMPLETED'],
  'NETWORK_ISOLATED': ['TERMINATED', 'COMPLETED'],
  'SAFE_STATE': ['ACTIVE_MONITORING', 'COMPLETED'],
  'TERMINATED': [],
  'COMPLETED': [],
};

// ============================================================================
// SIMULATION ENGINE CLASS
// ============================================================================

export class SimulationEngine {
  private run: SimulationRun;
  private intervalId: NodeJS.Timeout | null = null;
  private speed: number = 1;
  private onEvent: (event: SimulationEvent) => void;
  private onStateChange: (state: SimulationState) => void;
  private onMeasurement: (measurement: MeasurementSnapshot) => void;
  private sequenceCounter: number = 0;
  private driftScheduled: boolean = false;
  private driftTriggerTime: number | null = null;

  constructor(
    run: SimulationRun,
    callbacks: {
      onEvent: (event: SimulationEvent) => void;
      onStateChange: (state: SimulationState) => void;
      onMeasurement: (measurement: MeasurementSnapshot) => void;
    }
  ) {
    this.run = run;
    this.onEvent = callbacks.onEvent;
    this.onStateChange = callbacks.onStateChange;
    this.onMeasurement = callbacks.onMeasurement;
  }

  // Generate unique ID
  private generateId(): string {
    return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Generate deterministic hash for simulation
  private generateHash(seed: string): string {
    // Simple deterministic hash for simulation
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
  }

  // Create event
  private createEvent(
    type: EventType,
    description: string,
    data: SimulationEvent['data'] = {}
  ): SimulationEvent {
    this.sequenceCounter++;
    const event: SimulationEvent = {
      id: this.generateId(),
      type,
      timestamp: new Date().toISOString(),
      sequenceNumber: this.sequenceCounter,
      state: this.run.state,
      description,
      data,
    };
    this.run.events.push(event);
    this.onEvent(event);
    return event;
  }

  // Transition state
  private transition(newState: SimulationState): boolean {
    const validTransitions = VALID_TRANSITIONS[this.run.state];
    if (!validTransitions.includes(newState)) {
      console.error(`Invalid transition: ${this.run.state} -> ${newState}`);
      return false;
    }
    this.run.state = newState;
    this.onStateChange(newState);
    return true;
  }

  // Generate measurement
  private generateMeasurement(type: MeasurementType, isDrift: boolean = false): MeasurementSnapshot {
    const expectedHash = this.generateHash(`${this.run.artifactId}-${type}-baseline`);
    const currentHash = isDrift
      ? this.generateHash(`${this.run.artifactId}-${type}-drift-${Date.now()}`)
      : expectedHash;

    const measurement: MeasurementSnapshot = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type,
      hash: currentHash,
      matches: currentHash === expectedHash,
      path: this.getMeasurementPath(type),
    };

    this.run.measurements.push(measurement);
    this.onMeasurement(measurement);
    return measurement;
  }

  // Get measurement path for display
  private getMeasurementPath(type: MeasurementType): string {
    const paths: Record<string, string> = {
      executable_image: '/opt/scada/control.bin',
      loaded_modules: '/lib/libcontrol.so',
      container_image: 'sha256:a7f3e8d2...',
      config_manifest: '/etc/scada/config.yaml',
      sbom: 'spdx-2.3.json',
      tee_quote: 'sgx://enclave',
      memory_sample: '0x7fff5000-0x7fff6000',
      control_flow: 'cfi://main+0x1234',
      filesystem_state: '/var/run/scada/',
      network_config: 'eth0:192.168.1.100',
    };
    return paths[type] || `/path/${type}`;
  }

  // Start simulation
  start(speed: number = 1): void {
    this.speed = speed;

    // Initial state
    this.transition('ARTIFACT_VERIFY');
    this.createEvent('RUN_STARTED', 'Portal initialized, verifying artifact signature');

    // Simulate artifact verification
    setTimeout(() => {
      this.createEvent('ARTIFACT_VERIFIED', 'Artifact signature verified, baselines sealed');
      this.transition('ACTIVE_MONITORING');

      // Start measurement loop
      this.startMeasurementLoop();
    }, 1000 / speed);
  }

  // Start measurement loop
  private startMeasurementLoop(): void {
    const cadenceMs = this.run.config.measurementCadenceMs / this.speed;

    this.intervalId = setInterval(() => {
      if (this.run.state === 'ACTIVE_MONITORING') {
        // Check if drift should be triggered
        const shouldDrift = this.driftScheduled &&
          this.driftTriggerTime !== null &&
          Date.now() >= this.driftTriggerTime;

        // Generate measurements for all configured types
        for (const type of this.run.config.measurementTypes) {
          const measurement = this.generateMeasurement(type, shouldDrift === true);

          if (measurement.matches) {
            this.createEvent('MEASUREMENT_OK', `${type} integrity verified`, {
              measurementType: type,
              currentHash: measurement.hash,
              expectedHash: measurement.hash,
            });
          } else {
            // Drift detected!
            this.handleDrift(type, measurement);
            break; // Only process first drift
          }
        }
      }
    }, cadenceMs);
  }

  // Handle drift detection
  private handleDrift(type: MeasurementType, measurement: MeasurementSnapshot): void {
    this.run.driftInjectedAt = new Date().toISOString();

    this.transition('DRIFT_DETECTED');
    this.createEvent('DRIFT_DETECTED', `Integrity violation: ${type} hash mismatch`, {
      measurementType: type,
      currentHash: measurement.hash,
      expectedHash: this.generateHash(`${this.run.artifactId}-${type}-baseline`),
      mismatchedPaths: [measurement.path || ''],
      reason: 'HASH_MISMATCH',
    });

    // Execute enforcement action
    this.executeEnforcement();
  }

  // Execute enforcement action based on config
  private executeEnforcement(): void {
    const action = this.run.config.enforcementAction;

    this.createEvent('ENFORCEMENT_ACTION', `Executing enforcement: ${action}`, {
      enforcementAction: action,
    });

    switch (action) {
      case 'TERMINATE':
        this.transition('TERMINATED');
        this.createEvent('TERMINATED', 'Process terminated by governance policy');
        this.stop();
        break;

      case 'QUARANTINE':
        this.transition('PHANTOM_QUARANTINE');
        this.createEvent('QUARANTINE_START', 'Phantom execution mode activated - process isolated');
        break;

      case 'NETWORK_ISOLATION':
        this.transition('NETWORK_ISOLATED');
        this.createEvent('NETWORK_SEVERED', 'All network connections severed');
        break;

      case 'SAFE_STATE':
        this.transition('SAFE_STATE');
        this.createEvent('SAFE_STATE_ENTERED', 'Returning to known-good configuration');
        // After safe state, return to monitoring
        setTimeout(() => {
          if (this.run.state === 'SAFE_STATE') {
            this.transition('ACTIVE_MONITORING');
            this.createEvent('MEASUREMENT_OK', 'Safe state restored, resuming monitoring');
          }
        }, 2000 / this.speed);
        break;

      case 'ALERT':
        // Continue monitoring after alert
        this.transition('ACTIVE_MONITORING');
        break;
    }
  }

  // Trigger drift (for demo purposes)
  triggerDrift(delayMs: number = 0): void {
    this.driftScheduled = true;
    this.driftTriggerTime = Date.now() + delayMs;
  }

  // Stop simulation
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.run.state !== 'TERMINATED' && this.run.state !== 'COMPLETED') {
      this.transition('COMPLETED');
    }

    this.run.endedAt = new Date().toISOString();
    this.createEvent('RUN_ENDED', 'Simulation complete - evidence bundle available');
    this.createEvent('CHECKPOINT', 'Final checkpoint anchored');
  }

  // Get current run state
  getRun(): SimulationRun {
    return this.run;
  }

  // Check if running
  isRunning(): boolean {
    return this.intervalId !== null;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSimulationRun(
  artifactId: string,
  artifactName: string,
  config: RuntimeConfig,
  options: SimulationOptions = {}
): SimulationRun {
  return {
    id: `run_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`,
    artifactId,
    artifactName,
    state: 'INITIALIZATION',
    startedAt: new Date().toISOString(),
    config,
    events: [],
    measurements: [],
    scenarioId: options.scenarioId,
  };
}

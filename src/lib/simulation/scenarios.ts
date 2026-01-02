/**
 * Pre-built Demo Scenarios for Defense Contractor Presentations
 *
 * Each scenario demonstrates specific patent claims and shows
 * how the system handles real-world attack patterns.
 */

import type { RuntimeConfig, SubjectCategory, MeasurementType, EnforcementAction } from '@/components/artifact/RuntimeSettings';

// ============================================================================
// TYPES
// ============================================================================

export interface ScenarioEvent {
  time: number; // seconds from start
  type: 'MEASUREMENT_OK' | 'DRIFT_DETECTED' | 'ENFORCEMENT' | 'CHECKPOINT';
  description: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  category: SubjectCategory;
  duration: number; // seconds
  driftTime: number; // when to inject drift (seconds)
  config: RuntimeConfig;
  events: ScenarioEvent[];
  patentClaims: number[];
  narrative: {
    opening: string;
    drift: string;
    enforcement: string;
    closing: string;
  };
}

// ============================================================================
// SCENARIO DEFINITIONS
// ============================================================================

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scada_attack',
    name: 'SCADA Malware Injection',
    description: 'Simulates malware modifying PLC control logic in an industrial control system',
    category: 'scada',
    duration: 90,
    driftTime: 45,
    config: {
      subjectCategory: 'scada',
      measurementTypes: ['executable_image', 'config_manifest', 'loaded_modules'] as MeasurementType[],
      measurementCadenceMs: 5000,
      ttlSeconds: 86400,
      enforcementAction: 'QUARANTINE' as EnforcementAction,
    },
    events: [
      { time: 0, type: 'MEASUREMENT_OK', description: 'Portal initializes, baselines sealed' },
      { time: 15, type: 'MEASUREMENT_OK', description: 'Executable image verified' },
      { time: 30, type: 'MEASUREMENT_OK', description: 'Config manifest matched' },
      { time: 45, type: 'DRIFT_DETECTED', description: 'PLC logic modification detected' },
      { time: 47, type: 'ENFORCEMENT', description: 'Quarantine activated - phantom mode' },
      { time: 75, type: 'CHECKPOINT', description: 'Evidence bundle available' },
    ],
    patentClaims: [1, 3, 4, 5, 11, 17, 18, 20],
    narrative: {
      opening: 'A SCADA control process is bound to a sealed policy artifact. The portal continuously verifies executable integrity at 5-second intervals.',
      drift: 'At T+45s, an adversary attempts to inject malicious code into the PLC control logic. The portal immediately detects the hash mismatch.',
      enforcement: 'Per the governance policy, the system enters phantom quarantine mode. The process believes it is executing normally, but all actuator commands are intercepted and logged.',
      closing: 'A cryptographically-signed evidence bundle proves: (1) the policy that was minted, (2) the exact moment of compromise, (3) the enforcement action taken. This bundle verifies offline.',
    },
  },
  {
    id: 'drone_hijack',
    name: 'Drone Firmware Hijack',
    description: 'Detects and responds to unauthorized firmware modification on an autonomous UAV',
    category: 'autonomous_drone',
    duration: 60,
    driftTime: 30,
    config: {
      subjectCategory: 'autonomous_drone',
      measurementTypes: ['executable_image', 'config_manifest', 'control_flow', 'network_config'] as MeasurementType[],
      measurementCadenceMs: 2000,
      ttlSeconds: 3600,
      enforcementAction: 'SAFE_STATE' as EnforcementAction,
    },
    events: [
      { time: 0, type: 'MEASUREMENT_OK', description: 'Mission start, flight systems verified' },
      { time: 10, type: 'MEASUREMENT_OK', description: 'Control flow integrity nominal' },
      { time: 20, type: 'MEASUREMENT_OK', description: 'Navigation subsystem verified' },
      { time: 30, type: 'DRIFT_DETECTED', description: 'Firmware hash mismatch detected' },
      { time: 32, type: 'ENFORCEMENT', description: 'Safe state: Return-to-base initiated' },
      { time: 50, type: 'CHECKPOINT', description: 'Evidence preserved for forensics' },
    ],
    patentClaims: [1, 2, 3, 6, 7, 12, 16, 18, 20],
    narrative: {
      opening: 'An autonomous drone is governed by a policy artifact that specifies safe-state recovery on integrity violation. Measurement cadence is 2 seconds for real-time protection.',
      drift: 'During flight, an attacker attempts to modify the drone firmware to alter the mission parameters. The portal detects the modification within 2 seconds.',
      enforcement: 'The governance policy triggers safe-state recovery. The drone abandons its current mission and initiates return-to-base procedures using verified firmware.',
      closing: 'The evidence bundle contains cryptographic proof of the hijack attempt, the exact time of detection, and the autonomous enforcement action. This evidence is legally defensible.',
    },
  },
  {
    id: 'config_drift',
    name: 'Unauthorized Configuration Change',
    description: 'Detects when an administrator makes undocumented changes to a containerized workload',
    category: 'container',
    duration: 45,
    driftTime: 25,
    config: {
      subjectCategory: 'container',
      measurementTypes: ['container_image', 'config_manifest', 'sbom', 'filesystem_state'] as MeasurementType[],
      measurementCadenceMs: 10000,
      ttlSeconds: 604800,
      enforcementAction: 'ALERT' as EnforcementAction,
    },
    events: [
      { time: 0, type: 'MEASUREMENT_OK', description: 'Container deployed, baselines sealed' },
      { time: 10, type: 'MEASUREMENT_OK', description: 'Configuration unchanged' },
      { time: 25, type: 'DRIFT_DETECTED', description: 'Config file modified without attestation' },
      { time: 27, type: 'ENFORCEMENT', description: 'Alert emitted, audit trail created' },
      { time: 40, type: 'CHECKPOINT', description: 'Evidence bundle ready' },
    ],
    patentClaims: [1, 3, 7, 8, 9, 13, 20],
    narrative: {
      opening: 'A production container is governed by a policy artifact requiring all configuration changes to be re-attested. The portal monitors at 10-second intervals.',
      drift: 'An administrator manually edits a configuration file without going through the proper change management process. The portal immediately detects the unauthorized change.',
      enforcement: 'Per the alert-only policy, the system logs the event and continues monitoring. A signed receipt captures the exact change and the identity of the process that made it.',
      closing: 'The evidence bundle provides proof that change controls were bypassed, enabling compliance audits and incident response without relying on mutable log files.',
    },
  },
  {
    id: 'ai_model_swap',
    name: 'AI Model Substitution Attack',
    description: 'Detects unauthorized replacement of an AI model with a malicious variant',
    category: 'ai_agent',
    duration: 75,
    driftTime: 40,
    config: {
      subjectCategory: 'ai_agent',
      measurementTypes: ['executable_image', 'memory_sample', 'control_flow', 'filesystem_state'] as MeasurementType[],
      measurementCadenceMs: 5000,
      ttlSeconds: 2592000,
      enforcementAction: 'TERMINATE' as EnforcementAction,
    },
    events: [
      { time: 0, type: 'MEASUREMENT_OK', description: 'AI agent initialized, model weights verified' },
      { time: 20, type: 'MEASUREMENT_OK', description: 'Inference operations nominal' },
      { time: 40, type: 'DRIFT_DETECTED', description: 'Model checksum mismatch detected' },
      { time: 42, type: 'ENFORCEMENT', description: 'Execution terminated immediately' },
      { time: 60, type: 'CHECKPOINT', description: 'Forensic evidence sealed' },
    ],
    patentClaims: [1, 2, 3, 4, 11, 12, 19, 20],
    narrative: {
      opening: 'An autonomous AI trading agent is governed by a strict policy: any model modification triggers immediate termination. The original model weights are cryptographically sealed.',
      drift: 'An attacker attempts to swap the AI model with a malicious variant designed to make fraudulent trades. The portal detects the model checksum change.',
      enforcement: 'The governance policy mandates immediate termination. The AI agent is stopped before it can execute any trades with the compromised model.',
      closing: 'The evidence bundle proves that (1) a legitimate model was initially deployed, (2) tampering was detected at a specific time, (3) the system was terminated before any malicious operations. This is critical for regulatory compliance.',
    },
  },
  {
    id: 'embedded_ecu',
    name: 'Vehicle ECU Integrity Violation',
    description: 'Monitors embedded automotive controller for unauthorized firmware modifications',
    category: 'embedded',
    duration: 60,
    driftTime: 35,
    config: {
      subjectCategory: 'embedded',
      measurementTypes: ['executable_image', 'config_manifest', 'memory_sample'] as MeasurementType[],
      measurementCadenceMs: 1000,
      ttlSeconds: 31536000,
      enforcementAction: 'NETWORK_ISOLATION' as EnforcementAction,
    },
    events: [
      { time: 0, type: 'MEASUREMENT_OK', description: 'ECU boot complete, firmware verified' },
      { time: 15, type: 'MEASUREMENT_OK', description: 'CAN bus interface secured' },
      { time: 35, type: 'DRIFT_DETECTED', description: 'Firmware modification detected' },
      { time: 37, type: 'ENFORCEMENT', description: 'Network isolation - CAN bus disconnected' },
      { time: 55, type: 'CHECKPOINT', description: 'Evidence bundle created' },
    ],
    patentClaims: [1, 3, 4, 5, 13, 14, 17, 20],
    narrative: {
      opening: 'A vehicle ECU is governed by a high-frequency policy artifact (1-second measurement cadence). Any firmware change triggers network isolation to prevent cascading attacks.',
      drift: 'An attacker gains access to the ECU and attempts to modify the firmware to send malicious commands to other vehicle systems.',
      enforcement: 'The portal immediately isolates the ECU from the CAN bus, preventing any potentially malicious commands from reaching braking, steering, or powertrain systems.',
      closing: 'The evidence bundle documents the attack timeline with millisecond precision, including the exact point of isolation. This is essential for automotive safety investigations.',
    },
  },
];

// ============================================================================
// SCENARIO HELPERS
// ============================================================================

export function getScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find(s => s.id === id);
}

export function getScenariosByCategory(category: SubjectCategory): DemoScenario[] {
  return DEMO_SCENARIOS.filter(s => s.category === category);
}

export function getDefaultScenario(): DemoScenario {
  return DEMO_SCENARIOS[0]; // SCADA attack
}

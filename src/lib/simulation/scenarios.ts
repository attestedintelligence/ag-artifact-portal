/**
 * Pre-built Demo Scenarios for Defense Contractor Presentations
 *
 * Aligned with Anduril Lattice platform concepts:
 * - Lattice Mesh: Distributed sensor/effector networks
 * - Mission Autonomy: AI-driven autonomous operations
 * - Command & Control: NGC2 battle command integration
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
  type: 'MEASUREMENT_OK' | 'DRIFT_DETECTED' | 'ENFORCEMENT' | 'CHECKPOINT' | 'MESH_SYNC' | 'ANCHOR_SUBMIT';
  description: string;
  severity?: 'info' | 'warning' | 'critical';
  subsystem?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  shortName: string;
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
  // Enhanced metadata for Lattice alignment
  latticeAlignment?: 'mesh' | 'autonomy' | 'c2';
  operationalContext?: string;
  threatVector?: string;
  missionImpact?: string;
  featured?: boolean;
}

// ============================================================================
// PRIMARY LATTICE-ALIGNED SCENARIOS
// ============================================================================

const LATTICE_MESH_SCENARIO: DemoScenario = {
  id: 'lattice_mesh_swarm',
  name: 'LATTICE MESH: Multi-Domain Sensor Fusion',
  shortName: 'Mesh Integrity',
  description: 'Distributed autonomous swarm coordination with real-time sensor fusion across mesh network nodes',
  category: 'autonomous_drone',
  duration: 120,
  driftTime: 55,
  config: {
    subjectCategory: 'autonomous_drone',
    measurementTypes: ['executable_image', 'config_manifest', 'network_config', 'control_flow', 'memory_sample'] as MeasurementType[],
    measurementCadenceMs: 1000,
    ttlSeconds: 7200,
    enforcementAction: 'NETWORK_ISOLATION' as EnforcementAction,
  },
  events: [
    { time: 0, type: 'MEASUREMENT_OK', description: 'Mesh network initialized - 12 nodes online', subsystem: 'MESH-NET', severity: 'info' },
    { time: 5, type: 'MESH_SYNC', description: 'Lattice handshake complete - consensus established', subsystem: 'CONSENSUS', severity: 'info' },
    { time: 10, type: 'MEASUREMENT_OK', description: 'Sensor fusion layer verified', subsystem: 'FUSION', severity: 'info' },
    { time: 20, type: 'MEASUREMENT_OK', description: 'Track correlation nominal - 47 tracks', subsystem: 'TRACKING', severity: 'info' },
    { time: 35, type: 'MEASUREMENT_OK', description: 'Effector coordination verified', subsystem: 'EFFECTS', severity: 'info' },
    { time: 45, type: 'MESH_SYNC', description: 'Cross-domain link integrity confirmed', subsystem: 'X-LINK', severity: 'info' },
    { time: 55, type: 'DRIFT_DETECTED', description: 'NODE-7: Firmware hash mismatch detected', subsystem: 'NODE-7', severity: 'critical' },
    { time: 56, type: 'DRIFT_DETECTED', description: 'Anomalous track injection attempt identified', subsystem: 'FUSION', severity: 'critical' },
    { time: 58, type: 'ENFORCEMENT', description: 'NODE-7 isolated from mesh - firewall engaged', subsystem: 'MESH-NET', severity: 'warning' },
    { time: 60, type: 'MESH_SYNC', description: 'Mesh reconverged - 11 nodes operational', subsystem: 'CONSENSUS', severity: 'info' },
    { time: 75, type: 'MEASUREMENT_OK', description: 'Sensor fusion integrity restored', subsystem: 'FUSION', severity: 'info' },
    { time: 90, type: 'CHECKPOINT', description: 'Merkle checkpoint created - batch anchored', subsystem: 'ANCHOR', severity: 'info' },
    { time: 100, type: 'ANCHOR_SUBMIT', description: 'Arweave transaction submitted', subsystem: 'BLOCKWEAVE', severity: 'info' },
  ],
  patentClaims: [1, 3, 4, 5, 6, 11, 14, 17, 18, 19, 20],
  narrative: {
    opening: 'A distributed Lattice Mesh network coordinates 12 autonomous platforms across air, ground, and maritime domains. Each node runs a governed runtime that continuously verifies firmware and configuration integrity at 1-second intervals. Sensor fusion algorithms correlate tracks across the mesh in real-time.',
    drift: 'At T+55s, an adversary compromises NODE-7 and attempts to inject false tracks into the sensor fusion layer. The Attested Governance Portal immediately detects the firmware modification and correlates the anomalous track data to the compromised node.',
    enforcement: 'The governance policy triggers network isolation. NODE-7 is removed from the mesh consensus, preventing corrupted data from propagating. The remaining 11 nodes automatically reconverge and continue mission operations with degraded but verified sensor coverage.',
    closing: 'The cryptographic evidence chain proves: (1) which node was compromised, (2) the exact attack vector, (3) that isolation occurred before false tracks could influence targeting decisions. This evidence anchors to Arweave for immutable, legally-defensible audit trail.',
  },
  latticeAlignment: 'mesh',
  operationalContext: 'JADC2 Multi-Domain Operations',
  threatVector: 'Supply Chain Compromise / Node Subversion',
  missionImpact: 'Prevented false target injection into kill chain',
  featured: true,
};

const MISSION_AUTONOMY_SCENARIO: DemoScenario = {
  id: 'mission_autonomy_ai',
  name: 'MISSION AUTONOMY: Combat AI Decision Engine',
  shortName: 'AI Governance',
  description: 'Autonomous mission execution with AI-driven decision making under cryptographic governance',
  category: 'ai_agent',
  duration: 100,
  driftTime: 50,
  config: {
    subjectCategory: 'ai_agent',
    measurementTypes: ['executable_image', 'memory_sample', 'control_flow', 'config_manifest', 'tee_quote'] as MeasurementType[],
    measurementCadenceMs: 500,
    ttlSeconds: 3600,
    enforcementAction: 'SAFE_STATE' as EnforcementAction,
  },
  events: [
    { time: 0, type: 'MEASUREMENT_OK', description: 'Mission Autonomy Engine initialized', subsystem: 'MAE-CORE', severity: 'info' },
    { time: 5, type: 'MEASUREMENT_OK', description: 'TEE attestation verified - enclave sealed', subsystem: 'SGX-TEE', severity: 'info' },
    { time: 10, type: 'MEASUREMENT_OK', description: 'Decision model weights verified', subsystem: 'AI-MODEL', severity: 'info' },
    { time: 15, type: 'MEASUREMENT_OK', description: 'ROE constraint module active', subsystem: 'ROE-GUARD', severity: 'info' },
    { time: 25, type: 'MEASUREMENT_OK', description: 'Target classification pipeline nominal', subsystem: 'CLASSIFY', severity: 'info' },
    { time: 35, type: 'MEASUREMENT_OK', description: 'Effects recommendation engine verified', subsystem: 'EFFECTS-AI', severity: 'info' },
    { time: 45, type: 'MESH_SYNC', description: 'Human-on-the-loop confirmation received', subsystem: 'HOTL', severity: 'info' },
    { time: 50, type: 'DRIFT_DETECTED', description: 'Model weights modification detected', subsystem: 'AI-MODEL', severity: 'critical' },
    { time: 51, type: 'DRIFT_DETECTED', description: 'ROE constraint bypass attempt blocked', subsystem: 'ROE-GUARD', severity: 'critical' },
    { time: 53, type: 'ENFORCEMENT', description: 'Safe state: Mission abort initiated', subsystem: 'MAE-CORE', severity: 'warning' },
    { time: 55, type: 'ENFORCEMENT', description: 'All effects recommendations suspended', subsystem: 'EFFECTS-AI', severity: 'warning' },
    { time: 70, type: 'CHECKPOINT', description: 'Evidence chain sealed with TEE signature', subsystem: 'SGX-TEE', severity: 'info' },
    { time: 85, type: 'ANCHOR_SUBMIT', description: 'Checkpoint anchored to Arweave', subsystem: 'BLOCKWEAVE', severity: 'info' },
  ],
  patentClaims: [1, 2, 3, 4, 5, 10, 11, 12, 16, 18, 19, 20],
  narrative: {
    opening: 'A Mission Autonomy Engine governs an AI-driven combat decision system. The AI model operates within a TEE (Trusted Execution Environment) with cryptographically-enforced Rules of Engagement. All model weights, decision logic, and effects recommendations are continuously verified at 500ms intervals.',
    drift: 'At T+50s, an adversary attempts to modify the AI model weights to bypass ROE constraints and recommend unauthorized effects against protected targets. The governance portal detects both the model modification and the subsequent ROE bypass attempt.',
    enforcement: 'The governance policy mandates immediate safe-state transition. The Mission Autonomy Engine aborts all in-progress targeting cycles and suspends effects recommendations. No unauthorized actions can be taken by the compromised AI.',
    closing: 'The evidence bundle, sealed within the TEE and anchored to Arweave, proves: (1) the AI was operating under valid constraints, (2) tampering was detected before any unauthorized effects, (3) the system failed safe. This is critical for autonomous weapons accountability.',
  },
  latticeAlignment: 'autonomy',
  operationalContext: 'Autonomous Weapons Governance',
  threatVector: 'AI Model Poisoning / ROE Bypass',
  missionImpact: 'Prevented unauthorized lethal effects',
  featured: true,
};

const NGC2_COMMAND_SCENARIO: DemoScenario = {
  id: 'ngc2_command',
  name: 'NGC2 COMMAND: Integrated Battle Command',
  shortName: 'Battle Command',
  description: 'Next-generation C2 with real-time fire control integration and cross-domain coordination',
  category: 'scada',
  duration: 90,
  driftTime: 45,
  config: {
    subjectCategory: 'scada',
    measurementTypes: ['executable_image', 'config_manifest', 'network_config', 'loaded_modules', 'filesystem_state'] as MeasurementType[],
    measurementCadenceMs: 2000,
    ttlSeconds: 14400,
    enforcementAction: 'QUARANTINE' as EnforcementAction,
  },
  events: [
    { time: 0, type: 'MEASUREMENT_OK', description: 'NGC2 Command Post initialized', subsystem: 'NGC2-CP', severity: 'info' },
    { time: 5, type: 'MEASUREMENT_OK', description: 'IBCS-M integration verified', subsystem: 'IBCS-M', severity: 'info' },
    { time: 10, type: 'MESH_SYNC', description: 'Fire control network authenticated', subsystem: 'FC-NET', severity: 'info' },
    { time: 15, type: 'MEASUREMENT_OK', description: 'Effector allocation module verified', subsystem: 'EFFECTOR-MGR', severity: 'info' },
    { time: 25, type: 'MEASUREMENT_OK', description: 'Kill chain integration nominal', subsystem: 'KILL-CHAIN', severity: 'info' },
    { time: 35, type: 'MEASUREMENT_OK', description: 'Cross-Corps data fusion verified', subsystem: 'X-CORPS', severity: 'info' },
    { time: 45, type: 'DRIFT_DETECTED', description: 'Fire control module tampering detected', subsystem: 'FC-NET', severity: 'critical' },
    { time: 46, type: 'DRIFT_DETECTED', description: 'Unauthorized effector allocation attempt', subsystem: 'EFFECTOR-MGR', severity: 'critical' },
    { time: 48, type: 'ENFORCEMENT', description: 'Quarantine: Fire control isolated', subsystem: 'NGC2-CP', severity: 'warning' },
    { time: 50, type: 'ENFORCEMENT', description: 'Phantom mode: Commands logged, not executed', subsystem: 'PHANTOM', severity: 'warning' },
    { time: 65, type: 'MESH_SYNC', description: 'Backup fire control path activated', subsystem: 'FC-BACKUP', severity: 'info' },
    { time: 75, type: 'CHECKPOINT', description: 'Evidence bundle created', subsystem: 'EVIDENCE', severity: 'info' },
    { time: 80, type: 'ANCHOR_SUBMIT', description: 'Merkle root anchored to Arweave', subsystem: 'BLOCKWEAVE', severity: 'info' },
  ],
  patentClaims: [1, 3, 4, 5, 7, 11, 13, 14, 17, 18, 19, 20],
  narrative: {
    opening: 'An NGC2 Command Post integrates with IBCS-M (Integrated Battle Command System - Maneuver) for real-time fire control across Corps to Company. The governance portal verifies all fire control modules and effector allocation systems at 2-second intervals.',
    drift: 'At T+45s, an adversary compromises the fire control network and attempts to inject unauthorized effector allocations targeting friendly positions. The portal immediately detects the tampering and correlates it with the allocation anomaly.',
    enforcement: 'The governance policy triggers quarantine mode. The compromised fire control module enters phantom execution - all commands are logged for forensic analysis but not transmitted to effectors. A backup fire control path is automatically activated.',
    closing: 'The evidence chain proves: (1) the exact moment of compromise, (2) that no unauthorized fire missions were executed, (3) the phantom-mode capture of attempted commands. This evidence anchors to Arweave for permanent, immutable audit.',
  },
  latticeAlignment: 'c2',
  operationalContext: 'Army IBCS-M Fire Control',
  threatVector: 'C2 Node Compromise / Fratricide Attempt',
  missionImpact: 'Prevented friendly fire incident',
  featured: true,
};

// ============================================================================
// ADDITIONAL SCENARIOS
// ============================================================================

const COUNTER_UAS_SCENARIO: DemoScenario = {
  id: 'counter_uas',
  name: 'Counter-UAS Intercept Governance',
  shortName: 'C-UAS',
  description: 'Autonomous counter-drone engagement with verified kill chain integrity',
  category: 'autonomous_drone',
  duration: 60,
  driftTime: 30,
  config: {
    subjectCategory: 'autonomous_drone',
    measurementTypes: ['executable_image', 'config_manifest', 'control_flow', 'network_config'] as MeasurementType[],
    measurementCadenceMs: 500,
    ttlSeconds: 3600,
    enforcementAction: 'TERMINATE' as EnforcementAction,
  },
  events: [
    { time: 0, type: 'MEASUREMENT_OK', description: 'C-UAS system armed', subsystem: 'CUAS-CORE', severity: 'info' },
    { time: 10, type: 'MEASUREMENT_OK', description: 'Radar integration verified', subsystem: 'RADAR', severity: 'info' },
    { time: 20, type: 'MEASUREMENT_OK', description: 'Effector ready state confirmed', subsystem: 'EFFECTOR', severity: 'info' },
    { time: 30, type: 'DRIFT_DETECTED', description: 'Targeting algorithm modified', subsystem: 'TARGETING', severity: 'critical' },
    { time: 32, type: 'ENFORCEMENT', description: 'System terminated - weapons safe', subsystem: 'CUAS-CORE', severity: 'warning' },
    { time: 50, type: 'CHECKPOINT', description: 'Forensic evidence sealed', subsystem: 'EVIDENCE', severity: 'info' },
  ],
  patentClaims: [1, 3, 4, 12, 17, 20],
  narrative: {
    opening: 'An autonomous Counter-UAS system operates under strict governance requiring verified targeting algorithms and effector control.',
    drift: 'An adversary modifies the targeting algorithm to misclassify friendly aircraft as hostile threats.',
    enforcement: 'The governance policy mandates immediate termination. The system goes to weapons-safe before any engagement.',
    closing: 'The evidence proves the attack vector and demonstrates fail-safe behavior under governance.',
  },
  latticeAlignment: 'mesh',
  operationalContext: 'Force Protection',
  threatVector: 'Targeting Algorithm Manipulation',
  missionImpact: 'Prevented friendly aircraft engagement',
};

const SOCOM_AUTONOMY_SCENARIO: DemoScenario = {
  id: 'socom_autonomy',
  name: 'SOCOM Multi-Robot Coordination',
  shortName: 'SOF Autonomy',
  description: 'Special Operations autonomous platform coordination with integrity verification',
  category: 'ai_agent',
  duration: 75,
  driftTime: 40,
  config: {
    subjectCategory: 'ai_agent',
    measurementTypes: ['executable_image', 'memory_sample', 'control_flow', 'config_manifest'] as MeasurementType[],
    measurementCadenceMs: 1000,
    ttlSeconds: 7200,
    enforcementAction: 'SAFE_STATE' as EnforcementAction,
  },
  events: [
    { time: 0, type: 'MEASUREMENT_OK', description: 'SOF autonomy stack initialized', subsystem: 'SOF-AUTO', severity: 'info' },
    { time: 15, type: 'MEASUREMENT_OK', description: 'Multi-robot coordinator verified', subsystem: 'MRC', severity: 'info' },
    { time: 30, type: 'MESH_SYNC', description: 'Swarm consensus established', subsystem: 'SWARM', severity: 'info' },
    { time: 40, type: 'DRIFT_DETECTED', description: 'Coordinator logic modification detected', subsystem: 'MRC', severity: 'critical' },
    { time: 42, type: 'ENFORCEMENT', description: 'Safe state: All platforms hold position', subsystem: 'SWARM', severity: 'warning' },
    { time: 60, type: 'CHECKPOINT', description: 'Evidence checkpoint created', subsystem: 'EVIDENCE', severity: 'info' },
  ],
  patentClaims: [1, 3, 5, 11, 12, 16, 20],
  narrative: {
    opening: 'SOCOM deploys a multi-robot coordination system for ISR operations with continuous integrity verification.',
    drift: 'An adversary attempts to modify the coordination logic to redirect autonomous platforms to a compromised location.',
    enforcement: 'The governance policy triggers safe-state. All platforms hold position until human verification.',
    closing: 'The evidence proves the tampering attempt and the system\'s fail-safe response.',
  },
  latticeAlignment: 'autonomy',
  operationalContext: 'Special Operations ISR',
  threatVector: 'Coordination Logic Tampering',
  missionImpact: 'Prevented platform redirection to ambush',
};

// ============================================================================
// EXPORT ALL SCENARIOS
// ============================================================================

export const DEMO_SCENARIOS: DemoScenario[] = [
  // Featured Lattice-aligned scenarios first
  LATTICE_MESH_SCENARIO,
  MISSION_AUTONOMY_SCENARIO,
  NGC2_COMMAND_SCENARIO,
  // Additional scenarios
  COUNTER_UAS_SCENARIO,
  SOCOM_AUTONOMY_SCENARIO,
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

export function getFeaturedScenarios(): DemoScenario[] {
  return DEMO_SCENARIOS.filter(s => s.featured);
}

export function getScenariosByLatticeAlignment(alignment: 'mesh' | 'autonomy' | 'c2'): DemoScenario[] {
  return DEMO_SCENARIOS.filter(s => s.latticeAlignment === alignment);
}

export function getDefaultScenario(): DemoScenario {
  return LATTICE_MESH_SCENARIO;
}

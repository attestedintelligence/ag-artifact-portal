/**
 * Runtime Package Exports
 * Per AGA Build Guide Phase 5
 */

// Engine
export {
  RuntimeEngine,
  createRuntimeEngine,
  type EngineState,
  type RuntimeConfig,
  type EngineEvents,
  type MeasurementResult,
  type DriftDetails,
  type EnforcementRecord,
} from './engine';

// Measurement
export {
  MeasurementExecutor,
  HashComparator,
  measurementExecutor,
  hashComparator,
  generateMeasurementReceipt,
  type MeasurementType,
  type MeasurementConfig,
  type MeasurementInput,
  type MeasurementOutput,
  type DriftInfo,
  type MeasurementReceipt,
} from './measurement';

// Enforcement
export {
  EnforcementExecutor,
  enforcementExecutor,
  handleTerminate,
  handleQuarantine,
  handleAlert,
  type EnforcementContext,
  type EnforcementResult,
  type NotificationPayload,
} from './enforcement';

// Lifecycle
export {
  TtlMonitor,
  ttlMonitor,
  generateAutoBundleAtExpiration,
  sendExpirationNotification,
  type LifecycleConfig,
  type ArtifactLifecycle,
  type LifecycleEvent,
  type ExpirationNotification,
} from './lifecycle';

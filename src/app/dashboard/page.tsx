'use client';

/**
 * AGA Portal Dashboard - Enterprise Preview
 *
 * Runtime simulation dashboard demonstrating all 20 patent claims.
 * Features:
 * - Portal state visualization
 * - Live measurement stream
 * - Drift detection with enforcement animation
 * - Chain visualization with real cryptographic receipts
 * - Evidence bundle export with offline verification
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Square,
  AlertTriangle,
  Download,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  Zap,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SimulationEngine,
  createSimulationRun,
  type SimulationRun,
  type SimulationEvent,
  type SimulationState,
  type MeasurementSnapshot,
} from '@/lib/simulation';
import { DEMO_SCENARIOS, getDefaultScenario, type DemoScenario } from '@/lib/simulation/scenarios';
import { PATENT_CLAIMS } from '@/lib/constants';
import type { RuntimeConfig } from '@/components/artifact/RuntimeSettings';
import { ReceiptChainManager, type ReceiptChain } from '@/lib/chain';
import { generateEvidenceBundle, downloadBundle, type EvidenceBundle } from '@/lib/bundles';

// ============================================================================
// STATE COLORS
// ============================================================================

const STATE_COLORS: Record<SimulationState, { bg: string; text: string; glow: string }> = {
  'INITIALIZATION': { bg: '#737373', text: '#A3A3A3', glow: 'none' },
  'ARTIFACT_VERIFY': { bg: '#3B82F6', text: '#60A5FA', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
  'ACTIVE_MONITORING': { bg: '#22C55E', text: '#4ADE80', glow: '0 0 20px rgba(34, 197, 94, 0.5)' },
  'DRIFT_DETECTED': { bg: '#EF4444', text: '#F87171', glow: '0 0 30px rgba(239, 68, 68, 0.6)' },
  'PHANTOM_QUARANTINE': { bg: '#FFB800', text: '#FBBF24', glow: '0 0 25px rgba(255, 184, 0, 0.5)' },
  'NETWORK_ISOLATED': { bg: '#F59E0B', text: '#FBBF24', glow: '0 0 25px rgba(245, 158, 11, 0.5)' },
  'SAFE_STATE': { bg: '#22C55E', text: '#4ADE80', glow: '0 0 20px rgba(34, 197, 94, 0.5)' },
  'TERMINATED': { bg: '#EF4444', text: '#F87171', glow: '0 0 30px rgba(239, 68, 68, 0.6)' },
  'COMPLETED': { bg: '#3B82F6', text: '#60A5FA', glow: '0 0 20px rgba(59, 130, 246, 0.5)' },
};

const STATE_LABELS: Record<SimulationState, string> = {
  'INITIALIZATION': 'Initializing',
  'ARTIFACT_VERIFY': 'Verifying Artifact',
  'ACTIVE_MONITORING': 'Active Monitoring',
  'DRIFT_DETECTED': 'Drift Detected',
  'PHANTOM_QUARANTINE': 'Quarantine Mode',
  'NETWORK_ISOLATED': 'Network Isolated',
  'SAFE_STATE': 'Safe State',
  'TERMINATED': 'Terminated',
  'COMPLETED': 'Completed',
};

// ============================================================================
// PORTAL STATE COMPONENT
// ============================================================================

function PortalState({ state, uptime }: { state: SimulationState; uptime: number }) {
  const colors = STATE_COLORS[state];
  const label = STATE_LABELS[state];

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="text-xs text-muted-foreground mb-2 font-mono">PORTAL STATE</div>
      <motion.div
        className="flex items-center gap-3 mb-4"
        animate={{
          boxShadow: state === 'DRIFT_DETECTED' ? [colors.glow, 'none', colors.glow] : 'none',
        }}
        transition={{ duration: 0.5, repeat: state === 'DRIFT_DETECTED' ? Infinity : 0 }}
      >
        <motion.div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: colors.bg }}
          animate={{
            scale: state === 'ACTIVE_MONITORING' ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 1, repeat: state === 'ACTIVE_MONITORING' ? Infinity : 0 }}
        />
        <span className="text-lg font-semibold" style={{ color: colors.text }}>
          {label}
        </span>
      </motion.div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Uptime</span>
          <div className="font-mono text-primary">{formatUptime(uptime)}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Status</span>
          <div className="flex items-center gap-1">
            {state === 'ACTIVE_MONITORING' && <Activity className="w-3 h-3 text-green-400 animate-pulse" />}
            {state === 'DRIFT_DETECTED' && <AlertTriangle className="w-3 h-3 text-red-400" />}
            <span style={{ color: colors.text }}>
              {state === 'ACTIVE_MONITORING' ? 'OK' : state === 'DRIFT_DETECTED' ? 'ALERT' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEASUREMENT STREAM COMPONENT
// ============================================================================

function MeasurementStream({ events }: { events: SimulationEvent[] }) {
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="p-4 rounded-lg border border-border bg-card h-64">
      <div className="text-xs text-muted-foreground mb-2 font-mono flex items-center justify-between">
        <span>MEASUREMENT STREAM</span>
        <span className="text-primary">{events.length} events</span>
      </div>
      <div ref={streamRef} className="h-48 overflow-y-auto space-y-1 font-mono text-xs">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center gap-2 p-1 rounded',
                event.type === 'DRIFT_DETECTED' && 'bg-red-500/20 text-red-400',
                event.type === 'MEASUREMENT_OK' && 'text-green-400',
                event.type === 'ENFORCEMENT_ACTION' && 'bg-amber-500/20 text-amber-400',
              )}
            >
              <span className="text-muted-foreground w-20">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              {event.type === 'MEASUREMENT_OK' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              {event.type === 'DRIFT_DETECTED' && <XCircle className="w-3 h-3 text-red-400" />}
              {event.type === 'ENFORCEMENT_ACTION' && <Zap className="w-3 h-3 text-amber-400" />}
              <span className="truncate">{event.description}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div className="text-muted-foreground text-center py-4">
            Waiting for measurements...
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HASH COMPARISON COMPONENT
// ============================================================================

function HashComparison({ measurements }: { measurements: MeasurementSnapshot[] }) {
  const latest = measurements[measurements.length - 1];

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="text-xs text-muted-foreground mb-2 font-mono">HASH COMPARISON</div>
      {latest ? (
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Current</div>
            <code className={cn(
              'text-xs font-mono block truncate',
              latest.matches ? 'text-green-400' : 'text-red-400'
            )}>
              {latest.hash.substring(0, 32)}...
            </code>
          </div>
          <div className="flex items-center gap-2">
            {latest.matches ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm">Match verified</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-sm">Mismatch detected</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">No measurements yet</div>
      )}
    </div>
  );
}

// ============================================================================
// DEMO CONTROLS COMPONENT
// ============================================================================

function DemoControls({
  isRunning,
  scenario,
  onStart,
  onStop,
  onTriggerDrift,
  onScenarioChange,
}: {
  isRunning: boolean;
  scenario: DemoScenario;
  onStart: () => void;
  onStop: () => void;
  onTriggerDrift: () => void;
  onScenarioChange: (id: string) => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="text-xs text-muted-foreground mb-3 font-mono">DEMO CONTROLS</div>
      <div className="space-y-3">
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={onStart} size="sm" className="flex-1">
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          ) : (
            <>
              <Button onClick={onTriggerDrift} size="sm" variant="destructive" className="flex-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Trigger Drift
              </Button>
              <Button onClick={onStop} size="sm" variant="outline">
                <Square className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Scenario</label>
          <select
            value={scenario.id}
            onChange={(e) => onScenarioChange(e.target.value)}
            disabled={isRunning}
            className="w-full px-2 py-1 text-sm rounded border border-border bg-background text-foreground"
          >
            {DEMO_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CHAIN VISUALIZATION COMPONENT
// ============================================================================

function ChainVisualization({ events }: { events: SimulationEvent[] }) {
  const criticalEvents = events.filter(e =>
    ['RUN_STARTED', 'DRIFT_DETECTED', 'ENFORCEMENT_ACTION', 'CHECKPOINT', 'RUN_ENDED'].includes(e.type)
  );

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="text-xs text-muted-foreground mb-3 font-mono flex items-center justify-between">
        <span>CONTINUITY CHAIN</span>
        <span className="text-primary">{criticalEvents.length} receipts</span>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        {criticalEvents.map((event, index) => (
          <div key={event.id} className="flex items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono cursor-pointer transition-transform hover:scale-110',
                event.type === 'DRIFT_DETECTED' && 'bg-red-500 text-white',
                event.type === 'ENFORCEMENT_ACTION' && 'bg-amber-500 text-black',
                event.type === 'RUN_STARTED' && 'bg-blue-500 text-white',
                event.type === 'RUN_ENDED' && 'bg-blue-500 text-white',
                event.type === 'CHECKPOINT' && 'bg-green-500 text-white',
              )}
              title={`${event.type}: ${event.description}`}
            >
              {event.type === 'RUN_STARTED' && 'G'}
              {event.type === 'DRIFT_DETECTED' && 'D'}
              {event.type === 'ENFORCEMENT_ACTION' && 'E'}
              {event.type === 'CHECKPOINT' && 'C'}
              {event.type === 'RUN_ENDED' && 'X'}
            </motion.div>
            {index < criticalEvents.length - 1 && (
              <div className="w-4 h-0.5 bg-primary/50" />
            )}
          </div>
        ))}
        {criticalEvents.length === 0 && (
          <div className="text-muted-foreground text-xs">Chain will appear here...</div>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        G=Genesis D=Drift E=Enforcement C=Checkpoint X=End
      </div>
    </div>
  );
}

// ============================================================================
// NARRATIVE PANEL
// ============================================================================

function NarrativePanel({ scenario, state }: { scenario: DemoScenario; state: SimulationState }) {
  const getCurrentNarrative = () => {
    if (state === 'INITIALIZATION' || state === 'ARTIFACT_VERIFY' || state === 'ACTIVE_MONITORING') {
      return scenario.narrative.opening;
    }
    if (state === 'DRIFT_DETECTED') {
      return scenario.narrative.drift;
    }
    if (['PHANTOM_QUARANTINE', 'NETWORK_ISOLATED', 'SAFE_STATE', 'TERMINATED'].includes(state)) {
      return scenario.narrative.enforcement;
    }
    return scenario.narrative.closing;
  };

  return (
    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-400">Scenario Narrative</span>
      </div>
      <p className="text-sm text-muted-foreground">{getCurrentNarrative()}</p>
      <div className="flex flex-wrap gap-1 mt-3">
        {scenario.patentClaims.slice(0, 5).map(claim => (
          <span
            key={claim}
            className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400"
          >
            Claim {claim}{PATENT_CLAIMS[claim as keyof typeof PATENT_CLAIMS]?.independent ? '*' : ''}
          </span>
        ))}
        {scenario.patentClaims.length > 5 && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400">
            +{scenario.patentClaims.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// WHAT'S REAL VS SIMULATED DISCLOSURE
// ============================================================================

function DisclosurePanel() {
  const [isOpen, setIsOpen] = useState(false);

  const realFeatures = [
    { label: 'SHA-256 Hashing', description: 'All hashes computed using Web Crypto API' },
    { label: 'Receipt Chain', description: 'Hash-linked receipts with proper prev_hash linking' },
    { label: 'Merkle Tree', description: 'Real Merkle root computation over leaf hashes' },
    { label: 'Policy Artifact', description: 'Signed policy structure per patent specification' },
    { label: 'Evidence Bundle', description: 'Downloadable JSON with embedded verifier' },
    { label: 'Offline Verifier', description: 'Node.js script included in bundle' },
  ];

  const simulatedFeatures = [
    { label: 'Ed25519 Signatures', description: 'Using SHA-256 hash as signature placeholder' },
    { label: 'Runtime Enforcement', description: 'State machine simulation, not real process control' },
    { label: 'Drift Detection', description: 'Triggered manually or by scenario timeline' },
    { label: 'TSA Timestamps', description: 'Using local time, not RFC3161 TSA tokens' },
    { label: 'Checkpoint Anchoring', description: 'Simulated anchor, not real Arweave/Ethereum' },
  ];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">What&apos;s Real vs Simulated</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Real Features */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Production Cryptography</span>
                </div>
                <ul className="space-y-2">
                  {realFeatures.map((feature) => (
                    <li key={feature.label} className="text-xs">
                      <span className="text-foreground">{feature.label}</span>
                      <span className="text-muted-foreground"> - {feature.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Simulated Features */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Demo Simulation</span>
                </div>
                <ul className="space-y-2">
                  {simulatedFeatures.map((feature) => (
                    <li key={feature.label} className="text-xs">
                      <span className="text-foreground">{feature.label}</span>
                      <span className="text-muted-foreground"> - {feature.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="p-3 rounded bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
                <strong className="text-primary">Note:</strong> This Enterprise Preview demonstrates the patent claims
                with production-grade hash computations and chain structures. Ed25519 signatures would use real
                key material in deployment. Offline verifier will output PASS_WITH_CAVEATS (simulated anchor).
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// PATENT CLAIMS SUMMARY BADGE
// ============================================================================

function PatentClaimsSummary({ claimsDemo }: { claimsDemo: number[] }) {
  const independentClaims = claimsDemo.filter(c =>
    PATENT_CLAIMS[c as keyof typeof PATENT_CLAIMS]?.independent
  );
  const dependentClaims = claimsDemo.filter(c =>
    !PATENT_CLAIMS[c as keyof typeof PATENT_CLAIMS]?.independent
  );

  return (
    <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Patent Claims Demonstrated</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-2xl font-bold text-foreground">{independentClaims.length}</div>
          <div className="text-xs text-muted-foreground">Independent Claims</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{dependentClaims.length}</div>
          <div className="text-xs text-muted-foreground">Dependent Claims</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {claimsDemo.map(claim => {
          const info = PATENT_CLAIMS[claim as keyof typeof PATENT_CLAIMS];
          return (
            <span
              key={claim}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded cursor-help',
                info?.independent
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground'
              )}
              title={info?.title || `Claim ${claim}`}
            >
              {claim}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  const [scenario, setScenario] = useState<DemoScenario>(getDefaultScenario());
  const [currentRun, setCurrentRun] = useState<SimulationRun | null>(null);
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementSnapshot[]>([]);
  const [state, setState] = useState<SimulationState>('INITIALIZATION');
  const [uptime, setUptime] = useState(0);
  const [chain, setChain] = useState<ReceiptChain | null>(null);
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [isGeneratingBundle, setIsGeneratingBundle] = useState(false);
  const uptimeRef = useRef<NodeJS.Timeout | null>(null);
  const chainManagerRef = useRef<ReceiptChainManager | null>(null);

  // Handle scenario change
  const handleScenarioChange = useCallback((id: string) => {
    const newScenario = DEMO_SCENARIOS.find(s => s.id === id);
    if (newScenario) {
      setScenario(newScenario);
    }
  }, []);

  // Start simulation
  const handleStart = useCallback(() => {
    const newRun = createSimulationRun(
      `artifact_${Date.now().toString(36)}`,
      scenario.name,
      scenario.config as RuntimeConfig,
      { scenarioId: scenario.id }
    );

    // Create receipt chain manager
    const keyId = `key_${Date.now().toString(36)}`;
    const newChainManager = new ReceiptChainManager(newRun.id, newRun.artifactId, keyId);
    chainManagerRef.current = newChainManager;

    const newEngine = new SimulationEngine(newRun, {
      onEvent: async (event) => {
        setEvents(prev => [...prev, event]);
        // Append event to receipt chain
        if (chainManagerRef.current) {
          await chainManagerRef.current.appendEvent(event);
          setChain(chainManagerRef.current.getChain());
        }
      },
      onStateChange: (newState) => setState(newState),
      onMeasurement: (measurement) => setMeasurements(prev => [...prev, measurement]),
    });

    setCurrentRun(newRun);
    setEngine(newEngine);
    setEvents([]);
    setMeasurements([]);
    setState('INITIALIZATION');
    setUptime(0);
    setChain(null);
    setBundle(null);

    newEngine.start(2); // 2x speed for demo

    // Start uptime counter
    uptimeRef.current = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
  }, [scenario]);

  // Stop simulation
  const handleStop = useCallback(async () => {
    if (engine) {
      engine.stop();
      setEngine(null);
    }
    if (uptimeRef.current) {
      clearInterval(uptimeRef.current);
      uptimeRef.current = null;
    }
    // Create checkpoint on stop
    if (chainManagerRef.current) {
      await chainManagerRef.current.createCheckpoint();
      setChain(chainManagerRef.current.getChain());
    }
  }, [engine]);

  // Trigger drift
  const handleTriggerDrift = useCallback(() => {
    if (engine) {
      engine.triggerDrift(0);
    }
  }, [engine]);

  // Download evidence bundle
  const handleDownloadBundle = useCallback(async () => {
    if (!currentRun || !chain) return;

    setIsGeneratingBundle(true);
    try {
      const newBundle = await generateEvidenceBundle(currentRun, chain);
      setBundle(newBundle);
      downloadBundle(newBundle, `evidence_bundle_${currentRun.id}.json`);
    } catch (error) {
      console.error('Failed to generate bundle:', error);
    } finally {
      setIsGeneratingBundle(false);
    }
  }, [currentRun, chain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uptimeRef.current) {
        clearInterval(uptimeRef.current);
      }
    };
  }, []);

  const isRunning = engine !== null && engine.isRunning();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/create" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Create</span>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">AGA Portal</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ENTERPRISE PREVIEW
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!chain || chain.receipts.length === 0 || isGeneratingBundle}
            onClick={handleDownloadBundle}
            className={cn(
              bundle && 'border-green-500 text-green-400 hover:bg-green-500/10'
            )}
          >
            {isGeneratingBundle ? (
              <>
                <Activity className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : bundle ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Download Again
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1" />
                Evidence Bundle
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container mx-auto px-4 py-6">
        {/* Drift Alert Banner */}
        <AnimatePresence>
          {state === 'DRIFT_DETECTED' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center gap-3"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
              <div>
                <div className="text-red-400 font-semibold">DRIFT DETECTED</div>
                <div className="text-sm text-red-300">Integrity violation detected - executing enforcement policy</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quarantine Banner */}
        <AnimatePresence>
          {state === 'PHANTOM_QUARANTINE' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center gap-3"
            >
              <Shield className="w-6 h-6 text-amber-400" />
              <div>
                <div className="text-amber-400 font-semibold">PHANTOM MODE ACTIVE</div>
                <div className="text-sm text-amber-300">Process isolated - actuator connections severed</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PortalState state={state} uptime={uptime} />
            <HashComparison measurements={measurements} />
            <DemoControls
              isRunning={isRunning}
              scenario={scenario}
              onStart={handleStart}
              onStop={handleStop}
              onTriggerDrift={handleTriggerDrift}
              onScenarioChange={handleScenarioChange}
            />
          </div>

          {/* Center Column */}
          <div className="lg:col-span-2 space-y-6">
            <MeasurementStream events={events} />
            <ChainVisualization events={events} />
            <NarrativePanel scenario={scenario} state={state} />

            {/* Patent Claims Summary */}
            <PatentClaimsSummary claimsDemo={scenario.patentClaims} />

            {/* What's Real vs Simulated */}
            <DisclosurePanel />

            {/* Bundle Info (when generated) */}
            <AnimatePresence>
              {bundle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 rounded-lg border border-green-500/30 bg-green-500/5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Evidence Bundle Generated</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Bundle ID</span>
                      <div className="font-mono text-foreground truncate">{bundle.manifest.bundleId}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Receipts</span>
                      <div className="font-mono text-foreground">{bundle.manifest.receiptCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Checkpoints</span>
                      <div className="font-mono text-foreground">{bundle.manifest.checkpointCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Anchor</span>
                      <div className="font-mono text-amber-400">{bundle.manifest.anchor}</div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 rounded bg-background/50 border border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">Chain Head Hash</div>
                    <code className="text-[10px] font-mono text-primary break-all">
                      {bundle.manifest.chainHeadHash}
                    </code>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Run <code className="text-primary">node verify.js bundle.json</code> to verify offline.
                    Expected output: <span className="text-amber-400">PASS_WITH_CAVEATS</span> (simulated anchor).
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

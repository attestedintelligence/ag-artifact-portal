'use client';

/**
 * Artifact Creation Page
 * Per AGA Build Guide Phase 2.1
 *
 * Full flow: File upload -> Details -> Runtime settings -> Crypto summary -> Seal
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FileUpload } from '@/components/artifact/FileUpload';
import { ArtifactDetailsForm, type ArtifactDetails } from '@/components/artifact/ArtifactDetailsForm';
import { RuntimeSettings, type RuntimeConfig, type EnforcementAction } from '@/components/artifact/RuntimeSettings';
import { CryptoSummary, type HashValues } from '@/components/artifact/CryptoSummary';
import { AttestationManager, type PendingAttestor, type AttestorRole } from '@/components/artifact/AttestationManager';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FileHashResult } from '@/hooks/useFileHash';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  FileCheck,
  Settings,
  Hash,
  Lock,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type Step = 'upload' | 'details' | 'settings' | 'attestation' | 'summary' | 'seal';

interface StepConfig {
  id: Step;
  title: string;
  description: string;
  icon: React.ElementType;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS: StepConfig[] = [
  {
    id: 'upload',
    title: 'Upload',
    description: 'Select file',
    icon: FileCheck,
  },
  {
    id: 'details',
    title: 'Details',
    description: 'Name & describe',
    icon: Settings,
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Runtime config',
    icon: Shield,
  },
  {
    id: 'attestation',
    title: 'Attestors',
    description: 'Optional',
    icon: Users,
  },
  {
    id: 'summary',
    title: 'Review',
    description: 'Verify hashes',
    icon: Hash,
  },
  {
    id: 'seal',
    title: 'Seal',
    description: 'Create artifact',
    icon: Lock,
  },
];

const DEFAULT_DETAILS: ArtifactDetails = {
  name: '',
  description: '',
};

const DEFAULT_RUNTIME: RuntimeConfig = {
  measurementCadenceMs: 60000, // 1 minute
  ttlSeconds: 2592000, // 30 days
  enforcementAction: 'ALERT',
};

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: StepConfig[];
  currentStep: Step;
  onStepClick: (step: Step) => void;
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;
        const isClickable = index <= currentIndex;
        const Icon = step.icon;

        return (
          <div
            key={step.id}
            className="flex items-center"
          >
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center transition-all',
                isClickable && 'cursor-pointer',
                !isClickable && 'cursor-not-allowed opacity-50',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all',
                  isActive && 'bg-primary text-primary-foreground glow-cyan',
                  isCompleted && 'bg-emerald-500 text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isActive && 'text-primary',
                  isCompleted && 'text-emerald-400',
                  !isActive && !isCompleted && 'text-muted-foreground',
                )}
              >
                {step.title}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 sm:w-16 h-0.5 mx-2',
                  index < currentIndex ? 'bg-emerald-500' : 'bg-muted',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CreatePage() {
  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('upload');

  // Form state
  const [fileHash, setFileHash] = useState<FileHashResult | null>(null);
  const [includePayload, setIncludePayload] = useState(false);
  const [details, setDetails] = useState<ArtifactDetails>(DEFAULT_DETAILS);
  const [runtime, setRuntime] = useState<RuntimeConfig>(DEFAULT_RUNTIME);
  const [attestors, setAttestors] = useState<PendingAttestor[]>([]);

  // Computed hashes
  const [metadataHash, setMetadataHash] = useState<string | null>(null);
  const [sealedHash, setSealedHash] = useState<string | null>(null);

  // Submission state
  const [isSealing, setIsSealing] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);
  const [sealSuccess, setSealSuccess] = useState(false);

  // Compute metadata hash when details change
  const computeMetadataHash = useCallback(async () => {
    if (!fileHash || !details.name) {
      setMetadataHash(null);
      setSealedHash(null);
      return;
    }

    // Create sorted metadata object for canonical hashing
    const metadata: Record<string, string | number> = {
      description: details.description,
      file_name: fileHash.metadata.name,
      file_size: fileHash.metadata.size,
      file_type: fileHash.metadata.type,
      name: details.name,
    };

    // JSON.stringify with sorted keys
    const canonical = JSON.stringify(metadata, Object.keys(metadata).sort());
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonical));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    setMetadataHash(hashHex);

    // Compute sealed hash
    const sealInput = `ai.bundle.v1:${fileHash.bytes_hash}${hashHex}`;
    const sealBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(sealInput));
    const sealArray = Array.from(new Uint8Array(sealBuffer));
    const sealHex = sealArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    setSealedHash(sealHex);
  }, [fileHash, details]);

  // Trigger hash computation when moving to summary
  const handleStepChange = useCallback(
    async (step: Step) => {
      if (step === 'summary') {
        await computeMetadataHash();
      }
      setCurrentStep(step);
    },
    [computeMetadataHash]
  );

  // Hash values for CryptoSummary
  const hashes: HashValues = useMemo(
    () => ({
      bytesHash: fileHash?.bytes_hash ?? null,
      metadataHash,
      sealedHash,
    }),
    [fileHash, metadataHash, sealedHash]
  );

  // Navigation helpers
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 'upload':
        return !!fileHash;
      case 'details':
        return details.name.trim().length > 0;
      case 'settings':
        return true;
      case 'attestation':
        return true; // Attestation is optional
      case 'summary':
        return !!sealedHash;
      default:
        return false;
    }
  }, [currentStep, fileHash, details, sealedHash]);

  const goNext = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      handleStepChange(STEPS[currentIndex + 1].id);
    }
  }, [currentStep, handleStepChange]);

  const goPrev = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  }, [currentStep]);

  // Handle file hash complete
  const handleHashComplete = useCallback((result: FileHashResult) => {
    setFileHash(result);
  }, []);

  // Handle file remove
  const handleFileRemove = useCallback(() => {
    setFileHash(null);
    setMetadataHash(null);
    setSealedHash(null);
  }, []);

  // Handle seal
  const handleSeal = useCallback(async () => {
    if (!fileHash || !sealedHash) return;

    setIsSealing(true);
    setSealError(null);

    try {
      // TODO: Call API to create policy artifact
      // For now, simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSealSuccess(true);
    } catch (err) {
      setSealError(err instanceof Error ? err.message : 'Failed to create seal');
    } finally {
      setIsSealing(false);
    }
  }, [fileHash, sealedHash]);

  // Attestation handlers
  const handleAddAttestor = useCallback(async (email: string, role: AttestorRole) => {
    // TODO: Call API to create invite
    const newAttestor: PendingAttestor = {
      id: `att_${Date.now()}`,
      email,
      role,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
    setAttestors((prev) => [...prev, newAttestor]);
  }, []);

  const handleRemoveAttestor = useCallback((id: string) => {
    setAttestors((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleResendInvite = useCallback(async (id: string) => {
    // TODO: Call API to resend invite
    // Update expiration
    setAttestors((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : a
      )
    );
  }, []);

  // Validation errors for details
  const detailsErrors = useMemo(() => {
    const errors: { name?: string } = {};
    if (currentStep === 'details' && !details.name.trim()) {
      errors.name = 'Name is required';
    }
    return errors;
  }, [currentStep, details]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Create Artifact</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step Indicator */}
        <StepIndicator
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={handleStepChange}
        />

        {/* Step Content */}
        <div className="glass-card p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* Upload Step */}
            {currentStep === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold mb-2">Select File</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Choose the file you want to seal. The hash will be computed locally.
                </p>
                <FileUpload
                  onHashComplete={handleHashComplete}
                  onFileRemove={handleFileRemove}
                  includePayload={includePayload}
                  onIncludePayloadChange={setIncludePayload}
                />
              </motion.div>
            )}

            {/* Details Step */}
            {currentStep === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold mb-2">Artifact Details</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Provide a name and optional description for this artifact.
                </p>
                <ArtifactDetailsForm
                  value={details}
                  onChange={setDetails}
                  errors={detailsErrors}
                />
              </motion.div>
            )}

            {/* Settings Step */}
            {currentStep === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold mb-2">Runtime Settings</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure monitoring cadence, expiration, and enforcement behavior.
                </p>
                <RuntimeSettings value={runtime} onChange={setRuntime} />
              </motion.div>
            )}

            {/* Attestation Step */}
            {currentStep === 'attestation' && (
              <motion.div
                key="attestation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold mb-2">Third-Party Attestation</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Optionally invite others to witness and attest to this artifact.
                </p>
                <AttestationManager
                  attestors={attestors}
                  onAddAttestor={handleAddAttestor}
                  onRemoveAttestor={handleRemoveAttestor}
                  onResendInvite={handleResendInvite}
                />
              </motion.div>
            )}

            {/* Summary Step */}
            {currentStep === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold mb-2">Review</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Verify the cryptographic hashes before sealing.
                </p>
                <CryptoSummary hashes={hashes} />

                {/* Settings Summary */}
                <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                  <h3 className="text-sm font-medium mb-3">Configuration Summary</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="truncate">{details.name}</dd>
                    <dt className="text-muted-foreground">Measurement Cadence</dt>
                    <dd>
                      {runtime.measurementCadenceMs >= 60000
                        ? `${runtime.measurementCadenceMs / 60000} min`
                        : `${runtime.measurementCadenceMs / 1000} sec`}
                    </dd>
                    <dt className="text-muted-foreground">TTL</dt>
                    <dd>
                      {runtime.ttlSeconds
                        ? runtime.ttlSeconds >= 86400
                          ? `${Math.round(runtime.ttlSeconds / 86400)} days`
                          : `${Math.round(runtime.ttlSeconds / 3600)} hours`
                        : 'No expiration'}
                    </dd>
                    <dt className="text-muted-foreground">On Drift</dt>
                    <dd className={cn(
                      runtime.enforcementAction === 'KILL' && 'text-red-400',
                      runtime.enforcementAction === 'ALERT' && 'text-amber-400',
                      runtime.enforcementAction === 'BLOCK_START' && 'text-primary',
                    )}>
                      {runtime.enforcementAction}
                    </dd>
                    <dt className="text-muted-foreground">Include Payload</dt>
                    <dd>{includePayload ? 'Yes' : 'No'}</dd>
                  </dl>
                </div>
              </motion.div>
            )}

            {/* Seal Step */}
            {currentStep === 'seal' && (
              <motion.div
                key="seal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center py-8"
              >
                {!sealSuccess ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Ready to Seal</h2>
                    <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                      Your artifact will be cryptographically sealed with Ed25519 signature.
                      This creates a tamper-evident proof of the file's state.
                    </p>

                    {sealError && (
                      <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                        {sealError}
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="glow-cyan"
                      onClick={handleSeal}
                      disabled={isSealing}
                    >
                      {isSealing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sealing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Seal Artifact
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                    <h2 className="text-xl font-semibold mb-2 text-emerald-400">
                      Artifact Sealed
                    </h2>
                    <p className="text-sm text-muted-foreground mb-8">
                      Your artifact has been cryptographically sealed and is ready for use.
                    </p>

                    <div className="p-4 rounded-lg bg-muted/50 border border-border mb-6 inline-block">
                      <p className="text-xs text-muted-foreground mb-1">Sealed Hash</p>
                      <code className="text-sm font-mono text-primary">{sealedHash}</code>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" asChild>
                        <Link href="/">View Dashboard</Link>
                      </Button>
                      <Button
                        onClick={() => {
                          // Reset form
                          setCurrentStep('upload');
                          setFileHash(null);
                          setDetails(DEFAULT_DETAILS);
                          setRuntime(DEFAULT_RUNTIME);
                          setIncludePayload(false);
                          setMetadataHash(null);
                          setSealedHash(null);
                          setSealSuccess(false);
                        }}
                      >
                        Create Another
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {currentStep !== 'seal' && (
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={currentStep === 'upload'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={goNext} disabled={!canGoNext}>
              {currentStep === 'summary' ? 'Proceed to Seal' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

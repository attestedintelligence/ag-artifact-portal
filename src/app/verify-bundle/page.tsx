'use client';

/**
 * Online Evidence Bundle Verifier
 *
 * Upload and verify evidence bundles directly in the browser.
 * Demonstrates offline verification capability.
 */

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileJson,
  Loader2,
  RefreshCw,
  Download,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  verifyBundle,
  parseBundleJSON,
  type VerificationResult,
  type VerificationStep,
  type VerificationVerdict,
} from '@/lib/bundles';

// ============================================================================
// VERDICT STYLES
// ============================================================================

const VERDICT_STYLES: Record<VerificationVerdict, { bg: string; border: string; text: string; icon: typeof CheckCircle2 }> = {
  'PASS': {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    text: 'text-green-400',
    icon: CheckCircle2,
  },
  'PASS_WITH_CAVEATS': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    icon: AlertTriangle,
  },
  'FAIL': {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    text: 'text-red-400',
    icon: XCircle,
  },
};

const STEP_ICONS = {
  PENDING: <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />,
  CHECKING: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
  VALID: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  INVALID: <XCircle className="w-4 h-4 text-red-400" />,
  SKIPPED: <div className="w-4 h-4 rounded-full bg-muted-foreground/30" />,
};

// ============================================================================
// VERIFICATION STEP COMPONENT
// ============================================================================

function VerificationStepRow({ step, index }: { step: VerificationStep; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        step.status === 'VALID' && 'bg-green-500/5 border-green-500/20',
        step.status === 'INVALID' && 'bg-red-500/5 border-red-500/20',
        step.status === 'SKIPPED' && 'bg-muted/50 border-border',
        step.status === 'CHECKING' && 'bg-primary/5 border-primary/20',
        step.status === 'PENDING' && 'bg-card border-border',
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
          <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
        </div>
        <div>
          <div className="font-medium text-sm">{step.name}</div>
          <div className="text-xs text-muted-foreground">{step.description}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {step.details && (
          <span className="text-xs text-muted-foreground max-w-[200px] truncate">
            {step.details}
          </span>
        )}
        {STEP_ICONS[step.status]}
      </div>
    </motion.div>
  );
}

// ============================================================================
// VERDICT DISPLAY COMPONENT
// ============================================================================

function VerdictDisplay({ result }: { result: VerificationResult }) {
  const style = VERDICT_STYLES[result.verdict];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('p-6 rounded-lg border-2', style.bg, style.border)}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', style.bg)}>
          <Icon className={cn('w-8 h-8', style.text)} />
        </div>
        <div>
          <div className={cn('text-3xl font-bold', style.text)}>
            {result.verdict.replace(/_/g, ' ')}
          </div>
          <div className="text-sm text-muted-foreground">
            Bundle ID: {result.bundleId}
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 rounded bg-background/50 border border-border">
          <div className="text-xs text-muted-foreground">Policy</div>
          <div className={cn('font-mono', result.summary.policyValid ? 'text-green-400' : 'text-red-400')}>
            {result.summary.policyValid ? 'VALID' : 'INVALID'}
          </div>
        </div>
        <div className="p-3 rounded bg-background/50 border border-border">
          <div className="text-xs text-muted-foreground">Receipts</div>
          <div className={cn('font-mono', result.summary.receiptsValid ? 'text-green-400' : 'text-red-400')}>
            {result.summary.receiptsChecked}/{result.summary.receiptsTotal}
          </div>
        </div>
        <div className="p-3 rounded bg-background/50 border border-border">
          <div className="text-xs text-muted-foreground">Chain</div>
          <div className={cn('font-mono', result.summary.chainValid ? 'text-green-400' : 'text-red-400')}>
            {result.summary.chainValid ? 'VALID' : 'BROKEN'}
          </div>
        </div>
        <div className="p-3 rounded bg-background/50 border border-border">
          <div className="text-xs text-muted-foreground">Anchor</div>
          <div className="font-mono text-amber-400">
            {result.summary.anchorNetwork}
          </div>
        </div>
      </div>

      {/* Caveats */}
      {result.caveats.length > 0 && (
        <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Caveats</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {result.caveats.map((caveat, i) => (
              <li key={i}>{caveat}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Errors ({result.errors.length})</span>
          </div>
          <ul className="text-xs text-red-300 space-y-1 max-h-32 overflow-y-auto">
            {result.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function VerifyBundlePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [steps, setSteps] = useState<VerificationStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setSteps([]);
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.json')) {
      setFile(droppedFile);
      setResult(null);
      setSteps([]);
      setError(null);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!file) return;

    setIsVerifying(true);
    setError(null);
    setResult(null);

    // Initialize steps
    const initialSteps: VerificationStep[] = [
      { id: 'policy', name: 'Policy Signature', description: 'Verifying policy artifact signature', status: 'PENDING' },
      { id: 'receipts', name: 'Receipt Signatures', description: 'Verifying all receipt signatures', status: 'PENDING' },
      { id: 'chain', name: 'Chain Integrity', description: 'Verifying hash chain continuity', status: 'PENDING' },
      { id: 'merkle', name: 'Merkle Proofs', description: 'Verifying checkpoint Merkle proofs', status: 'PENDING' },
      { id: 'anchor', name: 'Checkpoint Anchor', description: 'Verifying anchor to immutable store', status: 'PENDING' },
    ];
    setSteps(initialSteps);

    try {
      // Read file
      const text = await file.text();
      const bundle = parseBundleJSON(text);

      if (!bundle) {
        setError('Invalid bundle format. Please upload a valid evidence bundle JSON file.');
        setIsVerifying(false);
        return;
      }

      // Animate through steps
      for (let i = 0; i < initialSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'CHECKING' } : s
        ));
      }

      // Run verification
      const verificationResult = await verifyBundle(bundle);

      // Update steps with results
      setSteps(verificationResult.steps);
      setResult(verificationResult);

    } catch (err) {
      setError(`Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setSteps([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Bundle Verifier</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-primary/20 text-primary border border-primary/30">
              ONLINE
            </span>
          </div>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              This verifier runs entirely in your browser using the Web Crypto API.
              Your bundle never leaves your device.
            </p>
            <p>
              Upload an evidence bundle JSON to verify policy signatures, receipt chains,
              Merkle proofs, and checkpoint anchors.
            </p>
          </div>
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Evidence Bundle</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop a bundle JSON file, or click to browse
            </p>
            <Button variant="outline">
              <FileJson className="w-4 h-4 mr-2" />
              Select Bundle File
            </Button>
          </div>
        )}

        {/* File Selected */}
        {file && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* File Info */}
            <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileJson className="w-8 h-8 text-primary" />
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Change File
                </Button>
                <Button onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Bundle
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Steps */}
            {steps.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Verification Progress</h3>
                {steps.map((step, index) => (
                  <VerificationStepRow key={step.id} step={step} index={index} />
                ))}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-300">{error}</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Verification Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Verdict */}
            <VerdictDisplay result={result} />

            {/* Steps Detail */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Verification Steps</h3>
              {result.steps.map((step, index) => (
                <VerificationStepRow key={step.id} step={step} index={index} />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Verify Another Bundle
              </Button>
              <Link href="/dashboard">
                <Button>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Offline Verifier Info */}
        <div className="mt-12 p-6 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Offline Verification</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Evidence bundles include a standalone Node.js verifier script that works completely offline.
            Download a bundle ZIP from the dashboard to get the offline verifier.
          </p>
          <div className="p-3 rounded bg-muted/50 font-mono text-sm">
            <div className="text-muted-foreground"># Extract bundle ZIP and run:</div>
            <div className="text-primary">node verify.js bundle.json</div>
          </div>
        </div>
      </main>
    </div>
  );
}

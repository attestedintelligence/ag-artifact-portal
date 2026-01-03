'use client';

/**
 * Arweave Anchoring UI Component
 *
 * Displays the blockchain anchoring process with professional visualization.
 * Shows Merkle root computation, transaction preparation, and confirmation.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  GitBranch,
  FileDigit,
  Send,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Shield,
  Lock,
  Clock,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type AnchorStatus = 'idle' | 'computing' | 'preparing' | 'signing' | 'submitting' | 'confirming' | 'confirmed' | 'error';

export interface AnchorTransaction {
  merkleRoot: string;
  batchSize: number;
  timestamp: string;
  transactionId: string;
  blockHeight: number;
  confirmations: number;
}

interface ArweaveAnchorProps {
  merkleRoot: string | null;
  receiptCount: number;
  onAnchor?: () => Promise<void>;
  isSimulated?: boolean;
}

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const ANCHOR_STEPS = [
  { id: 'compute', label: 'Compute Merkle Root', icon: GitBranch },
  { id: 'prepare', label: 'Prepare Transaction', icon: FileDigit },
  { id: 'sign', label: 'Sign Payload', icon: Lock },
  { id: 'submit', label: 'Submit to Blockweave', icon: Send },
  { id: 'confirm', label: 'Await Confirmation', icon: Clock },
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateMockTransactionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 43; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function truncateHash(hash: string, length: number = 8): string {
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ArweaveAnchor({
  merkleRoot,
  receiptCount,
  onAnchor,
  isSimulated = true,
}: ArweaveAnchorProps) {
  const [status, setStatus] = useState<AnchorStatus>('idle');
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [transaction, setTransaction] = useState<AnchorTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simulate the anchoring process
  const handleAnchor = useCallback(async () => {
    if (!merkleRoot || receiptCount === 0) return;

    setStatus('computing');
    setCurrentStep(0);
    setError(null);

    try {
      // Step 1: Compute Merkle Root (already done)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Prepare Transaction
      setStatus('preparing');
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 3: Sign Payload
      setStatus('signing');
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 4: Submit to Blockweave
      setStatus('submitting');
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 5: Await Confirmation
      setStatus('confirming');
      setCurrentStep(4);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Complete
      const txId = generateMockTransactionId();
      setTransaction({
        merkleRoot,
        batchSize: receiptCount,
        timestamp: new Date().toISOString(),
        transactionId: txId,
        blockHeight: Math.floor(Math.random() * 100000) + 1400000,
        confirmations: 1,
      });
      setStatus('confirmed');
      setCurrentStep(5);

      if (onAnchor) {
        await onAnchor();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anchor failed');
      setStatus('error');
    }
  }, [merkleRoot, receiptCount, onAnchor]);

  // Simulate increasing confirmations
  useEffect(() => {
    if (status === 'confirmed' && transaction) {
      const interval = setInterval(() => {
        setTransaction(prev => prev ? {
          ...prev,
          confirmations: Math.min(prev.confirmations + 1, 25),
        } : null);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status, transaction]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Arweave Blockweave Anchor</h3>
              <p className="text-xs text-muted-foreground">
                Permanent, immutable evidence preservation
              </p>
            </div>
          </div>
          {isSimulated && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              SIMULATED
            </span>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {ANCHOR_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isComplete = currentStep > index;
            const isPending = currentStep < index;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                      isComplete && 'bg-green-500 border-green-500',
                      isActive && 'bg-primary border-primary',
                      isPending && 'bg-muted border-border',
                    )}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Icon className={cn('w-4 h-4', isPending ? 'text-muted-foreground' : 'text-white')} />
                    )}
                  </motion.div>
                  <span className={cn(
                    'text-[10px] mt-1 text-center max-w-[60px]',
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < ANCHOR_STEPS.length - 1 && (
                  <div className={cn(
                    'w-8 h-0.5 mx-1 transition-colors',
                    isComplete ? 'bg-green-500' : 'bg-border'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Ready to Anchor Evidence</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {receiptCount} receipts ready for immutable storage
              </p>
              <Button
                onClick={handleAnchor}
                disabled={!merkleRoot || receiptCount === 0}
                className="gap-2"
              >
                <Database className="w-4 h-4" />
                Anchor to Arweave
              </Button>
            </motion.div>
          )}

          {(status === 'computing' || status === 'preparing' || status === 'signing' || status === 'submitting' || status === 'confirming') && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="font-medium">
                  {status === 'computing' && 'Computing Merkle root...'}
                  {status === 'preparing' && 'Preparing transaction...'}
                  {status === 'signing' && 'Signing payload...'}
                  {status === 'submitting' && 'Submitting to Arweave...'}
                  {status === 'confirming' && 'Awaiting confirmation...'}
                </span>
              </div>
              {merkleRoot && (
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Hash className="w-3 h-3" />
                    <span>Merkle Root</span>
                  </div>
                  <code className="text-xs font-mono text-primary break-all">
                    {merkleRoot}
                  </code>
                </div>
              )}
            </motion.div>
          )}

          {status === 'confirmed' && transaction && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Success Banner */}
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
                <div>
                  <div className="font-medium text-green-400">Evidence Anchored Successfully</div>
                  <div className="text-xs text-green-300/70">
                    Permanent, immutable record on Arweave Blockweave
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Transaction ID</div>
                  <code className="text-xs font-mono text-primary break-all">
                    {truncateHash(transaction.transactionId, 12)}
                  </code>
                </div>
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Block Height</div>
                  <div className="text-sm font-mono text-foreground">
                    {transaction.blockHeight.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Confirmations</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-foreground">{transaction.confirmations}</span>
                    {transaction.confirmations < 25 && (
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    )}
                    {transaction.confirmations >= 25 && (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    )}
                  </div>
                </div>
                <div className="p-3 rounded bg-muted/50 border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Receipts Anchored</div>
                  <div className="text-sm font-mono text-foreground">{transaction.batchSize}</div>
                </div>
              </div>

              {/* Merkle Root */}
              <div className="p-3 rounded bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  <GitBranch className="w-3 h-3" />
                  <span>Merkle Root</span>
                </div>
                <code className="text-[10px] font-mono text-primary break-all">
                  {transaction.merkleRoot}
                </code>
              </div>

              {/* View on Explorer */}
              <a
                href={`https://viewblock.io/arweave/tx/${transaction.transactionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-primary text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on Arweave Explorer
              </a>

              {/* Simulated Notice */}
              {isSimulated && (
                <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <strong>Demo Mode:</strong> This transaction is simulated. In production,
                  the Merkle root would be permanently anchored to the Arweave permaweb,
                  creating an immutable, legally-defensible audit trail.
                </div>
              )}
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <div className="text-red-400 mb-4">{error}</div>
              <Button onClick={handleAnchor} variant="outline">
                Retry Anchor
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ArweaveAnchor;

'use client';

/**
 * CryptoSummary Component
 * Per AGA Build Guide Phase 2.1
 *
 * Real-time display of computed hashes with expand/copy functionality.
 * Shows bytes_hash, metadata_hash, and sealed_hash.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Hash,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  FileDigit,
  Database,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES
// ============================================================================

export interface HashValues {
  bytesHash: string | null;
  metadataHash: string | null;
  sealedHash: string | null;
}

interface CryptoSummaryProps {
  hashes: HashValues;
  isComputing?: boolean;
  className?: string;
}

interface HashRowProps {
  label: string;
  hash: string | null;
  icon: React.ElementType;
  description: string;
  isComputing?: boolean;
}

// ============================================================================
// HASH ROW COMPONENT
// ============================================================================

function HashRow({ label, hash, icon: Icon, description, isComputing }: HashRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [hash]);

  const truncatedHash = hash
    ? `${hash.slice(0, 12)}...${hash.slice(-12)}`
    : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer transition-colors',
          'hover:bg-muted/50',
          hash && 'bg-primary/5',
        )}
        onClick={() => hash && setIsExpanded(!isExpanded)}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            hash ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {isComputing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{label}</span>
            {hash && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Computed
              </span>
            )}
          </div>
          {hash ? (
            <code className="text-xs text-muted-foreground font-mono">
              {truncatedHash}
            </code>
          ) : (
            <span className="text-xs text-muted-foreground">
              {isComputing ? 'Computing...' : 'Pending'}
            </span>
          )}
        </div>

        {hash && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && hash && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground mb-2">{description}</p>
              <div className="bg-background rounded p-2 overflow-x-auto">
                <code className="text-xs font-mono text-primary break-all">
                  {hash}
                </code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CryptoSummary({
  hashes,
  isComputing = false,
  className,
}: CryptoSummaryProps) {
  const { bytesHash, metadataHash, sealedHash } = hashes;

  const completedCount = [bytesHash, metadataHash, sealedHash].filter(Boolean).length;
  const allComplete = completedCount === 3;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Cryptographic Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/3 computed
          </span>
          {allComplete && (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <Shield className="w-3 h-3" />
              Ready to seal
            </div>
          )}
        </div>
      </div>

      {/* Hash Rows */}
      <div className="space-y-2">
        <HashRow
          label="Bytes Hash"
          hash={bytesHash}
          icon={FileDigit}
          description="SHA-256 hash of the raw file bytes. This proves the exact file content."
          isComputing={isComputing && !bytesHash}
        />
        <HashRow
          label="Metadata Hash"
          hash={metadataHash}
          icon={Database}
          description="SHA-256 hash of canonical metadata (name, description, timestamps). Combined with bytes hash for composite identity."
          isComputing={isComputing && !!bytesHash && !metadataHash}
        />
        <HashRow
          label="Sealed Hash"
          hash={sealedHash}
          icon={Lock}
          description="Final sealed hash combining bytes and metadata with domain separator. This is the value that will be signed."
          isComputing={isComputing && !!metadataHash && !sealedHash}
        />
      </div>

      {/* Visual Hash Chain */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30"
        >
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Bytes</span>
            <span className="text-primary">+</span>
            <span className="text-muted-foreground">Metadata</span>
            <span className="text-primary">=</span>
            <span className="font-medium text-primary">Sealed Identity</span>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Your artifact is ready for cryptographic sealing
          </p>
        </motion.div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        All hashes are computed client-side using SHA-256. No file data is sent to any server.
      </p>
    </div>
  );
}

export default CryptoSummary;

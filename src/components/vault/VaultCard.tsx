'use client';

/**
 * VaultCard Component
 * Per AGA Build Guide Phase 2.1 and CLAUDE.md Spec
 *
 * Premium "crystal glass card" seal object display with:
 * - Vault ID
 * - Timestamps
 * - Hash summary
 * - Description
 * - Centered QR code
 * - Actions: SAVE, SHARE, "Seal Forever"
 */

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Download,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Hash,
  Lock,
  FileCheck,
  QrCode,
  Sparkles,
} from 'lucide-react';
// Types inline to avoid cross-package import issues
type ArtifactStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'REVOKED' | 'EXPIRED' | 'TERMINATED';
type EnforcementAction = 'BLOCK_START' | 'KILL' | 'ALERT';

// ============================================================================
// TYPES
// ============================================================================

export interface VaultCardData {
  id: string;
  artifactId: string;
  vaultId: string;
  displayName: string;
  description?: string;
  status: ArtifactStatus;
  createdAt: string;
  expiresAt?: string | null;
  sealedHash: string;
  bytesHash: string;
  metadataHash: string;
  policyHash: string;
  settings: {
    measurementCadenceMs: number;
    enforcementAction: EnforcementAction;
    payloadIncluded: boolean;
  };
  receiptCount?: number;
  attestationCount?: number;
}

interface VaultCardProps {
  data: VaultCardData;
  onVerify?: () => void;
  onDownloadBundle?: () => void;
  onShare?: () => void;
  className?: string;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<ArtifactStatus, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: 'Draft', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  ACTIVE: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  SUPERSEDED: { label: 'Superseded', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  REVOKED: { label: 'Revoked', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  EXPIRED: { label: 'Expired', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  TERMINATED: { label: 'Terminated', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

// ============================================================================
// HASH DISPLAY
// ============================================================================

function HashBadge({ label, hash }: { label: string; hash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [hash]);

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded bg-black/30 cursor-pointer hover:bg-black/40 transition-colors"
      onClick={handleCopy}
      title={`Click to copy: ${hash}`}
    >
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <code className="text-xs font-mono text-primary">{hash.slice(0, 8)}...</code>
      {copied && <Check className="w-3 h-3 text-emerald-400" />}
    </div>
  );
}

// ============================================================================
// QR CODE PLACEHOLDER
// ============================================================================

function QRCodePlaceholder({ sealedHash }: { sealedHash: string }) {
  // TODO: Replace with actual QR code generation (e.g., qrcode.react)
  return (
    <div className="relative w-32 h-32 bg-white rounded-lg p-2 mx-auto">
      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded">
        <QrCode className="w-16 h-16 text-slate-400" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm">
          <Shield className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VaultCard({
  data,
  onVerify,
  onDownloadBundle,
  onShare,
  className,
}: VaultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const statusConfig = STATUS_CONFIG[data.status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveImage = useCallback(async () => {
    // TODO: Implement html-to-image export
    console.log('Save as image');
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl',
        // Glass morphism styling
        'bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90',
        'backdrop-blur-xl',
        'border border-white/10',
        'shadow-2xl shadow-primary/5',
        className
      )}
    >
      {/* Glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{data.displayName}</h3>
              <p className="text-xs text-muted-foreground font-mono">{data.vaultId}</p>
            </div>
          </div>
          <div className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            statusConfig.bgColor,
            statusConfig.color
          )}>
            {statusConfig.label}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}

        {/* QR Code */}
        <div className="py-4">
          <QRCodePlaceholder sealedHash={data.sealedHash} />
          <p className="text-xs text-center text-muted-foreground mt-2">
            Scan to verify
          </p>
        </div>

        {/* Hash Summary */}
        <div className="flex flex-wrap gap-2 justify-center">
          <HashBadge label="sealed" hash={data.sealedHash} />
          <HashBadge label="bytes" hash={data.bytesHash} />
          <HashBadge label="meta" hash={data.metadataHash} />
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Created
            </p>
            <p className="font-medium">{formatDate(data.createdAt)}</p>
          </div>
          {data.expiresAt && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Expires
              </p>
              <p className="font-medium">{formatDate(data.expiresAt)}</p>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-6 text-sm">
          {data.receiptCount !== undefined && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileCheck className="w-4 h-4" />
              <span>{data.receiptCount} receipts</span>
            </div>
          )}
          {data.attestationCount !== undefined && data.attestationCount > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>{data.attestationCount} attestations</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
            onClick={handleSaveImage}
          >
            <Download className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
            onClick={onShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-white/5 border-white/10 hover:bg-white/10"
            onClick={onVerify}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Verify
          </Button>
        </div>

        {/* Seal Forever (Coming Soon) */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-primary/70 hover:text-primary"
          disabled
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Seal Forever on Arweave
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20">Coming Soon</span>
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2">
          <span>Artifact ID: {data.artifactId.slice(0, 16)}...</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Cryptographically Sealed
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default VaultCard;

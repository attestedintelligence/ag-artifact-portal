'use client';

/**
 * Artifact Detail Page
 * Per AGA Build Guide Phase 7.2
 *
 * Shows full artifact details, receipts, and verification controls.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Lock,
  Unlock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Hash,
  Key,
  Calendar,
  Activity,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

type ArtifactStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

interface Receipt {
  id: string;
  receiptId: string;
  sequenceNumber: number;
  eventType: string;
  timestamp: string;
  prevHash: string;
  thisHash: string;
  decision?: {
    action: string;
    reasonCode: string;
    details?: string;
  };
}

interface ArtifactDetail {
  id: string;
  artifactId: string;
  vaultId: string;
  displayName: string;
  description?: string;
  status: ArtifactStatus;
  createdAt: string;
  expiresAt: string | null;
  sealedHash: string;
  bytesHash: string;
  metadataHash: string;
  policyHash: string;
  issuer: {
    publicKey: string;
    keyId: string;
    signature: string;
  };
  settings: {
    measurementCadenceMs: number;
    enforcementAction: string;
    payloadIncluded: boolean;
  };
  receipts: Receipt[];
  chainHead: {
    receiptCount: number;
    headHash: string;
  };
  bundleId?: string;
  arweaveId?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ARTIFACT: ArtifactDetail = {
  id: '1',
  artifactId: 'art_demo_001',
  vaultId: '1234-56789-0123',
  displayName: 'Contract Agreement v2.1',
  description: 'Final version of the service agreement with updated terms and conditions for Q1 2025.',
  status: 'ACTIVE',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  sealedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  bytesHash: '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52',
  metadataHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
  policyHash: 'f5d6e7890123456789abcdef0123456789abcdef0123456789abcdef01234567',
  issuer: {
    publicKey: 'lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg',
    keyId: '36ee3280c62ed537',
    signature: 'uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8WRKB0uJurjCg',
  },
  settings: {
    measurementCadenceMs: 3600000,
    enforcementAction: 'ALERT',
    payloadIncluded: true,
  },
  receipts: [
    {
      id: 'r1',
      receiptId: 'rec_001',
      sequenceNumber: 1,
      eventType: 'POLICY_LOADED',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      thisHash: 'abc123def456789012345678901234567890abcdef1234567890abcdef123456',
    },
    {
      id: 'r2',
      receiptId: 'rec_002',
      sequenceNumber: 2,
      eventType: 'MEASUREMENT_OK',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      prevHash: 'abc123def456789012345678901234567890abcdef1234567890abcdef123456',
      thisHash: 'def456abc789012345678901234567890abcdef1234567890abcdef12345678',
    },
    {
      id: 'r3',
      receiptId: 'rec_003',
      sequenceNumber: 3,
      eventType: 'MEASUREMENT_OK',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      prevHash: 'def456abc789012345678901234567890abcdef1234567890abcdef12345678',
      thisHash: '789abc123def456789012345678901234567890abcdef1234567890abcdef12',
    },
  ],
  chainHead: {
    receiptCount: 3,
    headHash: '789abc123def456789012345678901234567890abcdef1234567890abcdef12',
  },
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-6 px-2 text-xs"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" />
          {label || 'Copy'}
        </>
      )}
    </Button>
  );
}

function HashDisplay({ label, hash, icon: Icon }: { label: string; hash: string; icon: React.ElementType }) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <code className="text-xs font-mono truncate flex-1">{hash}</code>
        <CopyButton value={hash} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ArtifactStatus }) {
  const config = {
    ACTIVE: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
    EXPIRED: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
    REVOKED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  };

  const { color, icon: StatusIcon } = config[status];

  return (
    <Badge className={cn('flex items-center gap-1.5 border', color)}>
      <StatusIcon className="w-3 h-3" />
      {status}
    </Badge>
  );
}

// ============================================================================
// RECEIPT TIMELINE
// ============================================================================

function ReceiptTimeline({ receipts }: { receipts: Receipt[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayReceipts = expanded ? receipts : receipts.slice(-3);

  const getEventConfig = (eventType: string) => {
    const configs: Record<string, { color: string; icon: React.ElementType }> = {
      POLICY_LOADED: { color: 'bg-blue-500', icon: FileText },
      MEASUREMENT_OK: { color: 'bg-emerald-500', icon: CheckCircle },
      DRIFT_DETECTED: { color: 'bg-amber-500', icon: AlertTriangle },
      ENFORCED: { color: 'bg-red-500', icon: Lock },
      BUNDLE_EXPORTED: { color: 'bg-purple-500', icon: Download },
    };
    return configs[eventType] || { color: 'bg-gray-500', icon: Activity };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Receipt Chain</h3>
        {receipts.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show All ({receipts.length})
              </>
            )}
          </Button>
        )}
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        <AnimatePresence mode="popLayout">
          {displayReceipts.map((receipt, index) => {
            const { color, icon: EventIcon } = getEventConfig(receipt.eventType);
            return (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-10 pb-6 last:pb-0"
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-2 w-4 h-4 rounded-full border-2 border-background',
                    color
                  )}
                />

                <div className="p-4 rounded-lg bg-card border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <EventIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{receipt.eventType}</span>
                      <Badge variant="outline" className="text-xs">
                        #{receipt.sequenceNumber}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(receipt.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Receipt ID: </span>
                      <code className="font-mono">{receipt.receiptId}</code>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-muted-foreground" />
                      <code className="font-mono truncate">{receipt.thisHash.slice(0, 16)}...</code>
                    </div>
                  </div>

                  {receipt.decision && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={receipt.decision.action === 'CONTINUE' ? 'outline' : 'destructive'}
                          className="text-xs"
                        >
                          {receipt.decision.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {receipt.decision.reasonCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ArtifactDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const [artifact, setArtifact] = useState<ArtifactDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'PASS' | 'FAIL' | null>(null);

  useEffect(() => {
    // In production, fetch from API
    const loadArtifact = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setArtifact(MOCK_ARTIFACT);
      setIsLoading(false);
    };

    loadArtifact();
  }, [params.id]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setVerificationResult('PASS');
    setIsVerifying(false);
  };

  const handleDownloadBundle = async () => {
    // In production, would generate and download .agb bundle
    console.log('Download bundle:', artifact?.artifactId);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/verify/${artifact?.artifactId}`;
    await navigator.clipboard.writeText(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading artifact...</span>
        </div>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Artifact Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested artifact could not be found.
          </p>
          <Link href="/vault">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vault
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/vault">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{artifact.displayName}</h1>
                <StatusBadge status={artifact.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {artifact.description}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              variant={verificationResult === 'PASS' ? 'outline' : 'default'}
              className={cn(
                verificationResult === 'PASS' && 'border-emerald-500 text-emerald-400'
              )}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : verificationResult === 'PASS' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verified
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleDownloadBundle}>
              <Download className="w-4 h-4 mr-2" />
              Download Bundle
            </Button>

            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            {artifact.arweaveId && (
              <Button variant="outline" asChild>
                <a
                  href={`https://arweave.net/${artifact.arweaveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Arweave
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hash Overview */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Cryptographic Hashes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HashDisplay label="Sealed Hash" hash={artifact.sealedHash} icon={Lock} />
                <HashDisplay label="Bytes Hash" hash={artifact.bytesHash} icon={Hash} />
                <HashDisplay label="Metadata Hash" hash={artifact.metadataHash} icon={FileText} />
                <HashDisplay label="Policy Hash" hash={artifact.policyHash} icon={Shield} />
              </div>
            </section>

            {/* Receipt Timeline */}
            <section>
              <ReceiptTimeline receipts={artifact.receipts} />
            </section>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Artifact Info */}
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Artifact Info
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Artifact ID</dt>
                  <dd className="flex items-center gap-2">
                    <code className="text-sm font-mono">{artifact.artifactId}</code>
                    <CopyButton value={artifact.artifactId} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Vault ID</dt>
                  <dd className="flex items-center gap-2">
                    <code className="text-sm font-mono">{artifact.vaultId}</code>
                    <CopyButton value={artifact.vaultId} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created
                  </dt>
                  <dd className="text-sm">
                    {new Date(artifact.createdAt).toLocaleString()}
                  </dd>
                </div>
                {artifact.expiresAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires
                    </dt>
                    <dd className="text-sm">
                      {new Date(artifact.expiresAt).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Issuer Info */}
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Issuer
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-muted-foreground flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Key ID
                  </dt>
                  <dd className="flex items-center gap-2">
                    <code className="text-sm font-mono">{artifact.issuer.keyId}</code>
                    <CopyButton value={artifact.issuer.keyId} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Public Key</dt>
                  <dd className="flex items-center gap-2">
                    <code className="text-xs font-mono truncate">
                      {artifact.issuer.publicKey.slice(0, 20)}...
                    </code>
                    <CopyButton value={artifact.issuer.publicKey} />
                  </dd>
                </div>
              </dl>
            </div>

            {/* Settings */}
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Settings
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Measurement Cadence</dt>
                  <dd className="text-sm">
                    {artifact.settings.measurementCadenceMs / 1000}s
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Enforcement Action</dt>
                  <dd>
                    <Badge variant="outline">{artifact.settings.enforcementAction}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Payload</dt>
                  <dd className="flex items-center gap-1 text-sm">
                    {artifact.settings.payloadIncluded ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-400" />
                        Included
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        Excluded
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Chain Head */}
            <div className="p-6 rounded-lg bg-card border border-border">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Chain Head
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Receipt Count</dt>
                  <dd className="text-2xl font-bold">{artifact.chainHead.receiptCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Head Hash</dt>
                  <dd className="flex items-center gap-2">
                    <code className="text-xs font-mono truncate">
                      {artifact.chainHead.headHash.slice(0, 20)}...
                    </code>
                    <CopyButton value={artifact.chainHead.headHash} />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

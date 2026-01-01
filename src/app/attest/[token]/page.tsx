'use client';

/**
 * Third-Party Attestation Page
 * Per AGA Build Guide Phase 2.1 Step 4
 *
 * Allows third-party attestors to review and attest to an artifact.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Shield,
  FileCheck,
  Hash,
  Clock,
  User,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Lock,
  Eye,
  FileText,
  Download,
  Copy,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type AttestorRole = 'witness' | 'auditor' | 'approver';

interface AttestationRequest {
  id: string;
  artifactId: string;
  artifactName: string;
  artifactDescription: string;
  bytesHash: string;
  metadataHash: string;
  sealedHash: string;
  issuerName: string;
  issuedAt: string;
  role: AttestorRole;
  expiresAt: string;
  canDownload: boolean;
}

type PageState = 'loading' | 'expired' | 'invalid' | 'review' | 'submitting' | 'success' | 'denied';

// ============================================================================
// ROLE CONFIG
// ============================================================================

const ROLE_CONFIG: Record<AttestorRole, { label: string; description: string; icon: React.ElementType }> = {
  witness: {
    label: 'Witness',
    description: 'You are confirming receipt and review of this document.',
    icon: Eye,
  },
  auditor: {
    label: 'Auditor',
    description: 'You are providing independent verification of the contents.',
    icon: FileCheck,
  },
  approver: {
    label: 'Approver',
    description: 'You are authorizing this document for official use.',
    icon: Shield,
  },
};

// ============================================================================
// HASH DISPLAY COMPONENT
// ============================================================================

function HashDisplay({ label, hash, icon: Icon }: { label: string; hash: string; icon: React.ElementType }) {
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

  const truncated = `${hash.slice(0, 16)}...${hash.slice(-16)}`;

  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-xs text-muted-foreground font-mono flex-1 truncate">
          {truncated}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AttestPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [state, setState] = useState<PageState>('loading');
  const [request, setRequest] = useState<AttestationRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load attestation request
  useEffect(() => {
    const loadRequest = async () => {
      try {
        const response = await fetch(`/api/attest/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setState('invalid');
            return;
          }
          if (response.status === 410) {
            setState('expired');
            return;
          }
          throw new Error('Failed to load attestation request');
        }

        const data = await response.json();
        setRequest(data);
        setState('review');
      } catch (err) {
        console.error('Failed to load attestation:', err);
        setState('invalid');
      }
    };

    if (token) {
      loadRequest();
    }
  }, [token]);

  // Handle attestation decision
  const handleDecision = async (approved: boolean) => {
    if (!request) return;

    setState('submitting');
    setError(null);

    try {
      const response = await fetch(`/api/attest/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit attestation');
      }

      setState(approved ? 'success' : 'denied');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit attestation');
      setState('review');
    }
  };

  // Render loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading attestation request...</p>
        </motion.div>
      </div>
    );
  }

  // Render invalid/expired states
  if (state === 'invalid' || state === 'expired') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className={cn(
            'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center',
            state === 'expired' ? 'bg-amber-500/20' : 'bg-destructive/20',
          )}>
            {state === 'expired' ? (
              <Clock className="w-8 h-8 text-amber-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-destructive" />
            )}
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {state === 'expired' ? 'Link Expired' : 'Invalid Link'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {state === 'expired'
              ? 'This attestation link has expired. Please contact the issuer for a new invitation.'
              : 'This attestation link is invalid or has already been used.'}
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Return Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render success/denied states
  if (state === 'success' || state === 'denied') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className={cn(
            'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center',
            state === 'success' ? 'bg-emerald-500/20' : 'bg-muted',
          )}>
            {state === 'success' ? (
              <Check className="w-8 h-8 text-emerald-400" />
            ) : (
              <X className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {state === 'success' ? 'Attestation Recorded' : 'Attestation Declined'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {state === 'success'
              ? 'Your attestation has been cryptographically signed and recorded. The artifact issuer has been notified.'
              : 'Your decision has been recorded. The artifact issuer has been notified.'}
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Return Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render review state
  if (!request) return null;

  const roleConfig = ROLE_CONFIG[request.role];
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Attestation Request</h1>
          <p className="text-muted-foreground">
            You have been invited to attest to the following artifact
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Role Badge */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Your Role: {roleConfig.label}</p>
              <p className="text-sm text-muted-foreground">{roleConfig.description}</p>
            </div>
          </div>

          {/* Artifact Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Artifact Name
              </Label>
              <p className="font-medium mt-1">{request.artifactName}</p>
            </div>

            {request.artifactDescription && (
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Description
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {request.artifactDescription}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Issuer
                </Label>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {request.issuerName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Issued At
                </Label>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(request.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Cryptographic Summary */}
          <div className="space-y-3">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Cryptographic Identity
            </Label>
            <HashDisplay
              label="Bytes Hash"
              hash={request.bytesHash}
              icon={FileText}
            />
            <HashDisplay
              label="Metadata Hash"
              hash={request.metadataHash}
              icon={Hash}
            />
            <HashDisplay
              label="Sealed Hash"
              hash={request.sealedHash}
              icon={Lock}
            />
          </div>

          {/* Download option if allowed */}
          {request.canDownload && (
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Original document available for review</span>
                </div>
                <Button variant="outline" size="sm">
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or observations about this artifact..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={state === 'submitting'}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDecision(false)}
              disabled={state === 'submitting'}
            >
              <X className="w-4 h-4 mr-2" />
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleDecision(true)}
              disabled={state === 'submitting'}
            >
              {state === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve & Sign
                </>
              )}
            </Button>
          </div>

          {/* Expiration Warning */}
          <p className="text-xs text-center text-muted-foreground">
            This link expires on {new Date(request.expiresAt).toLocaleDateString()}
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Your attestation will be cryptographically signed and permanently recorded.
        </p>
      </motion.div>
    </div>
  );
}

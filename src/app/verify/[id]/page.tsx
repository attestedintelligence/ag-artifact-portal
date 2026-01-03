'use client';

/**
 * Public Verification Page
 * Per AGA Build Guide - Verification Portal
 *
 * Anyone can verify an artifact by visiting /verify/[artifactId]
 * No authentication required.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Hash,
  Key,
  FileCheck,
  ArrowLeft,
  Upload,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// ============================================================================
// TYPES
// ============================================================================

interface VerificationCheck {
  name: string;
  result: 'PASS' | 'FAIL';
  reason?: string;
}

interface VerificationResult {
  valid: boolean;
  verdict: 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL' | 'NOT_FOUND';
  artifactId: string;
  vaultId: string;
  displayName: string;
  description?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  sealedAt: string;
  expiresAt?: string;
  sealedHash: string;
  bytesHash?: string;
  metadataHash?: string;
  issuer: {
    keyId: string;
  };
  checks: VerificationCheck[];
  receiptCount: number;
  verifiedAt: string;
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function VerifyPage() {
  const params = useParams();
  const artifactId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File verification state
  const [verifyingFile, setVerifyingFile] = useState(false);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [fileMatch, setFileMatch] = useState<boolean | null>(null);

  // Fetch verification data
  useEffect(() => {
    async function verify() {
      try {
        const response = await fetch(`/api/verify/${artifactId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Verification failed');
          return;
        }

        setResult(data.data);
      } catch (_err) {
        setError('Failed to verify artifact');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [artifactId]);

  // Handle file verification
  const handleFileVerify = useCallback(async (file: File) => {
    setVerifyingFile(true);
    setFileMatch(null);

    try {
      // Hash file client-side
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setFileHash(hashHex);

      // Verify against sealed hash
      const response = await fetch(`/api/verify/${artifactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bytesHash: hashHex }),
      });

      const data = await response.json();
      setFileMatch(data.data?.valid ?? false);
    } catch (_err) {
      setFileMatch(false);
    } finally {
      setVerifyingFile(false);
    }
  }, [artifactId]);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileVerify(file);
  }, [handleFileVerify]);

  // Get verdict icon
  const VerdictIcon = result?.verdict === 'PASS' ? ShieldCheck :
                      result?.verdict === 'PASS_WITH_CAVEATS' ? ShieldAlert :
                      result?.verdict === 'FAIL' ? ShieldX : Shield;

  const verdictColor = result?.verdict === 'PASS' ? 'text-emerald-400' :
                       result?.verdict === 'PASS_WITH_CAVEATS' ? 'text-amber-400' :
                       result?.verdict === 'FAIL' ? 'text-red-400' : 'text-muted-foreground';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying artifact...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShieldX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Verification Failed</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || 'Artifact not found or could not be verified.'}
          </p>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Verification Portal</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'glass-card p-6 text-center mb-8',
            result.verdict === 'PASS' && 'border-emerald-500/50',
            result.verdict === 'FAIL' && 'border-red-500/50',
            result.verdict === 'PASS_WITH_CAVEATS' && 'border-amber-500/50',
          )}
        >
          <VerdictIcon className={cn('w-16 h-16 mx-auto mb-4', verdictColor)} />
          <h2 className={cn('text-2xl font-bold mb-2', verdictColor)}>
            {result.verdict === 'PASS' ? 'VERIFIED' :
             result.verdict === 'PASS_WITH_CAVEATS' ? 'VERIFIED WITH CAVEATS' :
             'VERIFICATION FAILED'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {result.verdict === 'PASS'
              ? 'This artifact has been cryptographically verified.'
              : result.verdict === 'PASS_WITH_CAVEATS'
              ? 'Verified, but with some conditions to note.'
              : 'This artifact could not be verified.'}
          </p>
        </motion.div>

        {/* QR Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg shrink-0">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? window.location.href : ''}
                size={140}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Artifact Info */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2">{result.displayName}</h3>
              {result.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {result.description}
                </p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Vault:</span>
                  <code className="font-mono text-primary">{result.vaultId}</code>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Artifact:</span>
                  <code className="font-mono text-primary">{result.artifactId}</code>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sealed:</span>
                  <span>{new Date(result.sealedAt).toLocaleString()}</span>
                </div>
                {result.expiresAt && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expires:</span>
                    <span>{new Date(result.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sealed Hash */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-1">Sealed Hash (SHA-256)</p>
              <code className="text-xs font-mono text-foreground break-all">
                {result.sealedHash}
              </code>
            </div>
          </div>
        </motion.div>

        {/* File Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-6"
        >
          <h3 className="text-sm font-semibold mb-4">Verify Original File</h3>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              verifyingFile && 'border-primary',
              fileMatch === true && 'border-emerald-500 bg-emerald-500/10',
              fileMatch === false && 'border-red-500 bg-red-500/10',
              !verifyingFile && fileMatch === null && 'border-border hover:border-primary/50',
            )}
          >
            {verifyingFile ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            ) : fileMatch === true ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            ) : fileMatch === false ? (
              <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            )}

            <p className="text-sm text-muted-foreground mb-2">
              {verifyingFile
                ? 'Verifying...'
                : fileMatch === true
                ? 'File matches sealed artifact!'
                : fileMatch === false
                ? 'File does not match sealed artifact'
                : 'Drop a file here to verify it matches the sealed artifact'}
            </p>

            {fileHash && (
              <code className="text-xs font-mono text-muted-foreground block truncate">
                {fileHash}
              </code>
            )}

            {!verifyingFile && (
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileVerify(file);
                  }}
                />
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </span>
                </Button>
              </label>
            )}
          </div>
        </motion.div>

        {/* Verification Checks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold mb-4">Verification Checks</h3>
          <div className="space-y-2">
            {result.checks.map((check, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {check.result === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm">{check.name.replace(/_/g, ' ')}</span>
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  check.result === 'PASS' ? 'text-emerald-400' : 'text-red-400',
                )}>
                  {check.result}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Receipts in chain</span>
            <span className="font-mono">{result.receiptCount}</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verified at</span>
            <span className="font-mono text-xs">{new Date(result.verifiedAt).toISOString()}</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

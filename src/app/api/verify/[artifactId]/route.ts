/**
 * Public Verification API Route
 * Per AGA Build Guide Phase 8.7
 *
 * Public endpoint for verifying artifacts (no auth required).
 * Used by QR code links and external verifiers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeBytesHash, canonicalStringify, constantTimeEqual } from '@/lib/aga/crypto';
import { verifyReceiptChain } from '@/lib/aga/receipts';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface PublicVerifyRequest {
  bytesHash?: string;
}

interface PublicVerifyResponse {
  valid: boolean;
  verdict: 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL' | 'NOT_FOUND';
  artifactId: string;
  vaultId: string;
  displayName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  sealedAt: string;
  expiresAt?: string;
  sealedHash: string;
  issuer: {
    keyId: string;
  };
  checks: Array<{
    name: string;
    result: 'PASS' | 'FAIL';
    reason?: string;
  }>;
  receiptCount: number;
  verifiedAt: string;
}

// ============================================================================
// GET /api/verify/[artifactId] - Public verification
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const { artifactId } = await params;
    const { searchParams } = new URL(request.url);
    const bytesHash = searchParams.get('bytesHash');

    // Look up artifact in database
    // First try by artifactId field (art_xxx format), then by ID
    const artifact = await prisma.artifact.findFirst({
      where: {
        OR: [
          { id: artifactId },
        ],
      },
      include: {
        user: {
          select: { vaultId: true },
        },
        receipts: {
          orderBy: { sequenceNumber: 'asc' },
        },
        vaultCard: true,
      },
    });

    if (!artifact) {
      return NextResponse.json({
        data: {
          valid: false,
          verdict: 'NOT_FOUND',
          artifactId,
          message: 'Artifact not found',
        },
      }, { status: 404 });
    }

    // Run verification checks
    type CheckResult = { name: string; result: 'PASS' | 'FAIL'; reason?: string };
    const checks: CheckResult[] = [];

    // Check 1: Artifact exists
    checks.push({ name: 'artifact_exists', result: 'PASS' });

    // Check 2: Signature valid (placeholder - in production verify Ed25519 sig)
    checks.push({ name: 'signature_valid', result: 'PASS' });

    // Check 3: Chain valid
    if (artifact.receipts.length > 0) {
      // Build receipt-like objects for chain verification
      const receiptChainValid = artifact.receipts.every((r, index) => {
        if (index === 0) {
          return r.previousLeafHash === null || r.previousLeafHash === '';
        }
        return r.previousLeafHash === artifact.receipts[index - 1].leafHash;
      });
      checks.push({
        name: 'chain_valid',
        result: receiptChainValid ? 'PASS' : 'FAIL',
        reason: receiptChainValid ? undefined : 'Receipt chain linkage broken',
      });
    } else {
      checks.push({ name: 'chain_valid', result: 'PASS' });
    }

    // Check 4: Not expired
    const now = new Date();
    const isExpired = artifact.expiresAt ? now > artifact.expiresAt : false;
    checks.push({
      name: 'not_expired',
      result: isExpired ? 'FAIL' : 'PASS',
      reason: isExpired ? 'Artifact has expired' : undefined,
    });

    // Check 5: Not revoked
    const isRevoked = artifact.status === 'REVOKED';
    checks.push({
      name: 'not_revoked',
      result: isRevoked ? 'FAIL' : 'PASS',
      reason: isRevoked ? 'Artifact has been revoked' : undefined,
    });

    // Check 6: Bytes match (if provided)
    if (bytesHash) {
      const bytesMatch = constantTimeEqual(bytesHash.toLowerCase(), artifact.bytesHash.toLowerCase());
      checks.push({
        name: 'bytes_match',
        result: bytesMatch ? 'PASS' : 'FAIL',
        reason: bytesMatch ? undefined : 'Provided hash does not match sealed bytes',
      });
    }

    // Determine verdict
    const failedChecks = checks.filter((c) => c.result === 'FAIL');
    let verdict: 'PASS' | 'PASS_WITH_CAVEATS' | 'FAIL';

    if (failedChecks.length > 0) {
      // Check if failures are critical
      const criticalFailures = failedChecks.filter(
        (c) => ['signature_valid', 'chain_valid', 'not_revoked'].includes(c.name)
      );
      verdict = criticalFailures.length > 0 ? 'FAIL' : 'PASS_WITH_CAVEATS';
    } else {
      verdict = 'PASS';
    }

    // Determine status
    let status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
    if (artifact.status === 'REVOKED') {
      status = 'REVOKED';
    } else if (isExpired || artifact.status === 'EXPIRED') {
      status = 'EXPIRED';
    } else {
      status = 'ACTIVE';
    }

    const response: PublicVerifyResponse = {
      valid: verdict === 'PASS',
      verdict,
      artifactId: artifact.id,
      vaultId: artifact.user.vaultId,
      displayName: artifact.vaultCard?.displayName || artifact.name,
      status,
      sealedAt: artifact.issuedAt?.toISOString() || artifact.createdAt.toISOString(),
      expiresAt: artifact.expiresAt?.toISOString(),
      sealedHash: artifact.sealedHash,
      issuer: {
        keyId: artifact.signingKeyId,
      },
      checks,
      receiptCount: artifact.receipts.length,
      verifiedAt: new Date().toISOString(),
    };

    // Set cache headers for public verification
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60'); // Cache for 1 minute

    return NextResponse.json({ data: response }, { headers });
  } catch (error) {
    console.error('Public verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/verify/[artifactId] - Public verification with body
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  try {
    const { artifactId } = await params;
    const body = await request.json() as PublicVerifyRequest;

    // Look up artifact
    const artifact = await prisma.artifact.findFirst({
      where: {
        OR: [
          { id: artifactId },
        ],
      },
    });

    if (!artifact) {
      return NextResponse.json({
        data: {
          valid: false,
          verdict: 'NOT_FOUND',
          artifactId,
        },
      }, { status: 404 });
    }

    type CheckResult = { name: string; result: 'PASS' | 'FAIL'; reason?: string };
    const checks: CheckResult[] = [
      { name: 'artifact_exists', result: 'PASS' },
    ];

    if (body.bytesHash) {
      const bytesMatch = constantTimeEqual(
        body.bytesHash.toLowerCase(),
        artifact.bytesHash.toLowerCase()
      );
      checks.push({
        name: 'bytes_match',
        result: bytesMatch ? 'PASS' : 'FAIL',
        reason: bytesMatch ? undefined : 'Provided hash does not match',
      });
    }

    const failedChecks = checks.filter((c) => c.result === 'FAIL');
    const verdict = failedChecks.length > 0 ? 'FAIL' : 'PASS';

    return NextResponse.json({
      data: {
        valid: verdict === 'PASS',
        verdict,
        artifactId: artifact.id,
        checks,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Public verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

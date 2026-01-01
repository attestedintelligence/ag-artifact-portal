/**
 * Public Verification API Route
 * Per AGA Build Guide Phase 8.7
 *
 * Public endpoint for verifying artifacts (no auth required).
 * Used by QR code links and external verifiers.
 */

import { NextRequest, NextResponse } from 'next/server';

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

    // In production, look up artifact in database
    // This is a public endpoint - returns limited info

    // Mock: artifact not found
    if (artifactId === 'not_found') {
      return NextResponse.json({
        data: {
          valid: false,
          verdict: 'NOT_FOUND',
          artifactId,
          message: 'Artifact not found',
        },
      }, { status: 404 });
    }

    // Mock verification checks
    type CheckResult = { name: string; result: 'PASS' | 'FAIL'; reason?: string };
    const checks: CheckResult[] = [
      { name: 'artifact_exists', result: 'PASS' },
      { name: 'signature_valid', result: 'PASS' },
      { name: 'chain_valid', result: 'PASS' },
      { name: 'not_expired', result: 'PASS' },
      { name: 'not_revoked', result: 'PASS' },
    ];

    // If bytes hash provided, verify it matches
    if (bytesHash) {
      const expectedHash = '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52';
      checks.push({
        name: 'bytes_match',
        result: bytesHash === expectedHash ? 'PASS' : 'FAIL',
        reason: bytesHash !== expectedHash ? 'Provided hash does not match sealed bytes' : undefined,
      });
    }

    const failedChecks = checks.filter((c) => c.result === 'FAIL');
    const verdict = failedChecks.length > 0 ? 'FAIL' : 'PASS';

    const response: PublicVerifyResponse = {
      valid: verdict === 'PASS',
      verdict,
      artifactId,
      vaultId: '1234-56789-0123',
      displayName: 'Contract Agreement v2.1',
      status: 'ACTIVE',
      sealedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      sealedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      issuer: {
        keyId: '36ee3280c62ed537',
      },
      checks,
      receiptCount: 12,
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

    // Same verification logic as GET, but accepts body
    type CheckResult = { name: string; result: 'PASS' | 'FAIL'; reason?: string };
    const checks: CheckResult[] = [
      { name: 'artifact_exists', result: 'PASS' },
      { name: 'signature_valid', result: 'PASS' },
      { name: 'chain_valid', result: 'PASS' },
      { name: 'not_expired', result: 'PASS' },
      { name: 'not_revoked', result: 'PASS' },
    ];

    if (body.bytesHash) {
      const expectedHash = '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52';
      checks.push({
        name: 'bytes_match',
        result: body.bytesHash === expectedHash ? 'PASS' : 'FAIL',
        reason: body.bytesHash !== expectedHash ? 'Provided hash does not match' : undefined,
      });
    }

    const failedChecks = checks.filter((c) => c.result === 'FAIL');
    const verdict = failedChecks.length > 0 ? 'FAIL' : 'PASS';

    return NextResponse.json({
      data: {
        valid: verdict === 'PASS',
        verdict,
        artifactId,
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

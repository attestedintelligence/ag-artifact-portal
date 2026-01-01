/**
 * Artifact Bundle API Route
 * Per AGA Build Guide Phase 8.5
 *
 * Handles generation and download of .agb evidence bundles.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface BundleRequest {
  includePayload?: boolean;
  format?: 'agb' | 'json';
}

interface BundleManifest {
  format_version: string;
  bundle_id: string;
  created_at: string;
  artifact_id: string;
  vault_id: string;
  receipt_count: number;
  payload_included: boolean;
  files: Array<{
    path: string;
    sha256: string;
    size_bytes: number;
  }>;
}

// ============================================================================
// HELPERS
// ============================================================================

function getCurrentUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return 'user_demo_001';
}

function generateBundleId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `bnd_${timestamp}${random}`;
}

// ============================================================================
// POST /api/artifact/[id]/bundle - Generate bundle
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json() as BundleRequest;

    // In production:
    // 1. Verify artifact exists and user has access
    // 2. Check if user has premium (bundle export may be gated)
    // 3. Generate complete bundle with all receipts
    // 4. Include offline verifier
    // 5. Return download URL or stream

    const bundleId = generateBundleId();

    const manifest: BundleManifest = {
      format_version: '1.0',
      bundle_id: bundleId,
      created_at: new Date().toISOString(),
      artifact_id: id,
      vault_id: '1234-56789-0123',
      receipt_count: 12,
      payload_included: body.includePayload ?? false,
      files: [
        { path: 'manifest.json', sha256: 'abc123...', size_bytes: 512 },
        { path: 'artifact.json', sha256: 'def456...', size_bytes: 2048 },
        { path: 'ledger.jsonl', sha256: 'ghi789...', size_bytes: 8192 },
        { path: 'keyring.json', sha256: 'jkl012...', size_bytes: 256 },
        { path: 'verifier/verify.js', sha256: 'mno345...', size_bytes: 15360 },
        { path: 'README.txt', sha256: 'pqr678...', size_bytes: 1024 },
      ],
    };

    // Generate download token (valid for limited time)
    const downloadToken = crypto.randomUUID();

    return NextResponse.json({
      data: {
        bundleId,
        manifest,
        downloadUrl: `/api/artifact/${id}/bundle/download?token=${downloadToken}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      },
      message: 'Bundle generated successfully',
    });
  } catch (error) {
    console.error('Bundle generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/artifact/[id]/bundle - Get bundle status
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Return info about available bundles
    return NextResponse.json({
      data: {
        artifactId: id,
        bundlesAvailable: true,
        lastBundleAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        bundleCount: 3,
      },
    });
  } catch (error) {
    console.error('Bundle status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

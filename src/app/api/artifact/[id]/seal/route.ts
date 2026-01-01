/**
 * Artifact Seal API Route
 * Per AGA Build Guide Phase 8.3
 *
 * Handles the sealing (finalization) of artifacts.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface SealRequest {
  bytesHash: string;
  metadataHash: string;
  fileSize?: number;
  mimeType?: string;
  clientTimestamp: string;
}

interface SealResponse {
  artifactId: string;
  sealedHash: string;
  policyHash: string;
  signature: string;
  keyId: string;
  sealedAt: string;
  serverTimestamp: string;
  receipt: {
    receiptId: string;
    eventType: string;
    sequenceNumber: number;
    thisHash: string;
  };
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

function validateHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

// ============================================================================
// POST /api/artifact/[id]/seal - Seal an artifact
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
    const body = await request.json() as SealRequest;

    // Validation
    if (!body.bytesHash || !validateHash(body.bytesHash)) {
      return NextResponse.json(
        { error: 'Invalid bytes hash', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.metadataHash || !validateHash(body.metadataHash)) {
      return NextResponse.json(
        { error: 'Invalid metadata hash', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // In production:
    // 1. Verify artifact exists and belongs to user
    // 2. Verify artifact is in DRAFT status
    // 3. Compute sealed hash
    // 4. Sign with issuer key
    // 5. Create genesis receipt
    // 6. Update artifact status to ACTIVE
    // 7. Store in database

    const serverTimestamp = new Date().toISOString();

    // Compute sealed hash (bytes + metadata combined)
    const sealedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const policyHash = 'f5d6e7890123456789abcdef0123456789abcdef0123456789abcdef01234567';

    // Mock signature (in production, use Ed25519)
    const signature = 'uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8WRKB0uJurjCg';
    const keyId = '36ee3280c62ed537';

    // Generate genesis receipt
    const receiptId = `rec_${Date.now().toString(36)}`;
    const receiptHash = 'abc123def456789012345678901234567890abcdef1234567890abcdef123456';

    const response: SealResponse = {
      artifactId: id,
      sealedHash,
      policyHash,
      signature,
      keyId,
      sealedAt: serverTimestamp,
      serverTimestamp,
      receipt: {
        receiptId,
        eventType: 'POLICY_LOADED',
        sequenceNumber: 1,
        thisHash: receiptHash,
      },
    };

    return NextResponse.json({
      data: response,
      message: 'Artifact sealed successfully',
    });
  } catch (error) {
    console.error('Seal error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

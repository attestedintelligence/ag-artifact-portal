/**
 * Single Artifact API Routes
 * Per AGA Build Guide Phase 8.2
 *
 * Handles individual artifact operations.
 */

import { NextRequest, NextResponse } from 'next/server';

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

// ============================================================================
// GET /api/artifact/[id] - Get artifact details
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

    // In production, query database
    const artifact = {
      id: '1',
      artifactId: id,
      vaultId: '1234-56789-0123',
      displayName: 'Contract Agreement v2.1',
      description: 'Final version of the service agreement.',
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sealedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
      receiptCount: 12,
      attestationCount: 2,
    };

    return NextResponse.json({ data: artifact });
  } catch (error) {
    console.error('Artifact fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/artifact/[id] - Update artifact
// ============================================================================

export async function PATCH(
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
    const body = await request.json();

    // Only allow updates to draft artifacts
    // In production, check artifact status

    const allowedFields = ['displayName', 'description', 'expiresAt', 'settings'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // In production, update database

    return NextResponse.json({
      data: { id, ...updates },
      message: 'Artifact updated successfully',
    });
  } catch (error) {
    console.error('Artifact update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/artifact/[id] - Revoke artifact
// ============================================================================

export async function DELETE(
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

    // In production:
    // 1. Check artifact belongs to user
    // 2. Mark as REVOKED (don't actually delete)
    // 3. Emit revocation receipt

    return NextResponse.json({
      data: { id, status: 'REVOKED' },
      message: 'Artifact revoked successfully',
    });
  } catch (error) {
    console.error('Artifact revocation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

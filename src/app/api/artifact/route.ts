/**
 * Artifact API Routes
 * Per AGA Build Guide Phase 8.2
 *
 * Handles artifact creation, sealing, and management.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

type ArtifactStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

interface Artifact {
  id: string;
  artifactId: string;
  vaultId: string;
  displayName: string;
  description?: string;
  status: ArtifactStatus;
  createdAt: string;
  sealedAt?: string;
  expiresAt?: string;
  sealedHash?: string;
  bytesHash?: string;
  metadataHash?: string;
  policyHash?: string;
  receiptCount: number;
}

interface CreateArtifactRequest {
  vaultId: string;
  displayName: string;
  description?: string;
  expiresAt?: string;
  settings?: {
    measurementCadenceMs?: number;
    enforcementAction?: 'ALERT' | 'KILL' | 'BLOCK_START';
    payloadIncluded?: boolean;
  };
}

interface SealArtifactRequest {
  bytesHash: string;
  metadataHash: string;
  fileSize?: number;
  mimeType?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateArtifactId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `art_${timestamp}${random}`;
}

function getCurrentUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return 'user_demo_001';
}

// ============================================================================
// GET /api/artifact - List artifacts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vaultId = searchParams.get('vaultId');
    const status = searchParams.get('status') as ArtifactStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // In production, query database with filters
    const artifacts: Artifact[] = [
      {
        id: '1',
        artifactId: 'art_demo_001',
        vaultId: vaultId || '1234-56789-0123',
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
        receiptCount: 12,
      },
    ];

    // Filter by status if provided
    const filtered = status
      ? artifacts.filter((a) => a.status === status)
      : artifacts;

    return NextResponse.json({
      data: filtered.slice(offset, offset + limit),
      meta: {
        total: filtered.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Artifact list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/artifact - Create new artifact
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    const body = await request.json() as CreateArtifactRequest;

    // Validation
    if (!body.vaultId) {
      return NextResponse.json(
        { error: 'Vault ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.displayName || body.displayName.length < 1) {
      return NextResponse.json(
        { error: 'Display name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // TODO: Verify vault belongs to user

    const artifactId = generateArtifactId();

    const artifact: Artifact = {
      id: crypto.randomUUID(),
      artifactId,
      vaultId: body.vaultId,
      displayName: body.displayName,
      description: body.description,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
      receiptCount: 0,
    };

    // In production, save to database

    return NextResponse.json({
      data: artifact,
      message: 'Artifact created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Artifact creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

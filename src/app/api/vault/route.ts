/**
 * Vault API Routes
 * Per AGA Build Guide Phase 8.1
 *
 * Handles vault creation, retrieval, and management.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface Vault {
  id: string;
  vaultId: string;
  userId: string;
  displayName: string;
  createdAt: string;
  artifactCount: number;
  sealCount: number;
}

interface CreateVaultRequest {
  displayName: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateVaultId(): string {
  // Format: XXXX-XXXXX-XXXX (13 digits)
  const digits = () => Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const middle = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${digits()}-${middle}-${digits()}`;
}

// Mock auth - in production would use Supabase auth
function getCurrentUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  // In production, verify JWT and extract user ID
  return 'user_demo_001';
}

// ============================================================================
// GET /api/vault - List user's vaults
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

    // In production, query database
    const vaults: Vault[] = [
      {
        id: '1',
        vaultId: '1234-56789-0123',
        userId,
        displayName: 'Primary Vault',
        createdAt: new Date().toISOString(),
        artifactCount: 3,
        sealCount: 15,
      },
    ];

    return NextResponse.json({
      data: vaults,
      meta: {
        total: vaults.length,
      },
    });
  } catch (error) {
    console.error('Vault list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/vault - Create new vault
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

    const body = await request.json() as CreateVaultRequest;

    if (!body.displayName || body.displayName.length < 1) {
      return NextResponse.json(
        { error: 'Display name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Generate vault ID
    const vaultId = generateVaultId();

    // In production, save to database
    const vault: Vault = {
      id: crypto.randomUUID(),
      vaultId,
      userId,
      displayName: body.displayName,
      createdAt: new Date().toISOString(),
      artifactCount: 0,
      sealCount: 0,
    };

    return NextResponse.json({
      data: vault,
      message: 'Vault created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Vault creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

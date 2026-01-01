/**
 * Artifact Receipts API Route
 * Per AGA Build Guide Phase 8.6
 *
 * Handles listing and retrieving receipts for an artifact.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

type EventType =
  | 'POLICY_LOADED'
  | 'MEASUREMENT_OK'
  | 'DRIFT_DETECTED'
  | 'ENFORCED'
  | 'BUNDLE_EXPORTED'
  | 'RUN_STARTED'
  | 'RUN_ENDED'
  | 'CHECKPOINT';

interface Receipt {
  id: string;
  receiptId: string;
  artifactId: string;
  runId: string;
  sequenceNumber: number;
  eventType: EventType;
  timestamp: string;
  chain: {
    prevHash: string;
    thisHash: string;
  };
  decision?: {
    action: 'CONTINUE' | 'ALERT' | 'KILL' | 'BLOCK_START';
    reasonCode: string;
    details?: string;
  };
  measurement?: {
    compositeHash: string;
    mismatchedPaths?: string[];
  };
  signer: {
    keyId: string;
    signature: string;
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

// ============================================================================
// GET /api/artifact/[id]/receipts - List receipts
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
    const { searchParams } = new URL(request.url);

    const eventType = searchParams.get('eventType') as EventType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const order = searchParams.get('order') || 'asc';

    // In production, query database
    const receipts: Receipt[] = [
      {
        id: 'r1',
        receiptId: 'rec_001',
        artifactId: id,
        runId: 'run_001',
        sequenceNumber: 1,
        eventType: 'POLICY_LOADED',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        chain: {
          prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
          thisHash: 'abc123def456789012345678901234567890abcdef1234567890abcdef123456',
        },
        decision: {
          action: 'CONTINUE',
          reasonCode: 'OK',
        },
        signer: {
          keyId: '36ee3280c62ed537',
          signature: 'sig1...',
        },
      },
      {
        id: 'r2',
        receiptId: 'rec_002',
        artifactId: id,
        runId: 'run_001',
        sequenceNumber: 2,
        eventType: 'MEASUREMENT_OK',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        chain: {
          prevHash: 'abc123def456789012345678901234567890abcdef1234567890abcdef123456',
          thisHash: 'def456abc789012345678901234567890abcdef1234567890abcdef12345678',
        },
        measurement: {
          compositeHash: '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52',
        },
        signer: {
          keyId: '36ee3280c62ed537',
          signature: 'sig2...',
        },
      },
      {
        id: 'r3',
        receiptId: 'rec_003',
        artifactId: id,
        runId: 'run_001',
        sequenceNumber: 3,
        eventType: 'MEASUREMENT_OK',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        chain: {
          prevHash: 'def456abc789012345678901234567890abcdef1234567890abcdef12345678',
          thisHash: '789abc123def456789012345678901234567890abcdef1234567890abcdef12',
        },
        measurement: {
          compositeHash: '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52',
        },
        signer: {
          keyId: '36ee3280c62ed537',
          signature: 'sig3...',
        },
      },
    ];

    // Filter by event type if provided
    let filtered = eventType
      ? receipts.filter((r) => r.eventType === eventType)
      : receipts;

    // Sort
    if (order === 'desc') {
      filtered = filtered.sort((a, b) => b.sequenceNumber - a.sequenceNumber);
    }

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    // Compute chain head
    const chainHead = receipts[receipts.length - 1];

    return NextResponse.json({
      data: paginated,
      meta: {
        total: filtered.length,
        limit,
        offset,
        chainHead: chainHead ? {
          receiptCount: receipts.length,
          headSequence: chainHead.sequenceNumber,
          headHash: chainHead.chain.thisHash,
        } : null,
      },
    });
  } catch (error) {
    console.error('Receipts list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

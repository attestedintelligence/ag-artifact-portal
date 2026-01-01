/**
 * Attestation Invite API
 * Per AGA Build Guide Phase 2.2
 *
 * Creates and manages attestation invites for third-party witnesses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface CreateInviteRequest {
  artifact_id: string;
  role: 'witness' | 'auditor' | 'approver';
  email?: string;
  expires_in_hours?: number;
}

interface AttestationInvite {
  id: string;
  artifact_id: string;
  token: string;
  email?: string;
  role: 'witness' | 'auditor' | 'approver';
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  invite_url: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateInviteId(): string {
  return `inv_${randomBytes(12).toString('hex')}`;
}

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

function validateRole(role: unknown): role is 'witness' | 'auditor' | 'approver' {
  return role === 'witness' || role === 'auditor' || role === 'approver';
}

function validateArtifactId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith('art_') && id.length >= 10;
}

// ============================================================================
// POST - Create Invite
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateInviteRequest;

    // Validate required fields
    if (!body.artifact_id) {
      return NextResponse.json(
        { error: 'artifact_id is required' },
        { status: 400 }
      );
    }

    if (!validateArtifactId(body.artifact_id)) {
      return NextResponse.json(
        { error: 'Invalid artifact_id format' },
        { status: 400 }
      );
    }

    if (!body.role || !validateRole(body.role)) {
      return NextResponse.json(
        { error: 'role must be one of: witness, auditor, approver' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Calculate expiration (default 7 days)
    const expiresInHours = body.expires_in_hours ?? 168; // 7 days
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    // Generate invite
    const invite: AttestationInvite = {
      id: generateInviteId(),
      artifact_id: body.artifact_id,
      token: generateToken(),
      email: body.email,
      role: body.role,
      status: 'pending',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      invite_url: '', // Will be set below
    };

    // Generate invite URL
    const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
    invite.invite_url = `${baseUrl}/attest/${invite.id}?token=${invite.token}`;

    // TODO: Store invite in database
    // await prisma.attestationInvite.create({ data: invite });

    // TODO: Send email if provided
    // if (body.email) {
    //   await sendInviteEmail(body.email, invite);
    // }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        artifact_id: invite.artifact_id,
        role: invite.role,
        status: invite.status,
        expires_at: invite.expires_at,
        invite_url: invite.invite_url,
      },
    });
  } catch (error) {
    console.error('Error creating attestation invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Invite Status
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get('id');
  const token = searchParams.get('token');

  if (!inviteId) {
    return NextResponse.json(
      { error: 'Invite ID is required' },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required for verification' },
      { status: 400 }
    );
  }

  try {
    // TODO: Fetch invite from database
    // const invite = await prisma.attestationInvite.findUnique({
    //   where: { id: inviteId },
    // });

    // For now, return a mock response
    return NextResponse.json({
      success: true,
      invite: {
        id: inviteId,
        status: 'pending',
        role: 'witness',
        artifact_id: 'art_example',
        // Don't expose sensitive fields like token
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite' },
      { status: 500 }
    );
  }
}

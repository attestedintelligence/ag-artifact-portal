/**
 * Attestation Accept API
 * Per AGA Build Guide Phase 2.2
 *
 * Accepts an attestation invite and signs the artifact.
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface AcceptAttestationRequest {
  invite_id: string;
  token: string;
  attestor_name?: string;
  attestor_organization?: string;
  notes?: string;
  public_key: string;  // Base64 Ed25519 public key
  signature: string;   // Base64 Ed25519 signature over attestation data
}

interface AttestationResult {
  attestor_id: string;
  role: 'witness' | 'auditor' | 'approver';
  attestor_name?: string;
  attestor_organization?: string;
  signature: string;
  public_key: string;
  timestamp: string;
  artifact_id: string;
  policy_hash: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function isValidBase64(str: string): boolean {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str ||
           Buffer.from(str, 'base64url').toString('base64url') === str;
  } catch {
    return false;
  }
}

// ============================================================================
// POST - Accept Attestation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AcceptAttestationRequest;

    // Validate required fields
    if (!body.invite_id) {
      return NextResponse.json(
        { error: 'invite_id is required' },
        { status: 400 }
      );
    }

    if (!body.token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    if (!body.public_key || !isValidBase64(body.public_key)) {
      return NextResponse.json(
        { error: 'Valid public_key (base64) is required' },
        { status: 400 }
      );
    }

    if (!body.signature || !isValidBase64(body.signature)) {
      return NextResponse.json(
        { error: 'Valid signature (base64) is required' },
        { status: 400 }
      );
    }

    // TODO: Verify invite exists and is valid
    // const invite = await prisma.attestationInvite.findUnique({
    //   where: { id: body.invite_id },
    // });
    //
    // if (!invite) {
    //   return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    // }
    //
    // if (invite.status !== 'pending') {
    //   return NextResponse.json({ error: 'Invite already used or expired' }, { status: 400 });
    // }
    //
    // if (invite.token !== body.token) {
    //   return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    // }
    //
    // if (new Date(invite.expires_at) < new Date()) {
    //   return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    // }

    // TODO: Verify signature
    // The signature should be over: { artifact_id, policy_hash, attestor_id, role, timestamp }
    // const isValid = await verifySignature(attestationData, body.signature, body.public_key);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    // }

    // Generate attestor ID from public key
    // const encoder = new TextEncoder(); // Prepared for future use
    const publicKeyBytes = Buffer.from(body.public_key, 'base64');
    const hashBuffer = await crypto.subtle.digest('SHA-256', publicKeyBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const attestorId = hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');

    // Create attestation result
    const attestation: AttestationResult = {
      attestor_id: `att_${attestorId}`,
      role: 'witness', // TODO: Get from invite
      attestor_name: body.attestor_name,
      attestor_organization: body.attestor_organization,
      signature: body.signature,
      public_key: body.public_key,
      timestamp: new Date().toISOString(),
      artifact_id: 'art_example', // TODO: Get from invite
      policy_hash: '0'.repeat(64), // TODO: Get from artifact
    };

    // TODO: Update invite status
    // await prisma.attestationInvite.update({
    //   where: { id: body.invite_id },
    //   data: {
    //     status: 'accepted',
    //     accepted_at: new Date().toISOString(),
    //   },
    // });

    // TODO: Add attestation to artifact
    // await prisma.attestation.create({
    //   data: attestation,
    // });

    return NextResponse.json({
      success: true,
      attestation: {
        attestor_id: attestation.attestor_id,
        role: attestation.role,
        timestamp: attestation.timestamp,
        artifact_id: attestation.artifact_id,
      },
    });
  } catch (error) {
    console.error('Error accepting attestation:', error);
    return NextResponse.json(
      { error: 'Failed to accept attestation' },
      { status: 500 }
    );
  }
}

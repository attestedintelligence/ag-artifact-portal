/**
 * Third-Party Attestation API Route
 * Per AGA Build Guide Phase 2.1 Step 4
 *
 * GET: Fetch attestation request details
 * POST: Submit attestation decision (approve/deny)
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface AttestationRecord {
  id: string;
  token: string;
  artifactId: string;
  artifactName: string;
  artifactDescription: string;
  bytesHash: string;
  metadataHash: string;
  sealedHash: string;
  issuerName: string;
  issuedAt: string;
  role: 'witness' | 'auditor' | 'approver';
  email: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'denied' | 'expired';
  canDownload: boolean;
  notes?: string;
  decidedAt?: string;
}

// In-memory store for demo purposes
// TODO: Replace with Prisma database in production
const attestationStore = new Map<string, AttestationRecord>();

// ============================================================================
// GET - Fetch attestation request
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Look up attestation request
    const attestation = attestationStore.get(token);

    if (!attestation) {
      // For demo, create a mock attestation if token looks valid
      if (token && token.length > 10) {
        const mockAttestation: AttestationRecord = {
          id: `att_${Date.now()}`,
          token,
          artifactId: `art_${token.slice(0, 16)}`,
          artifactName: 'Sample Governance Artifact',
          artifactDescription: 'This is a demonstration artifact for third-party attestation.',
          bytesHash: '8b7df143d91c716ecfa5fc1730022f6b421b05cedee8fd52b1fc65a96030ad52',
          metadataHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
          sealedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          issuerName: 'Demo User',
          issuedAt: new Date().toISOString(),
          role: 'witness',
          email: 'attestor@example.com',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          canDownload: false,
        };
        attestationStore.set(token, mockAttestation);

        return NextResponse.json({
          id: mockAttestation.id,
          artifactId: mockAttestation.artifactId,
          artifactName: mockAttestation.artifactName,
          artifactDescription: mockAttestation.artifactDescription,
          bytesHash: mockAttestation.bytesHash,
          metadataHash: mockAttestation.metadataHash,
          sealedHash: mockAttestation.sealedHash,
          issuerName: mockAttestation.issuerName,
          issuedAt: mockAttestation.issuedAt,
          role: mockAttestation.role,
          expiresAt: mockAttestation.expiresAt,
          canDownload: mockAttestation.canDownload,
        });
      }

      return NextResponse.json(
        { error: 'Attestation request not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(attestation.expiresAt) < new Date()) {
      attestation.status = 'expired';
      return NextResponse.json(
        { error: 'Attestation request has expired' },
        { status: 410 }
      );
    }

    // Check if already decided
    if (attestation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Attestation has already been submitted' },
        { status: 410 }
      );
    }

    // Return attestation details (without sensitive fields)
    return NextResponse.json({
      id: attestation.id,
      artifactId: attestation.artifactId,
      artifactName: attestation.artifactName,
      artifactDescription: attestation.artifactDescription,
      bytesHash: attestation.bytesHash,
      metadataHash: attestation.metadataHash,
      sealedHash: attestation.sealedHash,
      issuerName: attestation.issuerName,
      issuedAt: attestation.issuedAt,
      role: attestation.role,
      expiresAt: attestation.expiresAt,
      canDownload: attestation.canDownload,
    });
  } catch (error) {
    console.error('Attestation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Submit attestation decision
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const { approved, notes } = body as {
      approved: boolean;
      notes?: string;
    };

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: approved must be a boolean' },
        { status: 400 }
      );
    }

    // Look up attestation request
    const attestation = attestationStore.get(token);

    if (!attestation) {
      return NextResponse.json(
        { error: 'Attestation request not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(attestation.expiresAt) < new Date()) {
      attestation.status = 'expired';
      return NextResponse.json(
        { error: 'Attestation request has expired' },
        { status: 410 }
      );
    }

    // Check if already decided
    if (attestation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Attestation has already been submitted' },
        { status: 410 }
      );
    }

    // Update attestation record
    attestation.status = approved ? 'accepted' : 'denied';
    attestation.notes = notes;
    attestation.decidedAt = new Date().toISOString();

    // TODO: In production:
    // 1. Generate attestation signature with attestor's key
    // 2. Add attestation to artifact's attestations array
    // 3. Notify artifact issuer
    // 4. Store in database

    return NextResponse.json({
      success: true,
      status: attestation.status,
      decidedAt: attestation.decidedAt,
    });
  } catch (error) {
    console.error('Attestation POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Create attestation request (called from invite API)
// ============================================================================

export function createAttestationRequest(data: Omit<AttestationRecord, 'status'>): string {
  const record: AttestationRecord = {
    ...data,
    status: 'pending',
  };
  attestationStore.set(data.token, record);
  return data.token;
}

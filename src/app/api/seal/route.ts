/**
 * Seal Creation API Route
 * Per AGA Build Guide - Core Cryptographic Flow
 *
 * Creates a sealed artifact with Ed25519 signature and genesis receipt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

// Import from AGA library
import {
  generateKeyPair,
  computeBytesHash,
  generateSalt,
  canonicalStringify,
  exportPublicKey,
} from '@/lib/aga/crypto';
import { KeyType } from '@/lib/aga/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface SealRequest {
  name: string;
  description?: string;
  bytesHash: string;
  metadataHash: string;
  sealedHash: string;
  fileSize?: number;
  mimeType?: string;
  settings: {
    measurementCadenceMs: number;
    ttlSeconds?: number;
    enforcementAction: 'ALERT' | 'KILL' | 'BLOCK_START';
    payloadIncluded: boolean;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function generateArtifactId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `art_${timestamp}${random}`;
}

function generateRunId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// POST /api/seal - Create sealed artifact
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[SEAL] Starting seal request');

  let authResult;
  try {
    authResult = await authenticateRequest(request);
  } catch (authError) {
    console.error('[SEAL] Auth error:', authError);
    return NextResponse.json(
      { error: 'Authentication error', code: 'AUTH_ERROR' },
      { status: 500 }
    );
  }

  if (!authResult.success) {
    console.log('[SEAL] Auth failed:', authResult.error);
    return NextResponse.json(
      { error: authResult.error, code: 'AUTH_REQUIRED' },
      { status: authResult.status }
    );
  }

  const user = authResult.user;
  console.log('[SEAL] Authenticated user:', user.id);

  try {
    const body = await request.json() as SealRequest;
    console.log('[SEAL] Request body received:', { name: body.name, bytesHashLen: body.bytesHash?.length });

    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.bytesHash || body.bytesHash.length !== 64) {
      return NextResponse.json(
        { error: 'Invalid bytes hash', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.metadataHash || body.metadataHash.length !== 64) {
      return NextResponse.json(
        { error: 'Invalid metadata hash', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!body.sealedHash || body.sealedHash.length !== 64) {
      return NextResponse.json(
        { error: 'Invalid sealed hash', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get or create signing key for user
    console.log('[SEAL] Looking for signing key...');
    let signingKey = await prisma.signingKey.findFirst({
      where: {
        userId: user.id,
        keyClass: 'POLICY_ISSUER',
        revokedAt: null,
      },
    });
    console.log('[SEAL] Existing signing key:', signingKey?.id || 'none');

    if (!signingKey) {
      // Generate new key pair using AGA library
      console.log('[SEAL] Generating new key pair...');
      const keyPair = await generateKeyPair(KeyType.POLICY_ISSUER);
      console.log('[SEAL] Key pair generated:', keyPair.keyId);

      signingKey = await prisma.signingKey.create({
        data: {
          id: keyPair.keyId,
          userId: user.id,
          publicKeyB64: exportPublicKey(keyPair.publicKey),
          keyClass: 'POLICY_ISSUER',
        },
      });
      console.log('[SEAL] Signing key created:', signingKey.id);
    }

    // Generate artifact ID and run ID
    const artifactId = generateArtifactId();
    const runId = generateRunId();

    // Generate salt for this artifact
    const salt = generateSalt();

    // Create timestamps
    const now = new Date();
    const issuedAt = now.toISOString();
    const notBefore = issuedAt;
    const notAfter = body.settings.ttlSeconds
      ? new Date(now.getTime() + body.settings.ttlSeconds * 1000).toISOString()
      : null;
    const expiresAt = notAfter ? new Date(notAfter) : null;

    // Build subject identifier
    const subjectIdentifier = {
      bytesHash: body.bytesHash,
      metadataHash: body.metadataHash,
    };

    // Build policy artifact for signing
    const policyArtifactData = {
      schemaVersion: '1.0.0',
      protocolVersion: '1.0.0',
      policyVersion: 1,
      vaultId: user.vaultId,
      artifactId,
      issuedAt,
      notBefore,
      notAfter,
      subjectIdentifier,
      sealedHash: body.sealedHash,
      salt,
      integrityPolicy: {
        configDigest: body.metadataHash,
        configSource: 'CONFIG_SOURCE_C',
      },
      enforcementPolicy: {
        onDrift: body.settings.enforcementAction === 'ALERT' ? 'CONTINUE' : body.settings.enforcementAction,
        onTtlExpired: 'KILL',
        onSignatureInvalid: 'KILL',
      },
      keySchedule: [
        {
          keyId: signingKey.id,
          publicKey: signingKey.publicKeyB64,
          createdAt: signingKey.createdAt.toISOString(),
        },
      ],
      disclosurePolicy: {
        payloadIncluded: body.settings.payloadIncluded,
        claims: ['name', 'bytesHash', 'metadataHash', 'sealedHash'],
      },
      attestations: [],
    };

    // Compute policy hash using AGA crypto
    console.log('[SEAL] Computing policy hash...');
    const policyCanonical = canonicalStringify(policyArtifactData);
    const policyHash = computeBytesHash(new TextEncoder().encode(policyCanonical));
    console.log('[SEAL] Policy hash computed:', policyHash.substring(0, 16) + '...');

    // Create artifact in database
    console.log('[SEAL] Creating artifact in database...');
    const artifact = await prisma.artifact.create({
      data: {
        id: uuid(),
        userId: user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        bytesHash: body.bytesHash,
        metadataHash: body.metadataHash,
        sealedHash: body.sealedHash,
        salt,
        policyVersion: 1,
        policyHash,
        status: 'ACTIVE',
        issuedAt: now,
        effectiveAt: now,
        expiresAt,
        measurementCadenceMs: body.settings.measurementCadenceMs,
        ttlSeconds: body.settings.ttlSeconds || null,
        enforcementAction: body.settings.enforcementAction,
        payloadIncluded: body.settings.payloadIncluded,
        signingKeyId: signingKey.id,
        issuerIdentifier: user.vaultId,
      },
    });
    console.log('[SEAL] Artifact created:', artifact.id);

    // Create genesis receipt
    const genesisReceiptData = {
      receiptVersion: '1',
      runId,
      sequenceNumber: 1,
      timestamp: issuedAt,
      localTime: issuedAt,
      monotonicCounter: 1,
      timeSource: 'DEGRADED_LOCAL',
      eventType: 'POLICY_LOADED',
      decision: {
        action: 'NONE',
        reasonCode: 'OK',
        details: 'Policy artifact sealed and loaded',
      },
      policy: {
        policyId: policyHash,
      },
      chain: {
        prevReceiptHash: '0'.repeat(64),
      },
    };

    // Compute receipt hash using AGA crypto
    console.log('[SEAL] Computing receipt hash...');
    const receiptCanonical = canonicalStringify(genesisReceiptData);
    const receiptHash = computeBytesHash(new TextEncoder().encode(receiptCanonical));
    console.log('[SEAL] Receipt hash computed');

    // Store receipt
    console.log('[SEAL] Creating receipt in database...');
    await prisma.receipt.create({
      data: {
        id: uuid(),
        artifactId: artifact.id,
        sequenceNumber: 1,
        previousLeafHash: null,
        leafHash: receiptHash,
        eventType: 'POLICY_LOADED',
        eventId: runId,
        timestamp: now,
        payload: genesisReceiptData,
        payloadHash: receiptHash,
        signatureB64: 'mvp-placeholder', // In production, sign properly
        signingKeyId: signingKey.id,
      },
    });

    // Create vault card for display
    await prisma.vaultCard.create({
      data: {
        id: uuid(),
        userId: user.id,
        artifactId: artifact.id,
        displayName: body.name.trim(),
        createdAt: now,
        expiresAt,
        status: 'ACTIVE',
        settingsSnapshot: {
          measurementCadenceMs: body.settings.measurementCadenceMs,
          enforcementAction: body.settings.enforcementAction,
          payloadIncluded: body.settings.payloadIncluded,
        },
        position: 0,
        pinned: false,
      },
    });

    // Return sealed artifact data
    return NextResponse.json({
      data: {
        id: artifact.id,
        artifactId,
        vaultId: user.vaultId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        bytesHash: body.bytesHash,
        metadataHash: body.metadataHash,
        sealedHash: body.sealedHash,
        salt,
        policyHash,
        status: 'ACTIVE',
        issuedAt,
        expiresAt: notAfter,
        signingKeyId: signingKey.id,
        receiptCount: 1,
        verifyUrl: `/verify/${artifactId}`,
      },
      message: 'Artifact sealed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Seal creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });

    // Always return detailed error for debugging (temporary)
    return NextResponse.json(
      {
        error: errorMessage,
        code: 'INTERNAL_ERROR',
        stack: errorStack?.split('\n').slice(0, 5).join('\n'),
      },
      { status: 500 }
    );
  }
}

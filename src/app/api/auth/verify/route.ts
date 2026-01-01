/**
 * Magic Link Verification API Route
 * Per AGA Build Guide - Auth Flow
 *
 * Verifies magic link token and creates session.
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db';
import { v4 as uuid } from 'uuid';

// ============================================================================
// HELPERS
// ============================================================================

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function createSessionCookie(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  return `session=${token}; Path=/; HttpOnly; SameSite=Strict; ${secure} Expires=${expiresAt.toUTCString()}`;
}

// ============================================================================
// GET /api/auth/verify - Verify magic link and create session
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
    }

    // Find and validate magic link token
    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    if (magicLink.usedAt) {
      return NextResponse.redirect(new URL('/login?error=token_used', request.url));
    }

    if (new Date() > magicLink.expiresAt) {
      return NextResponse.redirect(new URL('/login?error=token_expired', request.url));
    }

    // Mark magic link as used
    await prisma.magicLinkToken.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    // Create session
    const sessionToken = generateToken();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        id: uuid(),
        userId: magicLink.userId,
        token: sessionToken,
        expiresAt: sessionExpiresAt,
      },
    });

    // Redirect to vault with session cookie
    const response = NextResponse.redirect(new URL('/vault', request.url));
    response.headers.set('Set-Cookie', createSessionCookie(sessionToken, sessionExpiresAt));

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}

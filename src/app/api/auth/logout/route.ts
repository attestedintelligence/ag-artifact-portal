/**
 * Logout API Route
 * Per AGA Build Guide - Auth Flow
 *
 * Invalidates session and clears cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// HELPERS
// ============================================================================

function getSessionToken(request: NextRequest): string | null {
  // Check cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [key, ...value] = c.trim().split('=');
        return [key, value.join('=')];
      })
    );
    if (cookies['session']) {
      return cookies['session'];
    }
  }
  return null;
}

// ============================================================================
// POST /api/auth/logout - Logout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const token = getSessionToken(request);

    if (token) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.headers.set(
      'Set-Cookie',
      'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
    );

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

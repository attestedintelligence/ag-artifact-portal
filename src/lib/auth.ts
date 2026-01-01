/**
 * Auth Helper Utility
 * Per AGA Build Guide - Auth Flow
 *
 * Provides authentication helpers for API routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string | null;
  vaultId: string;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
}

export type AuthResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; error: string; status: number };

// ============================================================================
// HELPERS
// ============================================================================

function getSessionToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Then check cookie
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
// AUTHENTICATION
// ============================================================================

/**
 * Authenticate a request and return the user
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = getSessionToken(request);

  if (!token) {
    return { success: false, error: 'Not authenticated', status: 401 };
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return { success: false, error: 'Invalid session', status: 401 };
    }

    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } });
      return { success: false, error: 'Session expired', status: 401 };
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        vaultId: session.user.vaultId,
        tier: session.user.tier as 'FREE' | 'PREMIUM' | 'ENTERPRISE',
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Authentication failed', status: 500 };
  }
}

/**
 * Require authentication middleware wrapper
 */
export async function requireAuth(
  request: NextRequest,
  handler: (user: AuthenticatedUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await authenticateRequest(request);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, code: 'AUTH_REQUIRED' },
      { status: result.status }
    );
  }

  return handler(result.user);
}

/**
 * Convert Prisma User to AuthenticatedUser
 */
export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    vaultId: user.vaultId,
    tier: user.tier as 'FREE' | 'PREMIUM' | 'ENTERPRISE',
  };
}

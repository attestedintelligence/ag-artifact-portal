/**
 * Authentication Middleware
 * Per AGA Build Guide Phase 10.4
 *
 * JWT validation and session management.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  vaultId: string;
  createdAt: string;
  tier: 'free' | 'premium' | 'enterprise';
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResult {
  authenticated: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface MagicLinkToken {
  email: string;
  expiresAt: string;
  used: boolean;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

// In production, use proper JWT library and secrets
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory stores (use Redis/DB in production)
const sessions = new Map<string, Session>();
const magicLinkTokens = new Map<string, MagicLinkToken>();
const users = new Map<string, User>();

/**
 * Generate a secure random token
 */
export async function generateToken(length = 32): Promise<string> {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a magic link token for passwordless login
 */
export async function createMagicLinkToken(email: string): Promise<string> {
  const token = await generateToken(32);

  magicLinkTokens.set(token, {
    email: email.toLowerCase(),
    expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY).toISOString(),
    used: false,
  });

  return token;
}

/**
 * Verify and consume a magic link token
 */
export async function verifyMagicLinkToken(
  token: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  const data = magicLinkTokens.get(token);

  if (!data) {
    return { valid: false, error: 'Invalid token' };
  }

  if (data.used) {
    return { valid: false, error: 'Token already used' };
  }

  if (new Date(data.expiresAt) < new Date()) {
    magicLinkTokens.delete(token);
    return { valid: false, error: 'Token expired' };
  }

  // Mark as used
  data.used = true;

  return { valid: true, email: data.email };
}

/**
 * Create a session for a user
 */
export async function createSession(userId: string): Promise<Session> {
  const sessionId = await generateToken(32);

  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_EXPIRY).toISOString(),
  };

  sessions.set(sessionId, session);

  return session;
}

/**
 * Validate a session
 */
export async function validateSession(sessionId: string): Promise<AuthResult> {
  const session = sessions.get(sessionId);

  if (!session) {
    return { authenticated: false, error: 'Invalid session' };
  }

  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(sessionId);
    return { authenticated: false, error: 'Session expired' };
  }

  const user = users.get(session.userId);
  if (!user) {
    sessions.delete(sessionId);
    return { authenticated: false, error: 'User not found' };
  }

  return { authenticated: true, user, session };
}

/**
 * Invalidate a session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId);
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
  Array.from(sessions.entries()).forEach(([id, session]) => {
    if (session.userId === userId) {
      sessions.delete(id);
    }
  });
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Find or create user by email
 */
export async function findOrCreateUser(email: string): Promise<User> {
  // Check if user exists
  const existingUser = Array.from(users.values()).find(
    (user) => user.email === email.toLowerCase()
  );
  if (existingUser) {
    return existingUser;
  }

  // Create new user
  const userId = await generateToken(16);
  const vaultId = generateVaultId();

  const user: User = {
    id: userId,
    email: email.toLowerCase(),
    vaultId,
    createdAt: new Date().toISOString(),
    tier: 'free',
  };

  users.set(userId, user);

  return user;
}

function generateVaultId(): string {
  const digits = () =>
    Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  const middle = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `${digits()}-${middle}-${digits()}`;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Extract session ID from request
 */
export function getSessionId(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

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

/**
 * Authenticate request
 */
export async function authenticateRequest(
  request: Request
): Promise<AuthResult> {
  const sessionId = getSessionId(request);

  if (!sessionId) {
    return { authenticated: false, error: 'No session' };
  }

  return validateSession(sessionId);
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  request: Request
): Promise<{ user: User; session: Session } | Response> {
  const result = await authenticateRequest(request);

  if (!result.authenticated || !result.user || !result.session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { user: result.user, session: result.session };
}

/**
 * Create session cookie
 */
export function createSessionCookie(session: Session): string {
  const expires = new Date(session.expiresAt);
  const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';

  return `session=${session.id}; Path=/; HttpOnly; SameSite=Strict; ${secure} Expires=${expires.toUTCString()}`;
}

/**
 * Create logout cookie
 */
export function createLogoutCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

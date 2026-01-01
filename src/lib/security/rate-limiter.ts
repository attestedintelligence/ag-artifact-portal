/**
 * Rate Limiter
 * Per AGA Build Guide Phase 10.1
 *
 * Token bucket rate limiting for API endpoints.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  /** Requests allowed per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Key generator function */
  keyGenerator?: (request: Request) => string;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

export const RATE_LIMITS = {
  /** General API: 100 requests per minute */
  api: { limit: 100, windowMs: 60_000 },

  /** Authentication: 10 requests per minute */
  auth: { limit: 10, windowMs: 60_000 },

  /** Sealing: 30 seals per hour */
  seal: { limit: 30, windowMs: 3_600_000 },

  /** Verification: 60 requests per minute */
  verify: { limit: 60, windowMs: 60_000 },

  /** Bundle download: 20 per hour */
  bundle: { limit: 20, windowMs: 3_600_000 },

  /** Webhook triggers: 100 per minute */
  webhook: { limit: 100, windowMs: 60_000 },
} as const;

// ============================================================================
// RATE LIMITER
// ============================================================================

export class RateLimiter {
  private states: Map<string, RateLimitState> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Check if request is allowed
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    let state = this.states.get(key);

    if (!state) {
      // New key, full tokens
      state = { tokens: this.config.limit, lastRefill: now };
      this.states.set(key, state);
    }

    // Refill tokens based on time passed
    const timePassed = now - state.lastRefill;
    const tokensToAdd = Math.floor(
      (timePassed / this.config.windowMs) * this.config.limit
    );

    if (tokensToAdd > 0) {
      state.tokens = Math.min(this.config.limit, state.tokens + tokensToAdd);
      state.lastRefill = now;
    }

    // Check if allowed
    if (state.tokens >= 1) {
      state.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(state.tokens),
        resetAt: now + this.config.windowMs,
      };
    }

    // Rate limited
    const timeToNextToken = Math.ceil(
      (this.config.windowMs / this.config.limit) * (1 - state.tokens)
    );

    return {
      allowed: false,
      remaining: 0,
      resetAt: now + this.config.windowMs,
      retryAfter: Math.ceil(timeToNextToken / 1000),
    };
  }

  /**
   * Get rate limit headers
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(this.config.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    };

    if (result.retryAfter) {
      headers['Retry-After'] = String(result.retryAfter);
    }

    return headers;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expireAfter = this.config.windowMs * 2;

    Array.from(this.states.entries()).forEach(([key, state]) => {
      if (now - state.lastRefill > expireAfter) {
        this.states.delete(key);
      }
    });
  }
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);

  return async function rateLimitMiddleware(
    request: Request,
    getKey: (request: Request) => string = defaultKeyGenerator
  ): Promise<{ allowed: boolean; headers: Record<string, string>; retryAfter?: number }> {
    const key = getKey(request);
    const result = limiter.check(key);
    const headers = limiter.getHeaders(result);

    return {
      allowed: result.allowed,
      headers,
      retryAfter: result.retryAfter,
    };
  };
}

function defaultKeyGenerator(request: Request): string {
  // Use IP address as key
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return ip;
}

// ============================================================================
// PRE-CONFIGURED LIMITERS
// ============================================================================

export const apiRateLimiter = new RateLimiter(RATE_LIMITS.api);
export const authRateLimiter = new RateLimiter(RATE_LIMITS.auth);
export const sealRateLimiter = new RateLimiter(RATE_LIMITS.seal);
export const verifyRateLimiter = new RateLimiter(RATE_LIMITS.verify);
export const bundleRateLimiter = new RateLimiter(RATE_LIMITS.bundle);

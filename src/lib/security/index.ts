/**
 * Security Module
 * Per AGA Build Guide Phase 10
 *
 * Exports all security utilities.
 */

// Rate Limiting
export {
  RateLimiter,
  createRateLimitMiddleware,
  apiRateLimiter,
  authRateLimiter,
  sealRateLimiter,
  verifyRateLimiter,
  bundleRateLimiter,
  RATE_LIMITS,
} from './rate-limiter';
export type { RateLimitConfig, RateLimitResult } from './rate-limiter';

// Validation
export {
  sanitizeHtml,
  sanitizeDisplay,
  sanitizeFilename,
  containsBadWords,
  isValidEmail,
  isValidUrl,
  isValidHash,
  isValidUuid,
  isValidVaultId,
  isValidArtifactId,
  validateSchema,
  SCHEMAS,
} from './validation';
export type { ValidationResult, FieldValidation } from './validation';

// Headers
export {
  getCorsHeaders,
  getCspHeader,
  getSecurityHeaders,
  applySecurityHeaders,
  handlePreflight,
} from './headers';
export type { CorsConfig, CspConfig } from './headers';

// Auth
export {
  generateToken,
  createMagicLinkToken,
  verifyMagicLinkToken,
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllSessions,
  findOrCreateUser,
  getSessionId,
  authenticateRequest,
  requireAuth,
  createSessionCookie,
  createLogoutCookie,
} from './auth';
export type { User, Session, AuthResult, MagicLinkToken } from './auth';

/**
 * Security Headers
 * Per AGA Build Guide Phase 10.3
 *
 * CSP, CORS, and other security headers.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

export interface CspConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  frameAncestors: string[];
  formAction: string[];
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

const DEFAULT_CORS: CorsConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
};

const DEFAULT_CSP: CspConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js needs these
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: [
    "'self'",
    'https://api.resend.com',
    'https://arweave.net',
    'wss://*.arweave.net',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: true,
  blockAllMixedContent: true,
};

// ============================================================================
// HEADER GENERATORS
// ============================================================================

/**
 * Generate CORS headers
 */
export function getCorsHeaders(
  request: Request,
  config: Partial<CorsConfig> = {}
): Record<string, string> {
  const cors = { ...DEFAULT_CORS, ...config };
  const origin = request.headers.get('origin') || '';

  const headers: Record<string, string> = {};

  // Check if origin is allowed
  const isAllowed =
    cors.allowedOrigins.includes('*') ||
    cors.allowedOrigins.includes(origin);

  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  headers['Access-Control-Allow-Methods'] = cors.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = cors.allowedHeaders.join(', ');
  headers['Access-Control-Expose-Headers'] = cors.exposedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = String(cors.maxAge);

  if (cors.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Generate CSP header
 */
export function getCspHeader(config: Partial<CspConfig> = {}): string {
  const csp = { ...DEFAULT_CSP, ...config };

  const directives: string[] = [];

  directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
  directives.push(`script-src ${csp.scriptSrc.join(' ')}`);
  directives.push(`style-src ${csp.styleSrc.join(' ')}`);
  directives.push(`img-src ${csp.imgSrc.join(' ')}`);
  directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
  directives.push(`font-src ${csp.fontSrc.join(' ')}`);
  directives.push(`object-src ${csp.objectSrc.join(' ')}`);
  directives.push(`media-src ${csp.mediaSrc.join(' ')}`);
  directives.push(`frame-src ${csp.frameSrc.join(' ')}`);
  directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`);
  directives.push(`form-action ${csp.formAction.join(' ')}`);

  if (csp.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  if (csp.blockAllMixedContent) {
    directives.push('block-all-mixed-content');
  }

  return directives.join('; ');
}

/**
 * Get all security headers
 */
export function getSecurityHeaders(
  request?: Request,
  options: { cors?: Partial<CorsConfig>; csp?: Partial<CspConfig> } = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // XSS protection (legacy, but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Permissions policy
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // HSTS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // CSP
    'Content-Security-Policy': getCspHeader(options.csp),
  };

  // Add CORS headers if request is provided
  if (request) {
    const corsHeaders = getCorsHeaders(request, options.cors);
    Object.assign(headers, corsHeaders);
  }

  return headers;
}

// ============================================================================
// NEXT.JS MIDDLEWARE HELPER
// ============================================================================

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: Response,
  request: Request,
  options?: { cors?: Partial<CorsConfig>; csp?: Partial<CspConfig> }
): Response {
  const headers = getSecurityHeaders(request, options);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Handle CORS preflight request
 */
export function handlePreflight(
  request: Request,
  config?: Partial<CorsConfig>
): Response {
  const headers = getCorsHeaders(request, config);

  return new Response(null, {
    status: 204,
    headers,
  });
}

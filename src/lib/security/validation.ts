/**
 * Input Validation & Sanitization
 * Per AGA Build Guide Phase 10.2
 *
 * Validates and sanitizes user input to prevent XSS, injection, etc.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: unknown;
}

export interface FieldValidation {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'hash' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean;
}

// ============================================================================
// BAD WORDS LIST
// ============================================================================

// Per spec: username and seal text input must be checked against bad words list
const BAD_WORDS = new Set([
  // Common profanity (abbreviated list - in production would be comprehensive)
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'hell',
  // Slurs and hate speech (abbreviated)
  // ... (would include comprehensive list in production)
  // Spam indicators
  'viagra', 'cialis', 'xxx', 'porn',
]);

// ============================================================================
// SANITIZATION
// ============================================================================

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize for safe display (remove control characters, normalize whitespace)
 */
export function sanitizeDisplay(input: string): string {
  return input
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(input: string): string {
  return input
    // Remove path separators
    .replace(/[/\\]/g, '')
    // Remove null bytes
    .replace(/\x00/g, '')
    // Remove special characters except . - _
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    // Limit length
    .slice(0, 255);
}

/**
 * Check for bad words
 */
export function containsBadWords(input: string): { contains: boolean; words: string[] } {
  const words = input.toLowerCase().split(/\s+/);
  const found: string[] = [];

  for (const word of words) {
    // Check exact match
    if (BAD_WORDS.has(word)) {
      found.push(word);
    }
    // Check with common substitutions
    const normalized = word
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/\$/g, 's')
      .replace(/@/g, 'a');
    if (BAD_WORDS.has(normalized) && !found.includes(word)) {
      found.push(word);
    }
  }

  return { contains: found.length > 0, words: found };
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validate SHA-256 hash
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

/**
 * Validate UUID
 */
export function isValidUuid(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validate Vault ID format (XXXX-XXXXX-XXXX)
 */
export function isValidVaultId(vaultId: string): boolean {
  return /^\d{4}-\d{5}-\d{4}$/.test(vaultId);
}

/**
 * Validate artifact ID format
 */
export function isValidArtifactId(artifactId: string): boolean {
  return /^art_[a-z0-9]{12,32}$/i.test(artifactId);
}

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

/**
 * Validate an object against a schema
 */
export function validateSchema(
  data: unknown,
  schema: Record<string, FieldValidation>
): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Input must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  for (const [field, validation] of Object.entries(schema)) {
    const value = obj[field];

    // Required check
    if (validation.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip if optional and not provided
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (validation.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        } else {
          if (validation.minLength && value.length < validation.minLength) {
            errors.push(`${field} must be at least ${validation.minLength} characters`);
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push(`${field} must be at most ${validation.maxLength} characters`);
          }
          if (validation.pattern && !validation.pattern.test(value)) {
            errors.push(`${field} has invalid format`);
          }
          sanitized[field] = validation.sanitize ? sanitizeDisplay(value) : value;
        }
        break;

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== 'number' || isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else {
          if (validation.min !== undefined && num < validation.min) {
            errors.push(`${field} must be at least ${validation.min}`);
          }
          if (validation.max !== undefined && num > validation.max) {
            errors.push(`${field} must be at most ${validation.max}`);
          }
          sanitized[field] = num;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`);
        } else {
          sanitized[field] = value;
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !isValidEmail(value)) {
          errors.push(`${field} must be a valid email`);
        } else {
          sanitized[field] = value.toLowerCase().trim();
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !isValidUrl(value)) {
          errors.push(`${field} must be a valid URL`);
        } else {
          sanitized[field] = value;
        }
        break;

      case 'hash':
        if (typeof value !== 'string' || !isValidHash(value)) {
          errors.push(`${field} must be a valid SHA-256 hash`);
        } else {
          sanitized[field] = value.toLowerCase();
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !isValidUuid(value)) {
          errors.push(`${field} must be a valid UUID`);
        } else {
          sanitized[field] = value.toLowerCase();
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : undefined,
  };
}

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const SCHEMAS = {
  createVault: {
    displayName: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 100,
      sanitize: true,
    },
  },

  createArtifact: {
    vaultId: { type: 'string' as const, required: true },
    displayName: {
      type: 'string' as const,
      required: true,
      minLength: 1,
      maxLength: 200,
      sanitize: true,
    },
    description: {
      type: 'string' as const,
      maxLength: 2000,
      sanitize: true,
    },
  },

  sealArtifact: {
    bytesHash: { type: 'hash' as const, required: true },
    metadataHash: { type: 'hash' as const, required: true },
    fileSize: { type: 'number' as const, min: 0, max: 50 * 1024 * 1024 },
  },

  registerWebhook: {
    url: { type: 'url' as const, required: true },
  },
};

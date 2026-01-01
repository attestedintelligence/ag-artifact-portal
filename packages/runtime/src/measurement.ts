/**
 * Measurement Engine
 * Per AGA Build Guide Phase 5.2
 *
 * Computes current hash and compares to sealed reference.
 */

// ============================================================================
// TYPES
// ============================================================================

export type MeasurementType = 'file' | 'api' | 'database' | 'memory';

export interface MeasurementConfig {
  type: MeasurementType;
  source: string;
  hashAlgorithm?: 'SHA-256' | 'SHA-512';
  normalize?: boolean;
}

export interface MeasurementInput {
  config: MeasurementConfig;
  expectedHash: string;
}

export interface MeasurementOutput {
  currentHash: string;
  expectedHash: string;
  match: boolean;
  timestamp: string;
  source: MeasurementType;
  metadata: {
    sourceUrl?: string;
    contentLength?: number;
    computeTimeMs: number;
  };
}

export interface DriftInfo {
  detected: boolean;
  type?: 'hash_mismatch' | 'source_missing' | 'access_denied';
  details?: string;
  currentHash?: string;
  expectedHash?: string;
}

// ============================================================================
// HASH UTILITY
// ============================================================================

async function computeSha256(data: ArrayBuffer | string): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data).buffer;
  } else {
    buffer = data;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// MEASUREMENT EXECUTOR
// ============================================================================

export class MeasurementExecutor {
  /**
   * Execute a measurement and return the result
   */
  async execute(input: MeasurementInput): Promise<MeasurementOutput> {
    const startTime = performance.now();

    let currentHash: string;
    let metadata: MeasurementOutput['metadata'] = {
      computeTimeMs: 0,
    };

    try {
      switch (input.config.type) {
        case 'file':
          currentHash = await this.measureFile(input.config.source);
          break;
        case 'api':
          const apiResult = await this.measureApi(input.config.source);
          currentHash = apiResult.hash;
          metadata = { ...metadata, ...apiResult.metadata };
          break;
        case 'database':
          currentHash = await this.measureDatabase(input.config.source);
          break;
        case 'memory':
          currentHash = await this.measureMemory(input.config.source);
          break;
        default:
          throw new Error(`Unknown measurement type: ${input.config.type}`);
      }
    } catch (error) {
      // Return a non-matching result on error
      return {
        currentHash: 'ERROR',
        expectedHash: input.expectedHash,
        match: false,
        timestamp: new Date().toISOString(),
        source: input.config.type,
        metadata: {
          computeTimeMs: performance.now() - startTime,
        },
      };
    }

    const endTime = performance.now();
    metadata.computeTimeMs = endTime - startTime;

    return {
      currentHash,
      expectedHash: input.expectedHash,
      match: currentHash === input.expectedHash,
      timestamp: new Date().toISOString(),
      source: input.config.type,
      metadata,
    };
  }

  /**
   * Measure a file (browser File API)
   */
  private async measureFile(source: string): Promise<string> {
    // In browser context, this would use FileReader
    // For now, return placeholder
    // In production, this would:
    // 1. Read file from source path
    // 2. Compute SHA-256 hash
    // 3. Return hex-encoded hash
    throw new Error('File measurement not available in browser context');
  }

  /**
   * Measure an API endpoint
   */
  private async measureApi(
    source: string
  ): Promise<{ hash: string; metadata: { sourceUrl: string; contentLength: number } }> {
    try {
      const response = await fetch(source, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const text = await response.text();
      const hash = await computeSha256(text);

      return {
        hash,
        metadata: {
          sourceUrl: source,
          contentLength: text.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to measure API: ${error}`);
    }
  }

  /**
   * Measure database record
   */
  private async measureDatabase(source: string): Promise<string> {
    // In production, this would:
    // 1. Connect to database
    // 2. Query specified record(s)
    // 3. Canonicalize result
    // 4. Compute hash
    throw new Error('Database measurement not implemented');
  }

  /**
   * Measure in-memory data
   */
  private async measureMemory(source: string): Promise<string> {
    // In production, this would hash data from a specified memory location
    return computeSha256(source);
  }
}

// ============================================================================
// HASH COMPARATOR
// ============================================================================

export class HashComparator {
  /**
   * Compare current hash to expected hash
   */
  compare(current: string, expected: string): DriftInfo {
    if (!current || current === 'ERROR') {
      return {
        detected: true,
        type: 'source_missing',
        details: 'Could not read source for measurement',
      };
    }

    if (current !== expected) {
      return {
        detected: true,
        type: 'hash_mismatch',
        details: `Hash mismatch: expected ${expected.slice(0, 16)}..., got ${current.slice(0, 16)}...`,
        currentHash: current,
        expectedHash: expected,
      };
    }

    return {
      detected: false,
    };
  }
}

// ============================================================================
// MEASUREMENT RECEIPT GENERATOR
// ============================================================================

export interface MeasurementReceipt {
  type: 'MEASUREMENT_OK' | 'DRIFT_DETECTED';
  timestamp: string;
  compositeHash: string;
  mismatchedPaths: string[];
  details?: string;
}

export function generateMeasurementReceipt(
  output: MeasurementOutput,
  driftInfo: DriftInfo
): MeasurementReceipt {
  return {
    type: driftInfo.detected ? 'DRIFT_DETECTED' : 'MEASUREMENT_OK',
    timestamp: output.timestamp,
    compositeHash: output.currentHash,
    mismatchedPaths: driftInfo.detected ? [output.source] : [],
    details: driftInfo.details,
  };
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const measurementExecutor = new MeasurementExecutor();
export const hashComparator = new HashComparator();

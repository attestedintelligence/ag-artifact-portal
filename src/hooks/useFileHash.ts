'use client';

/**
 * useFileHash Hook
 * Per AGA Build Guide Phase 1.1
 *
 * Provides client-side file hashing with progress indication.
 * All hashing happens in the browser - no data sent to server.
 */

import { useState, useCallback } from 'react';
import {
  hashFile as _hashFile,
  sha256String,
  computeFileHashes,
  extractFileMetadata as _extractFileMetadata,
  type HashProgress,
  type ProgressCallback,
} from '@attested/core';

// ============================================================================
// TYPES
// ============================================================================

export interface FileHashResult {
  file: File;
  bytes_hash: string;
  metadata: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  metadata_hash: string;
  sealed_hash: string;
  duration_ms: number;
}

export interface UseFileHashState {
  isHashing: boolean;
  progress: number;
  bytesProcessed: number;
  totalBytes: number;
  result: FileHashResult | null;
  error: string | null;
}

export interface UseFileHashReturn extends UseFileHashState {
  hashFile: (file: File) => Promise<FileHashResult>;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFileHash(): UseFileHashReturn {
  const [state, setState] = useState<UseFileHashState>({
    isHashing: false,
    progress: 0,
    bytesProcessed: 0,
    totalBytes: 0,
    result: null,
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      isHashing: false,
      progress: 0,
      bytesProcessed: 0,
      totalBytes: 0,
      result: null,
      error: null,
    });
  }, []);

  const handleHashFile = useCallback(async (file: File): Promise<FileHashResult> => {
    setState(prev => ({
      ...prev,
      isHashing: true,
      progress: 0,
      bytesProcessed: 0,
      totalBytes: file.size,
      error: null,
      result: null,
    }));

    const startTime = performance.now();

    try {
      // Progress callback for large files
      const onProgress: ProgressCallback = (progress: HashProgress) => {
        setState(prev => ({
          ...prev,
          progress: progress.percentage,
          bytesProcessed: progress.bytesProcessed,
          totalBytes: progress.totalBytes,
        }));
      };

      // Compute all hashes (bytes, metadata, sealed)
      const hashes = await computeFileHashes(file, onProgress);

      const duration_ms = Math.round(performance.now() - startTime);

      const result: FileHashResult = {
        file,
        bytes_hash: hashes.bytes_hash,
        metadata: hashes.metadata,
        metadata_hash: hashes.metadata_hash,
        sealed_hash: hashes.sealed_hash,
        duration_ms,
      };

      setState(prev => ({
        ...prev,
        isHashing: false,
        progress: 100,
        result,
      }));

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to hash file';
      setState(prev => ({
        ...prev,
        isHashing: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  return {
    ...state,
    hashFile: handleHashFile,
    reset,
  };
}

// ============================================================================
// BATCH HASH HOOK
// ============================================================================

export interface BatchHashResult {
  files: FileHashResult[];
  composite_hash: string;
  total_bytes: number;
  total_duration_ms: number;
}

export interface UseBatchHashState {
  isHashing: boolean;
  currentFileIndex: number;
  totalFiles: number;
  currentProgress: number;
  results: FileHashResult[];
  error: string | null;
}

export interface UseBatchHashReturn extends UseBatchHashState {
  hashFiles: (files: File[]) => Promise<BatchHashResult>;
  reset: () => void;
}

export function useBatchHash(): UseBatchHashReturn {
  const [state, setState] = useState<UseBatchHashState>({
    isHashing: false,
    currentFileIndex: 0,
    totalFiles: 0,
    currentProgress: 0,
    results: [],
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      isHashing: false,
      currentFileIndex: 0,
      totalFiles: 0,
      currentProgress: 0,
      results: [],
      error: null,
    });
  }, []);

  const handleHashFiles = useCallback(async (files: File[]): Promise<BatchHashResult> => {
    if (files.length === 0) {
      throw new Error('No files provided');
    }

    setState({
      isHashing: true,
      currentFileIndex: 0,
      totalFiles: files.length,
      currentProgress: 0,
      results: [],
      error: null,
    });

    const startTime = performance.now();
    const results: FileHashResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setState(prev => ({
          ...prev,
          currentFileIndex: i,
          currentProgress: 0,
        }));

        const onProgress: ProgressCallback = (progress: HashProgress) => {
          setState(prev => ({
            ...prev,
            currentProgress: progress.percentage,
          }));
        };

        const fileStart = performance.now();
        const hashes = await computeFileHashes(file, onProgress);

        results.push({
          file,
          bytes_hash: hashes.bytes_hash,
          metadata: hashes.metadata,
          metadata_hash: hashes.metadata_hash,
          sealed_hash: hashes.sealed_hash,
          duration_ms: Math.round(performance.now() - fileStart),
        });

        setState(prev => ({ ...prev, results: [...results] }));
      }

      // Compute composite hash from all sealed hashes
      const compositeInput = results.map(r => r.sealed_hash).join(':');
      const composite_hash = await sha256String(compositeInput);

      const total_duration_ms = Math.round(performance.now() - startTime);
      const total_bytes = results.reduce((sum, r) => sum + r.metadata.size, 0);

      setState(prev => ({
        ...prev,
        isHashing: false,
        currentFileIndex: files.length,
        currentProgress: 100,
      }));

      return {
        files: results,
        composite_hash,
        total_bytes,
        total_duration_ms,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to hash files';
      setState(prev => ({
        ...prev,
        isHashing: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  return {
    ...state,
    hashFiles: handleHashFiles,
    reset,
  };
}

export default useFileHash;

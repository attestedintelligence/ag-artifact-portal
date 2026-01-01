'use client';

/**
 * FileUpload Component
 * Per AGA Build Guide Phase 2.1
 *
 * Drag-and-drop file upload with client-side hashing.
 * No file data sent to server in hash-only mode.
 */

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFileHash, type FileHashResult } from '@/hooks/useFileHash';
import { cn } from '@/lib/utils';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  File,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// ============================================================================
// TYPES
// ============================================================================

interface FileUploadProps {
  onHashComplete: (result: FileHashResult) => void;
  onFileRemove?: () => void;
  includePayload?: boolean;
  onIncludePayloadChange?: (include: boolean) => void;
  maxSizeBytes?: number;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.includes('javascript') || type.includes('json') || type.includes('xml') || type.includes('html')) {
    return FileCode;
  }
  if (type.startsWith('text/') || type.includes('pdf') || type.includes('document')) {
    return FileText;
  }
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileUpload({
  onHashComplete,
  onFileRemove,
  includePayload = false,
  onIncludePayloadChange,
  maxSizeBytes = 100 * 1024 * 1024, // 100MB default
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isHashing, progress, result, error, hashFile, reset } = useFileHash();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, [disabled]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, []);

  const processFile = async (file: File) => {
    if (file.size > maxSizeBytes) {
      // Handle oversized file
      return;
    }

    setSelectedFile(file);
    reset();

    try {
      const hashResult = await hashFile(file);
      onHashComplete(hashResult);
    } catch (err) {
      console.error('Hash error:', err);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    reset();
    onFileRemove?.();
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : Upload;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all duration-200',
          'flex flex-col items-center justify-center p-8 min-h-[200px]',
          isDragging && 'border-primary bg-primary/5 scale-[1.02]',
          !isDragging && !selectedFile && 'border-border hover:border-primary/50 hover:bg-muted/50',
          selectedFile && !isHashing && 'border-primary/50 bg-primary/5',
          isHashing && 'border-primary bg-primary/10',
          error && 'border-destructive bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || isHashing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            // Empty state
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center"
            >
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                'bg-muted text-muted-foreground',
                isDragging && 'bg-primary/20 text-primary',
              )}>
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium mb-1">
                {isDragging ? 'Drop file here' : 'Drag and drop file here'}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Any file type up to {formatBytes(maxSizeBytes)}
              </p>
              <p className="text-xs text-cyan-400 mt-2">
                Hash computed locally. File not uploaded.
              </p>
            </motion.div>
          ) : (
            // File selected state
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  'bg-primary/10 text-primary',
                )}>
                  <FileIcon className="w-6 h-6" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(selectedFile.size)}
                    {selectedFile.type && ` • ${selectedFile.type}`}
                  </p>

                  {/* Progress Bar */}
                  {isHashing && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Computing hash...</span>
                        <span className="text-primary font-mono">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Success State */}
                  {result && !isHashing && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>Hash computed in {formatDuration(result.duration_ms)}</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {!isHashing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {/* Loading Spinner */}
                {isHashing && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payload Toggle */}
      {onIncludePayloadChange && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <Switch
            id="include-payload"
            checked={includePayload}
            onCheckedChange={onIncludePayloadChange}
            disabled={disabled}
          />
          <div className="space-y-1">
            <Label htmlFor="include-payload" className="cursor-pointer">
              Include file in bundle
            </Label>
            <p className="text-xs text-muted-foreground">
              Enables re-verification. File will be uploaded and stored.
            </p>
            {includePayload && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                File will be stored on Arweave permanently
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;

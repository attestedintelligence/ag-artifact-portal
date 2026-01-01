'use client';

/**
 * ArtifactDetailsForm Component
 * Per AGA Build Guide Phase 2.1
 *
 * Form for artifact name and description.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ArtifactDetails {
  name: string;
  description: string;
}

interface ArtifactDetailsFormProps {
  value: ArtifactDetails;
  onChange: (details: ArtifactDetails) => void;
  errors?: {
    name?: string;
    description?: string;
  };
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;

// ============================================================================
// COMPONENT
// ============================================================================

export function ArtifactDetailsForm({
  value,
  onChange,
  errors,
  disabled = false,
  className,
}: ArtifactDetailsFormProps) {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value.slice(0, MAX_NAME_LENGTH);
    onChange({ ...value, name });
  }, [value, onChange]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
    onChange({ ...value, description });
  }, [value, onChange]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Name Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="artifact-name" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {value.name.length}/{MAX_NAME_LENGTH}
          </span>
        </div>
        <Input
          id="artifact-name"
          type="text"
          value={value.name}
          onChange={handleNameChange}
          placeholder="e.g., Q4 Financial Report"
          disabled={disabled}
          className={cn(
            'bg-background',
            errors?.name && 'border-destructive focus-visible:ring-destructive',
          )}
        />
        {errors?.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          A descriptive name for this artifact
        </p>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="artifact-description" className="text-sm font-medium">
            Description
          </Label>
          <span className="text-xs text-muted-foreground">
            {value.description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <Textarea
          id="artifact-description"
          value={value.description}
          onChange={handleDescriptionChange}
          placeholder="Optional description of the artifact contents and purpose..."
          disabled={disabled}
          rows={3}
          className={cn(
            'bg-background resize-none',
            errors?.description && 'border-destructive focus-visible:ring-destructive',
          )}
        />
        {errors?.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>
    </div>
  );
}

export default ArtifactDetailsForm;

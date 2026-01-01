'use client';

/**
 * RuntimeSettings Component
 * Per AGA Build Guide Phase 2.1
 *
 * Configuration for measurement cadence, TTL, and enforcement actions.
 */

import { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Clock, Timer, Shield, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type EnforcementAction = 'KILL' | 'ALERT' | 'BLOCK_START';

export interface RuntimeConfig {
  measurementCadenceMs: number;
  ttlSeconds: number | null;
  enforcementAction: EnforcementAction;
}

interface RuntimeSettingsProps {
  value: RuntimeConfig;
  onChange: (config: RuntimeConfig) => void;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// OPTIONS
// ============================================================================

const CADENCE_OPTIONS = [
  { value: '10000', label: '10 seconds' },
  { value: '30000', label: '30 seconds' },
  { value: '60000', label: '1 minute' },
  { value: '300000', label: '5 minutes' },
  { value: '900000', label: '15 minutes' },
  { value: '3600000', label: '1 hour' },
];

const TTL_OPTIONS = [
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '1 day' },
  { value: '604800', label: '7 days' },
  { value: '2592000', label: '30 days' },
  { value: '7776000', label: '90 days' },
  { value: '31536000', label: '1 year' },
  { value: 'null', label: 'No expiration' },
];

const ENFORCEMENT_OPTIONS: { value: EnforcementAction; label: string; description: string }[] = [
  {
    value: 'KILL',
    label: 'Terminate',
    description: 'Stop execution immediately on drift',
  },
  {
    value: 'BLOCK_START',
    label: 'Block Start',
    description: 'Prevent new runs if policy invalid',
  },
  {
    value: 'ALERT',
    label: 'Alert Only',
    description: 'Log event but continue execution',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function RuntimeSettings({
  value,
  onChange,
  disabled = false,
  className,
}: RuntimeSettingsProps) {
  const handleCadenceChange = useCallback((cadence: string) => {
    onChange({ ...value, measurementCadenceMs: parseInt(cadence, 10) });
  }, [value, onChange]);

  const handleTtlChange = useCallback((ttl: string) => {
    onChange({
      ...value,
      ttlSeconds: ttl === 'null' ? null : parseInt(ttl, 10),
    });
  }, [value, onChange]);

  const handleEnforcementChange = useCallback((action: string) => {
    onChange({ ...value, enforcementAction: action as EnforcementAction });
  }, [value, onChange]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Measurement Cadence */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Measurement Cadence</Label>
        </div>
        <Select
          value={value.measurementCadenceMs.toString()}
          onValueChange={handleCadenceChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select cadence" />
          </SelectTrigger>
          <SelectContent>
            {CADENCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How often to verify artifact integrity during runtime
        </p>
      </div>

      {/* Time-to-Live */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Time-to-Live (TTL)</Label>
        </div>
        <Select
          value={value.ttlSeconds?.toString() ?? 'null'}
          onValueChange={handleTtlChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select TTL" />
          </SelectTrigger>
          <SelectContent>
            {TTL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Artifact will expire and require re-attestation after this period
        </p>
      </div>

      {/* Enforcement Action */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">On Drift Detection</Label>
        </div>
        <Select
          value={value.enforcementAction}
          onValueChange={handleEnforcementChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            {ENFORCEMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {ENFORCEMENT_OPTIONS.find(o => o.value === value.enforcementAction)?.description}
        </p>
        {value.enforcementAction === 'ALERT' && (
          <div className="flex items-center gap-2 text-xs text-amber-400 mt-2">
            <AlertTriangle className="w-3 h-3" />
            <span>Alert-only mode does not stop compromised processes</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RuntimeSettings;

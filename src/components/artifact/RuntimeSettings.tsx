'use client';

/**
 * RuntimeSettings Component - Enterprise Preview
 * Defense-grade configuration for AGA Portal
 *
 * Features:
 * - Subject category selector (SCADA, Drone, AI Agent, etc.)
 * - Measurement types multi-select
 * - Enhanced enforcement actions with visual indicators
 * - Patent claim badges per feature
 */

import { useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Clock,
  Timer,
  Shield,
  AlertTriangle,
  Factory,
  Plane,
  Box,
  Brain,
  Cpu,
  Settings,
  Check,
  XCircle,
  ShieldOff,
  WifiOff,
  RefreshCw,
  Bell,
  FileText,
} from 'lucide-react';
import {
  SUBJECT_CATEGORIES,
  MEASUREMENT_TYPES,
  ENFORCEMENT_ACTIONS,
  PATENT_CLAIMS,
} from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export type EnforcementAction = 'TERMINATE' | 'QUARANTINE' | 'NETWORK_ISOLATION' | 'SAFE_STATE' | 'ALERT';
export type SubjectCategory = typeof SUBJECT_CATEGORIES[number]['id'];
export type MeasurementType = typeof MEASUREMENT_TYPES[number]['id'];

export interface RuntimeConfig {
  subjectCategory: SubjectCategory;
  measurementTypes: MeasurementType[];
  measurementCadenceMs: number;
  ttlSeconds: number | null;
  enforcementAction: EnforcementAction;
}

interface RuntimeSettingsProps {
  value: RuntimeConfig;
  onChange: (config: RuntimeConfig) => void;
  disabled?: boolean;
  className?: string;
  showPatentClaims?: boolean;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const categoryIcons: Record<string, React.ElementType> = {
  factory: Factory,
  plane: Plane,
  box: Box,
  brain: Brain,
  cpu: Cpu,
  settings: Settings,
};

const enforcementIcons: Record<string, React.ElementType> = {
  'x-circle': XCircle,
  'shield-off': ShieldOff,
  'wifi-off': WifiOff,
  'refresh-cw': RefreshCw,
  'bell': Bell,
};

// ============================================================================
// OPTIONS
// ============================================================================

const CADENCE_OPTIONS = [
  { value: '1000', label: '1 second', description: 'Real-time critical systems' },
  { value: '5000', label: '5 seconds', description: 'High-frequency monitoring' },
  { value: '10000', label: '10 seconds', description: 'Active monitoring' },
  { value: '30000', label: '30 seconds', description: 'Standard cadence' },
  { value: '60000', label: '1 minute', description: 'Normal operations' },
  { value: '300000', label: '5 minutes', description: 'Low-frequency check' },
];

const TTL_OPTIONS = [
  { value: '3600', label: '1 hour', description: 'Short-lived artifacts' },
  { value: '86400', label: '24 hours', description: 'Daily rotation' },
  { value: '604800', label: '7 days', description: 'Weekly cycle' },
  { value: '2592000', label: '30 days', description: 'Monthly validity' },
  { value: '7776000', label: '90 days', description: 'Quarterly review' },
  { value: '31536000', label: '1 year', description: 'Annual compliance' },
  { value: 'null', label: 'No expiration', description: 'Forever artifact' },
];

// ============================================================================
// PATENT CLAIM BADGE
// ============================================================================

function PatentBadge({ claims, compact = false }: { claims: number[]; compact?: boolean }) {
  if (claims.length === 0) return null;

  const independentClaims = claims.filter(c => PATENT_CLAIMS[c as keyof typeof PATENT_CLAIMS]?.independent);

  return (
    <div className={cn(
      'flex items-center gap-1',
      compact ? 'text-[10px]' : 'text-xs'
    )}>
      <FileText className="w-3 h-3 text-amber-500" />
      <span className="text-amber-500/80">
        {compact ? (
          `${claims.length} claims`
        ) : (
          <>Claims {claims.join(', ')}{independentClaims.length > 0 && ' *'}</>
        )}
      </span>
    </div>
  );
}

// ============================================================================
// SUBJECT CATEGORY SELECTOR
// ============================================================================

function SubjectCategorySelector({
  value,
  onChange,
  disabled,
}: {
  value: SubjectCategory;
  onChange: (category: SubjectCategory) => void;
  disabled?: boolean;
}) {
  const selectedCategory = SUBJECT_CATEGORIES.find(c => c.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Subject Category</Label>
        </div>
        {selectedCategory && (
          <PatentBadge claims={[...selectedCategory.patentClaims]} compact />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUBJECT_CATEGORIES.map((category) => {
          const Icon = categoryIcons[category.icon] || Settings;
          const isSelected = value === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id as SubjectCategory)}
              disabled={disabled}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                'hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={isSelected ? { borderColor: category.color } : undefined}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className="w-4 h-4"
                  style={{ color: isSelected ? category.color : undefined }}
                />
                <span className={cn(
                  'text-sm font-medium',
                  isSelected && 'text-white'
                )}>
                  {category.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {category.description}
              </p>
            </button>
          );
        })}
      </div>

      {selectedCategory && selectedCategory.useCases.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedCategory.useCases.map((useCase) => (
            <span
              key={useCase}
              className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
            >
              {useCase}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MEASUREMENT TYPES MULTI-SELECT
// ============================================================================

function MeasurementTypesSelector({
  value,
  onChange,
  disabled,
}: {
  value: MeasurementType[];
  onChange: (types: MeasurementType[]) => void;
  disabled?: boolean;
}) {
  const toggleType = useCallback((typeId: MeasurementType) => {
    if (value.includes(typeId)) {
      onChange(value.filter(t => t !== typeId));
    } else {
      onChange([...value, typeId]);
    }
  }, [value, onChange]);

  const allClaims = useMemo(() => {
    const claims = new Set<number>();
    value.forEach(typeId => {
      const type = MEASUREMENT_TYPES.find(t => t.id === typeId);
      if (type) {
        type.patentClaims.forEach(c => claims.add(c));
      }
    });
    return Array.from(claims).sort((a, b) => a - b);
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Measurement Types</Label>
        </div>
        <PatentBadge claims={allClaims} compact />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MEASUREMENT_TYPES.map((type) => {
          const isSelected = value.includes(type.id as MeasurementType);

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleType(type.id as MeasurementType)}
              disabled={disabled}
              className={cn(
                'p-2 rounded-lg border text-left transition-all flex items-start gap-2',
                'hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center',
                isSelected
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground'
              )}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  'text-sm font-medium block',
                  isSelected && 'text-white'
                )}>
                  {type.label}
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  {type.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length} measurement type{value.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}

// ============================================================================
// ENFORCEMENT ACTION SELECTOR
// ============================================================================

function EnforcementActionSelector({
  value,
  onChange,
  disabled,
}: {
  value: EnforcementAction;
  onChange: (action: EnforcementAction) => void;
  disabled?: boolean;
}) {
  const selectedAction = ENFORCEMENT_ACTIONS.find(a => a.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Enforcement Action</Label>
        </div>
        {selectedAction && (
          <PatentBadge claims={[...selectedAction.patentClaims]} compact />
        )}
      </div>

      <div className="space-y-2">
        {ENFORCEMENT_ACTIONS.map((action) => {
          const Icon = enforcementIcons[action.icon] || Shield;
          const isSelected = value === action.id;

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onChange(action.id as EnforcementAction)}
              disabled={disabled}
              className={cn(
                'w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3',
                'hover:border-primary/50',
                isSelected
                  ? 'border-2'
                  : 'border-border bg-background',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={isSelected ? {
                borderColor: action.color,
                backgroundColor: `${action.color}10`
              } : undefined}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    isSelected && 'text-white'
                  )}>
                    {action.label}
                  </span>
                  <span
                    className="px-1.5 py-0.5 text-[10px] rounded uppercase font-medium"
                    style={{
                      backgroundColor: `${action.color}20`,
                      color: action.color
                    }}
                  >
                    {action.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                isSelected ? 'border-primary' : 'border-muted'
              )}>
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {value === 'ALERT' && (
        <div className="flex items-center gap-2 text-xs text-amber-400 mt-2 p-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Alert-only mode logs events but does not halt compromised processes</span>
        </div>
      )}

      {value === 'QUARANTINE' && (
        <div className="flex items-center gap-2 text-xs text-amber-400 mt-2 p-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
          <ShieldOff className="w-4 h-4 flex-shrink-0" />
          <span>Phantom mode: process runs isolated, all external I/O intercepted</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RuntimeSettings({
  value,
  onChange,
  disabled = false,
  className,
  showPatentClaims = true,
}: RuntimeSettingsProps) {
  const handleCategoryChange = useCallback((category: SubjectCategory) => {
    // When category changes, update default measurements
    const defaultMeasurements = MEASUREMENT_TYPES
      .filter(m => m.defaultEnabled)
      .map(m => m.id) as MeasurementType[];

    onChange({
      ...value,
      subjectCategory: category,
      measurementTypes: defaultMeasurements,
    });
  }, [value, onChange]);

  const handleMeasurementTypesChange = useCallback((types: MeasurementType[]) => {
    onChange({ ...value, measurementTypes: types });
  }, [value, onChange]);

  const handleCadenceChange = useCallback((cadence: string) => {
    onChange({ ...value, measurementCadenceMs: parseInt(cadence, 10) });
  }, [value, onChange]);

  const handleTtlChange = useCallback((ttl: string) => {
    onChange({
      ...value,
      ttlSeconds: ttl === 'null' ? null : parseInt(ttl, 10),
    });
  }, [value, onChange]);

  const handleEnforcementChange = useCallback((action: EnforcementAction) => {
    onChange({ ...value, enforcementAction: action });
  }, [value, onChange]);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Subject Category */}
      <SubjectCategorySelector
        value={value.subjectCategory}
        onChange={handleCategoryChange}
        disabled={disabled}
      />

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Measurement Types */}
      <MeasurementTypesSelector
        value={value.measurementTypes}
        onChange={handleMeasurementTypesChange}
        disabled={disabled}
      />

      {/* Divider */}
      <div className="border-t border-border" />

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
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Interval between integrity measurements during runtime
        </p>
      </div>

      {/* Time-to-Live */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Artifact TTL</Label>
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
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Policy artifact expires after this period, requiring re-attestation
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Enforcement Action */}
      <EnforcementActionSelector
        value={value.enforcementAction}
        onChange={handleEnforcementChange}
        disabled={disabled}
      />

      {/* Patent Claims Summary */}
      {showPatentClaims && (
        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-400">Patent Coverage</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This configuration demonstrates patent claims from our pending USPTO application.
            Independent claims marked with *.
          </p>
        </div>
      )}
    </div>
  );
}

export default RuntimeSettings;

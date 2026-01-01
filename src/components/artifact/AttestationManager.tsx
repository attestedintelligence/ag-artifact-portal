'use client';

/**
 * AttestationManager Component
 * Per AGA Build Guide Phase 2.1 Step 4
 *
 * Manages third-party attestor invitations.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Mail,
  Clock,
  Check,
  X,
  RefreshCw,
  Shield,
  Eye,
  FileCheck,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type AttestorRole = 'witness' | 'auditor' | 'approver';

export interface PendingAttestor {
  id: string;
  email: string;
  role: AttestorRole;
  status: 'pending' | 'accepted' | 'expired';
  invitedAt: string;
  expiresAt: string;
}

interface AttestationManagerProps {
  attestors: PendingAttestor[];
  onAddAttestor: (email: string, role: AttestorRole) => Promise<void>;
  onRemoveAttestor: (id: string) => void;
  onResendInvite: (id: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_OPTIONS: { value: AttestorRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'witness',
    label: 'Witness',
    description: 'Confirms they received and reviewed the document',
    icon: Eye,
  },
  {
    value: 'auditor',
    label: 'Auditor',
    description: 'Provides independent verification of contents',
    icon: FileCheck,
  },
  {
    value: 'approver',
    label: 'Approver',
    description: 'Authorizes the document for official use',
    icon: Shield,
  },
];

// ============================================================================
// ATTESTOR CARD COMPONENT
// ============================================================================

function AttestorCard({
  attestor,
  onRemove,
  onResend,
  disabled,
}: {
  attestor: PendingAttestor;
  onRemove: () => void;
  onResend: () => Promise<void>;
  disabled?: boolean;
}) {
  const [isResending, setIsResending] = useState(false);
  const roleConfig = ROLE_OPTIONS.find((r) => r.value === attestor.role);
  const RoleIcon = roleConfig?.icon || Eye;

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
    } finally {
      setIsResending(false);
    }
  };

  const isExpired = new Date(attestor.expiresAt) < new Date();
  const status = isExpired ? 'expired' : attestor.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        status === 'accepted' && 'border-emerald-500/30 bg-emerald-500/5',
        status === 'pending' && 'border-border bg-muted/30',
        status === 'expired' && 'border-amber-500/30 bg-amber-500/5',
      )}
    >
      {/* Role Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          status === 'accepted' && 'bg-emerald-500/20 text-emerald-400',
          status === 'pending' && 'bg-primary/20 text-primary',
          status === 'expired' && 'bg-amber-500/20 text-amber-400',
        )}
      >
        <RoleIcon className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{attestor.email}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground capitalize">
            {roleConfig?.label}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span
            className={cn(
              'text-xs',
              status === 'accepted' && 'text-emerald-400',
              status === 'pending' && 'text-primary',
              status === 'expired' && 'text-amber-400',
            )}
          >
            {status === 'accepted' && 'Accepted'}
            {status === 'pending' && 'Pending'}
            {status === 'expired' && 'Expired'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {(status === 'pending' || status === 'expired') && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleResend}
            disabled={disabled || isResending}
            title="Resend invite"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        )}
        {status !== 'accepted' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={disabled}
            title="Remove attestor"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        {status === 'accepted' && (
          <Check className="w-5 h-5 text-emerald-400" />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AttestationManager({
  attestors,
  onAddAttestor,
  onRemoveAttestor,
  onResendInvite,
  disabled = false,
  className,
}: AttestationManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AttestorRole>('witness');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    if (attestors.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      setError('This email has already been invited');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await onAddAttestor(email, role);
      setEmail('');
      setRole('witness');
      setIsDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attestor');
    } finally {
      setIsAdding(false);
    }
  };

  const acceptedCount = attestors.filter((a) => a.status === 'accepted').length;
  const pendingCount = attestors.filter((a) => a.status === 'pending').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Third-Party Attestations
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optional: Invite others to verify this artifact
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Attestor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Attestor</DialogTitle>
              <DialogDescription>
                Send an invitation to a third party to attest to this artifact.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="attestor-email">Email Address</Label>
                <Input
                  id="attestor-email"
                  type="email"
                  placeholder="attestor@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={cn(error && 'border-destructive')}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AttestorRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_OPTIONS.find((r) => r.value === role)?.description}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      {attestors.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" />
            {acceptedCount} accepted
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            {pendingCount} pending
          </span>
        </div>
      )}

      {/* Attestor List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {attestors.map((attestor) => (
            <AttestorCard
              key={attestor.id}
              attestor={attestor}
              onRemove={() => onRemoveAttestor(attestor.id)}
              onResend={() => onResendInvite(attestor.id)}
              disabled={disabled}
            />
          ))}
        </AnimatePresence>

        {attestors.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            No attestors added yet
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        Attestors will receive an email with a secure link to verify and sign the artifact.
      </p>
    </div>
  );
}

export default AttestationManager;

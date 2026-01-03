'use client';

/**
 * Profile Settings Page
 * Allows users to customize their profile icon and view account info
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  Shield,
  Hexagon,
  Fingerprint,
  Lock,
  Zap,
  Layers,
  Binary,
  Cpu,
  Database,
  Network,
  Server,
  Terminal,
  CircuitBoard,
  Scan,
} from 'lucide-react';

// ============================================================================
// AVATAR ICONS - Cool cyber/security themed options
// ============================================================================

const AVATAR_OPTIONS = [
  { id: 'shield', icon: Shield, label: 'Shield', color: 'text-cyan-400' },
  { id: 'hexagon', icon: Hexagon, label: 'Hexagon', color: 'text-emerald-400' },
  { id: 'fingerprint', icon: Fingerprint, label: 'Fingerprint', color: 'text-purple-400' },
  { id: 'lock', icon: Lock, label: 'Lock', color: 'text-amber-400' },
  { id: 'zap', icon: Zap, label: 'Zap', color: 'text-yellow-400' },
  { id: 'layers', icon: Layers, label: 'Layers', color: 'text-blue-400' },
  { id: 'binary', icon: Binary, label: 'Binary', color: 'text-green-400' },
  { id: 'cpu', icon: Cpu, label: 'CPU', color: 'text-rose-400' },
  { id: 'database', icon: Database, label: 'Database', color: 'text-orange-400' },
  { id: 'network', icon: Network, label: 'Network', color: 'text-indigo-400' },
  { id: 'server', icon: Server, label: 'Server', color: 'text-teal-400' },
  { id: 'terminal', icon: Terminal, label: 'Terminal', color: 'text-lime-400' },
  { id: 'circuit', icon: CircuitBoard, label: 'Circuit', color: 'text-pink-400' },
  { id: 'scan', icon: Scan, label: 'Scan', color: 'text-sky-400' },
];

const STORAGE_KEY = 'vb_user_avatar';
const DEFAULT_AVATAR = 'shield';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SettingsPage() {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR);
  const [saved, setSaved] = useState(false);

  // Load saved avatar on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem(STORAGE_KEY);
    if (savedAvatar && AVATAR_OPTIONS.find(a => a.id === savedAvatar)) {
      setSelectedAvatar(savedAvatar);
    }
  }, []);

  // Save avatar selection
  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, selectedAvatar);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];
  const CurrentIcon = currentAvatar.icon;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border safe-area-top">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/vault"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-lg safe-area-inset">
        {/* Current Avatar Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6 text-center"
        >
          <div className={cn(
            'w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center',
            'bg-gradient-to-br from-white/10 to-white/5',
            'border border-white/20',
            'shadow-lg',
          )}>
            <CurrentIcon className={cn('w-12 h-12', currentAvatar.color)} />
          </div>
          <h2 className="text-lg font-semibold mb-1">Profile Icon</h2>
          <p className="text-sm text-muted-foreground">
            Choose an icon to represent your vault
          </p>
        </motion.div>

        {/* Avatar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-6"
        >
          <h3 className="text-sm font-medium mb-4 px-2">Select Icon</h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {AVATAR_OPTIONS.map((avatar) => {
              const Icon = avatar.icon;
              const isSelected = selectedAvatar === avatar.id;

              return (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={cn(
                    'relative aspect-square rounded-xl flex items-center justify-center',
                    'transition-all duration-200',
                    'min-h-[56px] min-w-[56px]',
                    isSelected
                      ? 'bg-white/15 border-2 border-primary scale-105'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95',
                  )}
                  aria-label={`Select ${avatar.label} icon`}
                >
                  <Icon className={cn('w-6 h-6 sm:w-7 sm:h-7', avatar.color)} />
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleSave}
            className="w-full min-h-[48px] text-base glow-cyan"
            disabled={saved}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </motion.div>

        {/* Account Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Account</h3>
          <div className="glass-card divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm">Tier</span>
              <span className="text-sm font-medium text-primary">Free</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm">Seals this month</span>
              <span className="text-sm font-medium">0 / 15</span>
            </div>
            <Link
              href="/pricing"
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm">Upgrade to Premium</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

'use client';

/**
 * Mobile Navigation Component
 * Bottom navigation bar optimized for iPhone 13 Safari
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Shield,
  Plus,
  Home,
  Settings,
  Folder,
} from 'lucide-react';

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: Home,
  },
  {
    href: '/vault',
    label: 'Vault',
    icon: Folder,
  },
  {
    href: '/create',
    label: 'Seal',
    icon: Plus,
    primary: true,
  },
  {
    href: '/verify',
    label: 'Verify',
    icon: Shield,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MobileNav() {
  const pathname = usePathname();

  // Only show on authenticated portal pages
  const portalPaths = ['/vault', '/create', '/dashboard', '/settings', '/verify/'];
  const isPortalPage = portalPaths.some(p => pathname.startsWith(p));

  // Hide on landing pages and auth pages
  if (!isPortalPage) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/10" />

      {/* Navigation content with safe area */}
      <div className="relative flex items-center justify-around px-2 pt-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          if (item.primary) {
            // Primary action button (Seal)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center',
                  '-mt-4 relative',
                )}
              >
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center',
                  'bg-primary glow-cyan',
                  'shadow-lg shadow-primary/30',
                  'transition-transform active:scale-95',
                )}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 text-primary font-medium">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3',
                'min-w-[60px] min-h-[44px]', // Touch-friendly
                'transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1',
                isActive && 'drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]',
              )} />
              <span className={cn(
                'text-[10px]',
                isActive && 'font-medium',
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;

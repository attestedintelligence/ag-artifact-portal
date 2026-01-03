'use client';

import Link from 'next/link';
import { COLORS, EXTERNAL_LINKS, TRUST_BADGES, SITE_CONFIG } from '@/lib/constants';

function TrustBadge({ label, description }: { label: string; description: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm"
      style={{ color: COLORS.textSecondary }}
    >
      <span className="font-medium" style={{ color: COLORS.cyan }}>{label}</span>
      <span className="hidden sm:inline" style={{ color: COLORS.textMuted }}>—</span>
      <span className="hidden sm:inline">{description}</span>
    </div>
  );
}

function VerifierOutput() {
  return (
    <div
      className="rounded-lg border overflow-hidden font-mono text-xs sm:text-sm"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div
        className="px-4 py-2 border-b flex items-center gap-2"
        style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22C55E' }} />
        </div>
        <span style={{ color: COLORS.textMuted }}>verify bundle.zip</span>
      </div>
      <div className="p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>artifact:</span>
          <span style={{ color: COLORS.success }}>OK</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>receipts:</span>
          <span style={{ color: COLORS.success }}>OK (5/5)</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>chain:</span>
          <span style={{ color: COLORS.success }}>OK</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>drift:</span>
          <span style={{ color: COLORS.amber }}>YES (receipt #3)</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>enforcement:</span>
          <span style={{ color: COLORS.cyan }}>ALERT</span>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-2">
            <span style={{ color: COLORS.textMuted }}>overall:</span>
            <span className="font-bold" style={{ color: COLORS.success }}>PASS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BundleCard() {
  return (
    <div
      className="rounded-lg border p-4 sm:p-6"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: COLORS.cyanGlow }}
        >
          <svg className="w-5 h-5" style={{ color: COLORS.cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <div className="font-medium" style={{ color: COLORS.textPrimary }}>evidence_bundle.zip</div>
          <div className="text-xs" style={{ color: COLORS.textMuted }}>Offline-verifiable</div>
        </div>
      </div>
      <div className="space-y-2 text-xs font-mono" style={{ color: COLORS.textSecondary }}>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>/</span>
          <span>bundle_manifest.json</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>/</span>
          <span>policy/policy_artifact.json</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>/</span>
          <span>receipts/0001.json ... 0005.json</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.textMuted }}>/</span>
          <span>verifier/verify.js</span>
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized hero icon
function MobileHeroIcon() {
  return (
    <div className="flex justify-center mb-8">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{
          backgroundColor: COLORS.cyanGlow,
          boxShadow: `0 0 60px ${COLORS.cyan}40`,
        }}
      >
        <svg
          className="w-10 h-10"
          style={{ color: COLORS.cyan }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
    </div>
  );
}

// Mobile trust strip - simplified
function MobileTrustStrip() {
  const mobileItems = [
    { label: 'SHA-256', color: COLORS.cyan },
    { label: 'Ed25519', color: COLORS.cyan },
    { label: 'Offline', color: COLORS.success },
  ];

  return (
    <div className="flex justify-center gap-4 mb-8">
      {mobileItems.map((item) => (
        <div
          key={item.label}
          className="px-3 py-1.5 rounded-full text-xs font-medium border"
          style={{
            borderColor: `${item.color}40`,
            color: item.color,
            backgroundColor: `${item.color}10`,
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="min-h-screen flex flex-col justify-center pt-20 pb-16 px-4 sm:px-6"
      style={{ backgroundColor: COLORS.void }}
    >
      <div className="max-w-6xl mx-auto w-full">
        {/* Mobile Hero Icon - only on small screens */}
        <div className="md:hidden">
          <MobileHeroIcon />
        </div>

        {/* Main Headline */}
        <div className="text-center mb-8 md:mb-12">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight tracking-tight"
            style={{ color: COLORS.textPrimary }}
          >
            <span className="block sm:inline">Prove integrity.</span>{' '}
            <span className="block sm:inline">Verify it offline.</span>
          </h1>
          <p
            className="text-sm sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ color: COLORS.textSecondary }}
          >
            <span className="hidden sm:inline">{SITE_CONFIG.description}</span>
            <span className="sm:hidden">Seal files with cryptographic proof. Export bundles anyone can verify—even air-gapped.</span>
          </p>
        </div>

        {/* Mobile Trust Strip - only on small screens */}
        <div className="md:hidden">
          <MobileTrustStrip />
        </div>

        {/* Two Primary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 md:mb-16">
          <Link
            href={EXTERNAL_LINKS.verifiedBundle}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium transition-all hover:opacity-90 text-center"
            style={{
              backgroundColor: COLORS.cyan,
              color: COLORS.void,
            }}
          >
            Use VerifiedBundle
          </Link>
          <Link
            href={EXTERNAL_LINKS.agaPortal}
            className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium border transition-all hover:bg-white/5 text-center"
            style={{
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          >
            Open AGA Portal
          </Link>
        </div>

        {/* Visual Proof Centerpiece - hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          <BundleCard />
          <VerifierOutput />
        </div>

        {/* Desktop Trust Strip - hidden on mobile */}
        <div
          className="hidden md:flex flex-wrap items-center justify-center gap-4 py-4 rounded-lg"
          style={{ backgroundColor: COLORS.surface }}
        >
          {TRUST_BADGES.map((badge) => (
            <TrustBadge key={badge.label} label={badge.label} description={badge.description} />
          ))}
        </div>

        {/* Mobile Bottom Info */}
        <div
          className="md:hidden mt-8 p-4 rounded-lg text-center"
          style={{ backgroundColor: COLORS.surface }}
        >
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            No file storage • Client-side hashing • Air-gap verified
          </p>
        </div>
      </div>
    </section>
  );
}

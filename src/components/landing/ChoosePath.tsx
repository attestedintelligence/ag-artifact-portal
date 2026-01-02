'use client';

import Link from 'next/link';
import { COLORS, EXTERNAL_LINKS } from '@/lib/constants';

interface PathCardProps {
  title: string;
  tagline: string;
  whoFor: string;
  whatYouGet: string[];
  proofExample: string;
  href: string;
  cta: string;
  accentColor: string;
  glowColor: string;
  external?: boolean;
}

function PathCard({
  title,
  tagline,
  whoFor,
  whatYouGet,
  proofExample,
  href,
  cta,
  accentColor,
  glowColor,
  external = false,
}: PathCardProps) {
  const CardWrapper = external ? 'a' : Link;
  const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <div
      className="relative p-6 sm:p-8 rounded-xl border transition-all duration-300 hover:scale-[1.01]"
      style={{
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="mb-6">
        <h3
          className="text-xl sm:text-2xl font-semibold mb-2"
          style={{ color: accentColor }}
        >
          {title}
        </h3>
        <p
          className="text-sm"
          style={{ color: COLORS.textSecondary }}
        >
          {tagline}
        </p>
      </div>

      {/* Who it's for */}
      <div className="mb-6">
        <div
          className="text-xs font-mono uppercase tracking-wider mb-2"
          style={{ color: COLORS.textMuted }}
        >
          Who it&apos;s for
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: COLORS.textSecondary }}
        >
          {whoFor}
        </p>
      </div>

      {/* What you get */}
      <div className="mb-6">
        <div
          className="text-xs font-mono uppercase tracking-wider mb-3"
          style={{ color: COLORS.textMuted }}
        >
          What you get
        </div>
        <ul className="space-y-2">
          {whatYouGet.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: accentColor }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Proof example link */}
      <div className="mb-8">
        <Link
          href={proofExample}
          className="inline-flex items-center gap-1 text-sm transition-colors hover:opacity-80"
          style={{ color: accentColor }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download sample bundle
        </Link>
      </div>

      {/* CTA Button */}
      <CardWrapper
        href={href}
        {...linkProps}
        className="block w-full py-3 rounded-lg text-center text-sm font-medium transition-all hover:opacity-90"
        style={{
          backgroundColor: glowColor,
          color: accentColor,
          border: `1px solid ${accentColor}33`,
        }}
      >
        {cta}
      </CardWrapper>
    </div>
  );
}

export function ChoosePath() {
  return (
    <section
      className="py-20 sm:py-24 px-4 sm:px-6 border-t"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Choose your path
          </h2>
          <p
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Two products for different needs, same cryptographic guarantees
          </p>
        </div>

        {/* Path Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          <PathCard
            title="VerifiedBundle"
            tagline="Fast, simple, broad use"
            whoFor="Developers, legal teams, and anyone who needs to prove a file existed at a specific point in time without storing it on a server."
            whatYouGet={[
              'Client-side SHA-256 hashing',
              'Ed25519 signed seal objects',
              'Portable evidence bundle (ZIP)',
              'Offline verification tool',
              'QR code for sharing',
            ]}
            proofExample="/sample-bundle.zip"
            href={EXTERNAL_LINKS.verifiedBundle}
            cta="Use VerifiedBundle"
            accentColor={COLORS.cyan}
            glowColor={COLORS.cyanGlow}
            external={true}
          />

          <PathCard
            title="AGA Portal"
            tagline="Runtime governance, high-assurance"
            whoFor="Enterprise teams, defense contractors, and critical infrastructure operators who need continuous monitoring and enforcement."
            whatYouGet={[
              'Policy artifact binding',
              'Continuous drift detection',
              'Hash-linked receipt chains',
              'Enforcement actions (ALERT, KILL)',
              'Evidence bundle export',
            ]}
            proofExample="/sample-bundle.zip"
            href={EXTERNAL_LINKS.agaPortal}
            cta="Open AGA Portal"
            accentColor={COLORS.amber}
            glowColor={COLORS.amberGlow}
            external={false}
          />
        </div>
      </div>
    </section>
  );
}

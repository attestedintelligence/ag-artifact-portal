'use client';

import Link from 'next/link';
import { COLORS, EXTERNAL_LINKS } from '@/lib/constants';

export function RegistryCTA() {
  return (
    <section
      className="py-24 px-6 relative overflow-hidden"
      style={{ backgroundColor: COLORS.void }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${COLORS.cyanGlow}, transparent 70%)`,
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <div
          className="p-8 sm:p-12 rounded-2xl border text-center"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.border,
          }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: COLORS.cyanGlow }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: COLORS.cyan }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          {/* Headline */}
          <h2
            className="text-2xl sm:text-3xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Access the Registry
          </h2>

          {/* Description */}
          <p
            className="text-lg mb-8 max-w-xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Browse policy artifacts. Verify signatures. Download evidence bundles.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={EXTERNAL_LINKS.registry}
              className="px-8 py-3.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 w-full sm:w-auto"
              style={{
                backgroundColor: COLORS.cyan,
                color: COLORS.void,
              }}
            >
              Explore Registry
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3.5 rounded-lg text-sm font-medium border transition-all hover:bg-white/5 w-full sm:w-auto"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textSecondary,
              }}
            >
              Read Documentation
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { value: '10K+', label: 'Artifacts Sealed' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '<100ms', label: 'Verification Time' },
          ].map((stat, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border text-center"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              }}
            >
              <div
                className="text-xl sm:text-2xl font-bold font-mono"
                style={{ color: COLORS.cyan }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: COLORS.textMuted }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

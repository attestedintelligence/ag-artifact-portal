'use client';

import Link from 'next/link';
import { COLORS, EXTERNAL_LINKS } from '@/lib/constants';

const capabilities = [
  {
    tag: 'Core',
    tagColor: COLORS.cyan,
    title: 'Agentic Attestation',
    description: 'Proof of agent behavior. Policy artifacts define actions, receipts prove compliance.',
    href: '/platform/agentic-attestation',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    tag: 'Partner',
    tagColor: COLORS.success,
    title: 'AI Forensics',
    description: 'Deepfake detection with cryptographic sealing. Tamper-evident evidence bundles.',
    href: EXTERNAL_LINKS.aiForensics,
    external: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    tag: 'Core',
    tagColor: COLORS.cyan,
    title: 'Policy Artifacts',
    description: 'Signed governance objects. Integrity baselines, enforcement rules, validity windows.',
    href: '/platform/policy-artifacts',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export function Platform() {
  return (
    <section
      className="py-24 px-6"
      style={{ backgroundColor: COLORS.void }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="text-center mb-6">
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: COLORS.textDim }}
          >
            Platform Capabilities
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Active Governance
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Cryptographic enforcement, not just compliance reporting
          </p>
        </div>

        {/* Capability Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {capabilities.map((cap, index) => {
            const CardWrapper = cap.external ? 'a' : Link;
            const linkProps = cap.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

            return (
              <CardWrapper
                key={index}
                href={cap.href}
                {...linkProps}
                className="group p-6 rounded-xl border transition-all duration-200 hover:border-opacity-60"
                style={{
                  backgroundColor: COLORS.card,
                  borderColor: COLORS.border,
                }}
              >
                {/* Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${cap.tagColor}20`,
                      color: cap.tagColor,
                    }}
                  >
                    {cap.tag}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>
                    {cap.icon}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="text-lg font-semibold mb-2 group-hover:opacity-80 transition-opacity"
                  style={{ color: COLORS.textPrimary }}
                >
                  {cap.title}
                  {cap.external && (
                    <svg className="inline-block w-4 h-4 ml-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: COLORS.textSecondary }}
                >
                  {cap.description}
                </p>
              </CardWrapper>
            );
          })}
        </div>

        {/* Verification Flow */}
        <div
          className="mt-16 p-8 rounded-xl border text-center"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.border,
          }}
        >
          <h3
            className="text-lg font-semibold mb-6"
            style={{ color: COLORS.textPrimary }}
          >
            Offline-First. Zero Network Trust.
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📄</span>
              <span style={{ color: COLORS.textSecondary }}>Policy</span>
            </div>
            <span style={{ color: COLORS.textMuted }}>→</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <span style={{ color: COLORS.textSecondary }}>Seal</span>
            </div>
            <span style={{ color: COLORS.textMuted }}>→</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl" style={{ color: COLORS.success }}>✓</span>
              <span style={{ color: COLORS.textSecondary }}>Verify</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              'Evidence bundles verify in air-gapped environments',
              'No cloud dependency for core guarantees',
              'Deterministic verification output',
              'Legally defensible proof of integrity',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: COLORS.success }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

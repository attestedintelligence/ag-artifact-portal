'use client';

import { COLORS } from '@/lib/constants';

const techStack = [
  {
    label: 'Hashing',
    value: 'SHA-256',
    description: 'NIST-approved cryptographic hash function',
  },
  {
    label: 'Signatures',
    value: 'Ed25519',
    description: 'High-speed elliptic curve signatures',
  },
  {
    label: 'Schema',
    value: 'JSON Schema',
    description: 'Deterministic canonicalization (JCS/RFC 8785)',
  },
  {
    label: 'Verification',
    value: 'Offline-First',
    description: 'No network required for proof validation',
  },
];

export function TechFoundation() {
  return (
    <section
      className="py-24 px-6"
      style={{ backgroundColor: COLORS.surface }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Label */}
        <div className="text-center mb-6">
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: COLORS.textDim }}
          >
            Technical Foundation
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Proven Cryptographic Primitives
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Open standards. Auditable. No lock-in.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              }}
            >
              <span
                className="text-[10px] font-medium uppercase tracking-widest"
                style={{ color: COLORS.textDim }}
              >
                {tech.label}
              </span>
              <div
                className="text-xl font-bold mt-1 mb-2 font-mono"
                style={{ color: COLORS.cyan }}
              >
                {tech.value}
              </div>
              <p
                className="text-sm"
                style={{ color: COLORS.textMuted }}
              >
                {tech.description}
              </p>
            </div>
          ))}
        </div>

        {/* Standards Row */}
        <div
          className="flex flex-wrap items-center justify-center gap-6 py-6 rounded-xl border"
          style={{
            backgroundColor: COLORS.card,
            borderColor: COLORS.border,
          }}
        >
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: COLORS.textDim }}
          >
            Standards Compliance:
          </span>
          {['NIST 800-53', 'SOC 2 Type II', 'ISO 27001', 'GDPR'].map((standard, index) => (
            <span
              key={index}
              className="text-sm font-mono px-3 py-1 rounded"
              style={{
                backgroundColor: COLORS.surface,
                color: COLORS.textSecondary,
              }}
            >
              {standard}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

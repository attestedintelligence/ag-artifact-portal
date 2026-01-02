'use client';

import { COLORS } from '@/lib/constants';

const problems = [
  {
    icon: '⚠',
    title: 'Audit Exposure',
    description: 'Logs can be modified. Cryptographic proof makes evidence legally defensible.',
  },
  {
    icon: '⚖',
    title: 'Agent Liability',
    description: 'Autonomous systems need accountability. Provable governance creates it.',
  },
  {
    icon: '🔒',
    title: 'Integrity Drift',
    description: 'Configs change. Dependencies shift. Continuous verification catches drift.',
  },
];

export function Problem() {
  return (
    <section
      className="py-24 px-6 relative overflow-hidden"
      style={{ backgroundColor: COLORS.surface }}
    >
      {/* Subtle red gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${COLORS.errorGlow} 0%, transparent 50%)`,
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Label */}
        <div className="text-center mb-6">
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: COLORS.textDim }}
          >
            The Challenge
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Eliminate Liability
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Passive logs are no longer sufficient. Active governance is required.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border transition-all duration-200 hover:border-opacity-60"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              }}
            >
              <div
                className="text-3xl mb-4"
                role="img"
                aria-label={problem.title}
              >
                {problem.icon}
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: COLORS.textPrimary }}
              >
                {problem.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: COLORS.textSecondary }}
              >
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

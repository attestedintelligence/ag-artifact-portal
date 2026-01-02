'use client';

import Link from 'next/link';
import { COLORS } from '@/lib/constants';

const solutions = [
  {
    icon: '🏢',
    title: 'Enterprise',
    description: 'SOC 2 and ISO 27001 compatible attestation. Integrate with existing compliance workflows.',
    href: '/solutions/enterprise',
    features: [
      'Policy artifact versioning',
      'Role-based access control',
      'Audit-ready evidence exports',
      'SLA-backed support',
    ],
  },
  {
    icon: '🛡',
    title: 'Government & Defense',
    description: 'NIST RMF compatible. FedRAMP-aligned architecture. Built for mission-critical systems.',
    href: '/solutions/government',
    features: [
      'NIST 800-53 control mapping',
      'Air-gapped deployment',
      'HSM integration ready',
      'Classified network support',
    ],
  },
  {
    icon: '⌨',
    title: 'Developers',
    description: 'Open protocol. Self-host capability. Build attestation into your applications.',
    href: '/solutions/developers',
    features: [
      'REST API access',
      'SDK libraries',
      'Docker deployment',
      'Open specification',
    ],
  },
];

export function Solutions() {
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
            Solutions
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Solutions
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            From developers to defense contractors
          </p>
        </div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {solutions.map((solution, index) => (
            <Link
              key={index}
              href={solution.href}
              className="group p-6 rounded-xl border transition-all duration-200 hover:border-opacity-60 flex flex-col"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              }}
            >
              {/* Icon */}
              <div className="text-3xl mb-4">{solution.icon}</div>

              {/* Title */}
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: COLORS.textPrimary }}
              >
                {solution.title}
              </h3>

              {/* Description */}
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: COLORS.textSecondary }}
              >
                {solution.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {solution.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: COLORS.textMuted }}
                  >
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: COLORS.cyan }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
                style={{ color: COLORS.cyan }}
              >
                Learn more
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { COLORS } from '@/lib/constants';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function Step({ number, title, description, icon }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: COLORS.cyanGlow }}
      >
        {icon}
      </div>
      <div
        className="text-xs font-mono mb-2"
        style={{ color: COLORS.cyan }}
      >
        STEP {number}
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: COLORS.textPrimary }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed max-w-xs"
        style={{ color: COLORS.textSecondary }}
      >
        {description}
      </p>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Seal',
      description: 'Hash your file client-side and create a cryptographically signed seal with Ed25519.',
      icon: (
        <svg className="w-7 h-7" style={{ color: COLORS.cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Monitor',
      description: 'Track changes over time with hash-linked receipts that form a tamper-evident chain.',
      icon: (
        <svg className="w-7 h-7" style={{ color: COLORS.cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Verify Offline',
      description: 'Export a portable evidence bundle that anyone can verify air-gapped, no network required.',
      icon: (
        <svg className="w-7 h-7" style={{ color: COLORS.cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <section
      className="py-20 sm:py-24 px-4 sm:px-6"
      style={{ backgroundColor: COLORS.void }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            How it works
          </h2>
          <p
            className="text-base sm:text-lg max-w-xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Three steps to tamper-evident proof
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step) => (
            <Step key={step.number} {...step} />
          ))}
        </div>

        {/* Connector Lines (Desktop) */}
        <div className="hidden md:flex justify-center mt-8">
          <div
            className="flex items-center gap-8"
            style={{ color: COLORS.border }}
          >
            <div className="w-24 h-px" style={{ backgroundColor: COLORS.border }} />
            <svg className="w-4 h-4" style={{ color: COLORS.cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="w-24 h-px" style={{ backgroundColor: COLORS.border }} />
            <svg className="w-4 h-4" style={{ color: COLORS.cyan }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="w-24 h-px" style={{ backgroundColor: COLORS.border }} />
          </div>
        </div>
      </div>
    </section>
  );
}

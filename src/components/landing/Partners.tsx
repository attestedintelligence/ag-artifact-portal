'use client';

import { COLORS, PARTNERS, EXTERNAL_LINKS } from '@/lib/constants';

export function Partners() {
  const partner = PARTNERS.aiForensics;

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
            Featured Partner
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: COLORS.textPrimary }}
          >
            Partner Ecosystem
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.textSecondary }}
          >
            Digital authenticity powered by VerifiedBundle
          </p>
        </div>

        {/* Partner Card */}
        <div className="max-w-4xl mx-auto">
          <a
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-8 sm:p-12 rounded-2xl border transition-all duration-300 hover:border-opacity-60"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.border,
            }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Partner Info */}
              <div>
                {/* Partner Tag */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                    style={{
                      backgroundColor: COLORS.successGlow,
                      color: COLORS.success,
                    }}
                  >
                    Integration Partner
                  </span>
                </div>

                {/* Partner Name */}
                <h3
                  className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  {partner.name}
                  <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </h3>

                {/* Tagline */}
                <p
                  className="text-sm font-medium mb-4"
                  style={{ color: COLORS.cyan }}
                >
                  {partner.tagline}
                </p>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed mb-6"
                  style={{ color: COLORS.textSecondary }}
                >
                  {partner.description}
                </p>

                {/* CTA */}
                <div
                  className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all"
                  style={{ color: COLORS.success }}
                >
                  Visit aiforensics.ai
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* Right: Features */}
              <div
                className="p-6 rounded-xl"
                style={{ backgroundColor: COLORS.surface }}
              >
                <h4
                  className="text-xs font-medium uppercase tracking-wider mb-4"
                  style={{ color: COLORS.textDim }}
                >
                  Powered by VerifiedBundle
                </h4>
                <ul className="space-y-3">
                  {partner.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: COLORS.success }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span
                        className="text-sm"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </a>
        </div>

        {/* Become a Partner CTA */}
        <div className="text-center mt-12">
          <a
            href={EXTERNAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:opacity-80"
            style={{ color: COLORS.textMuted }}
          >
            Interested in partnering?
            <span style={{ color: COLORS.cyan }}>Get in touch →</span>
          </a>
        </div>
      </div>
    </section>
  );
}

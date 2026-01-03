'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COLORS, NAV_LINKS, EXTERNAL_LINKS } from '@/lib/constants';

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: `${COLORS.void}F2`,
        borderColor: COLORS.border,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <span
              className="text-xl font-bold"
              style={{ color: COLORS.cyan }}
            >
              ◈
            </span>
            <span
              className="font-semibold text-sm sm:text-base"
              style={{ color: COLORS.textPrimary }}
            >
              Attested Intelligence
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Products */}
            {NAV_LINKS.products.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: COLORS.textSecondary }}
              >
                {item.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="w-px h-4" style={{ backgroundColor: COLORS.border }} />

            {/* Resources */}
            {NAV_LINKS.resources.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: COLORS.textSecondary }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href={EXTERNAL_LINKS.verifiedBundle}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium px-4 py-2 rounded-md border transition-all hover:bg-white/5"
              style={{
                color: COLORS.textSecondary,
                borderColor: COLORS.border,
              }}
            >
              VerifiedBundle
            </Link>
            <Link
              href={EXTERNAL_LINKS.agaPortal}
              className="text-sm font-medium px-4 py-2 rounded-md transition-all hover:opacity-90"
              style={{
                backgroundColor: COLORS.cyan,
                color: COLORS.void,
              }}
            >
              Launch Portal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md"
            style={{ color: COLORS.textSecondary }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden py-4 border-t"
            style={{ borderColor: COLORS.border }}
          >
            <div className="space-y-4">
              {/* Products */}
              <div>
                <div
                  className="text-xs font-medium uppercase tracking-wider mb-3"
                  style={{ color: COLORS.textDim }}
                >
                  Products
                </div>
                <div className="space-y-4">
                  {NAV_LINKS.products.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-3 px-4 rounded-lg text-center"
                      style={{ backgroundColor: COLORS.surface }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="font-medium mb-1" style={{ color: COLORS.textPrimary }}>
                        {item.label}
                      </div>
                      <div className="text-xs" style={{ color: COLORS.textMuted }}>
                        <div>{item.description}</div>
                        {'description2' in item && <div>{item.description2}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <div
                  className="text-xs font-medium uppercase tracking-wider mb-2"
                  style={{ color: COLORS.textDim }}
                >
                  Resources
                </div>
                <div className="space-y-1">
                  {NAV_LINKS.resources.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2 text-sm"
                      style={{ color: COLORS.textSecondary }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div>
                <div
                  className="text-xs font-medium uppercase tracking-wider mb-2"
                  style={{ color: COLORS.textDim }}
                >
                  Company
                </div>
                <div className="space-y-1">
                  {NAV_LINKS.company.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block py-2 text-sm"
                      style={{ color: COLORS.textSecondary }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href={EXTERNAL_LINKS.verifiedBundle}
                  target="_blank"
                  className="text-center text-sm font-medium px-4 py-3 rounded-md border"
                  style={{
                    color: COLORS.textSecondary,
                    borderColor: COLORS.border,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  VerifiedBundle
                </Link>
                <Link
                  href={EXTERNAL_LINKS.agaPortal}
                  className="text-center text-sm font-medium px-4 py-3 rounded-md"
                  style={{
                    backgroundColor: COLORS.cyan,
                    color: COLORS.void,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Launch Portal
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

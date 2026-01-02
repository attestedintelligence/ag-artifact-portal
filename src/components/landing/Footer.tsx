'use client';

import Link from 'next/link';
import { COLORS, EXTERNAL_LINKS, SITE_CONFIG, CRYPTO_STANDARDS } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Docs', href: '/docs' },
    { label: 'Trust', href: '/trust' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
    { label: 'Legal', href: '/legal' },
  ];

  return (
    <footer
      className="py-12 sm:py-16 px-4 sm:px-6 border-t"
      style={{
        backgroundColor: COLORS.void,
        borderColor: COLORS.border,
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          {/* Logo & Tagline */}
          <div className="text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-3 mb-2">
              <span
                className="text-xl font-bold"
                style={{ color: COLORS.cyan }}
              >
                ◈
              </span>
              <span
                className="font-semibold"
                style={{ color: COLORS.textPrimary }}
              >
                Attested Intelligence
              </span>
            </Link>
            <p
              className="text-sm"
              style={{ color: COLORS.textMuted }}
            >
              {SITE_CONFIG.shortDescription}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:opacity-80"
                style={{ color: COLORS.textSecondary }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Crypto Standards */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 py-4 mb-8 rounded-lg"
          style={{ backgroundColor: COLORS.surface }}
        >
          {CRYPTO_STANDARDS.map((standard, index) => (
            <span
              key={index}
              className="text-xs font-mono"
              style={{ color: COLORS.textMuted }}
            >
              {standard}
              {index < CRYPTO_STANDARDS.length - 1 && (
                <span className="ml-4" style={{ color: COLORS.border }}>|</span>
              )}
            </span>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t text-xs"
          style={{
            borderColor: COLORS.border,
            color: COLORS.textDim,
          }}
        >
          <span> {currentYear} Attested Intelligence. {SITE_CONFIG.location}.</span>
          <div className="flex items-center gap-4">
            <Link
              href="/legal#privacy"
              className="transition-colors hover:opacity-80"
              style={{ color: COLORS.textMuted }}
            >
              Privacy
            </Link>
            <Link
              href="/legal#terms"
              className="transition-colors hover:opacity-80"
              style={{ color: COLORS.textMuted }}
            >
              Terms
            </Link>
            <Link
              href={EXTERNAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:opacity-80"
              style={{ color: COLORS.textMuted }}
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Metadata } from 'next';
import { Nav, Footer } from '@/components/landing';
import { COLORS, PARTNERS, EXTERNAL_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Partners | Attested Intelligence',
  description: 'Explore our partner ecosystem. AI Forensics uses VerifiedBundle for deepfake detection and digital provenance verification.',
  openGraph: {
    title: 'Partners | Attested Intelligence',
    description: 'Our partner ecosystem for cryptographic attestation.',
  },
};

export default function PartnersPage() {
  const partner = PARTNERS.aiForensics;

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: COLORS.textDim }}>
              Partners
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-6" style={{ color: COLORS.textPrimary }}>
              Partner Ecosystem
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textSecondary }}>
              Building the future of digital authenticity together
            </p>
          </div>

          {/* Featured Partner */}
          <div className="max-w-4xl mx-auto mb-16">
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-8 sm:p-12 rounded-2xl border transition-all hover:border-opacity-60"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded"
                  style={{ backgroundColor: COLORS.successGlow, color: COLORS.success }}
                >
                  Featured Partner
                </span>
              </div>

              <h2 className="text-3xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>
                {partner.name}
              </h2>
              <p className="text-lg font-medium mb-4" style={{ color: COLORS.cyan }}>
                {partner.tagline}
              </p>
              <p className="text-base leading-relaxed mb-8" style={{ color: COLORS.textSecondary }}>
                {partner.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {partner.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.success }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>{feature}</span>
                  </div>
                ))}
              </div>
            </a>
          </div>

          {/* Become a Partner */}
          <div
            className="text-center p-8 rounded-xl border"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <h3 className="text-xl font-semibold mb-4" style={{ color: COLORS.textPrimary }}>
              Become a Partner
            </h3>
            <p className="text-sm mb-6 max-w-xl mx-auto" style={{ color: COLORS.textSecondary }}>
              Integrate VerifiedBundle or the AGA Protocol into your products. Join our ecosystem of digital authenticity solutions.
            </p>
            <a
              href={EXTERNAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-8 py-3.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.cyan, color: COLORS.void }}
            >
              Contact Partnership Team
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

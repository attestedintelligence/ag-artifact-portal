import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { COLORS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Government & Defense Solutions | Attested Intelligence',
  description: 'NIST RMF compatible cryptographic attestation for government and defense. FedRAMP-aligned architecture for mission-critical autonomous systems.',
  openGraph: {
    title: 'Government & Defense Solutions | Attested Intelligence',
    description: 'NIST RMF compatible cryptographic attestation for government and defense.',
  },
};

const features = [
  { title: 'NIST 800-53 Mapping', description: 'Direct control mapping to NIST security framework requirements.' },
  { title: 'Air-Gapped Deployment', description: 'Fully offline operation with no external network dependencies.' },
  { title: 'HSM Integration', description: 'Hardware security module support for key management.' },
  { title: 'Classified Networks', description: 'Deployment options for IL4/IL5 classified environments.' },
  { title: 'FedRAMP Aligned', description: 'Architecture designed for FedRAMP authorization pathway.' },
  { title: 'CMMC Ready', description: 'Controls aligned with CMMC 2.0 requirements.' },
];

export default function GovernmentPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: COLORS.textDim }}>
              Government & Defense
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-6" style={{ color: COLORS.textPrimary }}>
              Mission-Critical Attestation
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textSecondary }}>
              NIST RMF compatible. Built for the highest security requirements of government and defense operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex px-8 py-3.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.cyan, color: COLORS.void }}
            >
              Request Briefing
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

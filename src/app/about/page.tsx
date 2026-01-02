import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { COLORS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About | Attested Intelligence',
  description: 'Attested Intelligence builds cryptographic attestation infrastructure for autonomous AI systems. The trust layer for the agentic future.',
  openGraph: {
    title: 'About | Attested Intelligence',
    description: 'The trust layer for autonomous AI systems.',
  },
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: COLORS.textPrimary }}>
              About Attested Intelligence
            </h1>
            <p className="text-lg" style={{ color: COLORS.textSecondary }}>
              Building the trust infrastructure for autonomous AI
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8">
            <div className="p-8 rounded-xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.textPrimary }}>Our Mission</h2>
              <p className="text-base leading-relaxed" style={{ color: COLORS.textSecondary }}>
                As AI agents proliferate across industries, organizations face unprecedented accountability challenges.
                Traditional audit logs can be modified, passive compliance is legally contestable, and there is no
                standard for proving what an autonomous system actually did.
              </p>
              <p className="text-base leading-relaxed mt-4" style={{ color: COLORS.textSecondary }}>
                Attested Intelligence transforms passive audit logging into active compliance enforcement.
                Our cryptographic attestation platform generates mathematical proof of system behavior,
                creating tamper-evident audit trails that verify offline and stand up in court.
              </p>
            </div>

            <div className="p-8 rounded-xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.textPrimary }}>Technology</h2>
              <p className="text-base leading-relaxed" style={{ color: COLORS.textSecondary }}>
                Built on proven cryptographic primitives: Ed25519 signatures, SHA-256 hashing, and deterministic
                canonicalization (JCS/RFC 8785). Our evidence bundles verify in air-gapped environments with no
                network dependencies.
              </p>
              <p className="text-base leading-relaxed mt-4" style={{ color: COLORS.textSecondary }}>
                Patent pending: &ldquo;Systems and Methods for Generating Attested Governance Artifacts&rdquo; (USPTO application filed).
              </p>
            </div>

            <div className="text-center pt-8">
              <Link
                href="/contact"
                className="inline-flex px-8 py-3.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: COLORS.cyan, color: COLORS.void }}
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { COLORS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Platform | Attested Intelligence',
  description: 'Cryptographic attestation platform for runtime integrity, AI governance, and tamper-evident audit trails. Explore agentic attestation, policy artifacts, and evidence bundles.',
  openGraph: {
    title: 'Platform | Attested Intelligence',
    description: 'Cryptographic attestation platform for runtime integrity and AI governance.',
  },
};

const features = [
  {
    title: 'Agentic Attestation',
    description: 'Cryptographic proof of agent behavior. Policy artifacts define allowed actions, enforcement receipts prove compliance.',
    href: '/platform/agentic-attestation',
  },
  {
    title: 'Policy Artifacts',
    description: 'Signed, versioned governance objects. Define integrity baselines, enforcement rules, and validity windows.',
    href: '/platform/policy-artifacts',
  },
  {
    title: 'Evidence Bundles',
    description: 'Portable verification packages. Export complete audit trails that verify in air-gapped environments.',
    href: '/platform/evidence-bundles',
  },
];

export default function PlatformPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: COLORS.textDim }}>
              Platform
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-6" style={{ color: COLORS.textPrimary }}>
              The Trust Layer for Autonomous Agents
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textSecondary }}>
              Transform compliance from a reporting exercise into cryptographic enforcement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group p-8 rounded-xl border transition-all hover:border-opacity-60"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
              >
                <h2 className="text-xl font-semibold mb-3" style={{ color: COLORS.textPrimary }}>
                  {feature.title}
                </h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.textSecondary }}>
                  {feature.description}
                </p>
                <span className="text-sm font-medium group-hover:underline" style={{ color: COLORS.cyan }}>
                  Learn more →
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex px-8 py-3.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.cyan, color: COLORS.void }}
            >
              Launch Portal
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { COLORS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Enterprise Solutions | Attested Intelligence',
  description: 'SOC 2 and ISO 27001 compatible cryptographic attestation for enterprise. Policy artifact versioning, role-based access, and audit-ready evidence exports.',
  openGraph: {
    title: 'Enterprise Solutions | Attested Intelligence',
    description: 'SOC 2 and ISO 27001 compatible cryptographic attestation for enterprise.',
  },
};

const features = [
  { title: 'Policy Versioning', description: 'Track every change to governance policies with cryptographic signatures.' },
  { title: 'Role-Based Access', description: 'Fine-grained permissions for policy creation, approval, and audit.' },
  { title: 'Audit-Ready Exports', description: 'Generate compliance reports with offline-verifiable evidence bundles.' },
  { title: 'SLA-Backed Support', description: '24/7 enterprise support with guaranteed response times.' },
  { title: 'SSO Integration', description: 'SAML and OIDC support for seamless identity management.' },
  { title: 'Private Deployment', description: 'On-premises or private cloud deployment options available.' },
];

export default function EnterprisePage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: COLORS.textDim }}>
              Enterprise
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-6" style={{ color: COLORS.textPrimary }}>
              Enterprise-Grade Attestation
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textSecondary }}>
              SOC 2 and ISO 27001 compatible. Built for organizations that demand the highest standards of compliance.
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
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

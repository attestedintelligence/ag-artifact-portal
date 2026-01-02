import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { COLORS, EXTERNAL_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Developer Solutions | Attested Intelligence',
  description: 'Open protocol for cryptographic attestation. REST APIs, SDK libraries, Docker deployment, and self-host capability for developers.',
  openGraph: {
    title: 'Developer Solutions | Attested Intelligence',
    description: 'Open protocol for cryptographic attestation. Build attestation into your applications.',
  },
};

const features = [
  { title: 'REST API', description: 'Full-featured API for policy creation, sealing, and verification.' },
  { title: 'SDK Libraries', description: 'Native libraries for JavaScript, Python, Go, and Rust.' },
  { title: 'Docker Deployment', description: 'Container-ready deployment with Docker Compose.' },
  { title: 'Open Specification', description: 'Published protocol specification for interoperability.' },
  { title: 'Self-Host Option', description: 'Run your own attestation infrastructure on-premises.' },
  { title: 'Webhook Events', description: 'Real-time notifications for policy and enforcement events.' },
];

export default function DevelopersPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: COLORS.textDim }}>
              Developers
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-6" style={{ color: COLORS.textPrimary }}>
              Build with Attestation
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textSecondary }}>
              Open protocol. Self-host capability. Integrate cryptographic attestation into your applications.
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/docs"
              className="px-8 py-3.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.cyan, color: COLORS.void }}
            >
              Read Documentation
            </Link>
            <a
              href={EXTERNAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
            >
              View on GitHub
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

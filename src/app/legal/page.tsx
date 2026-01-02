import { Metadata } from 'next';
import { Nav, Footer } from '@/components/landing';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Legal | Attested Intelligence',
  description: 'Terms of service, privacy policy, and legal disclosures.',
  openGraph: {
    title: 'Legal | Attested Intelligence',
    description: 'Terms of service, privacy policy, and legal disclosures.',
    url: `https://${SITE_CONFIG.domain}/legal`,
  },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
      <div className="text-gray-400 space-y-4 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function LegalPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Header */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Legal
            </h1>
            <p className="text-lg text-gray-400">
              Terms of service, privacy policy, and disclosures.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Last updated: January 2025
            </p>
          </div>
        </section>

        {/* Navigation */}
        <section className="py-8 px-4 sm:px-6 border-b" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto flex flex-wrap gap-4 justify-center">
            <a href="#terms" className="text-sm hover:opacity-80" style={{ color: '#00D4FF' }}>Terms of Service</a>
            <a href="#privacy" className="text-sm hover:opacity-80" style={{ color: '#00D4FF' }}>Privacy Policy</a>
            <a href="#security" className="text-sm hover:opacity-80" style={{ color: '#00D4FF' }}>Security</a>
            <a href="#disclaimer" className="text-sm hover:opacity-80" style={{ color: '#00D4FF' }}>Disclaimer</a>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <Section id="terms" title="Terms of Service">
              <p>
                By accessing or using Attested Intelligence services (&quot;Services&quot;), you agree to be bound by these terms. If you do not agree, do not use the Services.
              </p>
              <p><strong className="text-white">Service Description.</strong> We provide cryptographic attestation tools that create tamper-evident seals and evidence bundles. We do not store your files; only hashes and metadata are retained.</p>
              <p><strong className="text-white">Account Responsibilities.</strong> You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use.</p>
              <p><strong className="text-white">Acceptable Use.</strong> You agree not to use the Services for any unlawful purpose, to violate any laws, or to infringe on the rights of others.</p>
              <p><strong className="text-white">Intellectual Property.</strong> All content, features, and functionality are owned by Attested Intelligence and are protected by intellectual property laws.</p>
              <p><strong className="text-white">Termination.</strong> We may terminate or suspend your access immediately, without prior notice, for any breach of these terms.</p>
              <p><strong className="text-white">Modifications.</strong> We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.</p>
            </Section>

            <Section id="privacy" title="Privacy Policy">
              <p><strong className="text-white">Data We Collect.</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address (for account and magic link authentication)</li>
                <li>Vault ID (generated unique identifier)</li>
                <li>Seal metadata (hash, timestamp, description)</li>
                <li>Usage data (pages visited, features used)</li>
              </ul>
              <p><strong className="text-white">Data We Do Not Collect.</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your files (hashed client-side, never uploaded)</li>
                <li>File contents or names (unless you provide them as description)</li>
                <li>Payment details (handled by Stripe)</li>
              </ul>
              <p><strong className="text-white">How We Use Data.</strong> To provide and improve the Services, send transactional emails, and respond to support requests.</p>
              <p><strong className="text-white">Data Sharing.</strong> We do not sell your data. We may share data with service providers (hosting, email) necessary to operate the Services.</p>
              <p><strong className="text-white">Data Retention.</strong> Account data is retained while your account is active. Seal metadata is retained indefinitely as it forms part of the cryptographic chain.</p>
              <p><strong className="text-white">Your Rights.</strong> You may request access to, correction of, or deletion of your personal data by contacting us.</p>
            </Section>

            <Section id="security" title="Security">
              <p><strong className="text-white">Cryptographic Standards.</strong> We use SHA-256 for hashing and Ed25519 for signatures. All signatures are computed over canonicalized JSON (RFC 8785).</p>
              <p><strong className="text-white">Data Protection.</strong> Data in transit is encrypted via TLS. Data at rest is encrypted at the database level.</p>
              <p><strong className="text-white">No File Storage.</strong> Files are hashed client-side. We never receive or store your original files.</p>
              <p><strong className="text-white">Vulnerability Disclosure.</strong> If you discover a security vulnerability, please report it to security@attestedintelligence.com.</p>
            </Section>

            <Section id="disclaimer" title="Disclaimer">
              <p><strong className="text-white">No Warranty.</strong> The Services are provided &quot;as is&quot; without warranty of any kind, express or implied.</p>
              <p><strong className="text-white">Limitation of Liability.</strong> In no event shall Attested Intelligence be liable for any indirect, incidental, special, or consequential damages.</p>
              <p><strong className="text-white">Claim Boundaries.</strong> The system proves what policy was minted, what inputs were received, and what enforcement occurred—with cryptographic evidence. The system does not prove absolute security of your environment, unbypassable enforcement outside governed runs, or correctness of external sensors.</p>
              <p><strong className="text-white">Governing Law.</strong> These terms are governed by the laws of the United States.</p>
            </Section>

            <div className="pt-8 border-t text-center" style={{ borderColor: '#1A1A1A' }}>
              <p className="text-gray-500 text-sm">
                Questions? Contact us at legal@attestedintelligence.com
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

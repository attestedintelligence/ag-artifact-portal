import { Metadata } from 'next';
import { Nav, Footer } from '@/components/landing';
import { COLORS, EXTERNAL_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact | Attested Intelligence',
  description: 'Get in touch with Attested Intelligence. Enterprise sales, technical support, and partnership inquiries.',
  openGraph: {
    title: 'Contact | Attested Intelligence',
    description: 'Get in touch with our team.',
  },
};

const contactOptions = [
  {
    title: 'Enterprise Sales',
    description: 'Discuss enterprise deployments, custom integrations, and volume licensing.',
    email: 'sales@attestedintelligence.com',
    icon: '🏢',
  },
  {
    title: 'Technical Support',
    description: 'Get help with implementation, API questions, and troubleshooting.',
    email: 'support@attestedintelligence.com',
    icon: '🛠',
  },
  {
    title: 'Partnerships',
    description: 'Explore integration opportunities and partnership programs.',
    email: 'partners@attestedintelligence.com',
    icon: '🤝',
  },
];

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16" style={{ backgroundColor: COLORS.void }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: COLORS.textPrimary }}>
              Contact Us
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: COLORS.textSecondary }}>
              We are here to help with your attestation needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {contactOptions.map((option, index) => (
              <div
                key={index}
                className="p-8 rounded-xl border text-center"
                style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
              >
                <div className="text-4xl mb-4">{option.icon}</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
                  {option.title}
                </h3>
                <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
                  {option.description}
                </p>
                <a
                  href={`mailto:${option.email}`}
                  className="inline-flex text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: COLORS.cyan }}
                >
                  {option.email}
                </a>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div
            className="text-center p-8 rounded-xl border"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.textPrimary }}>
              Connect With Us
            </h3>
            <div className="flex items-center justify-center gap-6">
              <a
                href={EXTERNAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: COLORS.textSecondary }}
              >
                GitHub
              </a>
              <a
                href={EXTERNAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: COLORS.textSecondary }}
              >
                Twitter
              </a>
              <a
                href={EXTERNAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: COLORS.textSecondary }}
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

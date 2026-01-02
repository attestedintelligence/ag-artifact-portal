import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { SITE_CONFIG, EXTERNAL_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Pricing | Attested Intelligence',
  description: 'Simple pricing for VerifiedBundle and AGA Portal. Start free, upgrade for more seals and enterprise features.',
  openGraph: {
    title: 'Pricing | Attested Intelligence',
    description: 'Simple pricing for VerifiedBundle and AGA Portal.',
    url: `https://${SITE_CONFIG.domain}/pricing`,
  },
};

function PricingCard({
  tier,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
}: {
  tier: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-6 sm:p-8 relative"
      style={{
        backgroundColor: highlighted ? 'rgba(0, 212, 255, 0.03)' : '#141414',
        borderColor: highlighted ? 'rgba(0, 212, 255, 0.3)' : '#1A1A1A',
      }}
    >
      {highlighted && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#00D4FF', color: '#0A0A0A' }}
        >
          Most Popular
        </div>
      )}
      <div className="text-sm font-mono mb-2" style={{ color: '#00D4FF' }}>{tier}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-gray-500">{period}</span>
      </div>
      <p className="text-sm text-gray-400 mb-6">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#00D4FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="block w-full py-3 rounded-lg text-center text-sm font-medium transition-all"
        style={{
          backgroundColor: highlighted ? '#00D4FF' : 'transparent',
          color: highlighted ? '#0A0A0A' : '#A3A3A3',
          border: highlighted ? 'none' : '1px solid #1A1A1A',
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Header */}
        <section className="py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Simple pricing
            </h1>
            <p className="text-lg text-gray-400">
              Start free. Upgrade when you need more seals or enterprise features.
            </p>
          </div>
        </section>

        {/* Pricing Grid */}
        <section className="pb-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <PricingCard
                tier="FREE"
                price="$0"
                period="/month"
                description="For individuals and small projects"
                features={[
                  '15 seals per month',
                  'Client-side hashing',
                  'Verification links',
                  'QR code sharing',
                  'Community support',
                ]}
                cta="Get Started"
                ctaHref={EXTERNAL_LINKS.verifiedBundle}
              />
              <PricingCard
                tier="PRO"
                price="$29"
                period="/month"
                description="For teams and serious users"
                features={[
                  '50 seals per month',
                  'Evidence bundle export (ZIP)',
                  'Vault history & search',
                  'Offline verifier included',
                  'Priority support',
                ]}
                cta="Upgrade to Pro"
                ctaHref="/login"
                highlighted={true}
              />
              <PricingCard
                tier="ENTERPRISE"
                price="Custom"
                period=""
                description="For organizations with compliance requirements"
                features={[
                  'Unlimited seals',
                  'On-premise deployment',
                  'Customer-held signing keys',
                  'HSM/KMS integration',
                  'SLA & dedicated support',
                  'Custom integrations',
                ]}
                cta="Contact Sales"
                ctaHref="/contact"
              />
            </div>
          </div>
        </section>

        {/* AGA Portal Pricing */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-sm font-mono mb-2" style={{ color: '#FFB800' }}>AGA PORTAL</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Enterprise licensing
              </h2>
              <p className="text-gray-400">
                Runtime governance with policy artifacts, enforcement receipts, and offline verification.
              </p>
            </div>
            <div
              className="p-6 sm:p-8 rounded-xl border"
              style={{ backgroundColor: '#141414', borderColor: 'rgba(255, 184, 0, 0.2)' }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="font-medium text-white mb-3">Includes:</div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Policy artifact binding
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Continuous drift detection
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enforcement actions (ALERT, KILL)
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Hash-linked receipt chains
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Evidence bundle export
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium text-white mb-3">Deployment options:</div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>Docker Compose (single host)</li>
                    <li>Kubernetes (Enterprise)</li>
                    <li>Air-gapped environments</li>
                  </ul>
                  <div className="mt-6">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                      style={{ backgroundColor: '#FFB800', color: '#0A0A0A' }}
                    >
                      Request Evaluation
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently asked</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-white mb-2">What counts as a seal?</h3>
                <p className="text-sm text-gray-400">Each file or text input that you seal counts as one seal. Verifications are unlimited.</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-sm text-gray-400">Yes. Monthly subscriptions can be cancelled anytime. No long-term commitments.</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Do you store my files?</h3>
                <p className="text-sm text-gray-400">No. Files are hashed client-side. Only the hash and metadata are stored.</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">What payment methods do you accept?</h3>
                <p className="text-sm text-gray-400">Credit cards via Stripe. Enterprise invoicing available for annual contracts.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

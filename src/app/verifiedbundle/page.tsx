import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { EXTERNAL_LINKS, SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'VerifiedBundle | Seal any file. Prove it later.',
  description: 'Generate a tamper-evident evidence bundle with an offline verifier. Client-side hashing, Ed25519 signatures, no file storage.',
  openGraph: {
    title: 'VerifiedBundle | Seal any file. Prove it later.',
    description: 'Generate a tamper-evident evidence bundle with an offline verifier.',
    url: `https://${SITE_CONFIG.domain}/verifiedbundle`,
  },
};

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)' }}
      >
        <svg className="w-3.5 h-3.5" style={{ color: '#00D4FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <div className="font-medium text-white mb-1">{title}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
    </div>
  );
}

function VerifierDemo({ variant }: { variant: 'pass' | 'fail' }) {
  const isPass = variant === 'pass';
  return (
    <div
      className="rounded-lg border overflow-hidden font-mono text-xs"
      style={{
        backgroundColor: '#111111',
        borderColor: '#1A1A1A',
      }}
    >
      <div
        className="px-4 py-2 border-b flex items-center justify-between"
        style={{ borderColor: '#1A1A1A', backgroundColor: '#141414' }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22C55E' }} />
        </div>
        <span className="text-gray-500">{isPass ? 'verify bundle.zip' : 'verify tampered.zip'}</span>
      </div>
      <div className="p-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">artifact:</span>
          <span style={{ color: isPass ? '#22C55E' : '#EF4444' }}>{isPass ? 'OK' : 'FAIL'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">receipts:</span>
          <span style={{ color: isPass ? '#22C55E' : '#EF4444' }}>{isPass ? 'OK (3/3)' : 'INVALID'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">chain:</span>
          <span style={{ color: isPass ? '#22C55E' : '#EF4444' }}>{isPass ? 'OK' : 'HASH_MISMATCH'}</span>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">overall:</span>
            <span className="font-bold" style={{ color: isPass ? '#22C55E' : '#EF4444' }}>
              {isPass ? 'PASS' : 'FAIL'}
            </span>
          </div>
          {!isPass && (
            <div className="mt-1 text-xs" style={{ color: '#EF4444' }}>
              error: RECEIPT_SIGNATURE_INVALID (receipts/0002.json)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  tier,
  price,
  features,
  cta,
  highlighted = false,
}: {
  tier: string;
  price: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: highlighted ? 'rgba(0, 212, 255, 0.05)' : '#141414',
        borderColor: highlighted ? 'rgba(0, 212, 255, 0.3)' : '#1A1A1A',
      }}
    >
      <div className="text-sm font-mono mb-2" style={{ color: '#00D4FF' }}>{tier}</div>
      <div className="text-2xl font-bold text-white mb-4">{price}</div>
      <ul className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
            <svg className="w-4 h-4" style={{ color: '#00D4FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={highlighted ? '/pricing' : '/contact'}
        className="block w-full py-2.5 rounded-lg text-center text-sm font-medium transition-all"
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

export default function VerifiedBundlePage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Hero Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Seal any file. Prove it later.
              </h1>
              <p className="text-base sm:text-lg max-w-2xl mx-auto text-gray-400">
                Generate a tamper-evident evidence bundle with an offline verifier—no accounts required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href={EXTERNAL_LINKS.verifiedBundle}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium transition-all hover:opacity-90 text-center"
                style={{ backgroundColor: '#00D4FF', color: '#0A0A0A' }}
              >
                Seal a File
              </Link>
              <Link
                href="/verify"
                className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium border transition-all hover:bg-white/5 text-center"
                style={{ borderColor: '#1A1A1A', color: 'white' }}
              >
                Verify a Bundle
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-white text-center">What you get</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <FeatureItem
                title="Client-side hashing"
                description="Your file never leaves your device. SHA-256 hash computed in the browser."
              />
              <FeatureItem
                title="Ed25519 signed seal"
                description="Cryptographic signature proves the seal was created by a known issuer."
              />
              <FeatureItem
                title="Evidence bundle (ZIP)"
                description="Portable package containing policy, receipts, chain state, and verifier."
              />
              <FeatureItem
                title="Offline verifier"
                description="Standalone tool that checks signatures and chains without network access."
              />
              <FeatureItem
                title="Tamper detection"
                description="Any modification to the file or seal is cryptographically detectable."
              />
              <FeatureItem
                title="Shareable QR code"
                description="Verification link embedded in a scannable code for easy distribution."
              />
            </div>
          </div>
        </section>

        {/* Proof Section */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white text-center">See it work</h2>
            <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
              Download a sample bundle and run the verifier. Modify any receipt to see tamper detection in action.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider mb-3 text-gray-500">
                  Valid bundle
                </div>
                <VerifierDemo variant="pass" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider mb-3 text-gray-500">
                  Tampered bundle
                </div>
                <VerifierDemo variant="fail" />
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/sample-bundle.zip"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
                style={{ borderColor: '#1A1A1A', color: '#00D4FF' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download sample bundle.zip
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white text-center">Simple pricing</h2>
            <p className="text-gray-400 text-center mb-12">
              Start free. Upgrade for more seals and bundle exports.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <PricingCard
                tier="FREE"
                price="$0/mo"
                features={[
                  '15 seals/month',
                  'Client-side hashing',
                  'Verification links',
                  'Basic support',
                ]}
                cta="Get Started"
              />
              <PricingCard
                tier="PRO"
                price="$29/mo"
                features={[
                  '50 seals/month',
                  'Evidence bundle export',
                  'Vault history',
                  'Priority support',
                ]}
                cta="Upgrade"
                highlighted={true}
              />
              <PricingCard
                tier="ENTERPRISE"
                price="Custom"
                features={[
                  'Unlimited seals',
                  'On-prem verifier',
                  'Custom signing keys',
                  'SLA & dedicated support',
                ]}
                cta="Contact Sales"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

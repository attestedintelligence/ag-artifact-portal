import { Metadata } from 'next';
import {
  Nav,
  Hero,
  HowItWorks,
  ChoosePath,
  Footer,
} from '@/components/landing';
import { SITE_CONFIG, SCHEMA_ORG } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  keywords: [
    'software attestation',
    'offline verification',
    'tamper-evident evidence',
    'integrity monitoring',
    'evidence bundle',
    'cryptographic proof',
    'Ed25519 signatures',
    'SHA-256 hashing',
    'file integrity',
    'digital provenance',
  ],
  openGraph: {
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.shortDescription,
    url: `https://${SITE_CONFIG.domain}`,
    siteName: SITE_CONFIG.name,
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.shortDescription,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `https://${SITE_CONFIG.domain}`,
  },
};

export default function LandingPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SCHEMA_ORG),
        }}
      />

      <main className="min-h-screen">
        <Nav />
        <Hero />
        <HowItWorks />
        <ChoosePath />
        <Footer />
      </main>
    </>
  );
}

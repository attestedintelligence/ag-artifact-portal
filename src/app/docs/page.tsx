import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Documentation | Attested Intelligence',
  description: 'Quickstart guides, bundle format reference, verifier commands, and threat model documentation.',
  openGraph: {
    title: 'Documentation | Attested Intelligence',
    description: 'Quickstart guides, bundle format reference, verifier commands, and threat model documentation.',
    url: `https://${SITE_CONFIG.domain}/docs`,
  },
};

function DocCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="block p-6 rounded-lg border transition-all hover:scale-[1.01] hover:border-gray-600"
      style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
    >
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Header */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Documentation
            </h1>
            <p className="text-lg text-gray-400">
              Everything you need to seal, verify, and integrate.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Quickstart */}
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-6 text-white">Quickstart</h2>
              <div
                className="p-6 rounded-lg border"
                style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
              >
                <ol className="space-y-4 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono" style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF' }}>1</span>
                    <div>
                      <div className="font-medium text-white">Seal your file</div>
                      <p className="text-sm">Upload or drag a file. SHA-256 hash computed client-side. Click &quot;Seal&quot; to create signed proof.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono" style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF' }}>2</span>
                    <div>
                      <div className="font-medium text-white">Export evidence bundle</div>
                      <p className="text-sm">Download bundle.zip containing policy, receipts, chain state, and offline verifier.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono" style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF' }}>3</span>
                    <div>
                      <div className="font-medium text-white">Verify offline</div>
                      <p className="text-sm">Run <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ backgroundColor: '#1A1A1A' }}>node verify.js bundle.zip</code> to check signatures and chains. Returns PASS or FAIL.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono" style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF' }}>4</span>
                    <div>
                      <div className="font-medium text-white">Test tamper detection</div>
                      <p className="text-sm">Modify any receipt JSON by 1 character. Re-run verifier. Should return FAIL with error code.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Doc Links */}
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-6 text-white">Reference</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <DocCard
                  title="Bundle Format"
                  description="File tree structure and what each file proves. Manifest checksums, policy binding, receipt schema."
                  href="/docs/bundle-format"
                />
                <DocCard
                  title="Verifier Commands"
                  description="CLI usage, output schema, error codes (POLICY_ID_MISMATCH, RECEIPT_SIGNATURE_INVALID, etc)."
                  href="/docs/verifier"
                />
                <DocCard
                  title="Threat Model"
                  description="What we protect against and what we don't. Adversary assumptions and security guarantees."
                  href="/trust"
                />
                <DocCard
                  title="API Reference"
                  description="REST endpoints for sealing, verification, and bundle export. Authentication and rate limits."
                  href="/docs/api"
                />
              </div>
            </div>

            {/* Receipt Schema */}
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-6 text-white">Receipt Schema</h2>
              <div
                className="p-4 rounded-lg border font-mono text-xs overflow-x-auto"
                style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
              >
                <pre className="text-gray-400">{`{
  "receipt_v": "1",
  "receipt_id": "hex",
  "run_id": "hex",
  "counter": 1,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "event_type": "MEASUREMENT_OK | DRIFT_DETECTED | ENFORCED",
  "decision": {
    "action": "CONTINUE | ALERT | KILL",
    "reason_code": "OK | HASH_MISMATCH_FILE",
    "details": "string"
  },
  "policy": { "policy_id": "hex" },
  "measurement": {
    "composite_hash": "hex",
    "mismatched_paths": []
  },
  "chain": {
    "prev_receipt_hash": "hex",
    "this_receipt_hash": "hex"
  },
  "signer": {
    "public_key": "base64",
    "key_id": "hex[0:16]",
    "signature": "base64"
  }
}`}</pre>
              </div>
            </div>

            {/* Help */}
            <div className="text-center pt-8 border-t" style={{ borderColor: '#1A1A1A' }}>
              <p className="text-gray-400 mb-4">
                Need help integrating?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#00D4FF', color: '#0A0A0A' }}
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

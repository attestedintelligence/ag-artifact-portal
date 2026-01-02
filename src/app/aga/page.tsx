import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { SITE_CONFIG, EXTERNAL_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'AGA Portal | Runtime governance you can verify',
  description: 'A deployable sentinel that measures declared integrity, enforces actions, and exports offline-verifiable evidence.',
  openGraph: {
    title: 'AGA Portal | Runtime governance you can verify',
    description: 'A deployable sentinel that measures declared integrity, enforces actions, and exports offline-verifiable evidence.',
    url: `https://${SITE_CONFIG.domain}/aga`,
  },
};

function ReceiptChainDemo() {
  const receipts = [
    { id: '0001', type: 'POLICY_LOADED', action: 'NONE', hash: 'a1b2c3...' },
    { id: '0002', type: 'MEASUREMENT_OK', action: 'CONTINUE', hash: 'd4e5f6...' },
    { id: '0003', type: 'DRIFT_DETECTED', action: 'ALERT', hash: 'g7h8i9...' },
    { id: '0004', type: 'ENFORCED', action: 'ALERT', hash: 'j0k1l2...' },
  ];

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: '#1A1A1A', backgroundColor: '#141414' }}
      >
        <span className="text-sm font-mono text-gray-400">Receipt Chain</span>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {receipts.map((receipt, index) => (
            <div key={receipt.id} className="flex items-center gap-3">
              {/* Chain connector */}
              {index > 0 && (
                <div className="absolute -mt-6 ml-3 w-0.5 h-3" style={{ backgroundColor: '#1A1A1A' }} />
              )}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0"
                style={{
                  backgroundColor: receipt.type === 'DRIFT_DETECTED' ? 'rgba(255, 184, 0, 0.15)' : 'rgba(0, 212, 255, 0.15)',
                  color: receipt.type === 'DRIFT_DETECTED' ? '#FFB800' : '#00D4FF',
                }}
              >
                {receipt.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-white">{receipt.type}</span>
                  <span className="text-gray-500">→</span>
                  <span
                    className="font-mono"
                    style={{
                      color: receipt.action === 'ALERT' ? '#FFB800' : '#22C55E',
                    }}
                  >
                    {receipt.action}
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-600">hash: {receipt.hash}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BundleStructure() {
  const files = [
    { path: 'bundle_manifest.json', desc: 'Checksums of all files' },
    { path: 'policy/policy_artifact.json', desc: 'Signed policy binding' },
    { path: 'subject/subject_manifest.json', desc: 'Baseline hashes' },
    { path: 'receipts/0001.json ... 000N.json', desc: 'Hash-linked events' },
    { path: 'receipts/chain_head.json', desc: 'Latest receipt pointer' },
    { path: 'verifier/verify.js', desc: 'Offline verification tool' },
  ];

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: '#1A1A1A', backgroundColor: '#141414' }}
      >
        <span className="text-sm font-mono text-gray-400">evidence_bundle.zip</span>
      </div>
      <div className="p-4 space-y-2">
        {files.map((file) => (
          <div key={file.path} className="flex items-start gap-3 text-sm">
            <span className="font-mono text-gray-400">/</span>
            <div>
              <span className="font-mono text-white">{file.path}</span>
              <span className="text-gray-500 ml-2">— {file.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapabilityCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)' }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}

export default function AGAPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Hero Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="text-xs font-mono uppercase tracking-wider mb-4" style={{ color: '#FFB800' }}>
                Attested Governance Artifacts
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Runtime governance you can verify.
              </h1>
              <p className="text-base sm:text-lg max-w-2xl mx-auto text-gray-400">
                A deployable sentinel that measures declared integrity, enforces actions, and exports offline-verifiable evidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href={EXTERNAL_LINKS.agaPortal}
                className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium transition-all hover:opacity-90 text-center"
                style={{ backgroundColor: '#FFB800', color: '#0A0A0A' }}
              >
                Open Portal
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium border transition-all hover:bg-white/5 text-center"
                style={{ borderColor: '#1A1A1A', color: 'white' }}
              >
                Request Evaluation
              </Link>
            </div>
          </div>
        </section>

        {/* Plain English Explanation */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">What is Sentinel?</h2>
            <div
              className="p-6 rounded-lg border text-center"
              style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
            >
              <p className="text-lg text-gray-300 leading-relaxed">
                Sentinel is a small program you run next to your system. It checks if critical files and configs changed. If they did, it takes the action you pre-approved and writes cryptographic proof.
              </p>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-white text-center">Core capabilities</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <CapabilityCard
                title="Policy Binding"
                description="Seal your configuration into a signed policy artifact that defines what integrity means."
                icon={
                  <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />
              <CapabilityCard
                title="Drift Detection"
                description="Continuous monitoring compares current state against sealed baseline. Any mismatch triggers."
                icon={
                  <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                }
              />
              <CapabilityCard
                title="Enforcement"
                description="Pre-approved actions (ALERT, QUARANTINE, KILL) execute automatically. No human in the loop."
                icon={
                  <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <CapabilityCard
                title="Receipt Chain"
                description="Every state transition emits a signed receipt. Receipts link by hash to form a tamper-evident chain."
                icon={
                  <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                }
              />
              <CapabilityCard
                title="Evidence Export"
                description="Package policy, receipts, and chain into a portable ZIP that anyone can verify offline."
                icon={
                  <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                }
              />
              <CapabilityCard
                title="Offline Verification"
                description="Deterministic verifier checks signatures and chains without network access. PASS or FAIL."
                icon={
                  <svg className="w-5 h-5" style={{ color: '#FFB800' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* Proof Assets */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-white text-center">See the proof</h2>
            <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
              Real artifacts from a governed run. Receipt chain shows drift detection and enforcement.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <ReceiptChainDemo />
              <BundleStructure />
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ backgroundColor: '#111111', borderColor: '#1A1A1A' }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-white text-center">Built for</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div
                className="p-6 rounded-lg border"
                style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
              >
                <div className="text-sm font-mono mb-2" style={{ color: '#FFB800' }}>Defense & Government</div>
                <p className="text-gray-400 text-sm">
                  Autonomous systems, AI agents, and weapons platforms that need provable compliance and audit trails for regulators.
                </p>
              </div>
              <div
                className="p-6 rounded-lg border"
                style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
              >
                <div className="text-sm font-mono mb-2" style={{ color: '#FFB800' }}>Critical Infrastructure</div>
                <p className="text-gray-400 text-sm">
                  SCADA, ICS, power grids, and industrial systems where configuration drift means safety risk.
                </p>
              </div>
              <div
                className="p-6 rounded-lg border"
                style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
              >
                <div className="text-sm font-mono mb-2" style={{ color: '#FFB800' }}>Enterprise AI</div>
                <p className="text-gray-400 text-sm">
                  AI agents handling transactions, infrastructure, or sensitive operations that need accountable governance.
                </p>
              </div>
              <div
                className="p-6 rounded-lg border"
                style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
              >
                <div className="text-sm font-mono mb-2" style={{ color: '#FFB800' }}>Compliance & Audit</div>
                <p className="text-gray-400 text-sm">
                  Organizations needing tamper-proof evidence that policies were enforced, not just logged.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">Ready to govern?</h2>
            <p className="text-gray-400 mb-8">
              Request an evaluation to see how Sentinel fits your compliance requirements.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={EXTERNAL_LINKS.agaPortal}
                className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium transition-all hover:opacity-90 text-center"
                style={{ backgroundColor: '#FFB800', color: '#0A0A0A' }}
              >
                Open Portal
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 rounded-lg text-base font-medium border transition-all hover:bg-white/5 text-center"
                style={{ borderColor: '#1A1A1A', color: 'white' }}
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Trust & Security | Attested Intelligence',
  description: 'Cryptographic primitives, threat model, privacy stance, and auditability guarantees.',
  openGraph: {
    title: 'Trust & Security | Attested Intelligence',
    description: 'Cryptographic primitives, threat model, privacy stance, and auditability guarantees.',
    url: `https://${SITE_CONFIG.domain}/trust`,
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
      <div className="text-gray-400 space-y-4">{children}</div>
    </div>
  );
}

function CryptoSpec({ name, spec, reason }: { name: string; spec: string; reason: string }) {
  return (
    <div
      className="p-4 rounded-lg border"
      style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="font-mono text-sm" style={{ color: '#00D4FF' }}>{name}</div>
        <div className="text-xs text-gray-500">{spec}</div>
      </div>
      <p className="text-sm text-gray-400">{reason}</p>
    </div>
  );
}

function ThreatRow({ threat, protection, status }: { threat: string; protection: string; status: 'protected' | 'mitigated' | 'out-of-scope' }) {
  const statusColors = {
    protected: '#22C55E',
    mitigated: '#FFB800',
    'out-of-scope': '#737373',
  };
  const statusLabels = {
    protected: 'PROTECTED',
    mitigated: 'MITIGATED',
    'out-of-scope': 'OUT OF SCOPE',
  };

  return (
    <tr className="border-b" style={{ borderColor: '#1A1A1A' }}>
      <td className="py-3 pr-4 text-sm text-white">{threat}</td>
      <td className="py-3 pr-4 text-sm text-gray-400">{protection}</td>
      <td className="py-3">
        <span
          className="text-xs font-mono px-2 py-1 rounded"
          style={{
            color: statusColors[status],
            backgroundColor: `${statusColors[status]}15`,
          }}
        >
          {statusLabels[status]}
        </span>
      </td>
    </tr>
  );
}

export default function TrustPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-20" style={{ backgroundColor: '#0A0A0A' }}>
        {/* Header */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b" style={{ borderColor: '#1A1A1A' }}>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Trust & Security
            </h1>
            <p className="text-lg text-gray-400">
              How we protect integrity and what we guarantee.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Cryptography */}
            <Section title="Cryptographic Primitives">
              <p>
                All signatures and hashes use well-established, audited algorithms with no proprietary cryptography.
              </p>
              <div className="grid gap-4 mt-4">
                <CryptoSpec
                  name="SHA-256"
                  spec="FIPS 180-4"
                  reason="Industry-standard hash function. 256-bit output provides collision resistance for file integrity."
                />
                <CryptoSpec
                  name="Ed25519"
                  spec="RFC 8032"
                  reason="Modern elliptic curve signatures. Fast verification, small keys, resistant to side-channel attacks."
                />
                <CryptoSpec
                  name="JCS"
                  spec="RFC 8785"
                  reason="JSON Canonicalization Scheme. Ensures deterministic serialization so hashes are reproducible."
                />
                <CryptoSpec
                  name="HKDF-SHA256"
                  spec="RFC 5869"
                  reason="Key derivation for per-stream signing keys. Derives from vault root seed without exposing master key."
                />
              </div>
            </Section>

            {/* Canonicalization */}
            <Section title="Deterministic Canonicalization">
              <p>
                For hashes and signatures to be reproducible, we use strict canonicalization rules:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 text-sm">
                <li>UTF-8 encoding</li>
                <li>Object keys sorted lexicographically (byte order)</li>
                <li>No insignificant whitespace</li>
                <li>Arrays preserve order</li>
                <li>Timestamps: ISO 8601 UTC with &quot;Z&quot; suffix</li>
                <li>Numbers: no leading zeros, no trailing decimal zeros</li>
              </ul>
              <p className="mt-4">
                Any compliant implementation will produce identical byte output for the same logical data.
              </p>
            </Section>

            {/* Offline Verification */}
            <Section title="Offline Verification Model">
              <p>
                Evidence bundles are designed for air-gapped verification. The verifier:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 text-sm">
                <li>Makes no network calls</li>
                <li>Reads only from the bundle ZIP</li>
                <li>Checks manifest checksums</li>
                <li>Verifies policy signature</li>
                <li>Validates each receipt (schema, ID, hash, signature)</li>
                <li>Confirms chain continuity (prev_hash links)</li>
                <li>Outputs deterministic PASS/FAIL with reason codes</li>
              </ul>
              <p className="mt-4">
                Identical bundle bytes always produce identical verifier output.
              </p>
            </Section>

            {/* Key Custody */}
            <Section title="Key Custody Options">
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
                >
                  <div className="font-medium text-white mb-2">Consumer (VerifiedBundle)</div>
                  <p className="text-sm text-gray-400">
                    Platform holds issuer key. Seals are signed by Attested Intelligence. Verification uses our public key.
                  </p>
                </div>
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: '#141414', borderColor: '#1A1A1A' }}
                >
                  <div className="font-medium text-white mb-2">Enterprise (AGA Portal)</div>
                  <p className="text-sm text-gray-400">
                    Customer-held signing keys preferred. HSM/KMS integration available. Pinned verifier public keys for trust anchoring.
                  </p>
                </div>
              </div>
            </Section>

            {/* Threat Model */}
            <Section title="Threat Model">
              <p className="mb-4">
                We assume an adversary may control local storage and network, but cannot forge without private keys.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#1A1A1A' }}>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-500">Threat</th>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-500">Protection</th>
                      <th className="py-3 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ThreatRow
                      threat="File tampering after seal"
                      protection="SHA-256 hash mismatch detected"
                      status="protected"
                    />
                    <ThreatRow
                      threat="Receipt modification"
                      protection="Ed25519 signature verification fails"
                      status="protected"
                    />
                    <ThreatRow
                      threat="Receipt deletion"
                      protection="Chain hash mismatch (missing link)"
                      status="protected"
                    />
                    <ThreatRow
                      threat="Receipt insertion"
                      protection="Counter gap or hash collision required"
                      status="protected"
                    />
                    <ThreatRow
                      threat="Bundle manifest tampering"
                      protection="Checksum mismatch on included files"
                      status="protected"
                    />
                    <ThreatRow
                      threat="Time manipulation"
                      protection="TSA token per receipt (HIGH_ASSURANCE mode)"
                      status="mitigated"
                    />
                    <ThreatRow
                      threat="Compromised signing key"
                      protection="Key rotation + revocation list"
                      status="mitigated"
                    />
                    <ThreatRow
                      threat="Bypass via ungoverned execution"
                      protection="Launch Gate required for guarantees"
                      status="out-of-scope"
                    />
                    <ThreatRow
                      threat="Faulty sensors/hardware"
                      protection="System proves what it observed, not ground truth"
                      status="out-of-scope"
                    />
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Privacy */}
            <Section title="Privacy Stance">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-white">No file storage:</strong> Files are hashed client-side. Only the hash is transmitted.</li>
                <li><strong className="text-white">Minimal metadata:</strong> We store seal hashes, timestamps, and vault associations.</li>
                <li><strong className="text-white">No tracking:</strong> No behavioral analytics or third-party trackers.</li>
                <li><strong className="text-white">Bundle privacy:</strong> Raw sensor values are optional and policy-controlled.</li>
              </ul>
            </Section>

            {/* Roadmap */}
            <Section title="Roadmap">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: '#22C55E15', color: '#22C55E' }}>NOW</span>
                  <span className="text-sm text-gray-400">Ed25519 + SHA-256 + JCS + Offline verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: '#FFB80015', color: '#FFB800' }}>PHASE 2</span>
                  <span className="text-sm text-gray-400">Merkle batching for large file proofs</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: '#FFB80015', color: '#FFB800' }}>PHASE 2</span>
                  <span className="text-sm text-gray-400">Checkpoint anchoring to immutable store (Arweave)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: '#00D4FF15', color: '#00D4FF' }}>ENTERPRISE</span>
                  <span className="text-sm text-gray-400">HSM-backed custody + multi-signer attestations</span>
                </div>
              </div>
            </Section>

            {/* Contact */}
            <div className="mt-16 pt-8 border-t text-center" style={{ borderColor: '#1A1A1A' }}>
              <p className="text-gray-400 mb-4">
                Questions about our security model?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#00D4FF', color: '#0A0A0A' }}
              >
                Contact Security Team
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

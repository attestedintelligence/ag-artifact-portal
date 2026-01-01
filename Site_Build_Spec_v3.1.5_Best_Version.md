# ATTESTED INTELLIGENCE
## Site Build Specification v3.1.5 (Best Version)
### Updated 2025-12-31

---

# EXECUTIVE SUMMARY

This specification defines the complete build for AttestedIntelligence.com optimized for converting skeptical security buyers while maintaining claims that survive audit, procurement, and legal scrutiny. Every claim is defensible. Every commitment is operationally achievable. Every referenced page is in the launch map.

**Company:** Attested Intelligence
**Product:** VerifiedBundle
**Core Promise:** Cryptographically verifiable evidence bundles, portable and offline-verifiable.
**Primary Object:** Evidence bundles (.agb) containing sealed artifacts
**Price:** $49/month (Pro) | Free tier available

**The One Sentence:**
> If you can export it, you can seal it. If you can seal it, anyone can verify it offline with the included verifier.

---

# PART 1: PRODUCT IDENTITY (LOCKED)

## 1.1 Naming Hierarchy

| Element | Name | Usage |
|---------|------|-------|
| Company | Attested Intelligence | Legal entity, invoices, contracts |
| Product | VerifiedBundle | All product references, CTAs, docs |
| File format | .agb | Evidence bundle file extension |
| CLI tool | ag-verify | Offline verifier binary |

## 1.2 Identity Rules

Every page above the fold must include:
> "VerifiedBundle is the evidence-bundle product by Attested Intelligence."

**Header:** Attested Intelligence (logo)
**Primary CTAs:** "Try VerifiedBundle Demo" | "Download Verifier"
**SEO titles:** Attested Intelligence | VerifiedBundle | [Outcome]

## 1.3 The Artifact Model

**Definition:**
> An artifact is any exportable digital object whose integrity matters: log exports, report PDFs, incident timelines, config snapshots, audit trails, contracts, deliverables.

**Primary claim:**
> "Create portable, offline-verifiable evidence bundles."

**Tagline:**
> "If you can export it, you can seal it."

## 1.4 Claims Hygiene

**Never use:**
- "Tamper-proof" (use: "tamper-evident")
- "Impossible" (use: "not supported by default")
- "Infinite" (use: "significant" or provide ranges)
- Specific dates for unshipped features

**Always use:**
- "Tamper-evident"
- "Cryptographically verifiable integrity"
- "Portable evidence kit (offline-verifiable)"
- "Planned" (no date) for roadmap items

---

# PART 2: TARGET CUSTOMER (LOCKED)

## 2.1 Primary ICP

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRIMARY BUYER PERSONA                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Name: Alex Chen (composite)                                        │
│  Title: Security Engineering Manager / Senior Security Engineer     │
│  Company: Series A-C SaaS startup, 50-500 employees                │
│  Industry: SaaS, FinTech, HealthTech (compliance-sensitive)        │
│                                                                     │
│  SUCCESS METRIC:                                                    │
│  "I can provide an auditor with a self-contained evidence kit      │
│   they can verify independently using the included tools."         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 3: VALUE PROPOSITION

## 3.1 The Core Promise

**Primary (Security Engineers):**
> Create portable, offline-verifiable evidence bundles with cryptographic integrity controls.

**Secondary (Executives):**
> Evidence kits that support legal discovery and reduce dispute resolution time.

**Tertiary (Auditors):**
> Self-contained verification: run the included verifier, see PASS or FAIL.

## 3.2 Time Anchor Summary (Visible in Core Funnel)

```
┌─────────────────────────────────────────────────────────────────────┐
│  TIME ANCHOR OPTIONS                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  SELF-      │  │  RFC 3161   │  │  ENTERPRISE │                 │
│  │  ATTESTED   │  │  TSA TOKEN  │  │  WITNESS    │                 │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤                 │
│  │ Internal    │  │ External    │  │ Custom      │                 │
│  │ timestamp   │  │ time proof  │  │ anchors     │                 │
│  │ Starter     │  │ Pro+        │  │ Enterprise  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                     │
│  Base bundles prove integrity since sealing.                        │
│  External time proof requires TSA token or enterprise anchor.       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 4: WHAT IS INSIDE THE .AGB

## 4.1 AGB Format Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│  AGB FORMAT SPECIFICATION SUMMARY                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FORMAT VERSION: 1.0                                                │
│                                                                     │
│  BUNDLE COMPONENTS                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Required:                                                          │
│  ├── manifest.json        Format version, component list, checksums│
│  ├── PolicyArtifact.json  Subject ID, sealed hash, policy, sig    │
│  ├── ledger.jsonl         Receipt chain (genesis + events)        │
│  └── merkle/proofs.json   Inclusion proofs for each receipt       │
│                                                                     │
│  Optional:                                                          │
│  ├── timestamp_token.tst  RFC 3161 TSA token (Pro+)               │
│  ├── custody.json         Chain-of-custody metadata               │
│  ├── selection_rules.json Capture configuration                   │
│  └── payload/             Original artifact (if included)         │
│                                                                     │
│  MANIFEST REQUIRED FIELDS                                           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  {                                                                  │
│    "format_version": "1.0",                                        │
│    "min_verifier_version": "1.2.0",                                │
│    "created_at": "2025-01-15T10:33:00Z",                           │
│    "payload_included": false,                                      │
│    "components": [...]                                             │
│  }                                                                  │
│                                                                     │
│  payload_included is REQUIRED and displayed in Auditor Mode.       │
│                                                                     │
│  VERIFIER BEHAVIOR                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  - Unknown format_version: FAIL (fail-closed)                      │
│  - Verifier < min_verifier_version: WARN + suggest update          │
│  - Missing required component: FAIL                                │
│  - payload_included missing: FAIL (required field)                 │
│  - Canonicalization mismatch: FAIL                                 │
│                                                                     │
│  WHAT BREAKS VERIFICATION                                           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ✗ Edit any byte in payload                    → ARTIFACT_MISMATCH │
│  ✗ Edit any byte in manifest                   → MANIFEST_INVALID  │
│  ✗ Edit any receipt in ledger                  → CHAIN_BROKEN      │
│  ✗ Swap signing key                            → SIGNATURE_INVALID │
│  ✗ Delete a receipt                            → SEQUENCE_GAP      │
│  ✗ Reorder receipts                            → HASH_MISMATCH     │
│  ✗ Non-canonical JSON                          → CANON_MISMATCH    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 4.2 Trust Truth Table

| Question | Answer | Explanation |
|----------|--------|-------------|
| Do you see my plaintext? | NO (by default) | Demo computes hash client-side; payload upload is opt-in |
| Does verification require your server? | NO | Verifier works offline with included tools |
| Can I verify without trusting you? | YES | Verifier is a local binary, spec is public |
| Is modification detectable? | YES | Any modification breaks hash chain |
| What if you disappear? | BUNDLES SURVIVE | Verifier works with included tools, spec is public |

## 4.3 Proof-of-Time Options

| Option | Proves Integrity | Proves Time (Internal) | Proves Time (External) |
|--------|------------------|------------------------|------------------------|
| Base bundle | YES | YES (self-attested) | NO |
| + RFC 3161 | YES | YES | YES (TSA-certified) |
| + WORM Storage | YES | YES | YES (storage provider) |

---

# PART 5: CANONICALIZATION AND SIGNING INPUTS

## 5.1 JSON Canonicalization Rules

All JSON objects in VerifiedBundle (manifest, receipts, policy artifacts, keyrings, .sig envelopes) follow these deterministic rules:

```
┌─────────────────────────────────────────────────────────────────────┐
│  CANONICALIZATION SPECIFICATION                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  METHOD: JCS (JSON Canonicalization Scheme, RFC 8785)               │
│                                                                     │
│  RULES:                                                             │
│  1. Keys sorted lexicographically (Unicode code point order)       │
│  2. No whitespace between tokens                                   │
│  3. Numbers: no leading zeros, no trailing zeros after decimal     │
│  4. Strings: minimal escape sequences                              │
│  5. Unicode: NFC normalization                                     │
│                                                                     │
│  ENCODING: UTF-8 (no BOM)                                           │
│                                                                     │
│  HASH INPUT: SHA-256 over canonical UTF-8 bytes                     │
│                                                                     │
│  SIGNATURE INPUT: Sign the SHA-256 hash (not raw bytes)            │
│  - All signatures in VerifiedBundle sign the hash, not bytes       │
│  - This is consistent across: bundles, releases, keyrings          │
│                                                                     │
│  VERIFIER BEHAVIOR:                                                 │
│  - Re-canonicalize all JSON before hashing                         │
│  - If input is not valid JSON: FAIL                                │
│  - If re-canonicalized hash differs from stored hash: FAIL         │
│  - Fail-closed: any canonicalization ambiguity results in FAIL     │
│                                                                     │
│  DOMAIN SEPARATOR:                                                  │
│  All signature operations prepend a domain separator to prevent    │
│  cross-protocol signing attacks. See Part 5.2 for format.          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 5.2 Signature Domain Separators

Each signature type has a unique domain separator prepended to the hash before signing:

| Signature Type | Domain Separator | Purpose |
|----------------|------------------|---------|
| Bundle signing | `ai.bundle.v1:` | Policy artifacts, receipts |
| Release signing | `ai.release.v1:` | Verifier binaries, tooling |
| Keyring signing | `ai.keyring.v1:` | Trust list updates |

**Signature input format:**
```
signature_input = domain_separator || SHA256_hex
signature = Ed25519_Sign(private_key, signature_input)
```

**SHA256_hex encoding:** All SHA-256 hashes are represented as ASCII lowercase hexadecimal (64 characters). The domain separator and hash are concatenated as ASCII strings, then encoded as UTF-8 bytes for signing.

Example:
```
domain_separator = "ai.release.v1:"           (14 ASCII chars)
SHA256_hex       = "a1b2c3d4...64 chars..."   (64 ASCII chars)
signature_input  = "ai.release.v1:a1b2c3d4..."(78 UTF-8 bytes)
```

This prevents a signature valid for one context from being replayed in another.

---

# PART 6: KEY TRUST MODEL

## 6.1 Key Classes

VerifiedBundle uses two distinct key classes:

```
┌─────────────────────────────────────────────────────────────────────┐
│  KEY CLASSES                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  RELEASE-SIGNING KEYS                                               │
│  ─────────────────────────────────────────────────────────────────  │
│  Purpose: Sign verifier binaries and tooling releases              │
│  Domain separator: ai.release.v1:                                  │
│  Held by: Attested Intelligence (HSM-backed)                       │
│  Rotation: Annual or on security event                             │
│  Trust root: Embedded in verifier + published at /security/keys    │
│                                                                     │
│  BUNDLE-SIGNING KEYS                                                │
│  ─────────────────────────────────────────────────────────────────  │
│  Purpose: Sign policy artifacts and receipts                       │
│  Domain separator: ai.bundle.v1:                                   │
│  Held by: Customer (BYOK) or Attested Intelligence (managed)       │
│  Rotation: Customer-controlled or annual (managed)                 │
│  Trust root: Keyring file or pinned key                            │
│                                                                     │
│  Note: Initially these may use the same key infrastructure, but    │
│  the domain separators ensure signatures are not interchangeable.  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6.2 Trust Root Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  TRUST ROOT LOCATIONS                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Starter/Pro (managed): Keys in HSM-backed infrastructure.         │
│  Pro (BYOK): Customer generates and holds all keys.                │
│  Enterprise: Customer-managed HSM with full lifecycle control.     │
│                                                                     │
│  KEY ROTATION                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  Trigger: Annual, on-demand, or after suspected compromise.        │
│  Transition: Both keys valid for 30 days (configurable).           │
│  After transition: Old key verification-only.                      │
│  Bundles signed with old keys remain verifiable indefinitely.      │
│                                                                     │
│  VERIFIER TRUST DECISIONS                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  Verifier never implicitly trusts keys. Trust is always explicit:  │
│  - Embedded keys (ships with Attested Intelligence root)           │
│  - Pinned keys (user provides explicit trust list)                 │
│  - Keyring file (signed list of trusted public keys)               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6.3 Revocation Semantics

```
┌─────────────────────────────────────────────────────────────────────┐
│  REVOCATION SEMANTICS                                               │
│  Deterministic rules for revoked keys.                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  REVOCATION LIST FORMAT                                             │
│  ─────────────────────────────────────────────────────────────────  │
│  Location: /security/revoked-keys.json (signed with keyring key)   │
│                                                                     │
│  {                                                                  │
│    "revoked_keys": [                                               │
│      {                                                             │
│        "key_id": "ai_release_2024_ed25519",                        │
│        "key_class": "release",                                     │
│        "revoked_at": "2025-06-15T00:00:00Z",                       │
│        "reason": "scheduled_rotation"                              │
│      }                                                             │
│    ]                                                               │
│  }                                                                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RELEASE VERIFICATION (verifier binaries)                           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  If binary is signed by a revoked release key:                      │
│  → FAIL (no time ambiguity; releases should use current key)       │
│                                                                     │
│  User action: Download new verifier signed with current key.        │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  BUNDLE VERIFICATION                                                │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  If bundle is signed by a revoked bundle-signing key:               │
│                                                                     │
│  Case 1: Bundle has RFC 3161 timestamp token                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ token_time < revoked_at                                     │   │
│  │ → PASS + WARN: "Key revoked after signing; bundle valid"    │   │
│  │                                                             │   │
│  │ token_time >= revoked_at                                    │   │
│  │ → FAIL: "Bundle signed after key revocation"                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Case 2: Bundle has NO time anchor                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ → PASS + WARN: "Key revoked; cannot determine signing time; │   │
│  │                 verify with caution"                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  SUMMARY TABLE                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  │ Context         │ Time Anchor │ Result                    │     │
│  │─────────────────│─────────────│───────────────────────────│     │
│  │ Release binary  │ N/A         │ FAIL                      │     │
│  │ Bundle          │ token < rev │ PASS + WARN               │     │
│  │ Bundle          │ token >= rev│ FAIL                      │     │
│  │ Bundle          │ None        │ PASS + WARN               │     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6.4 FIPS Compliance Note

**Ed25519/EdDSA:** Our default. EdDSA is approved in FIPS 186-5 (February 2023).

**FIPS compliance depends on using a FIPS-validated cryptographic module in approved mode.**

**Available configurations:**
- Default: Ed25519 via libsodium (not FIPS-validated)
- Enterprise: FIPS mode via FIPS-validated module

---

# PART 7: RELEASE SIGNATURE FORMAT

## 7.1 .sig Envelope Specification

All release signatures use a JSON envelope format:

```
┌─────────────────────────────────────────────────────────────────────┐
│  RELEASE SIGNATURE ENVELOPE (.sig)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  {                                                                  │
│    "sig_version": "1.0",                                           │
│    "domain_separator": "ai.release.v1:",                           │
│    "file_name": "ag-verify-1.2.1-linux-x86_64.tar.gz",             │
│    "file_sha256": "a1b2c3d4e5f6...",                               │
│    "signing_key_id": "ai_release_2025_ed25519",                    │
│    "sig_alg": "Ed25519",                                           │
│    "sig_b64": "base64_encoded_signature...",                       │
│    "signed_at": "2025-01-15T10:00:00Z"                             │
│  }                                                                  │
│                                                                     │
│  REQUIRED FIELDS                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  sig_version      Version of this envelope format                  │
│  domain_separator Constant: "ai.release.v1:"                       │
│  file_name        Exact filename being signed                      │
│  file_sha256      SHA-256 hash (ASCII lowercase hex, 64 chars)     │
│  signing_key_id   Identifier of the signing key                    │
│  sig_alg          Signature algorithm (currently: "Ed25519")       │
│  sig_b64          Base64-encoded signature                         │
│                                                                     │
│  OPTIONAL FIELDS                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  signed_at        ISO 8601 timestamp (informational only)          │
│                                                                     │
│  SIGNATURE COMPUTATION                                              │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  1. Compute SHA-256 of the release file                            │
│  2. Encode hash as ASCII lowercase hex (64 characters)             │
│  3. Construct signature input as UTF-8 bytes:                      │
│     input = "ai.release.v1:" || file_sha256_hex                    │
│  4. Sign: sig = Ed25519_Sign(release_private_key, input)           │
│  5. Encode signature as base64                                     │
│                                                                     │
│  VERIFICATION                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  1. Parse .sig JSON envelope                                       │
│  2. Verify domain_separator is exactly "ai.release.v1:"            │
│  3. Compute SHA-256 of downloaded file                             │
│  4. Encode as ASCII lowercase hex, compare to file_sha256          │
│  5. Reconstruct signature input (domain_separator || file_sha256)  │
│  6. Verify Ed25519 signature against release public key            │
│  7. Check signing_key_id is not in revoked-keys list               │
│                                                                     │
│  CLI:                                                               │
│  ag-verify --verify-release <file> <file.sig>                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 8: VERIFIER AUTOMATION CONTRACT

## 8.1 Exit Codes

```
┌─────────────────────────────────────────────────────────────────────┐
│  VERIFIER EXIT CODES                                                │
│  For automation and CI/CD integration.                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  EXIT CODE    MEANING                                               │
│  ─────────────────────────────────────────────────────────────────  │
│  0            PASS (verification succeeded, no warnings)           │
│  1            FAIL (verification failed)                           │
│  2            WARN (verification passed with warnings)             │
│  3            ERROR (could not complete verification)              │
│                                                                     │
│  WARN conditions (exit code 2):                                     │
│  - Key revoked after bundle creation (with RFC 3161 proof)        │
│  - Key revoked, no time anchor (cannot determine signing time)    │
│  - Verifier version older than min_verifier_version               │
│                                                                     │
│  ERROR conditions (exit code 3):                                    │
│  - File not found                                                  │
│  - Invalid bundle structure                                        │
│  - Malformed JSON                                                  │
│  - Missing required arguments                                      │
│                                                                     │
│  AUTOMATION GUIDANCE                                                │
│  ─────────────────────────────────────────────────────────────────  │
│  - Treat exit 0 as success                                         │
│  - Treat exit 1 as failure (block pipeline)                        │
│  - Treat exit 2 as success with review required                    │
│  - Treat exit 3 as infrastructure error (retry or alert)           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 8.2 JSON Output Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│  JSON OUTPUT (--json flag)                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ag-verify bundle.agb --json                                        │
│                                                                     │
│  OUTPUT SCHEMA                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  {                                                                  │
│    "result": "PASS" | "FAIL" | "WARN" | "ERROR",                   │
│    "exit_code": 0 | 1 | 2 | 3,                                     │
│    "bundle_id": "uuid-of-bundle",                                  │
│    "checks": [                                                     │
│      {                                                             │
│        "name": "manifest_integrity",                               │
│        "result": "PASS" | "FAIL",                                  │
│        "reason": null | "error description"                        │
│      },                                                            │
│      {                                                             │
│        "name": "signature_valid",                                  │
│        "result": "PASS" | "FAIL",                                  │
│        "reason": null | "error description"                        │
│      },                                                            │
│      {                                                             │
│        "name": "chain_integrity",                                  │
│        "result": "PASS" | "FAIL",                                  │
│        "reason": null | "error description"                        │
│      },                                                            │
│      {                                                             │
│        "name": "merkle_proofs",                                    │
│        "result": "PASS" | "FAIL",                                  │
│        "reason": null | "error description"                        │
│      }                                                             │
│    ],                                                              │
│    "warnings": [                                                   │
│      {                                                             │
│        "code": "KEY_REVOKED_AFTER_SIGN",                           │
│        "message": "Signing key revoked after bundle creation"      │
│      }                                                             │
│    ],                                                              │
│    "metadata": {                                                   │
│      "format_version": "1.0",                                      │
│      "payload_included": false,                                    │
│      "time_anchor": "self-attested" | "rfc3161",                   │
│      "signing_key_id": "ai_bundle_2025_ed25519"                    │
│    },                                                              │
│    "verifier_version": "1.2.1"                                     │
│  }                                                                  │
│                                                                     │
│  WARNING CODES                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│  KEY_REVOKED_AFTER_SIGN   Key revoked, but after bundle creation  │
│  KEY_REVOKED_NO_ANCHOR    Key revoked, cannot determine sign time │
│  VERIFIER_OUTDATED        Verifier older than min_verifier_version│
│  TSA_TOKEN_EXPIRED        RFC 3161 token past validity period     │
│                                                                     │
│  ERROR CODES (in "reason" field)                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  ARTIFACT_MISMATCH        Payload hash does not match sealed hash │
│  MANIFEST_INVALID         Manifest failed integrity check         │
│  CHAIN_BROKEN             Receipt chain has invalid links         │
│  SIGNATURE_INVALID        Signature verification failed           │
│  SEQUENCE_GAP             Missing receipt in sequence             │
│  HASH_MISMATCH            Computed hash differs from expected     │
│  CANON_MISMATCH           JSON canonicalization failed            │
│  KEY_REVOKED_BEFORE_SIGN  Bundle signed after key revocation      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 9: DEMO (AUDITOR-PROOF EXPERIENCE)

## 9.1 Demo Privacy Model

**Critical requirement:** Demo behavior must match privacy claims.

```
┌─────────────────────────────────────────────────────────────────────┐
│  DEMO PRIVACY MODEL                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DEFAULT BEHAVIOR (hash-only mode):                                 │
│  1. User selects file in browser                                   │
│  2. SHA-256 computed CLIENT-SIDE in browser (Web Crypto API)       │
│  3. Only hash + minimal metadata sent to server                    │
│  4. Bundle created from hash                                       │
│  5. Original file NEVER uploaded                                   │
│  6. manifest.json contains: "payload_included": false              │
│                                                                     │
│  OPTIONAL BEHAVIOR (payload mode):                                  │
│  - Toggle: "Include artifact in bundle" (default OFF)              │
│  - If ON: File uploaded and included in bundle                     │
│  - manifest.json contains: "payload_included": true                │
│                                                                     │
│  AUDITOR MODE REQUIREMENT:                                          │
│  - Auditor Mode MUST display payload_included status               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 9.2 Demo Flow with Auditor Mode

```
┌─────────────────────────────────────────────────────────────────────┐
│  VERIFIEDBUNDLE DEMO                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  STEP 1: SEAL AN ARTIFACT                                     │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │     [ Drag any artifact here ]                          │ │ │
│  │  │                                                         │ │ │
│  │  │     Hash computed locally. File not uploaded.           │ │ │
│  │  │                                                         │ │ │
│  │  │     ☐ Include artifact in bundle (optional)             │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  AUDITOR MODE                                                 │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  BUNDLE METADATA                                        │ │ │
│  │  │                                                         │ │ │
│  │  │  Payload included: NO (hash-only mode)                  │ │ │
│  │  │  Time anchor: Self-attested                             │ │ │
│  │  │  Format version: 1.0                                    │ │ │
│  │  │  Signing key: ai_bundle_2025_ed25519 [expand] [copy]    │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  CHECKS PERFORMED                                       │ │ │
│  │  │                                                         │ │ │
│  │  │  ✓ Manifest integrity                                   │ │ │
│  │  │  ✓ Policy artifact signature (Ed25519)                  │ │ │
│  │  │  ✓ Receipt chain integrity                              │ │ │
│  │  │  ✓ Merkle inclusion proofs                              │ │ │
│  │  │  ✓ Canonicalization (JCS RFC 8785)                      │ │ │
│  │  │  ○ RFC 3161 timestamp (not present)                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  TRUST ASSUMPTIONS                                      │ │ │
│  │  │                                                         │ │ │
│  │  │  Required:                                              │ │ │
│  │  │  - Signing key is not compromised                       │ │ │
│  │  │  - SHA-256 is collision-resistant                       │ │ │
│  │  │  - Ed25519 signatures are unforgeable                   │ │ │
│  │  │                                                         │ │ │
│  │  │  NOT Required:                                          │ │ │
│  │  │  - Trust in Attested Intelligence servers               │ │ │
│  │  │  - Network connectivity                                 │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  TAMPER TEST (One-Click)                                      │ │
│  │                                                               │ │
│  │  [Run Tamper Test]                                            │ │
│  │                                                               │ │
│  │  One byte changed. Verification failed.                       │ │
│  │  This is tamper-evident integrity verification.               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 9.3 Hash and Key Display Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│  HASH/KEY DISPLAY REQUIREMENTS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  All truncated hashes and key fingerprints MUST:                    │
│                                                                     │
│  1. Show truncated form by default: first 8 + "..." + last 8       │
│     Example: a1b2c3d4...x5y6z7w8                                   │
│                                                                     │
│  2. Provide [expand] action to show full value                     │
│                                                                     │
│  3. Provide [copy] action that copies FULL value (not truncated)   │
│                                                                     │
│  4. Use monospace font (JetBrains Mono or similar)                 │
│                                                                     │
│  5. Verifier ALWAYS uses full value internally                     │
│     (truncation is display-only, never used in computation)        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 10: PRICING (DELIVERABLES ONLY)

**Rule:** Pricing contains only things contractually delivered today.

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRICING                                                            │
│  What you get today.                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STARTER (Free)                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  ✓ 10 bundles per month                                            │
│  ✓ 10 MB max artifact size                                         │
│  ✓ Offline verifier                                                │
│  ✓ Community support                                               │
│  ✓ Public specification                                            │
│                                                                     │
│  PRO ($49/month)                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  Everything in Starter, plus:                                       │
│  ✓ 500 bundles per month                                           │
│  ✓ 100 MB max artifact size                                        │
│  ✓ Full API access                                                 │
│  ✓ BYOK (bring your own keys)                                      │
│  ✓ RFC 3161 timestamp tokens                                       │
│  ✓ Priority email support (24h target)                             │
│  ✓ Audit kit generator                                             │
│                                                                     │
│  30-day refund policy (see /legal/refunds)                          │
│                                                                     │
│  TEAM ($199/month)                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  Everything in Pro, plus:                                           │
│  ✓ 2,500 bundles per month                                         │
│  ✓ 10 team members                                                 │
│  ✓ Shared workspace with audit trail                               │
│  ✓ 500 MB max artifact size                                        │
│  ✓ Chain-of-custody metadata templates                             │
│  ✓ Priority support (4h target)                                    │
│                                                                     │
│  ENTERPRISE (Starting at $999/month)                                │
│  ─────────────────────────────────────────────────────────────────  │
│  Everything in Team, plus:                                          │
│  ✓ Custom bundle limits                                            │
│  ✓ On-premise verifier runner                                      │
│  ✓ Custom TSA integration                                          │
│  ✓ FIPS mode via FIPS-validated module                             │
│  ✓ Runtime enforcement (Sentinel)                                  │
│  ✓ Dedicated support engineer                                      │
│  ✓ Custom SLA options                                              │
│  ✓ Data residency options                                          │
│                                                                     │
│  See /roadmap for planned features.                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 11: DOWNLOAD PAGE (/download)

```
┌─────────────────────────────────────────────────────────────────────┐
│  DOWNLOAD VERIFIER                                                  │
│  Offline verification for air-gapped environments.                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CURRENT VERSION: (shown dynamically on page)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  macOS (Universal)                                          │   │
│  │  [Download ag-verify-<version>-macos-universal.tar.gz]      │   │
│  │  SHA-256: <hash>  [expand] [copy]                           │   │
│  │  [Download .sig]                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Linux (x86_64)                                             │   │
│  │  [Download ag-verify-<version>-linux-x86_64.tar.gz]         │   │
│  │  SHA-256: <hash>  [expand] [copy]                           │   │
│  │  [Download .sig]                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Windows (x86_64)                                           │   │
│  │  [Download ag-verify-<version>-windows-x86_64.zip]          │   │
│  │  SHA-256: <hash>  [expand] [copy]                           │   │
│  │  [Download .sig]                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RELEASE INTEGRITY                                                  │
│                                                                     │
│  Signing method: Ed25519 with domain separator (ai.release.v1:)    │
│  Trust root: Release signing key (published below)                 │
│  .sig format: JSON envelope (see /docs/specification#sig-format)   │
│                                                                     │
│  Current release signing key:                                       │
│  Key ID: (shown dynamically)                                        │
│  Fingerprint: <fingerprint>  [expand] [copy]                       │
│  [Download Public Key]                                              │
│                                                                     │
│  Rotation: Annual or on security event.                             │
│  Revocation list: /security/revoked-keys.json                      │
│  If key is revoked: Download new verifier signed with current key.  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  VERIFICATION COMMANDS                                              │
│                                                                     │
│  # Verify release signature                                        │
│  ag-verify --verify-release <downloaded_file> <downloaded_file.sig>│
│                                                                     │
│  # Or manually verify checksum:                                    │
│  sha256sum <downloaded_file>                                       │
│  # Compare to SHA-256 shown above                                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  AIR-GAPPED VERIFICATION                                            │
│                                                                     │
│  1. Download verifier + .sig on connected machine                  │
│  2. Verify signature (see commands above)                          │
│  3. Transfer verified binary to air-gapped machine                 │
│  4. Transfer bundle to verify                                      │
│  5. Run: ./ag-verify bundle.agb                                    │
│                                                                     │
│  No network required on the air-gapped machine.                     │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  SAMPLE AUDIT KITS                                                  │
│                                                                     │
│  Test the verifier yourself:                                        │
│                                                                     │
│  [Download: Valid Bundle (PASS expected)]                           │
│  SHA-256: <hash>  [expand] [copy]                                   │
│                                                                     │
│  [Download: Tampered Bundle (FAIL expected)]                        │
│  SHA-256: <hash>  [expand] [copy]                                   │
│  Modification: Receipt 2, byte 847 altered                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 12: PROCUREMENT PACK (/security/procurement)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROCUREMENT PACK                                                   │
│  Everything you need for vendor onboarding.                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SECURITY                                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  - Security Overview: /security                                    │
│  - Threat Model: /security/threat-model                            │
│  - Cryptography: /security/cryptography                            │
│  - Key Trust Model: /security/keys                                 │
│  - Revoked Keys: /security/revoked-keys.json                       │
│                                                                     │
│  ARCHITECTURE                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  - Data Flow: /docs/architecture                                   │
│  - Privacy Modes: /docs/privacy-modes                              │
│  - AGB Specification: /docs/specification                          │
│                                                                     │
│  VULNERABILITY DISCLOSURE                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  - Email: security@attestedintelligence.com                        │
│  - PGP Key: /security/pgp-key.asc                                  │
│  - security.txt: /.well-known/security.txt                         │
│                                                                     │
│  RELEASE INTEGRITY                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  - Signed Releases: /download                                      │
│  - .sig Format: /docs/specification#sig-format                     │
│                                                                     │
│  LEGAL                                                              │
│  ─────────────────────────────────────────────────────────────────  │
│  - Terms of Service: /legal/terms                                  │
│  - Privacy Policy: /legal/privacy                                  │
│  - Refund Policy: /legal/refunds                                   │
│  - Subprocessors: /legal/subprocessors                             │
│  - DPA: Available on request (Enterprise)                          │
│                                                                     │
│  COMPLIANCE                                                         │
│  ─────────────────────────────────────────────────────────────────  │
│  - SOC 2 Program: In progress (contact sales for status)          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 13: TRUST ARTIFACTS

## 13.1 Security Page (/security)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SECURITY                                                           │
│  Trust through artifacts, not statements.                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  QUICK LINKS                                                        │
│  ─────────────────────────────────────────────────────────────────  │
│  - Procurement Pack: /security/procurement                         │
│  - security.txt: /.well-known/security.txt                         │
│  - Threat Model: /security/threat-model                            │
│  - Cryptography: /security/cryptography                            │
│  - Key Trust Model: /security/keys                                 │
│                                                                     │
│  DATA HANDLING                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Account data: Email, billing. Retained until account deletion.    │
│  Operational logs: API logs (30 days). Abuse prevention/security.  │
│  Bundle metadata: Hashes, timestamps (not payloads).               │
│                                                                     │
│  We do NOT store:                                                   │
│  - Artifacts in hash-only mode (demo default)                      │
│  - Your private keys (BYOK mode)                                   │
│                                                                     │
│  Deletion: privacy@attestedintelligence.com (30 days)              │
│  Note: Legal/security holds may override deletion timelines.       │
│                                                                     │
│  VULNERABILITY DISCLOSURE                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  Email: security@attestedintelligence.com                          │
│  Response: Target 2 business days for initial acknowledgment       │
│  Disclosure: 90 days or mutual agreement                           │
│                                                                     │
│  CONTINUITY (Design Guarantees)                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  - Bundles + verifier + public spec enable offline verification   │
│  - Bundles signed with valid keys remain verifiable indefinitely  │
│  - Specification is public and archived                           │
│  - Source escrow available (Enterprise)                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 13.2 Threat Model (/security/threat-model)

```
┌─────────────────────────────────────────────────────────────────────┐
│  THREAT MODEL                                                       │
│  What we protect. What we do not.                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  IN-SCOPE THREATS (modification detectable)                         │
│                                                                     │
│  ✓ Post-seal artifact tampering                                     │
│  ✓ Receipt chain manipulation (insert/delete/reorder)              │
│  ✓ Signature forgery (without key compromise)                       │
│  ✓ Replay attacks (unique IDs + timestamps)                        │
│  ✓ Substitution attacks (hash mismatch)                            │
│  ✓ Cross-protocol signing (domain separators prevent)              │
│                                                                     │
│  OUT-OF-SCOPE THREATS                                               │
│                                                                     │
│  ✗ Pre-seal tampering (seal early)                                  │
│  ✗ Key compromise (use HSM, rotate keys)                            │
│  ✗ Malicious operator (we cannot detect intentional false content) │
│  ✗ Endpoint compromise before sealing                               │
│  ✗ Coerced sealing                                                  │
│                                                                     │
│  VERIFIER GUARANTEES                                                │
│                                                                     │
│  Given: Key not compromised, SHA-256 collision-resistant,          │
│         Ed25519 unforgeable                                         │
│                                                                     │
│  PASS means: Bundle not modified since sealing                     │
│  FAIL means: Modification detected at specific location            │
│                                                                     │
│  NOT guaranteed:                                                    │
│  - Content was truthful when sealed                                │
│  - Sealing happened before specific external event (without TSA)   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# PART 14: SITEMAP (COMPLETE LAUNCH MAP)

## 14.1 P0: Launch Day (All Referenced Pages)

| Page | Path | Purpose |
|------|------|---------|
| Homepage | / | Primary conversion |
| Demo | /demo | First win experience |
| Pricing | /pricing | Purchase decision |
| Download | /download | Verifier + sample kits |
| Roadmap | /roadmap | Future features |
| Quickstart | /docs/quickstart | 5-minute onboarding |
| Specification | /docs/specification | Trust artifact |
| Architecture | /docs/architecture | Data flow diagram |
| Privacy Modes | /docs/privacy-modes | Hash-only vs payload |
| Security | /security | Trust artifact |
| Procurement Pack | /security/procurement | Vendor onboarding hub |
| Threat Model | /security/threat-model | Trust artifact |
| Cryptography | /security/cryptography | Algorithm choices |
| Key Trust Model | /security/keys | Key lifecycle |
| Revoked Keys | /security/revoked-keys.json | Machine-readable |
| PGP Key | /security/pgp-key.asc | Security contact |
| Terms | /legal/terms | Legal |
| Privacy | /legal/privacy | Legal |
| Refunds | /legal/refunds | Policy |
| Subprocessors | /legal/subprocessors | Vendor list |
| security.txt | /.well-known/security.txt | Trust signal |
| Changelog | /changelog | Version history |

## 14.2 P1: Week 2

| Page | Path | Purpose |
|------|------|---------|
| FAQ | /docs/faq | Objection handling |
| vs CloudTrail | /compare/vs-cloudtrail | SEO |
| vs Blockchain | /compare/vs-blockchain | SEO |
| vs Logging | /compare/vs-logging | SEO |
| Status | /status | Uptime transparency |

---

# PART 15: LAUNCH CHECKLIST

## 15.1 P0: Launch Day

**Product:**
- [ ] Demo computes hash client-side (Web Crypto API)
- [ ] "Include artifact in bundle" toggle defaults to OFF
- [ ] manifest.json includes payload_included field
- [ ] Auditor Mode displays payload_included status
- [ ] Auditor Mode displays Time Anchor status
- [ ] Tamper test is one-click and guarantees FAIL
- [ ] All downloads have SHA-256 checksum and .sig envelope
- [ ] Sample Audit Kits available (valid + tampered)
- [ ] All truncated hashes have [expand] and [copy] actions
- [ ] Verifier uses full hash values internally (never truncated)
- [ ] Download page shows version dynamically (not hard-coded in spec)

**Canonicalization:**
- [ ] All JSON uses JCS (RFC 8785) canonicalization
- [ ] All signatures sign the hash (not raw bytes)
- [ ] SHA-256 hashes encoded as ASCII lowercase hex (64 chars)
- [ ] Domain separators implemented for all signature types
- [ ] Verifier fails on canonicalization mismatch

**Automation:**
- [ ] Exit codes: 0=PASS, 1=FAIL, 2=WARN, 3=ERROR
- [ ] --json flag outputs structured result
- [ ] JSON output includes checks array with per-check results
- [ ] Warning codes documented

**Content:**
- [ ] All referenced pages exist (per Part 14 sitemap)
- [ ] /security/revoked-keys.json published (even if empty)
- [ ] /security/cryptography documents algorithm choices
- [ ] /security/keys documents key lifecycle
- [ ] /docs/architecture shows data flow
- [ ] /docs/privacy-modes explains hash-only vs payload
- [ ] /legal/subprocessors lists vendors
- [ ] /.well-known/security.txt published

**Revocation:**
- [ ] Revocation semantics documented
- [ ] Verifier implements PASS/WARN/FAIL rules per Part 6.3
- [ ] Release verification: revoked key = FAIL
- [ ] Bundle verification: RFC3161 time comparison implemented

---

# PART 16: CLAIMS REVIEW CHECKLIST

Before publishing any page, verify:

- [ ] No use of "tamper-proof" (use "tamper-evident")
- [ ] No absolutes ("impossible", "infinite", "guaranteed")
- [ ] No specific dates for unshipped features
- [ ] No features listed in pricing that are not shipped
- [ ] No hard-coded version numbers (use dynamic or placeholder)
- [ ] Response time commitments use "target" not "guarantee"
- [ ] FIPS language says "FIPS mode via FIPS-validated module"
- [ ] All referenced pages exist in sitemap
- [ ] All truncated values have expand/copy actions
- [ ] Revocation semantics are deterministic

---

# APPENDIX A: TERMINOLOGY

## Approved Terms

| Instead of | Use |
|------------|-----|
| Tamper-proof | Tamper-evident |
| Impossible to modify | Modification is detectable |
| Guaranteed response | Target response time |
| Coming [date] | Planned (see /roadmap) |
| 99.9% SLA | Custom SLA options |
| FIPS-validated crypto option | FIPS mode via FIPS-validated module |

## Glossary

| Term | Definition |
|------|------------|
| Artifact | Any exportable digital object whose integrity matters |
| Bundle | The sealed evidence package (.agb file) |
| payload_included | Manifest field indicating if original artifact is in bundle |
| Domain separator | Prefix preventing cross-protocol signature reuse |
| Canonicalization | Deterministic JSON-to-bytes conversion (JCS RFC 8785) |
| PASS | Verification succeeded, no modification detected (exit 0) |
| FAIL | Verification failed, modification detected (exit 1) |
| WARN | Verification passed with advisory (exit 2) |
| ERROR | Could not complete verification (exit 3) |

---

END OF SPECIFICATION

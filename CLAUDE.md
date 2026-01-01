Random Access Memories:
# claude.md — Attested Intelligence / VerifiedBundle / Sovereign Vault (Consolidated Memory Core)
Last updated: 2025-12-30

This file is the single source of truth for aligning a new Claude thread with:
1) the Attested Governance Artifact invention/spec,
2) the Local-Only MVP acceptance criteria (ZEV “credible working version”),
3) the Sovereign Vault + VerifiedBundle productization plan,
4) UI/UX + business packaging expectations.

---

## 1) Project Identity + Positioning (Plain-English)
**What it is:** A system that can “seal” a file/state into a signed proof object, monitor for change (drift) under defined rules, take predefined actions if drift occurs, and output a portable evidence bundle that anyone can verify later—even offline.

**Why it matters:** Most systems detect issues after the fact and store logs that can be edited. This turns integrity and enforcement into cryptographic proof that survives audits, incidents, disputes, and air-gapped environments.

**Primary brands/products:**
- **Attested Intelligence** = umbrella brand / enterprise direction
- **VerifiedBundle.zip** = portable offline-verifiable evidence bundle product
- **Sovereign Vault** = user-facing vault that creates, stores, and shares seals + bundles

---

## 2) Core Invention (Attested Governance Artifacts)
### Core elements (A–I)
A. Sealed Policy Artifact derived from attestation; includes subject binding + enforcement parameters + signature  
B. Mandatory runtime boundary (“Sentinel/Portal”) must parse artifact before allowing execution  
C. Continuous integrity measurement vs sealed reference; deterministic drift detection  
D. Automatic enforcement actions (kill/quarantine/isolate) triggered by policy mapping  
E. Signed enforcement receipts; emitted per state transition; linked by prev-hash + monotonic counter  
F. Evidence bundle export (artifact + receipts + chain state + manifest) verifiable offline/air-gapped  
G. Privacy-preserving continuity verification using structural metadata hashes excluding payload (payload integrity protected separately)  
H. Optional checkpointing: Merkle batching + anchoring to immutable store  
I. Policy-gated disclosure with substitute claim traversal + substitution receipts

### Threat model (high level)
- Adversary may control local DB/network; cannot forge without private keys.
- Must detect retrospective history rewriting and synthetic evidence fabrication.
- Must remain verifiable offline (no dependence on centralized verification).

---

## 3) MVP-LOCAL v0.1 — “Credible Working Version” Acceptance Test (Non-Negotiable)
### Golden Run (on a clean machine)
1) Create Policy Artifact (deterministic policy_id)
2) Start run under Sentinel boundary
3) Inject deterministic drift
4) Observe enforcement action matches policy mapping
5) Export evidence bundle ZIP

### Offline verify (air-gapped)
Run: `verify bundle.zip`
Output MUST include:
- artifact: OK
- receipts: OK (N/N)
- chain: OK
- drift: YES (receipt #X, reason_code)
- enforcement: ACTION (receipt #Y)
- merkle: SKIPPED (MVP local)
- anchor: SKIPPED (MVP local)
- overall: PASS

### Tamper test
Modify any receipt JSON by 1 character → verifier MUST FAIL with:
- overall: FAIL
- error_code: RECEIPT_SIGNATURE_INVALID or RECEIPT_HASH_MISMATCH
- identifies failing receipt path

---

## 4) Required Modules (MVP Local)
M1) **policy/** canonicalize deterministically; compute policy_id; Ed25519 sign/verify; key_id; versioning  
M2) **subject/** subject_manifest.json deterministic; measurement engine composite hash; drift injector  
M3) **sentinel/** strict lifecycle state machine; refuse run if policy invalid; monitoring loop; enforcement; receipt emission  
M4) **receipts/** stable schema; canonicalization; Ed25519; prev hash chaining; monotonic counter per run_id  
M5) **bundle/** deterministic ZIP; bundle_manifest.json checksums; include policy/receipts/subject/chain head/verifier/README  
M6) **verifier/** standalone; no network; verify zip+policy+receipts+chain+policy mapping; PASS/FAIL report  
M7) **tests/** unit+integration+tamper; “golden run” script

---

## 5) Crypto / IDs / Canonicalization (MUST MATCH)
**Hash:** SHA-256 over bytes  
**Signatures:** Ed25519 over canonical bytes with signature field omitted  
**Canonical JSON (MVP):**
- UTF-8
- object keys sorted lexicographically (byte order)
- no insignificant whitespace
- arrays preserve order
- timestamps ISO 8601 UTC with “Z”

**key_id:** `HEX(SHA-256(raw_public_key_bytes))[0:16]`  
**Determinism:** any random values (salt/run_id) stored; never recomputed.

---

## 6) Exact Schemas (MVP Local)
### 6.1 PolicyArtifact (`/policy/policy_artifact.json`)
Required fields:
- policy_v: "1"
- policy_id: hex sha256 (computed; stored)
- policy_version: "v0.1"
- created_at: ISO 8601 Z
- issuer: { public_key(base64), key_id(16 hex), signature(base64) }
- subject: { subject_type: "FILESYSTEM", subject_manifest_ref: "subject/subject_manifest.json" }
- measurement_set: array of MeasurementSpec
  - type: "FILE_DIGEST"
  - path: relative posix
  - normalize: { line_endings: LF|CRLF|NONE, trim_trailing_whitespace: bool, encoding: UTF-8|BINARY }
- schedule: { interval_ms >= 250 }
- drift_rules: { mode: "STRICT_HASH_MATCH" }
- enforcement_mapping:
  - DRIFT_DETECTED: CONTINUE|QUARANTINE|KILL
  - TTL_EXPIRED: CONTINUE|QUARANTINE|KILL
  - SIGNATURE_INVALID: QUARANTINE|KILL (CONTINUE forbidden)
- ttl: { enabled: bool, expires_at: ISO Z if enabled }
- required_receipts: ["POLICY_LOADED","MEASUREMENT_OK","DRIFT_DETECTED","ENFORCED","BUNDLE_EXPORTED"]
- bundling_rules: { include_merkle: false, include_anchor: false }

### 6.2 SubjectManifest (`/subject/subject_manifest.json`)
- subject_v: "1"
- subject_root_hint: string (informational)
- entries: [{ path, sha256(hex), size_bytes(int), last_modified_at(ISO Z informational) }]
- composite_subject_hash: hex

### 6.3 Receipt (`/receipts/0001.json ... /receipts/00NN.json`)
- receipt_v: "1"
- receipt_id: hex
- run_id: hex (16–64)
- counter: int (starts at 1)
- timestamp: ISO Z
- event_type: POLICY_LOADED|MEASUREMENT_OK|DRIFT_DETECTED|ENFORCED|BUNDLE_EXPORTED
- decision: { action: CONTINUE|QUARANTINE|KILL|NONE, reason_code: OK|HASH_MISMATCH_FILE|TTL_EXPIRED|SIGNATURE_INVALID|SUBJECT_MISSING|POLICY_MISMATCH, details: string }
- policy: { policy_id: hex }
- measurement: { composite_hash: hex, mismatched_paths: string[] }
- chain: { prev_receipt_hash: hex, this_receipt_hash: hex }
- signer: { public_key(base64), key_id(16 hex), signature(base64) }

### 6.4 Chain Head (`/receipts/chain_head.json`)
- chain_v: "1"
- run_id
- receipt_count
- head_counter
- head_receipt_hash (must equal last receipt.this_receipt_hash)
- head_receipt_path (e.g., "receipts/00NN.json")

### 6.5 Bundle Manifest (`/bundle_manifest.json`)
- bundle_v: "1"
- created_at: ISO Z
- policy_id
- run_id
- receipt_count
- chain_head_hash
- files: [{ path(posix in zip), sha256, size_bytes }]
- verifier: { name, version, entrypoint }
- optional: { merkle: "SKIPPED"|object, anchor: "SKIPPED"|object }

---

## 7) ID / Hash Computation Rules (Exact)
### 7.1 policy_id
- policy_bytes = canonicalize(PolicyArtifact WITHOUT issuer.signature AND WITHOUT policy_id)
- policy_id = HEX(SHA-256(policy_bytes))
- set policy_id
- issuer.signature = Ed25519Sign(issuer_privkey, canonicalize(PolicyArtifact WITHOUT issuer.signature))

### 7.2 composite_subject_hash
- For each measurement spec in order:
  - read file bytes
  - normalize per spec
  - digest_i = SHA-256(normalized_bytes)
- composite_subject_hash = HEX(SHA-256(digest_1 || digest_2 || ...))
- SubjectManifest entries sha256 must match digest_i
- Receipt.measurement.composite_hash must match SubjectManifest composite hash for that snapshot

### 7.3 receipt_id
receipt_id = HEX(SHA-256(canonicalize(Receipt WITHOUT signer.signature AND WITHOUT receipt_id)))

### 7.4 this_receipt_hash
this_receipt_hash = HEX(SHA-256(canonicalize(Receipt WITHOUT signer.signature AND WITHOUT chain.this_receipt_hash)))

### 7.5 prev_receipt_hash
- first receipt prev_receipt_hash = "0"*64
- each receipt prev_receipt_hash must equal previous receipt.this_receipt_hash

---

## 8) Sentinel State Machine (Exact)
States:
INIT → POLICY_LOADED → MONITORING → DRIFT_DETECTED → ENFORCED → BUNDLED → (optional) VERIFIED

Transitions (strict):
- INIT → POLICY_LOADED only if policy signature + time window valid
- POLICY_LOADED → MONITORING
- MONITORING → DRIFT_DETECTED on mismatch or TTL expiry
- DRIFT_DETECTED → ENFORCED (must emit ENFORCED)
- ENFORCED → BUNDLED on export

Receipt emission:
- POLICY_LOADED on entry
- MEASUREMENT_OK each tick with no drift
- DRIFT_DETECTED on drift
- ENFORCED immediately after action executed
- BUNDLE_EXPORTED on export

Enforcement semantics:
- CONTINUE: keep monitoring; still emit ENFORCED(action=CONTINUE)
- QUARANTINE: disable further subject execution (MVP: stop invoking subject command)
- KILL: terminate process; ensure ENFORCED receipt flushed before kill whenever possible

Deterministic drift injector:
- append "\nDRIFT-INJECTED" to designated drift_target_path within one interval
- DRIFT_DETECTED reason_code = HASH_MISMATCH_FILE; mismatched_paths includes target path

---

## 9) Evidence Bundle ZIP (Deterministic Layout)
ZIP paths (exact):
/bundle_manifest.json
/policy/policy_artifact.json
/subject/subject_manifest.json
/receipts/0001.json ... /receipts/00NN.json
/receipts/chain_head.json
/verifier/verify.js (or platform binary; must run offline)
/verifier/VERSION.txt
/README.txt

Determinism rules:
- zip entries sorted lexicographically
- avoid varying compression metadata (use STORE if needed)
- manifest lists all files with sha256 + size

README must include:
- verify command
- expected PASS output
- tamper instructions + expected FAIL

---

## 10) Offline Verifier — Required Checks + Error Codes
Order:
V1 unzip/stream read (NO network)
V2 manifest checksums → FAIL: BUNDLE_CHECKSUM_MISMATCH(path)
V3 policy recompute id → POLICY_ID_MISMATCH; signature → POLICY_SIGNATURE_INVALID
V4 receipts per file (ascending counter):
- schema → RECEIPT_SCHEMA_INVALID(path)
- receipt_id → RECEIPT_ID_MISMATCH(path)
- this_receipt_hash → RECEIPT_HASH_MISMATCH(path)
- signature → RECEIPT_SIGNATURE_INVALID(path)
V5 chain continuity:
- counter gaps → COUNTER_GAP
- prev hash mismatch → CHAIN_PREV_HASH_MISMATCH(path)
- chain_head mismatch → CHAIN_HEAD_MISMATCH
V6 policy consistency:
- policy_id mismatches → POLICY_MISMATCH
- required events missing → REQUIRED_EVENT_MISSING(event_type)
V7 drift/enforcement correctness:
- missing/enforced mismatch → ENFORCEMENT_POLICY_MISMATCH
V8 print report:
artifact, receipts (N/N), chain, drift, enforcement, merkle SKIPPED, anchor SKIPPED, overall PASS/FAIL + error_code/path.

---

## 11) Productization: Q1 2026 “Licensable Downloadable Tool”
Two-track model:
- **Track A:** Sovereign Vault + VerifiedBundle (self-serve SaaS; viral proof cards; premium export)
- **Track B:** Enterprise Sentinel (downloadable binaries/containers; license + onboarding)

Pricing starting points:
- Free: 15 seals/month
- Premium: 50 seals/month + bundle export locked behind premium once Arweave is integrated (initially feature-flag)
- Enterprise: license model (customer-held keys preferred; HSM/KMS integration later)

Key custody:
- Consumer Vault: platform signs seals (issuer key); verify via public key
- Enterprise: preferred customer-held signing keys (HSM/KMS) + pinned verifier public keys

---

## 12) Sovereign Vault Web App — Functional Spec (Must Implement)
### Signup + identity
- user chooses username/identifier
- username checked against **bad words list** (also apply to seal text input)
- user enters email
- backend generates **Vault ID**: 13 digits formatted `XXXX-XXXXX-XXXX`
- Vault ID emailed for confirmation
- login is **magic link only** (passwordless). Premium later may allow passwords.

### Sealing flow (file + text)
- Seal UI supports:
  - file upload (limit defined by product; default assume 50MB unless changed)
  - or text input (limit defined; default assume 25k chars unless changed)
  - at least one is required
- Do as much cryptographic analysis **client-side** as possible; do not store user file on server
- Use:
  - device time (captured)
  - a central authoritative server time (captured)
- Store seal hash + metadata associated with Vault ID
- Seals form a non-editable history chain in DB (always link to previous seal)

### Seal object output (visual)
- Render a premium “crystal glass card” seal object:
  - Vault ID
  - timestamp(s)
  - hash summary
  - short description (bad words filtered)
  - centered QR code sized for reliable scanning
- Actions:
  - SAVE → exports high quality PNG
  - SHARE → exports high quality social media post (image-first)
  - “Seal Forever” → Arweave page placeholder (Coming Soon; not active yet)
- QR code resolves to verify portal with parameters to load the seal object.

### Vault page
- displays all sealed objects (non-deletable, non-editable)
- each item: download/share + “Verify”
- premium: “Download VerifiedBundle.zip” (per seal or batch; gated)

### VerifiedBundle.zip (premium deliverable)
- contains: seal card image, seal json/hash file, offline verifier tool, README
- verifier runs offline and confirms PASS/FAIL vs original file + seal bundle

### UI style requirements
- simple, professional, dark UI, military-grade minimal (not “marketing glossy”)
- corporate logo direction (avoid “hacker” vibes)
- legible, reproducible, deterministic outputs (no fragile magic)

---

## 13) Engineering Standards / Preferences (Process)
- Outputs and specs must be deterministic and testable (no hand-wavy steps).
- “No margin for error” build instructions; copy/paste-ready.
- Prefer reproducibility: golden run script + tamper tests required.
- Do not embed secrets (keys/API tokens) in docs or repos; use env vars and secure storage.

---

## 14) Open Decisions (Define early, then lock)
- File size limit for browser-side hashing (e.g., 50MB / 250MB)
- Text character limit
- Which timestamp authority (server time only vs optional RFC3161 TSA later)
- Exact DB schema + RLS policies
- Stripe tier gating timing (immediate vs v0.2)
- Whether to use Merkle chunking for large file proofs (phase 2)

---

## 15) “What success looks like”
**MVP success (consumer):**
- User can create vault, seal, verify, share, and export bundles.
- Verifier reliably fails on tamper.
- Seal cards spread with QR → new users.

**Enterprise readiness (phase next):**
- Sentinel boundary + receipts + offline bundle proves enforcement happened.
- Golden Run works on a clean machine with no network.
Company Structure

Attested Intelligence owns NeuroCrypt Protocol, which powers various products
Primary branding for investor/acquisition conversations: "Attested Intelligence" or "Attested Governance"
"NeuroCrypt" is the company entity name but not preferred for external materials


What It Is
Attested Governance is a cryptographic attestation platform that creates Attested Governance Artifacts (AGA) - sealed policy objects that enforce runtime behavior with cryptographic receipts and tamper-evident chains for autonomous AI systems.
Core innovation: Transforms passive audit logging into active compliance enforcement. The system doesn't just record what happened—it controls what's allowed to happen and generates mathematical proof of its own enforcement.

Business Strategy
Target Outcome

$10M+ acquisition by strategic buyer
NOT building long-term SaaS; using working implementation as proof-of-concept to demonstrate patent value
IP-first strategy: patent portfolio + working demo + reference customer = acquisition package

Target Acquirers

Industrial Security: Dragos, Claroty, Nozomi (OT security, actively acquiring)
Defense Primes: Lockheed Ventures, RTX Ventures, Northrop innovation arms
Enterprise Security: Palo Alto, CrowdStrike, Palantir
Cloud Majors: Microsoft, AWS (have adjacency via Confidential Computing)

Timeline Reality

6-12 months: Build working implementation
3-6 months: Land pilot customer
6-12 months: Acquisition process
Total: 18-30 months to exit

What's Needed for $10M Exit

Patent granted (or progressing through prosecution)
Working implementation passing Golden Run test
One pilot customer or LOI (ideally defense or critical infrastructure)


Target Markets
MarketUse CasesWhy It MattersDefense/DoDAutonomous drones, AI agents, weapons systemsProvable compliance for autonomous operationsCritical InfrastructureSCADA, ICS, power grid, water systemsRegulatory pressure, tamper-evident audit trailsEnterprise AIAgent governance, model integrity, complianceAI agents proliferating, need accountability
Combined TAM: $18B+ (OT Security + AI Governance + Defense Cyber)

Intellectual Property
Patent Status

USPTO application filed: "Systems and Methods for Generating Attested Governance Artifacts"
20 claims (3 independent)
Micro entity certification for fee reduction

Independent Claims Summary
Claim 1 - Runtime Integrity Enforcement:

Receiving evaluated subject
Generating subject identifier (bytes hash + metadata hash)
Performing attestation with salted hash commitment
Generating policy artifact with sealed hash and signature
Portal runtime that parses artifact and computes current hash
Comparing at measurement cadence
Automatic enforcement + signed receipt to continuity chain

Claim 2 - Privacy-Preserving Disclosure:

Claims taxonomy with sensitivity classification
Automatic substitute traversal when disclosure denied
Substitution receipt generation
(Not implemented in Pro spec - Enterprise extension)

Claim 3 - Continuity Chain System:

Genesis event with protocol version, root fingerprint
Continuity events with payload hash + signature
Leaf hash from structural metadata only (privacy-preserving)
Merkle tree batching and checkpoint anchoring
(Pro uses simplified full-receipt hashing; structural-metadata is Enterprise)

Patent-Spec Alignment Notes

Spec implements core of Claim 1 - policy artifact → portal enforcement → signed receipts → chain
Claim 2 not in Pro - disclosure substitution is Enterprise-only
Claim 3 partially covered - Pro hashes full receipts, not structural metadata only
Key point: Spec is inside the patent's fence; gaps are features not yet built, not holes in coverage


Technical Specification (v1.1.6)
Architecture Components
ComponentFunctionPolicy ArtifactSigned, immutable governance object defining integrity policy, telemetry policy, enforcement mapping, keys, validity windowLaunch GateRequired entry point; validates policy before allowing executionLocal Governance Engine (LGE)Runtime enforcement; monitors telemetry, evaluates drift, executes actions, generates receiptsEvidence BundlePortable verification package; enables offline auditOffline VerifierDeterministic verification tool; outputs PASS / PASS_WITH_CAVEATS / FAIL
Policy Artifact Structure
policy_version (monotonic integer)
vault_id, artifact_id
issued_at, not_before, not_after
issuer (issuer_id, issuer_public_key, issuer_signature)
integrity_policy
telemetry_policy
enforcement_policy
key_schedule
policy_hash
optional previous_artifact_ref
Integrity Policy

Subject identity: container_image_digest = sha256:<hex>
Baselines: container_image_digest, config_digest, sbom_digest
Drift rule: Strict equality (any mismatch triggers)
Measurement timing: Pro checks at run start only; continuous re-measurement is Enterprise

Config Digest Sources

CONFIG_SOURCE_A (recommended): Launch Manifest canonical JSON
CONFIG_SOURCE_B: Specific config files with deterministic hashing
CONFIG_SOURCE_C: Customer-provided canonical config JSON

Telemetry Policy

Up to 5 streams per artifact
Push-only ingestion
JSON minimum format
Per-stream: cadence_seconds, drift_rule (RANGE/THRESHOLD), missing_data_tolerance, late_data_policy, enforcement_mapping

Enforcement Actions
ActionMechanismBLOCK_STARTLaunch Gate refuses to start workloadKILLLGE stops container via Docker APIALERTAppend ActionRecord to JSONL file
Critical constraint: No arbitrary command execution. System cannot become attack vector.
Key Model

Signatures: Ed25519
Hash function: SHA-256
Key derivation: HKDF-SHA256 from Vault Root Seed
Derivation formula: seed_32 = HKDF-SHA256(ikm=VRS, salt=empty, info="attested-governance:telemetry:" || vault_id || ":" || artifact_id || ":" || stream_id, length=32)

Receipt Types

RUN_STARTED
DRIFT_DETECTED
MISSING_DATA
LATE_DATA
ENFORCEMENT_ACTION
RUN_ENDED
CHECKPOINT

Hash Chain

Receipts are append-only, hash-linked (prev_hash → hash)
Receipt hash = SHA-256(canonical_receipt_bytes)
Checkpoints with inclusion proofs for critical receipts

Time Model

HIGH_ASSURANCE (default): TSA token per receipt
HIGH_ASSURANCE_STRICT: If TSA unavailable, BLOCK_START
Degraded mode: Continue locally, mark DEGRADED_LOCAL, verifier outputs PASS_WITH_CAVEATS

Evidence Bundle Contents

PolicyArtifact + issuer signature
Receipt ledger (JSONL) + checkpoints + inclusion proofs
ActionRecord queue extract
Third-party attestation objects (if used)
Offline verifier report + report_hash

Verifier Output Contract

verdict: PASS | PASS_WITH_CAVEATS | FAIL
reasons[] (machine-readable)
Determinism: Identical bundle bytes → identical verifier output

Resource Bounds (Appendix C)

O(1) per-event processing
Bounded in-memory queues
Backpressure (HTTP 429) or drop non-critical with RESOURCE_PRESSURE
Ledger rotation/segmentation at configured thresholds

Sequence Number Constraints

Maximum: 2^53 - 1 (JSON number precision limit)
At 1000 events/sec: ~285,616 years per (run_id, stream_id)
On overflow: finalize run, start new governed run


Test Vectors (Appendix B)
TV-JCS-001 (Canonicalization)
json{"artifact_id":"art_01HXYZTEST0000000000000001","measurement_id":"m_0001","measurement_time":1735600000,"run_id":"run_01HXYZTEST0000000000000001","sequence_number":1,"stream_id":"pressure_psi","value":42}
SHA-256 (base64url): uM22uzzEnt39f1ZO14U_gZ7C7mGvCW87JPKCvgRGe-Q
TV-SIG-001 (Ed25519)

Public key: lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg
Private key (TEST ONLY): S38UdZHLAVZYYoGvjvmF1gp-L2Yo6KDXAPukOiLMMx0
key_id: 36ee3280c62ed537
Signature: uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8WRKB0uJurjCg


Enterprise Extensions (Future)

More than 5 streams per policy
Sub-second ingest rates
Continuous integrity re-measurement
Quarantine/phantom execution modes
Multi-host HA (Kubernetes)
Advanced drift rules (statistical, correlation, model-based)
HSM-backed custody
Role-based approvals, multi-signer attestations
Structural-metadata leaf hashing (per patent Claim 3)
Privacy-preserving disclosure with substitution (per patent Claim 2)


Claim Boundaries (Section 19)
System DOES Prove

What policy was minted
What signed inputs were received
What drift was detected
What enforcement actions were executed
With chained receipts and time attestation

System Does NOT Prove

Absolute security of customer environment
Unbypassable enforcement outside governed runs
Correctness of customer sensors/hardware

Enforcement guarantees apply only to Governed Runs started via Launch Gate.

Design Aesthetic

"Kinetic Cyber" aesthetic
Primary colors: Void (#0A0E17), Signal Cyan (#00D4FF)
Typography: Space Grotesk
Design elements: Glass morphism, Framer Motion animations
Positioning tagline: "The Integrity Layer for Autonomous Defense"


Technical Stack

Applications: Next.js with Supabase PostgreSQL
Cryptography: Ed25519 signing, SHA-256 hashing, HKDF-SHA256 key derivation
Deployment: Vercel, Docker Compose (reference deployment)
Blockchain anchoring: Arweave (for Enterprise tier)
Communications: Resend
Development tools: Claude Code, Claude Chrome Extension


Key Differentiators

Active governance - Enforces at runtime, not passive logging
Local-first - Core guarantees work without cloud
Offline verification - Evidence bundles verify in air-gapped environments
No attack surface - Only BLOCK/KILL/ALERT, no arbitrary execution
Deterministic resources - O(1) processing, bounded queues (SCADA-ready)
Privacy-preserving continuity - Chain integrity verifiable without payload disclosure (Enterprise)


Golden Run Acceptance Test

Mint PolicyArtifact with integrity baselines + 2 telemetry streams
Deploy LGE via Docker Compose
Start governed run via Launch Gate → RUN_STARTED
Push valid telemetry ≥3 minutes → no drift
Induce telemetry drift → DRIFT_DETECTED + ALERT
Induce missing data → MISSING_DATA + ALERT
Induce integrity drift at start → BLOCK_START or KILL
Finalize run → RUN_ENDED + CHECKPOINT
Generate Evidence Bundle → Offline Verifier PASS
Attempt rerun after expiration → BLOCK_START + EXPIRED_ARTIFACT


Most Valuable Use Case (Next 10 Years)
AI Agent Governance - AI agents operating autonomously (financial transactions, infrastructure management, autonomous vehicles) need:

Proof that only authorized model versions ran
Real-time enforcement of operational parameters
Tamper-proof audit trails for regulators
Offline verification that doesn't require trusting the AI system

This is the infrastructure for accountable AI.


our most reent product spec . . .
ATTESTED GOVERNANCE
Pro / Enterprise Specification v1.1.2 (Hardened)
Status: Implementation-Ready
Issued: 2025-12-30
This document defines the Pro v1.1.2 reference implementation (single-host Docker) and the Enterprise extension
surface. It is written as a normative specification using MUST/SHOULD/MAY language.
Table of Contents
1. Scope and Guarantees
2. Definitions
3. Product Contract (Inputs / Outputs)
4. Architecture (Portal, Local Governance Engine, Launch Gate, Offline Verifier)
5. Policy Artifact (Structure and Canonicalization)
6. Integrity Policy (Subject + Baselines + Drift)
7. Telemetry Policy (Streams, Cadence, Drift, Missing, Late)
8. Key Model (Signed Requests, Manual Rotation)
9. Local API Contract
10. Enforcement Policy (BLOCK_START, KILL, ALERT)
11. Time Model and Assurance Modes (TSA per Receipt)
12. Receipts Ledger, Hash Chain, and Checkpoints
13. Evidence Bundle and Offline Verification Contract
14. Third-Party Attestation Flow (Optional)
15. Artifact Validity, Licensing, and Anti-Reuse
16. Deployment Wizard and Package Outputs
17. Golden Run Acceptance Test
18. Enterprise Extensions (Non-breaking)
19. Claim Boundaries and Liability-Safe Positioning
1. Scope and Guarantees
This specification defines a local-first governance system that binds a signed Policy Artifact to a
governed runtime subject and telemetry streams, detects drift deterministically, enforces locally, and
produces offline-verifiable evidence bundles.
1.1 In-scope (Pro v1.1.2)
 Single-host Docker reference deployment (local authoritative).
 Policy Artifact with two policy blocks: integrity_policy and telemetry_policy.
 Telemetry ingestion: push-only, JSON minimum, up to five (5) streams per artifact.
 Signed requests (Ed25519) for telemetry ingestion.
 Manual key rotation with immediate invalidation of prior keys.
 Local enforcement actions: BLOCK_START (via Launch Gate), KILL (stop governed process/container),
ALERT (append-only action queue/file).
 Receipts: append-only, hash-chained, checkpointed; inclusion proofs for critical receipts.
 Time attestation: TSA token per receipt, with defined assurance-mode fallback behavior.
 Optional third-party attestation workflow over a customer-supplied launcher/package.
 Evidence Bundle + Offline Verifier contract (PASS / PASS_WITH_CAVEATS / FAIL).
 Artifact validity: time-bounded by default (subscription/license), anti-reuse enforced locally.
1.2 Out-of-scope (Pro v1.1.2)
 Authoritative cloud enforcement or cloud dependency for core guarantees.
 Arbitrary command execution as an enforcement action.
 Guaranteed prevention of bypass outside of governed runs (see Claim Boundaries).
 Continuous integrity re-measurement at runtime (Enterprise extension).
 Multi-host HA deployments (Enterprise extension).
2. Definitions
Vault: A customer account container identified by vault_id; owns Policy Artifacts, Runs, Receipts, and
Evidence Bundles.
Policy Artifact: A signed, versioned, time-bounded governance object defining integrity policy, telemetry
policy, enforcement mapping, keys, and validity window.
Run: A governed execution instance bound to a Policy Artifact; identified by run_id.
Governed Run: A run started via Launch Gate and recorded as RUN_STARTED in the Local Governance
Engine (LGE) ledger.
Ungoverned Run: Any execution not started via Launch Gate or not bound to a valid Policy Artifact and
receipt chain; enforcement guarantees MUST NOT be claimed.
Receipt: An append-only event record emitted by LGE; hash-linked to prior receipts; time-attested per
the time model.
Evidence Bundle: A packaged set of artifacts and proofs enabling deterministic offline verification of a
run.
Offline Verifier: An offline tool that validates signatures, chains, checkpoints, and policy validity; outputs
PASS/PASS_WITH_CAVEATS/FAIL.
Integrity Drift: Any deviation between observed subject/baselines and integrity_policy baselines (strict
equality in Pro v1.1.2).
Telemetry Drift: Any deviation between ingested stream values and telemetry_policy rules
(range/threshold, missing, late).
Launch Gate: The required wrapper/CLI used to start governed runs and implement BLOCK_START
semantics.
TSA: Time-Stamping Authority; used to produce a verifiable timestamp token over receipt material.
3. Product Contract (Inputs / Outputs)
3.1 Customer inputs
 Account setup: username + email (magic-link verification); optional 2FA/password (not securitycritical to enforcement).
 Policy inputs per Policy Artifact:
 Integrity: container_image_digest, config_digest source selection + payload, sbom_digest source
selection + payload.
 Telemetry: up to five (5) stream definitions (stream_id, cadence, drift rule, missing/late rules,
enforcement mapping).
 Runtime inputs (local): signed telemetry measurement events pushed to LGE.
 Optional: customer launcher/package upload for third-party attestation flow.
3.2 System outputs
 Signed Policy Artifact (issuer-signed) with not_before/not_after validity window.
 Local Governance Engine container (LGE) + local ledger + evidence bundler.
 Launch Gate wrapper implementing BLOCK_START and producing RUN_STARTED receipt.
 Local enforcement: KILL (stop governed workload), ALERT (action record output).
 Evidence Bundle for each run; Offline Verifier output report with stable report_hash.
 Optional: third-party attestation receipts and signatures included in Evidence Bundle.
4. Architecture
4.1 Components
 Issuer Portal (web): policy minting, license validity, optional third-party attestation workflow,
downloads.
 Local Governance Engine (LGE): local API, verification, drift evaluation, enforcement, receipts ledger,
checkpoints, evidence bundling.
 Launch Gate (LG): required start wrapper that validates policy and starts governed runs.
 Offline Verifier (OV): deterministic offline verification tool and report generator.
4.2 Reference deployment (Pro v1.1.2)
 Single-host Docker deployment is normative reference.
 LGE MUST be authoritative locally; core guarantees MUST NOT depend on cloud availability.
 Governed workload MUST be launched via Launch Gate; otherwise it is ungoverned.
5. Policy Artifact (Structure and Canonicalization)
PolicyArtifact is the central governance object. It MUST be canonicalized deterministically and issuersigned.
5.1 Required fields (minimum)
 policy_version (monotonic integer)
 vault_id, artifact_id
 issued_at, not_before, not_after
 issuer (issuer_id, issuer_public_key, issuer_signature)
 integrity_policy (Section 6)
 telemetry_policy (Section 7)
 enforcement_policy (Section 10)
 key_schedule (Section 8)
 policy_hash (hash of canonical PolicyArtifact excluding issuer_signature)
 optional previous_artifact_ref (prior_artifact_id, prior_policy_hash)
5.2 Canonicalization and hashing
 Canonicalization MUST be deterministic. Recommended: JCS / RFC 8785 or equivalent.
 All signatures and hashes MUST be computed over canonical bytes.
 Hashes MUST use SHA-256. Encodings MUST be base64url where transported as text.
6. Integrity Policy (Subject + Baselines + Drift)
6.1 Subject identity (locked)
 Subject identity MUST be container_image_digest = sha256:<hex>.
6.2 Baseline commitments (locked)
 Integrity baselines MUST include: container_image_digest, config_digest, sbom_digest.
6.3 Strict drift rules (locked)
 Integrity drift MUST trigger if any observed digest != baseline digest (strict equality).
6.4 Pro v1.1.2 measurement timing
 Pro v1.1.2 MUST evaluate integrity baselines at run start (Launch Gate).
 Pro v1.1.2 MAY accept additional integrity checkpoints if customer provides observed digests during
the run.
 Continuous integrity re-measurement is an Enterprise extension.
6.5 Config digest sources (policy-declared)
 PolicyArtifact MUST declare exactly one config source type:
 CONFIG_SOURCE_A (RECOMMENDED): Launch Manifest canonical JSON (image digest,
command/args, env vars policy, optional mounted config file hashes).
 CONFIG_SOURCE_B: Specific config files (ordered list of file paths + deterministic hashing rules).
 CONFIG_SOURCE_C: Customer-provided canonical config JSON (provided at mint time).
 config_digest MUST be SHA-256(canonical_bytes_of_declared_config_source).
6.6 SBOM digest sources (policy-declared)
 Default SBOM format MUST be SPDX JSON (Enterprise MAY add others).
 sbom_digest MUST be SHA-256(canonical_sbom_json_bytes).
7. Telemetry Policy (Streams, Cadence, Drift, Missing, Late)
7.1 Streams (locked)
 telemetry_policy MUST support up to five (5) streams per Policy Artifact.
 Telemetry ingestion MUST be push-only in Pro v1.1.2.
 Minimum payload format MUST be JSON.
7.2 StreamDefinition required fields
 stream_id (string)
 cadence_seconds (>0)
 drift_rule: RANGE(min,max) OR THRESHOLD(comparator, value)
 missing_data_tolerance_seconds (>=0)
 late_data_policy (configurable) with grace_seconds (CUSTOM per stream)
 enforcement_mapping for on_drift / on_missing / on_late (must be subset of
BLOCK_START/KILL/ALERT)
7.3 Missing data semantics
 If no valid measurement received within cadence_seconds + missing_data_tolerance_seconds, LGE
MUST emit MISSING_DATA and at minimum ALERT.
7.4 Late data semantics (locked configurable per stream)
 Late evaluation MUST be per stream and configurable by policy.
 If measurement_time is later than expected by more than grace_seconds, LGE MUST emit
LATE_DATA and at minimum ALERT.
 grace_seconds MUST be customer-configurable (CUSTOM).
8. Key Model (Signed Requests, Manual Rotation)
8.1 Algorithms
 Signatures MUST use Ed25519.
 Hash function MUST be SHA-256.
8.2 Vault root and derived stream keys (locked intent)
 Customer holds Vault Root Seed (VRS); it MUST NOT be stored on-chain.
 Per-stream sender keypairs MUST be derived deterministically from the Vault Root Seed (VRS) and
stream_id using HKDF-SHA256. Derivation MUST use the following HKDF 'info' string format (ASCII):
"attested-governance:telemetry:" || vault_id || ":" || artifact_id || ":" || stream_id. The derived
output MUST be used to produce an Ed25519 private key for that stream.
 Only derived public keys MUST be embedded in PolicyArtifact.key_schedule.
8.3 Manual rotation (locked)
 Rotation is manual.
 Old keys become invalid immediately upon rotation (no overlap).
 Rotation MUST mint a new Policy Artifact version with updated key_schedule and revoked_key_ids.
 LGE MUST reject telemetry signed by revoked keys.
9. Local API Contract
9.1 Endpoints (minimum)
 POST /v1/ingest/{vault_id}/{artifact_id}/{stream_id}
 GET /v1/status
 POST /v1/finalize/{run_id}
 GET /v1/evidence/{run_id}
9.2 Signed ingest request contract
 Request body MUST include the following fields (canonical JSON):
 vault_id (string) - MUST match the vault_id path segment.
 artifact_id (string) - MUST match the artifact_id path segment.
 run_id (string) - MUST reference an active governed run recorded by RUN_STARTED for the same
{vault_id, artifact_id}.
 stream_id (string) - MUST match the stream_id path segment and MUST be declared in
telemetry_policy for artifact_id.
 sequence_number (integer) - MUST be monotonically increasing per (run_id, stream_id) starting at
1.
 measurement_id (string) - unique identifier for this measurement event (for audit correlation).
 measurement_time (timestamp or monotonic tick) - used for cadence/late evaluation; MUST be
present.
 value (number) - the measured value.
 optional metadata (object) - e.g., unit, sensor_id; MUST NOT affect drift unless explicitly modeled.
 Headers MUST include: x-key-id, x-signature, x-sig-alg='ed25519', x-body-hash (SHA-256 of canonical
body).
 Replay protection: LGE MUST track last_accepted_sequence_number for each (run_id, stream_id)
and MUST reject any request where sequence_number <= last_accepted_sequence_number for
that pair.
 LGE MUST canonicalize JSON deterministically, verify x-body-hash and x-signature using the declared
sender_public_key for stream_id, and reject if any path/body bindings do not match.
 If verification fails, LGE MUST reject the request and emit INVALID_SIGNATURE or
REPLAY_DETECTED events and at minimum ALERT.
9.3 Runtime Context Provisioning (normative)
Telemetry clients MUST obtain the values required to call the bound ingest path: vault_id, artifact_id,
run_id, stream_id, and the LGE base URL.
9.3.1 Required values
vault_id: owning vault identifier (string).
artifact_id: policy artifact identifier (string).
run_id: unique per governed run, generated by Launch Gate at start (string).
lge_url: base URL for the local LGE (e.g., http://127.0.0.1:8080).
9.3.2 Delivery mechanisms
ENV_INJECTION (RECOMMENDED; MUST): Launch Gate MUST set the following environment variables
on the governed workload process/container before start: AG_VAULT_ID, AG_ARTIFACT_ID,
AG_RUN_ID, AG_LGE_URL.
CONTEXT_FILE (OPTIONAL): Launch Gate MAY write a context JSON file and mount it read-only into the
governed workload at a known path (default: /var/run/attested-governance/context.json). The JSON
MUST include: vault_id, artifact_id, run_id, lge_url, policy_hash, issued_at.
9.3.3 Client resolution rules (normative)
Telemetry client MUST read AG_VAULT_ID/AG_ARTIFACT_ID/AG_RUN_ID/AG_LGE_URL if present;
otherwise it MUST read the context file path (if provided). If neither is present, the workload is
misconfigured and MUST treat itself as ungoverned (no enforcement guarantees claimed).
9.3.4 LGE validation rules (normative)
LGE MUST treat {vault_id, artifact_id} in the ingest path as an explicit binding. LGE MUST reject
telemetry if: (i) run_id is unknown or closed; (ii) run_id is not bound to {vault_id, artifact_id}; or (iii)
stream_id is not declared for that artifact.
10. Enforcement Policy (BLOCK_START, KILL, ALERT)
Pro v1.1.2 enforcement actions are restricted to BLOCK_START, KILL, and ALERT. Arbitrary command
execution is explicitly prohibited in Pro v1.1.2.
10.1 BLOCK_START (normative mechanism)
 Implement BLOCK_START via Launch Gate. Launch Gate MUST validate policy signature and validity
window before starting the workload.
 If validation fails, Launch Gate MUST refuse start and emit ENFORCEMENT_ACTION(BLOCK_START)
receipt and ActionRecord.
10.2 KILL (normative mechanism)
 Governed workload MUST be launched with labels: vault_id, artifact_id, run_id.
 LGE MUST be able to stop the governed workload (container). Customer may grant LGE Docker
socket access as a deployment choice.
 On KILL, LGE MUST stop the container and emit ENFORCEMENT_ACTION(KILL) receipt and
ActionRecord.
10.3 ALERT (normative mechanism)
 ALERT MUST append a structured ActionRecord to an append-only JSONL queue/file on the host.
10.4 ActionRecord schema (normative)
 action_type: 'ALERT' | 'KILL' | 'BLOCK_START' (enum only)
 reason_code: enum (DRIFT_INTEGRITY, DRIFT_TELEMETRY, MISSING_DATA, LATE_DATA,
EXPIRED_ARTIFACT, INVALID_SIGNATURE, TSA_UNAVAILABLE, etc.)
 vault_id, artifact_id, run_id
 receipt_hash (or receipt_id) correlating to the ledger event
 time_source and timestamp fields (Section 11)
 No free-form shell commands or executable payloads are permitted in Pro v1.1.2 ActionRecord.
11. Time Model and Assurance Modes (TSA per Receipt)
11.1 Modes
 HIGH_ASSURANCE (default): LGE attempts TSA token per receipt.
 HIGH_ASSURANCE_STRICT (optional policy flag): if TSA unavailable, Launch Gate MUST
BLOCK_START (fail closed).
11.2 TSA outage behavior (normative)
 In HIGH_ASSURANCE (non-strict), if TSA is unavailable, LGE MUST continue local enforcement when
inputs validate, mark receipts DEGRADED_LOCAL, and Offline Verifier MUST output
PASS_WITH_CAVEATS (not PASS).
11.3 Receipt time fields (required)
 local_time
 monotonic_counter
 tsa_token (when available)
 time_source: 'TSA' | 'DEGRADED_LOCAL'
12. Receipts Ledger, Hash Chain, and Checkpoints
12.1 Hash chain
 Receipts MUST be append-only and hash-linked (prev_hash -> hash).
 Receipt hash MUST be SHA-256(canonical_receipt_bytes).
12.2 Minimum receipt types
 POLICY_ACCEPTED
 RUN_STARTED
 DRIFT_DETECTED
 MISSING_DATA
 LATE_DATA
 MISSING_DATA
 ENFORCEMENT_ACTION
 RUN_ENDED
 CHECKPOINT
12.3 Checkpoints and inclusion proofs
 LGE MUST produce CHECKPOINT at RUN_ENDED.
 Evidence Bundle MUST include inclusion proofs for critical receipts: RUN_STARTED, any
DRIFT_DETECTED, any ENFORCEMENT_ACTION, RUN_ENDED, and CHECKPOINT root.
13. Evidence Bundle and Offline Verification Contract
13.1 Bundle minimum contents
 PolicyArtifact (canonical JSON) + issuer signature
 Issuer public key MUST be available to the Offline Verifier: it is embedded in PolicyArtifact. A verifier
MAY additionally pin issuer_public_key via a local trust store; if pinned, it MUST match the
embedded key.
 Receipt ledger (JSONL) + checkpoints + inclusion proofs
 ActionRecord queue extract (if stored separately)
 Third-party attestation objects and signatures (if used)
 Offline verifier report (JSON) + report_hash; optional PDF report
13.2 Privacy defaults (locked)
 Default bundle includes summaries/hashes; raw sensor values are optional and policy-controlled.
13.3 Verifier output contract (normative)
 verdict: PASS | PASS_WITH_CAVEATS | FAIL
 reasons[] (machine-readable)
 verified_artifact_hash, verified_receipt_chain_head, checkpoint verification results
 tsa verification results and validity window evaluation
 report_hash = SHA-256(canonical_report_bytes)
 Determinism: identical bundle bytes MUST produce identical verifier output bytes.
14. Third-Party Attestation Flow (Optional)
 Customer uploads launcher/package; system computes file_hash and freezes file.
 Customer chooses: Proceed OR Third-party attestation (no skip label).
 Third party receives one-time link; view/download only; approve/deny; notes; optional signature.
 After decision, customer must click CONFIRM to proceed; system re-hashes and verifies file identity.
 Attestation receipts MUST be included in Evidence Bundle if attestation is used.
15. Artifact Validity, Licensing, and Anti-Reuse
 PolicyArtifact validity is time-bounded by default: not_after aligns to subscription/license end.
 Launch Gate MUST refuse governed starts when current time > not_after (EXPIRED_ARTIFACT).
 LGE MUST reject telemetry under expired artifacts and emit EXPIRED_ARTIFACT events and at
minimum ALERT.
 A 'Forever artifact' MAY exist as a separate SKU/mint process and MUST be explicitly distinguishable
(license_class=FOREVER).
16. Deployment Wizard and Package Outputs
 Wizard output SHOULD be the simplest effective 'ready-to-run' package: docker-compose.yml +
env/config + documented local paths.
 Dockerfile MAY be included for advanced builds, but Compose is the default deliverable.
 Package MUST document action queue/file path and required permissions.
 Package SHOULD include a minimal ingestion example (optional) and health check instructions.
17. Golden Run Acceptance Test
1. Mint PolicyArtifact with integrity baselines (image/config/SBOM) and at least two telemetry streams
(<=5).
2. Deploy LGE via Docker Compose on a single host.
3. Start governed run via Launch Gate -> RUN_STARTED receipt emitted.
4. Push valid signed telemetry for >=3 minutes -> no drift.
5. Induce telemetry drift (out-of-range) -> DRIFT_DETECTED + ALERT ActionRecord.
6. Induce missing data beyond tolerance -> MISSING_DATA + ALERT.
7. Induce integrity drift at start (mismatch baseline) -> BLOCK_START or KILL based on mapping;
evidence logged.
8. Finalize run -> RUN_ENDED + CHECKPOINT.
9. Generate Evidence Bundle -> Offline Verifier PASS (or PASS_WITH_CAVEATS if TSA degraded) with
stable report_hash.
10. Attempt rerun after expiration -> Launch Gate BLOCK_START and log EXPIRED_ARTIFACT.
18. Enterprise Extensions (Non-breaking)
 More than 5 streams per policy; higher ingest rates (sub-second).
 Continuous integrity re-measurement and quarantine modes.
 Multi-host HA deployments (Kubernetes).
 Advanced drift rules (statistical, correlation, model-based).
 HSM-backed custody, role-based approvals, multi-signer attestations.
 Optional non-authoritative convenience mirror (cloud) - not required for core claims.
19. Claim Boundaries and Liability-Safe Positioning
 System proves: what policy was minted; what signed inputs were received; what drift was detected;
what enforcement actions were executed by LGE; with chained receipts and time attestation per
mode.
 System does NOT prove: absolute security of customer environment; unbypassable enforcement
outside governed runs; correctness of customer sensors/hardware.
 Enforcement guarantees apply only to Governed Runs started via Launch Gate and recorded in the
ledger.
Appendix A. Quick Reference (Normative)
Ingest endpoint: POST /v1/ingest/{vault_id}/{artifact_id}/{stream_id}
Max streams per artifact: 5
Signatures: Ed25519 over canonical JSON; Hash: SHA-256; Encoding: base64url
Enforcement actions (Pro v1.1.2): BLOCK_START, KILL, ALERT (no arbitrary command
execution)
Minimum receipt fields (all receipts): type, vault_id, artifact_id, run_id, sequence_number,
prev_hash, receipt_hash, local_time, monotonic_counter, time_source, tsa_token (if
time_source=TSA), issuer_signature (if applicable).

ATTESTED GOVERNANCE
Pro / Enterprise Specification v1.1.6 (Perfected)
Status: Implementation-Ready
Issued: 2025-12-30
This document defines the Pro v1.1.6 reference implementation for Attested Governance Pro (single-host, local-first) and
the Enterprise extension surface. It is written as a normative specification using MUST/SHOULD/MAY language.
Table of Contents
1. Scope and Guarantees
2. Definitions
3. Product Contract (Inputs / Outputs)
4. Architecture (Portal, Local Governance Engine, Launch Gate, Offline Verifier)
5. Policy Artifact (Structure and Canonicalization)
6. Integrity Policy (Subject + Baselines + Drift)
7. Telemetry Policy (Streams, Cadence, Drift, Missing, Late)
8. Key Model (Signed Requests, Manual Rotation)
9. Local API Contract
10. Enforcement Policy (BLOCK_START, KILL, ALERT)
11. Time Model and Assurance Modes (TSA per Receipt)
12. Receipts Ledger, Hash Chain, and Checkpoints
13. Evidence Bundle and Offline Verification Contract
14. Third-Party Attestation Flow (Optional)
15. Artifact Validity, Licensing, and Anti-Reuse
16. Deployment Wizard and Package Outputs
17. Golden Run Acceptance Test
18. Enterprise Extensions (Non-breaking)
19. Claim Boundaries and Liability-Safe Positioning
Appendix A. Quick Reference (Normative)
Appendix B. Formal Test Vectors (Normative)
Appendix C. Resource Consumption Bounds (Normative)
1. Scope and Guarantees
This specification defines a local-first governance system that binds a signed Policy Artifact to a
governed runtime subject and telemetry streams, detects drift deterministically, enforces locally, and
produces offline-verifiable evidence bundles.
1.1 In-scope (Pro v1.1.6)
 Single-host Docker reference deployment (local authoritative).
 Policy Artifact with two policy blocks: integrity_policy and telemetry_policy.
 Telemetry ingestion: push-only, JSON minimum, up to five (5) streams per artifact.
 Signed requests (Ed25519) for telemetry ingestion.
 Manual key rotation with immediate invalidation of prior keys.
 Local enforcement actions: BLOCK_START (via Launch Gate), KILL (stop governed process/container),
ALERT (append-only action queue/file).
 Receipts: append-only, hash-chained, checkpointed; inclusion proofs for critical receipts.
 Time attestation: TSA token per receipt, with defined assurance-mode fallback behavior.
 Optional third-party attestation workflow over a customer-supplied launcher/package.
 Evidence Bundle + Offline Verifier contract (PASS / PASS_WITH_CAVEATS / FAIL).
 Artifact validity: time-bounded by default (subscription/license), anti-reuse enforced locally.
1.2 Out-of-scope (Pro v1.1.6)
 Authoritative cloud enforcement or cloud dependency for core guarantees.
 Arbitrary command execution as an enforcement action.
 Guaranteed prevention of bypass outside of governed runs (see Claim Boundaries).
 Continuous integrity re-measurement at runtime (Enterprise extension).
 Multi-host HA deployments (Enterprise extension).
2. Definitions
Vault: A customer account container identified by vault_id; owns Policy Artifacts, Runs, Receipts, and
Evidence Bundles.
Policy Artifact: A signed, versioned, time-bounded governance object defining integrity policy, telemetry
policy, enforcement mapping, keys, and validity window.
Run: A governed execution instance bound to a Policy Artifact; identified by run_id.
Governed Run: A run started via Launch Gate and recorded as RUN_STARTED in the Local Governance
Engine (LGE) ledger.
Ungoverned Run: Any execution not started via Launch Gate or not bound to a valid Policy Artifact and
receipt chain; enforcement guarantees MUST NOT be claimed.
Receipt: An append-only event record emitted by LGE; hash-linked to prior receipts; time-attested per
the time model.
Evidence Bundle: A packaged set of artifacts and proofs enabling deterministic offline verification of a
run.
Offline Verifier: An offline tool that validates signatures, chains, checkpoints, and policy validity; outputs
PASS/PASS_WITH_CAVEATS/FAIL.
Integrity Drift: Any deviation between observed subject/baselines and integrity_policy baselines (strict
equality in Pro v1.1.6).
Telemetry Drift: Any deviation between ingested stream values and telemetry_policy rules
(range/threshold, missing, late).
Launch Gate: The required wrapper/CLI used to start governed runs and implement BLOCK_START
semantics.
TSA: Time-Stamping Authority; used to produce a verifiable timestamp token over receipt material.
3. Product Contract (Inputs / Outputs)
3.1 Customer inputs
 Account setup: username + email (magic-link verification); optional 2FA/password (not securitycritical to enforcement).
 Policy inputs per Policy Artifact:
 Integrity: container_image_digest, config_digest source selection + payload, sbom_digest source
selection + payload.
 Telemetry: up to five (5) stream definitions (stream_id, cadence, drift rule, missing/late rules,
enforcement mapping).
 Runtime inputs (local): signed telemetry measurement events pushed to LGE.
 Optional: customer launcher/package upload for third-party attestation flow.
3.2 System outputs
 Signed Policy Artifact (issuer-signed) with not_before/not_after validity window.
 Local Governance Engine container (LGE) + local ledger + evidence bundler.
 Launch Gate wrapper implementing BLOCK_START and producing RUN_STARTED receipt.
 Local enforcement: KILL (stop governed workload), ALERT (action record output).
 Evidence Bundle for each run; Offline Verifier output report with stable report_hash.
 Optional: third-party attestation receipts and signatures included in Evidence Bundle.
4. Architecture
4.1 Components
 Issuer Portal (web): policy minting, license validity, optional third-party attestation workflow,
downloads.
 Local Governance Engine (LGE): local API, verification, drift evaluation, enforcement, receipts ledger,
checkpoints, evidence bundling.
 Launch Gate (LG): required start wrapper that validates policy and starts governed runs.
 Offline Verifier (OV): deterministic offline verification tool and report generator.
4.2 Reference deployment (Pro v1.1.6)
 Single-host Docker deployment is normative reference.
 LGE MUST be authoritative locally; core guarantees MUST NOT depend on cloud availability.
 Governed workload MUST be launched via Launch Gate; otherwise it is ungoverned.
5. Policy Artifact (Structure and Canonicalization)
PolicyArtifact is the central governance object. It MUST be canonicalized deterministically and issuersigned.
5.1 Required fields (minimum)
 policy_version (monotonic integer)
 vault_id, artifact_id
 issued_at, not_before, not_after
 issuer (issuer_id, issuer_public_key, issuer_signature)
 integrity_policy (Section 6)
 telemetry_policy (Section 7)
 enforcement_policy (Section 10)
 key_schedule (Section 8)
 policy_hash (hash of canonical PolicyArtifact excluding issuer_signature)
 optional previous_artifact_ref (prior_artifact_id, prior_policy_hash)
5.2 Canonicalization and hashing
 Canonicalization MUST be deterministic. Recommended: JCS / RFC 8785 or equivalent.
 All signatures and hashes MUST be computed over canonical bytes.
 Hashes MUST use SHA-256. Encodings MUST be base64url where transported as text.
6. Integrity Policy (Subject + Baselines + Drift)
6.1 Subject identity (locked)
 Subject identity MUST be container_image_digest = sha256:<hex>.
6.2 Baseline commitments (locked)
 Integrity baselines MUST include: container_image_digest, config_digest, sbom_digest.
6.3 Strict drift rules (locked)
 Integrity drift MUST trigger if any observed digest != baseline digest (strict equality).
6.4 Pro v1.1.6 measurement timing
 Pro v1.1.6 MUST evaluate integrity baselines at run start (Launch Gate).
 Pro v1.1.6 MAY accept additional integrity checkpoints if customer provides observed digests during
the run.
 Continuous integrity re-measurement is an Enterprise extension.
6.5 Config digest sources (policy-declared)
 PolicyArtifact MUST declare exactly one config source type:
 CONFIG_SOURCE_A (RECOMMENDED): Launch Manifest canonical JSON (image digest,
command/args, env vars policy, optional mounted config file hashes).
 CONFIG_SOURCE_B: Specific config files (ordered list of file paths + deterministic hashing rules).
 CONFIG_SOURCE_C: Customer-provided canonical config JSON (provided at mint time).
 config_digest MUST be SHA-256(canonical_bytes_of_declared_config_source).
6.5.2 CONFIG_SOURCE_B canonicalization (normative)
Purpose: CONFIG_SOURCE_B binds config_digest to an ordered set of file byte contents with explicit
filesystem policies, producing a deterministic digest across verifiers.
6.5.2.1 Policy declaration (MUST)
For CONFIG_SOURCE_B, the Policy Artifact MUST declare:
- file_paths: ordered array of ABSOLUTE paths (UTF-8), no trailing slash
- path_normalization: "POSIX" (default)
- symlink_policy: "FOLLOW" | "REJECT"
- missing_policy: "FAIL" | "HASH_EMPTY"
- max_file_bytes: integer (MUST be set; implementations MUST fail if exceeded)
- file_type_policy: MUST reject directories and special files (device nodes, sockets, FIFOs)
6.5.2.2 Canonicalization algorithm (MUST)
Given the ordered file_paths array:
1. Initialize an empty byte buffer B.
2. For each path P in file_paths, in declared order:
 a. Normalize P (POSIX): require leading “/”; collapse repeated “/”; reject any “.” or “..” segment;
preserve case; result PN.
 b. Resolve PN per symlink_policy:
 - REJECT: if PN is a symlink OR any traversed component is a symlink, MUST fail.
 - FOLLOW: resolve to target for reading bytes; target MUST still be absolute; resolution uses the host
filesystem view for the governed workload.
 c. Enforce file_type_policy: if directory => fail; if special file => fail.
 d. Read file bytes:
 - Missing:
 • FAIL => fail
 • HASH_EMPTY => file_bytes = empty (zero-length)
 - Present: read exact raw bytes; if size > max_file_bytes => fail
 e. Append record to B:
 UTF-8(PN) || 0x00 || file_bytes || 0x00
3. Compute config_digest = SHA-256(B) and encode as base64url (no padding) when represented as
text.
6.5.2.3 Determinism requirements (MUST)
- Implementations MUST NOT normalize line endings, whitespace, or encodings within file_bytes.
- The normalized path PN (not the resolved target path) MUST be the path string appended to B, unless
the policy explicitly declares otherwise.
- Duplicate paths in file_paths MUST be processed twice (order matters).
6.5.2.4 Verifier requirements (MUST)
- Offline Verifier MUST reproduce config_digest using the same policy-declared parameters and
filesystem policies.
- If the verifier cannot access the referenced paths or cannot enforce symlink/file policies, it MUST
return FAIL with reason_code=CONFIG_UNVERIFIABLE.
6.6 SBOM digest sources (policy-declared)
 Default SBOM format MUST be SPDX JSON (Enterprise MAY add others).
 sbom_digest MUST be SHA-256(canonical_sbom_json_bytes).
7. Telemetry Policy (Streams, Cadence, Drift, Missing, Late)
7.1 Streams (locked)
 telemetry_policy MUST support up to five (5) streams per Policy Artifact.
 Telemetry ingestion MUST be push-only in Pro v1.1.6.
 Minimum payload format MUST be JSON.
7.2 StreamDefinition required fields
 stream_id (string)
 cadence_seconds (>0)
 drift_rule: RANGE(min,max) OR THRESHOLD(comparator, value)
 missing_data_tolerance_seconds (>=0)
 late_data_policy (configurable) with grace_seconds (CUSTOM per stream)
 enforcement_mapping for on_drift / on_missing / on_late (must be subset of
BLOCK_START/KILL/ALERT)
7.3 Missing data semantics
 If no valid measurement received within cadence_seconds + missing_data_tolerance_seconds, LGE
MUST emit MISSING_DATA and at minimum ALERT.
7.4 Late data semantics (locked configurable per stream)
 Late evaluation MUST be per stream and configurable by policy.
 If measurement_time is later than expected by more than grace_seconds, LGE MUST emit
LATE_DATA and at minimum ALERT.
 grace_seconds MUST be customer-configurable (CUSTOM).
8. Key Model (Signed Requests, Manual Rotation)
8.1 Algorithms
 Signatures MUST use Ed25519.
 Hash function MUST be SHA-256.
8.2 Vault root and derived stream keys (locked intent)
 Customer holds Vault Root Seed (VRS); it MUST NOT be stored on-chain.
 Per-stream sender keypairs MUST be derived deterministically from the Vault Root Seed (VRS) using
HKDF-SHA256. Derivation: seed_32 = HKDF-SHA256(ikm=VRS, salt=empty, info="attestedgovernance:telemetry:" || vault_id || ":" || artifact_id || ":" || stream_id, length=32). The resulting
32 bytes MUST be used as the Ed25519 private key seed for that stream. The corresponding public
key MUST be embedded in PolicyArtifact.key_schedule.
 Only derived public keys MUST be embedded in PolicyArtifact.key_schedule.
8.3 Manual rotation (locked)
 Rotation is manual.
 Old keys become invalid immediately upon rotation (no overlap).
 Rotation MUST mint a new Policy Artifact version with updated key_schedule and revoked_key_ids.
 LGE MUST reject telemetry signed by revoked keys.
9. Local API Contract
9.1 Endpoints (minimum)
 POST /v1/ingest/{vault_id}/{artifact_id}/{stream_id}
 GET /v1/status
 POST /v1/finalize/{run_id}
 GET /v1/evidence/{run_id}
9.2 Signed ingest request contract
 Request body MUST include the following fields (canonical JSON):
 vault_id (string) - MUST match the vault_id path segment.
 artifact_id (string) - MUST match the artifact_id path segment.
 run_id (string) - MUST reference an active governed run recorded by RUN_STARTED for the same
{vault_id, artifact_id}.
 stream_id (string) - MUST match the stream_id path segment and MUST be declared in
telemetry_policy for artifact_id.
 sequence_number (integer) - MUST be monotonically increasing per (run_id, stream_id) starting at
1.
 measurement_id (string) - unique identifier for this measurement event (for audit correlation).
 measurement_time (timestamp or monotonic tick) - used for cadence/late evaluation; MUST be
present.
 value (number) - the measured value.
 optional metadata (object) - e.g., unit, sensor_id; MUST NOT affect drift unless explicitly modeled.
 Headers MUST include: x-key-id, x-signature, x-sig-alg='ed25519', x-body-hash (SHA-256 of canonical
body).
 Replay protection: LGE MUST track last_accepted_sequence_number for each (run_id, stream_id)
and MUST reject any request where sequence_number <= last_accepted_sequence_number for
that pair.
9.2.1 Sequence number constraints (normative)
sequence_number MUST be a positive integer representable as a JSON number without loss of precision
(maximum 2^53 - 1).
Informative: At 1,000 events/second, 2^53 - 1 supports approximately 285,616 years of continuous
operation per (run_id, stream_id) pair.
If sequence_number reaches 2^53 - 1 for a given (run_id, stream_id), the telemetry client MUST finalize
the current run and start a new governed run.
LGE MUST reject sequence_number values that would overflow or that cannot be represented without
precision loss, and MUST emit REPLAY_DETECTED (or SEQUENCE_INVALID) and at minimum ALERT.
 LGE MUST canonicalize JSON deterministically, verify x-body-hash and x-signature using the declared
sender_public_key for stream_id, and reject if any path/body bindings do not match.
 If verification fails, LGE MUST reject the request and emit INVALID_SIGNATURE or
REPLAY_DETECTED events and at minimum ALERT.
9.3 Runtime Context Provisioning (normative)
Telemetry clients MUST obtain the values required to call the bound ingest path: vault_id, artifact_id,
run_id, stream_id, and the LGE base URL.
9.3.1 Required values
vault_id: owning vault identifier (string).
artifact_id: policy artifact identifier (string).
run_id: unique per governed run, generated by Launch Gate at start (string).
lge_url: base URL for the local LGE (e.g., http://127.0.0.1:8080).
9.3.2 Delivery mechanisms
ENV_INJECTION (RECOMMENDED; MUST): Launch Gate MUST set the following environment variables
on the governed workload process/container before start: AG_VAULT_ID, AG_ARTIFACT_ID,
AG_RUN_ID, AG_LGE_URL.
CONTEXT_FILE (OPTIONAL): Launch Gate MAY write a context JSON file and mount it read-only into the
governed workload at a known path (default: /var/run/attested-governance/context.json). The JSON
MUST include: vault_id, artifact_id, run_id, lge_url, policy_hash, issued_at.
9.3.3 Client resolution rules (normative)
Telemetry client MUST read AG_VAULT_ID/AG_ARTIFACT_ID/AG_RUN_ID/AG_LGE_URL if present;
otherwise it MUST read the context file path (if provided). If neither is present, the workload is
misconfigured and MUST treat itself as ungoverned (no enforcement guarantees claimed).
9.3.4 LGE validation rules (normative)
LGE MUST treat {vault_id, artifact_id} in the ingest path as an explicit binding. LGE MUST reject
telemetry if: (i) run_id is unknown or closed; (ii) run_id is not bound to {vault_id, artifact_id}; or (iii)
stream_id is not declared for that artifact.
10. Enforcement Policy (BLOCK_START, KILL, ALERT)
Pro v1.1.6 enforcement actions are restricted to BLOCK_START, KILL, and ALERT. Arbitrary command
execution is explicitly prohibited in Pro v1.1.6.
10.1 BLOCK_START (normative mechanism)
 Implement BLOCK_START via Launch Gate. Launch Gate MUST validate policy signature and validity
window before starting the workload.
 If validation fails, Launch Gate MUST refuse start and emit ENFORCEMENT_ACTION(BLOCK_START)
receipt and ActionRecord.
10.2 KILL (normative mechanism)
 Governed workload MUST be launched with labels: vault_id, artifact_id, run_id.
 LGE MUST be able to stop the governed workload (container). Customer may grant LGE Docker
socket access as a deployment choice.
 On KILL, LGE MUST stop the container and emit ENFORCEMENT_ACTION(KILL) receipt and
ActionRecord.
10.3 ALERT (normative mechanism)
 ALERT MUST append a structured ActionRecord to an append-only JSONL queue/file on the host.
10.4 ActionRecord schema (normative)
 action_type: 'ALERT' | 'KILL' | 'BLOCK_START' (enum only)
 reason_code: enum (DRIFT_INTEGRITY, DRIFT_TELEMETRY, MISSING_DATA, LATE_DATA,
EXPIRED_ARTIFACT, INVALID_SIGNATURE, TSA_UNAVAILABLE, etc.)
 vault_id, artifact_id, run_id
 receipt_hash (or receipt_id) correlating to the ledger event
 time_source and timestamp fields (Section 11)
 No free-form shell commands or executable payloads are permitted in Pro v1.1.6 ActionRecord.
11. Time Model and Assurance Modes (TSA per Receipt)
11.1 Modes
 HIGH_ASSURANCE (default): LGE attempts TSA token per receipt.
 HIGH_ASSURANCE_STRICT (optional policy flag): if TSA unavailable, Launch Gate MUST
BLOCK_START (fail closed).
11.2 TSA outage behavior (normative)
 In HIGH_ASSURANCE (non-strict), if TSA is unavailable, LGE MUST continue local enforcement when
inputs validate, mark receipts DEGRADED_LOCAL, and Offline Verifier MUST output
PASS_WITH_CAVEATS (not PASS).
11.3 Receipt time fields (required)
 local_time
 monotonic_counter
 tsa_token (when available)
 time_source: 'TSA' | 'DEGRADED_LOCAL'
Note (patent alignment): In Pro tier, Merkle leaf hashes are computed from full canonical receipt bytes.
For privacy-preserving third-party verification, an Enterprise extension MAY compute Merkle leaf hashes
from structural metadata only (excluding payload fields), per the patent embodiment.
12. Receipts Ledger, Hash Chain, and Checkpoints
12.1 Hash chain
 Receipts MUST be append-only and hash-linked (prev_hash -> hash).
 Receipt hash MUST be SHA-256(canonical_receipt_bytes).
12.2 Minimum receipt types
 RUN_STARTED
 DRIFT_DETECTED
 MISSING_DATA
 LATE_DATA

 ENFORCEMENT_ACTION
 RUN_ENDED
 CHECKPOINT
12.3 Checkpoints and inclusion proofs
 LGE MUST produce CHECKPOINT at RUN_ENDED.
 Evidence Bundle MUST include inclusion proofs for critical receipts: RUN_STARTED, any
DRIFT_DETECTED, any ENFORCEMENT_ACTION, RUN_ENDED, and CHECKPOINT root.
13. Evidence Bundle and Offline Verification Contract
13.1 Bundle minimum contents
 PolicyArtifact (canonical JSON) + issuer signature
 Issuer public key MUST be available to the Offline Verifier: it is embedded in PolicyArtifact. A verifier
MAY additionally pin issuer_public_key via a local trust store; if pinned, it MUST match the
embedded key.
 Receipt ledger (JSONL) + checkpoints + inclusion proofs
 ActionRecord queue extract (if stored separately)
 Third-party attestation objects and signatures (if used)
 Offline verifier report (JSON) + report_hash; optional PDF report
13.2 Privacy defaults (locked)
 Default bundle includes summaries/hashes; raw sensor values are optional and policy-controlled.
13.3 Verifier output contract (normative)
 verdict: PASS | PASS_WITH_CAVEATS | FAIL
 reasons[] (machine-readable)
 verified_artifact_hash, verified_receipt_chain_head, checkpoint verification results
 tsa verification results and validity window evaluation
 report_hash = SHA-256(canonical_report_bytes)
 Determinism: identical bundle bytes MUST produce identical verifier output bytes.
14. Third-Party Attestation Flow (Optional)
 Customer uploads launcher/package; system computes file_hash and freezes file.
 Customer chooses: Proceed OR Third-party attestation (no skip label).
 Third party receives one-time link; view/download only; approve/deny; notes; optional signature.
 After decision, customer must click CONFIRM to proceed; system re-hashes and verifies file identity.
 Attestation receipts MUST be included in Evidence Bundle if attestation is used.
15. Artifact Validity, Licensing, and Anti-Reuse
 PolicyArtifact validity is time-bounded by default: not_after aligns to subscription/license end.
 Launch Gate MUST refuse governed starts when current time > not_after (EXPIRED_ARTIFACT).
 LGE MUST reject telemetry under expired artifacts and emit EXPIRED_ARTIFACT events and at
minimum ALERT.
 A 'Forever artifact' MAY exist as a separate SKU/mint process and MUST be explicitly distinguishable
(license_class=FOREVER).
15.1 Artifact lifecycle and upgrade semantics (normative)
Principle: runs are immutably bound to an artifact_id; a run MUST NOT switch artifact_id mid-run.
Artifact states (issuer and LGE) MUST be one of: DRAFT (optional), ACTIVE, SUPERSEDED, REVOKED.
 ACTIVE: eligible for new governed runs.
 SUPERSEDED: no new runs; existing runs MAY continue until run end, artifact expiry, or explicit
revocation.
 REVOKED: no new runs; existing runs MUST emit ARTIFACT_REVOKED and at minimum ALERT; MAY
KILL if policy maps on_revoked to KILL.
Supersession rule (default): when a new PolicyArtifact becomes ACTIVE, the prior ACTIVE artifact
becomes SUPERSEDED.
Expiration mid-run: if current time > not_after for the artifact bound to an active run, LGE MUST emit
EXPIRED_ARTIFACT and at minimum ALERT; MAY KILL if policy maps on_expired to KILL.
Key rollover: any key_schedule change requires a new PolicyArtifact version; LGE MUST reject telemetry
signed by keys not declared for the artifact bound to that run_id.
16. Deployment Wizard and Package Outputs
 Wizard output SHOULD be the simplest effective 'ready-to-run' package: docker-compose.yml +
env/config + documented local paths.
 Dockerfile MAY be included for advanced builds, but Compose is the default deliverable.
 Package MUST document action queue/file path and required permissions.
 Package SHOULD include a minimal ingestion example (optional) and health check instructions.
17. Golden Run Acceptance Test
1. Mint PolicyArtifact with integrity baselines (image/config/SBOM) and at least two telemetry streams
(<=5).
2. Deploy LGE via Docker Compose on a single host.
3. Start governed run via Launch Gate -> RUN_STARTED receipt emitted.
4. Push valid signed telemetry for >=3 minutes -> no drift.
5. Induce telemetry drift (out-of-range) -> DRIFT_DETECTED + ALERT ActionRecord.
6. Induce missing data beyond tolerance -> MISSING_DATA + ALERT.
7. Induce integrity drift at start (mismatch baseline) -> BLOCK_START or KILL based on mapping;
evidence logged.
8. Finalize run -> RUN_ENDED + CHECKPOINT.
9. Generate Evidence Bundle -> Offline Verifier PASS (or PASS_WITH_CAVEATS if TSA degraded) with
stable report_hash.
10. Attempt rerun after expiration -> Launch Gate BLOCK_START and log EXPIRED_ARTIFACT.
18. Enterprise Extensions (Non-breaking)
 More than 5 streams per policy; higher ingest rates (sub-second).
 Continuous integrity re-measurement and quarantine modes.
 Multi-host HA deployments (Kubernetes).
 Advanced drift rules (statistical, correlation, model-based).
 HSM-backed custody, role-based approvals, multi-signer attestations.
 Optional non-authoritative convenience mirror (cloud) - not required for core claims.
19. Claim Boundaries and Liability-Safe Positioning
 System proves: what policy was minted; what signed inputs were received; what drift was detected;
what enforcement actions were executed by LGE; with chained receipts and time attestation per
mode.
 System does NOT prove: absolute security of customer environment; unbypassable enforcement
outside governed runs; correctness of customer sensors/hardware.
 Enforcement guarantees apply only to Governed Runs started via Launch Gate and recorded in the
ledger.
Appendix A. Quick Reference (Normative)
Ingest endpoint: POST /v1/ingest/{vault_id}/{artifact_id}/{stream_id}
Max streams per artifact: 5
Signatures: Ed25519 over canonical JSON; Hash: SHA-256; Encoding: base64url
Enforcement actions (Pro v1.1.6): BLOCK_START, KILL, ALERT (no arbitrary command
execution)
Minimum receipt fields (all receipts): type, vault_id, artifact_id, run_id, sequence_number,
prev_hash, receipt_hash, local_time, monotonic_counter, time_source, tsa_token (if
time_source=TSA), issuer_signature (if applicable).
Appendix B. Formal Test Vectors (Normative)
B.1 Purpose
The implementation MUST ship deterministic, published test vectors enabling independent verification
of canonicalization, hashing, signature verification, replay protection, and drift detection.
B.2 Canonicalization and hashing test vector (TV-JCS-001)
Canonical UTF-8 bytes (JCS / RFC 8785) for SignedIngestRequest body:
{"artifact_id":"art_01HXYZTEST0000000000000001","measurement_id":"m_0001","measurement_t
ime":1735600000,"run_id":"run_01HXYZTEST0000000000000001","sequence_number":1,"stream_i
d":"pressure_psi","value":42}
Expected SHA-256(body) base64url:
uM22uzzEnt39f1ZO14U_gZ7C7mGvCW87JPKCvgRGe-Q
B.3 Ed25519 signature verification test vector (TV-SIG-001)
Ed25519 public key (raw, base64url):
lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg
test_private_key (Ed25519 seed, base64url) — TEST ONLY:
S38UdZHLAVZYYoGvjvmF1gp-L2Yo6KDXAPukOiLMMx0
Implementers MUST NOT use this key material in production. It exists solely to validate signing paths
and fixtures.
key_id (sha256(pubkey) hex truncated 16):
36ee3280c62ed537
Signature over TV-JCS-001 canonical bytes (base64url):
uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8
WRKB0uJurjCg
Verifier MUST return signature_valid=true and body_hash match.
B.4 Replay protection vectors (TV-RPY-001/002)
 TV-RPY-001: Accept sequence_number=1 for (run_id, stream_id).
 TV-RPY-002: Reject any request where sequence_number <= last_accepted_sequence_number for
that (run_id, stream_id) pair; emit REPLAY_DETECTED and at minimum ALERT.
B.5 Drift detection vectors (required set)
Implementations MUST provide vectors for:
 Integrity drift: image digest mismatch, config digest mismatch, SBOM digest mismatch.
 Telemetry drift: out-of-range threshold/range, missing data beyond tolerance, late data beyond
grace, replay detected.
B.6 Publication format (MUST)
The project MUST ship a test-vectors directory and a single CI runner command to validate all vectors.
Minimum file set:
test-vectors/
 tv-jcs-001.json
 tv-sig-001.json
 tv-replay-001.json
 tv-replay-002.json
 tv-drift-*.json
 README.md
Appendix C. Resource Consumption Bounds (Normative)
C.1 Purpose
For embedded and SCADA deployments, deterministic resource usage is a first-class requirement. The
Local Governance Engine (LGE) MUST publish and enforce bounded resource profiles.
C.2 Resource profile (MUST)
LGE MUST support a Resource Profile configuration with hard limits for the following parameters:
 max_streams (<=5 in Pro)
 max_events_per_second (ingest)
 max_receipts_per_second (post-summarization)
 max_action_records_per_second
 max_ledger_disk_mb
 max_bundle_disk_mb
 max_in_memory_queue_depth
 max_cpu_percent (via container limits guidance)
 max_memory_mb (via container limits guidance)
C.3 Deterministic processing guarantees (MUST)
 Per-ingest processing MUST be O(1) with respect to ledger size (no unbounded scans).
 In-memory queues MUST be bounded. When full, LGE MUST apply backpressure (HTTP 429) OR
drop non-critical receipts per policy while emitting RESOURCE_PRESSURE.
 Ledger storage MUST rotate/segment at configured thresholds; bundles MUST stream from disk and
MUST NOT require loading the full ledger into memory.
C.4 Pro v1 reference profile (SHOULD)
For <=5 streams at <=1Hz per stream on a single host, LGE SHOULD sustain operation within configured
caps without unbounded queue growth. The spec requires enforceable caps; numeric targets are
product-owned.
C.5 Verifier reporting (SHOULD)
Offline Verifier SHOULD include a Resource Profile Snapshot indicating configured caps, observed run
stats (events/sec, receipts/sec, disk usage), and whether any RESOURCE_PRESSURE events occurred.


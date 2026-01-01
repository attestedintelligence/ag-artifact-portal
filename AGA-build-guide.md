# AGA V1 BUILD GUIDE
## Complete Implementation Specification
### Version 1.0 | 2025-01-01

---

# EXECUTIVE SUMMARY

This document defines the complete build sequence for VerifiedBundle v1 - a production-ready artifact attestation platform with cryptographic sealing, Arweave anchoring, runtime enforcement, and offline-verifiable bundle generation.

**Build Scope:**
- Web portal for artifact creation
- Third-party attestation via invite links
- In-browser document hashing (client-side)
- Arweave transaction integration
- Key generation and management
- Bundle creation (.agb format)
- Runtime enforcement engine
- Auto-bundling at TTL expiration
- Offline verifier tool
- Vault interface with artifact cards

**Out of Scope (Phase 2):**
- User authentication/login system (existing, will integrate)
- Wallet connection UI (placeholder for now)
- Cloud sync premium tier
- Team collaboration features

---

# PHASE 0: PROJECT FOUNDATION

## 0.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│  TECHNOLOGY STACK                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FRONTEND                                                           │
│  ─────────────────────────────────────────────────────────────────  │
│  Framework:      Next.js 14 (App Router)                           │
│  Styling:        Tailwind CSS + shadcn/ui                          │
│  Animation:      Framer Motion                                      │
│  State:          Zustand (client) + React Query (server)           │
│  Crypto:         Web Crypto API (SubtleCrypto)                     │
│  File handling:  File API + Blob API                               │
│                                                                     │
│  BACKEND                                                            │
│  ─────────────────────────────────────────────────────────────────  │
│  Runtime:        Node.js 20 LTS                                    │
│  API:            Next.js API Routes + tRPC                         │
│  Database:       PostgreSQL (Supabase)                             │
│  Queue:          Inngest (for scheduled jobs)                      │
│  Storage:        Supabase Storage (temp) + Arweave (permanent)     │
│                                                                     │
│  CRYPTOGRAPHY                                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  Hashing:        SHA-256 (Web Crypto API client, Node server)      │
│  Signatures:     Ed25519 (@noble/ed25519)                          │
│  Canonicalization: RFC 8785 JCS (canonicalize package)             │
│  Key derivation: HKDF-SHA256                                       │
│                                                                     │
│  BLOCKCHAIN                                                         │
│  ─────────────────────────────────────────────────────────────────  │
│  Network:        Arweave                                           │
│  SDK:            arweave-js                                        │
│  Bundler:        Irys (formerly Bundlr) for guaranteed uploads     │
│                                                                     │
│  VERIFIER (Standalone Binary)                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  Language:       Rust (for cross-platform binary)                  │
│  Targets:        macOS (universal), Linux (x86_64), Windows        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 0.2 Directory Structure

```
verifiedbundle/
├── apps/
│   ├── web/                      # Next.js web application
│   │   ├── app/
│   │   │   ├── (portal)/         # Authenticated portal routes
│   │   │   │   ├── create/       # Artifact creation flow
│   │   │   │   ├── vault/        # Artifact vault/dashboard
│   │   │   │   ├── artifact/[id]/ # Individual artifact view
│   │   │   │   └── settings/     # User settings
│   │   │   ├── attest/[token]/   # Third-party attestation route
│   │   │   ├── verify/           # Public verification page
│   │   │   └── api/              # API routes
│   │   ├── components/
│   │   │   ├── artifact/         # Artifact-specific components
│   │   │   ├── crypto/           # Crypto visualization components
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   └── vault/            # Vault components
│   │   ├── lib/
│   │   │   ├── crypto/           # Client-side crypto utilities
│   │   │   ├── arweave/          # Arweave client utilities
│   │   │   ├── bundle/           # Bundle creation utilities
│   │   │   └── store/            # Zustand stores
│   │   └── hooks/                # Custom React hooks
│   │
│   └── verifier/                 # Rust verifier binary
│       ├── src/
│       │   ├── main.rs
│       │   ├── bundle.rs         # Bundle parsing
│       │   ├── crypto.rs         # Crypto verification
│       │   ├── chain.rs          # Receipt chain verification
│       │   └── output.rs         # Output formatting
│       └── Cargo.toml
│
├── packages/
│   ├── core/                     # Shared core logic
│   │   ├── src/
│   │   │   ├── types/            # TypeScript types
│   │   │   ├── crypto/           # Crypto primitives
│   │   │   ├── bundle/           # Bundle format
│   │   │   ├── chain/            # Receipt chain logic
│   │   │   └── policy/           # Policy artifact logic
│   │   └── package.json
│   │
│   ├── runtime/                  # Runtime enforcement engine
│   │   ├── src/
│   │   │   ├── engine.ts         # Main runtime engine
│   │   │   ├── measurement.ts    # Hash measurement
│   │   │   ├── enforcement.ts    # Enforcement actions
│   │   │   ├── scheduler.ts      # Cadence scheduler
│   │   │   └── receipts.ts       # Receipt generation
│   │   └── package.json
│   │
│   └── arweave/                  # Arweave integration
│       ├── src/
│       │   ├── client.ts         # Arweave client
│       │   ├── transaction.ts    # Transaction builder
│       │   ├── anchor.ts         # Checkpoint anchoring
│       │   └── verify.ts         # Transaction verification
│       └── package.json
│
├── database/
│   ├── migrations/               # SQL migrations
│   └── schema.prisma             # Prisma schema
│
└── docs/
    └── specification/            # AGB format spec
```

## 0.3 Database Schema

```sql
-- Core tables for artifact management

-- Artifacts (metadata only, not content)
CREATE TABLE artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Cryptographic binding
  bytes_hash VARCHAR(64) NOT NULL,        -- SHA-256 hex
  metadata_hash VARCHAR(64) NOT NULL,     -- SHA-256 hex
  sealed_hash VARCHAR(64) NOT NULL,       -- Combined sealed hash
  
  -- Policy
  policy_id UUID REFERENCES policies(id),
  policy_version INTEGER NOT NULL DEFAULT 1,
  
  -- Lifecycle
  status VARCHAR(32) NOT NULL DEFAULT 'draft',  -- draft, sealed, deployed, expired, terminated
  issued_at TIMESTAMPTZ,
  effective_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Runtime config
  measurement_cadence_ms INTEGER NOT NULL DEFAULT 60000,
  ttl_seconds INTEGER,
  enforcement_action VARCHAR(32) NOT NULL DEFAULT 'terminate',
  
  -- Payload handling
  payload_included BOOLEAN NOT NULL DEFAULT false,
  payload_storage_ref VARCHAR(255),       -- Arweave TX or temp storage ref
  
  -- Keys
  signing_key_id VARCHAR(64) NOT NULL,
  
  -- Arweave anchoring
  arweave_tx_id VARCHAR(64),
  arweave_anchor_status VARCHAR(32),      -- pending, confirmed, failed
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Signing keys (Ed25519)
CREATE TABLE signing_keys (
  id VARCHAR(64) PRIMARY KEY,             -- Key ID
  user_id UUID NOT NULL REFERENCES users(id),
  
  public_key_b64 VARCHAR(64) NOT NULL,    -- Base64 public key
  -- Private key stored in encrypted form or HSM reference
  encrypted_private_key TEXT,
  key_encryption_salt VARCHAR(64),
  
  key_class VARCHAR(32) NOT NULL,         -- 'bundle' or 'release'
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revocation_reason VARCHAR(255)
);

-- Receipt chain (append-only)
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id),
  
  -- Chain linkage
  sequence_number INTEGER NOT NULL,
  previous_leaf_hash VARCHAR(64),         -- NULL for genesis
  leaf_hash VARCHAR(64) NOT NULL,
  
  -- Event data
  event_type VARCHAR(32) NOT NULL,        -- genesis, measurement, drift, enforcement, anchor
  event_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  -- Payload (JSON)
  payload JSONB NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  
  -- Signature
  signature_b64 TEXT NOT NULL,
  signing_key_id VARCHAR(64) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(artifact_id, sequence_number)
);

-- Attestation invites
CREATE TABLE attestation_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES artifacts(id),
  
  token VARCHAR(64) NOT NULL UNIQUE,      -- URL-safe token
  email VARCHAR(255),                     -- Optional email for invite
  
  role VARCHAR(32) NOT NULL,              -- witness, auditor, approver
  
  status VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending, accepted, expired
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  -- Attestation data (filled on acceptance)
  attestor_name VARCHAR(255),
  attestor_signature_b64 TEXT,
  attestor_public_key_b64 VARCHAR(64)
);

-- Arweave transactions
CREATE TABLE arweave_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES artifacts(id),
  
  tx_id VARCHAR(64) NOT NULL,
  tx_type VARCHAR(32) NOT NULL,           -- artifact_seal, checkpoint_anchor
  
  data_hash VARCHAR(64) NOT NULL,
  data_size_bytes INTEGER NOT NULL,
  
  status VARCHAR(32) NOT NULL DEFAULT 'pending',  -- pending, submitted, confirmed, failed
  confirmations INTEGER DEFAULT 0,
  
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vault cards (lightweight artifact references)
CREATE TABLE vault_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  artifact_id UUID NOT NULL REFERENCES artifacts(id),
  
  -- Display data (snapshot at creation)
  display_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL,
  
  -- Settings snapshot (not live data)
  settings_snapshot JSONB NOT NULL,
  
  -- Ordering
  position INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT false,
  
  UNIQUE(user_id, artifact_id)
);

-- Indexes
CREATE INDEX idx_artifacts_user ON artifacts(user_id);
CREATE INDEX idx_artifacts_status ON artifacts(status);
CREATE INDEX idx_receipts_artifact ON receipts(artifact_id);
CREATE INDEX idx_receipts_sequence ON receipts(artifact_id, sequence_number);
CREATE INDEX idx_attestation_token ON attestation_invites(token);
CREATE INDEX idx_vault_user ON vault_cards(user_id);
```

---

# PHASE 1: CRYPTOGRAPHIC FOUNDATION

## 1.1 Client-Side Hashing Module

**File:** `packages/core/src/crypto/hash.ts`

**Purpose:** All document hashing happens client-side using Web Crypto API. Server never sees plaintext in hash-only mode.

**Implementation Steps:**

1. **Create SHA-256 hash function using SubtleCrypto**
   - Input: ArrayBuffer or Uint8Array
   - Output: lowercase hex string (64 chars)
   - Must handle files up to 500MB efficiently (chunked reading)

2. **Create file hasher with progress callback**
   - Use FileReader API with chunked processing
   - Emit progress events for large files
   - Return hash + file metadata (name, size, type, lastModified)

3. **Create metadata canonicalizer**
   - Input: file metadata object
   - Apply JCS (RFC 8785) canonicalization
   - Output: canonical JSON string

4. **Create metadata hasher**
   - Hash the canonical metadata JSON
   - Output: metadata_hash (64 char hex)

5. **Create subject identifier generator**
   - Combine bytes_hash and metadata_hash
   - Apply domain separator: `ai.subject.v1:`
   - Output: sealed_hash (64 char hex)

**Critical Requirements:**
- Zero plaintext sent to server in hash-only mode
- Progress indication for files > 10MB
- Deterministic output (same file = same hash always)
- Handle all file types (binary, text, etc.)

## 1.2 Ed25519 Key Management

**File:** `packages/core/src/crypto/keys.ts`

**Purpose:** Generate, store, and use Ed25519 signing keys.

**Implementation Steps:**

1. **Create key pair generator**
   - Use @noble/ed25519 for key generation
   - Output: { publicKey: Uint8Array, privateKey: Uint8Array }
   - Generate key ID: `ai_bundle_<timestamp>_ed25519`

2. **Create key serialization functions**
   - publicKeyToBase64(key): string
   - privateKeyToBase64(key): string
   - base64ToPublicKey(b64): Uint8Array
   - base64ToPrivateKey(b64): Uint8Array

3. **Create key fingerprint function**
   - Input: public key bytes
   - Output: SHA-256 of public key, formatted as `SHA256:<first32chars>`

4. **Create key encryption for storage**
   - Derive encryption key from user password using PBKDF2
   - Encrypt private key with AES-256-GCM
   - Store: { encrypted_private_key, salt, iv }

5. **Create BYOK import function**
   - Accept PEM or raw base64 private key
   - Validate key format
   - Derive public key from private key
   - Return standardized key pair

## 1.3 Signature Module

**File:** `packages/core/src/crypto/signature.ts`

**Purpose:** Sign and verify using Ed25519 with domain separators.

**Implementation Steps:**

1. **Define domain separators as constants**
   ```typescript
   const DOMAIN_SEPARATORS = {
     BUNDLE: 'ai.bundle.v1:',
     RELEASE: 'ai.release.v1:',
     KEYRING: 'ai.keyring.v1:',
     SUBJECT: 'ai.subject.v1:',
   } as const;
   ```

2. **Create signature input builder**
   - Input: domain separator + data hash (hex string)
   - Concatenate as ASCII string
   - Encode to UTF-8 bytes
   - Output: Uint8Array for signing

3. **Create sign function**
   - Input: privateKey, domainSeparator, dataHash
   - Build signature input
   - Sign with Ed25519
   - Output: base64-encoded signature

4. **Create verify function**
   - Input: publicKey, signature (b64), domainSeparator, dataHash
   - Rebuild signature input
   - Verify Ed25519 signature
   - Output: boolean

5. **Create JSON canonicalization + sign function**
   - Input: object, privateKey, domainSeparator
   - Canonicalize JSON (RFC 8785)
   - Hash canonical bytes
   - Sign hash
   - Output: { canonical: string, hash: string, signature: string }

## 1.4 JCS Canonicalization

**File:** `packages/core/src/crypto/canonical.ts`

**Purpose:** Deterministic JSON serialization per RFC 8785.

**Implementation Steps:**

1. **Implement or wrap JCS library**
   - Use `canonicalize` npm package
   - Verify compliance with RFC 8785

2. **Create canonicalize function**
   - Input: any JSON-serializable object
   - Output: canonical JSON string (no whitespace, sorted keys)

3. **Create canonicalHash function**
   - Input: object
   - Canonicalize, then SHA-256
   - Output: hex hash string

4. **Create test vectors**
   - Include edge cases: unicode, numbers, nested objects
   - Verify determinism across runs

---

# PHASE 2: ARTIFACT CREATION FLOW

## 2.1 Create Artifact Page

**Route:** `/create`

**UI Components:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  CREATE NEW ARTIFACT                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STEP 1: UPLOAD DOCUMENT                                            │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │     [ Drag and drop file here, or click to browse ]         │   │
│  │                                                             │   │
│  │     Supported: Any file type up to 100MB                    │   │
│  │     Hash computed locally. File not uploaded.               │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ☐ Include file in bundle (enables re-verification)                │
│    ⚠ File will be uploaded and stored                              │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  STEP 2: ARTIFACT DETAILS                                           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Name: [________________________________]                           │
│  Description: [________________________________]                    │
│               [________________________________]                    │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  STEP 3: RUNTIME SETTINGS                                           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Measurement Cadence:  [▼ Every 1 minute          ]                │
│  Time-to-Live:         [▼ 30 days                 ]                │
│  On Drift Detection:   [▼ Terminate + Alert       ]                │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  STEP 4: ATTESTATION (Optional)                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  [+ Add Third-Party Attestor]                                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ✉ john@company.com (Witness) - Pending                     │   │
│  │  [Resend] [Remove]                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  STEP 5: REVIEW & SEAL                                              │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CRYPTOGRAPHIC SUMMARY                                      │   │
│  │                                                             │   │
│  │  Bytes Hash:    a1b2c3d4...  [expand] [copy]               │   │
│  │  Metadata Hash: e5f6g7h8...  [expand] [copy]               │   │
│  │  Sealed Hash:   i9j0k1l2...  [expand] [copy]               │   │
│  │                                                             │   │
│  │  Signing Key:   ai_bundle_2025_ed25519                     │   │
│  │  Payload:       Not included (hash-only)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Cancel]                           [Seal Artifact & Deploy →]     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create file upload component**
   - Drag-and-drop zone with visual feedback
   - File type icon based on MIME type
   - Progress bar for hashing (large files)
   - Display computed hash immediately after selection
   - Toggle for payload inclusion (default OFF)

2. **Create artifact details form**
   - Name (required, max 255 chars)
   - Description (optional, max 2000 chars)
   - Validate on blur

3. **Create runtime settings panel**
   - Measurement cadence dropdown: 10s, 30s, 1m, 5m, 15m, 1h
   - TTL dropdown: 1 hour, 1 day, 7 days, 30 days, 90 days, 1 year, Custom
   - Enforcement action: Terminate, Quarantine, Alert Only
   - Advanced: Custom JSON policy (collapsible)

4. **Create attestation manager**
   - Add attestor modal (email + role)
   - Generate unique invite token per attestor
   - Display pending/accepted status
   - Resend invite capability

5. **Create cryptographic summary panel**
   - Real-time display of computed hashes
   - Expand/copy functionality for each hash
   - Visual confirmation of what will be signed

6. **Create seal action handler**
   - Validate all required fields
   - Generate policy artifact JSON
   - Sign with user's key
   - Create genesis receipt
   - If Arweave anchoring enabled: submit transaction
   - Create vault card
   - Redirect to artifact detail page

## 2.2 Policy Artifact Generation

**File:** `packages/core/src/bundle/policy-artifact.ts`

**Purpose:** Generate the PolicyArtifact.json that goes in every bundle.

**Structure:**
```typescript
interface PolicyArtifact {
  schema_version: "1.0";
  protocol_version: "1.0";
  
  subject_identifier: {
    bytes_hash: string;       // 64 char hex
    metadata_hash: string;    // 64 char hex
  };
  
  policy_reference: string;   // Hash of policy document
  policy_version: number;
  
  sealed_hash: string;        // Combined binding hash
  
  issued_at: string;          // ISO 8601
  effective_at: string;       // ISO 8601
  expires_at: string | null;  // ISO 8601 or null
  
  issuer_identifier: string;  // Key fingerprint
  
  enforcement_parameters: {
    measurement_cadence_ms: number;
    ttl_seconds: number | null;
    enforcement_action: "terminate" | "quarantine" | "alert";
    re_attestation_required: boolean;
  };
  
  disclosure_policy: {
    payload_included: boolean;
    claims: string[];         // List of disclosed claim IDs
  };
  
  attestations: Array<{
    attestor_id: string;
    role: string;
    signature: string;
    timestamp: string;
  }>;
  
  signature: string;          // Base64 Ed25519 signature
}
```

**Implementation Steps:**

1. **Create PolicyArtifact builder class**
   - Fluent API for setting fields
   - Automatic timestamp generation
   - Validation before finalization

2. **Create sealing function**
   - Collect all fields
   - Canonicalize (excluding signature field)
   - Hash canonical form
   - Sign with bundle key (domain: ai.bundle.v1:)
   - Append signature

3. **Create verification function**
   - Extract signature
   - Rebuild canonical form (without signature)
   - Verify signature against issuer public key

## 2.3 Third-Party Attestation Flow

**Route:** `/attest/[token]`

**Purpose:** Allow invited third parties to attest to an artifact without having an account.

**UI Flow:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ATTESTATION REQUEST                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  You've been invited to attest to an artifact.                     │
│                                                                     │
│  ARTIFACT DETAILS                                                   │
│  ─────────────────────────────────────────────────────────────────  │
│  Name: Q4 Financial Report                                         │
│  Created by: acme-corp@attestedintelligence.com                    │
│  Your Role: Witness                                                │
│                                                                     │
│  REFERENCE DOCUMENT                                                 │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  To attest, upload the same document you received:                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │     [ Drop file here to verify match ]                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ✓ HASH MATCH                                               │   │
│  │                                                             │   │
│  │  Your document matches the sealed artifact.                 │   │
│  │  Sealed Hash: a1b2c3d4...  [expand]                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  YOUR ATTESTATION                                                   │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Name: [________________________________]                           │
│  Organization: [________________________________] (optional)        │
│                                                                     │
│  ☐ I confirm this document is authentic and accurate               │
│  ☐ I understand my attestation is cryptographically recorded       │
│                                                                     │
│  [Submit Attestation]                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create invite token validation**
   - Lookup token in database
   - Check expiration
   - Return artifact metadata (not content)

2. **Create reference document verification**
   - Hash uploaded document client-side
   - Compare to artifact's sealed_hash
   - Display match/mismatch status
   - Block attestation if mismatch

3. **Create attestation submission**
   - Generate ephemeral Ed25519 key pair for attestor
   - Sign attestation payload with ephemeral key
   - Include: attestor name, role, timestamp, artifact hash, signature
   - Store attestation record
   - Add attestation receipt to chain

4. **Create attestation receipt**
   - Event type: `attestation`
   - Payload: attestor details, signature, timestamp
   - Append to artifact's receipt chain

---

# PHASE 3: ARWEAVE INTEGRATION

## 3.1 Arweave Client Setup

**File:** `packages/arweave/src/client.ts`

**Purpose:** Interface with Arweave network for permanent storage.

**Implementation Steps:**

1. **Initialize Arweave client**
   - Configure for mainnet
   - Set gateway URLs (arweave.net + fallbacks)

2. **Create Irys (Bundlr) client**
   - For guaranteed, fast uploads
   - Configure payment threshold
   - Handle funding/balance checks

3. **Create wallet interface (placeholder)**
   - Define wallet connection interface
   - Stub for Phase 2 wallet integration
   - Allow server-side signing for MVP

## 3.2 Transaction Builder

**File:** `packages/arweave/src/transaction.ts`

**Purpose:** Build and submit Arweave transactions for artifact sealing.

**Transaction Types:**

1. **Artifact Seal Transaction**
   - Data: PolicyArtifact JSON (or hash reference if hash-only)
   - Tags:
     - `App-Name`: `VerifiedBundle`
     - `App-Version`: `1.0`
     - `Type`: `artifact-seal`
     - `Artifact-ID`: UUID
     - `Sealed-Hash`: hex string
     - `Content-Type`: `application/json`

2. **Checkpoint Anchor Transaction**
   - Data: Merkle root + batch metadata
   - Tags:
     - `App-Name`: `VerifiedBundle`
     - `Type`: `checkpoint-anchor`
     - `Merkle-Root`: hex string
     - `Batch-Start-Seq`: number
     - `Batch-End-Seq`: number

**Implementation Steps:**

1. **Create transaction builder**
   - Input: data, tags, wallet
   - Build transaction object
   - Calculate price
   - Return unsigned transaction

2. **Create transaction signer**
   - Sign with wallet (or server key for MVP)
   - Return signed transaction

3. **Create transaction submitter**
   - Submit via Irys for guaranteed delivery
   - Return transaction ID
   - Store pending status in database

4. **Create confirmation poller**
   - Poll for confirmation status
   - Update database when confirmed
   - Emit events for UI updates

## 3.3 Checkpoint Anchoring

**File:** `packages/arweave/src/anchor.ts`

**Purpose:** Periodically anchor receipt chain to Arweave.

**Implementation Steps:**

1. **Create Merkle tree builder**
   - Input: array of receipt leaf hashes
   - Build binary Merkle tree
   - Return: root hash + inclusion proofs for each leaf

2. **Create checkpoint scheduler**
   - Configurable interval (default: 1 hour or 100 receipts)
   - Collect unanchored receipts
   - Build Merkle tree
   - Submit anchor transaction
   - Record ANCHOR_BATCH receipt

3. **Create inclusion proof generator**
   - Input: receipt ID, checkpoint ID
   - Return: Merkle inclusion proof (sibling hashes + path)

---

# PHASE 4: BUNDLE FORMAT

## 4.1 Bundle Structure

**File:** `packages/core/src/bundle/structure.ts`

**Purpose:** Define and create .agb bundle format.

**Bundle Contents:**
```
artifact_bundle.agb (ZIP archive)
├── manifest.json           # Bundle metadata
├── PolicyArtifact.json     # Sealed policy artifact
├── ledger.jsonl            # Receipt chain (JSON lines)
├── merkle/
│   └── proofs.json         # Merkle inclusion proofs
├── keys/
│   └── keyring.json        # Trusted public keys
├── timestamp_token.tst     # (optional) RFC 3161 token
└── payload/                # (optional) Original artifact
    └── [original_filename]
```

**Implementation Steps:**

1. **Create manifest generator**
   ```typescript
   interface Manifest {
     format_version: "1.0";
     min_verifier_version: "1.0.0";
     created_at: string;
     artifact_id: string;
     payload_included: boolean;
     components: string[];
     checksums: Record<string, string>;  // filename -> SHA256
   }
   ```

2. **Create ledger formatter**
   - Convert receipts to JSON Lines format
   - One receipt per line
   - Include all chain metadata

3. **Create Merkle proofs aggregator**
   - Collect all inclusion proofs for receipts
   - Format as JSON object

4. **Create keyring generator**
   - Include issuer public key
   - Include attestor public keys
   - Include Attested Intelligence root key

5. **Create bundle archiver**
   - Use JSZip for ZIP creation
   - Add all components
   - Compute checksums for manifest
   - Return Blob

## 4.2 Bundle Generator

**File:** `packages/core/src/bundle/generator.ts`

**Purpose:** Generate complete .agb bundle from artifact data.

**Implementation Steps:**

1. **Create bundle generator class**
   - Input: artifact ID, include options
   - Fetch all required data from database
   - Generate all components
   - Archive into ZIP
   - Return downloadable Blob

2. **Create component generators**
   - generateManifest()
   - generatePolicyArtifact()
   - generateLedger()
   - generateMerkleProofs()
   - generateKeyring()
   - fetchPayload() (if included)

3. **Create checksum calculator**
   - Hash each component
   - Build checksums object for manifest

4. **Create download handler**
   - Generate filename: `{artifact_name}_{timestamp}.agb`
   - Trigger browser download
   - Log download event to chain

---

# PHASE 5: RUNTIME ENGINE

## 5.1 Runtime Engine Core

**File:** `packages/runtime/src/engine.ts`

**Purpose:** Execute runtime enforcement for deployed artifacts.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  RUNTIME ENGINE ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  SCHEDULER  │───▶│ MEASUREMENT │───▶│ COMPARATOR  │             │
│  │  (Cadence)  │    │   ENGINE    │    │             │             │
│  └─────────────┘    └─────────────┘    └──────┬──────┘             │
│                                               │                     │
│                                    ┌──────────┴──────────┐          │
│                                    │                     │          │
│                               [MATCH]               [MISMATCH]      │
│                                    │                     │          │
│                                    v                     v          │
│                          ┌─────────────┐      ┌─────────────┐       │
│                          │   RECEIPT   │      │ ENFORCEMENT │       │
│                          │  GENERATOR  │      │   ACTION    │       │
│                          └─────────────┘      └─────────────┘       │
│                                    │                     │          │
│                                    v                     v          │
│                          ┌─────────────┐      ┌─────────────┐       │
│                          │   RECEIPT   │      │    ALERT    │       │
│                          │    CHAIN    │      │   SERVICE   │       │
│                          └─────────────┘      └─────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create RuntimeEngine class**
   - Initialize with artifact configuration
   - Load policy artifact
   - Start measurement scheduler
   - Handle lifecycle events

2. **Create measurement scheduler**
   - Use Inngest for reliable scheduling
   - Schedule at configured cadence
   - Handle missed measurements gracefully

3. **Create lifecycle manager**
   - Track artifact status
   - Handle TTL expiration
   - Trigger auto-bundling at end of life

## 5.2 Measurement Engine

**File:** `packages/runtime/src/measurement.ts`

**Purpose:** Compute current hash and compare to sealed reference.

**Measurement Types:**
- File hash (for payload-included artifacts)
- API endpoint hash (for dynamic sources)
- Database record hash (for data artifacts)

**Implementation Steps:**

1. **Create measurement executor**
   - Input: artifact config, measurement type
   - Fetch current state
   - Compute hash using same algorithm as sealing
   - Return: { current_hash, timestamp, source_metadata }

2. **Create hash comparator**
   - Compare current_hash to sealed_hash
   - Return: { match: boolean, drift_details?: object }

3. **Create measurement receipt generator**
   - Record measurement result
   - Sign receipt
   - Append to chain

## 5.3 Enforcement Actions

**File:** `packages/runtime/src/enforcement.ts`

**Purpose:** Execute enforcement actions on drift detection.

**Actions:**
```typescript
type EnforcementAction = 
  | 'terminate'    // Stop artifact, mark as terminated
  | 'quarantine'   // Isolate but continue monitoring
  | 'alert'        // Log and notify, continue normal operation
```

**Implementation Steps:**

1. **Create enforcement executor**
   - Input: artifact, action type, drift details
   - Execute appropriate action
   - Generate enforcement receipt
   - Trigger notifications

2. **Create terminate handler**
   - Set artifact status to 'terminated'
   - Generate final bundle
   - Send termination notification

3. **Create quarantine handler**
   - Set artifact status to 'quarantined'
   - Continue measurements but block modifications
   - Log all activity for forensics

4. **Create alert handler**
   - Log drift event
   - Send notification (email, webhook)
   - Continue normal operation

## 5.4 Receipt Chain Manager

**File:** `packages/runtime/src/receipts.ts`

**Purpose:** Manage append-only receipt chain.

**Receipt Types:**
```typescript
type ReceiptType = 
  | 'genesis'       // First receipt when artifact is sealed
  | 'measurement'   // Regular measurement result
  | 'drift'         // Drift detected
  | 'enforcement'   // Enforcement action taken
  | 'attestation'   // Third-party attestation added
  | 'anchor'        // Arweave checkpoint
  | 'expiration'    // TTL expired
  | 'download'      // Bundle downloaded
```

**Implementation Steps:**

1. **Create receipt builder**
   - Compute leaf hash from structural metadata
   - Link to previous receipt
   - Sign receipt
   - Store in database

2. **Create chain validator**
   - Verify all signatures
   - Verify hash chain integrity
   - Return validation result

3. **Create chain exporter**
   - Export to JSON Lines format
   - Include all receipts in order

## 5.5 Auto-Bundling at TTL Expiration

**File:** `packages/runtime/src/lifecycle.ts`

**Purpose:** Automatically generate final bundle when artifact expires.

**Implementation Steps:**

1. **Create TTL monitor**
   - Check all artifacts approaching expiration
   - Schedule bundling job 1 hour before expiration
   - Handle timezone correctly

2. **Create auto-bundle generator**
   - Generate complete evidence bundle
   - Include all receipts up to expiration
   - Include final EXPIRATION receipt
   - Store bundle (Arweave or temporary storage)

3. **Create notification sender**
   - Email user about expiration
   - Include download link for bundle
   - Set download link expiration

---

# PHASE 6: VERIFIER BINARY

## 6.1 Rust Verifier Structure

**Directory:** `apps/verifier/`

**Purpose:** Standalone binary for offline verification.

**Implementation Steps:**

1. **Create project structure**
   ```
   apps/verifier/
   ├── Cargo.toml
   ├── src/
   │   ├── main.rs           # CLI entry point
   │   ├── bundle.rs         # Bundle parsing
   │   ├── manifest.rs       # Manifest validation
   │   ├── policy.rs         # Policy artifact validation
   │   ├── chain.rs          # Receipt chain validation
   │   ├── merkle.rs         # Merkle proof validation
   │   ├── crypto.rs         # Ed25519 + SHA-256
   │   ├── keyring.rs        # Key trust management
   │   ├── output.rs         # Human + JSON output
   │   └── errors.rs         # Error types
   └── tests/
       └── fixtures/         # Test bundles
   ```

2. **Implement CLI interface**
   ```
   ag-verify <bundle.agb> [OPTIONS]
   
   OPTIONS:
     --json              Output structured JSON
     --verbose           Show detailed check results
     --trust-keyring     Path to custom keyring file
     --verify-release    Verify release signature instead
   
   EXIT CODES:
     0 = PASS
     1 = FAIL
     2 = WARN (passed with warnings)
     3 = ERROR (could not complete)
   ```

3. **Implement verification steps**
   - Extract bundle (ZIP)
   - Validate manifest format
   - Verify manifest checksums
   - Parse policy artifact
   - Verify policy signature
   - Parse receipt chain
   - Verify each receipt signature
   - Verify chain linkage (leaf hashes)
   - Verify Merkle inclusion proofs
   - Check key revocation status
   - Output result

## 6.2 Cross-Platform Build

**File:** `.github/workflows/build-verifier.yml`

**Targets:**
- macOS (universal: x86_64 + arm64)
- Linux (x86_64, musl for static linking)
- Windows (x86_64)

**Implementation Steps:**

1. **Configure Cargo for cross-compilation**
   - Add target triples to Cargo.toml
   - Configure linker settings

2. **Create GitHub Actions workflow**
   - Build on each platform
   - Sign releases with release key
   - Generate .sig files
   - Upload to GitHub Releases

3. **Create release signature generator**
   - Implement .sig envelope format from spec
   - Sign with release key (securely stored in CI)

---

# PHASE 7: VAULT INTERFACE

## 7.1 Vault Dashboard

**Route:** `/vault`

**Purpose:** Display all user's artifacts as cards.

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  MY VAULT                                            [+ New Artifact]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [All] [Active] [Expired] [Terminated]              🔍 Search       │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ 📄 Q4 Report     │  │ 📄 Contract v2   │  │ 📄 Audit Log     │  │
│  │                  │  │                  │  │                  │  │
│  │ ● Active        │  │ ● Active        │  │ ⚠ Expiring Soon │  │
│  │ Created: Jan 1  │  │ Created: Dec 15 │  │ Created: Nov 20 │  │
│  │ Expires: Apr 1  │  │ Expires: Mar 15 │  │ Expires: Jan 5  │  │
│  │                  │  │                  │  │                  │  │
│  │ Cadence: 1m     │  │ Cadence: 5m     │  │ Cadence: 1h     │  │
│  │ Receipts: 1,440 │  │ Receipts: 288   │  │ Receipts: 96    │  │
│  │                  │  │                  │  │                  │  │
│  │ [View] [Bundle] │  │ [View] [Bundle] │  │ [View] [Bundle] │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ 📄 Old Config    │  │ 📄 Test Doc      │                        │
│  │                  │  │                  │                        │
│  │ ✓ Expired       │  │ ✗ Terminated    │                        │
│  │ Created: Oct 1  │  │ Created: Sep 15 │                        │
│  │ Expired: Dec 1  │  │ Drift: Sep 20   │                        │
│  │                  │  │                  │                        │
│  │ [View Bundle]   │  │ [View Bundle]   │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create vault card component**
   - Display artifact name, status, timestamps
   - Status indicator (color-coded)
   - Quick stats (cadence, receipt count)
   - Action buttons (View, Download Bundle)

2. **Create vault grid layout**
   - Responsive grid (3 cols desktop, 2 tablet, 1 mobile)
   - Drag to reorder (persist position)
   - Pin important artifacts

3. **Create filter/search**
   - Filter by status
   - Search by name
   - Sort by date, name, expiration

4. **Create vault data loader**
   - Fetch vault cards (not full artifacts)
   - Paginate for large vaults
   - Real-time status updates via WebSocket

## 7.2 Artifact Detail Page

**Route:** `/artifact/[id]`

**Purpose:** Detailed view of single artifact with live status.

**Implementation Steps:**

1. **Create artifact header**
   - Name, description
   - Status badge (live)
   - Quick actions (Download, Settings, Terminate)

2. **Create cryptographic summary panel**
   - All hashes with expand/copy
   - Signing key info
   - Arweave transaction link

3. **Create receipt timeline**
   - Visual timeline of all receipts
   - Filter by type
   - Click to expand details

4. **Create settings panel**
   - View current settings
   - Edit settings (if allowed)
   - Add attestors

5. **Create download panel**
   - Download current bundle
   - Download verifier
   - View/download individual receipts

---

# PHASE 8: API LAYER

## 8.1 API Routes

**Base:** `/api/v1/`

**Endpoints:**

```
ARTIFACTS
─────────────────────────────────────────────────────────────────────
POST   /artifacts              Create new artifact
GET    /artifacts              List user's artifacts
GET    /artifacts/:id          Get artifact details
PATCH  /artifacts/:id          Update artifact settings
DELETE /artifacts/:id          Terminate artifact
POST   /artifacts/:id/seal     Seal artifact (finalize)
GET    /artifacts/:id/bundle   Download bundle
GET    /artifacts/:id/receipts List receipts

ATTESTATION
─────────────────────────────────────────────────────────────────────
POST   /artifacts/:id/invite   Create attestation invite
GET    /attest/:token          Get invite details (public)
POST   /attest/:token          Submit attestation (public)

KEYS
─────────────────────────────────────────────────────────────────────
POST   /keys                   Generate new key pair
GET    /keys                   List user's keys
GET    /keys/:id               Get key details
POST   /keys/:id/revoke        Revoke key

VERIFICATION
─────────────────────────────────────────────────────────────────────
POST   /verify                 Verify a bundle (upload)
GET    /verify/:txId           Verify by Arweave TX ID

WEBHOOKS
─────────────────────────────────────────────────────────────────────
POST   /webhooks               Register webhook
GET    /webhooks               List webhooks
DELETE /webhooks/:id           Remove webhook
```

## 8.2 API Key Management

**Purpose:** Allow programmatic access to API.

**Implementation Steps:**

1. **Create API key generator**
   - Generate secure random key: `vb_live_` + 32 random bytes (base64)
   - Hash key for storage (never store plaintext)
   - Return key once on creation

2. **Create API key validator middleware**
   - Extract key from `Authorization: Bearer <key>` header
   - Hash and lookup in database
   - Attach user context to request

3. **Create rate limiter**
   - Per-key rate limits
   - Configurable by tier

4. **Create key rotation**
   - Generate new key
   - Grace period for old key
   - Revoke old key

---

# PHASE 9: NOTIFICATIONS & ALERTS

## 9.1 Notification System

**Events that trigger notifications:**
- Artifact sealed
- Drift detected
- Enforcement action taken
- TTL expiring soon (24h, 1h)
- TTL expired
- Attestation received
- Attestation invite accepted
- Download occurred

**Channels:**
- Email (primary)
- Webhook (for integrations)
- In-app (for dashboard)

**Implementation Steps:**

1. **Create notification service**
   - Queue-based for reliability
   - Template-based emails
   - Webhook delivery with retry

2. **Create email templates**
   - Artifact sealed confirmation
   - Drift alert (high priority)
   - Expiration warning
   - Weekly summary

3. **Create webhook dispatcher**
   - POST JSON payload to configured URL
   - Include HMAC signature for verification
   - Retry with exponential backoff

---

# PHASE 10: SECURITY HARDENING

## 10.1 Bundle Tamper Protection

**Problem:** Ensure downloaded bundle cannot be modified before deployment.

**Solution Steps:**

1. **Bundle integrity on download**
   - Generate fresh signature at download time
   - Include download receipt in chain
   - Verifier checks signature freshness

2. **Pre-launch validation**
   - If runtime engine receives bundle, validate before accepting
   - Check all signatures
   - Check chain integrity
   - Reject if any modification detected

3. **Checksum verification in manifest**
   - Every file in bundle has SHA-256 in manifest
   - Manifest is signed
   - Verifier checks all checksums

## 10.2 Key Security

**Implementation Steps:**

1. **Private key encryption at rest**
   - Encrypt with user-derived key
   - Use PBKDF2 with high iteration count
   - Never log or expose private keys

2. **Key usage auditing**
   - Log every signature operation
   - Track key usage patterns
   - Alert on anomalies

3. **Key rotation enforcement**
   - Warn when key approaches 1 year old
   - Support graceful rotation

## 10.3 Input Validation

**All user inputs:**
- Sanitize file names
- Validate file sizes
- Validate JSON schemas
- Prevent path traversal in ZIP operations
- Rate limit all endpoints

---

# PHASE 11: TESTING STRATEGY

## 11.1 Test Categories

**Unit Tests:**
- Crypto primitives (hash, sign, verify)
- Canonicalization
- Bundle format parsing
- Receipt chain validation

**Integration Tests:**
- Full artifact creation flow
- Attestation flow
- Bundle generation and verification
- Arweave transaction submission

**End-to-End Tests:**
- Complete user journey (create → seal → monitor → download)
- Verifier binary against known bundles
- Cross-platform verifier tests

## 11.2 Test Fixtures

**Create standard test bundles:**
1. `valid_minimal.agb` - Minimum valid bundle (PASS)
2. `valid_with_payload.agb` - Bundle with payload (PASS)
3. `valid_with_attestations.agb` - Bundle with 3rd party attestations (PASS)
4. `tampered_payload.agb` - Modified payload byte (FAIL: ARTIFACT_MISMATCH)
5. `tampered_receipt.agb` - Modified receipt (FAIL: CHAIN_BROKEN)
6. `invalid_signature.agb` - Wrong signature (FAIL: SIGNATURE_INVALID)
7. `missing_receipt.agb` - Gap in sequence (FAIL: SEQUENCE_GAP)
8. `revoked_key.agb` - Signed with revoked key (WARN)

---

# PHASE 12: DEPLOYMENT

## 12.1 Infrastructure

**Components:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Vercel                                                             │
│  ├── Next.js application                                           │
│  ├── API routes                                                    │
│  └── Edge functions (for crypto operations)                        │
│                                                                     │
│  Supabase                                                           │
│  ├── PostgreSQL database                                           │
│  ├── Row-level security                                            │
│  └── Temporary file storage                                        │
│                                                                     │
│  Inngest                                                            │
│  ├── Scheduled measurement jobs                                    │
│  ├── Checkpoint anchoring jobs                                     │
│  └── Notification delivery                                         │
│                                                                     │
│  Arweave (via Irys)                                                 │
│  └── Permanent storage                                             │
│                                                                     │
│  GitHub Releases                                                    │
│  └── Verifier binary distribution                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 12.2 Environment Variables

```
# Database
DATABASE_URL=
DIRECT_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Arweave/Irys
IRYS_NODE=https://node1.irys.xyz
ARWEAVE_WALLET_JSON=

# Signing (server-side for MVP)
BUNDLE_SIGNING_PRIVATE_KEY=
RELEASE_SIGNING_PRIVATE_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

# PHASE 13: LAUNCH CHECKLIST

## 13.1 Pre-Launch

**Cryptography:**
- [ ] All hash functions produce deterministic output
- [ ] All signatures verify correctly
- [ ] Canonicalization matches test vectors
- [ ] Domain separators correctly applied

**Bundle Format:**
- [ ] Manifest schema validated
- [ ] All components included
- [ ] Checksums accurate
- [ ] ZIP extraction works cross-platform

**Verifier:**
- [ ] Builds on all platforms
- [ ] Exit codes correct
- [ ] JSON output schema matches spec
- [ ] All test bundles produce expected results

**Runtime:**
- [ ] Measurements execute at correct cadence
- [ ] Drift detection works
- [ ] Enforcement actions execute
- [ ] Receipts append correctly

**Security:**
- [ ] Private keys never logged
- [ ] Bundle tamper protection works
- [ ] Rate limiting active
- [ ] Input validation complete

**UI/UX:**
- [ ] All flows work end-to-end
- [ ] Error states handled gracefully
- [ ] Loading states present
- [ ] Mobile responsive

## 13.2 Post-Launch Monitoring

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Arweave transaction success rate
- [ ] Measurement job success rate

---

# APPENDIX A: CRITICAL IMPLEMENTATION NOTES

## A.1 Hash Determinism

**CRITICAL:** Same input must ALWAYS produce same hash.

**Ensure:**
- File reading uses consistent buffer sizes
- Metadata canonicalization uses exact same rules
- No floating point in any hash inputs
- Timestamps in UTC, ISO 8601 format
- String encoding always UTF-8

## A.2 Chain Integrity

**CRITICAL:** Receipt chain must be append-only and tamper-evident.

**Ensure:**
- Sequence numbers are gapless
- Previous leaf hash always matches actual previous
- Signatures cover complete receipt content
- Database constraints prevent gaps

## A.3 Bundle Immutability

**CRITICAL:** Downloaded bundle must be verifiable forever.

**Ensure:**
- All required components included
- All signatures valid at time of creation
- Keyring includes all necessary public keys
- Verifier can work completely offline

## A.4 Time Handling

**CRITICAL:** Timestamps must be precise and comparable.

**Ensure:**
- All timestamps in UTC
- ISO 8601 format with milliseconds
- Server time synced (NTP)
- TTL comparisons use consistent timezone

---

END OF BUILD GUIDE

full web/desktop integration flow and function build criteria: 
#AGA

# ATTESTED GOVERNANCE ARTIFACTS
## Complete Implementation Checklist
### End-to-End Product Build Specification

---

# OVERVIEW: THE COMPLETE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE SYSTEM FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: ARTIFACT CREATION (Web Interface)
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Subject    │───▶│  Attestation │───▶│   Sealing    │───▶│   Policy     │
│   Input      │    │   Engine     │    │   Process    │    │   Artifact   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
PHASE 2: RUNTIME ENFORCEMENT (Portal/Sentinel)
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Artifact   │───▶│   Gating     │───▶│  Continuous  │───▶│ Enforcement  │
│   Parsing    │    │   Check      │    │  Measurement │    │   Action     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
PHASE 3: RECEIPT & CHAIN
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Receipt    │───▶│   Chain      │───▶│  Checkpoint  │───▶│   External   │
│   Generation │    │   Append     │    │   Batching   │    │   Anchor     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
PHASE 4: VERIFICATION
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Evidence   │───▶│   Offline    │───▶│  Inclusion   │───▶│   Verdict    │
│   Bundle     │    │   Verify     │    │   Proof      │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

---

# PHASE 1: ARTIFACT CREATION

## 1.1 Web Interface Components

### Subject Input Form
```
□ REQUIRED FIELDS
  □ Subject Type selector (executable, container, config, SBOM, model)
  □ Subject upload or reference input
  □ Subject metadata fields:
      □ Name/identifier
      □ Version
      □ Author/owner
      □ Creation timestamp
      □ Custom attributes (key-value pairs)
  □ Policy selection dropdown
  □ Enforcement parameters:
      □ Measurement cadence (ms)
      □ Time-to-live (TTL)
      □ Enforcement action (terminate, quarantine, alert)
      □ Re-attestation requirements

□ VALIDATION ON SUBMIT
  □ Subject file size limits
  □ Subject type verification
  □ Policy exists and is active
  □ User has permission to create artifact
  □ Required metadata present
```

### Policy Management Interface
```
□ POLICY CRUD OPERATIONS
  □ Create new policy
  □ View policy details
  □ Version policy (immutable versions)
  □ Deprecate policy (no new artifacts)
  
□ POLICY FIELDS
  □ Policy ID (UUID)
  □ Policy name
  □ Policy version (integer, monotonic)
  □ Policy rules (JSON schema)
  □ Permitted claim types
  □ Substitution rules
  □ Sensitivity classifications
  □ Measurement requirements
  □ Enforcement actions mapping
  □ Policy signature (signed by PolicyIssuerKey)
```

### Key Management Interface
```
□ KEY TYPES DISPLAYED
  □ Policy Issuer Key (signs artifacts)
  □ Enforcement Key (signs receipts)
  □ Checkpoint Key (signs checkpoints)
  
□ KEY OPERATIONS
  □ View public keys
  □ Export public keys (for verifiers)
  □ Key rotation workflow
  □ Key status (active, rotating, revoked)
```

---

## 1.2 Subject Processing Pipeline

### Step 1: Subject Normalization
```
□ FUNCTION: normalizeSubject(rawSubject, subjectType)

□ INPUTS
  □ Raw subject bytes
  □ Subject type enum
  
□ PROCESS
  □ Strip non-deterministic elements (timestamps in binaries, etc.)
  □ Canonicalize format (consistent encoding)
  □ Compute normalized byte array
  
□ OUTPUTS
  □ normalizedBytes: Uint8Array
  □ normalizationMetadata: { method, version, warnings }
  
□ VALIDATION
  □ Normalization completed without errors
  □ Normalized output is deterministic (same input = same output)
```

### Step 2: Bytes Commitment
```
□ FUNCTION: computeBytesHash(normalizedBytes)

□ INPUTS
  □ normalizedBytes: Uint8Array
  
□ PROCESS
  □ Apply SHA-256 hash function
  □ Output as lowercase hexadecimal string (64 chars)
  
□ OUTPUTS
  □ bytesHash: string (64 hex chars)
  
□ VALIDATION
  □ Hash is exactly 64 characters
  □ Hash contains only [0-9a-f]
  □ Hash is deterministic
```

### Step 3: Metadata Canonicalization
```
□ FUNCTION: canonicalizeMetadata(metadata)

□ INPUTS
  □ metadata: object
  
□ PROCESS
  □ Sort keys alphabetically (deep/recursive)
  □ Remove undefined/null values
  □ Normalize timestamps to ISO 8601 UTC
  □ Normalize strings (trim, consistent encoding)
  □ Serialize to JSON with no whitespace
  
□ OUTPUTS
  □ canonicalMetadataString: string
  
□ VALIDATION
  □ Output is valid JSON
  □ Keys are sorted
  □ Same input always produces same output
```

### Step 4: Metadata Commitment
```
□ FUNCTION: computeMetadataHash(canonicalMetadataString)

□ INPUTS
  □ canonicalMetadataString: string
  
□ PROCESS
  □ Encode string as UTF-8 bytes
  □ Apply SHA-256 hash function
  □ Output as lowercase hexadecimal string
  
□ OUTPUTS
  □ metadataHash: string (64 hex chars)
  
□ VALIDATION
  □ Hash is exactly 64 characters
  □ Hash is deterministic
```

### Step 5: Subject Identifier Assembly
```
□ FUNCTION: createSubjectIdentifier(bytesHash, metadataHash)

□ INPUTS
  □ bytesHash: string
  □ metadataHash: string
  
□ OUTPUTS
  □ subjectIdentifier: {
      bytesHash: string,
      metadataHash: string,
      combinedHash: string  // SHA-256(bytesHash || metadataHash)
    }
    
□ VALIDATION
  □ Both input hashes are 64 hex chars
  □ Combined hash computed correctly
```

---

## 1.3 Attestation Engine

### Step 6: Policy Retrieval
```
□ FUNCTION: getActivePolicy(policyId)

□ INPUTS
  □ policyId: string (UUID)
  
□ PROCESS
  □ Fetch policy from policy store
  □ Verify policy signature against PolicyIssuerKey
  □ Check policy is not deprecated
  □ Check policy effective dates
  
□ OUTPUTS
  □ policy: Policy object
  □ policyHash: string (content-addressable hash of policy)
  
□ VALIDATION
  □ Policy exists
  □ Policy signature is valid
  □ Policy is currently active
  □ Policy version matches expected
```

### Step 7: Attestation Evaluation
```
□ FUNCTION: evaluateAttestation(subjectIdentifier, policy)

□ INPUTS
  □ subjectIdentifier: SubjectIdentifier
  □ policy: Policy
  
□ PROCESS
  □ Evaluate each policy rule against subject
  □ Collect attestation evidence
  □ Generate attestation verdict (pass/fail per rule)
  
□ OUTPUTS
  □ attestationResult: {
      passed: boolean,
      rules: [{ ruleId, verdict, evidence }],
      timestamp: ISO8601
    }
    
□ VALIDATION
  □ All required rules evaluated
  □ No rule evaluation errors
  □ Evidence collected for each rule
```

### Step 8: Salt Generation
```
□ FUNCTION: generateSalt()

□ PROCESS
  □ Generate 128 bits (16 bytes) of cryptographically secure random data
  □ Encode as hexadecimal string (32 chars)
  
□ OUTPUTS
  □ salt: string (32 hex chars)
  
□ VALIDATION
  □ Salt is exactly 32 characters
  □ Salt generated from CSPRNG
  □ Salt is unique (not reused)
```

### Step 9: Evidence Commitment
```
□ FUNCTION: computeEvidenceCommitment(attestationResult, salt)

□ INPUTS
  □ attestationResult: AttestationResult
  □ salt: string
  
□ PROCESS
  □ Canonicalize attestation result to JSON
  □ Concatenate: canonicalJSON || salt
  □ Compute SHA-256 hash
  
□ OUTPUTS
  □ evidenceCommitment: string (64 hex chars)
  
□ VALIDATION
  □ Commitment is deterministic given same inputs
  □ Original evidence not recoverable without salt
```

---

## 1.4 Sealing Process

### Step 10: Sealed Hash Computation
```
□ FUNCTION: computeSealedHash(subjectIdentifier, policyHash, salt)

□ INPUTS
  □ subjectIdentifier: SubjectIdentifier
  □ policyHash: string
  □ salt: string
  
□ PROCESS
  □ Concatenate (no delimiters):
    subjectIdentifier.bytesHash +
    subjectIdentifier.metadataHash +
    policyHash +
    salt
  □ Compute SHA-256 hash
  
□ OUTPUTS
  □ sealedHash: string (64 hex chars)
  
□ VALIDATION
  □ All inputs are valid hex strings
  □ Concatenation order is correct
  □ Output is deterministic
```

### Step 11: Artifact Assembly
```
□ FUNCTION: assembleArtifact(components)

□ INPUTS
  □ All computed components from previous steps
  
□ ARTIFACT STRUCTURE (canonical field order)
  □ schemaVersion: string ("1.0.0")
  □ protocolVersion: string ("1.0.0")
  □ artifactId: string (UUID)
  □ subjectIdentifier: {
      bytesHash: string,
      metadataHash: string
    }
  □ policyReference: string (policy content hash)
  □ policyVersion: integer
  □ sealedHash: string
  □ evidenceCommitment: string
  □ salt: string
  □ issuedTimestamp: string (ISO 8601 UTC)
  □ effectiveTimestamp: string (ISO 8601 UTC)
  □ expirationTimestamp: string | null
  □ issuerIdentifier: string (public key fingerprint)
  □ enforcementParameters: {
      measurementCadenceMs: integer,
      ttlSeconds: integer,
      enforcementAction: enum,
      reattestationRequired: boolean,
      reattestationIntervalSeconds: integer | null
    }
  □ disclosurePolicy: {
      claimsTaxonomy: [...],
      substitutionRules: [...]
    } | null
  □ signature: string (to be computed)
  
□ VALIDATION
  □ All required fields present
  □ All fields correct type
  □ Timestamps are valid ISO 8601
  □ UUIDs are valid format
  □ Hashes are 64 hex chars
```

### Step 12: Artifact Signing
```
□ FUNCTION: signArtifact(artifact, policyIssuerPrivateKey)

□ INPUTS
  □ artifact: Artifact (without signature field)
  □ policyIssuerPrivateKey: Ed25519 private key
  
□ PROCESS
  □ Serialize artifact to canonical JSON (sorted keys, no whitespace)
  □ Compute SHA-256 hash of serialized artifact
  □ Sign hash with Ed25519 private key
  □ Encode signature as base64
  
□ OUTPUTS
  □ signature: string (base64 encoded)
  □ signedArtifact: Artifact (with signature field)
  
□ VALIDATION
  □ Signature is valid base64
  □ Signature verifies against PolicyIssuerPublicKey
  □ Signature covers all artifact fields
```

### Step 13: Artifact Storage
```
□ FUNCTION: storeArtifact(signedArtifact)

□ PROCESS
  □ Compute content-addressable ID: SHA-256(canonical artifact JSON)
  □ Store in artifact database
  □ Index by: artifactId, subjectIdentifier, policyReference
  □ Record creation event in continuity chain
  
□ OUTPUTS
  □ artifactStorageId: string
  □ artifactContentHash: string
  
□ VALIDATION
  □ Artifact stored successfully
  □ Artifact retrievable by ID
  □ Creation event recorded
```

---

# PHASE 2: RUNTIME ENFORCEMENT (PORTAL/SENTINEL)

## 2.1 Portal Initialization

### Step 14: Artifact Retrieval
```
□ FUNCTION: retrieveArtifact(artifactId)

□ INPUTS
  □ artifactId: string
  
□ PROCESS
  □ Fetch artifact from storage
  □ Parse artifact JSON
  □ Return structured artifact object
  
□ OUTPUTS
  □ artifact: Artifact
  
□ VALIDATION
  □ Artifact exists
  □ Artifact parses correctly
  □ Artifact has all required fields
```

### Step 15: Artifact Signature Verification (GATING CHECK #1)
```
□ FUNCTION: verifyArtifactSignature(artifact, trustedIssuerKeys)

□ INPUTS
  □ artifact: Artifact
  □ trustedIssuerKeys: PublicKey[]
  
□ PROCESS
  □ Extract signature from artifact
  □ Reconstruct signing payload (artifact without signature)
  □ Serialize to canonical JSON
  □ Hash with SHA-256
  □ Verify Ed25519 signature against each trusted key
  
□ OUTPUTS
  □ signatureValid: boolean
  □ signingKeyId: string | null
  
□ VALIDATION
  □ Signature decodes from base64
  □ At least one trusted key validates signature
  □ Signing key is not revoked
  
□ FAIL-CLOSED BEHAVIOR
  □ If signature invalid: BLOCK EXECUTION
  □ If no trusted key matches: BLOCK EXECUTION
  □ Log rejection with reason
```

### Step 16: Artifact Validity Window Check (GATING CHECK #2)
```
□ FUNCTION: checkArtifactValidity(artifact, currentTime)

□ INPUTS
  □ artifact: Artifact
  □ currentTime: Date
  
□ PROCESS
  □ Parse effectiveTimestamp
  □ Parse expirationTimestamp (if present)
  □ Compare against currentTime
  
□ CHECKS
  □ currentTime >= effectiveTimestamp
  □ currentTime < expirationTimestamp (if set)
  □ TTL not exceeded since issuedTimestamp
  
□ OUTPUTS
  □ isValid: boolean
  □ reason: string | null
  
□ FAIL-CLOSED BEHAVIOR
  □ If not yet effective: BLOCK EXECUTION
  □ If expired: BLOCK EXECUTION
  □ If TTL exceeded: BLOCK EXECUTION
  □ Log rejection with reason
```

### Step 17: Subject Binding Verification (GATING CHECK #3)
```
□ FUNCTION: verifySubjectBinding(artifact, actualSubject)

□ INPUTS
  □ artifact: Artifact
  □ actualSubject: bytes (the actual subject being executed)
  
□ PROCESS
  □ Normalize actual subject (same method as creation)
  □ Compute bytesHash of actual subject
  □ Compute metadataHash of actual subject
  □ Compare to artifact.subjectIdentifier
  
□ OUTPUTS
  □ bindingValid: boolean
  □ computedHashes: { bytesHash, metadataHash }
  
□ FAIL-CLOSED BEHAVIOR
  □ If bytesHash mismatch: BLOCK EXECUTION
  □ If metadataHash mismatch: BLOCK EXECUTION
  □ Log rejection with computed vs expected hashes
```

### Step 18: Initial Measurement
```
□ FUNCTION: computeCurrentHash(subject, measurementConfig)

□ INPUTS
  □ subject: the running subject
  □ measurementConfig: from artifact.enforcementParameters
  
□ MEASUREMENT TYPES (implement as needed)
  □ Executable image digest
  □ Loaded module digests
  □ Container image digest
  □ Configuration manifest digest
  □ SBOM digest
  □ TEE quote
  □ Memory region samples
  □ File system state digest
  
□ PROCESS
  □ Collect all configured measurement types
  □ Compute hash for each measurement
  □ Combine into composite hash:
    compositeHash = SHA-256(measurement1 || measurement2 || ...)
    
□ OUTPUTS
  □ currentHash: string (64 hex chars)
  □ measurementDetails: [{ type, hash, timestamp }]
  
□ VALIDATION
  □ All configured measurements collected
  □ No measurement errors
  □ Composite hash computed correctly
```

### Step 19: Initial Hash Comparison (GATING CHECK #4)
```
□ FUNCTION: compareHashes(currentHash, sealedHash)

□ INPUTS
  □ currentHash: string
  □ sealedHash: string (from artifact)
  
□ PROCESS
  □ Constant-time string comparison
  
□ OUTPUTS
  □ match: boolean
  
□ FAIL-CLOSED BEHAVIOR
  □ If mismatch: BLOCK EXECUTION
  □ Log with both hashes for forensics
```

---

## 2.2 Continuous Monitoring Loop

### Step 20: Measurement Scheduler
```
□ FUNCTION: startMeasurementLoop(artifact, subject)

□ INPUTS
  □ artifact: Artifact
  □ subject: running subject reference
  
□ PROCESS
  □ Read measurementCadenceMs from artifact
  □ Start interval timer
  □ On each tick: perform measurement cycle
  
□ LOOP BEHAVIOR
  □ Compute current hash
  □ Compare to sealed hash
  □ If match: continue, optionally log
  □ If mismatch: trigger enforcement
  
□ STATE TRACKING
  □ lastMeasurementTime: Date
  □ measurementCount: integer
  □ consecutiveMatches: integer
  □ driftDetected: boolean
```

### Step 21: Drift Detection
```
□ FUNCTION: detectDrift(currentHash, sealedHash, measurementDetails)

□ INPUTS
  □ currentHash: string
  □ sealedHash: string
  □ measurementDetails: array
  
□ PROCESS
  □ Compare hashes
  □ If mismatch, identify which measurements changed
  □ Compute drift magnitude/type
  
□ OUTPUTS
  □ driftDetected: boolean
  □ driftDetails: {
      expectedHash: string,
      actualHash: string,
      changedMeasurements: [...],
      detectionTimestamp: ISO8601,
      detectionLatencyMs: integer
    }
```

---

## 2.3 Enforcement Actions

### Step 22: Enforcement Action Executor
```
□ FUNCTION: executeEnforcementAction(artifact, driftDetails)

□ INPUTS
  □ artifact: Artifact
  □ driftDetails: DriftDetails
  
□ PROCESS
  □ Read enforcementAction from artifact.enforcementParameters
  □ Execute appropriate action:
  
□ ACTION: TERMINATE
  □ Immediately halt subject execution
  □ Release all resources
  □ Log termination
  
□ ACTION: QUARANTINE
  □ Sever output connections (see Step 23)
  □ Create phantom environment (see Step 24)
  □ Continue input capture (see Step 25)
  
□ ACTION: NETWORK_ISOLATION
  □ Sever network connections
  □ Allow local execution to continue
  □ Log all network attempts
  
□ ACTION: SAFE_STATE
  □ Trigger safe-state protocol
  □ For vehicles: return-to-home
  □ For processes: graceful shutdown
  □ For SCADA: fail-safe position
  
□ ACTION: ALERT_ONLY
  □ Log drift
  □ Send alert
  □ Allow execution to continue
  
□ OUTPUTS
  □ actionExecuted: enum
  □ actionTimestamp: ISO8601
  □ actionDetails: object
```

### Step 23: Output Severing (Quarantine)
```
□ FUNCTION: severOutputs(subject)

□ PROCESS
  □ Enumerate all output channels:
      □ Physical actuators
      □ Network sockets
      □ File system writes
      □ IPC channels
      □ Hardware interfaces
  □ Redirect each to null sink or capture buffer
  □ Prevent any output from reaching protected resources
  
□ VALIDATION
  □ All outputs identified
  □ All outputs severed
  □ No output reaches protected resources
  □ Severing is logged
```

### Step 24: Phantom Environment Creation
```
□ FUNCTION: createPhantomEnvironment(subject)

□ PROCESS
  □ Create sandboxed execution context
  □ Clone subject state into sandbox
  □ Redirect all I/O to phantom handlers
  □ Subject believes it's operating normally
  
□ OUTPUTS
  □ phantomEnvironment: execution context
  □ creationTimestamp: ISO8601
```

### Step 25: Forensic Capture
```
□ FUNCTION: startForensicCapture(phantomEnvironment)

□ CAPTURE TARGETS
  □ All inputs (attacker commands, network traffic)
  □ All attempted outputs (what subject tried to do)
  □ All state changes
  □ All system calls
  □ All memory modifications
  
□ PROCESS
  □ Hook all I/O channels
  □ Log everything to forensic buffer
  □ Timestamp each event
  □ Compute rolling hashes of capture data
  
□ OUTPUTS
  □ forensicLog: append-only buffer
  □ forensicLogHash: continuously updated hash
```

---

# PHASE 3: RECEIPT GENERATION & CONTINUITY CHAIN

## 3.1 Receipt Generation

### Step 26: Receipt Assembly
```
□ FUNCTION: assembleReceipt(receiptData)

□ RECEIPT STRUCTURE
  □ schemaVersion: string
  □ protocolVersion: string
  □ receiptId: string (UUID)
  □ receiptType: enum (MEASUREMENT, DRIFT, ENFORCEMENT, FORENSIC)
  □ artifactReference: {
      artifactId: string,
      artifactHash: string,        // CRITICAL: Artifact binding
      policyReference: string,
      policyIssuerKeyId: string    // CRITICAL: Issuer binding
    }
  □ subjectIdentifier: {
      bytesHash: string,
      metadataHash: string
    }
  □ measurement: {
      sealedHash: string,
      currentHash: string,
      match: boolean,
      measurementDetails: [...],
      measurementTimestamp: ISO8601,
      measurementLatencyMs: integer
    }
  □ enforcement: {                 // CRITICAL: Outcome, not just detection
      driftDetected: boolean,
      driftDetails: object | null,
      actionExecuted: enum,
      actionTimestamp: ISO8601,
      actionOutcome: enum (SUCCESS, PARTIAL, FAILED),
      outcomeDetails: object
    }
  □ chainLinkage: {
      sequenceNumber: integer,      // CRITICAL: Monotonic
      previousReceiptHash: string,  // CRITICAL: Chain binding
      chainId: string
    }
  □ timestamp: ISO8601
  □ portalIdentifier: string
  □ signature: string (computed last)
  
□ VALIDATION
  □ All required fields present
  □ artifactReference.artifactHash matches actual artifact
  □ sequenceNumber is exactly previousSequence + 1
  □ previousReceiptHash matches actual previous receipt
```

### Step 27: Receipt Signing
```
□ FUNCTION: signReceipt(receipt, enforcementPrivateKey)

□ INPUTS
  □ receipt: Receipt (without signature)
  □ enforcementPrivateKey: Ed25519 private key
  
□ PROCESS
  □ Serialize receipt to canonical JSON
  □ Compute SHA-256 hash
  □ Sign with Ed25519
  □ Encode as base64
  
□ CRITICAL: KEY SEPARATION
  □ enforcementPrivateKey ≠ policyIssuerPrivateKey
  □ This prevents single-actor tampering
  
□ OUTPUTS
  □ signature: string
  □ signedReceipt: Receipt
  
□ VALIDATION
  □ Signature verifies against EnforcementPublicKey
  □ EnforcementPublicKey ≠ PolicyIssuerPublicKey
```

### Step 28: Receipt Hash Computation
```
□ FUNCTION: computeReceiptHash(signedReceipt)

□ INPUTS
  □ signedReceipt: Receipt
  
□ PROCESS
  □ Serialize to canonical JSON (including signature)
  □ Compute SHA-256
  
□ OUTPUTS
  □ receiptHash: string (64 hex chars)
```

---

## 3.2 Continuity Chain Management

### Step 29: Genesis Event Creation (First Event in Chain)
```
□ FUNCTION: createGenesisEvent(chainConfig)

□ GENESIS EVENT STRUCTURE
  □ schemaVersion: string
  □ protocolVersion: string
  □ eventType: "GENESIS"
  □ eventId: string (UUID)
  □ sequenceNumber: 0
  □ timestamp: ISO8601
  □ chainId: string (UUID)
  □ rootFingerprint: string (derived from chain keypair)
  □ specificationHash: string (hash of protocol spec)
  □ previousLeafHash: null (genesis has no previous)
  □ payload: {
      taxonomyVersion: string,
      initialPolicies: [...],
      chainPurpose: string
    }
  □ payloadHash: string
  □ eventSignature: string
  
□ VALIDATION
  □ sequenceNumber is exactly 0
  □ previousLeafHash is null
  □ This is the first event in the chain
```

### Step 30: Leaf Hash Computation (PRIVACY-PRESERVING)
```
□ FUNCTION: computeLeafHash(event)

□ INPUTS
  □ event: ChainEvent
  
□ PROCESS (CRITICAL: Structural metadata only, NO PAYLOAD)
  □ Concatenate (with delimiter or length-prefixed):
    schemaVersion ||
    protocolVersion ||
    eventType ||
    eventId ||
    sequenceNumber ||
    timestamp ||
    previousLeafHash
  □ Compute SHA-256
  
□ CRITICAL: PAYLOAD EXCLUDED
  □ Payload is NOT included in leaf hash
  □ This enables integrity verification without payload disclosure
  □ Payload integrity protected by eventSignature + payloadHash
  
□ OUTPUTS
  □ leafHash: string (64 hex chars)
  
□ VALIDATION
  □ Payload NOT included in hash input
  □ All structural fields included
  □ Order is consistent
```

### Step 31: Chain Event Assembly
```
□ FUNCTION: assembleChainEvent(eventData, previousEvent)

□ EVENT STRUCTURE
  □ schemaVersion: string
  □ protocolVersion: string
  □ eventType: enum (POLICY_ISSUANCE, RECEIPT, REVOCATION, ATTESTATION, ANCHOR_BATCH)
  □ eventId: string (UUID)
  □ sequenceNumber: integer (previousEvent.sequenceNumber + 1)
  □ timestamp: ISO8601
  □ previousLeafHash: string (computed from previousEvent)
  □ payload: object (event-specific data)
  □ payloadHash: string (SHA-256 of canonical payload JSON)
  □ eventSignature: string
  
□ VALIDATION
  □ sequenceNumber == previousEvent.sequenceNumber + 1 (STRICT)
  □ previousLeafHash matches computeLeafHash(previousEvent)
  □ No gaps in sequence allowed
  □ No duplicate sequence numbers
```

### Step 32: Event Signing
```
□ FUNCTION: signChainEvent(event, chainPrivateKey)

□ INPUTS
  □ event: ChainEvent (without signature)
  □ chainPrivateKey: Ed25519 private key
  
□ PROCESS
  □ Serialize COMPLETE event to canonical JSON (including payload)
  □ Compute SHA-256
  □ Sign with Ed25519
  
□ CRITICAL: Signature covers ENTIRE event including payload
  □ This protects payload integrity
  □ Even though payload excluded from leaf hash
  
□ OUTPUTS
  □ eventSignature: string
  □ signedEvent: ChainEvent
```

### Step 33: Chain Append
```
□ FUNCTION: appendToChain(chain, newEvent)

□ PROCESS
  □ Verify newEvent.previousLeafHash matches current chain head
  □ Verify newEvent.sequenceNumber == currentHead.sequenceNumber + 1
  □ Verify event signature
  □ Compute new leaf hash
  □ Append to chain storage
  □ Update chain head pointer
  
□ VALIDATION
  □ Anti-fork check: only one event can follow each previous event
  □ Sequence is strictly monotonic
  □ No gaps
  
□ OUTPUTS
  □ appendSuccess: boolean
  □ newChainHead: leafHash
```

---

## 3.3 Checkpoint Anchoring

### Step 34: Batch Selection
```
□ FUNCTION: selectCheckpointBatch(chain, lastCheckpoint)

□ PROCESS
  □ Select all events since lastCheckpoint
  □ Or: select last N events
  □ Or: select events in time window
  
□ OUTPUTS
  □ batchedEvents: ChainEvent[]
  □ startSequence: integer
  □ endSequence: integer
```

### Step 35: Merkle Tree Construction
```
□ FUNCTION: buildMerkleTree(batchedEvents)

□ PROCESS
  □ Compute leaf hash for each event (structural metadata only)
  □ Build binary Merkle tree:
    □ Leaves = leaf hashes of events
    □ Internal nodes = SHA-256(leftChild || rightChild)
    □ If odd number, duplicate last leaf
  □ Compute Merkle root
  
□ OUTPUTS
  □ merkleTree: tree structure
  □ merkleRoot: string (64 hex chars)
  □ leafHashes: string[]
  
□ VALIDATION
  □ Tree construction is deterministic
  □ Same events always produce same root
```

### Step 36: Anchor Submission
```
□ FUNCTION: submitAnchor(merkleRoot, anchorConfig)

□ ANCHOR TARGETS (implement one or more)
  □ Ethereum (calldata or contract)
  □ Bitcoin (OP_RETURN)
  □ Arweave
  □ IPFS + Filecoin
  □ Hyperledger Fabric
  □ Trusted Timestamp Authority (RFC 3161)
  
□ PROCESS
  □ Format merkleRoot for target network
  □ Submit transaction
  □ Wait for confirmation
  □ Retrieve transaction ID / proof
  
□ OUTPUTS
  □ anchorProof: {
      networkId: string,
      transactionId: string,
      blockNumber: integer | null,
      blockHash: string | null,
      timestamp: ISO8601,
      confirmations: integer
    }
```

### Step 37: Checkpoint Record Creation
```
□ FUNCTION: createCheckpointRecord(batchInfo, merkleRoot, anchorProof)

□ CHECKPOINT STRUCTURE
  □ checkpointId: string (UUID)
  □ chainId: string
  □ batchRange: {
      startSequence: integer,
      endSequence: integer,
      eventCount: integer
    }
  □ merkleRoot: string
  □ anchorProof: object
  □ timestamp: ISO8601
  □ checkpointSignature: string (signed by CheckpointKey)
  
□ PROCESS
  □ Assemble checkpoint record
  □ Sign with CheckpointKey
  □ Append ANCHOR_BATCH event to chain
  □ Store checkpoint for later proof generation
```

### Step 38: Inclusion Proof Generation
```
□ FUNCTION: generateInclusionProof(targetEvent, checkpointId)

□ INPUTS
  □ targetEvent: ChainEvent
  □ checkpointId: string
  
□ PROCESS
  □ Retrieve checkpoint's Merkle tree
  □ Find targetEvent's position in tree
  □ Collect sibling hashes along path to root
  
□ INCLUSION PROOF STRUCTURE
  □ eventLeafHash: string
  □ eventSequence: integer
  □ merkleRoot: string
  □ proofPath: [{ position: 'left'|'right', hash: string }]
  □ checkpointReference: {
      checkpointId: string,
      anchorProof: object
    }
    
□ OUTPUTS
  □ inclusionProof: InclusionProof
```

---

# PHASE 4: VERIFICATION

## 4.1 Evidence Bundle Assembly

### Step 39: Evidence Bundle Creation
```
□ FUNCTION: createEvidenceBundle(artifacts, receipts, proofs)

□ EVIDENCE BUNDLE STRUCTURE
  □ bundleId: string (UUID)
  □ bundleVersion: string
  □ created: ISO8601
  □ policyArtifact: Artifact
  □ receipts: Receipt[]
  □ inclusionProofs: InclusionProof[]
  □ checkpointReferences: CheckpointReference[]
  □ publicKeys: {
      policyIssuerKey: PublicKey,
      enforcementKey: PublicKey,
      checkpointKey: PublicKey
    }
  □ verificationInstructions: object
  
□ SELF-CONTAINED REQUIREMENT
  □ Bundle MUST contain everything needed for offline verification
  □ No external fetches required
  □ Public keys included (verifier can pin their own)
```

---

## 4.2 Offline Verification Engine

### Step 40: Artifact Verification
```
□ FUNCTION: verifyArtifact(artifact, trustedIssuerKey)

□ VERIFICATION STEPS
  □ Parse artifact JSON
  □ Extract signature
  □ Reconstruct signing payload
  □ Verify Ed25519 signature against trustedIssuerKey
  □ Check timestamp validity
  □ Validate all required fields present
  
□ OUTPUTS
  □ artifactValid: boolean
  □ verificationDetails: object
  
□ OFFLINE CAPABILITY
  □ No network requests
  □ All computation is local
  □ trustedIssuerKey can be pinned locally
```

### Step 41: Receipt Verification
```
□ FUNCTION: verifyReceipt(receipt, trustedEnforcementKey, artifact)

□ VERIFICATION STEPS
  □ Verify receipt signature against trustedEnforcementKey
  □ Verify receipt.artifactReference.artifactHash matches SHA-256(artifact)
  □ Verify receipt.artifactReference.policyReference matches artifact.policyReference
  □ Verify receipt timestamp is within artifact validity window
  
□ CRITICAL CHECKS
  □ Receipt is bound to THIS artifact (not some other artifact)
  □ Receipt signed by authorized enforcement key
  □ Receipt timestamps are valid
  
□ OUTPUTS
  □ receiptValid: boolean
  □ artifactBindingValid: boolean
  □ verificationDetails: object
```

### Step 42: Chain Continuity Verification
```
□ FUNCTION: verifyChainContinuity(receipts)

□ VERIFICATION STEPS
  □ Sort receipts by sequenceNumber
  □ Verify sequence is strictly monotonic (no gaps)
  □ For each receipt after first:
      □ Compute leafHash of previous receipt (structural metadata only)
      □ Verify current.previousReceiptHash == computed leafHash
  □ Verify no forks (each sequence number appears exactly once)
  
□ OUTPUTS
  □ chainIntact: boolean
  □ gapsDetected: boolean
  □ forksDetected: boolean
  □ verificationDetails: object
```

### Step 43: Merkle Inclusion Proof Verification
```
□ FUNCTION: verifyInclusionProof(proof, trustedMerkleRoot)

□ VERIFICATION STEPS
  □ Start with proof.eventLeafHash
  □ For each step in proof.proofPath:
      □ If position == 'left': hash = SHA-256(sibling || current)
      □ If position == 'right': hash = SHA-256(current || sibling)
      □ current = hash
  □ Verify final hash == trustedMerkleRoot
  
□ OUTPUTS
  □ proofValid: boolean
  □ computedRoot: string
  
□ OFFLINE CAPABILITY
  □ Purely computational
  □ No network required
```

### Step 44: Full Bundle Verification
```
□ FUNCTION: verifyEvidenceBundle(bundle, trustedKeys)

□ VERIFICATION SEQUENCE
  □ Step 1: Verify artifact signature
  □ Step 2: For each receipt:
      □ Verify receipt signature
      □ Verify artifact binding
  □ Step 3: Verify chain continuity across all receipts
  □ Step 4: For each inclusion proof:
      □ Verify Merkle inclusion
  □ Step 5 (OPTIONAL, requires network):
      □ Verify checkpoint anchor on external network
  
□ OUTPUTS
  □ bundleValid: boolean
  □ artifactVerification: object
  □ receiptVerifications: object[]
  □ chainVerification: object
  □ proofVerifications: object[]
  □ anchorVerification: object | null (if Step 5 performed)
  
□ OFFLINE CAPABILITY
  □ Steps 1-4: Fully offline
  □ Step 5: Requires network OR pre-fetched anchor data
```

---

# DATA STRUCTURES REFERENCE

## Artifact Schema
```typescript
interface PolicyArtifact {
  schemaVersion: string;
  protocolVersion: string;
  artifactId: string;
  subjectIdentifier: {
    bytesHash: string;
    metadataHash: string;
  };
  policyReference: string;
  policyVersion: number;
  sealedHash: string;
  evidenceCommitment: string;
  salt: string;
  issuedTimestamp: string;
  effectiveTimestamp: string;
  expirationTimestamp: string | null;
  issuerIdentifier: string;
  enforcementParameters: {
    measurementCadenceMs: number;
    ttlSeconds: number;
    enforcementAction: 'TERMINATE' | 'QUARANTINE' | 'NETWORK_ISOLATION' | 'SAFE_STATE' | 'ALERT_ONLY';
    reattestationRequired: boolean;
    reattestationIntervalSeconds: number | null;
  };
  disclosurePolicy: DisclosurePolicy | null;
  signature: string;
}
```

## Receipt Schema
```typescript
interface EnforcementReceipt {
  schemaVersion: string;
  protocolVersion: string;
  receiptId: string;
  receiptType: 'MEASUREMENT' | 'DRIFT' | 'ENFORCEMENT' | 'FORENSIC';
  artifactReference: {
    artifactId: string;
    artifactHash: string;
    policyReference: string;
    policyIssuerKeyId: string;
  };
  subjectIdentifier: {
    bytesHash: string;
    metadataHash: string;
  };
  measurement: {
    sealedHash: string;
    currentHash: string;
    match: boolean;
    measurementDetails: MeasurementDetail[];
    measurementTimestamp: string;
    measurementLatencyMs: number;
  };
  enforcement: {
    driftDetected: boolean;
    driftDetails: DriftDetails | null;
    actionExecuted: string;
    actionTimestamp: string;
    actionOutcome: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    outcomeDetails: object;
  };
  chainLinkage: {
    sequenceNumber: number;
    previousReceiptHash: string;
    chainId: string;
  };
  timestamp: string;
  portalIdentifier: string;
  signature: string;
}
```

## Chain Event Schema
```typescript
interface ChainEvent {
  schemaVersion: string;
  protocolVersion: string;
  eventType: 'GENESIS' | 'POLICY_ISSUANCE' | 'RECEIPT' | 'REVOCATION' | 'ATTESTATION' | 'ANCHOR_BATCH';
  eventId: string;
  sequenceNumber: number;
  timestamp: string;
  previousLeafHash: string | null;
  payload: object;
  payloadHash: string;
  eventSignature: string;
}
```

## Evidence Bundle Schema
```typescript
interface EvidenceBundle {
  bundleId: string;
  bundleVersion: string;
  created: string;
  policyArtifact: PolicyArtifact;
  receipts: EnforcementReceipt[];
  inclusionProofs: InclusionProof[];
  checkpointReferences: CheckpointReference[];
  publicKeys: {
    policyIssuerKey: PublicKeyInfo;
    enforcementKey: PublicKeyInfo;
    checkpointKey: PublicKeyInfo;
  };
  verificationInstructions: VerificationInstructions;
}
```

---

# CRYPTOGRAPHIC REQUIREMENTS

## Hash Functions
```
□ SHA-256 for all content hashing
  □ Bytes commitment
  □ Metadata commitment
  □ Sealed hash
  □ Receipt hash
  □ Leaf hash
  □ Merkle tree nodes
  
□ Output format: lowercase hexadecimal (64 characters)

□ Libraries:
  □ Node.js: crypto.createHash('sha256')
  □ Browser: crypto.subtle.digest('SHA-256', ...)
  □ Rust: sha2 crate
```

## Digital Signatures
```
□ Ed25519 for all signatures
  □ Artifact signatures (PolicyIssuerKey)
  □ Receipt signatures (EnforcementKey)
  □ Event signatures (ChainKey)
  □ Checkpoint signatures (CheckpointKey)
  
□ Output format: base64 encoded

□ Libraries:
  □ Node.js: @noble/ed25519
  □ Browser: @noble/ed25519 (works in browser)
  □ Rust: ed25519-dalek
```

## Key Management
```
□ KEY TYPES (must be separate)
  □ PolicyIssuerKey: Signs artifacts
  □ EnforcementKey: Signs receipts (different from issuer!)
  □ ChainKey: Signs chain events
  □ CheckpointKey: Signs checkpoints
  
□ KEY DERIVATION
  □ HKDF-SHA256 for deriving keys from master secret
  
□ KEY STORAGE
  □ Development: Environment variables / secure config
  □ Production: HSM, secure enclave, or key management service
  
□ KEY ROTATION
  □ Support multiple active keys during rotation
  □ Old signatures remain valid
  □ New signatures use new key
```

## Randomness
```
□ Salt generation: 128 bits (16 bytes) minimum
□ UUIDs: Version 4 (random)
□ Source: CSPRNG only
  □ Node.js: crypto.randomBytes()
  □ Browser: crypto.getRandomValues()
```

---

# API ENDPOINTS REFERENCE

## Artifact Management
```
POST   /api/v1/artifacts              Create new artifact
GET    /api/v1/artifacts/:id          Retrieve artifact
GET    /api/v1/artifacts              List artifacts (paginated)
DELETE /api/v1/artifacts/:id          Revoke artifact
```

## Policy Management
```
POST   /api/v1/policies               Create policy
GET    /api/v1/policies/:id           Get policy
GET    /api/v1/policies/:id/versions  List policy versions
PUT    /api/v1/policies/:id           Create new version
DELETE /api/v1/policies/:id           Deprecate policy
```

## Receipt & Chain
```
GET    /api/v1/receipts/:id           Get receipt
GET    /api/v1/receipts               List receipts (filtered)
GET    /api/v1/chain/events           List chain events
GET    /api/v1/chain/head             Get current chain head
```

## Checkpoints
```
GET    /api/v1/checkpoints            List checkpoints
GET    /api/v1/checkpoints/:id        Get checkpoint
POST   /api/v1/checkpoints            Trigger manual checkpoint
GET    /api/v1/checkpoints/:id/proof/:eventId  Get inclusion proof
```

## Evidence Bundles
```
POST   /api/v1/bundles                Create evidence bundle
GET    /api/v1/bundles/:id            Get bundle
GET    /api/v1/bundles/:id/download   Download bundle file
```

## Verification
```
POST   /api/v1/verify/artifact        Verify artifact signature
POST   /api/v1/verify/receipt         Verify receipt
POST   /api/v1/verify/bundle          Verify complete bundle
POST   /api/v1/verify/proof           Verify inclusion proof
```

---

# VALIDATION RULES SUMMARY

## Critical Fail-Closed Gates
```
□ Artifact signature MUST verify against trusted issuer key
□ Artifact MUST be within validity window
□ Subject binding MUST match (bytes hash + metadata hash)
□ Initial hash MUST match sealed hash
□ Any failure = BLOCK EXECUTION
```

## Critical Chain Integrity Rules
```
□ Sequence numbers MUST be strictly monotonic (no gaps)
□ Each event MUST reference correct previous leaf hash
□ No forks allowed (one event per sequence number)
□ Receipts MUST be bound to artifact hash
```

## Critical Key Separation
```
□ PolicyIssuerKey ≠ EnforcementKey
□ Signatures from different keys required for full validity
□ Prevents single-actor tampering
```

## Critical Privacy Preservation
```
□ Leaf hash computed from structural metadata ONLY
□ Payload EXCLUDED from leaf hash
□ Payload integrity via signature + payload hash
□ Third party can verify chain without seeing payloads
```

---

# IMPLEMENTATION PRIORITY

## Phase 1: Core (MVP)
```
□ Artifact creation (Steps 1-13)
□ Basic portal gating (Steps 14-19)
□ Single measurement type
□ Receipt generation (Steps 26-28)
□ Basic chain (Steps 29-33)
□ Bundle creation (Step 39)
□ Offline verification (Steps 40-44)
```

## Phase 2: Full Enforcement
```
□ Continuous monitoring (Steps 20-21)
□ All enforcement actions (Step 22)
□ Quarantine/phantom (Steps 23-25)
□ Multiple measurement types
```

## Phase 3: Anchoring
```
□ Checkpoint batching (Step 34)
□ Merkle tree (Step 35)
□ External anchor submission (Step 36)
□ Inclusion proofs (Step 38)
```

## Phase 4: Production Hardening
```
□ Key management / HSM integration
□ High availability
□ Monitoring / alerting
□ Rate limiting
□ Audit logging
```

---

# TESTING CHECKLIST

## Unit Tests
```
□ Hash computation determinism
□ Canonicalization determinism
□ Signature generation/verification
□ Merkle tree construction
□ Inclusion proof verification
□ Chain linkage validation
```

## Integration Tests
```
□ Full artifact creation flow
□ Portal gating (valid artifact)
□ Portal gating (invalid signature)
□ Portal gating (expired artifact)
□ Portal gating (wrong subject)
□ Drift detection
□ Enforcement action execution
□ Receipt chain integrity
□ Evidence bundle creation
□ Full offline verification
```

## Security Tests
```
□ Replay attack resistance
□ Fork attack resistance
□ Tampering detection
□ Key separation enforcement
□ Timing attack resistance (constant-time comparison)
```

---

END OF IMPLEMENTATION CHECKLIST
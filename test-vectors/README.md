# AGA Test Vectors

Per AGA Specification Appendix B, this directory contains normative test vectors for validating cryptographic operations.

## Vector Files

| File | Description |
|------|-------------|
| `tv-jcs-001.json` | JCS/RFC 8785 canonicalization and SHA-256 hashing |
| `tv-sig-001.json` | Ed25519 signature generation and verification |
| `tv-replay-001.json` | Replay protection - accept first sequence |
| `tv-replay-002.json` | Replay protection - reject replayed sequence |
| `tv-drift-integrity.json` | Integrity drift detection (image/config/SBOM) |
| `tv-drift-telemetry.json` | Telemetry drift detection (range/threshold/missing/late) |

## Running Tests

```bash
npm run test:vectors
```

## TV-JCS-001: Canonicalization

Input object:
```json
{
  "artifact_id": "art_01HXYZTEST0000000000000001",
  "measurement_id": "m_0001",
  "measurement_time": 1735600000,
  "run_id": "run_01HXYZTEST0000000000000001",
  "sequence_number": 1,
  "stream_id": "pressure_psi",
  "value": 42
}
```

Expected canonical output (single line, keys sorted):
```
{"artifact_id":"art_01HXYZTEST0000000000000001","measurement_id":"m_0001","measurement_time":1735600000,"run_id":"run_01HXYZTEST0000000000000001","sequence_number":1,"stream_id":"pressure_psi","value":42}
```

Expected SHA-256 (base64url): `uM22uzzEnt39f1ZO14U_gZ7C7mGvCW87JPKCvgRGe-Q`

## TV-SIG-001: Ed25519 Signature

**WARNING: Test keys only. Never use in production.**

- Public key (base64url): `lKRKF0qyRCAgAy20lqWwTunJjnb8Id7ijIHcoXaWmrg`
- Key ID: `36ee3280c62ed537`

Signature over TV-JCS-001 canonical bytes (base64url):
```
uqon4tfDmyfYaM9txEyQAHlHPRQVc3Qrw22_0PnFpuEAlrDA8kwnOh4eNa76SdA0d9099mbRh8WRKB0uJurjCg
```

## Validation Requirements

Per spec, implementations MUST:
1. Pass all test vectors
2. Ship a CI command to validate vectors
3. Produce identical output for identical input (determinism)

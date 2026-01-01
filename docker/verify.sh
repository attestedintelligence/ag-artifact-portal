#!/bin/sh
# =============================================================================
# Offline Bundle Verifier
# Per AGA Build Guide Phase 12
# =============================================================================

set -e

usage() {
  echo "Usage: verify <bundle.agb>"
  echo ""
  echo "Verifies an Attested Governance Bundle (.agb) file offline."
  echo ""
  echo "Exit codes:"
  echo "  0 - PASS: Bundle verified successfully"
  echo "  1 - FAIL: Verification failed"
  echo "  2 - PASS_WITH_CAVEATS: Verified with warnings"
  echo "  3 - ERROR: Invalid input or system error"
  echo ""
  echo "Example:"
  echo "  verify /bundles/evidence_20241230.agb"
}

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  usage
  exit 0
fi

if [ -z "$1" ]; then
  echo "Error: No bundle file specified"
  usage
  exit 3
fi

BUNDLE_PATH="$1"

if [ ! -f "$BUNDLE_PATH" ]; then
  echo "Error: Bundle file not found: $BUNDLE_PATH"
  exit 3
fi

echo "═══════════════════════════════════════════════════════════════"
echo "                    BUNDLE VERIFICATION                        "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Bundle: $BUNDLE_PATH"
echo "Verifier: ag-verify v1.0.0"
echo ""

# Run Node.js verifier
node /app/packages/core/dist/verifier/cli.js "$BUNDLE_PATH"

EXIT_CODE=$?

echo ""
echo "═══════════════════════════════════════════════════════════════"

exit $EXIT_CODE

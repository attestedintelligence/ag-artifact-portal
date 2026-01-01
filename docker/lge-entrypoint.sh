#!/bin/sh
# =============================================================================
# Local Governance Engine - Entrypoint Script
# Per AGA Build Guide Phase 12
# =============================================================================

set -e

# Configuration
LGE_PORT="${LGE_PORT:-8080}"
LGE_LOG_LEVEL="${LGE_LOG_LEVEL:-info}"
LGE_LEDGER_PATH="${LGE_LEDGER_PATH:-/var/log/lge}"
LGE_DATA_PATH="${LGE_DATA_PATH:-/var/lib/lge}"

# Export environment
export LGE_PORT
export LGE_LOG_LEVEL
export LGE_LEDGER_PATH
export LGE_DATA_PATH

echo "=========================================="
echo "Local Governance Engine (LGE) Starting"
echo "=========================================="
echo "Port: $LGE_PORT"
echo "Log Level: $LGE_LOG_LEVEL"
echo "Ledger Path: $LGE_LEDGER_PATH"
echo "Data Path: $LGE_DATA_PATH"
echo "=========================================="

# Ensure directories exist
mkdir -p "$LGE_LEDGER_PATH" "$LGE_DATA_PATH"

# Start LGE
exec "$@"

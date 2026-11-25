#!/usr/bin/env bash
# Operator-only. Never invoke with xtrace or log AWS CLI request bodies.
set +x
set -euo pipefail
umask 077
ulimit -c 0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/provision-enclave-credentials.py" "$@"

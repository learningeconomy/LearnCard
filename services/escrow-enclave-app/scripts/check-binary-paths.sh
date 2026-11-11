#!/usr/bin/env bash
# check-binary-paths.sh — fail if a built escrow-enclave binary contains
# leaked host build-machine path strings (plan task P2.2).
#
# The Dockerfile's reproducible build (P2.1) already remaps common host
# paths via rustc's `--remap-path-prefix` (see the Dockerfile's RUSTFLAGS
# comment), but nothing in that build verifies the remap actually worked —
# panic messages, `#[track_caller]`/`Location::caller()` data, or a
# dependency's own `env!("CARGO_MANIFEST_DIR")`-style embed can still leak
# an absolute host path into the shipped binary's string table even after
# remapping. This script is that verification.
#
# CI (.github/workflows/escrow-enclave-eif.yml, job `eif`) runs this against
# the release binary extracted from the reproducibly-built `image.tar`, and
# this repo's README/CI docs also run it locally against a plain
# `cargo build` debug binary to demonstrate that it correctly flags an
# unremapped build (a non-remapped local debug build is EXPECTED to fail
# this check — that failure is the proof the script works, not a bug).
#
# Usage: check-binary-paths.sh <path-to-binary>
#   exit 0  no forbidden host path strings found
#   exit 1  usage error, missing binary, or missing required tool
#   exit 2  one or more forbidden host path strings were found
set -euo pipefail

usage() {
    echo "Usage: $(basename -- "$0") <path-to-binary>" >&2
}

if [ "$#" -ne 1 ]; then
    usage
    exit 1
fi

binary="$1"

if [ ! -f "${binary}" ]; then
    echo "error: binary not found: ${binary}" >&2
    exit 1
fi

if ! command -v strings >/dev/null 2>&1; then
    echo "error: required tool 'strings' not found on PATH" >&2
    exit 1
fi

# Forbidden host build-machine path fragments. Any occurrence means a host
# path leaked into the binary instead of being scrubbed by the Dockerfile's
# --remap-path-prefix flags (or, for the local demonstration run, that no
# remapping was attempted at all — see this script's header comment).
patterns=(
    '/root/'
    '/usr/local/cargo'
    '/usr/local/rustup'
    '/home/'
    '/Users/'
)

found_any=0

# -a: scan every section of the binary (not just the default subset), so
# this behaves the same on GNU strings (Linux CI/EIF binaries) and BSD/macOS
# strings (local demonstration runs against a native debug binary) — on
# macOS, `strings` without -a skips the (__TEXT,__text) section by default.
for pattern in "${patterns[@]}"; do
    matches="$(strings -a -- "${binary}" | grep -F -- "${pattern}" || true)"
    if [ -n "${matches}" ]; then
        found_any=1
        match_count="$(printf '%s\n' "${matches}" | grep -c '')"
        echo "FAIL: found ${match_count} string(s) containing forbidden path '${pattern}':" >&2
        printf '%s\n' "${matches}" | head -n 5 | sed 's/^/  /' >&2
        if [ "${match_count}" -gt 5 ]; then
            echo "  ... (${match_count} total, showing first 5)" >&2
        fi
    fi
done

if [ "${found_any}" -ne 0 ]; then
    echo "error: ${binary} contains forbidden host build-machine path strings." >&2
    echo "Host paths (e.g. /root, /Users/<you>, cargo/rustup install dirs)" >&2
    echo "leaked into the shipped enclave binary — a reproducibility and" >&2
    echo "information-disclosure concern for an attested Nitro Enclave" >&2
    echo "image. See the Dockerfile's --remap-path-prefix flags and" >&2
    echo "security/README.md." >&2
    exit 2
fi

echo "ok: ${binary} contains none of the forbidden host path strings."

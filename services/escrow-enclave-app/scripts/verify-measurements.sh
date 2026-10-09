#!/usr/bin/env bash
# verify-measurements.sh — compare two measurements.json files' pcr0/pcr1/pcr2.
#
# Usage: verify-measurements.sh <a.json> <b.json>
# Exit 0 if pcr0/pcr1/pcr2 all match between the two files, non-zero
# otherwise. Used by P2.2's double-build reproducibility CI gate.
set -euo pipefail

usage() {
    echo "Usage: verify-measurements.sh <a.json> <b.json>" >&2
}

if [ $# -ne 2 ]; then
    usage
    exit 1
fi

A_FILE="$1"
B_FILE="$2"

for f in "${A_FILE}" "${B_FILE}"; do
    if [ ! -f "${f}" ]; then
        echo "error: file not found: ${f}" >&2
        exit 1
    fi
    if ! jq -e '.pcr0 and .pcr1 and .pcr2' "${f}" >/dev/null 2>&1; then
        echo "error: ${f} is not valid JSON with pcr0/pcr1/pcr2 fields" >&2
        exit 1
    fi
done

STATUS=0
for pcr in pcr0 pcr1 pcr2; do
    A_VAL="$(jq -r ".${pcr}" "${A_FILE}")"
    B_VAL="$(jq -r ".${pcr}" "${B_FILE}")"
    if [ "${A_VAL}" = "${B_VAL}" ]; then
        echo "ok:  ${pcr} matches (${A_VAL})"
    else
        echo "FAIL: ${pcr} differs:" >&2
        echo "  ${A_FILE}: ${A_VAL}" >&2
        echo "  ${B_FILE}: ${B_VAL}" >&2
        STATUS=1
    fi
done

if [ "${STATUS}" -ne 0 ]; then
    echo "Reproducibility check FAILED: the two builds are not identical." >&2
else
    echo "Reproducibility check passed: pcr0/pcr1/pcr2 identical."
fi

exit "${STATUS}"

#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
DIDKIT_WEB_DIR="${ROOT_DIR}/lib/didkit/lib/web"
SOURCE_PKG_DIR="${DIDKIT_WEB_DIR}/pkg"
TARGET_PKG_DIR="${ROOT_DIR}/packages/plugins/didkit/src/didkit/pkg"

if ! command -v wasm-pack >/dev/null 2>&1; then
    echo "wasm-pack is required to build DIDKit WASM" >&2
    exit 1
fi

if ! command -v wasm-opt >/dev/null 2>&1; then
    echo "wasm-opt is required to optimize DIDKit WASM" >&2
    exit 1
fi

if [ ! -d "${DIDKIT_WEB_DIR}" ]; then
    echo "Expected DIDKit web crate at ${DIDKIT_WEB_DIR}" >&2
    exit 1
fi

(
    cd "${DIDKIT_WEB_DIR}"
    wasm-pack build --target=web
    wasm-opt -Oz -o "${SOURCE_PKG_DIR}/tmp.wasm" "${SOURCE_PKG_DIR}/didkit_wasm_bg.wasm"
    mv "${SOURCE_PKG_DIR}/tmp.wasm" "${SOURCE_PKG_DIR}/didkit_wasm_bg.wasm"
)

mkdir -p "${TARGET_PKG_DIR}"

for file in didkit_wasm.d.ts didkit_wasm.js didkit_wasm_bg.wasm didkit_wasm_bg.wasm.d.ts; do
    cp "${SOURCE_PKG_DIR}/${file}" "${TARGET_PKG_DIR}/${file}"
done


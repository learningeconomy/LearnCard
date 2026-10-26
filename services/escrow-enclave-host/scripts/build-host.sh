#!/usr/bin/env bash
# Build the escrow-enclave-host release binary in the pinned Amazon Linux 2023
# (linux/amd64, glibc 2.34) image with the toolchain pinned in
# ../rust-toolchain.toml. Used verbatim by .github/workflows/escrow-enclave-eif.yml
# (`eif` job) and by operators building locally, so both run the same commands.
#
# Usage: build-host.sh --out <dir>
# Writes <dir>/escrow-enclave-host, <dir>/escrow-enclave-host.sha256 and
# <dir>/host-build.json (image/glibc/toolchain provenance + hostSha256).
#
# Notes:
# - Source is mounted read-only and copied to a fixed in-container path (/src)
#   so embedded paths do not depend on the caller's checkout location.
# - escrow-enclave-app is mounted because Cargo resolves the host's path
#   dev-dependency on it when loading Cargo.lock.
# - Never pipe `ldd --version` into `head` under pipefail: ldd keeps writing
#   after head exits, SIGPIPE kills it and the pipeline exits 141 (this broke
#   the 2026-10 manual build). glibc is read with `getconf GNU_LIBC_VERSION`.
set -euo pipefail

BASE_IMAGE='amazonlinux:2023@sha256:2851878b108218cccbe7af6ab7dfb87a5883a725623384e19e6256f4072027a3'
PLATFORM='linux/amd64'

out=''
while [[ $# -gt 0 ]]; do
    case "$1" in
        --out)
            out="$2"
            shift 2
            ;;
        *)
            echo "unknown argument: $1" >&2
            exit 2
            ;;
    esac
done
if [[ -z "$out" ]]; then
    echo "usage: $0 --out <dir>" >&2
    exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
services_dir="$(cd "${script_dir}/../.." && pwd)"
toolchain="$(sed -n 's/^channel *= *"\([^"]*\)".*/\1/p' "${services_dir}/escrow-enclave-host/rust-toolchain.toml")"
if [[ ! "$toolchain" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "could not read a pinned x.y.z toolchain from rust-toolchain.toml" >&2
    exit 1
fi

mkdir -p "$out"
out="$(cd "$out" && pwd)"

docker run --rm --platform "$PLATFORM" \
    -e "RUST_TOOLCHAIN=${toolchain}" \
    -e "BASE_IMAGE=${BASE_IMAGE}" \
    -v "${services_dir}/escrow-enclave-host:/ro/escrow-enclave-host:ro" \
    -v "${services_dir}/escrow-enclave-app:/ro/escrow-enclave-app:ro" \
    -v "${out}:/out" \
    "$BASE_IMAGE" \
    bash -euo pipefail -c '
        dnf install -y -q gcc tar gzip >/dev/null
        curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/rustup-init.sh
        sh /tmp/rustup-init.sh -y -q --profile minimal --default-toolchain "$RUST_TOOLCHAIN"
        . "$HOME/.cargo/env"
        mkdir -p /src
        cp -a /ro/escrow-enclave-host /ro/escrow-enclave-app /src/
        rm -rf /src/escrow-enclave-host/target /src/escrow-enclave-app/target
        cd /src/escrow-enclave-host
        CARGO_TARGET_DIR=/build/target cargo build --release --locked
        install -m 0755 /build/target/release/escrow-enclave-host /out/escrow-enclave-host
        cd /out
        sha256sum escrow-enclave-host >escrow-enclave-host.sha256
        host_sha="$(cut -d" " -f1 escrow-enclave-host.sha256)"
        glibc="$(getconf GNU_LIBC_VERSION)"
        rustc_v="$(rustc --version)"
        cargo_v="$(cargo --version)"
        printf "{\"baseImage\":\"%s\",\"platform\":\"linux/amd64\",\"glibc\":\"%s\",\"rustc\":\"%s\",\"cargo\":\"%s\",\"hostSha256\":\"%s\"}\n" \
            "$BASE_IMAGE" "$glibc" "$rustc_v" "$cargo_v" "$host_sha" >host-build.json
    '

cat "${out}/escrow-enclave-host.sha256"

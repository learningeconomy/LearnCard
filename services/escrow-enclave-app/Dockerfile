# syntax=docker/dockerfile:1
#
# services/escrow-enclave-app/Dockerfile — reproducible build for the Nitro
# Enclave image (plan P2.1).
#
# Two stages:
#   1. `builder` — fully static (musl + crt-static) release binary.
#   2. final    — `FROM scratch`: only the static binary + the CA root
#                 bundle the enclave needs to verify KMS's TLS certificate
#                 (notepad decisions.md D11: "enclave TLS verifies KMS certs
#                 against CA roots baked into the EIF").
#
# Build this via scripts/build-eif.sh, which sets SOURCE_DATE_EPOCH
# consistently and drives kaniko in --reproducible mode so two builds of the
# same commit produce byte-identical layers (a prerequisite for
# `nitro-cli build-enclave` to emit identical PCR0/1/2 — see this package's
# README "Reproducible build" section and P2.2). A plain `docker build .`
# still works for local iteration; SOURCE_DATE_EPOCH then defaults to 0 (the
# Unix epoch), per https://reproducible-builds.org/specs/source-date-epoch/.

# ---------------------------------------------------------------------------
# Builder base, pinned by digest — linux/amd64 platform manifest (not just
# the multi-arch index), resolved via:
#   docker buildx imagetools inspect docker.io/library/rust:1.93.0-alpine3.22
# on 2026-09-25 and cross-checked with `docker manifest inspect --verbose`:
#
#   rust:1.93.0-alpine3.22
#     multi-arch index digest:      sha256:efc08a6cc70a6ad8bdcf24176e3e0bdbbc7b984e7471fabf78b90de33b136f51
#     linux/amd64 manifest digest:  sha256:6ca5114023863359da03cec9dbe28fdd2c3de5596330e40daab0847d05ea8a1a  (pinned below)
#     base image:                   alpine:3.22 @ sha256:e0baf8c394150ac5a14925e179100519f5e37c53547f647acbd9f8eb3e5c4528
#
# Alpine/musl (not Debian/glibc) is chosen so the image's *native* host
# triple already IS x86_64-unknown-linux-musl: no cross C toolchain
# (x86_64-linux-musl-gcc) is needed for crates with native code
# (aws-lc-sys, ring, openssl-sys). Cross-compiling those from a glibc host
# is possible but materially more fragile — this exact gap (missing
# x86_64-linux-musl-gcc) is what blocked local verification of this
# Dockerfile's `cargo build` line on this macOS machine.
# See "Reproducible build" in README.md.
# ---------------------------------------------------------------------------
FROM rust:1.93.0-alpine3.22@sha256:6ca5114023863359da03cec9dbe28fdd2c3de5596330e40daab0847d05ea8a1a AS builder

# Reproducible-build timestamp. build-eif.sh always passes this explicitly
# (default: `git log -1 --format=%ct`). Defaults to the Unix epoch here so a
# standalone `docker build .` (no --build-arg) still works for iteration.
ARG SOURCE_DATE_EPOCH=0
ENV SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}

# --no-cache: don't persist the apk index as a layer (nothing to normalize
# later, and it wouldn't help reproducibility since the index itself carries
# no meaningful content-hash relevant to the final binary).
#
# NOTE on reproducibility limits: pinning the base image's digest pins
# Alpine's own filesystem, but `apk add` still resolves against the *live*
# v3.22 package repository. If any of these packages ever receive a
# security backport within the v3.22 branch, a rebuild months later could
# resolve a different package version than today's, changing PCR0/1/2 even
# though this Dockerfile is byte-identical. That is a real, currently open
# gap — see README "Reproducible build" → "What can still change PCR0/1/2".
# The P2.2 CI gate (build twice in the same run, diff PCR0) only proves
# same-day reproducibility; it does not by itself prove "rebuild from this
# tag next year matches." Pin exact `apk add pkg=version` strings if that
# stronger guarantee becomes a requirement.
#
# Packages:
#   build-base          — gcc/g++/make/musl-dev. This is the *only* system
#                          requirement for aws-lc-sys in its default
#                          (non-FIPS) configuration on
#                          x86_64-unknown-linux-musl: that target has
#                          pre-generated bindgen bindings, and the default
#                          build path is the `cc`-crate builder, not CMake
#                          (CMake/Go/Perl/bindgen are not invoked at all
#                          unless AWS_LC_SYS_CMAKE_BUILDER=1 or the `fips`
#                          feature is enabled — neither applies here). See
#                          https://aws.github.io/aws-lc-rs/platform_support.html.
#   linux-headers       — musl-dev alone does not ship Linux uapi headers;
#                          AWS-LC's crypto/rand_extra/urandom.c requires
#                          <linux/random.h> (aws/aws-lc-rs#894).
#   openssl-dev,
#   openssl-libs-static,
#   pkgconfig           — the `nitro` feature pulls in
#                          aws-nitro-enclaves-cose, whose default COSE
#                          backend is openssl-sys (see this crate's own
#                          README, "NSM attestation primitives"). openssl-sys
#                          discovers a system OpenSSL via pkg-config;
#                          OPENSSL_STATIC=1 below selects the .a archives
#                          (from openssl-libs-static) so the final binary
#                          has no libssl.so/libcrypto.so dependency, matching
#                          the fully-static FROM-scratch runtime stage.
#   ca-certificates     — provides /etc/ssl/certs/ca-certificates.crt,
#                          copied into the runtime stage per decision D11.
RUN apk add --no-cache \
        build-base \
        linux-headers \
        openssl-dev \
        openssl-libs-static \
        pkgconfig \
        ca-certificates

WORKDIR /build

# rust-toolchain.toml pins channel 1.93.0 + rustfmt/clippy +
# x86_64-unknown-linux-musl. Because this image's own default toolchain is
# already exactly 1.93.0 with musl as its *host* triple, rustup does not
# need to fetch a separate cross target for this — components resolve
# against what's already the host, so the first `cargo`/`rustup` invocation
# below does not require fetching a new target (a real network dependency
# for anything it DOES still need, e.g. rustfmt/clippy if not already
# bundled in this image's default profile).
COPY rust-toolchain.toml ./

# Manifests copied separately from src/ purely for Docker layer caching
# (dependency compilation cached independently of app-code changes). This
# has NO effect on reproducibility: kaniko --reproducible / buildx
# rewrite-timestamp normalize final layer timestamps regardless of how many
# layers or cache boundaries were used to get there.
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Fully static release build.
#
# RUSTFLAGS / CARGO_INCREMENTAL exactly as specified by plan task P2.1:
#   -C target-feature=+crt-static   — no dynamic linker at all (required for
#                                      the FROM-scratch runtime stage).
#   --remap-path-prefix=$HOME=/     — $HOME and $PWD are expanded by THIS
#   --remap-path-prefix=$PWD=/build   shell (ash), not by Docker's ARG/ENV
#                                      substitution, since HOME/PWD are not
#                                      Dockerfile-declared ARG/ENV values.
#                                      At this point HOME=/root (root user,
#                                      Alpine default) and PWD=/build (the
#                                      WORKDIR set above), so this resolves
#                                      to `--remap-path-prefix=/root=/
#                                      --remap-path-prefix=/build=/build`.
#   -C codegen-units=1               — also set via CARGO_PROFILE_RELEASE_*
#                                      below; rustc accepts the duplicate
#                                      (last -C wins, same value either way)
#                                      — kept per the task's exact spec.
#
# CAVEAT for the CI/security reviewer (documented, not silently assumed
# fixed): the official Rust image sets CARGO_HOME=/usr/local/cargo and
# RUSTUP_HOME=/usr/local/rustup, NEITHER of which is under $HOME=/root. So
# crates.io registry source paths (e.g.
# /usr/local/cargo/registry/src/index.crates.io-*/aws-lc-sys-0.45.0/...)
# are NOT covered by --remap-path-prefix=$HOME=/ as literally specified.
# Two extra remaps are added below (not required by the task, added for
# real completeness) to also scrub CARGO_HOME/RUSTUP_HOME. P2.2 should add a
# smoke test that greps the final stripped binary for `/root`,
# `/usr/local/cargo`, and `/build` and fails the build if any are found —
# this Dockerfile does not itself verify that zero host paths leaked into
# the binary's remaining strings (panic messages, `Location::caller()`
# data, etc.), only that it *attempts* to scrub the common ones.
#
# [profile.release] settings: Cargo.toml (as of this task) has no
# `[profile.release]` section at all, so per task P2.1 instructions these
# are passed via CARGO_PROFILE_RELEASE_* env instead of editing Cargo.toml
# (which is out of scope / owned by a concurrently-working agent):
#   LTO=true        — fat LTO + codegen-units=1 is the standard
#                      maximally-deterministic (least codegen parallelism)
#                      release configuration.
#   STRIP=symbols   — no symbol table / debug info shipped in the enclave
#                      binary (smaller attack surface, fewer residual
#                      absolute-path strings from DWARF).
#   DEBUG=false     — no debug info generated at all (belt-and-suspenders
#                      with STRIP=symbols, also faster to build).
#   PANIC=abort     — deliberate security choice, not just a build nicety:
#                      an enclave that hits an internal panic should
#                      terminate immediately (fail closed) rather than
#                      attempt to unwind into a possibly-inconsistent
#                      state. NOTE for P1.7/P1.8 authors: this means
#                      `catch_unwind`-based "isolate one request's panic,
#                      keep the process alive" patterns will NOT work in
#                      this release binary — a panic in any single
#                      connection handler kills the whole enclave process.
#                      If that turns out to be undesirable once server.rs
#                      exists, revisit this choice explicitly; don't let it
#                      silently constrain P1.8's design.
RUN set -eux; \
    export RUSTFLAGS="-C target-feature=+crt-static --remap-path-prefix=$HOME=/ --remap-path-prefix=$PWD=/build --remap-path-prefix=${CARGO_HOME}=/cargo --remap-path-prefix=${RUSTUP_HOME}=/rustup -C codegen-units=1"; \
    export CARGO_INCREMENTAL=0; \
    export CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1; \
    export CARGO_PROFILE_RELEASE_LTO=true; \
    export CARGO_PROFILE_RELEASE_STRIP=symbols; \
    export CARGO_PROFILE_RELEASE_DEBUG=false; \
    export CARGO_PROFILE_RELEASE_PANIC=abort; \
    export OPENSSL_STATIC=1; \
    cargo build --release --locked --target x86_64-unknown-linux-musl --features nitro,kms

# Normalize the mtime of everything we're about to ship, explicitly, rather
# than relying solely on the builder (kaniko --reproducible / buildx
# rewrite-timestamp) to catch it. This is belt-and-suspenders: kaniko's
# --reproducible flag has a known open gap where copied/generated file
# mtimes are not always fully normalized
# (github.com/GoogleContainerTools/kaniko/issues/2304). Normalizing here
# means PCR0 reproducibility does not depend on that flag working perfectly.
RUN touch -d "@${SOURCE_DATE_EPOCH}" \
        /build/target/x86_64-unknown-linux-musl/release/escrow-enclave \
        /etc/ssl/certs/ca-certificates.crt

# ---------------------------------------------------------------------------
# Runtime stage: FROM scratch. No shell, no package manager, no libc (the
# binary above is fully static). Only the binary and the CA roots needed to
# verify KMS's TLS certificate (decisions.md D11) are present.
#
# Fixed non-root UID/GID (65532, the common "nonroot" convention — e.g.
# distroless's default) via --chown, per task P2.1's "Deterministic: ...
# --chown fixed uid" requirement. `USER 65532:65532` works even without an
# /etc/passwd entry (the kernel enforces numeric UIDs regardless of name
# resolution). UNVERIFIED on this machine (no nitro-cli / no real EIF
# launch available): whether /dev/nsm and the enclave's vsock socket are
# accessible to a non-root UID inside an actual running Nitro Enclave. Flag
# this for P3/CI verification — if /dev/nsm turns out to be root-only
# inside the EIF's minimal init environment, this will need `USER 0:0`
# instead, which would need to be revisited deliberately, not silently.
# ---------------------------------------------------------------------------
FROM scratch

COPY --from=builder --chown=65532:65532 --chmod=0555 \
    /build/target/x86_64-unknown-linux-musl/release/escrow-enclave \
    /escrow-enclave
COPY --from=builder --chown=65532:65532 --chmod=0444 \
    /etc/ssl/certs/ca-certificates.crt \
    /etc/ssl/certs/ca-certificates.crt

# Smithy's current hyper 1 / rustls 0.23 / AWS-LC client loads native roots via
# rustls-native-certs, which honors SSL_CERT_FILE (no bundled webpki-roots).
# This measured Alpine CA bundle remains the KMS trust store, per D11.
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

USER 65532:65532

ENTRYPOINT ["/escrow-enclave"]

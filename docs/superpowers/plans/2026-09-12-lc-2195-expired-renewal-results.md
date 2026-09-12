# LC-2195 results: expired credential-JWT renewal across SSI, DIDKit and LearnCard

Date: 2026-09-12
Ticket: LC-2195
Branch: `codex/lc-2195-expired-renewal`
Worktree: `/Users/donny/.claude/dispatch/worktrees/2026-09-12-lc-2195-expired-renewal`
Base: `6fb84aba26561e41524f13e9be94312d6ca716d0` (verified ancestor of `HEAD`)
Implementation commit: `cb7f93fe2e2a6382beb296fcbe6ae345d26f5dd0`

This report is the continuation result report requested after Tasks 1-4. The
four historical reports (`2026-09-12-lc-2195-task-{1,2,3,4}-results.md`) are
preserved unchanged; this document records what changed once the approved
DIDKit/SSI fork work was performed.

## Status

Complete locally. The three-repo change, the rebuilt WASM and native artifacts,
and the real-token verification matrix all pass in this environment. Two
capabilities remain **unverified** and are called out as blockers rather than
success: the rebuilt WASM asset is not yet published to the hosted
content-addressed URL, and the SSI/DIDKit fork commits are local-only (unpushed),
so the updated LearnCard gitlinks are not remotely reproducible yet. No remote
write, publish or merge was performed.

## Repository isolation and SHAs

```
$ git rev-parse --show-toplevel
/Users/donny/.claude/dispatch/worktrees/2026-09-12-lc-2195-expired-renewal
$ git rev-parse --abbrev-ref HEAD
codex/lc-2195-expired-renewal
$ git merge-base --is-ancestor 6fb84aba26561e41524f13e9be94312d6ca716d0 HEAD && echo ANCESTOR_OK
ANCESTOR_OK
```

| Repo | Path | Branch | Base | Commit |
| --- | --- | --- | --- | --- |
| SSI | `/Users/donny/Work/lc-2195-forks/ssi` | `codex/lc-2195-expired-jwt-renewal` | `9e2783f9f759fc92617f6c27b1c77ec0599cf9a0` | `9a4acff913370dbc0f7f796238d6b88731263bc1` |
| DIDKit | `/Users/donny/Work/lc-2195-forks/didkit` | `codex/lc-2195-expired-jwt-renewal` | `ef269cc5cf74ec5587e544e8984d6e37d8e77f88` | `20a0c43336172dc374ea2e3470e9e9418b1638f5` |
| LearnCard | this worktree | `codex/lc-2195-expired-renewal` | `6fb84aba26561e41524f13e9be94312d6ca716d0` | `cb7f93fe2e2a6382beb296fcbe6ae345d26f5dd0` |

The standalone fork clones were clean at the expected base before writing. The
LearnCard worktree fetched the local fork branches into `lib/didkit` and
`lib/ssi`, checked them out, and committed the new gitlinks. Origin URLs were
not changed and no remote ref was published. Future publication order is
**SSI → DIDKit → LearnCard**.

## Delivered contract

### SSI (`ssi-vc`, `ssi-ldp`)

- New `JwtTemporalPolicy { Strict (default), AllowExpiredForRenewal }` and a
  private `JwtMatch { NoMatch, Match, ExpiredRenewal }`.
- `Credential::verify_jwt` / `decode_verify_jwt` keep their exact signatures and
  strict behavior by delegating to a policy-threaded internal decode with
  `Strict`.
- New credential-only `Credential::verify_jwt_renewal` /
  `decode_verify_jwt_renewal`. They reuse the existing decode/`validate_unsigned`
  / `filter_proofs` / `resolve_key` / `verify_bytes_warnable` path. `nbf`, the
  JWS signature, issuer-authorized `kid`, proof purpose, nonce, audience,
  malformed claims and unsupported algorithms are all still enforced; only an
  already-expired `exp` is tolerated.
- A successful renewal-only result additionally carries the new
  `Check::JwsRenewalExpired` (serialized `JWSRenewalExpired`) alongside `JWS`,
  so renewal-only validity is distinguishable from ordinary validity.
- The renewal decode path never falls back to an embedded linked-data proof: if
  no JWS matches it returns an error instead of authenticating token claims via
  an LDP proof.
- `Presentation::filter_proofs` always passes `Strict` and maps the match back
  to a boolean; presentation verification is unchanged.
- Added `decode_verify_jwt_renewal_only` unit test (expired accepted only in
  renewal mode and marked; valid token not marked; future `nbf` rejected; forged
  signature rejected). `cargo fmt` clean for both crates.

### DIDKit

- `JWTOrLDPOptions` gains a default-off `allow_expired_credential:
  Option<bool>` (`allowExpiredCredential`) with a convenience accessor. Existing
  callers and `default_for_vp()` are unchanged.
- `lib/web` (the WASM) and `lib/http` honor it only for `proofFormat: 'jwt'`
  credentials by calling `VerifiableCredential::verify_jwt_renewal`.
- The option is rejected (new `Error::CredentialRenewalUnsupported`) for
  linked-data-proof credentials and for presentation verification instead of
  being silently ignored.
- Unit tests cover defaults, deserialization of the opt-in and that typos
  remain errors. `didkit` lib tests and `didkit-http` compile pass.

### LearnCard

- `DidkitPluginMethods` gains `verifyCredentialForRenewal`; both the WASM
  (`didkit-plugin`) and native (`didkit-plugin-node`) wrappers implement it and
  force `proofFormat: 'jwt'` + `allowExpiredCredential: true`.
- Ordinary `verifyCredential` builds its forwarded options through a
  `strictProofOptions` helper that deletes any caller-supplied
  `allowExpiredCredential`, so an untyped caller cannot weaken it.
- The native addon `verify_presentation` and the LDP credential path reject the
  option, mirroring the WASM behavior.
- `verifyCredentialJwt`:
  - success now requires a `JWS` check (`proof` alone no longer authenticates
    token claims);
  - accepts a typed `policy: 'allow-expired-for-renewal'`, which is the only
    way to reach the dedicated renewal method;
  - strips `allowExpiredCredential` from caller `proofOptions` before forwarding.
- `refreshCredential` verifies the held credential with
  `policy: 'allow-expired-for-renewal'` and the candidate strictly, so an
  expired held token can discover and fetch a valid replacement while expired or
  future replacements, a future-`nbf` held token and rollbacks still fail closed.
  The held identity/freshness and endpoint selection remain derived from the
  verified token, never display metadata.
- Existing expired-JWT expectations updated: the former "expired held fails
  closed (pinned-verifier blocker)" test now asserts a successful
  `text/plain` renewal, plus a new future-`nbf` rejection test.

## Build and artifact evidence

```
$ PATH="/Users/donny/.cargo/bin:$PATH" bash packages/plugins/didkit/scripts/build-wasm-from-submodules.sh
EXIT=0        (wasm-pack + wasm-opt -Oz from the pinned didkit-wasm.Cargo.lock)
$ node packages/plugins/didkit/scripts/set-default-wasm-url.mjs "https://assets.learncard.ai/didkit/sha256-3e066dd9.../didkit_wasm_bg.wasm"
$ node packages/plugins/didkit/scripts/check-wasm-url.mjs
DIDKit WASM matches the default init() URL (sha256 3e066dd9...)
$ node packages/plugins/didkit/scripts/check-wasm-numeric-status.mjs
DIDKit WASM accepts numeric Bitstring Status List indexes.
$ BUILD_DIDKIT_NAPI=1 bunx nx run didkit-plugin-node:build --skip-nx-cache
EXIT=0        (cold cargo build 5m48s + tsc)
$ bunx nx run didkit-plugin:build --skip-nx-cache    EXIT=0
$ bunx nx run vc-plugin:build --skip-nx-cache        EXIT=0
$ bunx nx run helpers:build --skip-nx-cache          EXIT=0
```

Artifact hashes (archived, see below):

| Artifact | SHA-256 |
| --- | --- |
| `didkit_wasm_bg.wasm` (pkg + bridge copy) | `3e066dd9865e8434622aa0f6a779ce01a6d794c0db48e291599eee1e5ba20c2a` |
| `index.darwin-arm64.node` (macOS arm64) | `6b1525d335f03ca1a70ed50bfea2bef142f4b8873c1d285085078ff1ce95cef7` |

The bridge integrity pin in `packages/learn-card-bridge-http/scripts/sync-didkit.ts`
and `DEFAULT_DIDKIT_WASM_URL` were regenerated to the true hash of the new
binary. The default URL is now
`https://assets.learncard.ai/didkit/sha256-3e066dd9.../didkit_wasm_bg.wasm`.

## Commands, outcomes and counts

All commands run from this worktree unless noted.

| Command | Outcome |
| --- | --- |
| `cargo test -p ssi-vc --lib` (SSI fork) | **44 passed / 0 failed** |
| `cargo test -p didkit --lib` (DIDKit fork) | **5 passed / 0 failed** |
| `cargo check -p didkit-http` (DIDKit fork) | exit 0 |
| `bunx vitest run` (vc plugin) | 4 files, **136 passed / 0 failed** |
| `bunx vitest run` (didkit plugin) | 1 file, **16 passed / 0 failed** |
| `bunx vitest run` (learn-card-helpers) | 6 files, **109 passed / 0 failed** |
| `bunx vitest run` (learn-card-base) | 70 files, **735 passed / 0 failed** |
| `node test-jwt-verify.mjs` (fresh native addon) | **17/17 checks** |
| `node test-native-refresh.mjs` (fresh native addon) | **2/2 checks** (expired-held → HTTP → replacement) |
| `node scripts/test-vc-jwt-artifacts.mjs` | **42/42 checks** (production exports + real Chrome WASM + native) |
| `cargo fmt --check` (changed crates) | clean (DIDKit has one pre-existing `ssh_agent.rs` diff, untouched) |
| `bunx prettier --check <changed files>` | clean |
| `bun scripts/lint-workspace.ts --files <changed files>` | exit 0 |

### Real-token acceptance matrix

| LC-2195 requirement | Evidence | Status |
| --- | --- | --- |
| Valid expired did:key Ed25519 VC-JWT: normal browser/WASM and native reject; renewal-only confirms; standard `text/plain` refresh succeeds | Browser harness (strict reject, `JWS`+`JWSRenewalExpired`, expired held → replacement); native 17 + 2 checks; vc `refreshCredential.test.ts` | pass |
| Forged signature/payload, wrong signer/issuer, conflicting identity, malformed NumericDates, unsupported alg reject before any request | Task 1/2/3 suites retained; SSI forged-signature renewal test; `refreshCredential` forged/expired held zero-fetch tests; `alg: none`/HS256/browser matrix | pass |
| Future `nbf` rejects in renewal mode; expired/future replacement rejects even when held renewal allowed; older replacement rejects rollback | SSI `decode_verify_jwt_renewal_only` future-nbf case; vc plugin future-nbf held, expired replacement and rollback tests; browser/native renewal checks | pass |
| Presentation strict when renewal policy offered; JSON verification and managed encrypted holder auth regressions pass | DIDKit presentation rejection test (WASM + native); LDP rejection; vc `refreshCredential.test.ts` (94) and learn-card-base (735) managed/encrypted suites | pass |
| Repeated verify/store/read/export/refresh preserves exact compact bytes and ignores caller-modified display identity/endpoints | Task 2/3 round-trip tests; browser export + second refresh + display mutation tests | pass |
| Force embedded-proof fallback; valid inner LDP must not authenticate invalid/unmatched outer JWS | Real signed inner LDP verified by the pinned WASM; `verifyCredentialJwt` now requires `JWS` and rejects the proof-only result. The DIDKit plugin forwards an empty context map for compact JWT strings, so the pinned verifier currently throws instead of returning a proof-only success on that path; the regression drives the wrapper with the genuinely WASM-verified proof-only check. The SSI renewal decode path additionally refuses the LDP fallback outright. | pass |
| Real browser and freshly rebuilt native exercise expired-held → HTTP response → valid replacement | Browser harness expired-held case; `test-native-refresh.mjs` through the real VC-plugin `refreshCredential` + loopback `text/plain` server | pass |
| Package exports load the new artifacts | Harness Phase 1 production-condition require/import of `didkit-plugin-node`, `vc-plugin`, `didkit-plugin`; built WASM present | pass |

## Artifacts preserved

Archived under `/Users/donny/Work/lc-2195-renewal-artifacts` (the dispatcher
deletes its checkout, so nothing here relies on untracked files):

- `didkit-wasm-pkg/` — rebuilt `didkit_wasm_bg.wasm`, glue, `.d.ts`, and the
  bridge copy.
- `native/index.darwin-arm64.node` — freshly built macOS arm64 addon.
- `artifact-sha256.txt` — artifact hashes.
- `build-wasm.log`, `build-native.log`, `build-ts.log`, `build-didkit-plugin.log`,
  `build-vc.log` — build logs.
- `test-ssi-rust.log`, `test-didkit-rust.log`, `test-vc-plugin.log`,
  `test-didkit-plugin.log`, `test-learn-card-base.log`, `test-native-jwt.log`,
  `test-native-refresh.log`, `test-artifacts-harness.log`, `lint.log` — test and
  lint evidence.

## Blockers and limitations (not claimed as success)

1. **WASM hosted asset not published.** `DEFAULT_DIDKIT_WASM_URL` points at the
   true content-addressed URL for the new binary, but that object does not exist
   at `assets.learncard.ai` yet. Consumers that call `initLearnCard()` without
   supplying their own `didkit` input will fail to fetch it until the asset is
   uploaded. The local package bundles the correct binary and the bridge
   integrity pin matches it.
2. **Fork commits are local-only.** SSI `9a4acff9` and DIDKit `20a0c433` are
   unpushed, so the `lib/didkit` / `lib/ssi` gitlinks are not remotely
   reproducible. Publication order is SSI, then DIDKit, then LearnCard. No push
   was performed.
3. **Cross-platform native prebuilds not run.** Only the macOS arm64 addon was
   built and exercised locally; the CI matrix jobs were not executed here.
4. **Dockerized e2e not run.** `tests/e2e/tests/credential-refresh.spec.ts`
   requires live brain-service (localhost:4000) and lca-api (localhost:5200),
   which were not available.
5. **SSI integration test harness not run.** `ssi-vc/tests/di.rs` cannot compile
   in the standalone clone because the `tests/vc-di-ecdsa` test-vector fixtures
   are not present; the `ssi-vc` lib tests (44) were run instead.
6. **C/JNI DIDKit entry points** parse `JWTOrLDPOptions` but intentionally do not
   honor `allowExpiredCredential`; they remain strict. The WASM, HTTP and
   LearnCard native surfaces enforce the new behavior and the rejection rules.
7. VCDM 2.0 remains the legacy JOSE `vc`-claim wrapping profile only
   (`vc-jwt-2.0-legacy`); SD-JWT, general VC-JOSE-COSE and managed version-store
   redesign remain out of scope.

## Changed files (this continuation)

- `lib/didkit`, `lib/ssi` — gitlinks to the local fork commits.
- SSI fork: `ssi-ldp/src/proof.rs`, `ssi-vc/src/lib.rs`.
- DIDKit fork: `lib/src/lib.rs`, `lib/src/error.rs`, `lib/web/src/lib.rs`,
  `http/src/credentials.rs`, `http/src/presentations.rs`.
- LearnCard: `packages/plugins/didkit-plugin-node/native/src/lib.rs`,
  `packages/plugins/didkit-plugin-node/src/plugin.ts`,
  `packages/plugins/didkit-plugin-node/test-jwt-verify.mjs`,
  `packages/plugins/didkit-plugin-node/test-native-refresh.mjs` (new),
  `packages/plugins/didkit/src/{plugin,types,jwt-verify.test}.ts`,
  `packages/plugins/vc/src/{index,types,refreshCredential,verifyCredentialJwt}.ts`
  and their tests, `scripts/test-vc-jwt-artifacts.mjs`,
  `scripts/vc-jwt-browser-entry.ts`.
- Generated: `packages/plugins/didkit/src/didkit/{index.ts,pkg/*}`,
  `packages/learn-card-bridge-http/src/didkit_wasm_bg.wasm`,
  `packages/learn-card-bridge-http/scripts/sync-didkit.ts`.
- Docs/release: `docs/core-concepts/credential-refresh.md`,
  `docs/how-to-guides/issue-and-refresh-a-managed-credential.md`, the three
  plugin READMEs, `.changeset/lc-2195-vc-jwt.md`.

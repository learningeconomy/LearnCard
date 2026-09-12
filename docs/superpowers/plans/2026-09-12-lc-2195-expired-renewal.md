# LC-2195: expired credential-JWT renewal across SSI, DIDKit and LearnCard

Continue the approved LC-2195 implementation. User explicitly authorized the DIDKit/SSI change and isolated repo branches after the four initial DeepSeek tasks. Execute using deepseek-v4-flash.

## Repositories and isolation

- LearnCard task branch starts at 6fb84aba26561e41524f13e9be94312d6ca716d0. The original checkout /Users/donny/Work/LearnCard and its .qa/ and .credential-refresh-qa/ are private and untouchable.
- Standalone SSI clone: /Users/donny/Work/lc-2195-forks/ssi, checked-out branch codex/lc-2195-expired-jwt-renewal, base 9e2783f9f759fc92617f6c27b1c77ec0599cf9a0.
- Standalone DIDKit clone: /Users/donny/Work/lc-2195-forks/didkit, checked-out branch codex/lc-2195-expired-jwt-renewal, base ef269cc5cf74ec5587e544e8984d6e37d8e77f88.
- These two explicit standalone clones are in scope for Rust changes and commits. Edit and commit Rust there so the dispatcher cleanup cannot destroy nested-repo objects.
- Initialize lib/didkit and lib/ssi in your temporary LearnCard worktree, fetch the LOCAL fork clone branches, and check out their commits for integration. Do not change origin URLs or publish remote refs. Do not use file-protocol overrides globally.
- Before writing, confirm exact worktree path /Users/donny/.claude/dispatch/worktrees/2026-09-12-lc-2195-expired-renewal and branch codex/lc-2195-expired-renewal. Stop on dispatcher fallback. Confirm clean fork branches and expected base ancestry.
- Do not push to GitHub, publish packages/S3 assets, merge main, mutate other tasks or clean private QA data. Commit scoped changes in all three repos. Read applicable AGENTS.md. Use apply_patch for edits.
- The dispatcher deletes its checkout at completion. Preserve build evidence and local generated artifacts needed to review in /Users/donny/Work/lc-2195-renewal-artifacts before finishing. Do not rely on untracked reports surviving.
- Use bun install --frozen-lockfile locally; no shared node_modules symlinks. Normal reusable Rust caches are fine.

## Findings to build on

Read docs/superpowers/plans/2026-09-12-lc-2195-task-{1,2,3,4}-results.md and the implementation.
SSI ssi-vc/src/lib.rs:
- Credential::verify_jwt -> decode_verify_jwt -> Credential::filter_proofs -> jwt_matches.
- jwt_matches (~2368) enforces nbf and exp, plus kid/allowed issuer VMs, challenge, audience and proof purpose.
- jwt_matches is also used by Presentation::filter_proofs. Do not weaken presentation verification.
- decode_verify_jwt may fall back to embedded LDP proofs when the JWS does not match. A successful embedded proof is NOT evidence that the compact token signature verified. JWT normalization must require JWS success, never accept proof-only success as authenticating token claims.
DIDKit lib/web/src/lib.rs (~461) routes credential JWT via VerifiableCredential::verify_jwt; lib/src/lib.rs owns JWTOrLDPOptions.
LearnCard native/src/lib.rs mirrors that dispatch. verifyCredentialJwt.ts performs claim reconciliation and refreshCredential.ts verifyToView verifies held and replacement via the same function.
Existing failure: expired compact held tokens fail before renewal. No cryptographic replacement is required.

## Implementation contract

1. SSI: add a credential-only renewal verification API/policy with STRICT default, allowing expiration only for a held credential. Reuse the existing decode/validate/signature/issuer-authorized-key path. Thread policy explicitly into internal filtering. Existing public verify_jwt/decode_verify_jwt and presentation verification remain strict. Keep nbf, exp NumericDate validation, malformed claims, proof purpose, nonce, aud, key authorization and unsupported algorithm checks. Never fake time, strip claims, filter error strings, mutate signed payloads or return trusted decode-only data.
   Prefer a dedicated credential method or explicit credential policy rather than adding a broad skipTemporal boolean to LinkedDataProofOptions. If returning a successful renewal verification, clearly distinguish renewal-only validity from ordinary credential validity in the API/documentation.
2. DIDKit: expose that opt-in only for credential JWT verification through an explicit option or dedicated export. Preserve normal default behavior and existing signatures where feasible. Reject the option for presentation or JSON paths rather than silently weakening them. Keep the change minimal and test deserialization/defaults.
3. LearnCard: add matching WASM/native wrapper parity. Only held-credential verification in refresh uses renewal mode; replacement and ordinary verifyCredential stay strict even if untyped callers pass the low-level opt-in. Authoritative claims remain derived from the signed token. Retain identity, SSRF/redirect/body/time guards, managed authentication/encryption, standard ID-less JSON, stable managed IDs and rollback behavior.
4. Fix the proof-only fallback acceptance in verifyCredentialJwt: compact JWT success must include JWS verification, not merely a linked-data proof. Add a real signed inner-VC / invalid outer-JWT regression to exercise the fork fallback if reachable.
5. Commit fork source changes in each standalone clone before updating LearnCard gitlinks. Fetch local commits into integration submodules. Record all three SHAs, base branches and future publication order; unpushed gitlinks are explicitly not remotely reproducible yet.
6. Rebuild actual WASM using packages/plugins/didkit/scripts/build-wasm-from-submodules.sh and its pinned build graph, then native using existing build scripts. Inspect WASM hosted URL/integrity/publication gates: do not point a new binary at an old hosted URL or fake a hash. Complete local artifacts and document any publication gate awaiting remote publication. Do not silently claim release readiness.
7. Update docs, existing expired-JWT test expectations, changeset and result report. Historical reports should be preserved with a new update/result report, not rewritten as if prior tests succeeded.

## Required real-token verification

- Same valid expired did:key Ed25519 VC-JWT: normal browser/WASM and native verification reject; renewal-only verification confirms signed token; standard text/plain refresh to valid newer candidate succeeds.
- Expired token with forged signature/payload, wrong signer/issuer, conflicting registered/embedded identity, malformed NumericDates or unsupported alg rejects before ANY request.
- Future nbf rejects in renewal mode. Expired/future replacement rejects even when held renewal is allowed. Older replacement rejects rollback.
- Presentation verification remains strict when offered renewal policy; JSON verification and managed encrypted holder auth regressions pass.
- Repeated verify/store/read/export/refresh preserves exact compact bytes and ignores caller-modified display identity/endpoints.
- Force the embedded-proof fallback case and prove a valid inner LDP does not authenticate an invalid/unmatched outer JWS.
- Real browser and freshly rebuilt native artifacts must exercise expired-held -> HTTP response -> valid replacement, not just low-level native verification.
- Run SSI focused Rust tests, DIDKit affected tests, native tests, affected VC/helper tests, and scripts/test-vc-jwt-artifacts.mjs. Package exports must load the new artifacts. Record commands/counts and artifact hashes. Cross-platform CI and Docker E2E remain explicitly unverified unless actually run.

## Completion

Commit all scoped changes and docs/superpowers/plans/2026-09-12-lc-2195-expired-renewal-results.md. Include acceptance matrix, exact commands/results, standalone repo branches/SHAs and LearnCard commit, artifact archive paths, remaining blockers. Do not mark missing rebuild or real-browser/native renewal proof as success. No remote writes/publication. If blocked, preserve commits and artifacts, state the exact blocker, and stop without weakening the requirement.


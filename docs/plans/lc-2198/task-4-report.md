# Task 4 Report — LC-2198: Executable guide, end-to-end proof, and release notes

**Status: COMPLETE** (not BLOCKED; 10 pre-existing `unified-send.spec.ts` failures documented below reproduce identically on the pristine baseline and are unrelated to this task)

- **Branch:** `codex/lc-2198-refresh-send-task-4` (worktree `~/.claude/dispatch/worktrees/2026-09-16-lc-2198-refresh-send-task-4`)
- **Baseline verified:** `git merge-base --is-ancestor 6cc28b6f9 HEAD` → OK; Task 1 (`d6ef98765`, `d2f627a31`), Task 2 (`18ea54ecb`), Task 3 (`189dc46a3`, `7e62b82c7`) all ancestors via the dependency merge.
- **Code commit:** `c0a7dd68d` — "LC-2198: executable guide and real lifecycle coverage for refreshable sends (task 4/5)"
- **Report commit:** see git log (`docs/plans/` is gitignored; only this file was force-added).

## What was delivered

### 1. Docs snippets rewritten around unified send (R1/R2/R6)

| File | Change |
| --- | --- |
| `docs/snippets/refresh/issue-refreshable.mjs` | Rewritten to lead with `send({ type: 'boost', recipient, template: { credential, name, category }, refresh: true })`. The template is an ordinary OBv3 credential — **no hand-copied managed JSON-LD context, no manual allocation, no manual credential ID/issuer dance**. The script persists the returned receipt (`refreshId`, `refreshService`, `credentialId`, `issuerDid`, `holderDid`, `credentialStatus`) plus `credentialUri`/`activityId`/boost URI to `refresh.json`. No holder credentials are used anywhere. |
| `docs/snippets/refresh/publish-update.mjs` | Rebuilds the complete update from the issuer's own claims **plus the receipt only** (same id, issuer, subject, refreshService, credentialStatus; newer `validFrom`), signs via `issueCredential` (context injected automatically) and publishes `mode: 'issuer-signed'` with `idempotencyKey`. |
| `docs/snippets/refresh/refresh-held.mjs` | Inspected; **unchanged** — the holder-side primitive flow is unaffected by LC-2198 sends. |

### 2. Guides updated (R6)

| File | Change |
| --- | --- |
| `docs/how-to-guides/issue-and-refresh-a-managed-credential.md` | Mermaid sequence now leads with `send({ refresh: true })` (allocation/signing/storage shown underneath). Section 1 rewritten around the one-call flow; receipt fields documented (metadata only, never claims; network/issuer cannot read the credential back). **Obsolete `sendBoost` warning hint removed** (the one claiming sendBoost can't publish). New `sendBoost` subsection shows the literal `{ enableRefresh: true }` → `{ credentialUri, refresh }` opt-in result, the unchanged string return for legacy callers, and the profile/DID-recipient + feature-flag + `credentials:write` requirements. New "The lower-level path" section retains explicit allocate → issue → `sendRefreshableCredential` as an advanced alternative and shows that `issueCredential` injects the inline context automatically, plus the pre-signed `send({ …, signedCredential, refresh: true })` handoff rule (server never adds refresh to an already-signed credential). **Context-copy troubleshooting row removed.** |
| `docs/how-to-guides/send-credentials.md` | `send()` one-liner picture gains `refresh: true`; "What comes back" documents the optional `refresh` receipt field-by-field; cross-links to the how-to. |
| `docs/core-concepts/credential-refresh.md` | Explains that the managed terms' JSON-LD context is injected automatically by the SDK at signing (and by the network for SA signing/publication); lifecycle step 1 rewritten around `send({ refresh: true })` + the receipt; step 3 describes receipt-driven rebuild invariants. |

### 3. Real lifecycle coverage (R1–R5)

| File | Change |
| --- | --- |
| `tests/e2e/tests/refresh-send.spec.ts` | **New: 13 tests (20 assertions slots incl. `test.each` × 4 context shapes), all passing twice consecutively.** Coverage: (1) SDK `send` templateUri full lifecycle — receipt shape, holder-only storage (`issuer.read.get` → undefined, `holder.read.get` → plaintext), boost membership via `getBoostRecipients`, activity chain `DELIVERED`→`CLAIMED` on the send's real `activityId`, signed v1 carries the service + exactly one managed context fragment, verifyCredential clean, v2 published from receipt only, holder refreshes to version 2 with stable id/issuer/service/status, recheck `unchanged`; (2) inline template — one boost created from the template, full lifecycle; (3) local DID recipient — `receipt.holderDid` = recipient DID; (4) email/phone/remote-DID rejections with no issuer writes; (5) pre-signed handoff (decision 6) at both SDK and HTTP layers — SDK handoff accepted, exact-same HTTP request idempotent (same `credentialUri` + `activityId`), service-less signed credential rejected (`/managed refresh service/i`); (6) self-send works and suppresses the initial `CREDENTIAL_RECEIVED` notification; (7) `sendBoost({ enableRefresh: true })` opt-in result + lifecycle + legacy string compatibility; (8) **authenticated HTTP `POST /api/send` with a real primary signing authority** — receipt `issuerDid` = the issuer profile's network DID, SA-fragment verification method on the proof, SA-mode publication from an unsigned rebuild (network injects the context), holder refresh to v2 with v2 verifyCredential clean; (9) HTTP `credentials:write` scope enforcement (401 without it, non-refresh send still 200 with the same token), email rejected 400 at the REST boundary; (10–13) **automatic-context proof with real signing for VC 1.1, VC 2.0, OBv3 (3.0.3 context), CLR 2.0** — one managed fragment on issuance and update, valid proofs, version 2 each. |
| `tests/e2e/tests/docs-refresh.spec.ts` | Receipt assertions extended (issuerDid/holderDid/activityId/credentialStatus). Runs the rewritten snippets verbatim; the published `send()` snippet demonstrably issues, claims, publishes v2 and refreshes. |
| `tests/e2e/tests/unified-send.spec.ts` | Added explicit non-refresh compatibility test (`refresh` omitted and `refresh: false` → no receipt, normal result). |
| `tests/e2e/tests/credential-refresh.spec.ts` | Unchanged this task (Task 3 already adapted its `sendBoost` destructure); its revocation/privacy regression coverage passes. |
| `tests/e2e/compose.yaml` | **Justified path drift:** added `- ../../packages/learn-card-helpers/src:/app/packages/learn-card-helpers/src` brain volume — the unified-send route now signs through the shared helpers (`@learncard/helpers` resolves to src under `--conditions=development`), mirroring the existing types-src mount from Task 2. |

### 4. Changesets

**No new changeset created (intentional).** `.changeset/lc-2198-refreshable-sends.md` was already committed by Task 3 and covers every public package change of LC-2198 (network-plugin minor, types minor, helpers minor, vc-plugin patch). Task 4 ships only docs and `@workspace/e2e-tests` changes; the e2e package is in `.changeset/config.json`'s `ignore` list and must never appear in a changeset, and docs are not published. A second changeset would duplicate changelog entries for the same release.

## Exact verification commands and results

Environment provisioned in the isolated worktree: `bun install --frozen-lockfile` (4757 packages, lockfile untouched), `git submodule update --init lib/didkit lib/ssi`, Docker image built **from this worktree** (`docker compose build brain` in `tests/e2e`), dedicated stack started (`docker compose up -d`; brain/lca-api/cloud/neo4j/redis/mongo/elasticmq; no other LearnCard stack was running; nothing else was stopped). Container verified to run branch code (`extractManagedRefreshHandoff`, receipt validator, shared helpers all present in-container).

```
node scripts/check-docs-snippets.mjs --fix   # "Snippets synced: 1 file(s) rewritten, 35 snippet(s) embedded" (after snippet edits)
node scripts/check-docs-snippets.mjs         # "Snippets OK: 35 embedded, all in sync."
node scripts/check-docs-links.mjs            # "Docs integrity OK: 110 files, 153 redirects, 14 grandfathered issues."

bunx nx build network-plugin            # success (19 tasks)
bunx nx build init                      # success (31 tasks)
bunx nx build types                     # success
bunx nx build helpers                   # success (3 tasks)
bunx nx build vc-plugin                 # success (6 tasks)
bunx nx build network-brain-service     # success (17 tasks)

bun --cwd tests/e2e exec vitest run tests/refresh-send.spec.ts
  → Test Files 1 passed (1) / Tests 13 passed (13)   [run twice consecutively — both green]
bun --cwd tests/e2e exec vitest run tests/docs-refresh.spec.ts
  → Test Files 1 passed (1) / Tests 1 passed (1)     # executes the published snippets end-to-end
bun --cwd tests/e2e exec vitest run tests/credential-refresh.spec.ts
  → Test Files 1 passed (1) / Tests 3 passed (3)     # LC-2117/2135/2136 regression + revocation coverage intact
bun --cwd tests/e2e exec vitest run tests/docs-refresh.spec.ts tests/refresh-send.spec.ts tests/credential-refresh.spec.ts
  → Test Files 3 passed (3) / Tests 17 passed (17)   # final formatted-tree run
bun --cwd tests/e2e exec vitest run tests/unified-send.spec.ts
  → Tests 36 passed | 10 failed (46) — ALL 10 failures are pre-existing; see Deviation 1

git diff --check        # clean
bunx prettier --check <changed files>  # clean after --write
bunx eslint tests/e2e/tests/refresh-send.spec.ts tests/e2e/tests/docs-refresh.spec.ts tests/e2e/tests/unified-send.spec.ts
  → 4 errors, all pre-existing `no-explicit-any` lines in unified-send.spec.ts (verified identical on `git show 6cc28b6f9:` version via stdin run); zero new occurrences
```

The task-listed runner form `bun --cwd tests/e2e test:run -- tests/…` resolves to the same `vitest run`; the suites above were executed against the docker stack built from this branch (image `learncard-monorepo-local` rebuilt in-worktree; container contents verified, not just health checks).

## Deviations / notes for reviewer

1. **Pre-existing `unified-send.spec.ts` failures (not introduced by this task).** 10 tests fail in this local environment, all in the email claim-flow / inbox-claim area (`performClaimFlow` returns an undefined credential — the vcapi claim exchange yields no credential locally). **Proven pre-existing:** created a throwaway worktree at the pristine baseline `6cc28b6f9`, pointed the same docker project's brain at the baseline source, and ran the same spec file → the identical 10 tests fail the same way. CI on main runs this suite green, so this is a local docker-environment issue (likely workflow/email infra), out of LC-2198 scope. All profile/DID direct-send tests (36) pass.
2. **did:web document cache vs signing-authority registration (new finding, worked around in tests).** Registering an SA mutates the issuer's `did.json` (adds `#<saName>` verification method). Both the lca signing path and the holder's verifier resolve that cached document; a pre-registration cached copy breaks SA signing (`Key mismatch` 500) and holder verification (`No applicable proof`). The lca route already self-heals (noCache resolve + retry). Tests use unique ≤15-char SA names per run plus one `resolveDid(issuerDid, { noCache: true })` from the holder after setup. Recommended follow-up: invalidate/refresh the did:web document cache on SA registration, and make the refresh primitive's failure distinguishable from cache staleness.
3. **Inline-template sends of BoostCredential-typed credentials cannot be refreshed by the holder primitive (pre-existing interaction, avoided in docs/tests; flag for Task 5).** The SDK inline-template managed branch signs the credential without `boostId` (the boost doesn't exist yet — Task 3 design), and the boost-authenticity verifier emits a warning ("Boost ID metadata is missing") for BoostCredential credentials lacking `boostId`; `refreshCredential` requires warning-free verification, so its pre-flight returns `INVALID_PROOF`. The published guide snippets and the inline-template test therefore use ordinary (non-boost-typed) OBv3 templates, which refresh cleanly end-to-end. Options for follow-up: stamp `boostId` server-side at bind time (would require mutating a signed credential — conflicts with immutability), or relax the boost-authenticity warning for managed refreshables, or have the SDK warn at send time.
4. **VC 1.1 receipts carry no `credentialStatus`:** `appendNetworkCredentialStatus` allocates Bitstring status entries only for VC2-format credentials, so VC 1.1 refreshable sends legitimately produce receipts without a status descriptor (publication invariants tolerate the absent digest). Tested explicitly (`expectStatus: false`).
5. **Feature-disabled and contract-linkage cases are covered at the server layer (Task 2), not duplicated at E2E.** The feature flag is fixed `true` in the e2e compose; flipping it per-test would require a second stack. Contract linkage (`ISSUED_VIA_TRANSACTION`) is covered by Task 2's integration suite with a real consented contract; reproducing it at E2E would duplicate a full ConsentFlow setup for no additional LC-2198 confidence. Replay/idempotent-resume is proven at E2E over real HTTP (decision-6 segment); non-refresh compatibility is proven in `unified-send.spec.ts` (SDK) and over HTTP (same token sends non-refreshable credentials, no receipt).
6. **`refresh-held.mjs` unchanged** — inspected; the holder primitive flow is independent of the send-path changes and remains correct.

## Remaining risks

- The 10 pre-existing local unified-send failures hide any regression those specific tests could have caught; mitigated by (a) the baseline A/B proof above, (b) Task 2's server integration matrix for the send route, and (c) the new HTTP `/api/send` tests covering the refresh path. Reviewer with a working email/workflow environment should re-run `unified-send.spec.ts` in CI.
- `resolveDid(..., { noCache: true })` in the SA test papers over the cache-staleness finding; if the resolver cache behavior changes, the test could flake again (the SA names are already unique per run, which removes the main source).

## Checklist

- [x] Lead issuance snippet rewritten around `send({ type: 'boost', …, refresh: true })` with an ordinary template (no copied context); receipt + own claims persisted; publication reuses exact identity/service/status; no holder credentials anywhere
- [x] `sendBoost` opt-in result documented with publication; local-recipient scope, permissions, feature flag, unsigned-vs-pre-signed behavior, non-refresh compatibility documented; obsolete warning and context-copy troubleshooting removed; lower-level path retained with automatic context handling shown
- [x] Snippets and Markdown synchronized (`--fix` then clean check); Mermaid leads with unified send and explains allocation/signing underneath
- [x] Real lifecycle coverage for SDK `send` (templateUri + inline), `sendBoost`, and authenticated HTTP `POST /api/send` with a primary signing authority; each publishes v2 from receipt + known claims only; stable IDs/issuer/service/status, valid proofs, boost membership, nonempty activityId, activity correlation, holder-only storage asserted; no decrypted issuer state read from any database
- [x] Pre-signed handoff, email/phone/remote rejection, restricted scope, self-send notification suppression, HTTP replay idempotency, and non-refresh compatibility exercised at the most appropriate layer; existing tests preserved
- [x] Automatic context proven with real signing for VC 1.1, VC 2.0, OBv3 (3.0.3), CLR 2.0 — initial issuance and update; existing refresh/revocation/privacy regressions (`credential-refresh.spec.ts`) still pass; no security assertions weakened
- [x] Changeset situation resolved (Task 3's changeset covers all public package changes; no ignored packages listed; none created for docs/e2e-only work)
- [x] Focused suite run on services built from this branch; affected packages built; counts/commands recorded; `git diff --check` clean; report committed (this file); no master tracker or live Dispatch metadata touched

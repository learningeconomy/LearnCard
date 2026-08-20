# LC-2088 Task 3 Report

## Status

Complete. Direct credential acceptance and claim-link auto-acceptance now use one best-effort post-claim connection-prompt seam. The change creates directed prompt state but never connects profiles unless the pre-existing boost configuration already requires it.

## Implementation

-   Added `handleConnectionPromptsForCredentialClaim` as the single claim integration boundary.
-   Creates the claimer `POST_CLAIM` prompt and sender `NOTIFICATION` prompt through the reviewed Task 1 helper.
-   Enqueues one actionable `BOOST_ACCEPTED` notification only when the sender prompt transition is new.
-   Preserves claim metadata while forcing the typed `connectionPrompt` metadata to win over caller-supplied values.
-   Treats both prompt persistence and actionable notification enqueue failures as nonfatal.
-   Refactored `acceptCredential` so claim relationships, hooks, roles, configured auto-connect, activity logging, and legacy notification behavior remain new-acceptance-only.
-   Allows already-received retries to resolve the sender and retry prompt creation with stable trigger `credential:<credential-id>`.
-   Preserves the ordinary `boostAccepted` notification when no actionable sender prompt is eligible.
-   Added `boostAcceptedConnect` for `en`, `es`, `fr`, and `ar` without changing `boostAccepted`.

## Requirement Review

-   Successful ordinary claims create two directed prompts and do not connect the profiles.
-   `skipNotification: true` suppresses only the legacy event; a new actionable sender prompt still receives its event.
-   Self-issued claims create no prompts.
-   Same-credential retries can repair a failed write, do not repeat claim side effects, do not reopen same-trigger skipped prompts, and do not duplicate notifications.
-   Claim-link auto-acceptance reaches the shared seam and uses the accepted credential URI-derived trigger.
-   Existing `ensureConnectionsForCredentialAcceptance` behavior is unchanged and remains inside the new-acceptance block.
-   No inbox claim path was changed.

## TDD Evidence

### Localized notification RED

Command:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run test -- run test/notificationMessages.spec.ts
```

Observed RED: 4 assertion failures; each locale returned an empty body instead of the required `boostAcceptedConnect` copy. Existing 11 tests passed.

Observed GREEN after adding the key/catalog entries: 15/15 tests passed.

### Direct acceptance RED

Command:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run test -- run test/credentials.spec.ts \
  -t "creates directed prompts and one actionable sender notification" --reporter=verbose
```

Observed RED: acceptance succeeded, but the real query returned zero pending claimer prompts (`expected [] to have a length of 1`).

Observed GREEN after wiring the seam: the test passed and verified both prompt directions, surfaces, stable trigger, no connection, merged metadata, and exactly one actionable event from the e2e notification queue.

### Nonfatal notification RED

Command:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run test -- run test/credentials.spec.ts \
  -t "actionable notification enqueue fails" --reporter=verbose
```

Observed RED: an injected enqueue failure rejected `acceptCredential` with `INTERNAL_SERVER_ERROR`.

Observed GREEN after adding best-effort handling: all 12 focused `acceptCredential` cases passed, including prompt-write failure, enqueue failure, retry recovery, and same-trigger idempotency.

## Final Verification

-   `SEED=... bun run test -- run test/credentials.spec.ts test/boosts.spec.ts test/notificationMessages.spec.ts --reporter=dot` — 334/334 passed.
-   `SEED=... bun run test -- run test/connection-prompts.spec.ts --reporter=dot` — 27/27 passed.
-   `NX_DAEMON=false bunx nx build network-brain-service --output-style=static` — passed; bundle, TypeScript build, and alias rewrite completed.
-   Prettier check for all six Task 3 source/test files — passed.
-   `git diff --check` — passed.

## Notes

-   The build initially could not start an Nx plugin worker inside the sandbox. The approved escalated rerun completed successfully; this was an environment restriction, not a code failure.
-   Test output includes the repository's expected DIDKit native-addon fallback warning on this machine.

## Review Round 1 — Actionable Delivery Fallback

### Root Cause and Fix

The actionable enqueue catch preserved `senderPrompt.isNew: true`, so `acceptCredential` treated graph creation as notification delivery and suppressed the legacy event. Stable-trigger retries then correctly avoided recreating the prompt, but also had no delivery to recover.

`ConnectionPromptCreationResult` now reports `senderNotificationFailed` when the new sender prompt was stored but its actionable event was not enqueued. `acceptCredential` attempts the existing legacy `BOOST_ACCEPTED` fallback for that explicit outcome, including recovery calls for already-received credentials. A successful actionable enqueue still returns no failure outcome and suppresses legacy delivery.

### Assertion RED

Command:

```bash
SEED=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
  bun run test -- run test/credentials.spec.ts \
  -t "falls back to one legacy notification" --reporter=verbose
```

Observed RED: claim acceptance resolved, but only the rejected actionable enqueue attempt occurred (`expected [Array(1)] to have a length of 2 but got 1`); no legacy fallback was attempted.

### GREEN and Regression Evidence

-   The same fallback test passed after the outcome change. It verifies the first actionable attempt carries typed `connectionPrompt` metadata, the second legacy enqueue has no actionable metadata, exactly one enqueue resolves, the credential remains received, and the claim call succeeds.
-   `creates directed prompts and one actionable sender notification without connecting profiles` passed against the real e2e queue and still observes exactly one actionable event, proving successful actionable delivery does not also enqueue legacy.
-   All focused `acceptCredential` cases passed: 12/12.
-   Task 3 focused files passed: 334/334.
-   Shared connection-prompt regressions passed: 27/27.
-   `NX_DAEMON=false bunx nx build network-brain-service --output-style=static` passed.
-   Prettier and `git diff --check` passed.

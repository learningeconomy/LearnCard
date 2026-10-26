# Persisting post-recovery escrow repair intent (design)

**Status:** Option C implemented (client only; unit tests with mocked HTTP/crypto, not
exercised on staging or a real enclave):

- Part 1: `getEscrowEnrollmentState` adds `priorEscrowMethod: true` to a `not-enrolled`
  result when lca-api still lists an escrow method in any confirmation state.
  `resolveEscrowEnrollmentGate` turns a rollout denial for such an account into a repair
  with `requirePriorEnrollment`, so the signed authority (Nitro) still decides. Never-enrolled
  accounts stay gated; opted-out/disabled paths are unchanged. The in-memory
  `recoveredEscrowAccount` path is kept.
- Part 2: in Nitro mode, `ensureEscrowEnrollmentUnguarded` signs `replace` / `clear` instead
  of `carry` / `keep` when the authority is `active` with `hasPin`, no PIN is being set, the
  account is not currently enrolled, and lca-api reports `escrowPin.state === 'none'`
  (Mongo PIN absent, which alone guarantees the `escrow.ts` precondition fails). Controlled
  by `SSSStrategyConfig.autoClearUncarryablePin`, default `DEFAULT_AUTO_CLEAR_UNCARRYABLE_PIN
= true`, because with it off no user-facing PIN prompt is reachable while unenrolled.
- Q4: the authority read and attestation already run before rotation, so a failed read
  burns no share version (now covered by a regression test).

**Still open for security:** Q1 (automatic client-signed clear; flip the default to `false`
and add a prompt if rejected), Q2, Q3, Q5, Q6. Staging test plan item 9 not run.

**Original status:** Proposal. Follow-up to PR #1790 (review thread on
`AuthCoordinator.ts`, "recovered account outside the rollout still ends up unenrolled if
the app reloads before the repair succeeds").
**Baseline:** `origin/main` at `73687f364`. Line references below are to that commit.
**Scope:** Client repair after escrow (7-day hold or PIN) recovery and after non-escrow
identity recovery with a new sign-in. No code changes are proposed in this PR.

Everything below was read from source. Nothing here was exercised against staging, a
real enclave, or a test run; statements marked **(unverified)** are inferences that need
confirmation before implementation.

## 1. Background: what carries the repair today

After recovery with a new sign-in, `completeIdentityRecovery` rebinds the account, stores
the new device share durably, then tries direct escrow enrollment:

- Device share and share version are written to storage before enrollment
  (`packages/sss-key-manager/src/sss-strategy.ts:3495-3498`). After a reload the client
  can therefore reconstruct the key and reach `ready` normally.
- Direct enrollment runs only for escrow recoveries (`pending.fromEscrow`) and always
  asks for `clearPin=true` (`sss-strategy.ts:3513-3530`).
- If it fails, the split is kept only in a closure variable `unenrolledRotation`
  (`sss-strategy.ts:3534-3541`; declared at `sss-strategy.ts:1089-1095` with a TODO noting
  it cannot survive a reload).

The coordinator then records an in-memory marker `recoveredEscrowAccount =
{ did, userId, clearPin: true, bypassRolloutGate }`
(`packages/learn-card-base/src/auth-coordinator/AuthCoordinator.ts:107-113`, set at
`:879-886` on the sign-in completion path and `:1368-1374` on `recover`). The marker is
cleared on `idle` (`:159`), when a new PIN is set (`:602-606`), and after the repair
succeeds or reports `not-enrolled` (`:370-378`).

`refreshEscrow` (`AuthCoordinator.ts:313-378`) uses the marker to:

1. skip the first-time rollout gate when `bypassRolloutGate` is true (`:340-343`);
2. otherwise, if the gate denies, still call the strategy with `requirePriorEnrollment`
   (`:344-360`);
3. pass `clearPin: true` (`:356`).

The server side of the rebind (`services/learn-card-network/lca-api/src/models/UserKey.ts:1486-1514`)
resets every recovery method to `confirmationStatus: 'pending'` at the new share version
and `$unset`s `escrowBlob` and `escrowPin`. The Nitro authority record (per-DID signed
state in the enclave's authority table) is not touched by the rebind, so it still says
`active`, with the old share version and the old `hasPin`.

## 2. Precise failure scenarios after a reload

Assume direct enrollment in `completeIdentityRecovery` failed (enclave unavailable,
transient network error, `assertCurrent` race, etc.), then the app reloads or the tab is
restarted before the in-session repair succeeds. Both `recoveredEscrowAccount` and
`unenrolledRotation` are gone. The device share is on disk, so the next sign-in reaches
`ready` and `refreshEscrow` runs with `repairingRecovery = false`.

### 2.1 Gate state after reload

`resolveEscrowEnrollmentGate` (`AuthCoordinator.ts:279-310`) reads
`getEscrowEnrollmentState` (`sss-strategy.ts:2130-2153`). That only counts escrow methods
whose confirmation status is `confirmed`. The rebind made them all `pending`, so
`confirmedEscrow` is empty and the state is `not-enrolled`, not `stale`. The gate therefore
consults `isEscrowEnrollmentAllowed` (`:309`).

### 2.2 Scenario A: outside the rollout bucket (escrow or non-escrow recovery)

- Gate returns `allowed: false`.
- `requirePriorEnrollment = repairingRecovery && !gate.allowed` is `false` because the
  marker is gone (`AuthCoordinator.ts:345`).
- `ensureEscrowEnrollment` is never called (`:346`).

Result: the previously enrolled account stays unenrolled indefinitely. The hold-PIN prompt,
which waits for enrollment, never appears. This is what the #1790 reviewer reported, and
the `requirePriorEnrollment` authority check added in #1790's final commit
(`sss-strategy.ts:1499-1501`) does not help, because nothing ever asks for it after a reload.
The signed authority state that would prove prior enrollment still exists. It just isn't
consulted.

### 2.3 Scenario B: inside the rollout bucket, Nitro mode, old enrollment had a PIN

This is the usual case. A hold recovery is the "forgot PIN" path, and a PIN recovery
implies a PIN.

1. Gate allows. `ensureEscrowEnrollmentUnguarded` runs without `clearPin`
   (`AuthCoordinator.ts:353-361`, options are just the contact options).
2. `currentlyEnrolled` is false because methods are pending (`sss-strategy.ts:1467-1476`).
   The authority read sets `hasPin = current.hasPin = true` (`:1490-1514`).
3. `unenrolledRotation` is empty, so the code does a **fresh rotation** through
   `persistSharesWithoutLock` (`:1575-1597`). That burns one share version.
4. `enrollEscrow` resolves the action with input `automatic`
   (`sss-strategy.ts:1358-1363`, `:1384-1393`). For an `active` authority with
   `hasPin = true`, `resolveEscrowEnrollmentAction` returns `carry` / `keep`
   (`packages/sss-key-manager/src/escrow-authority.ts:578-606`).
5. lca-api requires the old Mongo blob and PIN for a keep-with-PIN
   (`services/learn-card-network/lca-api/src/routes/escrow.ts:559-569`). The rebind deleted
   both, so the request fails with `PRECONDITION_FAILED` ("Set or clear your recovery PIN
   before continuing.").
6. The error propagates. It is not the stale-blob swallow path (`sss-strategy.ts:1631-1635`).
   `refreshEscrow` logs `escrow.enrollment.failed` (`AuthCoordinator.ts:364-367`). The
   rotation is kept in a fresh `unenrolledRotation` with `clearPin: false`
   (`sss-strategy.ts:1606-1613`). In-session retries reuse it and fail the same way. Each
   later reload burns another share version.

Result: the account stays unenrolled until the user explicitly sets a PIN (`setEscrowPin`
→ `set`/`change`, which does not need the old Mongo PIN). The clear-PIN intent was the only
thing that made automatic repair possible, and it was lost.

### 2.4 Scenario C: inside the rollout, old enrollment had no PIN

`resolveEscrowEnrollmentAction` gives `replace` / `keep` (`escrow-authority.ts:598-604`).
`preservePin` is false on the server (`escrow.ts:559`), so the request does not need the
old blob. Repair should succeed after one fresh rotation **(unverified end to end)**.
There is no functional loss here beyond the extra share version.

### 2.5 Non-Nitro (local/dev attestation) mode

`requirePriorEnrollment` uses "any escrow recovery method exists"
(`sss-strategy.ts:1477-1482`). That also survives the rebind as a pending entry. There is
no authority carry, so scenario B does not apply. Scenario A still applies because the gate
is not bypassed.

### 2.6 Are the recovered shares actually needed?

No, not for correctness. The retry branch (`sss-strategy.ts:1547-1572`) exists only so an
in-session retry re-posts the same split instead of burning another share version. The
non-retry branch (`:1575-1630`) builds a complete new split from `params.privateKey` and
the server, and the coordinator always has `ready.privateKey`. After a reload, a fresh
rotation is a valid repair. Its costs are one extra share version and one more entry in the
server's retained auth-share history **(unverified: check whether `persistSharesWithoutLock`
interacts badly with the still-`pending` passkey/phrase/email methods left by the rebind;
see open question Q5)**.

So the only state that is actually lost is **intent**: (a) "this account had a prior
enrollment, so repair it regardless of rollout", and (b) "the retired PIN must be cleared,
not carried".

## 3. Options

### Option A: persist a non-secret, DID-scoped intent flag

Persist `{ v: 1, did, userId, clearPin: true, bypassRolloutGate, createdAt }` under a
user-scoped key, for example via `SSSStorageFunctions` with a new id such as
`sss-escrow-repair-intent:<storageId>`. Use the same pattern as the pending-candidate key at
`sss-strategy.ts:600-602`, or a coordinator-level store. Write it where the in-memory marker
is set today. Load it on entering `ready` when `did` and `userId` match. Delete it on
success or `not-enrolled`, on `setEscrowPin`, on logout / forget-device / `idle`, and after
a TTL. The strategy needs no shares: it does a fresh rotation with `clearPin`.

- Pros: smallest change, mirrors today's semantics exactly, and works in non-Nitro mode.
- Cons: a second source of truth that can go stale. It is lost in session-only
  (public-computer) storage, which uses `sessionStorage` (`packages/sss-key-manager/src/storage.ts:318-325`),
  and on another device, where a user who signs in elsewhere never gets repaired. It needs
  careful lifecycle clearing. It adds a local write that could be tampered with (see §4).

### Option B: persist the recovered split (encrypted) next to the device share

Persist `unenrolledRotation` (`shares` + `shareVersion` + `primaryDid` + `clearPin`) in the
IndexedDB store, encrypted under the existing non-extractable AES-GCM master key
(`storage.ts:56-80`).

- Pros: no extra share version on retry.
- Cons: **this breaks an explicit invariant.** The pending-candidate store says "never
  persist an auth, recovery, or email share here (two shares from one split reveal the key)"
  (`sss-strategy.ts:613-617`). `unenrolledRotation.shares` holds the device and recovery
  shares of the same split, so the key could be reconstructed from local storage alone. The
  wrapping key is non-extractable but usable by any same-origin script, so this adds no
  protection against XSS or a malicious extension. The benefit is small (§2.6). It also
  does not solve the lost-intent problem by itself; the clear flag would still need
  persisting. **Not recommended.**

### Option C: derive intent from server and authority state, with no client persistence

Treat "verified prior enrollment exists, but the current share version is unenrolled" as
maintenance, not first-time enrollment. Re-derive the PIN action from what the server can
actually carry.

1. **Rollout bypass.** In `resolveEscrowEnrollmentGate`, when the state is `not-enrolled`
   but the server status shows an escrow recovery method of any confirmation status (cheap
   prefilter, already fetched), call `ensureEscrowEnrollment` with
   `requirePriorEnrollment: true` instead of applying the rollout predicate. In Nitro mode,
   the strategy then proves prior enrollment from the signed authority (`sss-strategy.ts:1499-1501`).
   This already exists and, as its comment says, survives the rebind. A never-enrolled
   account with an `empty` authority returns `not-enrolled` and stays gated. A `disabled`
   authority returns `opted-out` (`:1502-1504`) and is never resurrected. This matches the
   gate's own documented rule that repairing prior enrollment "is maintenance, not rollout"
   (`AuthCoordinator.ts:266-273`). Alternatively, make `getEscrowEnrollmentState` report
   `stale` for this case.
2. **PIN action.** In `ensureEscrowEnrollmentUnguarded`, when Nitro authority `hasPin` is
   true but the server holds no carryable source (no Mongo `escrowPin` / blob, or a blob
   hash that does not match the authority's source identity, which is exactly the
   `escrow.ts:562-564` precondition), resolve `automatic` to `clear` instead of `carry`.
   Today that request is guaranteed to fail with `PRECONDITION_FAILED`, so this only changes
   a request that cannot succeed. There is precedent: "Explicit enable without a new PIN
   signs a clear of the retired verifier" (`services/escrow-enclave-app/ENROLLMENT-AUTHORITY.md:185-191`).
    - Conservative variant: do not auto-clear. Surface the existing PIN prompt and leave the
      account unenrolled until the user sets a PIN. This keeps every PIN mutation
      user-initiated, at the cost of an unrecoverable window.
3. Keep `recoveredEscrowAccount` / `unenrolledRotation` as in-session optimizations only.

- Pros: no new local state. Works across reloads, devices and session-only storage.
  Grounded in signed authority state rather than a client-writable flag. Also repairs
  accounts that hit this before the fix shipped.
- Cons: one extra authority-state read (DID-auth VP plus an enclave call) per `ready` refresh
  for accounts with a pending escrow method, until they are repaired. The PIN-clear decision
  is triggered by lca-api-observable state (§4). Non-Nitro mode only gets part 1, which is
  fine because carry does not arise there **(unverified)**.

## 4. Threat model for persisted or derived data

| Asset / signal                                                 | Option | Who can influence it                                                                                                | Worst case                                                                                                                                                                                 | Mitigation                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent flag (`did`, `userId`, `clearPin`, `bypassRolloutGate`) | A      | Same-origin script, extension, or local-disk attacker                                                               | Forces enrollment outside the rollout bucket (the rollout is a product gate, not a security boundary), or forces a PIN clear on the next refresh                                           | Any enrollment still needs owner DID-auth VP and a signed intent from `ready.privateKey`. An attacker who can run code in-origin already has the key. Scope by `did` + `userId`, add a TTL, clear on logout. The PIN-clear impact is the same as in the Option C row. |
| Recovered split (device + recovery share)                      | B      | Same as above, plus offline disk access to IndexedDB if the wrapping key leaks                                      | Full key reconstruction from local storage                                                                                                                                                 | None adequate. This is why B is rejected.                                                                                                                                                                                                                             |
| "No carryable source" (Mongo blob/PIN absent)                  | C      | A malicious or compromised lca-api / Mongo                                                                          | Induces a signed `clear` of the user's PIN, which removes the PIN fast-release path. Recovery remains via the 7-day hold with vault-sent email confirmation (`ENROLLMENT-AUTHORITY.md:7`). | The enclave still enforces owner signatures. A clear lowers attacker options rather than adding them, because no new secret is set. A server that can delete the blob can already block carry (a DoS it already has). Needs security sign-off (Q1).                   |
| "Prior enrollment exists"                                      | C      | Nitro: the enclave-signed authority state, verified with a nonce (`sss-strategy.ts:1279-1310`). Non-Nitro: lca-api. | Non-Nitro: lca-api can force enrollment outside the rollout bucket                                                                                                                         | Acceptable for non-production attestation modes **(confirm)**.                                                                                                                                                                                                        |

What none of the options persist or log: shares, PINs, PIN verifiers, auth tokens.

## 5. Recommendation

Adopt **Option C**, with part 2 in the auto-clear form if security agrees (Q1). Otherwise
use the conservative prompt variant. Do **not** persist shares (reject Option B). A fresh
rotation from `ready.privateKey` is a correct repair, and persisting a recovery share next to
the device share breaks the one-share-per-split storage invariant. Keep the existing
in-memory marker and `unenrolledRotation` only as same-session optimizations. Consider
Option A only if the extra authority read per refresh proves too expensive. Even then, persist
only the non-secret flag and let the server or authority state stay the deciding check.

## 6. Test plan

The unit tests use mocked HTTP and crypto, consistent with the existing suites:
`packages/sss-key-manager/src/sss-strategy.test.ts`, `sss-authority.test.ts`, and
`packages/learn-card-base/src/auth-coordinator/*.test.ts`.

1. **Reload simulation.** Build a fresh coordinator and strategy (no in-memory marker) over
   a server fixture in the post-rebind shape: escrow method `pending` at the new version, no
   `escrowBlob` / `escrowPin`, authority `active` with old `shareVersion` and `hasPin: true`.
   Assert:
    - outside rollout, `ensureEscrowEnrollment` is called with `requirePriorEnrollment`;
    - exactly one rotation happens;
    - the signed intent is `replace` / `clear`;
    - no `PRECONDITION_FAILED`;
    - the hold-PIN prompt helper becomes eligible.
2. Same fixture with `hasPin: false`: `replace` / `keep`, success.
3. **Never-enrolled outside rollout:** authority `empty` and no escrow method → no
   enrollment, no rotation.
4. **Disabled authority:** `opted-out`, no rotation, no resurrection.
5. **Carryable source present** (normal stale repair, Mongo blob matches the authority
   source): still `carry` / `keep`. This guards against over-clearing.
6. **User sets a PIN** before the repair runs: `set` wins, and no later automatic clear
   overrides it.
7. **Repeated reloads while the enclave is down:** bounded share-version growth (document
   the bound; see Q4).
8. **Option A only:** flag scoped to `did` + `userId`, ignored on mismatch, cleared on
   logout / forget-device / success / `setEscrowPin` / TTL; session-only mode behavior
   documented.
9. **Staging (manual, operator):** a real PIN recovery and a real 7-day hold recovery with
   the escrow POST blocked (for example, enclave paused), then reload. Unblock and confirm
   re-enrollment with recovery contact and a cleared PIN. Repeat outside the rollout bucket.

## 7. Open questions for security

- **Q1.** May the client automatically sign a `clear` PIN action because lca-api has no
  carryable source (Option C part 2)? Or must every PIN mutation after recovery be explicitly
  user-initiated? Decision 2 (`ENROLLMENT-AUTHORITY.md:8`) requires set/change to be
  user-signed but is silent on automatic clear. The existing "explicit enable signs a clear"
  path is user-initiated.
- **Q2.** Is the extra nonce-bound authority-state read per `ready` refresh acceptable for
  load and audit volume for accounts stuck in the repair state? Should it be rate-limited or
  backed off client-side?
- **Q3.** Should the rebind itself (`UserKey.ts:1486-1514`) record a server-side
  "post-recovery repair pending, clear PIN" marker? That would be authoritative without
  inferring from absent fields, but it is a server/API change.
- **Q4.** Is burning one share version per reload during a prolonged enclave outage
  acceptable, or should rotation be skipped when the enclave attestation/authority read
  fails before rotating? Today attestation is verified before rotating
  (`sss-strategy.ts:1573-1575`), but the authority read happens even earlier (`:1490`).
- **Q5.** Does a second rotation after rebind interact correctly with recovery methods left
  `pending` at the rebind's share version (passkey, phrase, email backup)? **Unverified.**
- **Q6.** In non-Nitro attestation modes, is trusting lca-api's escrow-method list for the
  rollout bypass acceptable?

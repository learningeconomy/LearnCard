# Production Web3Auth → SSS migration runbook

Moves LearnCard and VetPass production accounts from Web3Auth (SFA, legacy
`testnet`, verifier `learncardapp-firebase`) to SSS key derivation, so that
escrow recovery can be enabled. Plan agreed 2026-10-28: pilot on a dedicated
Capgo channel, then switch everyone at once, LearnCard and VetPass together.

## How migration works

The switch is one tenant value, `auth.keyDerivation: "sss"`. There is no
per-user rollout: every legacy account migrates at its next sign-in.

1. A signed-in account with no SSS record and older than 5 minutes is legacy
   (`legacyAccountThresholdMs`). A device with a cached key uses it; otherwise
   the app re-derives the Web3Auth key from the tenant `auth.web3Auth` block.
2. The **same key** is split into a device share and an lca-api auth share, so
   the DID, credentials and network profile are unchanged.
3. The record is `provisional` until a recovery method is confirmed. Setting the
   escrow PIN confirms one, and activates the record.

Safety checks in code (learn-card-base `AuthCoordinator.migrate()`):

- **DID guard.** Before anything is written, the DID must match the DID lca-api
  already holds for the account, if any. Otherwise the app's
  `verifyMigrationIdentity` runs (`apps/learn-card-app/src/providers/migrationIdentity.ts`):
    - a cached key must match a fresh Web3Auth derivation for the signed-in
      account (the cache is one device-wide slot);
    - a derived key is a `match` if a network profile exists for its DID, and
      `unknown` if not (users who never finished onboarding have no profile).

    A cached key that fails either check (another account's key left on the
    device) is dropped and the signed-in account's key is derived instead. A
    derived key that fails ends in a non-retryable error
    (`MIGRATION_IDENTITY_MISMATCH`). Either way nothing is written first: a wrong
    first DID would be permanent, since lca-api refuses later writes from another
    DID and the 30-day purge keeps the stored DID.

- **Provisional on a new device.** A provisional migrated account whose share
  is missing or stale on this device re-derives its Web3Auth key and, once it
  matches the server DID, uses it **without writing**: no re-split, so the
  first device's share and any escrow seal stay current. This device gets a
  share from its next explicit share update (e.g. setting the PIN). If the
  derivation fails, or a QR-login share is waiting, it falls back to the
  recovery screen it replaced.
- **PIN prompt (LAUNCH-DECISIONS P-a).** Escrow-enrolled accounts without a PIN
  get the first-time prompt once per device.

## Prerequisites (before the pilot)

- [ ] Web3Auth confirms in writing that legacy `testnet` and the
      `learncardapp-firebase` verifier stay supported, and for how long. Every
      unmigrated or provisional account depends on it.
- [ ] Production lca-api: stable, backed-up `SEED` (losing it makes every auth
      share unrecoverable); Firebase Admin credential for project `learncard`;
      Postmark; `IS_OFFLINE`/`IS_E2E_TEST` unset.
- [ ] Production MongoDB `userkeys`: unique `auth_provider_identity_unique`
      index present and no duplicate provider identities (otherwise first writes
      fail with CONFLICT).
- [ ] For the escrow half of the pilot: PRODUCTION.md step 9 (lca-api
      `ESCROW_ENCLAVE_MODE`, runtime-secrets URL/token, kill switch policy).
      Until then the pilot exercises SSS only. Expect escrow to be unavailable
      and no PIN prompt (not yet observed; confirm on the pilot).

## Pilot

LearnCard native, via `.github/workflows/capgo-sss-pilot.yml` (production
config + `learncard/config.sss-pilot.json`: SSS, nitro escrow, 100% rollout on
that channel only; built with the auth debug widget on).

1. Run the workflow with a `channel_suffix`. The channel is **not**
   self-assignable: Capgo lists self-assignable channels to every install, so a
   channel name is no access control.
2. Get each tester's device ID (side menu → version line → Version Info), then
   assign that device to `<defaultChannel>-sss-pilot-<suffix>` with a device
   override in the Capgo dashboard and reload the app. If the device does not
   pick up the bundle, link it explicitly:
   `capgo channel set <channel> --bundle <version> com.learncard.app` (without
   `--self-assign`). Neither step has been exercised yet; confirm on the first
   device.
3. Use an **existing** account only. Accounts created on the pilot get random
   keys that Web3Auth builds cannot derive.
4. Check, before and after: the DID in the auth debug panel is unchanged;
   credentials and profile are present; signing in on a second device works
   (provisional: silent re-derive, or the recovery screen if Web3Auth fails or a
   QR-login share is waiting; after a PIN: recovery). Once step 9 is live:
   escrow enrollment, PIN prompt, PIN recovery.
5. Watch logs for `migration.identity.mismatch` (must be zero),
   `migration.identity.unanchored` (rate should match accounts without a
   profile; near 100% means a wrong `web3Auth` block) and
   `migration.identity.deferred`.
6. To leave: remove the device override. Migrated accounts keep the same key,
   so Web3Auth builds still open them. When the pilot ends, delete the channel.

VetPass has no Capgo channel. Its overlay (`vetpass/config.sss-pilot.json`, SSS
without escrow) applies only to a web host whose first label is `sss-pilot`.
That host needs a `tenant-registry.json` entry mapping it to `vetpass`
(unregistered hosts resolve to the `learncard` tenant, and would get the
LearnCard pilot overlay instead), a Netlify alias, and Firebase
authorized-domain and Web3Auth origin entries. Escrow for VetPass is
undecided: the production enclave is configured for the `learncard` tenant.

## Switching everyone

One PR, LearnCard and VetPass together (they share the Firebase project and
Web3Auth verifier, so switching only one forks new accounts across the apps):

- `auth.keyDerivation: "sss"` in `learncard/config.json` and `vetpass/config.json`.
- LearnCard: `auth.sss.escrowEnclaveMode: "nitro"` and a nonzero
  `features.escrowRolloutPercent`, in the same change, so migrated users are
  enrolled and prompted for a PIN (only after step 9 and the ROLLOUT.md gates).
- Push native stragglers with the force-update message: binaries that miss the
  OTA stay on Web3Auth, which forks only accounts created after the switch.

## Rollback

Switching config back to `web3auth` is safe for every legacy and migrated
account (same key). It is **not** safe for accounts created after the switch:
their random keys cannot be derived by Web3Auth, so they would get a new, empty
DID. Treat config rollback as an incident tool for the first hours only, and
fix forward after that.

## Dormant accounts

Accounts that never sign in again stay on Web3Auth; nothing can migrate them
without their sign-in. Keep Web3Auth live and email inactive users to sign in
before Web3Auth's end date: signing in runs the normal migration and PIN prompt,
with no 7-day hold. Server-side migration was rejected: it would put two of
three shares at rest on the server. Decide what happens to accounts still
unmigrated at the end date once Web3Auth gives one.

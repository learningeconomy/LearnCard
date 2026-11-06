# Brain Service

This service exposes the LearnCard Network API and local Neo4j-backed skills flows.

## Recoverable claim links

`boost.claimBoostWithLink` accepts an optional `requestId`; `boost.claimBoostWithLinkStatus` reconciles the same authenticated recipient, Boost URI, challenge, and request ID. SDK consumers call `getClaimBoostWithLinkStatus`. Deploy this POST producer before an app that requires the status procedure; existing two-argument SDK claims remain supported.

- A durable `ClaimLinkRequest` reserves one operation per context. Temporary Profile and request-node write locks serialize reservations without persistent counters or lock properties. Without the optional uniqueness index, concurrent `MERGE` statements can duplicate even the same request ID; holding the Profile write lock through reservation preserves one owner. A deterministic credential ID and explicit Neo4j transaction keep credential, Boost instance, and sent relationship together.
- A completed receipt returns the original credential URI before checking current link availability. Generation-scoped Redis replay sets and capacity are atomically updated; the replay set lives for the full live generation lifetime, including non-expiring links, and is removed on invalidation/exhaustion. Exhausted evidence is retained 30 days; missing evidence means unavailable, not invented expiration. Corrupt live cache values are uncertain errors and are never classified as expired.
- An active or uncertain operation without a provable result remains `pending`. There is no age-based takeover or blind re-signing. Definitive failures before the atomic credential storage entry can release the reservation; an uncertain commit cannot. Operators must reconcile pending work rather than retry issuance. Same-operation singleflight is supported; the existing `totalUses` setting remains a soft limit across different operations and does not reserve issuance capacity.
- Legacy two-argument claims return their established credential URI even if subsequent usage accounting fails; they have no receipt to safely reconcile an error-driven retry. Request-aware claims keep accounting failures recoverable through their durable receipt instead.
- Definite issuance rejection records a correlated `FAILED` activity. A request-aware operation with uncertain storage does not record terminal failure. Cleanup and activity-reporting failures cannot replace the original issuance error; route diagnostics and activity metadata use controlled stage labels rather than credential or signing-authority payloads.
- Invalidating an already absent link preserves confirmed expired/exhausted evidence, including when the last accepted claim wins the invalidation race.

Collection indexing is still a separate, user-authenticated LearnCloud write. A successful network claim does not prove that collection saving or display refresh succeeded.

Focused checks from this directory: `bun run test -- src/cache/claim-links.test.ts src/helpers/boost-storage.helpers.test.ts src/accesslayer/credential/create.test.ts`. `bunx vitest run --config vitest.claim-links.config.ts` exercises receipt recovery and concurrency against its own disposable Neo4j container and requires Docker.

## Live consent data for AI consumers

`getConsentedDataForDid` returns data from live grants and authorized one-time grants (`oneTime: true`, stored with `status: 'consumed'`) between the authenticated contract owner and the requested profile. Pending and suspended updates retain reads under the user's previously accepted version; they do not enable newly requested data, writes, AutoBoosts, or synchronization. Withdrawn grants and consumed grants without the one-time flag are excluded. Term, contract and category expirations are enforced; empty expiry values mean no expiry, while malformed nonempty dates never authorize access. One-time means a fixed sharing grant, not a destructive read-once API; withdrawal still revokes subsequent retrieval. Malformed legacy terms are omitted rather than authorizing data or failing every grant in the response.

- `termsUri`, `contractUri`, `status` and `terms` identify the current grant and its permissions.
- `createdAt` is the original grant time when known. `date` is the latest consent update time. No historical timestamp is invented.
- `contractUpdatedAt` identifies the current contract revision; `contractExpiresAt` and `reasonForAccessing` report existing contract metadata. These fields do not imply acceptance of a new privacy notice.
- `guardian.required` uses LearnCard's existing manager-based guardian rules for non-service profiles and explicitly typed children, including authorized role-based managers. An explicit `child` type takes precedence over a legacy service flag. A service profile's managers are otherwise administrators, not guardians. Explicit approval metadata and persisted guardian approval history still require approval, including after manager removal or a change to service-profile status.
- `guardian.approved` requires a recorded approval for the current contract revision and a guardian who is still an authorized manager. Approval is server-recorded alongside the exact consent terms and transaction; it is not accepted from client-supplied terms. Raw approval presentations are not retained.

Existing adult and managed service-profile grants remain eligible without new guardian or privacy-notice attestations unless they have guardian approval history. Existing managed non-service-profile grants without recorded approval return `required: true, approved: false` and need a guardian-confirmed consent update. Consumers must enforce that distinction before AI processing; receipt metadata alone is not an authorization check.

Removing all managers is not an adulthood transition. Guardian approval history survives withdrawal, so withdrawing and consenting again does **not** remove the requirement. Recovery first requires current manager authority: the existing verified-contact / `inbox.claimPendingGuardianLinks` flow can relink a guardian only when their verified email matches an eligible guardian-approved inbox credential for that child. Without that evidence, account/guardian-link recovery is a prerequisite; there is no generic self-service existing-child manager restoration or adult-conversion endpoint here. After authority is restored, obtain fresh approval to update live terms or reconsent withdrawn terms.

Guardian presentations retain a maximum five-minute signed lifetime. The backend permits up to 60 seconds of issuance clock skew, but never accepts a presentation whose signed expiry has passed. The client aligns its cache to the signed expiry and stops reusing it 60 seconds early; final submission rechecks approval after credential preparation. Verification still requires a valid JWS, no verification errors, matching signer/holder/claimed identity, child identity, and current manager authority. Nonfatal verifier warnings do not independently reject a valid approval; diagnostic logs contain fixed reason categories, not presentations or identities. This is LearnCard's existing guardian policy, not a new legal-guardianship determination.

Deploy this producer before an AI Passport consumer that requires the new guardian metadata.

## Managed service profiles and children

`createManagedProfile` supports service profiles for developer/org onboarding and admin tools. It rejects `isServiceProfile: true` when the authenticated manager has a persisted parent Boost with category `Family`, or the requested profile has type `child`. Family child creation cannot use that flag to bypass guardian checks; other managed org creation remains supported.

Share-link policy exempts persisted service owners from management and birthdate restrictions **for tracking only**, in both preflight and the transactional recheck. An explicit `child` type always keeps child protections, even if a legacy record also has the service flag; the service flag is age-exempt, not an assertion of adulthood. Personal profiles with missing or malformed birthdates and managed non-service owners remain restricted. Default expiry still uses persisted age and management: managed service profiles keep a 30-day default, including those with an adult birthdate. Explicit null or date expiry, AI gates and other privacy settings are unchanged. Existing links retain their stored policy until an explicit edit rechecks current eligibility; this also refreshes older resolved service snapshots, without changing stored expiry. Reserved and freshly checked eligibility must both permit tracking, so a stale replay or recovery cannot broaden a restricted reservation. Creating a fresh link also applies the exemption.
Guardian-gated writes and consent metadata likewise exempt only service profiles that are not explicitly typed as children. A persisted service-flagged child cannot change its type through profile updates.

## Skill framework seeding

- **Auto-bootstrap**: on local/dev startup, if no `SkillFramework` nodes exist, the service seeds a default public set owned by the `network-seed` profile.
- **Disable auto-bootstrap**: set `SKIP_SKILL_FRAMEWORK_SEED=true`.
- **Re-seed manually**: run `bun run skill-frameworks seed [local|staging]` from `services/learn-card-network/brain-service`.
- **Add an admin**: run `bun run skill-frameworks add-admin [local|staging]` and enter the profile id when prompted.
- **Default environment**: if you omit the stage, the command defaults to `local` and prints a note.
- **Production safety**: the manual seed command still refuses to run in production unless `--force` is provided.

## Sample persona seeding

Sample personas are ordered credential-library bundles published as idempotent
consent-flow contracts. The seeder uses every target value from
`services/learn-card-network/brain-service/.env`; verify them before running it.
Do not overwrite an existing `.env` or assume it points to local services.

For the local LearnCard App Compose stack, use explicit host-side values:

```dotenv
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=this-is-the-password
MONGO_URI=mongodb://localhost:27017/?replicaSet=rs0
MONGO_DB_NAME=lca-api
REDIS_HOST=localhost
REDIS_PORT=6379
DOMAIN_NAME=localhost%3A4000
DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT=http://localhost:5100/api
# Disposable local-only seed. Never reuse this value in a shared environment.
DEMO_PERSONA_SA_SEED=dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
```

Start the stack, then publish the bundle from `apps/learn-card-app`:

```bash
bun run seed:demo-persona student
```

Staging and production require their own secret 64-character hexadecimal
`DEMO_PERSONA_SA_SEED`, the matching LCA API endpoint, and explicit Neo4j, MongoDB,
Redis, and domain settings. Deploy the brain service first, run the seeder against
the intended environment, verify the printed contract URI, and only then deploy app
configuration that references it.

The root seed deterministically derives a distinct signing identity for every
configured sample issuer. The command updates issuer profiles, unsigned credential
templates, and auto-boost relationships in place, then prints the stable contract URI
to record in that tenant's `features.samplePersonas`. Running it again publishes
credential-library content changes without duplicating profiles, Boosts, signing
authorities, or contracts.

## Notes

### Managed public status repair

An issuer can call `credentialRefresh.attachStatusEntries({ refreshId, credentialStatus })`
with the original signed credential's exact status descriptor. Object versus array shape,
array order, and all descriptor fields must match the stored HMAC. The route validates
local issuer-owned coordinates and reconciles an existing revocation or suspension.
Credentials without supported public status entries cannot be repaired this way.

New status fingerprints use `<keyVersion>:<base64url HMAC-SHA256>`. Configure
`CREDENTIAL_REFRESH_DIGEST_KEY_VERSION` (default `v1`) with
`CREDENTIAL_REFRESH_DIGEST_SECRET`. `CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS` is a JSON
object mapping retained versions to their secret keys (default `{}`). Unversioned legacy
fingerprints accept the current key or an explicitly retained previous key. Never log these
secrets. Removing a previous key disables repair for fingerprints made with that key.

Lifecycle mutations join the relationship update and status-list signing/write in one
Neo4j transaction. A failed bit write rolls back the relationship, including unsuspension;
retry the original mutation. No pending-sync worker is needed for these atomic writes.

Managed versions share one status binding. Ordinary deliveries reserve their local
coordinates under the same list locks and cannot reuse a managed credential's index.
Binding and lifecycle writes lock the root, aggregate, then sorted status lists;
attaching coordinates to an existing root also reconciles its lifecycle atomically.
Legacy deliveries without public status metadata retain network-only lifecycle state;
repair requires supported entries authenticated by the original status fingerprint.

- The default fixture is idempotent by framework and skill ID, so running the seed command multiple times does not duplicate data.
- Seeded skills are compatible with the existing skill search, boost alignment, and OBv3 alignment flows.

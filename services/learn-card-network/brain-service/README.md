# Brain Service

This service exposes the LearnCard Network API and local Neo4j-backed skills flows.

## Live consent data for AI consumers

`getConsentedDataForDid` returns data from live grants and authorized one-time grants (`oneTime: true`, stored with `status: 'stale'`) between the authenticated contract owner and the requested profile. Withdrawn grants and other stale grants are excluded. Term, contract and category expirations are enforced; empty expiry values mean no expiry, while malformed nonempty dates never authorize access. One-time means a fixed sharing grant, not a destructive read-once API; withdrawal still revokes subsequent retrieval. Malformed legacy terms are omitted rather than authorizing data or failing every grant in the response.

- `termsUri`, `contractUri`, `status` and `terms` identify the current grant and its permissions.
- `createdAt` is the original grant time when known. `date` is the latest consent update time. No historical timestamp is invented.
- `contractUpdatedAt` identifies the current contract revision; `contractExpiresAt` and `reasonForAccessing` report existing contract metadata. These fields do not imply acceptance of a new privacy notice.
- `guardian.required` uses LearnCard's existing manager-based guardian rules, including authorized role-based managers. Persisted guardian approval history keeps this requirement after manager removal.
- `guardian.approved` requires a recorded approval for the current contract revision and a guardian who is still an authorized manager. Approval is server-recorded alongside the exact consent terms and transaction; it is not accepted from client-supplied terms. Raw approval presentations are not retained.

Existing adult grants remain eligible without new guardian or privacy-notice attestations. Existing managed-profile grants without recorded approval return `required: true, approved: false` and need a guardian-confirmed consent update. Consumers must enforce that distinction before AI processing; receipt metadata alone is not an authorization check.

Removing all managers is not an adulthood transition. Guardian approval history survives withdrawal, so withdrawing and consenting again does **not** remove the requirement. Recovery first requires current manager authority: the existing verified-contact / `inbox.claimPendingGuardianLinks` flow can relink a guardian only when their verified email matches an eligible guardian-approved inbox credential for that child. Without that evidence, account/guardian-link recovery is a prerequisite; there is no generic self-service existing-child manager restoration or adult-conversion endpoint here. After authority is restored, obtain fresh approval to update live terms or reconsent withdrawn terms.

Guardian presentations retain a maximum five-minute signed lifetime. The backend permits up to 60 seconds of issuance clock skew, but never accepts a presentation whose signed expiry has passed. The client aligns its cache to the signed expiry and stops reusing it 60 seconds early; final submission rechecks approval after credential preparation. Verification still requires a valid JWS, no verification errors, matching signer/holder/claimed identity, child identity, and current manager authority. Nonfatal verifier warnings do not independently reject a valid approval; diagnostic logs contain fixed reason categories, not presentations or identities. This is LearnCard's existing guardian policy, not a new legal-guardianship determination.

Deploy this producer before an AI Passport consumer that requires the new guardian metadata.

## Skill framework seeding

- **Auto-bootstrap**: on local/dev startup, if no `SkillFramework` nodes exist, the service seeds a default public set owned by the `network-seed` profile.
- **Disable auto-bootstrap**: set `SKIP_SKILL_FRAMEWORK_SEED=true`.
- **Re-seed manually**: run `bun run skill-frameworks seed [local|staging]` from `services/learn-card-network/brain-service`.
- **Add an admin**: run `bun run skill-frameworks add-admin [local|staging]` and enter the profile id when prompted.
- **Default environment**: if you omit the stage, the command defaults to `local` and prints a note.
- **Production safety**: the manual seed command still refuses to run in production unless `--force` is provided.

## Sample persona seeding

Sample personas are defined as ordered credential-library bundles. From
`apps/learn-card-app`, publish one as an idempotent consent-flow contract:

```bash
bun run seed:demo-persona student
```

The app command delegates to the brain-service seeder, which loads
`services/learn-card-network/brain-service/.env`. `NEO4J_URI`, the Neo4j credentials,
`MONGO_URI`, `MONGO_DB_NAME`, and `DOMAIN_NAME` select the target stack.
For staging or production, also supply `DEMO_PERSONA_SA_SEED` and
`DEMO_PERSONA_SIGNING_AUTHORITY_ENDPOINT`. The command updates the signed Hill Valley
High Boost templates and auto-boost relationships in place, then prints the stable contract
URI to record in that tenant's `features.samplePersonas`. Running it again publishes
credential-library content changes without duplicating profiles, Boosts, signing
authorities, or contracts.

## Notes

- The default fixture is idempotent by framework and skill ID, so running the seed command multiple times does not duplicate data.
- Seeded skills are compatible with the existing skill search, boost alignment, and OBv3 alignment flows.

# Brain Service

This service exposes the LearnCard Network API and local Neo4j-backed skills flows.

## Live consent data for AI consumers

`getConsentedDataForDid` returns data only from live grants between the authenticated contract owner and the requested profile. Term, contract and category expirations are enforced; empty expiry values mean no expiry, while malformed nonempty dates never authorize access.

- `termsUri`, `contractUri`, `status` and `terms` identify the current grant and its permissions.
- `createdAt` is the original grant time when known. `date` is the latest consent update time. No historical timestamp is invented.
- `contractUpdatedAt` identifies the current contract revision; `contractExpiresAt` and `reasonForAccessing` report existing contract metadata. These fields do not imply acceptance of a new privacy notice.
- `guardian.required` uses LearnCard's existing manager-based guardian rules, including authorized role-based managers. Persisted guardian approval history keeps this requirement after manager removal.
- `guardian.approved` requires a recorded approval for the current contract revision and a guardian who is still an authorized manager. Approval is server-recorded alongside the exact consent terms and transaction; it is not accepted from client-supplied terms. Raw approval presentations are not retained.

Existing adult grants remain eligible without new guardian or privacy-notice attestations. Existing managed-profile grants without recorded approval return `required: true, approved: false` and need a guardian-confirmed consent update. Consumers must enforce that distinction before AI processing; receipt metadata alone is not an authorization check.

Guardian presentations retain the existing five-minute UI approval scope. The backend verifies the signature, signer/holder/claimed identity, child identity, expiry and current manager authority. This is LearnCard's existing guardian policy, not a new legal-guardianship determination. The client only caches a successfully signed approval for its specific child and sends it only with that child's wallet requests.

Deploy this producer before an AI Passport consumer that requires the new guardian metadata.

## Skill framework seeding

- **Auto-bootstrap**: on local/dev startup, if no `SkillFramework` nodes exist, the service seeds a default public set owned by the `network-seed` profile.
- **Disable auto-bootstrap**: set `SKIP_SKILL_FRAMEWORK_SEED=true`.
- **Re-seed manually**: run `bun run skill-frameworks seed [local|staging]` from `services/learn-card-network/brain-service`.
- **Add an admin**: run `bun run skill-frameworks add-admin [local|staging]` and enter the profile id when prompted.
- **Default environment**: if you omit the stage, the command defaults to `local` and prints a note.
- **Production safety**: the manual seed command still refuses to run in production unless `--force` is provided.

## Notes

- The default fixture is idempotent by framework and skill ID, so running the seed command multiple times does not duplicate data.
- Seeded skills are compatible with the existing skill search, boost alignment, and OBv3 alignment flows.

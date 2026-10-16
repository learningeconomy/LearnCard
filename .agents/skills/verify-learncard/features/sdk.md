# LearnCard SDK

Developers use `@learncard/init` and its plugins to get a DID-backed wallet, issue and verify credentials and presentations, store encrypted data in LearnCloud, and send boosts over the LearnCard Network. The journey runs the **checkout source** (`--conditions=development`), so it verifies uncommitted SDK, plugin, type and route changes.

## Sub-features

- `sdk-identity`: `initLearnCard({ seed, network, cloud })` against the stack; after `createProfile` the DID contains this directory's allocated Brain port and profile handle, and another wallet resolves the profile.
- `sdk-issue-verify`: `prepareFixtureById('obv3/minimal-badge')` (credential-library) → `issueCredential` → `verifyCredential` has no errors and includes a `proof` check; a tampered copy produces errors.
- `sdk-presentation`: `newPresentation` → `issuePresentation` → another wallet's `verifyPresentation` has no errors.
- `sdk-cloud-roundtrip`: `store.LearnCloud.uploadEncrypted` → `index.LearnCloud.add` → `read.get(uri)` deep-equals the credential, and the index lists it.
- `sdk-boost-send-accept`: `createBoost` → `sendBoost` → the recipient's `getIncomingCredentials` → `acceptCredential` → `getReceivedCredentials`; Neo4j shows one `CREDENTIAL_SENT`→`CREDENTIAL_RECEIVED` with a null status (claimed); `getBoostRecipients` lists the recipient.

## How to get to it (user POV)

- A developer's Node/Bun code: `import { initLearnCard } from '@learncard/init'`. Methods live on `learnCard.invoke.*`, and DIDs come from `learnCard.id.did()`.

## Driving it with lc verify

Preconditions:

- Doctor ok. Brain, LearnCloud and LCA endpoints come from `v.stack`; fixed dev/e2e ports are not this directory's endpoints.

- **Run.** `$LCV run sdk --dir /tmp/lcv` → `sdk: passed`; `sdk/NNN-sdk-signed-credential.json` and `NNN-sdk-boost-graph.json` are evidence.
- **Your new method.** `$LCV script -e 'const lc = await v.sdk(v.actors.issuer); return await lc.invoke.<yourMethod>(…);' --dir /tmp/lcv`. Assert the effect from a second wallet (`v.sdk(v.actors.recipient)`) or `v.db.neo4j(…)`.
- **Graph check by hand.** `$LCV db --dir /tmp/lcv neo4j "MATCH (a:Profile)-[:CREDENTIAL_SENT]->(c)-[r:CREDENTIAL_RECEIVED]->(b:Profile) RETURN a.profileId, b.profileId, r.status LIMIT 10"`.

## Gotchas

- Run under `lc verify`, or `bun --conditions=development`. Plain `bun` or `node` resolves `dist/`, which may be stale (the DIDKit `dist` WASM can lag `src/didkit/pkg`).
- Local boosts aren't in the production trust registry. The harness passes a `trustedBoostRegistry` data URL that trusts only this owned stack's Brain DID (`v.stack.brainDid`).
- Cypher `collect()` drops nulls, so count null statuses with `sum(CASE WHEN r.status IS NULL …)`.
- The app files credentials by `achievementType` (`CATEGORY_MAP`), not by `createBoost`'s `category`: `Badge` → Social Badge.

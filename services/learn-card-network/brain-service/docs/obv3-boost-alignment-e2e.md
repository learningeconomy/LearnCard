# OBv3 Boost Alignment Injection E2E Test – Context and Handoff

Last updated: 2025-08-13 11:33:31 -07:00

## Goal
Implement an end-to-end integration test that verifies OBv3 skill alignment data is injected into boost credentials when issuing via `sendBoostViaSigningAuthority`. The test should seed a skill framework and skills, link them to a boost and issuing profile, register a signing authority, issue the boost, assert that alignments are present in the issued credential, and validate Neo4j relationships.

## Key Code References
- Routes
  - `src/routes/boosts.ts` → `sendBoostViaSigningAuthority` input and logic (injects alignments, issues via SA, sends): lines ~1808–1938
- Skills provider (injection)
  - `src/services/skills-provider/inject.ts` → `injectObv3AlignmentsIntoCredentialForBoost(credential, boost)`: builds OBv3 alignments from boost’s `USES_FRAMEWORK` + `ALIGNED_TO`
  - `src/services/skills-provider/providers/dummy.ts` → in-memory provider for tests; `seedFramework`, `seedSkills`, `buildObv3Alignments`
  - `src/services/skills-provider/index.ts` → exposes provider and test utils as `__skillsProviderTestUtils`
- Boost relationships (Neo4j)
  - `src/models/Boost.ts` → relationships: `usesFramework` (→ `SkillFramework`), `alignedTo` (→ `Skill`)
  - `src/accesslayer/boost/relationships/read.ts` → `getFrameworkUsedByBoost`, `getAlignedSkillsForBoost`
- Skill and Framework access layer
  - `src/accesslayer/skill-framework/create.ts` → creates/upserts framework from provider and links issuing profile via `MANAGES`
  - `src/accesslayer/skill/create.ts` → `createSkill(frameworkId, input, parentId?)` and link to framework via `CONTAINS`, optional `IS_CHILD_OF`
- Test helpers
  - `test/helpers/send.ts` → `testUnsignedBoost` (OBv3 context + Achievement subject), boost sending helpers
  - `test/helpers/getClient.ts` → users/clients with scopes
  - `test/helpers/test-cleanup.helpers.ts` → `cleanupLearnCardInstances(...instances)` to stop lingering LearnCard connections
- Existing patterns
  - `test/boosts.spec.ts` shows registering a signing authority and issuing boosts
  - `test/skill-frameworks.spec.ts` seeds provider and validates framework linkage to profiles

## How Alignment Injection Works (at issuance)
1. `sendBoostViaSigningAuthority` fetches the boost by URI and parses its VC template to an unsigned VC.
2. Sets issuer/subject DIDs, timestamps, and adds `boostId` for Boost credentials.
3. Calls `injectObv3AlignmentsIntoCredentialForBoost(unsignedVc, boost)`:
   - Reads boost’s `USES_FRAMEWORK` and `ALIGNED_TO` skills via Neo4j.
   - Uses the active skills provider to `buildObv3Alignments(frameworkId, skillIds)`.
   - Injects alignments into `credentialSubject.achievement.alignment[]` if present; otherwise `credentialSubject.alignment[]`.
4. Issues the VC via the requested Signing Authority and sends it to the recipient.

## Test Plan (single E2E spec)
Create `test/boost-obv3-alignments.spec.ts` and cover the happy path plus basic guards. Suggested outline:

1. Setup (beforeAll / beforeEach)
   - Create users with 64-char seeds, e.g. `'a'.repeat(64)`, `'b'.repeat(64)`.
   - Create profiles: `userA` (issuer) and `userB` (recipient).
   - Register Signing Authority for `userA` using `profile.registerSigningAuthority` (endpoint: `http://localhost:5000/api`, name: `mysa`, did as per existing tests).
   - Provider seeding:
     - `__skillsProviderTestUtils.seedFramework({ id: FW_ID, name, description, sourceURI })`.
     - `__skillsProviderTestUtils.seedSkills(FW_ID, [ { id: S1, statement, code, type, ... }, ... ])`.
   - Link framework to issuer’s profile using route: `userA.clients.fullAuth.skillFrameworks.create({ frameworkId: FW_ID })`.

2. Graph nodes and relationships
   - Create the Boost (default status is LIVE):
     - `const boostUri = await userA.clients.fullAuth.boost.createBoost({ credential: testUnsignedBoost });`
   - Create graph Skill nodes to match seeded provider skills:
     - Use `createSkill(FW_ID, { id, statement, code, description?, status? }, parentId?)` for each skill you plan to align to.
   - Relate Boost to Framework and Skills in Neo4j:
     - Fetch boost instance by ID:
       - Parse `id` from `boostUri`. You can use `getIdFromUri(boostUri)` from `@helpers/uri.helpers` or `boostUri.split('/')` as a fallback.
       - `const boost = await Boost.findOne({ where: { id } });`
     - `await boost!.relateTo({ alias: 'usesFramework', where: { id: FW_ID } });`
     - For each skill ID `sid` aligned to the boost:
       - `await boost!.relateTo({ alias: 'alignedTo', where: { id: sid } });`

3. Issue via Signing Authority
   - `const credentialUri = await userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({ profileId: userB.profileId, boostUri, signingAuthority: { name: 'mysa', endpoint: 'http://localhost:5000/api' } });`
   - Optionally: `await userB.clients.fullAuth.credential.acceptCredential({ uri: credentialUri });`

4. Assertions
   - Resolve issued VC and verify alignments:
     - `const vc = await userB.clients.fullAuth.storage.resolve({ uri: credentialUri });`
     - If the subject has `achievement`, expect `vc.credentialSubject.achievement.alignment` to:
       - Be an array with length equal to aligned skills count.
       - Contain objects shaped like provider’s `Obv3Alignment`:
         - `targetCode` (skill `code` or ID)
         - `targetName` (skill `statement`)
         - `targetDescription` (optional)
         - `targetUrl` (undefined unless provider configured with `baseUrl`)
         - `targetFramework` (framework `name`)
   - Validate Neo4j relationships still present:
     - `const fw = await getFrameworkUsedByBoost(boost!); expect(fw?.dataValues?.id ?? fw?.id).toBe(FW_ID);`
     - `const skills = await getAlignedSkillsForBoost(boost!); expect(skills.map(s => s.dataValues?.id ?? (s as any).id)).toEqual(expect.arrayContaining([S1, S2]));`

5. Cleanup
   - Clear created nodes between tests (or in afterAll): `Skill.delete`, `SkillFramework.delete`, `Boost.delete`, `Profile.delete`, `SigningAuthority.delete` with `{ detach: true, where: {} }` as used in other specs.
   - Always call `cleanupLearnCardInstances(userA.learnCard, userB.learnCard, ...)` in `afterAll` (or `afterEach`) to prevent lingering connections per prior suite fixes.

## Notes and Pitfalls
- Provider vs Graph: Seeding provider data does NOT create Neo4j `Skill` nodes. Create Skills in Neo4j (via `createSkill`) before relating the boost.
- Boost Status: Default is `LIVE` (`src/accesslayer/boost/create.ts` sets `status = BoostStatus.enum.LIVE`). The SA send route forbids sending `DRAFT` boosts.
- Relationship Aliases: Use `usesFramework` and `alignedTo` (exact aliases from `models/Boost.ts`).
- Alignment Target: Injection prefers `credentialSubject.achievement.alignment[]`; falls back to `credentialSubject.alignment[]`.
- Signing Authority: Must exist for the issuer profile and be retrieved by exact `endpoint` + `name`. Tests commonly use endpoint `http://localhost:5000/api` and name `mysa`.
- Test Cleanup: Use `test/helpers/test-cleanup.helpers.ts` per prior memory to avoid post-test async errors.

## Suggested Test Cases
- Happy path (described above).
- No framework linked: issuance succeeds, no alignments injected.
- Framework linked but no `ALIGNED_TO` skills: issuance succeeds, no alignments injected.
- Multiple subjects (array): injection applied to each subject.
- Pre-existing `achievement.alignment`: injection appends and retains existing entries.

## Useful Imports (tests)
- Models: `import { Boost, Profile, SkillFramework, Skill } from '@models';`
- Accesslayer: `import { createSkill } from '@accesslayer/skill/create';`
- Read helpers: `import { getFrameworkUsedByBoost, getAlignedSkillsForBoost } from '@accesslayer/boost/relationships/read';`
- Provider tests: `import { __skillsProviderTestUtils } from '@services/skills-provider';`
- Helpers: `import { getIdFromUri } from '@helpers/uri.helpers';`
- Clients: `import { getUser } from './helpers/getClient';`
- VC fixture: `import { testUnsignedBoost } from './helpers/send';`
- Cleanup: `import { cleanupLearnCardInstances } from './helpers/test-cleanup.helpers';`

## Next Steps for the Implementer
- Create `test/boost-obv3-alignments.spec.ts` following the plan above.
- Reuse existing patterns for auth, SA registration, and cleanup from `test/boosts.spec.ts` and `test/skill-frameworks.spec.ts`.
- Keep assertions concise and deterministic (avoid relying on provider `baseUrl` unless configured).
- Run the single spec first to validate, then integrate into the full test suite.

If anything is unclear or you need deeper pointers (e.g., how to extract a boost ID from a URI in this monorepo), check similar usages in `test/boosts.spec.ts` and utility helpers in `src/helpers`.

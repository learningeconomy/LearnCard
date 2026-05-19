---
"@learncard/network-brain-service": patch
---

fix: [LC-1864] AI Pathways "My Skill Profile" finish step throws "Credential does not match boost template."

`getBoost` was passing the raw URI-derived domain (e.g. `localhost%3A3000/trpc`) when injecting OBv3 alignments into the boost template. `sendBoost`'s certify path verifies the issued credential against re-computed alignments using `ctx.domain` (e.g. `localhost%3A3000`), which has no `/trpc` suffix.

That asymmetry meant alignment `targetUrl` values differed by a `/trpc` path segment, so `lodash.isEqual` on `credentialSubject.achievement` failed and `verifyCredentialIsDerivedFromBoost` returned false. The regression dates to [#1094 LC-1553 Federation Updates](https://github.com/learningeconomy/LearnCard/pull/1094) (April 2026), which added the `/trpc` suffix to constructed boost URIs without updating the alignment-injection callsite.

Fix: strip the `/trpc` suffix from the URI-derived domain in `getBoost` before passing it to `injectObv3AlignmentsIntoCredentialForBoost`, so the inject-time domain matches the verify-time domain. Added a regression test (`test/lc-1864-sas-skill-profile.spec.ts`) that exercises the SAS skill-profile finish flow with multiple aligned skills.

No client-side changes required.

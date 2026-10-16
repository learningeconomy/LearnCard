# ConsentFlow

A partner defines a data-sharing contract. A learner reviews exactly what's requested and consents in the app. The partner can then read the consented data and write credentials back. The partner-side code is the published guide's own snippets (`docs/snippets/consentflow/*.mjs`).

## Sub-features

- `consent-partner-contract`: the partner SDK calls `createContract` (read: name and Achievements; write: Achievements), and `verifyConsent` is false beforehand. A unique, genuinely signed input Achievement is seeded into the learner's encrypted LearnCloud wallet/index before consent.
- `consent-app-door`: the learner saves a unique nonempty **Full Name** through **Account Settings** (corroborated through the profile SDK), opens `/consent-flow?uri=<contractUri>`, sees the contract heading and subtitle, and chooses **Continue as <name>**.
- `consent-app-accept`: the request dialog opens **Privacy & Data**. The learner turns **Anonymize** off, explicitly shares **Name**, opens **Achievements**, chooses **Selective Sharing**, and selects the unique input credential with its check button. The UI must show **Sharing 1/1**, then **Back** → **Accept** closes the dialog.
- `consent-partner-reads`: `verifyConsent` turns true. The docs' `readUserData(lc, learnerDid, contractUri)` must return exactly one live record for that exact contract, with the exact saved Name in both personal data and terms, anonymization off, Achievement sharing on, and live sync off. Exactly one Achievement URI must match both the saved terms and the selected input's audience-copy index mapping. The partner decrypts that URI, requires full equality with the seeded signed credential, and verifies its proof without errors.
- `consent-partner-issues`: the docs' `issueThroughContract` returns an exact URI present in the learner's incoming or received credentials. The learner resolves it and asserts the tutorial name/description, partner issuer DID, learner subject DID, network boost ID, and successful proof verification without errors. This proves SDK delivery, not UI claiming.

## How to get to it (user POV)

- A partner site links to `https://learncard.app/consent-flow?uri=<contractUri>&returnTo=…`; verification uses the allocated app origin from `doctor` with the same route.
- In-app: Apps (`/launchpad?uri=<contractUri>`) opens the same consent screen.

## Driving it with lc verify

Preconditions:

- Doctor ok.

- **Run.** `$LCV run consent-flow --dir /tmp/lcv` → passed; `NNN-consent-records.json` holds the actual consent records. Report observations include the shared Name, input/shared credential URIs, unique Achievement title, and read/write proof checks; they do not include seeds or private keys.
- **Personal details.** **Open profile** → **Account Settings** → **Full Name**; the real form also requires an adult date of birth → **Save**. The name must persist in the network profile.
- **Door.** `getByRole('heading', { name: <contract name> })` → `getByRole('button', { name: /^Continue as / })`.
- **Select and accept.** The request dialog opens **Privacy & Data** (`consent-privacy-and-data`). Its Anonymize IonToggle is located within its labelled row; the Name and Achievements controls are buttons. **Selective Sharing** displays the actual indexed input card. Scope `.boost-generic-card-wrapper` by that credential's title and click its unnamed sibling check button: clicking the named card body opens details instead of selecting it. The category editor's unlabelled toolbar back button saves the selection. The outer **Back** saves terms before **Accept**.
- **Partner side.** `readUserData` and `issueThroughContract` are statically imported straight from `docs/snippets/consentflow/` and run against the stack. Empty Name/data, unselected credentials, wrong-contract records, content mismatches, or failed/missing proof checks fail the journey.

## Gotchas

- `create-contract.mjs` requires an https `RETURN_TO`; the journey builds the same contract without a redirect, so the app stays put after **Accept**.
- **Privacy & Data** covers only anonymization off, explicit Name sharing, and one selected Achievement. Other categories, live sync, expiry, child accounts ("That's me!" + PIN), game-flow redirects, and withdrawal aren't covered. `apps/learn-card-app/tests/consent-flow.spec.ts` has broader UI recipes.
- The contract personal field is `Name` (capitalized), matching the app's personal-field keys.
- The Name button includes the profile image's accessible text; match the `Name Hidden` / `Name Share` suffix rather than assuming those are the entire names. `getProfile()` without a profile ID returns the SDK's cached self profile; use `getProfile(learner.profileId)` to corroborate an edit made in the browser.
- Saving Account Settings publishes the same wallet's updated self profile to the exact identity-scoped query key and awaits durable persistence before navigation. Browser cache reads and writes stay on localforage even after SQLite initializes. This preserves normal five-minute query caching instead of forcing self-profile refetches on every mount. Keep the exact saved-name assertion: a generic "Continue as" assertion would miss a stale restored profile.
- Consent creates an audience-encrypted copy, not the input's original storage URI. The journey checks the exact copy URI in terms and the source credential's `sharedUris` mapping, then decrypts it as the partner and compares the entire credential.
- Write delivery accepts either pending or received SDK state; it does not claim to exercise the learner's claim UI, write revocation, or status-list lifecycle.

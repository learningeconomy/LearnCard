# SDK issuer → app learner

The core issuer story: an organization's backend (SDK) sends a badge to a LearnCard user, who claims it in the app and sees it in their Passport, and the organization can see that it was claimed.

## Sub-features

- `cross-sdk-send`: `createBoost` (achievementType `Badge`) and `sendBoost(learnerHandle)` from an SDK wallet.
- `cross-app-claim`: the learner's `/notifications` → **Claim** → group with the title → **Accept** → **Skip for Now** on the connect prompt.
- `cross-app-wallet-detail`: after a reload, Passport → **Badges** → the title opens with a resolved issuer. The learner's independent SDK resolves exactly one persisted indexed credential with that title, requires its URI to equal the SDK-sent credential URI, checks the issuer and learner subject DIDs, and verifies the signature.
- `cross-sdk-observes-claim`: the issuer's `getBoostRecipients(boostUri)` lists the learner, and Neo4j shows the receipt claimed (null status).

## How to get to it (user POV)

- An issuer's server code calls the SDK. The learner sees a bell badge, opens Alerts, and claims.

## Driving it with lc verify

Preconditions:

- Doctor ok.

- **Run.** `$LCV run sdk-to-app --dir /tmp/lcv` → passed; `NNN-cross-graph.json` shows `received, claimed` = `1, 1`.
- **Claim UI.** Same locators as the peer claim in [credentials](credentials.md).
- **Same-artifact proof.** After the reloaded app detail is visible, the learner's independent SDK reads `index.LearnCloud.get()` and resolves the stored URIs with `read.get`. Exactly one credential must have the UI title, its indexed URI must equal `sendBoost`'s result, its issuer must be the SDK issuer's DID, and its sole subject must be the learner's DID. `verifyCredential` on this exact credential must return `errors: []` and include `proof` in `checks`. The `cross-stored-credential-proof` JSON artifact and `storedCredential` observations preserve the index ID, URI, DIDs, and verification result. These reads do not perform acceptance; only the UI does. The issuer recipient list and read-only Neo4j receipt remain additional corroboration, not substitutes for signature or index persistence.

## Gotchas

- Use achievementType `Badge` so the credential lands in **Badges**. Other types file under other Passport categories (Achievements, Studies, …), and `openStoredBadge` would look in the wrong place.
- The issuer isn't connected to the learner, so the post-accept `Connect with …?` prompt always appears.

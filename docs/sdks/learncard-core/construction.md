---
description: Wallet SDK methods, signatures, return values, and executable examples grouped by task.
---

# Methods

Use `learnCard.invoke.<method>` for plugin methods and `learnCard.id`, `read`, `store`, or `index` for control planes. Each section names the required stack: `initLearnCard()` for verification only, `{ seed }` for local signing and LearnCloud, `{ seed, network: true }` for network operations, or `initLCALearnCard` for hosted signing-authority creation. Import initialization functions from `@learncard/init`; return types below describe resolved values (await promises), except synchronous methods explicitly noted.

The examples require Node.js 20+, `@learncard/init`, and a securely generated 32-byte seed encoded as 64 hexadecimal characters in `SECURE_SEED`. Save a snippet as its named `.mjs` file and run it with `node --env-file=.env <filename>`. Never log or commit the seed. Each runnable block is embedded from a snippet covered by `docs-methods.spec.ts`; the claim-hook shape is illustrative, not executable.

For network examples, use a dedicated test identity. `PROFILE_ID` is your unique public handle; `OTHER_PROFILE_ID` is a second existing profile you control. Run the Profiles example first for connections, sending, templates, metadata, and grants. Identity and verification do not require a network profile; the default DIDKit loader may still fetch its WASM binary. Network examples use the public endpoints unless you configure a different network and cloud.

## Initialize

Choose the smallest stack your application needs. These are initialization forms, not `invoke` methods; see [`initLearnCard` options](README.md#initlearncard-options) and [Initialization & Authentication](authentication.md) for configuration details.

| Form / option                               | Purpose                                                                 | Returns                      |
| ------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| `initLearnCard()`                           | Verify without private keys                                             | Verification-only LearnCard  |
| `initLearnCard({ seed })`                   | Identity, local signing, templates, LearnCloud                          | Seed-based LearnCard         |
| `initLearnCard({ seed, network: true })`    | Add profiles, exchange, boosts, and consent                             | Network LearnCard            |
| `initLearnCard({ seed, didWeb })`           | Sign as a published `did:web` identity                                  | DID Web LearnCard            |
| `initLearnCard({ vcApi })`                  | Connect to a VC API; `true` selects its default, a string selects a URL | VC API LearnCard             |
| `initLearnCard({ custom: true })`           | Start without plugins; compose your own stack                           | Empty LearnCard              |
| `guardianApprovalGetter`                    | Optional network callback for guardian approval                         | Passed to the network plugin |
| `initLCALearnCard({ seed, network: true })` | Add LearnCard App API capabilities                                      | LCA LearnCard                |

Keep a seed stable to retain the same identity. A `didWeb` setting does not publish its DID document for you. With a custom stack, a method is available only after its provider and dependencies have been added.

## Identity

**Stack: `{ seed }`.** Read an identity or construct a test credential; these methods do not create a network profile. `id.keypair()` contains private material, so only print public metadata such as `kty` and `crv`.

| Method       | Signature summary                                       | Returns              |
| ------------ | ------------------------------------------------------- | -------------------- |
| `id.did`     | `(method?, options?)`; synchronous, e.g. method `'key'` | DID string           |
| `id.keypair` | `(algorithm?, options?)`; synchronous                   | JWK with private key |
| `getTestVc`  | `(subject?)`; synchronous                               | Unsigned VC          |
| `getTestVp`  | `(credential?)`                                         | Unsigned VP          |

The network plugin can make a profile DID the default. Request `'key'` explicitly when you need the seed identity rather than the profile identity.

<!-- snippet: methods/identity.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(learnCard.id.did('key').startsWith('did:key:'));
const { kty, crv } = learnCard.id.keypair();
assert.equal(kty, 'OKP');
assert.equal(crv, 'Ed25519');
console.log('did: did:key');
console.log(`keypair: ${kty} ${crv}`);
```

<!-- /snippet -->

Expected output: `did: did:key`, then `keypair: OKP Ed25519`. The full keypair is deliberately not logged.

## Credentials

**Stack: `{ seed }` to issue; `initLearnCard()` to verify.** Create unsigned templates, sign credentials or presentations, and inspect verification results. A successful cryptographic check does not by itself establish that you trust the issuer or the claims.

| Method                                | Signature summary                             | Returns                                                 |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| `newCredential`                       | `({ type, ...templateFields }?)`; synchronous | Unsigned VC                                             |
| `issueCredential`                     | `(credential, signingOptions?)`               | Signed VC                                               |
| `verifyCredential`                    | `(credential, options?)`                      | `VerificationCheck` with `checks`, `warnings`, `errors` |
| `verifyCredential` (LearnCard plugin) | `(credential, options, true)`                 | Prettified `VerificationItem[]`                         |
| `newPresentation`                     | `(signedCredential, { did }?)`                | Unsigned VP                                             |
| `issuePresentation`                   | `(unsignedPresentation, signingOptions?)`     | Signed VP                                               |
| `verifyPresentation`                  | `(presentation, options?)`                    | `VerificationCheck`                                     |

Template types are `basic`, `achievement`, `jff2`, `boost`, `boostID`, and `delegate`; their fields differ. `achievement` produces an Open Badges 3.0 credential. Pass a presentation, not a bare credential, to `issuePresentation`: first use `newPresentation` to wrap the signed credential.

The LearnCard plugin's third `verifyCredential` argument defaults to `false`. With `true`, the result is an **array**, not an object with an `errors` field. Use the raw result for programmatic decisions and prettified items for display.

<!-- snippet: methods/issue-verify.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const unsigned = learnCard.invoke.newCredential({
    type: 'achievement',
    did: learnCard.id.did('key'),
    subject: learnCard.id.did('key'),
    name: 'Methods Reference',
    achievementName: 'Verified a credential',
    description: 'Issued and verified an Open Badge.',
    criteriaNarrative: 'Run the methods example.',
});
const credential = await learnCard.invoke.issueCredential(unsigned);
const result = await learnCard.invoke.verifyCredential(credential);
assert.deepEqual(result.errors, []);
console.log('valid');

const tampered = structuredClone(credential);
tampered.credentialSubject.achievement.name = 'An achievement I did not earn';
const invalid = await learnCard.invoke.verifyCredential(tampered);
assert.ok(invalid.errors.length > 0);
console.log('invalid');
```

<!-- /snippet -->

Expected output: `valid`, then `invalid`. The second check changes signed data while retaining the original proof. For expiration and verification-policy examples, see [Verify Credentials](../../tutorials/verify-credentials.md).

## Store & Retrieve

**Stack: `{ seed }` for LearnCloud; add `network: true` for `resolveFromLCN`.** Storage holds credential content; the personal index holds references to it. Uploading alone does not add an entry to the index.

| Method                             | Signature summary                         | Returns                                      |
| ---------------------------------- | ----------------------------------------- | -------------------------------------------- |
| `store.LearnCloud.upload`          | `(credential, options?)`                  | Stored URI                                   |
| `store.LearnCloud.uploadEncrypted` | `(credential, { recipients }?, options?)` | Encrypted stored URI                         |
| `read.get`                         | `(uri?, options?)`                        | VC, VP, stored envelope, or `undefined`      |
| `index.LearnCloud.add`             | `({ id, uri, ...metadata }, options?)`    | Boolean                                      |
| `index.LearnCloud.get`             | `(query?, options?)`                      | Credential record array                      |
| `index.LearnCloud.update`          | `(id, updates, options?)`                 | Boolean                                      |
| `index.LearnCloud.remove`          | `(id, options?)`                          | Boolean                                      |
| `index.all.get`                    | `(query?, options?)`                      | Records across index providers               |
| `resolveFromLCN`                   | `(uri)`                                   | VC, unsigned VC, VP, JWE, contract, or terms |

`store` and `index` are provider-namespaced: use `store.LearnCloud.upload`, not `store.upload`. Encryption is optional at the control-plane interface level; the seed stack's LearnCloud provider supports it. An encrypted upload without explicit recipients is for the current identity. Removing an index entry does not revoke a credential or delete its stored content.

<!-- snippet: methods/store-read-index.mjs -->

```javascript
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
const credential = await learnCard.invoke.issueCredential(
    learnCard.invoke.newCredential({ type: 'achievement' })
);
const uri = await learnCard.store.LearnCloud.uploadEncrypted(credential);
const id = randomUUID();
await learnCard.index.LearnCloud.add({ id, uri });
try {
    const records = await learnCard.index.LearnCloud.get({ id });
    assert.ok(records.some(record => record.uri === uri));
    console.log('indexed: true');
    assert.deepEqual(await learnCard.read.get(uri), credential);
    console.log('equal: true');
} finally {
    await learnCard.index.LearnCloud.remove(id);
}
```

<!-- /snippet -->

Expected output: `indexed: true`, then `equal: true`. The example removes its temporary index entry afterward; the uploaded content is not deleted.

## Profiles

**Stack: `{ seed, network: true }`.** Create and discover network identities, including service profiles and profiles managed by another identity. A service profile represents an application or organization rather than an individual.

| Method                        | Signature summary                                                                        | Returns                        |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------ |
| `createProfile`               | `(profile)` without server-owned `did` / `isServiceProfile`                              | String                         |
| `createServiceProfile`        | `(profile)` without server-owned fields                                                  | String                         |
| `createManagedProfile`        | `(profile)` without `did`                                                                | String                         |
| `createManagedServiceProfile` | `(profile)` without server-owned fields                                                  | String                         |
| `getProfile`                  | `(profileId?)`; omit for self                                                            | Visible profile or `undefined` |
| `searchProfiles`              | `(profileId?, { limit, includeSelf, includeConnectionStatus, includeServiceProfiles }?)` | Visible profile array          |
| `updateProfile`               | `(partialProfile)`                                                                       | Boolean                        |
| `deleteProfile`               | `()`; deletes the current profile                                                        | Boolean                        |
| `getManagedProfiles`          | `(options?)`                                                                             | Paginated profiles             |
| `getManagedServiceProfiles`   | `({ id?, limit?, cursor?, query? })`                                                     | Paginated profiles             |
| `createProfileManager`        | `(managerProfile)` without `id` / `created`                                              | String                         |
| `createChildProfileManager`   | `(parentUri, managerProfile)`                                                            | String                         |
| `getProfileManagerProfile`    | `(id?)`                                                                                  | Manager profile or `undefined` |
| `updateProfileManagerProfile` | `(partialManagerProfile)`                                                                | Boolean                        |

Use the returned profile and manager identifiers rather than constructing them. Profile-management permission is distinct from simply knowing someone's profile ID. Searches exclude self and service profiles unless requested, as in this example.

<!-- snippet: methods/profiles.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
if (!(await learnCard.invoke.getProfile())) {
    await learnCard.invoke.createServiceProfile({
        profileId: process.env.PROFILE_ID,
        displayName: 'Methods Example',
        bio: '',
        shortBio: '',
    });
}
const profile = await learnCard.invoke.getProfile();
assert.equal(profile.profileId, process.env.PROFILE_ID);
console.log('profile: found');
await learnCard.invoke.updateProfile({ displayName: 'Methods Reference Issuer' });
assert.equal((await learnCard.invoke.getProfile()).displayName, 'Methods Reference Issuer');
console.log('updated: true');
const results = await learnCard.invoke.searchProfiles(profile.profileId, {
    includeSelf: true,
    includeServiceProfiles: true,
});
assert.ok(results.some(result => result.profileId === profile.profileId));
console.log('search: found');
```

<!-- /snippet -->

Expected output: `profile: found`, `updated: true`, `search: found`. This changes the dedicated example profile's display name and leaves the profile available for the next examples.

## Connections

**Stack: `{ seed, network: true }`, with profiles for both participants.** A connection request must be accepted by the other profile. Incoming requests and outgoing pending connections are different lists.

| Method                            | Signature summary                     | Returns                               |
| --------------------------------- | ------------------------------------- | ------------------------------------- |
| `connectWith`                     | `(profileId)`                         | Boolean                               |
| `acceptConnectionRequest`         | `(profileId)`                         | Boolean                               |
| `cancelConnectionRequest`         | `(profileId)`                         | Boolean                               |
| `disconnectWith`                  | `(profileId)`                         | Boolean                               |
| `generateInvite`                  | `(challenge?, expiration?, maxUses?)` | `{ profileId, challenge, expiresIn }` |
| `connectWithInvite`               | `(profileId, challenge)`              | Boolean                               |
| `listInvites`                     | `()`                                  | Invite array                          |
| `invalidateInvite`                | `(challenge)`                         | Boolean                               |
| `blockProfile` / `unblockProfile` | `(profileId)`                         | Boolean                               |
| `getBlockedProfiles`              | `()`                                  | Visible profile array                 |
| `getPaginatedConnections`         | `(options?)`                          | Paginated visible profiles            |
| `getPaginatedPendingConnections`  | `(options?)`; outgoing                | Paginated visible profiles            |
| `getPaginatedConnectionRequests`  | `(options?)`; incoming                | Paginated visible profiles            |

Pagination options contain `limit` and `cursor`; follow returned cursors while `hasMore` is true. Invite expiration is in seconds. Treat an invite's challenge as a capability and avoid exposing it beyond intended recipients.

<!-- snippet: methods/connections.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.OTHER_PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
assert.equal(await learnCard.invoke.connectWith(process.env.OTHER_PROFILE_ID), true);
console.log('request: sent');
```

<!-- /snippet -->

Expected output: `request: sent`. The E2E test signs in as the second profile, checks `getPaginatedConnectionRequests`, calls `acceptConnectionRequest`, and verifies the resulting connection. Requesting a connection is not equivalent to accepting one.

## Send & Receive

**Stack: `{ seed, network: true }`.** Prefer `send()` for unified delivery by profile ID, DID, email, or phone; see [Send & Issue](../../how-to-guides/send-credentials.md) for its complete option set. Sending creates an incoming item; the recipient performs acceptance separately.

| Method                                              | Signature summary                                                                 | Returns                                                        |
| --------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `send`                                              | `({ type: 'boost', recipient, templateUri?, template?, signedCredential?, ... })` | `SendResponse`, including `credentialUri`, `uri`, `activityId` |
| `sendCredential`                                    | `(profileId, vc, metadataOrEncrypt?, encrypt?)`                                   | Credential URI                                                 |
| `getSentCredentials`                                | `(to?)`                                                                           | `SentCredentialInfo[]`                                         |
| `getReceivedCredentials`                            | `(from?)`                                                                         | `SentCredentialInfo[]`                                         |
| `getIncomingCredentials`                            | `(from?)`                                                                         | `SentCredentialInfo[]`                                         |
| `acceptCredential`                                  | `(uri, { skipNotification?, metadata? }?)`                                        | Boolean                                                        |
| `deleteCredential`                                  | `(uri)`                                                                           | Boolean                                                        |
| `sendPresentation`                                  | `(profileId, signedPresentation, encrypt?)`                                       | Presentation URI                                               |
| `acceptPresentation`                                | `(uri)`                                                                           | Boolean                                                        |
| `getReceivedPresentations`                          | `(from?)`                                                                         | `SentCredentialInfo[]`                                         |
| `getSentPresentations` / `getIncomingPresentations` | `(profileId?)`; to / from respectively                                            | `SentCredentialInfo[]`                                         |
| `deletePresentation`                                | `(uri)`                                                                           | Boolean                                                        |

Supply at least one of `templateUri`, `template`, or `signedCredential` to `send`. The older `sendBoost(profileId, boostUri)` form still exists; new integrations should use `send`. Network acceptance does not automatically maintain your separate LearnCloud personal index; add a storage reference there if your application needs it.

<!-- snippet: methods/send-accept.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.OTHER_PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const recipient = await learnCard.invoke.getProfile(process.env.OTHER_PROFILE_ID);
assert.ok(recipient);
const credential = await learnCard.invoke.issueCredential(
    learnCard.invoke.newCredential({ type: 'achievement', subject: recipient.did })
);
const sent = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipient.profileId,
    signedCredential: credential,
});
assert.ok(sent.credentialUri);
const records = await learnCard.invoke.getSentCredentials(recipient.profileId);
assert.ok(records.some(record => record.uri === sent.credentialUri));
console.log('sent: true');
```

<!-- /snippet -->

Expected output: `sent: true`. The E2E recipient reads `getIncomingCredentials(senderProfileId)`, accepts the returned URI, and confirms it appears in `getReceivedCredentials`. Use returned URIs throughout, including when sending to yourself.

## Templates (Boosts)

**Stack: `{ seed, network: true }`.** A Boost is a reusable network credential template with metadata, recipients, hierarchy, and permissions. Its status enum is `DRAFT`, `PROVISIONAL`, or `LIVE` (uppercase).

| Method                                      | Signature summary                                          | Returns                              |
| ------------------------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| `createBoost`                               | `(credential, metadata?)`                                  | Template URI                         |
| `getBoost`                                  | `(uri)`                                                    | Boost metadata plus unsigned `boost` |
| `updateBoost`                               | `(uri, updates, credential?)`                              | Boolean                              |
| `deleteBoost`                               | `(uri)`                                                    | Boolean                              |
| `getPaginatedBoosts`                        | `({ limit?, cursor?, query? }?)`                           | Paginated boosts                     |
| `countBoosts`                               | `(query?)`                                                 | Number                               |
| `send`                                      | `({ type: 'boost', recipient, templateUri })`              | `SendResponse`                       |
| `getPaginatedBoostRecipients`               | `(uri, limit?, cursor?, includeUnacceptedBoosts?, query?)` | Paginated recipients                 |
| `countBoostRecipients`                      | `(uri, includeUnacceptedBoosts?)`                          | Number                               |
| `createChildBoost`                          | `(parentUri, credential, metadata?)`                       | Child template URI                   |
| `makeBoostParent` / `removeBoostParent`     | `({ parentUri, childUri })`                                | Boolean                              |
| `getBoostChildren` / `getBoostParents`      | `(uri, options?)`; query, pagination, generations          | Paginated boosts                     |
| `countBoostChildren` / `countBoostParents`  | `(uri, options?)`; query, generations                      | Number                               |
| `getBoostSiblings` / `countBoostSiblings`   | `(uri, options?)`                                          | Paginated boosts / number            |
| `getFamilialBoosts` / `countFamilialBoosts` | `(uri, options?)`; family traversal                        | Paginated boosts / number            |
| `getBoostPermissions`                       | `(uri, profileId?)`                                        | `BoostPermissions`                   |
| `updateBoostPermissions`                    | `(uri, updates, profileId?)`; updates omit `role`          | Boolean                              |
| `getBoostAdmins`                            | `(uri, { limit?, cursor?, includeSelf? }?)`                | Paginated visible profiles           |
| `addBoostAdmin` / `removeBoostAdmin`        | `(uri, profileId)`                                         | Boolean                              |
| `revokeBoostRecipient`                      | `(boostUri, recipientProfileId, credentialUri?)`           | Boolean                              |

Recipient lists exclude unaccepted credentials by default. The example passes `true` explicitly so that a just-sent credential is visible before the second profile accepts. Hierarchy and permissions are separate concerns: linking templates does not substitute for checking the caller's permissions.

<!-- snippet: methods/templates.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
assert.ok(process.env.OTHER_PROFILE_ID);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const templateUri = await learnCard.invoke.createBoost(
    learnCard.invoke.newCredential({ type: 'achievement' }),
    { name: 'Methods Template', status: 'DRAFT' }
);
assert.equal((await learnCard.invoke.getBoost(templateUri)).status, 'DRAFT');
console.log('draft: true');
await learnCard.invoke.updateBoost(templateUri, { status: 'LIVE' });
assert.equal((await learnCard.invoke.getBoost(templateUri)).status, 'LIVE');
console.log('live: true');
await learnCard.invoke.send({
    type: 'boost',
    recipient: process.env.OTHER_PROFILE_ID,
    templateUri,
});
const recipients = await learnCard.invoke.getPaginatedBoostRecipients(
    templateUri,
    20,
    undefined,
    true
);
assert.ok(recipients.records.some(record => record.to.profileId === process.env.OTHER_PROFILE_ID));
console.log('recipient: found');
```

<!-- /snippet -->

Expected output: `draft: true`, `live: true`, `recipient: found`. The live template and sent credential remain on the selected network; use a dedicated test identity rather than a production issuer.

## Signing Authorities & Claim Links

**Stack: `initLCALearnCard` for `createSigningAuthority`; `{ seed, network: true }` for registration and claims.** A hosted signing authority signs on behalf of an issuer; creating it and registering it on the network are separate operations. Follow [Create a Signing Authority](../../how-to-guides/create-signing-authority.md) for authorization and endpoint setup.

| Method                                 | Signature summary                               | Returns                      |
| -------------------------------------- | ----------------------------------------------- | ---------------------------- |
| `createSigningAuthority`               | `(name, ownerDid?)`; LCA API plugin             | Signing authority or `false` |
| `registerSigningAuthority`             | `(endpoint, name, did)`                         | Boolean                      |
| `getRegisteredSigningAuthorities`      | `()`                                            | Registered authority array   |
| `getRegisteredSigningAuthority`        | `(endpoint, name)`                              | Authority or `undefined`     |
| `setPrimaryRegisteredSigningAuthority` | `(endpoint, name)`                              | Boolean                      |
| `getPrimaryRegisteredSigningAuthority` | `()`                                            | Authority or `undefined`     |
| `generateClaimLink`                    | `(boostUri, claimLinkSA, options?, challenge?)` | `{ boostUri, challenge }`    |
| `claimBoostWithLink`                   | `(boostUri, challenge)`                         | Credential URI               |

`generateClaimLink` returns claim parameters, not a fully assembled browser URL. Use the intended app's claim flow to present them, and protect the challenge like a secret. The hosted-authority and automatic-issuance example in [Writing Consented Data](../../core-concepts/consent-and-permissions/writing-consented-data.md) is independently snippet-tested.

## Consent

**Stack: `{ seed, network: true }`.** Contracts define requested access; terms record what a participant actually consented to. Keep contract URIs and terms URIs distinct, particularly for updates, withdrawal, synchronization, and transaction queries.

| Method                         | Signature summary                                                 | Returns                        |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------ |
| `createContract`               | `({ name, contract, ...metadata })`                               | Contract URI                   |
| `getContract`                  | `(contractUri)`                                                   | Contract details               |
| `getContracts`                 | `({ limit?, cursor?, query? }?)`                                  | Paginated contracts            |
| `deleteContract`               | `(contractUri)`                                                   | Boolean                        |
| `consentToContract`            | `(contractUri, { terms, expiresAt?, oneTime? }, recipientToken?)` | `{ termsUri, redirectUrl? }`   |
| `getConsentedContracts`        | `(options?)`                                                      | Paginated terms                |
| `updateContractTerms`          | `(termsUri, { terms, expiresAt?, oneTime? })`                     | Boolean                        |
| `withdrawConsent`              | `(termsUri)`                                                      | Boolean                        |
| `verifyConsent`                | `(contractUri, profileId)`                                        | Boolean                        |
| `getConsentFlowData`           | `(contractUri, options?)`                                         | Paginated consent data         |
| `getConsentFlowDataForDid`     | `(did, options?)`                                                 | Paginated data for DID         |
| `getAllConsentFlowData`        | `(query?, paginationOptions?)`                                    | Paginated consent data         |
| `getConsentFlowTransactions`   | `(termsUri, options?)`                                            | Paginated transactions         |
| `writeCredentialToContract`    | `(did, contractUri, credentialOrJwe, boostUri)`                   | String                         |
| `syncCredentialsToContract`    | `(termsUri, categories)`; category → URI array                    | Boolean                        |
| `getCredentialsForContract`    | `(termsUri, options?)`                                            | Paginated contract credentials |
| `addAutoBoostsToContract`      | `(contractUri, autoboosts)`                                       | Boolean                        |
| `removeAutoBoostsFromContract` | `(contractUri, boostUris)`                                        | Boolean                        |

AutoBoost entries must identify real templates and configured signing authorities. A contract's requested access is not permission to read every credential; use the participant's current terms and consented data. Start with the tested [ConsentFlow tutorial](../../tutorials/create-a-consentflow.md), then [ConsentFlow Overview](../../core-concepts/consent-and-permissions/consentflow-overview.md) and [Writing Consented Data](../../core-concepts/consent-and-permissions/writing-consented-data.md).

## Claim Hooks

**Stack: `{ seed, network: true }`.** Hooks apply an action when a credential from the configured template is claimed. The current discriminated union has three types: `GRANT_PERMISSIONS`, `ADD_ADMIN`, and `AUTO_CONNECT`.

| Method                  | Signature summary                    | Returns         |
| ----------------------- | ------------------------------------ | --------------- |
| `createClaimHook`       | `({ type, data })`                   | Hook ID         |
| `getClaimHooksForBoost` | `({ uri, limit?, cursor?, query? })` | Paginated hooks |
| `deleteClaimHook`       | `(id)`                               | Boolean         |

`GRANT_PERMISSIONS` requires `data.permissions`; `ADD_ADMIN` and `AUTO_CONNECT` take `claimUri` and `targetUri` without that field. `claimUri` identifies the triggering template; `targetUri` identifies the target template. Use identifiers returned by your own `createBoost` calls.

**Illustrative shape only — not executable; the URIs below are not live resources:**

```text
{
  "type": "GRANT_PERMISSIONS",
  "data": {
    "claimUri": "lc:network:network.learncard.com:boost:7b988cb9-831a-4566-987f-ab905dc3a91d",
    "targetUri": "lc:network:network.learncard.com:boost:cd53123b-dcc8-4e29-851f-f178072e7821",
    "permissions": { "canView": true }
  }
}
```

Grant only the permissions the claim requires. Hooks that add admins or grant permissions change access, not just credential display.

## DID Metadata

**Stack: `{ seed, network: true }`.** Add supplemental DID-document metadata to your network identity. The server generates each metadata record's ID; retrieve that ID before updating or deleting the record.

| Method              | Signature summary          | Returns                             |
| ------------------- | -------------------------- | ----------------------------------- |
| `addDidMetadata`    | `(partialDidDocument)`     | Boolean, not the new ID             |
| `getDidMetadata`    | `(id)`                     | Partial DID document or `undefined` |
| `getMyDidMetadata`  | `()`                       | Metadata records with `id`          |
| `updateDidMetadata` | `(id, partialDidDocument)` | Boolean                             |
| `deleteDidMetadata` | `(id)`                     | Boolean                             |

<!-- snippet: methods/did-metadata.mjs -->

```javascript
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');

// Advertise a service endpoint in your did:web document.
const serviceId = `docs-${randomUUID()}`;
await learnCard.invoke.addDidMetadata({
    '@context': ['https://www.w3.org/ns/did/v1'],
    service: [{ id: serviceId, type: 'LinkedDomains', serviceEndpoint: 'https://example.org' }],
});

const records = await learnCard.invoke.getMyDidMetadata();
const metadata = records.find(record => record.service?.some(s => s.id === serviceId));
assert.ok(metadata);
const { id } = metadata;
try {
    const fetched = await learnCard.invoke.getDidMetadata(id);
    assert.ok(fetched.service.some(s => s.id === serviceId));
    console.log('metadata: found');
} finally {
    assert.equal(await learnCard.invoke.deleteDidMetadata(id), true);
}
assert.equal(await learnCard.invoke.getDidMetadata(id), undefined);
console.log('deleted: true');
```

<!-- /snippet -->

Expected output: `metadata: found`, then `deleted: true`. The unique alias locates only the newly added record; existing metadata is left untouched.

## Auth Grants & API Tokens

**Stack: `{ seed, network: true }`.** Auth grants delegate scoped API access without exposing your signing seed. See [Scopes](../../core-concepts/architecture-and-principles/auth-grants-and-api-tokens.md#scopes) and choose the minimum access your integration requires.

| Method                    | Signature summary                | Returns                      |
| ------------------------- | -------------------------------- | ---------------------------- |
| `addAuthGrant`            | `(partialAuthGrant)`             | Grant ID                     |
| `getAuthGrant`            | `(id)`                           | Partial grant or `undefined` |
| `getAuthGrants`           | `({ limit?, cursor?, query? }?)` | Grant array or `undefined`   |
| `updateAuthGrant`         | `(id, updates)`                  | Boolean                      |
| `revokeAuthGrant`         | `(id)`                           | Boolean                      |
| `deleteAuthGrant`         | `(id)`                           | Boolean                      |
| `getAPITokenForAuthGrant` | `(id)`                           | Bearer token string          |

`scope` is a string; multiple scopes are space-separated. Revocation retains the grant record with status `revoked`, whereas deletion removes it. Keep tokens out of logs, source control, and client-visible configuration; the example checks token creation without printing the token.

<!-- snippet: methods/auth-grants.mjs -->

```javascript
import assert from 'node:assert/strict';
import { initLearnCard } from '@learncard/init';

assert.match(process.env.SECURE_SEED ?? '', /^[0-9a-f]{64}$/i);
const learnCard = await initLearnCard({ seed: process.env.SECURE_SEED, network: true });
assert.ok(await learnCard.invoke.getProfile(), 'Create your profile first');
const id = await learnCard.invoke.addAuthGrant({ name: 'Methods read-only', scope: 'boosts:read' });
try {
    const token = await learnCard.invoke.getAPITokenForAuthGrant(id);
    assert.ok(token.length > 0);
    console.log('token: created');
    const grant = await learnCard.invoke.getAuthGrant(id);
    assert.equal(grant.scope, 'boosts:read');
    console.log('scope: boosts:read');
} finally {
    await learnCard.invoke.revokeAuthGrant(id);
}
assert.equal((await learnCard.invoke.getAuthGrant(id)).status, 'revoked');
console.log('revoked: true');
```

<!-- /snippet -->

Expected output: `token: created`, `scope: boosts:read`, `revoked: true`. This verifies the stored scope and revokes the grant even if an assertion fails; it does not exercise a bearer-authenticated REST request.

## Utilities

**Stack: `{ seed, network: true }`.** Use the underlying typed client for lower-level network access and profile discovery for identities you can act as. These do not bypass network authorization.

| Method                            | Signature summary                | Returns                           |
| --------------------------------- | -------------------------------- | --------------------------------- |
| `getLCNClient`                    | `()`; synchronous                | Typed `LCNClient`                 |
| `getAvailableProfiles`            | `({ limit?, cursor?, query? }?)` | Paginated profile / manager pairs |
| `getBoostChildrenProfileManagers` | `(uri, options?)`                | Paginated profile managers        |
| `getRevokedCredentials`           | `()`                             | Revoked credential URI array      |

This task-oriented reference favors current paginated APIs over deprecated `getConnections`, `getPendingConnections`, `getConnectionRequests`, `getBoosts`, and `getBoostRecipients`. For provider composition and custom capabilities, see [Plugin API](writing-plugins.md); for full network request schemas, see the [Network API](https://network.learncard.com/docs).

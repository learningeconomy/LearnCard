---
description: Sign a credential locally, verify it, and understand tampered, expired, and revoked results.
---

# Verify Credentials

Verification checks the signature, detects changes to signed data, checks expiry, and checks revocation or suspension when the credential carries a supported `credentialStatus`. You will generate a real signed Open Badges 3.0 credential locally, then try two failing cases. No account or API token is needed for these three examples.

**~10 minutes · Needs:** Node.js (v20+), a terminal; a network-issued credential for the optional revocation step

## Install

In a new project folder, install the SDK:

```bash
npm init -y
npm install @learncard/init
```

## Verify your first credential

Save this as `issue-and-verify.mjs`. It generates a disposable issuer key, signs a badge awarded to that same identity, and verifies it with a separate, seedless SDK instance. Nothing is sent or stored on the LearnCard Network.

<!-- snippet: verify/issue-and-verify.mjs -->

```javascript
import { randomBytes, randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

// A fresh, disposable issuer for this tutorial; never print its seed.
const issuer = await initLearnCard({ seed: randomBytes(32).toString('hex') });
const credential = await issuer.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuer.id.did(),
    validFrom: new Date().toISOString(),
    name: 'Verification Complete',
    credentialSubject: {
        id: issuer.id.did(),
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Verification Complete',
            description: 'Verified a signed credential with LearnCard.',
            criteria: { narrative: 'Ran the verification tutorial.' },
        },
    },
});

// Verification needs neither the issuer's seed nor a network profile.
const verifier = await initLearnCard();
const result = await verifier.invoke.verifyCredential(credential);
console.log(
    result.errors.length
        ? `Invalid: ${result.errors.join('; ')}`
        : `Valid: ${result.checks.join(', ')}`
);
console.log(JSON.stringify(result, null, 2));
```

<!-- /snippet -->

Run it:

```bash
node issue-and-verify.mjs
```

### What you should see

Captured output:

```text
Valid: proof, expiration
{
  "checks": [
    "proof",
    "expiration"
  ],
  "warnings": [],
  "errors": []
}
```

`checks` lists successful checks; it is not an overall verdict. Reject verification failures in `errors`, and review `warnings` before accepting a credential. This badge has no expiry and no status entry: `expiration` succeeds, but there is no revocation check to report. If present, `credentialSchema` also adds a schema check.

The default `verifyCredential(credential, options?)` result is an object with `checks`, `warnings`, `errors`, and optional `status`. For display, `verifyCredential(credential, {}, true)` returns a prettified array instead: success entries use `message`, failures use `details`, and warnings have status `Error`. Use the default object for application decisions.

## Tampered

Save this independent example as `tampered.mjs`. It changes an achievement name **after signing**, retaining the original proof.

<!-- snippet: verify/tampered.mjs -->

```javascript
import { randomBytes, randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const issuer = await initLearnCard({ seed: randomBytes(32).toString('hex') });
const credential = await issuer.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuer.id.did(),
    validFrom: new Date().toISOString(),
    name: 'Verification Complete',
    credentialSubject: {
        id: issuer.id.did(),
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Verification Complete',
            description: 'Verified a signed credential with LearnCard.',
            criteria: { narrative: 'Ran the verification tutorial.' },
        },
    },
});

// Change signed data without replacing the original proof.
const tampered = structuredClone(credential);
tampered.credentialSubject.achievement.name = 'An achievement I did not earn';
const verifier = await initLearnCard();
const result = await verifier.invoke.verifyCredential(tampered);
console.log(
    result.errors.length
        ? `Invalid: ${result.errors.join('; ')}`
        : `Valid: ${result.checks.join(', ')}`
);
console.log(JSON.stringify(result, null, 2));
```

<!-- /snippet -->

```bash
node tampered.mjs
```

### What you should see

Captured output:

```text
Invalid: signature error: Verification equation was not satisfied
{
  "checks": [
    "expiration"
  ],
  "warnings": [],
  "errors": [
    "signature error: Verification equation was not satisfied"
  ]
}
```

Passing the expiration check cannot rescue a broken signature. Do not edit a signed credential; ask its issuer for a replacement.

## Expired

Save this as `expired.mjs`. The issuer signs `validUntil` in the past, so this tests expiry rather than tampering.

<!-- snippet: verify/expired.mjs -->

```javascript
import { randomBytes, randomUUID } from 'node:crypto';
import { initLearnCard } from '@learncard/init';

const issuer = await initLearnCard({ seed: randomBytes(32).toString('hex') });
// Sign with past dates; editing validUntil after signing would also break the proof.
const credential = await issuer.invoke.issueCredential({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuer.id.did(),
    validFrom: '2020-01-01T00:00:00Z',
    validUntil: '2020-01-02T00:00:00Z',
    name: 'Verification Complete',
    credentialSubject: {
        id: issuer.id.did(),
        type: ['AchievementSubject'],
        achievement: {
            id: `urn:uuid:${randomUUID()}`,
            type: ['Achievement'],
            name: 'Verification Complete',
            description: 'Verified a signed credential with LearnCard.',
            criteria: { narrative: 'Ran the verification tutorial.' },
        },
    },
});

const verifier = await initLearnCard();
const result = await verifier.invoke.verifyCredential(credential);
console.log(
    result.errors.length
        ? `Invalid: ${result.errors.join('; ')}`
        : `Valid: ${result.checks.join(', ')}`
);
console.log(JSON.stringify(result, null, 2));
```

<!-- /snippet -->

```bash
node expired.mjs
```

### What you should see

Captured output:

```text
Invalid: expiration error: Credential is no longer valid
{
  "checks": [
    "proof"
  ],
  "warnings": [],
  "errors": [
    "expiration error: Credential is no longer valid"
  ]
}
```

The signature still passes. For these VC 2.0 credentials, use `validFrom` / `validUntil`; VC 1.1 credentials use `issuanceDate` / `expirationDate`.

<a id="check-status-not-just-the-signature"></a>

## Revoked (status list)

**This step requires a network-issued credential with a `credentialStatus` entry**, not one of the local badges above. A status list lets the issuer revoke a credential without changing its signed contents.

1. Issue and deliver a VC 2.0 badge through the network's Boost issuance flow, which allocates a `BitstringStatusListEntry` before signing. Keep the delivered credential, template URI, and recipient profile ID. A pre-signed credential without a status entry does not gain one just by being sent.
2. Follow [Revoke or Update a Credential](../how-to-guides/revoke-or-update-a-credential.md): the issuer calls `revokeBoostRecipient(templateUri, recipientProfileId)` (or passes a specific credential URI as the third argument). This flips the associated revocation bit.
3. Verify the **same delivered credential** again with default options. Verification fetches the status list referenced by `credentialStatus`; do not override `checks` to request only `proof`.

The following is a **shape excerpt from `VerificationCheck.status`, not captured output**. The local examples do not create or revoke a network credential:

```json
{
    "status": [
        {
            "entryType": "BitstringStatusListEntry",
            "statusPurpose": "revocation",
            "isSet": true
        }
    ]
}
```

Entries can also include `statusListCredential` and `statusListIndex`. A set revocation bit means revoked; a set suspension bit means suspended. Check `errors` and the structured `status` entries, not a guessed error string. Missing status data is **not** evidence that a credential is unrevoked, and an unreachable status list is not a successful check. See [Credential Status and Bitstring Status Lists](../core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md).

## Who verifies what

- **Signature:** `verifyCredential` checks the proof and signed data; review warnings about whether the named issuer authorized the signing key.
- **Issuer trust:** your application decides which issuers to accept, using a separate [Trust Registry](../core-concepts/identities-and-keys/trust-registries.md) lookup or allowlist. `verifyCredential` does not automatically check trusted issuers.
- **Presenter binding:** request a signed Verifiable Presentation, use `verifyPresentation` with your fresh challenge and expected domain, verify the enclosed credentials, and check `holder === credentialSubject.id`. This establishes control of that subject identity, not a person's real-world identity; receiving credential JSON alone does not.

## Request a credential from a LearnCard user

Use [Create a ConsentFlow](../tutorials/create-a-consentflow.md) for the full, runnable flow. The requester calls `createContract` with read access to the required credential categories (for example, `Achievement`), then sends the user to `https://learncard.app/consent-flow` with URL-encoded `uri` (the returned contract URI) and `returnTo` parameters.

After consent, the requester calls `getConsentFlowDataForDid(userDid)` and filters the paginated results by `contractUri`. Retrieve and verify the shared credentials before using their claims. Consent grants access; it does not establish signature validity, issuer trust, or presenter binding.

For other wallets and protocols, see [Interoperate with LearnCard](../how-to-guides/interoperate-with-learncard.md#requesting-credentials-from-a-learncard-user).

## Troubleshooting

| If you see…                                                                       | What to do                                                                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signature error: Verification equation was not satisfied`                        | Reject the credential: signed data or its proof changed. Request the original or a newly issued copy.                                                 |
| `expiration error: Credential is no longer valid`                                 | The VC 2.0 `validUntil` is past. Request a current credential.                                                                                        |
| `expiration error: Credential is expired`                                         | The VC 1.1 `expirationDate` is past. Request a current credential.                                                                                    |
| `expiration error: Credential is not valid yet`                                   | Check `validFrom` and your system clock. Wait until the validity period begins.                                                                       |
| `Issuer authorization was not checked because the credential issuer is not a DID` | A valid signature did not establish authorization by the named URL issuer. Resolve that authorization separately; do not silently accept the warning. |

The first two errors above were captured from these examples; the remaining messages are defined by the SDK. Resolver or status-list failures may vary by environment. Treat them as unresolved verification, not permission to skip a check.

## Next steps

- [Create a ConsentFlow](../tutorials/create-a-consentflow.md) to request credentials with consent.
- [Revoke or Update a Credential](../how-to-guides/revoke-or-update-a-credential.md) to try the network status-list flow.
- [Trust Registries](../core-concepts/identities-and-keys/trust-registries.md) to define which issuers your service accepts.

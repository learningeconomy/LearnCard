---
description: Issue a refreshable credential that only the recipient (and their account managers) can ever read — not even LearnCard's own servers.
---

# Send a Private, Refreshable Credential

{% hint style="info" %}
**~5 min** · Builds on [Issue and Refresh a Managed Credential](issue-and-refresh-a-managed-credential.md).
{% endhint %}

[Managed refresh](issue-and-refresh-a-managed-credential.md) already stores every version encrypted so only the recipient can read it. But the network (LearnCard's own servers) briefly sees the plaintext in memory while signing it, encrypting it, and deciding whether an update is worth a notification. For a transcript, a medical record, or anything whose content neither you nor LearnCard should hold onto, use **holder-mode encryption**: `send({ ..., encryption: 'holder' })` signs and encrypts the credential inside your own process, and only ciphertext ever reaches the network.

## When to use this

Use holder mode when the credential's content is sensitive enough that no third party — including LearnCard — should read it, even briefly. Ordinary managed refresh (network mode) is simpler and is the right choice for most credentials: badges, certificates, and anything you'd be comfortable describing to LearnCard support if a send went wrong.

Holder mode has a real cost. Because LearnCard never sees the content, it can't help you debug a bad send, and it can't compare two versions to decide whether an update is worth telling the recipient about — that becomes your call (see [Publish an update](#publish-an-update) below).

## Before you start

- A seed and profile from the [Quickstart](../quick-start/your-first-integration.md), in `.env` as `SECURE_SEED` and `PROFILE_ID`
- The recipient's profile ID — holder mode only delivers to a LearnCard profile or a DID, never an email address or phone number (see [Limitations](#limitations))
- Familiarity with [Issue and Refresh a Managed Credential](issue-and-refresh-a-managed-credential.md); this page only covers what's different

## Public display metadata

Because the credential's content never reaches the network, the network has nothing to show the recipient while the credential is waiting to be claimed. Pass the same optional `display: { name, category, image }` field [network-mode sends use](issue-and-refresh-a-managed-credential.md#public-metadata-and-privacy). These fields are the only part of the credential LearnCard's servers ever see — don't put private claims in them.

## Send the credential

<!-- snippet: refresh/send-private-refreshable.mjs -->

```javascript
import { writeFileSync } from 'node:fs';
import { initLearnCard } from '@learncard/init';

const { SECURE_SEED, PROFILE_ID, RECIPIENT_PROFILE_ID } = process.env;
if (!SECURE_SEED || !PROFILE_ID || !RECIPIENT_PROFILE_ID) {
    throw new Error('Set SECURE_SEED, PROFILE_ID, and RECIPIENT_PROFILE_ID');
}

const issuer = await initLearnCard({ seed: SECURE_SEED, network: true });
if (!(await issuer.invoke.getProfile())) {
    await issuer.invoke.createProfile({ profileId: PROFILE_ID, displayName: 'Example University' });
}

// Identical to an ordinary refreshable send, except `encryption: 'holder'`: the SDK
// signs and encrypts this credential locally, and only the resulting ciphertext —
// never the claims below — is sent to the network.
const result = await issuer.invoke.send({
    type: 'boost',
    recipient: RECIPIENT_PROFILE_ID,
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: issuer.id.did(),
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
                    type: ['Achievement'],
                    name: 'Introduction to Biology',
                    description: 'Grade pending final exam.',
                    criteria: { narrative: 'Complete all coursework and the final exam.' },
                },
            },
        },
    },
    // `display` is the only part of this send the network ever sees. Holder mode
    // never transmits the claims above, so there is no content to read a title from.
    display: { name: 'Official Transcript', category: 'Learning History' },
    refresh: true,
    encryption: 'holder',
});

// Same receipt shape as network mode. Keep it with your own record of the claims —
// you still can't read the credential back from it, and now neither can the network.
const record = {
    refreshId: result.refresh.refreshId,
    refreshService: result.refresh.refreshService,
    credentialId: result.refresh.credentialId,
    issuerDid: result.refresh.issuerDid,
    holderDid: result.refresh.holderDid,
    credentialStatus: result.refresh.credentialStatus,
    credentialUri: result.credentialUri,
    activityId: result.activityId,
};
writeFileSync('refresh-private.json', JSON.stringify(record, null, 2));
console.log(JSON.stringify(record));
```

<!-- /snippet -->

```bash
RECIPIENT_PROFILE_ID=their-profile-id node --env-file=.env send-private-refreshable.mjs
```

What's different from an [ordinary refreshable send](issue-and-refresh-a-managed-credential.md#1-issue-a-credential-that-can-be-refreshed):

- `encryption: 'holder'` — every other field (`recipient`, `template`, `display`, `refresh: true`) stays the same.
- Your own wallet signs the credential and encrypts it to the recipient (and their account managers, if they have any) before anything is sent. This needs local signing and the encryption capability `@learncard/init` includes by default; a signing-authority-only setup can't use holder mode (see [Limitations](#limitations)).
- The receipt (`result.refresh`) is the same shape network mode returns. Keep it exactly like the network-mode guide does — you still can't read the credential back from it.

## Publish an update

Publishing works like [the network-mode flow](issue-and-refresh-a-managed-credential.md#2-publish-an-update), with two differences: call `publishHolderEncryptedRefreshable` instead of `publishCredentialRefresh`, and say explicitly whether to notify the recipient — the network can't compare two encrypted versions to decide that for you.

```typescript
// `record` is the receipt written by send-private-refreshable.mjs (or fetched again
// with getCredentialRefreshReceipt). publishHolderEncryptedRefreshable rebuilds the
// credential's identity (id, issuer, credentialSubject.id, refreshService,
// credentialStatus) from it, the same way publishCredentialRefresh does — only the
// claims that changed need to be supplied.
const updated = await issuer.invoke.publishHolderEncryptedRefreshable(
    record,
    {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: record.issuerDid,
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
                type: ['Achievement'],
                name: 'Introduction to Biology',
                description: 'Final grade: A.',
                criteria: { narrative: 'Complete all coursework and the final exam.' },
            },
        },
    },
    { notify: true, updateReason: 'reissued' }
);

console.log(updated.version); // 2
```

`notify` replaces the "is this worth telling them about" check network mode makes automatically. With holder mode there's no middle ground, because the network cannot read the content to decide for itself.

## Revoke

Revocation is identical to [network mode](revoke-or-update-a-credential.md): `revokeBoostRecipient(boostUri, recipientProfileId)` flips the same public status bit (`credentialStatus`), bound to the credential the moment it was first sent. Verifiers see the revocation the normal way, and LearnCard never needed to read the content to revoke it.

## What the student's app verifies

Before the LearnCard app shows or saves a holder-mode credential, it:

1. Reads a small, public **binding** for the delivery — the credential's ID, issuer, the recipient's own identifier, the refresh address, and the revocation descriptor — authenticated separately from the encrypted content.
2. Decrypts the credential with the recipient's own key.
3. Verifies the signature and checks that it isn't currently revoked.
4. Checks that the decrypted credential's ID, issuer, recipient, refresh address, and revocation descriptor **exactly match** the binding from step 1.

Only if all four pass does the app offer **Accept**. If anything fails — a bad signature, a mismatched ID, a tampered binding — the recipient sees "We couldn't verify this" and nothing is saved. This is what stops a compromised or malicious network from substituting a different credential for the one you sent; see the trust statement below for what it does _not_ stop.

## The trust statement

Be precise about what holder mode promises:

- **It protects against** LearnCard's own servers reading, storing, or logging the credential's content. Signing and encryption both happen in your process; only ciphertext and the public `display` metadata ever reach the network.
- **It does not protect against a malicious network operator.** The network is what tells your SDK which keys belong to the recipient (and their account managers). An operator that was actively malicious, rather than merely unable to read your data, could in principle substitute different keys, withhold a version, or replay an old one. Resisting that would require pinning the recipient's key independently of the network, which holder mode does not do.

| Actor                           | Network mode (default)                                                    | Holder mode                                                                       |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| LearnCard's servers             | See the content while signing, encrypting, and deciding whether to notify | Never see it — only ciphertext and `display` metadata                             |
| A malicious network operator    | Same exposure as above                                                    | Could still substitute keys or withhold/replay versions (out of scope either way) |
| An account manager you've added | Can decrypt versions sent while they were a manager                       | Same                                                                              |

## Limitations

- **No email or phone recipients.** Holder mode needs a known encryption key before it can send anything. Universal Inbox doesn't know who will claim the credential until they do, so there's no key yet to encrypt to. Use [network mode](issue-and-refresh-a-managed-credential.md#refresh-through-universal-inbox) for inbox deliveries.
- **No signing-authority publishing.** Because the network never decrypts, it can't act as a [signing authority](create-signing-authority.md) for a holder-mode credential — your own wallet must sign every version.
- **Account managers added later can't read earlier versions.** Each version is encrypted only to whoever was a recipient or manager _at the time it was sent_. Adding a manager afterward doesn't retroactively hand them the key to older ciphertext — only to versions published after they're added.
- Everything in [Current limits](issue-and-refresh-a-managed-credential.md#current-limits) and [Limits to know about](revoke-or-update-a-credential.md) still applies.

## Troubleshooting

| You see                                                                               | Why                                                                             | Fix                                                                                                                    |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `encryption: "holder" requires refresh: true`                                         | Holder mode is only defined for managed refresh sends                           | Add `refresh: true`                                                                                                    |
| `encryption: "holder" does not support inbox (email or phone) recipients`             | You passed an email address or phone number                                     | Use a profile ID or DID recipient, or send in network mode                                                             |
| `encryption: "holder" does not support signedCredential`                              | You pre-signed the credential yourself                                          | Let `send()` sign it, or send in network mode                                                                          |
| `encryption: "holder" requires local signing capability` / `...the Encryption plugin` | Your wallet was initialized without local signing (for example, API-token-only) | Use a seed-based `initLearnCard` wallet                                                                                |
| `Server does not support holder-mode encryption`                                      | The network you're connected to hasn't rolled out holder mode yet               | Contact us, or send in network mode                                                                                    |
| `RECIPIENTS_CHANGED`                                                                  | An account manager was added or removed after you prepared the send             | The SDK retries this once automatically; if you see it directly, call `send`/`publishHolderEncryptedRefreshable` again |

## Next steps

- [Credential Refresh](../core-concepts/credential-refresh.md): how the pieces fit, and what the network can and can't see
- [Issue and Refresh a Managed Credential](issue-and-refresh-a-managed-credential.md): the network-mode flow this page builds on
- [Revoke or Update a Credential](revoke-or-update-a-credential.md)

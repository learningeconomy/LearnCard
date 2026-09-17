# Revoke or Update a Credential

A signed credential can't be edited. To correct one, revoke it and issue a replacement. Revocation works for anything you sent through `send()` — from a template or as your own signed credential.

{% hint style="info" %}
**~5 min** · After you've sent a credential.
{% endhint %}

## The one-line version

```bash
npx @learncard/cli revoke lc:network:network.learncard.com/trpc:credential:…
```

Takes the `credentialUri` from the `send()` response (or a recipient list), finds the template and recipient, and revokes. `--suspend` pauses instead. Then `npx @learncard/cli verify` on the credential shows `✗ status: Status: Revoked`.

## Revoke a credential

Revoking marks the recipient's copy as revoked on the network and, for credentials that carry a `credentialStatus`, flips the bit in the status list.

### Using the SDK

Use `revokeBoostRecipient` to revoke a credential you previously sent.

```typescript
const templateUri = 'lc:network:network.learncard.com/trpc:boost:abc123'; // from send() or createBoost()
const recipientProfileId = 'alice-smith';

await learnCard.invoke.revokeBoostRecipient(templateUri, recipientProfileId);
// → true
```

If the same person received the same template more than once, pass the specific credential URI as a third argument: `revokeBoostRecipient(templateUri, recipientProfileId, credentialUri)`. Recipient and credential URIs come from [`getPaginatedBoostRecipients`](send-credentials.md#tracking-credential-template-recipients).

To pause instead of revoke, `suspendBoostRecipient` takes the same arguments; `unsuspendBoostRecipient` reverses it.

### Using the REST API

You can also revoke a credential via the REST API using an API token with the `boosts:write` scope.

```bash
curl -X POST https://network.learncard.com/api/boost/recipients/revoke \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boostUri": "lc:network:network.learncard.com/trpc:boost:abc123",
    "recipientProfileId": "alice-smith"
  }'
```

## Update a credential

Revoke the old one, then send the corrected one:

```typescript
await learnCard.invoke.revokeBoostRecipient(oldTemplateUri, 'alice-smith');

await learnCard.invoke.send({
    type: 'boost',
    recipient: 'alice-smith', // or their email
    signedCredential: correctedCredential, // or templateUri: correctedTemplateUri
});
```

The recipient keeps a record of the revoked credential and receives the new one through the normal claim or direct-delivery flow.

## What you should see

### For the recipient

In the LearnCard app the credential is marked **Revoked** and can no longer be shared. A claim link for a credential revoked before it was claimed no longer works.

### For verifiers

Verifiers that check `credentialStatus` see the revocation through the credential's [Bitstring Status List](../core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md). Verifiers that only check the signature will not — see [Verify & Request Credentials](../tutorials/verify-credentials.md#check-status-not-just-the-signature).

## Troubleshooting

| If…                           | Then                                                                                                                           |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `Could not find boost`        | `boostUri` doesn't match a template you own. Use the URI returned by `send()` or `createBoost()`.                              |
| `Recipient profile not found` | `recipientProfileId` is a profile ID (e.g. `alice-smith`), not an email or DID. Look it up with `getPaginatedBoostRecipients`. |
| `Profile not found`           | The calling identity has no network profile. Create one with `createProfile` / `createServiceProfile` first.                   |

## Next steps

- [Know When a Credential Is Claimed](../tutorials/listen-to-webhooks.md)
- [Credential Status and Bitstring Status Lists](../core-concepts/credentials-and-data/credential-status-and-bitstring-status-lists.md)

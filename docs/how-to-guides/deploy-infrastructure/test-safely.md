# Test Safely: Staging & Mock Recipients

Before issuing credentials to real users, you should test your integration safely. LearnCard provides several mechanisms to test issuance without sending unwanted emails or SMS messages to real users.

{% hint style="info" %}
**~5 min** · After the [Quickstart](../../quick-start/your-first-integration.md).
{% endhint %}

## Environments

To see a staging project in the staging app: `npx @learncard/cli open --network staging` (the `.env` in that folder must already be on staging).

Staging and production are separate networks — nothing below carries over between them; see [What carries over](#what-carries-over).

| Item                     | Staging                                            | Production                                  |
| ------------------------ | -------------------------------------------------- | ------------------------------------------- |
| App                      | `https://staging.learncard.ai`                     | `https://learncard.app`                     |
| Network API (tRPC)       | `https://staging.network.learncard.com/trpc`       | `https://network.learncard.com/trpc`        |
| REST base                | `https://staging.network.learncard.com/api`        | `https://network.learncard.com/api`         |
| Storage API (LearnCloud) | `https://staging.cloud.learncard.com/trpc`         | `https://cloud.learncard.com/trpc`          |
| Developer Portal         | `https://staging.learncard.ai/app-store/developer` | `https://learncard.app/app-store/developer` |

## Use the staging network

The LearnCard Network provides a fully separate staging environment — see [Environments](#environments) above for the URLs. Profiles, API tokens, signing authorities, templates, and credentials are per-network and do not mirror between staging and production; see [What carries over](#what-carries-over).

To connect to the staging network using the SDK, pass the staging URLs to `initLearnCard`:

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({
    seed: process.env.SECURE_SEED,
    network: 'https://staging.network.learncard.com/trpc',
    cloud: { url: 'https://staging.cloud.learncard.com/trpc' },
});
```

{% hint style="warning" %}
**`network` doesn't move storage.** `network` and `cloud.url` are independent options — `cloud.url` defaults to the **production** LearnCloud endpoint (`https://cloud.learncard.com/trpc`) no matter what you pass to `network`. If you only set `network` to staging, credential storage still goes through production LearnCloud. Set both to stay fully on staging.
{% endhint %}

If you are using the LearnCard CLI, pick the network with `--network`. Use a separate folder for each network: the first command that creates the folder's identity saves the network to `.env` as `NETWORK_URL`, and later commands in that folder stay on it.

```bash
mkdir my-issuer-staging && cd my-issuer-staging
npx @learncard/cli send you@yourdomain.com --network staging
```

Unlike the SDK, the CLI's `--network staging` moves **all** services to staging: the network, LearnCloud storage, and the LearnCard app API. For any other network URL (a self-hosted or local deployment), set the matching service URLs yourself with the `CLOUD_URL` and `LCA_API_URL` environment variables, or as keys in the folder's `.env`. Values set in the environment take precedence over `.env`.

## Suppress delivery

`suppressDelivery` skips only the notification message (the claim email or SMS) — it is **not** a dry run. The network still creates a real, pending inbox credential addressed to that recipient and still returns `result.inbox.claimUrl`. If that email or phone number later verifies against a LearnCard profile, the recipient can claim it like any other credential.

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'test@example.com',
    // from createBoost() — the "network.learncard.com" host ties this template to
    // production; a template created on staging would use a staging host instead.
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123',
    options: {
        suppressDelivery: true,
    },
});

console.log('Claim URL:', result.inbox?.claimUrl);
```

{% hint style="warning" %}
**On production, this is a real issuance.** `suppressDelivery: true` only silences the email/SMS — it doesn't sandbox the send. Prefer the [staging network](#use-the-staging-network) or your own address for test sends rather than relying on `suppressDelivery` alone to avoid issuing to a real recipient.
{% endhint %}

You can then manually open the `claimUrl` to verify the recipient experience.

## Use your own email

The simplest way to test delivery is to send credentials to your own email address or phone number. The LearnCard Network will auto-detect the recipient type and route the message accordingly.

## Mock mode for embedded apps

If you are building an embedded application using Partner Connect, you can use mock mode to test your app without connecting to a real host. See [Publish Your App](../publish-your-app.md) for details on configuring mock mode.

## What carries over

| Per-network — redo this on every network                                           | Portable — the same everywhere |
| ---------------------------------------------------------------------------------- | ------------------------------ |
| Profile & profile ID                                                               | Your seed → the same `did:key` |
| API tokens                                                                         | Your integration code          |
| Signing authority registrations                                                    |                                |
| Credential templates (the `lc:network:<host>/…` in the URI ties it to one network) |                                |
| ConsentFlow contracts                                                              |                                |
| Issued & claimed credentials                                                       |                                |

A `did:web` profile is the one exception on the portable side — unlike a seed-based `did:key`, its DID embeds the host, so it doesn't carry over between networks either.

## What you should see

When using `suppressDelivery: true`, the API response will include `inbox.claimUrl` but no email or SMS will be sent to the recipient. When using the staging network, credentials will appear in the staging LearnCard App at `https://staging.learncard.ai`, not in the production app at `https://learncard.app`.

## Troubleshooting

| If…                            | Then                                                                                                            |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `Profile not found` on staging | You need to create a new profile on the staging network. Profiles do not carry over from production.            |
| `UNAUTHORIZED` on staging      | You are using a production API token. Generate a new one from **Developer Tools** in the staging LearnCard App. |

## Next steps

- [Go to Production](../go-to-production.md)
- [Publish Your App](../publish-your-app.md)

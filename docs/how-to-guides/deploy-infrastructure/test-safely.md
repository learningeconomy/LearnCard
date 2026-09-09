# Test Safely: Staging & Mock Recipients

Before issuing credentials to real users, you should test your integration safely. LearnCard provides several mechanisms to test issuance without sending unwanted emails or SMS messages to real users.

**~5 minutes · Needs:** A LearnCard wallet and an API token.

## Use the staging network

The LearnCard Network provides a staging environment at `https://staging.network.learncard.com`. This is a completely separate network from production. Profiles, API tokens, and credentials are per-network and do not mirror between staging and production.

To connect to the staging network using the SDK, pass the staging URL to `initLearnCard`:

```typescript
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({
    seed: process.env.SECURE_SEED,
    network: 'https://staging.network.learncard.com/trpc',
});
```

If you are using the LearnCard CLI, you can specify the network using the `--network` flag:

```bash
learncard send you@example.com --network https://staging.network.learncard.com/trpc
```

## Suppress delivery

If you want to test the issuance flow on production without actually sending an email or SMS, you can use the `suppressDelivery` option. When `suppressDelivery` is `true`, the network generates the credential and returns a claim URL in `result.inbox.claimUrl`, but skips the delivery step.

```typescript
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'test@example.com',
    templateUri: 'lc:network:network.learncard.com/trpc:boost:abc123', // from createBoost()
    options: {
        suppressDelivery: true,
    },
});

console.log('Claim URL:', result.inbox?.claimUrl);
```

You can then manually open the `claimUrl` to verify the recipient experience.

## Use your own email

The simplest way to test delivery is to send credentials to your own email address or phone number. The LearnCard Network will auto-detect the recipient type and route the message accordingly.

## Mock mode for embedded apps

If you are building an embedded application using Partner Connect, you can use mock mode to test your app without connecting to a real host. See [Publish Your App](../publish-your-app.md) for details on configuring mock mode.

## What you should see

When using `suppressDelivery: true`, the API response will include `inbox.claimUrl` but no email or SMS will be sent to the recipient. When using the staging network, credentials will appear in the staging LearnCard App, not the production app.

## Troubleshooting

| If…                            | Then                                                                                                            |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `Profile not found` on staging | You need to create a new profile on the staging network. Profiles do not carry over from production.            |
| `UNAUTHORIZED` on staging      | You are using a production API token. Generate a new one from **Developer Tools** in the staging LearnCard App. |

## Next steps

- [Go to Production](../go-to-production.md)
- [Publish Your App](../publish-your-app.md)

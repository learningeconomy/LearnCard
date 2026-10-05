---
description: Invite a learner to a partner, issue outcomes, and receive permissioned updates.
---

# Connect a learner to a partner through a referral

This workflow uses an existing LearnCard network profile for each partner, referrer, and learner. An email address alone cannot receive a generic request. The Salesforce Data Mediator is an external client of this workflow.

## Try the flow in the local demo

The `examples/consent-referral-demo` app sets up three synthetic accounts: Hire Heroes USA, Alex Morgan, and Hiring Our Heroes. Its buttons call the checkout's real local APIs; the evidence panel shows what each organization can read and which verified signed updates arrived.

With workspace dependencies installed and OrbStack/Docker running, start it from the repository root:

```bash
bun --conditions=development examples/consent-referral-demo/start.ts
```

Open http://localhost:8812 and choose **Set up demo**. If the demo is already running and set up, use **Fresh scenario** to start again.

| View              | Action                                                       | What to check                                                                                                          |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Hire Heroes USA   | Send referral                                                | The invitation is pending; neither organization has consented data yet.                                                |
| Veteran           | Accept & Connect, select permissions, then Confirm & Connect | Review both receiving organizations. Only selected fields appear in their data snapshots.                              |
| Hiring Our Heroes | Record enrollment outcome                                    | The outcome is pending for Alex and absent from both organizations' shared data.                                       |
| Veteran           | Claim & share outcome                                        | With outcome sharing enabled, both organizations can decrypt the approved copy and receive a correlated signed update. |
| Veteran           | Stop sharing                                                 | Both organization snapshots return no consented records. Previously delivered copies may remain.                       |

Use **Fresh scenario** for each alternative: decline the referral, dismiss and reopen the pending invitation, or remove Hire Heroes USA through the partner's controls after consent. To check cancellation during review, open the veteran's permission review, expand **Test cancellation during review**, cancel the invitation, and try **Confirm & Connect**. Confirmation should fail without recording consent.

The default launcher starts disposable databases and API containers. Ports 4000/4100/5200/8812/8813 must be free; Ctrl+C stops that stack and removes its database volumes. Add `--services-running` when the three synthetic local APIs are already running. The example README covers reusing an existing test database network.

This is a custom API test interface inspired by the VetPass mockup. Use the actual app for guardian approval, production invitation screens, automatic claim synchronization, locales, and rollout flags. The existing `examples/consent-flow-test` still tests direct consent links and callbacks into LearnCard. Salesforce remains external to both examples.

## Configure the audience and request

The partner owns the contract. Include the referrer as a data recipient when it should receive approved outcomes. A writer can issue outcomes but does not automatically receive data. Use a separate contract for each partner's audience.

Install `@learncard/init` and `@learncard/lca-api-plugin`. Start with three existing network profiles and an `Achievement` Boost template owned by the partner. Use the [signing-authority guide](../create-signing-authority.md) and [Issue on Consent](../../core-concepts/consent-and-permissions/auto-boosts.md) if you need to create that template first. Keep all seeds and API tokens on your trusted server.

<!-- snippet: contract-requests/initialize.mjs -->

```javascript
import { initLearnCard } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';

// Both accounts must already have profiles on the chosen network.
export const initializeReferralClients = async ({
    partnerSeed,
    referrerSeed,
    networkUrl,
    lcaApiUrl,
    clientOptions = {},
}) => {
    const partnerAccount = await initLearnCard({
        ...clientOptions,
        seed: partnerSeed,
        network: networkUrl,
    });
    const partner = await partnerAccount.addPlugin(await getLCAPlugin(partnerAccount, lcaApiUrl));
    const referrer = await initLearnCard({
        ...clientOptions,
        seed: referrerSeed,
        network: networkUrl,
    });
    return { partner, referrer };
};
```

<!-- /snippet -->

Call `initializeReferralClients({ partnerSeed, referrerSeed, networkUrl, lcaApiUrl })` and keep the returned `partner` and `referrer` clients for setup. The learner uses its own account and compatible app for consent and sharing.

The reusable modules below live in `docs/snippets/contract-requests/`. Copy them into your integration and import their functions. Inputs such as `partnerSeed`, `networkUrl`, `lcaApiUrl`, `boostUri` and the existing profile IDs come from your server's configuration; these examples do not provision real accounts.

### Register the signing authority and create the contract

The authority signs for the contract owner. Keep its name at 15 characters or fewer. The example registers it explicitly and attaches the Boost as an auto-boost; registration is necessary before consent can issue that credential. Later partner outcomes can use the same authority and an appropriate outcome template. This setup uses the owner's seed-backed client, before creating the limited runtime grant.

<!-- snippet: contract-requests/configure-partner.mjs -->

```javascript
// partner must have a network profile and the LCA API plugin installed.
// boostUri is an existing Achievement template owned by this partner.
export const configureReferralPartner = async (
    partner,
    { recipientProfileId, boostUri, authorityName = 'career-issuer' }
) => {
    const authority = await partner.invoke.createSigningAuthority(authorityName);
    if (!authority) throw new Error('Could not create signing authority');
    await partner.invoke.registerSigningAuthority(
        authority.endpoint,
        authority.name,
        authority.did
    );
    await partner.invoke.clearDidWebCache();
    const signingAuthority = { endpoint: authority.endpoint, name: authority.name };
    const contractUri = await partner.invoke.createContract({
        name: 'Career support',
        reasonForAccessing: 'To provide career support and return approved outcomes.',
        recipients: [recipientProfileId],
        contract: {
            read: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
            write: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
        },
        autoboosts: [{ boostUri, signingAuthority }],
    });
    return { contractUri, signingAuthority };
};
```

<!-- /snippet -->

Call `configureReferralPartner(partner, { recipientProfileId: referrerProfileId, boostUri })` and retain the returned `contractUri` and `signingAuthority`. Run setup once per contract, not for each referral. The current recipient list is disclosed during learner review.

### Create scoped runtime tokens

<!-- snippet: contract-requests/scoped-token.mjs -->

```javascript
// Run with the account's seed-backed client on your trusted server.
// Never log the returned token or include it in a browser bundle.
export const createReferralToken = async (
    account,
    scope = 'contracts:write contracts-data:read contracts-data:write'
) => {
    const grantId = await account.invoke.addAuthGrant({ name: 'Referral integration', scope });
    const token = await account.invoke.getAPITokenForAuthGrant(grantId);
    return { grantId, token };
};
```

<!-- /snippet -->

| Scope                  | Purpose                                                             | Additional authorization                                            |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `contracts:write`      | Send, mark seen, deny or cancel a request; create/update contracts. | The action's owner, writer, recipient or target role still applies. |
| `contracts-data:read`  | Read the user's currently permitted data.                           | Owner or current data recipient, with valid consent.                |
| `contracts-data:write` | Issue an outcome through the contract.                              | Owner or explicit writer, with permitted category.                  |

Use `createReferralToken(partner)` for a backend that needs all three operations. A recipient-only referrer generally needs just `createReferralToken(referrer, 'contracts:write contracts-data:read')`. Scopes authorize API operations across that account; they are not a per-contract grant and do not add a recipient or writer role. Store the returned token in your secret manager, retain `grantId` for revocation, and use `revokeAuthGrant(grantId)` when retiring access. Create the grant using a seed-backed admin client; do not give that seed to the external mediator.

For runtime SDK calls, initialize a separate client with `initLearnCard({ apiKey: token, network: networkUrl })`. For HTTP calls, send `Authorization: Bearer <token>`. `brainApiUrl` below is the REST API base (for example `https://network.learncard.com/api` or `http://localhost:4000/api`); `networkUrl` is the SDK endpoint (for example `http://localhost:4000/trpc`).

### Send the attributed invitation

<!-- snippet: contract-requests/request-and-poll.mjs -->

```javascript
export const sendReferral = async (referrer, { contractUri, learnerProfileId, reference }) =>
    referrer.invoke.sendContractRequest({
        contractUri,
        targetProfileId: learnerProfileId,
        externalReferenceId: reference,
        message: 'Career support is available through this partner.',
    });

// Reconcile current state when a webhook is delayed or unavailable.
// The caller sees only requests and data its role and current consent allow.
export const pollReferral = async (client, { contractUri, learnerDid }) => {
    const requests = await client.invoke.getContractSentRequests(contractUri);
    const records = [];
    let cursor;
    let hasMore;
    do {
        // SDK name for the brain route getConsentedDataForDid.
        const page = await client.invoke.getConsentFlowDataForDid(learnerDid, {
            limit: 25,
            ...(cursor ? { cursor } : {}),
        });
        records.push(...page.records.filter(record => record.contractUri === contractUri));
        cursor = page.cursor;
        hasMore = page.hasMore;
    } while (hasMore);
    return { requests, records };
};
```

<!-- /snippet -->

Call `sendReferral(referrer, { contractUri, learnerProfileId, reference: 'referral-123' })`. The reference connects later permitted events to your external referral record. Sending the invitation grants no access to learner data.

The owner manages recipients before the first consent. Additions freeze after that point; removals revoke future data discovery and require clients to review the new audience version. Sending a request does not authorize data access.

The owner and explicit writers can manage all referrals for the contract. A referrer that is only a data recipient can list and inspect only the requests it sent; the learner can inspect its own invitations. Other recipients cannot see those requests, including after acceptance. Request status returns `null` for both inaccessible and missing requests.

## Review and consent

The learner opens the invitation, reviews its purpose, requested permissions, and every receiving organization, then selects data through the consent flow. Accept & Connect opens review. Closing or dismissing leaves the request pending; Decline records a denial. Pending invitations remain accessible in Privacy & Data even after an alert is archived.

Compatible SDK clients fetch current details, display the audience, and pass `audienceVersion` to consent, update, and sync mutations. When accepting an invitation, include its `requestId` as `expectedRequestId` in the consent options. The server verifies that request is still pending when recording consent, so cancellation during review cannot accept the cancelled referral. New consent and re-consent reject expired contracts. Direct consent links omit this option and remain independent of invitation decisions. Owner-only legacy contracts continue to accept the existing version-free calls.

“Share all” applies to the selected **category**, including credentials from other sources. Separate audiences do not impose a credential-origin filter. For partner-specific outcome isolation, use distinct categories or individually selected credentials. The external client and learner must agree on categories and selection before rollout.

## Issue an outcome, then claim and synchronize

Register a signing authority using the LCA plugin before using the signing-authority API. Keep the authority's registered name at 15 characters or fewer. The caller must be the owner or an explicit writer and have `contracts-data:write` when using an auth grant. The current consent must permit the issued category.

<!-- snippet: contract-requests/write-outcome.mjs -->

```javascript
export const writeReferralOutcome = async ({
    brainApiUrl,
    writerApiToken,
    contractUri,
    learnerDid,
    boostUri,
    signingAuthority,
}) => {
    const response = await fetch(
        `${brainApiUrl}/consent-flow-contract/write/via-signing-authority`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${writerApiToken}`,
            },
            body: JSON.stringify({
                contractUri,
                did: learnerDid,
                boostUri,
                signingAuthority,
            }),
        }
    );
    if (!response.ok) throw new Error(`Outcome issuance failed (${response.status})`);
    return response.json();
};
```

<!-- /snippet -->

Call `writeReferralOutcome({ brainApiUrl, writerApiToken, contractUri, learnerDid, boostUri, signingAuthority })` with the runtime writer token. The returned URI identifies a pending credential.

Issuance sends a pending credential. It does not put an encrypted outcome into the consent audience's data view. The learner claims the credential; the compatible app stores the personal copy, encrypts a sharing copy for the current audience, and syncs the permitted URI. Reporting therefore depends on learner claim and client activity, rather than being instantaneous after issuance.

The following SDK equivalent explicitly synchronizes one selected outcome. A custom client must also persist its personal index/cache consistently and respect its selected live-sync settings.

<!-- snippet: contract-requests/claim-and-sync.mjs -->

```javascript
import { randomUUID } from 'node:crypto';

// Call only after the learner approves sharing this Achievement with this audience.
export const claimAndShareOutcome = async (learner, { contractUri, termsUri, credentialUri }) => {
    const details = await learner.invoke.getContract(contractUri);
    await learner.invoke.acceptCredential(credentialUri);
    const credential = await learner.read.get(credentialUri);
    if (!credential) throw new Error('Outcome could not be loaded');
    const personalUri = await learner.store.LearnCloud.uploadEncrypted(credential);
    await learner.index.LearnCloud.add({
        id: randomUUID(),
        uri: personalUri,
        category: 'Achievement',
    });
    const sharedUri = await learner.store.LearnCloud.uploadEncrypted(credential, {
        recipients: [details.owner.did, ...(details.recipients ?? []).map(profile => profile.did)],
    });
    await learner.invoke.syncCredentialsToContract(
        termsUri,
        { Achievement: [sharedUri] },
        details.audienceVersion
    );
    return sharedUri;
};
```

<!-- /snippet -->

Call `claimAndShareOutcome(learner, { contractUri, termsUri, credentialUri })` only after the learner approves that outcome and the latest audience. This is an explicit one-credential action; a full client must also manage its personal index/cache and chosen live-sync settings, rather than running it automatically for every issued credential.

The app retains shared URIs using the entire audience as the cache key. When membership changes, it creates a new audience-specific copy rather than reusing a removed recipient's ciphertext.

## Consume correlated events

Verify the webhook's bearer JWT against the sending brain service's DID document. Persist events before acknowledging `true` (or `{ "success": true }`) and deduplicate by `data.metadata.deliveryKey`. Deliveries are at least once. Use `eventId`, `contractUri`, and `requestId` to correlate events. The owner, original referrer, and explicit writers with data access can also use `externalReferenceId` to reconcile with the external referral record. Never use display text as a correlation key.

Declines and cancellations notify only the owner and original referrer, excluding whoever performed the action. Owners and current recipients receive consent and permitted sync events, but other recipients do not receive the private referral reference or invitation message. This filtering covers both event metadata and the transaction's referral fields. A requester outside the audience receives only the minimal decision metadata. The learner's own history and export retain the full referral details.

The scheduled/Docker recovery worker retries pending intents; delivery authorization rechecks current audience membership and consent permissions. It also suppresses unrelated recipients' old queued decline/cancellation notifications and removes private referral details from queued consent-data events before delivery.

Withdrawal, expiry, or recipient removal stops future authorized discovery/sharing. Copies already delivered cannot be recalled. One-time consent keeps its permitted snapshot until withdrawal/expiry and does not authorize ongoing sync.

See [the referral lifecycle concept page](../../core-concepts/consent-and-permissions/brokered-referral-lifecycle.md) for the complete referral → consent → auto-boost → partner write → claim → sync → webhook sequence.

## Poll when webhooks are unavailable

Call `pollReferral(referrer, { contractUri, learnerDid })` from the module above on a bounded schedule suited to your integration. `getContractSentRequests` returns the caller's visible invitation statuses. The brain route `getConsentedDataForDid` is named `getConsentFlowDataForDid` in the SDK; it returns paginated current data across permitted contracts, so the example reads every page and filters by `contractUri`.

For HTTP-only clients, use `GET /consent-flow-contracts/sent-requests?contractUri=<encoded-uri>` and `POST /consent-flow-contract/data-for-did` with `{ "did": "<learner-did>", "limit": 25 }`, passing the read token as a bearer token. Follow `hasMore`/`cursor` for the data response. The paths are relative to `brainApiUrl`. Request status alone is not proof of current consent: an accepted referral remains accepted after withdrawal, while current data reads return no permitted record. Polling cannot recover a missed event history, or force an unclaimed/unsynchronized outcome into the data view.

## Enable and verify the app experience

Both `features.contractRequests` in tenant configuration and the boolean LaunchDarkly `enableContractRequests` flag must be `true`. Missing/off flags fail closed. The tenant setting defaults to `false`; VetPass enables it only in its local overlay. `branding.contractRequestLabel` optionally sets the invitation eyebrow. These controls affect presentation, not backend authorization.

Release the consent audience foundation, request/event API, and compatible clients in stack order before enabling a production tenant. Review audience disclosure, guardian behavior, all supported locales, mobile insets, and legacy AI requests. Account provisioning, the Military Service Badge template/authority, external CRM identity mapping, and outcome category conventions require integrator setup.

Developers can run `bun --conditions=development scripts/lc-2226/referral-lab.ts` from a repository checkout against loopback brain/cloud/LCA services (defaults 4000/4100/5200). It creates synthetic profiles, two audiences, autoboosts and outcomes, then verifies encrypted sync, isolation, lifecycle boundaries, and signed correlated webhooks. It leaves synthetic history for inspection. The same executable is exercised by `tests/e2e/tests/contract-referral.spec.ts`. That spec advertises `host.docker.internal` to the containerized brain and binds its synthetic webhook receiver on all host interfaces. For a manual Docker run, set `LC2226_WEBHOOK_HOST=host.docker.internal`; host-only services use the default `127.0.0.1`. Service URLs remain HTTP loopback addresses. Leave `NOTIFICATIONS_SERVICE_WEBHOOK_URL` unset in this disposable stack so a local service-wide override does not redirect the lab profiles' webhooks.

See [Contract Requests and Events](../../sdks/learncard-network/contract-requests-and-events.md) for status transitions, API methods, retry semantics, and scope requirements.

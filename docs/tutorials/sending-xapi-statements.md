---
description: After a user connects their LearnCard, log what they do — and let them see it in their Activity Feed.
---

# Record Learning Activity

You've connected a user's LearnCard to your platform — see [Connect a User's LearnCard](create-a-consentflow.md). Now log what they do there. Each activity becomes an [xAPI statement](../core-concepts/credentials-and-data/xapi-data.md) stored in the user's own LearnCloud, and shows up in their LearnCard Activity Feed.

**~15 minutes · Needs:** the consent tutorial's `consent-callback.mjs` and `read-user-data.mjs`, your `SECURE_SEED`, and the `CONTRACT_URI` and `CONSENT_VP` from your own test consent.

## 1. The consent `vp` is your permission slip

When the user accepted your contract, the `vp` in the redirect wasn't only proof of who consented. It contains a **delegate credential** the user issued to your DID granting `statementAccess: ['read', 'write']`. Send that same `vp` string as the `X-VP` header and LearnCloud will accept statements about that user from you.

So: store the `vp` per user, server-side, encrypted. It is a bearer credential — never log it or expose it to the browser.

{% hint style="warning" %}
The xAPI endpoint checks the delegate credential, not the live contract. If a user withdraws consent, the `vp` still works until you stop using it. Call `verifyConsent` before each write and delete the stored `vp` on withdrawal.
{% endhint %}

Save the blocks below together as `record-activity.mjs` next to the two helper files:

```javascript
import { initLearnCard } from '@learncard/init';
import { verifyConsentRedirect } from './consent-callback.mjs';
import { readUserData } from './read-user-data.mjs';

const { SECURE_SEED, CONTRACT_URI, CONSENT_VP: vp } = process.env;
if (!SECURE_SEED || !CONTRACT_URI || !vp) {
    throw new Error('Set SECURE_SEED, CONTRACT_URI, and CONSENT_VP');
}
const learnCard = await initLearnCard({ seed: SECURE_SEED, network: true });
const verified = await verifyConsentRedirect(learnCard, vp, CONTRACT_URI);
if (verified.status !== 'verified') throw new Error('Consent denied or abandoned');
const userDid = verified.userDid; // Verified holder, not the redirect's did parameter

const requireConsent = async () => {
    if ((await readUserData(learnCard, userDid, CONTRACT_URI)).length === 0) {
        throw new Error('No active consent');
    }
};
```

## 2. Send a statement

The `actor` is the **user** (their DID), not you. LearnCloud checks that the delegate credential inside `X-VP` was issued by that same DID and includes `write`; the statement is then stored under the user's account.

This example uses the standard `completed` verb. Replace the sample activity URI with a stable URI owned by your platform, following the [activity and verb naming rules](../core-concepts/credentials-and-data/xapi-data.md).

```javascript
const endpoint = 'https://cloud.learncard.com/xapi/statements';
const headers = {
    'Content-Type': 'application/json',
    'X-Experience-API-Version': '1.0.3',
    'X-VP': vp,
};
const actor = {
    objectType: 'Agent',
    name: userDid,
    account: { homePage: 'https://www.w3.org/TR/did-core/', name: userDid },
};
const statement = {
    actor,
    verb: {
        id: 'http://adlnet.gov/expapi/verbs/completed',
        display: { 'en-US': 'completed' },
    },
    object: {
        id: 'https://example.com/activities/lesson-1',
        definition: {
            name: { 'en-US': 'Lesson 1' },
            description: { 'en-US': 'An introductory learning activity.' },
        },
    },
    timestamp: new Date().toISOString(),
};

await requireConsent();
const sent = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(statement),
});
if (!sent.ok) throw new Error(`Statement write failed: ${sent.status}`);
const ids = await sent.json();
console.log('Stored statement IDs:', ids);
```

The proxy copies the signed `contractUri` into `context.extensions['https://learncard.com/xapi/extensions/contractUri']` automatically. You do not need to modify or re-sign the presentation.

## 3. Read statements back

Use the same `vp` and actor with a `GET` request. Delegated reads require `read` instead of `write`, with the same issuer/actor and holder matching rules.

```javascript
await requireConsent();
const params = new URLSearchParams({ agent: JSON.stringify(actor), limit: '10' });
const received = await fetch(`${endpoint}?${params}`, { headers });
if (!received.ok) throw new Error(`Statement read failed: ${received.status}`);
const data = await received.json();
const contractExtension = 'https://learncard.com/xapi/extensions/contractUri';
const matching = data.statements.filter(
    item => item.context?.extensions?.[contractExtension] === CONTRACT_URI
);
console.log(
    'Found this statement:',
    matching.some(item => ids.includes(item.id))
);
```

The response contains `statements` and may contain a `more` pagination link. The query selects the user's activity; the local filter selects this contract. See [contract-scoped queries](../sdks/learncloud-storage-api/xapi-reference.md#contract-scoped-xapi-statements) for more detail.

Run `node --env-file=.env record-activity.mjs` once. Re-running creates another activity record; production writes should come from authorized learning events with your own duplicate prevention, not from the consent callback GET.

## 4. What the user sees

In LearnCard, open **Manage Data Sharing**, select your contract, and open **xAPI Data Feed**. The Activity Feed shows the activity name, verb, timestamp, and any result data, with a raw JSON view for inspection. It filters by the contract extension injected above, so keeping the original consent VP also keeps the activity associated with the right contract.

## What you should see

- The POST returns a successful response containing the stored statement ID(s).
- The read prints `Found this statement: true` for the newly stored activity; if other activity fills the first page, follow pagination.
- The learner sees **completed · Lesson 1** in the contract's Activity Feed.
- After withdrawal, the consent guard stops further reads and writes with `No active consent`.

## Troubleshooting

For authentication failures, see [Common causes of 401](../sdks/learncloud-storage-api/xapi-reference.md#common-causes-of-401), including the delegated-access exception to direct actor/holder matching. Do not substitute an API key or Partner Connect identity token for `vp`.

If a stored statement is missing from the contract feed, check its contract extension against the saved `CONTRACT_URI` and confirm you used the original consent VP. A missing or invalid actor account is a bad request, not evidence that you need another identity token.

## Next steps

- Add scores and completion results using the [xAPI concepts guide](../core-concepts/credentials-and-data/xapi-data.md).
- Explore [advanced statement queries](../sdks/learncloud-storage-api/xapi-reference.md#advanced-xapi-statement-queries).
- [Issue a credential through the contract](create-a-consentflow.md#5-issue-a-credential-through-the-contract) when an authorized completion event earns a badge.

---
description: Build, test, and publish an app that runs inside LearnCard and issues credentials to its users.
---

# Build an App Inside LearnCard

Users install your app from the LearnCard app store. The [Partner Connect SDK](../sdks/partner-connect/README.md) provides single sign-on, credential issuance, notifications, and learner context.

**~20 minutes to a working local app · Needs:** Node.js 18+, a LearnCard account for step 2.

## 1. Build locally — no registration needed

On localhost, the SDK's mock mode simulates the LearnCard host without registration:

```bash
npm install @learncard/partner-connect
```

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
    mock: 'auto',
});

const identity = await learnCard.requestIdentity();

await learnCard.sendCredential({
    templateAlias: 'achievement',
    templateData: { score: '95' },
});
```

In mock mode, each call shows a production-action toast, counters persist to localStorage, and `requestIdentity()` returns a seeded user. Embedded in LearnCard, the same code uses the real host.

**Working example**: the [Basic Launchpad app](https://github.com/learningeconomy/LearnCard/tree/main/examples/app-store-apps/1-basic-launchpad-app) (~200 lines, Astro + vanilla JS) exercises every SDK method.

## 2. Register your listing

In the LearnCard app, open **App Store → Developer Portal** (`/app-store/developer`) and run the Partner Onboarding Wizard:

1. Project setup (creates your Integration — the entity that owns your listings and templates)
2. Signing authority (for server-side credential issuance)
3. Branding — name, tagline, icon, description
4. Credential template builder (defines the `templateAlias` values your app issues; optionally [link each template to its Credential Engine Registry entry](../core-concepts/credentials-and-data/building-verifiable-credentials.md#ctid))
5. Integration method — `EMBEDDED_IFRAME` with your app's URL
6. Data mapping, sandbox test, and production checks

Your listing starts as a **DRAFT** — visible to you, not the public.

### Age restrictions

You can configure age-based access controls for your app:

| Field        | Type                                   | Description                                                                                                         |
| :----------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `age_rating` | `'4+'` \| `'9+'` \| `'12+'` \| `'17+'` | Content rating similar to app store ratings. Indicates the maturity level of content.                               |
| `min_age`    | `number` (0-18)                        | Minimum age (in years) required to access this app. Users below this age will not see or be able to launch the app. |

{% hint style="warning" %}
**Hard vs soft enforcement**

- **`min_age`** is a hard minimum age requirement. If a user's age is known and below `min_age`, the user is blocked from installing the app (including for managed/child profiles).
- **`age_rating`** is a content rating. For managed/child profiles, installs that would violate the rating will require guardian approval.
- If a managed/child profile's age is **unknown** (no valid DOB on the profile), the install flow will require the guardian to verify age (e.g., by entering DOB) before continuing.

{% endhint %}

{% hint style="info" %}
**Contract-based listings and managed profiles**

If your listing's launch configuration includes a `contractUri`, the install flow will require **guardian approval** for managed/child profiles before the child can install/consent.
{% endhint %}

### Who signs app credentials

App-issued credentials are signed as the app's DID `did:web:network.learncard.com:app:<slug>` (not your personal profile). In the LearnCard App, credentials issued by apps display the app name and icon.

## 3. Test embedded

Launch your draft listing from the Developer Portal. LearnCard loads it in an iframe, and the SDK switches from mock mode to the real host. Verify:

- [ ] `requestIdentity()` returns a real user DID
- [ ] Credentials appear in the test user's wallet after `sendCredential()`
- [ ] Notifications, counters, and any consent flows behave as expected

## 4. Submit for review

Click **Submit for Review** in the Developer Portal. The status moves to **PENDING_REVIEW**, then to **LISTED** after approval. You can unsubmit a pending listing or later mark it **ARCHIVED**.

{% hint style="info" %}
There is currently no automatic notification when your listing is approved — check the Developer Portal, or contact [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io) with questions about a pending review.
{% endhint %}

## Know who the user is

Inside LearnCard, the Partner Connect SDK asks the host for the user's identity:

```typescript
const { token, user } = await learnCard.requestIdentity();
```

Use `user.did` as the stable ID. Never trust `user.did` from the browser without verifying `token`. The `token` is a DID-Auth Verifiable Presentation JWT signed by the user's key and bound to your app's origin.

Verify it on your backend:

```typescript
import { initLearnCard } from '@learncard/init';

const lc = await initLearnCard();
const result = await lc.invoke.verifyPresentation(token, { proofFormat: 'jwt' });

if (result.errors.length > 0) {
    throw new Error('Invalid token');
}

const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
if (payload.iss !== user.did) {
    throw new Error('Token issuer does not match user DID');
}
```

## What else your app can do

The Partner Connect SDK provides several advanced capabilities for apps:

| Capability                 | What it's for                                                       | Reference                                                                                                                |
| :------------------------- | :------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------- |
| **Request consent**        | Ask users to accept terms or data sharing agreements                | [`requestConsent`](../sdks/partner-connect/methods.md#requestconsent-contracturi-options)                                |
| **Learner context for AI** | Retrieve a user's credentials and profile data to personalize AI    | [`requestLearnerContext`](../sdks/partner-connect/methods.md#requestlearnercontext-options)                              |
| **Record AI sessions**     | Save structured summaries of AI tutoring or interactions            | [`sendAiSessionCredential`](../sdks/partner-connect/methods.md#sendaisessioncredential-input)                            |
| **Counters**               | Track progress, streaks, or thresholds (up to 50 keys per app/user) | [`incrementCounter` / `getCounter`](../sdks/partner-connect/methods.md#counters-incrementcounter-getcounter-getcounters) |

## For schools and districts

For schools or districts with network filtering, allow outbound traffic to these domains. The SDK's separate `hostOrigin` setting controls which LearnCard hosts can send messages to your app.

| Domain                  | Purpose                        |
| :---------------------- | :----------------------------- |
| `learncard.app`         | The LearnCard host application |
| `network.learncard.com` | LearnCloud Network API         |
| `cloud.learncard.com`   | LearnCloud Storage / xAPI      |

Self-hosted and staging environments use the domains in their tenant configuration.

## Rate limits & good citizenship

- In-app notifications: 10/hour per user per app via the SDK; 60/hour per app via the server-to-server route
- Counters: up to 50 keys per app per user
- Never bypass origin validation, and handle every SDK call's rejection path — users can decline any request

See [Errors & Limits](../sdks/learncard-network/errors-and-limits.md) for the authoritative rate-limit reference (including the counter write-rate limit).

## Full API reference

[Partner Connect SDK](../sdks/partner-connect/README.md) documents every method, type, error code, and mock-mode option — see also [Methods](../sdks/partner-connect/methods.md) and [Errors, Types & Migration](../sdks/partner-connect/errors-and-types.md).

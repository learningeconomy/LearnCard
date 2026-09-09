---
description: Take your app from local dev to published in the LearnCard app store.
---

# Publish Your App in LearnCard

Users install your product from the LearnCard app store. The [Partner Connect SDK](../sdks/partner-connect.md) provides single sign-on, credential issuance, notifications, and learner context.

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

## Rate limits & good citizenship

- In-app notifications: 10/hour per user per app via the SDK; 60/hour per app via the server-to-server route
- Counters: up to 50 keys per app per user
- Never bypass origin validation, and handle every SDK call's rejection path — users can decline any request

See [Errors & Limits](../sdks/learncard-network/errors-and-limits.md) for the authoritative rate-limit reference (including the counter write-rate limit).

## Full API reference

[Partner Connect SDK](../sdks/partner-connect.md) documents every method, type, error code, and mock-mode option.

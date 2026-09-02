---
description: Take your app from local dev to published in the LearnCard app store.
---

# Publish Your App in LearnCard

Your product, inside LearnCard: users install your app from the app store and launch it with single sign-on, credential issuance, notifications, and learner context — all via the [Partner Connect SDK](../sdks/partner-connect.md).

## 1. Build locally — no registration needed

The SDK ships with a full mock mode. On localhost it simulates the LearnCard host automatically, so you can build your entire app before registering anything:

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

In mock mode every call shows a toast describing what would happen in production, counters persist to localStorage, and `requestIdentity()` returns a seeded mock user. When your app runs embedded inside LearnCard, the same code talks to the real host — no changes.

**Working example**: the [Basic Launchpad app](https://github.com/learningeconomy/LearnCard/tree/main/examples/app-store-apps/1-basic-launchpad-app) (~200 lines, Astro + vanilla JS) exercises every SDK method.

## 2. Register your listing

In the LearnCard app, open **App Store → Developer Portal** (`/app-store/developer`) and run the Partner Onboarding Wizard. It walks you through:

1. Project setup (creates your Integration — the entity that owns your listings and templates)
2. Signing authority (for server-side credential issuance)
3. Branding — name, tagline, icon, description
4. Credential template builder (defines the `templateAlias` values your app issues)
5. Integration method — `EMBEDDED_IFRAME` with your app's URL
6. Data mapping, sandbox test, and production checks

Your listing starts as a **DRAFT** — visible to you, not the public.

## 3. Test embedded

Launch your draft listing from the Developer Portal. LearnCard loads your app in an iframe; the SDK detects the real host and switches out of mock mode automatically. Verify:

-   [ ] `requestIdentity()` returns a real user DID
-   [ ] Credentials appear in the test user's wallet after `sendCredential()`
-   [ ] Notifications, counters, and any consent flows behave as expected

## 4. Submit for review

Click **Submit for Review** on your listing in the Developer Portal — its status moves to **PENDING_REVIEW**. The LearnCard team reviews it; on approval the status becomes **LISTED** and your app appears in the public app store. (You can unsubmit while it's pending; listings can later be **ARCHIVED**.)

{% hint style="info" %}
There is currently no automatic notification when your listing is approved — check the Developer Portal, or contact [sdk@learningeconomy.io](mailto:sdk@learningeconomy.io) with questions about a pending review.
{% endhint %}

## Rate limits & good citizenship

-   In-app notifications: 10/hour per user per app via the SDK; 60/hour per app via the server-to-server route
-   Counters: up to 50 keys per app per user
-   Never bypass origin validation, and handle every SDK call's rejection path — users can decline any request

## Full API reference

Every method, type, error code, and mock-mode option: [Partner Connect SDK](../sdks/partner-connect.md).

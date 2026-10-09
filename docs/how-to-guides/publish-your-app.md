---
description: Build, try, and publish an app that runs inside LearnCard and issues credentials to its users.
---

# Build an App Inside LearnCard

Users install your app from the LearnCard app store. The [Partner Connect SDK](../sdks/partner-connect/README.md) gives your app sign-in, credential issuance, permission requests, notifications, and learner context.

The whole flow is **Build → Try → Publish**. You build against a practice version of LearnCard, then publish from the app itself.

{% hint style="info" %}
**~20 min to a working app** · No LearnCard account is needed until you publish.
{% endhint %}

## 1. Build with practice mode

Install the SDK:

```bash
npm install @learncard/partner-connect
```

Then use it like this:

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({ hostOrigin: 'https://learncard.app' });

// Sign the learner in
const { user } = await learnCard.requestIdentity();

// Award a credential. LearnCard creates the template the first time you publish.
await learnCard.sendCredential({
    alias: 'course-complete',
    template: {
        name: 'Completed {{courseName}}',
        description: 'Awarded for finishing {{courseName}}.',
        achievementType: 'Course',
        criteria: { narrative: 'Finished all modules' },
    },
    templateData: { courseName: 'Intro to Baking' },
});

// Ask permission, saying exactly what you need
const { granted } = await learnCard.requestConsent({
    read: { credentialCategories: ['Achievement'], personalFields: ['name'] },
    reason: 'Personalize your experience',
});
```

When your app runs on `localhost` or in the editor preview of Lovable, Bolt, v0, or Replit, the SDK switches to **practice mode** automatically:

- Every call works and shows a short notice of what would happen inside LearnCard. `requestIdentity()` returns a practice profile, credentials and counters are kept in the browser, and permission requests are approved.
- A **Practice mode** panel in the bottom-left corner lists the LearnCard features your app uses, in plain words.
- **Start over** in that panel (or `learnCard.resetPracticeMode()`) clears what was recorded for this app, so it publishes as a new app.

Inside LearnCard, the same code talks to the real host. Practice mode never turns on for a published address such as `*.lovable.app` or your own domain. See [Standalone / Mock Mode](../sdks/partner-connect/README.md#standalone-mock-mode) for every option.

{% hint style="warning" %}
**Say what you're asking for.** Calling `requestConsent()` with no details is approved in practice, but LearnCard needs to know what to ask the learner. Practice mode flags this as **Not set up yet**. Either pass the details as above, or choose them on the publish page (one tap).
{% endhint %}

**Working example**: the [Basic Launchpad app](https://github.com/learningeconomy/LearnCard/tree/main/examples/app-store-apps/1-basic-launchpad-app) (Astro + vanilla JS) exercises every SDK method.

{% hint style="info" %}
**Add an icon.** Publishing picks up your app's `apple-touch-icon` or largest favicon as its store icon, so add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` to your page.
{% endhint %}

## 2. Publish from your app

Click **Publish app** in the practice panel (or **Publish to LearnCard** on the card that appears once your app uses LearnCard). The publish page opens in LearnCard:

1. **Sign in or create an account.** You come straight back to your app afterwards.
2. **Fill in your store listing.** The name and icon are filled in from your app. Add a tagline, description, category, and screenshots — the **Store preview** shows the listing as learners will see it. Changes save as you go.
3. **Choose where your app will live.** If you published from `localhost` or a builder preview, enter your public address (for example `https://myapp.com`). Learners can't open local or preview addresses.
4. **Try your app.** Switch to **Try your app** to run it inside LearnCard with a real account. Use **Use a test address** to try a version still running on your computer or in a builder preview — learners always get your public address. Anything new your app does while you try it is added to the listing.
5. **Set up permission requests if asked.** If your app asks for permission without saying what for, the page suggests choices based on what your app does. Tap **Enable Consent** and the preview reloads so you can check it.
6. Click **Submit for Review**.

LearnCard recognizes your app each time you publish, so re-publishing updates the same listing instead of creating a new one. If several apps share one address (for example a few examples on `localhost:4321`), each keeps its own identity; set `mockOptions.appId` to pin it. If LearnCard isn't sure which app you mean, it asks.

{% hint style="info" %}
Testing against a local copy of LearnCard? Open your app with `?lc_publish_override=http://localhost:3000` so **Publish app** goes there. See the [SDK README](https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-partner-connect-sdk#1-lc_publish_override-no-code-changes).
{% endhint %}

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
- If a managed/child profile's age is **unknown** (no valid date of birth on the profile), the install flow will require the guardian to verify age (e.g., by entering a date of birth) before continuing.

{% endhint %}

{% hint style="info" %}
**Permission requests and managed profiles**

If your app asks learners for permission (a consent flow), the install flow requires **guardian approval** for managed/child profiles before the child can install or agree.
{% endhint %}

## 3. After you submit

Every app has a status page under **Your Apps** (`/app-store/developer`), which shows where it is:

| Status        | What it means                                             | What you can do                   |
| :------------ | :-------------------------------------------------------- | :-------------------------------- |
| **Draft**     | Only you can see it.                                      | Edit, try, submit, or delete it.  |
| **In review** | Waiting for the LearnCard team.                           | Withdraw it to make more changes. |
| **Live**      | In the app store.                                         | Submit updates.                   |
| **Removed**   | Not in the store — it wasn't approved, or was taken down. | Delete it, then publish again.    |

You get a LearnCard notification when your app is approved or needs changes.

**Updating a live app.** Edits to a live app — including new features your app starts using — are saved as an update and go through review. Learners keep seeing the current version until the update is approved. You can withdraw or discard a pending update at any time.

### Who signs app credentials

Credentials your app issues are signed by your app, not your personal account (technically, the app's identifier `did:web:network.learncard.com:app:<slug>`). In the LearnCard App, they show your app's name and icon.

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
| **Award credentials**      | Issue badges and certificates from templates defined in your code   | [`sendCredential`](../sdks/partner-connect/methods.md#sendcredential-input)                                              |
| **Request consent**        | Ask users to share data or accept terms                             | [`requestConsent`](../sdks/partner-connect/methods.md#requestconsent-contracturi-options)                                |
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

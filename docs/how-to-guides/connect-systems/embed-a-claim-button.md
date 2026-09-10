---
description: 'How-To Guide: Add a credential claim button to any website using the LearnCard Embed SDK'
---

# Embed a Claim Button

Add a "Claim Credential" button to any webpage. When a user clicks it, a modal walks them through email verification and deposits the credential into their LearnCard wallet.

**~15 minutes · Needs:** a publishable key from the Developer Portal and a credential template.

{% hint style="info" %}
This is for **external websites** that want to award credentials to visitors. If you're building an app that runs _inside_ the LearnCard App Store, see [Build an App Inside LearnCard](../publish-your-app.md) instead.
{% endhint %}

## Or let the CLI do it

Run `npx @learncard/cli embed -y` to configure a primary signing authority and an integration, then serve the generated `claim-button.html` from `http://localhost:3000`, not `file://`. The CLI replaces the publishable-key placeholder and selects your network's API URL. This example uses a full unsigned badge, so no named template is needed. The current SDK's `LearnCard.init()` renders the button; it does not expose `LearnCard.claim()`.

<!-- snippet: cli/claim-button.html -->

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Claim your badge</title>
    </head>
    <body>
        <h1>Claim your badge</h1>
        <div id="claim-button"></div>
        <script src="https://cdn.jsdelivr.net/npm/@learncard/embed-sdk@latest/dist/learncard.js"></script>
        <script>
            // init renders the Claim button. The current SDK does not export claim().
            LearnCard.init({
                target: '#claim-button',
                publishableKey: 'PUBLISHABLE_KEY_PLACEHOLDER',
                apiBaseUrl: 'https://network.learncard.com/api',
                // A full unsigned badge works without a named integration template.
                credential: {
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                        'https://ctx.learncard.com/boosts/1.0.3.json',
                    ],
                    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
                    name: 'Badge Name',
                    credentialSubject: {
                        type: ['AchievementSubject'],
                        achievement: {
                            id: 'urn:uuid:552bf83b-7700-4c3a-b1ce-2d8f8ee68811',
                            type: ['Achievement'],
                            name: 'Badge Name',
                            description: 'Claimed a badge with LearnCard.',
                            criteria: { narrative: 'Clicked the Claim button.' },
                        },
                    },
                },
            });
        </script>
    </body>
</html>
```

<!-- /snippet -->

## Prerequisites

- A LearnCard developer account with an **Embed** integration created in the [Developer Portal](https://learncard.app/app-store/developer)
- At least one **credential template** attached to that integration
- Your integration's **publishable key** (`pk_...`)

## Step 1: Create Your Integration & Template

1. Go to the Developer Portal → **Guides** → **Embed Claim Button**
2. Follow the setup guide: set your partner name, create a credential template
3. Copy your **publishable key** from the **Embed Code** tab

## Step 2: Add the SDK

{% tabs %}
{% tab title="Script Tag (CDN)" %}

```html
<script src="https://cdn.jsdelivr.net/npm/@learncard/embed-sdk@latest/dist/learncard.js"></script>
```

{% endtab %}
{% tab title="npm/ESM" %}

```bash
npm install @learncard/embed-sdk
```

```js
import { init } from '@learncard/embed-sdk';
```

{% endtab %}
{% endtabs %}

## Step 3: Initialize the SDK

Add a target element and call `init()`:

```html
<!-- Where the button should appear -->
<div id="claim-credential"></div>

<script>
    LearnCard.init({
        publishableKey: 'pk_your_key_here',
        target: '#claim-credential',
        credential: { name: 'Your Template Name' },
        partnerName: 'Your Organization Name',
    });
</script>
```

The credential name must match a template you created in the Developer Portal. The SDK resolves it server-side.

## Step 4: Customize Branding (Optional)

```js
LearnCard.init({
    publishableKey: 'pk_your_key_here',
    target: '#claim-credential',
    credential: { name: 'Course Completion' },
    partnerName: 'Learning Economy Academy',
    branding: {
        primaryColor: '#1F51FF', // Button + stepper color
        accentColor: '#0F3BD9', // Hover states
        partnerLogoUrl: 'https://your-org.com/logo.png',
        walletUrl: 'https://app.learncard.com',
    },
});
```

## Step 5: Handle Success (Optional)

After claiming, the SDK opens the wallet in a new tab (deep-linked to the credential via `handoffUrl`) and shows a success screen. Hook into this with `onSuccess`:

```js
LearnCard.init({
    publishableKey: 'pk_your_key_here',
    target: '#claim-credential',
    credential: { name: 'Course Completion' },
    onSuccess: ({ credentialId, handoffUrl }) => {
        // Runs in addition to the wallet auto-open
        document.getElementById('success-message').style.display = 'block';
    },
});
```

To suppress the automatic wallet redirect entirely, set `branding.walletUrl: ''`:

```js
LearnCard.init({
    publishableKey: 'pk_your_key_here',
    target: '#claim-credential',
    credential: { name: 'Course Completion' },
    branding: { walletUrl: '' }, // Disable auto-open
    onSuccess: ({ credentialId, handoffUrl }) => {
        // You fully control what happens next
        document.getElementById('success-message').style.display = 'block';
    },
});
```

## Complete Example

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Course Complete</title>
    </head>
    <body>
        <h1>Congratulations! You finished the course.</h1>
        <p>Claim your credential to add it to your LearnCard wallet.</p>

        <div id="claim-credential"></div>
        <div id="success" style="display:none; color: green;">
            ✅ Credential claimed! Check your LearnCard wallet.
        </div>

        <script src="https://cdn.jsdelivr.net/npm/@learncard/embed-sdk@latest/dist/learncard.js"></script>
        <script>
            LearnCard.init({
                publishableKey: 'pk_your_key_here',
                target: '#claim-credential',
                credential: { name: 'Intro to Digital Credentials — Course' },
                partnerName: 'Learning Economy Academy',
                branding: {
                    primaryColor: '#2EC4A5',
                    partnerLogoUrl: 'https://your-org.com/logo.png',
                },
                onSuccess: () => {
                    document.getElementById('success').style.display = 'block';
                },
            });
        </script>
    </body>
</html>
```

The modal verifies the visitor's email with a one-time code, then deposits the credential in their LearnCard; see [How it works](../../sdks/embed-sdk.md#how-it-works).

## Whitelisted Domains

The API only accepts claims from domains whitelisted in the Embed Code tab of your Developer Portal. Add your production domain before going live.

During local development, `localhost` is allowed automatically.

## Troubleshooting

**"This integration could not be found"**
Your `publishableKey` doesn't match an active integration. Check the key from your Developer Portal Embed Code tab and ensure your domain is whitelisted.

**Credential not appearing after claim**
The credential lands in the user's inbox and is finalized when they open their wallet. To verify immediately, check the Developer Portal's activity tab.

**OTP not arriving**
In local dev, check your brain-service logs — OTP codes are printed there when no email provider is configured.

## See Also

- [Embed SDK Reference](../../sdks/embed-sdk.md)
- [Connect a User's LearnCard to Your Platform](../../tutorials/create-a-consentflow.md) — for an ongoing link instead of one-off claims
- [Build an App Inside LearnCard](../publish-your-app.md) — for apps inside LearnCard

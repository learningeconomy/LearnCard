---
description: 'How-To Guide: Issue Credentials from Embedded Apps in the LearnCard App Store'
---

# Connect an Embedded App

Build apps that run inside LearnCard and issue credentials directly to users. This guide covers the App Store integration for embedded applications that want to award badges, certificates, or other verifiable credentials.

## Overview

The LearnCard App Store allows third-party applications to be embedded within the LearnCard app. These embedded apps can:

-   **Authenticate users** via Single Sign-On (SSO)
-   **Issue credentials** directly to the user's wallet
-   **Request credentials** for verification or gating

This is ideal for:

-   Learning platforms awarding course completion badges
-   Games issuing achievement credentials
-   Assessment tools providing certification
-   Any app that wants to reward users with verifiable credentials

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   LearnCard App                      │
│  ┌───────────────────────────────────────────────┐  │
│  │              Your Embedded App                 │  │
│  │                                               │  │
│  │   1. User completes action                    │  │
│  │   2. App calls sendAppEvent('send-credential')│  │
│  │   3. LearnCard issues from your boost template│  │
│  │   4. User sees claim modal                    │  │
│  │   5. Credential stored in wallet              │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

1. **App Store Listing** - Your app must be registered in the LearnCard App Store
2. **Boost Templates** - Pre-configured credential templates attached to your listing
3. **Partner Connect SDK** - For communication with the LearnCard host

## Quick Start

### Step 1: Install the SDK

{% tabs %}
{% tab title="npm" %}

```bash
npm install @learncard/partner-connect
```

{% endtab %}

{% tab title="pnpm" %}

```bash
pnpm add @learncard/partner-connect
```

{% endtab %}

{% tab title="yarn" %}

```bash
yarn add @learncard/partner-connect
```

{% endtab %}
{% endtabs %}

### Step 2: Initialize and Send a Credential

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});

// When user completes an achievement, send a credential
async function awardBadge() {
    try {
        const result = await learnCard.sendAppEvent({
            type: 'send-credential',
            boostId: 'course-completion', // Your boost ID from the App Store
            templateData: {
                // Optional: customize the credential
                courseName: 'JavaScript 101',
                completionDate: new Date().toISOString(),
            },
        });

        console.log('Credential issued!', result.credentialUri);
    } catch (error) {
        console.error('Failed to issue credential:', error);
    }
}
```

That's it! The user will see a claim modal and can accept the credential into their wallet.

## Setting Up Your App Store Listing

### 1. Create Your App Listing

In the LearnCard Developer Portal, create a new app listing with:

-   **Name & Description** - What your app does
-   **Launch URL** - Where your embedded app is hosted
-   **Permissions** - Request `credentials:write` to issue credentials

### 2. Create Boost Templates

Boosts are credential templates that define what badges your app can issue. For each type of credential:

1. Go to your app listing's **Credentials** tab
2. Click **Add Credential Template**
3. Design your credential (name, description, image, achievement type)
4. Assign a **Boost ID** (e.g., `course-completion`, `level-up`, `certification`)

The Boost ID is what you'll reference when issuing credentials from your app.

### 3. Configure Signing Authority

When you add a boost to your listing, LearnCard automatically configures a signing authority. This allows credentials to be issued on behalf of your app with proper cryptographic signatures.

## API Reference

### `sendAppEvent({ type: 'send-credential', ... })`

Issue a credential to the current user.

**Parameters:**

| Parameter      | Type                | Required | Description                                 |
| -------------- | ------------------- | -------- | ------------------------------------------- |
| `type`         | `'send-credential'` | Yes      | Event type for credential issuance          |
| `boostId`      | `string`            | Yes      | The Boost ID configured in your app listing |
| `templateData` | `object`            | No       | Dynamic data to inject into the credential  |

**Returns:** `Promise<SendCredentialResponse>`

```typescript
interface SendCredentialResponse {
    credentialUri: string; // URI of the issued credential
    boostUri: string; // URI of the boost template used
}
```

**Example with Template Data:**

```typescript
const result = await learnCard.sendAppEvent({
    type: 'send-credential',
    boostId: 'quiz-master',
    templateData: {
        score: 95,
        quizName: 'Advanced TypeScript',
        attempts: 1,
    },
});
```

### Error Handling

```typescript
try {
    const result = await learnCard.sendAppEvent({
        type: 'send-credential',
        boostId: 'my-badge',
    });
} catch (error) {
    switch (error.code) {
        case 'LC_UNAUTHENTICATED':
            // User not logged in
            showLoginPrompt();
            break;
        case 'BOOST_NOT_FOUND':
            // boostId doesn't exist for this app
            console.error('Invalid boost ID');
            break;
        case 'UNAUTHORIZED':
            // App doesn't have permission
            console.error('Missing credentials:write permission');
            break;
        default:
            console.error('Credential issuance failed:', error.message);
    }
}
```

## User Experience Flow

When your app issues a credential:

1. **Credential Created** - LearnCard issues the credential using your boost template
2. **Claim Modal Appears** - User sees a preview of the credential
3. **User Accepts** - Credential is stored in their wallet
4. **Notification Updated** - If user dismisses, they can claim later from notifications

```
┌──────────────────────────────────┐
│     🎉 New Credential!           │
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │    [Credential Preview]    │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  JavaScript 101 Completion       │
│  Awarded by YourApp              │
│                                  │
│  ┌────────────────────────────┐  │
│  │     Accept Credential      │  │
│  └────────────────────────────┘  │
│                                  │
│         [Dismiss]                │
└──────────────────────────────────┘
```

## Complete Example

Here's a full example of a simple embedded app:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Quiz App</title>
    </head>
    <body>
        <div id="quiz">
            <h1>JavaScript Quiz</h1>
            <button id="complete">Complete Quiz</button>
        </div>

        <script type="module">
            import { createPartnerConnect } from '@learncard/partner-connect';

            const learnCard = createPartnerConnect();

            // Get user identity for personalization
            async function init() {
                try {
                    const identity = await learnCard.requestIdentity();
                    console.log('User:', identity.user.did);
                } catch (e) {
                    if (e.code === 'LC_UNAUTHENTICATED') {
                        // Handle unauthenticated state
                    }
                }
            }

            // Award badge when quiz is completed
            document.getElementById('complete').addEventListener('click', async () => {
                try {
                    const result = await learnCard.sendAppEvent({
                        type: 'send-credential',
                        boostId: 'quiz-completion',
                        templateData: {
                            quizName: 'JavaScript Fundamentals',
                            score: 92,
                            completedAt: new Date().toISOString(),
                        },
                    });

                    alert('Badge awarded! Check your wallet.');
                } catch (error) {
                    alert('Failed to award badge: ' + error.message);
                }
            });

            init();
        </script>
    </body>
</html>
```

## Best Practices

### 1. Design Meaningful Credentials

-   Use clear, descriptive names
-   Include relevant achievement details
-   Add appealing images/icons
-   Set appropriate achievement types (Badge, Certificate, etc.)

### 2. Issue at the Right Moment

-   Award credentials immediately after achievement
-   Don't spam users with too many credentials
-   Consider combining small achievements into milestone badges

### 3. Handle Errors Gracefully

-   Always wrap credential issuance in try/catch
-   Provide feedback to users on success/failure
-   Log errors for debugging

### 4. Test Thoroughly

-   Use the App Preview feature in the Developer Portal
-   Test with different user states (logged in, logged out)
-   Verify credentials appear correctly in the wallet

## Testing Your Integration

### Using the Developer Portal Preview

1. Go to your app listing in the Developer Portal
2. Click **Preview App**
3. Your app loads in a test iframe
4. Test credential issuance - credentials go to your wallet

### Local Development

For local development, you can use the `lc_host_override` query parameter:

```typescript
const learnCard = createPartnerConnect({
    hostOrigin: [
        'https://learncard.app',
        'http://localhost:3000', // For local testing
    ],
});
```

## Related Documentation

-   [Partner Connect SDK](../../sdks/partner-connect.md) - Full SDK reference
-   [Boost Credentials](../../core-concepts/credentials-and-data/boost-credentials.md) - Understanding boosts
-   [Connect a Website](./connect-a-website.md) - Alternative: server-side issuance via ConsentFlow
-   [Connect a Game](./connect-a-game.md) - Game-specific integration patterns

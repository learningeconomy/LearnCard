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
-   **Request consent** for data sharing agreements and terms acceptance

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
│  │   2. App calls sendCredential(templateAlias)  │  │
│  │   3. LearnCard issues from your template      │  │
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
const learnCard = createPartnerConnect();

// When user completes an achievement, send a credential
async function awardBadge() {
    try {
        const result = await learnCard.sendCredential({
            templateAlias: 'course-completion', // Your template alias from the App Store
            templateData: {
                // Optional: fill in template variables
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
-   **Age Rating** - Content rating for your app (optional)
-   **Minimum Age** - Minimum user age required to access your app (optional)

#### Age Restrictions

You can configure age-based access controls for your app:

| Field        | Type                                   | Description                                                                                                         |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `age_rating` | `'4+'` \| `'9+'` \| `'12+'` \| `'17+'` | Content rating similar to app store ratings. Indicates the maturity level of content.                               |
| `min_age`    | `number` (0-18)                        | Minimum age (in years) required to access this app. Users below this age will not see or be able to launch the app. |

{% hint style="info" %}
Age restrictions are enforced based on the user's date of birth in their profile
{% endhint %}

{% hint style="warning" %}
**Hard vs soft enforcement**

-   **`min_age`** is a hard minimum age requirement. If a user's age is known and below `min_age`, the user is blocked from installing the app (including for managed/child profiles).
-   **`age_rating`** is a content rating. For managed/child profiles, installs that would violate the rating will require guardian approval.
-   If a managed/child profile's age is **unknown** (no valid DOB on the profile), the install flow will require the guardian to verify age (e.g., by entering DOB) before continuing.
    {% endhint %}

{% hint style="info" %}
**Contract-based listings and managed profiles**

If your listing's launch configuration includes a `contractUri`, the install flow will require **guardian approval** for managed/child profiles before the child can install/consent.
{% endhint %}

### 2. Create Credential Templates

Templates define what credentials your app can issue. For each type of credential:

1. Go to your app listing's **Templates** tab
2. Click **Add Template**
3. Design your credential (name, description, image, achievement type)
4. Note the **Template Alias** (auto-generated from name, e.g., `course-completion`)

The Template Alias is what you'll reference when issuing credentials from your app.

### 3. Configure Signing Authority

When you add a template to your listing, LearnCard automatically configures a signing authority. This allows credentials to be issued on behalf of your app with proper cryptographic signatures.

### 4. App Issuer Identity

App-issued credentials are signed as the app DID, not the integration owner's DID. The format is:

```
did:web:network.learncard.com:app:<slug>
```

In the LearnCard App, credentials issued by apps display the app name and icon (with a link back to the app listing).

## API Reference

### `sendCredential({ templateAlias, templateData? })`

Issue a credential to the current user.

**Parameters:**

| Parameter       | Type     | Required | Description                                       |
| --------------- | -------- | -------- | ------------------------------------------------- |
| `templateAlias` | `string` | Yes      | The template alias configured in your app listing |
| `templateData`  | `object` | No       | Values for template variables (e.g., `{{name}}`)  |

**Returns:** `Promise<TemplateCredentialResponse>`

```typescript
interface TemplateCredentialResponse {
    credentialUri: string; // URI of the issued credential
    boostUri: string; // URI of the boost template used
}
```

**Example with Template Data:**

```typescript
const result = await learnCard.sendCredential({
    templateAlias: 'quiz-master',
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
    const result = await learnCard.sendCredential({
        templateAlias: 'my-badge',
    });
} catch (error) {
    switch (error.code) {
        case 'LC_UNAUTHENTICATED':
            // User not logged in
            showLoginPrompt();
            break;
        case 'TEMPLATE_NOT_FOUND':
            // templateAlias doesn't exist for this app
            console.error('Invalid template alias');
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

### `initiateTemplateIssue(templateUri)`

Let users send peer-to-peer badges to each other. Unlike `sendCredential` (which issues from your app to the current user), this opens a flow where the user selects a recipient from their contacts.

**Parameters:**

| Parameter     | Type     | Required | Description                           |
| ------------- | -------- | -------- | ------------------------------------- |
| `templateUri` | `string` | Yes      | The URI of the badge template to send |

**Returns:** `Promise<TemplateIssueResponse>`

```typescript
interface TemplateIssueResponse {
    issued: boolean; // Whether the user completed the issuance flow
}
```

**Example:**

```typescript
// Let users send a "Thank You" badge to someone
async function sendThankYouBadge() {
    try {
        const result = await learnCard.initiateTemplateIssue('urn:lc:boost:thank-you-badge');

        if (result.issued) {
            console.log('Badge sent successfully!');
        } else {
            console.log('User cancelled the badge flow');
        }
    } catch (error) {
        console.error('Failed to initiate badge:', error);
    }
}
```

**How it works:**

1. Your app calls `initiateTemplateIssue` with a template URI
2. LearnCard opens a recipient picker for the user
3. User selects someone from their contacts
4. Badge is sent from the user to the recipient

**Setting up peer badge templates:**

1. Go to your app listing's **Templates** tab
2. Create a template and select **Peer Badge** as the type
3. Copy the **Template URI** shown after creation
4. Use this URI when calling `initiateTemplateIssue`

{% hint style="info" %}
Peer badges are sent **from the user** to another person, not from your app. This is ideal for recognition, gratitude, or social features within your app.
{% endhint %}

### `requestConsent(contractUri, options?)`

Request user consent for a ConsentFlow contract. This is useful when your app needs explicit user permission for data sharing, terms acceptance, or other consent-based flows.

**Parameters:**

| Parameter     | Type                    | Required | Description                             |
| ------------- | ----------------------- | -------- | --------------------------------------- |
| `contractUri` | `string`                | Yes      | The URI of the ConsentFlow contract     |
| `options`     | `RequestConsentOptions` | No       | Additional options for the consent flow |

**Options:**

| Option     | Type      | Default | Description                                                                 |
| ---------- | --------- | ------- | --------------------------------------------------------------------------- |
| `redirect` | `boolean` | `false` | If `true`, redirects to the contract's configured URL after consent granted |

**Returns:** `Promise<ConsentResponse>`

```typescript
interface ConsentResponse {
    granted: boolean; // Whether the user granted consent
}
```

**Basic Example:**

```typescript
// Request consent for a data sharing agreement
const result = await learnCard.requestConsent('urn:lc:contract:my-data-agreement');

if (result.granted) {
    console.log('User granted consent!');
    // Proceed with data access
} else {
    console.log('User declined consent');
}
```

**With Redirect:**

```typescript
// Request consent and redirect to your callback URL after approval
const result = await learnCard.requestConsent('urn:lc:contract:my-agreement', {
    redirect: true,
});

// If redirect is true and user consents, they will be redirected
// to the contract's configured redirectUrl with a VP (Verifiable Presentation)
// containing proof of consent
```

**How Redirect Works:**

When `redirect: true` is set and the user grants consent:

1. LearnCard generates a Verifiable Presentation (VP) proving consent
2. User is redirected to the contract's `redirectUrl`
3. The VP and user's DID are appended as URL parameters
4. Your server can verify the VP to confirm consent

The redirect URL will include:
- `did` - The user's DID
- `vp` - A signed Verifiable Presentation (JWT format)

**Use Cases:**

- **Terms of Service** - Require users to accept terms before accessing features
- **Data Sharing Agreements** - Get explicit consent before sharing data with third parties
- **Privacy Policies** - Track user acknowledgment of privacy policies
- **OAuth-like Flows** - Use redirect mode for server-side consent verification

{% hint style="info" %}
If the user has already consented to a contract, calling `requestConsent` will return `{ granted: true }` immediately without showing the consent modal again.
{% endhint %}

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
│  By YourApp                      │
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
                    const result = await learnCard.sendCredential({
                        templateAlias: 'quiz-completion',
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

For local development, use the Developer Portal's **Preview App** feature which provides a test iframe environment. Your app will be loaded within LearnCard and credentials will be issued to your test wallet.

## Related Documentation

-   [Partner Connect SDK](../../sdks/partner-connect.md) - Full SDK reference
-   [Boost Credentials](../../core-concepts/credentials-and-data/boost-credentials.md) - Understanding boosts
-   [Connect a Website](./connect-a-website.md) - Alternative: server-side issuance via ConsentFlow
-   [Connect a Game](./connect-a-game.md) - Game-specific integration patterns

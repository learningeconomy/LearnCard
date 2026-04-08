# Partner Connect SDK

> Promise-based JavaScript SDK for secure cross-origin communication between partner apps and LearnCard

The Partner Connect SDK transforms complex `postMessage` communication into clean, modern Promise-based functions. It handles the entire cross-origin message lifecycle, including request queuing, origin validation, and timeout management.

## Features

- **🔒 Secure**: Multi-layered origin validation prevents unauthorized access
- **🎯 Type-safe**: Full TypeScript support with comprehensive type definitions
- **⚡ Promise-based**: Modern async/await API eliminates callback complexity
- **🧹 Clean**: Abstracts away all postMessage implementation details
- **📦 Lightweight**: Zero runtime dependencies, ~8KB minified
- **🛡️ Robust**: Built-in timeout handling and structured error management

## Installation

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

## Quick Start

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});

// Request user identity (SSO)
try {
    const identity = await learnCard.requestIdentity();
    console.log('User DID:', identity.user.did);
    console.log('JWT Token:', identity.token);
} catch (error) {
    if (error.code === 'LC_UNAUTHENTICATED') {
        console.log('User is not logged in');
    }
}
```

## API Reference

### Factory Function

#### `createPartnerConnect(options?)`

Creates a new Partner Connect SDK instance.

**Parameters:**

- `options` (`PartnerConnectOptions`, optional): Configuration options. Defaults to `{ hostOrigin: 'https://learncard.app' }`.

**Returns:** `PartnerConnect` instance

**Example:**

```typescript
// Default configuration (uses https://learncard.app)
const learnCard = createPartnerConnect();

// Custom configuration
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
    requestTimeout: 30000,
});
```

{% hint style="info" %}
You can also import and instantiate the `PartnerConnect` class directly:

```typescript
import { PartnerConnect } from '@learncard/partner-connect';
const learnCard = new PartnerConnect();
```

{% endhint %}

### Configuration

#### `PartnerConnectOptions`

```typescript
interface PartnerConnectOptions {
    /**
     * The origin(s) of the LearnCard host
     * Single string or array for query parameter whitelist
     * @default 'https://learncard.app'
     */
    hostOrigin?: string | string[];

    /**
     * Whether to allow native app origins (Capacitor/Ionic)
     * @default true
     */
    allowNativeAppOrigins?: boolean;

    /**
     * Protocol identifier
     * @default 'LEARNCARD_V1'
     */
    protocol?: string;

    /**
     * Request timeout in milliseconds
     * @default 30000
     */
    requestTimeout?: number;
}
```

### Core Methods

#### `requestIdentity()`

Request user identity from LearnCard for Single Sign-On authentication.

**Returns:** `Promise<IdentityResponse>`

**Example:**

```typescript
const identity = await learnCard.requestIdentity();
console.log('User DID:', identity.user.did);
console.log('JWT Token:', identity.token);

// Send token to your backend for validation
await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${identity.token}` },
});
```

**Response Type:**

```typescript
interface IdentityResponse {
    token: string; // JWT token for backend validation
    user: {
        did: string; // User's decentralized identifier
        [key: string]: unknown;
    };
}
```

#### `sendCredential(input)`

Send a credential to the user's LearnCard wallet. Supports two modes:

**Mode 1: Template-Based Issuance (Recommended for App Store Apps)**

Issue a credential using a pre-configured boost template attached to your App Store listing. LearnCard handles signing and delivery.

**Parameters:**

- `input` (`TemplateCredentialInput`): Template alias and optional data

**Returns:** `Promise<TemplateCredentialResponse>`

```typescript
const result = await learnCard.sendCredential({
    templateAlias: 'course-completion',
    templateData: {
        courseName: 'JavaScript 101',
        completionDate: new Date().toISOString(),
    },
});
console.log('Credential URI:', result.credentialUri);
```

**Mode 2: Raw Credential**

Send a pre-signed verifiable credential directly. Your backend must issue and sign the credential first.

**Parameters:**

- `input` (`unknown`): A signed verifiable credential object

**Returns:** `Promise<SendCredentialResponse>`

```typescript
// Your backend issues the credential
const credential = await yourBackend.issueCredential(identity.user.did);

// Send to user's wallet
const response = await learnCard.sendCredential(credential);
console.log('Credential ID:', response.credentialId);
```

{% hint style="info" %}
For App Store embedded apps, template-based issuance is strongly recommended. See [Connect an Embedded App](../how-to-guides/connect-systems/connect-an-embedded-app.md) for a complete walkthrough.
{% endhint %}

#### `launchFeature(featurePath, initialPrompt?)`

Launch a feature in the LearnCard host application.

**Parameters:**

- `featurePath` (`string`): Path to the feature (e.g., '/ai/topics')
- `initialPrompt` (`string`, optional): Initial prompt or data

**Returns:** `Promise<void>`

**Example:**

```typescript
// Launch AI Tutor with initial prompt
await learnCard.launchFeature(
    '/ai/topics?shortCircuitStep=newTopic',
    'Explain how verifiable credentials work'
);

// Navigate to credential sharing
await learnCard.launchFeature('/wallet/share');
```

#### `askCredentialSearch(verifiablePresentationRequest)`

Request credentials from the user's wallet using query criteria.

**Parameters:**

- `verifiablePresentationRequest` (`VerifiablePresentationRequest`): Query specification

**Returns:** `Promise<CredentialSearchResponse>`

**Example:**

```typescript
const response = await learnCard.askCredentialSearch({
    query: [
        {
            type: 'QueryByTitle',
            credentialQuery: {
                reason: 'Verify your certification',
                title: 'JavaScript Expert',
            },
        },
    ],
    challenge: `${Date.now()}-${Math.random()}`,
    domain: window.location.hostname,
});

if (response.verifiablePresentation) {
    // User shared credentials - unlock content
    const credentials = response.verifiablePresentation.verifiableCredential;
    unlockPremiumFeatures(credentials);
}
```

#### `askCredentialSpecific(credentialId)`

Request a specific credential by ID.

**Parameters:**

- `credentialId` (`string`): The ID of the credential to request

**Returns:** `Promise<CredentialSpecificResponse>`

**Example:**

```typescript
const response = await learnCard.askCredentialSpecific('credential-id-123');
if (response.credential) {
    console.log('Received credential:', response.credential);
}
```

#### `requestConsent(contractUri?, options?)`

Request user consent for data access permissions.

{% hint style="info" %}
**App Store Apps**: If your app is installed from the LearnCard App Store and has a consent contract configured in its integration settings, you can omit the `contractUri` parameter. The SDK will automatically resolve the configured contract from your listing.
{% endhint %}

**Parameters:**

- `contractUri` (`string`, optional): URI of the consent contract. Can be omitted for App Store apps with configured contracts.
- `options` (`RequestConsentOptions`, optional): Additional options for the consent flow

| Option     | Type      | Default | Description                                                                 |
| ---------- | --------- | ------- | --------------------------------------------------------------------------- |
| `redirect` | `boolean` | `false` | If `true`, redirects to the contract's configured URL after consent granted |

**Returns:** `Promise<ConsentResponse>`

**Examples:**

```typescript
// For App Store apps with configured contracts (recommended)
// The contract is automatically resolved from your listing's integration
const response = await learnCard.requestConsent();

if (response.granted) {
    console.log('User granted consent using listing contract');
}

// With explicit contract URI (for external/non-app store integrations)
const response = await learnCard.requestConsent(
    'lc:network:network.learncard.com/trpc:contract:abc123'
);

if (response.granted) {
    console.log('User granted consent');
} else {
    console.log('User denied consent');
}

// With redirect - redirects to contract's redirectUrl with VP in URL params
const response = await learnCard.requestConsent(undefined, { redirect: true });
```

#### `initiateTemplateIssue(templateId, draftRecipients?)`

Initiate a template-based credential issuance flow.

**Parameters:**

- `templateId` (`string`): ID of the template/boost to issue
- `draftRecipients` (`string[]`, optional): Array of recipient DIDs

**Returns:** `Promise<TemplateIssueResponse>`

**Example:**

```typescript
const response = await learnCard.initiateTemplateIssue(
    'lc:network:network.learncard.com/trpc:boost:xyz789',
    ['did:key:abc', 'did:key:def']
);

if (response.issued) {
    console.log('Template issued successfully');
}
```

---

#### `requestLearnerContext(options?)`

Request comprehensive learner context for AI tutoring and personalization systems.

This method retrieves the user's credentials and personal data (with their consent), then formats them into either an LLM-ready prompt or structured data that can be used to personalize AI experiences.

**Use Cases:**

- AI tutors that adapt to learner's existing skills and credentials
- Personalized learning pathway recommendations
- Smart content that adjusts based on learner history
- Intelligent assessment systems

**Parameters:**

- `options` (`RequestLearnerContextOptions`, optional): Configuration for what data to include and how to format it

| Option                | Type                       | Default     | Description                                          |
| --------------------- | -------------------------- | ----------- | ---------------------------------------------------- |
| `includeCredentials`  | `boolean`                  | `true`      | Whether to include user's credentials in the context |
| `includePersonalData` | `boolean`                  | `false`     | Whether to include personal data (name, bio, etc.)   |
| `format`              | `'prompt' \| 'structured'` | `'prompt'`  | Format of the response                               |
| `instructions`        | `string`                   | -           | Optional instructions to guide LLM prompt generation |
| `detailLevel`         | `'compact' \| 'expanded'`  | `'compact'` | Level of detail in generated content                 |

**Returns:** `Promise<LearnerContextResponse>`

```typescript
interface LearnerContextResponse {
    /** LLM-ready formatted prompt text */
    prompt: string;

    /** Raw structured data (only when format is 'structured') */
    raw?: {
        credentials: unknown[];
        personalData?: Record<string, unknown>;
    };

    /** User's DID */
    did: string;

    /** User's display name if available */
    displayName?: string;
}
```

**Example - AI Tutor Integration:**

```typescript
// Get LLM-ready prompt for an AI tutor
const context = await learnCard.requestLearnerContext({
    includeCredentials: true,
    includePersonalData: true,
    format: 'prompt',
    instructions: 'Focus on technical skills and certifications',
    detailLevel: 'expanded',
});

// Use in AI system prompt
const systemPrompt = `You are a helpful tutor assisting ${context.displayName || 'a learner'}.

${context.prompt}

Adapt your explanations and recommendations based on the learner's background above.`;

// Send to your AI service
const response = await fetch('/api/ai-tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        systemPrompt,
        userQuestion: 'How do I learn advanced TypeScript?',
    }),
});
```

**Example - Structured Data Access:**

```typescript
// Get raw structured data for custom processing
const context = await learnCard.requestLearnerContext({
    includeCredentials: true,
    includePersonalData: false,
    format: 'structured',
});

// Access credentials directly
console.log('User DID:', context.did);
console.log('Credential count:', context.raw?.credentials.length);

// Process credentials for your own UI
context.raw?.credentials.forEach(cred => {
    console.log('Credential:', cred.name || cred.type);
});
```

**Error Handling:**

```typescript
try {
    const context = await learnCard.requestLearnerContext({
        includeCredentials: true,
        format: 'prompt',
    });

    // Use context.prompt in your AI system
} catch (error) {
    switch (error.code) {
        case 'LC_UNAUTHENTICATED':
            // User not logged in
            showLoginPrompt();
            break;
        case 'USER_REJECTED':
            // User declined to share their data
            showPrivacyNotice();
            break;
        case 'UNAUTHORIZED':
            // App doesn't have permission to request learner context
            console.error('Missing required permissions');
            break;
        default:
            console.error('Failed to get learner context:', error.message);
    }
}
```

{% hint style="info" %}
**Prerequisites for Learner Context:**

1. Your app must be installed from the LearnCard App Store
2. The user must have consented to a contract that grants access to their credentials
3. The consent contract must be configured in your app's listing integration

Use `requestConsent()` before calling `requestLearnerContext()` if the user hasn't consented yet.
{% endhint %}

#### `sendAiSessionCredential(input)`

Send an AI Session credential to record a learning interaction. AI Sessions are organized under AI Topics, creating a structured history of AI tutoring sessions that appears in the user's AI Topics page.

**Use Cases:**

- **AI Tutoring Apps** - Record what was learned during a tutoring session
- **Learning Assistants** - Track learning progress and outcomes
- **Skill Assessment** - Document demonstrated competencies
- **Learning Pathways** - Build a history of learning interactions

**Parameters:**

- `input` (`SendAiSessionCredentialInput`): Session details

| Property       | Type                      | Required | Description                            |
| -------------- | ------------------------- | -------- | -------------------------------------- |
| `sessionTitle` | `string`                  | Yes      | Title of this specific AI session      |
| `summaryData`  | `SummaryCredentialData`   | Yes      | Structured data about what was learned |
| `metadata`     | `Record<string, unknown>` | No       | Optional metadata for the session      |

**Summary Data Structure:**

```typescript
interface SummaryCredentialData {
    /** Key takeaways from the session */
    keyTakeaways: string[];
    /** Skills demonstrated during the session */
    skillsDemonstrated: string[];
    /** Learning outcomes achieved */
    learningOutcomes: string[];
    /** Recommended follow-up activities */
    nextSteps: SummaryCredentialNextStep[];
    /** Reflections on the learning experience */
    reflections: SummaryCredentialReflection[];
}

interface SummaryCredentialNextStep {
    title: string;
    description?: string;
    type?: 'course' | 'practice' | 'assessment' | 'resource';
}

interface SummaryCredentialReflection {
    prompt: string;
    response: string;
}
```

**Returns:** `Promise<SendAiSessionCredentialResponse>`

```typescript
interface SendAiSessionCredentialResponse {
    topicUri: string; // URI of the AI Topic (parent) boost
    sessionCredentialUri: string; // URI of the created AI Session credential
    sessionBoostUri: string; // URI of the session boost (child of topic)
    isNewTopic: boolean; // True if new topic created, false if reused
}
```

**Example - Recording a Learning Session:**

```typescript
// After conducting an AI tutoring session
const session = await learnCard.sendAiSessionCredential({
    sessionTitle: 'Introduction to Machine Learning',
    summaryData: {
        keyTakeaways: [
            'Machine learning is a subset of AI focused on pattern recognition',
            'Supervised learning uses labeled training data',
            'Neural networks are inspired by biological neurons',
        ],
        skillsDemonstrated: [
            'Understanding ML fundamentals',
            'Distinguishing supervised vs unsupervised learning',
            'Basic neural network concepts',
        ],
        learningOutcomes: [
            'Can explain what machine learning is',
            'Understands the role of training data',
            'Recognizes common ML applications',
        ],
        nextSteps: [
            {
                title: 'Deep Learning Fundamentals',
                description: 'Learn about neural network architectures',
                type: 'course',
            },
            {
                title: 'Build a Simple Classifier',
                description: 'Hands-on practice with scikit-learn',
                type: 'practice',
            },
        ],
        reflections: [
            {
                prompt: 'What was the most surprising concept?',
                response:
                    'How simple the basic idea of training data is, yet how powerful it becomes at scale.',
            },
        ],
    },
    metadata: {
        duration: 1800, // 30 minutes in seconds
        difficulty: 'beginner',
        topics: ['machine-learning', 'ai', 'neural-networks'],
    },
});

console.log('Topic URI:', session.topicUri);
console.log('Session Credential:', session.sessionCredentialUri);
console.log('New topic created?', session.isNewTopic);
```

**How It Works:**

1. **Topic Creation/Reuse**: The first session from your app creates an AI Topic. Subsequent sessions reuse this topic.
2. **Session Credential**: Each call creates a new AI Session credential under the topic.
3. **Automatic Storage**: Credentials are immediately stored in the user's LearnCloud wallet.
4. **AI Topics Page**: Sessions appear in the user's AI Topics section for review.

**Session Hierarchy:**

```
AI Topic (App-level)
├── AI Session 1 (Introduction to Machine Learning)
├── AI Session 2 (Advanced ML Concepts)
├── AI Session 3 (Neural Network Architecture)
└── ...
```

{% hint style="info" %}
**Prerequisites for AI Sessions:**

1. Your app must be installed from the LearnCard App Store
2. The user must have consented to share their learning data
3. Call `requestConsent()` before sending AI sessions if not already consented

The AI Topic is automatically created on the first session and reused for all subsequent sessions from your app.
{% endhint %}

**Error Handling:**

```typescript
try {
    const session = await learnCard.sendAiSessionCredential({
        sessionTitle: 'Learning Session',
        summaryData: {
            /* ... */
        },
    });
} catch (error) {
    switch (error.code) {
        case 'LC_UNAUTHENTICATED':
            showLoginPrompt('Please log in to LearnCard');
            break;
        case 'UNAUTHORIZED':
            showMessage('App not properly configured for AI sessions');
            break;
        case 'USER_REJECTED':
            showMessage('User declined to store the session');
            break;
        default:
            console.error('Failed to send session:', error.message);
    }
}
```

#### `destroy()`

Clean up the SDK and remove event listeners.

**Returns:** `void`

**Example:**

```typescript
// Clean up when component unmounts or page unloads
learnCard.destroy();
```

## Security Model

The Partner Connect SDK implements comprehensive security measures:

### Origin Validation

**Strict Enforcement:**

- Incoming messages must exactly match the configured host origin
- No wildcard (`*`) origins are ever used
- Query parameter overrides are validated against whitelist

**Configuration Hierarchy:**

1. **Default**: `https://learncard.app` (security anchor)
2. **Query Parameter Override**: `?lc_host_override=https://staging.learncard.app`
3. **Configured Origin**: From `hostOrigin` option

**Example:**

```typescript
// Production configuration
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});
// Uses: https://learncard.app
// Override: ?lc_host_override=X (not validated, warning logged)

// Staging configuration with whitelist
const learnCard = createPartnerConnect({
    hostOrigin: ['https://learncard.app', 'https://staging.learncard.app'],
});
// Default: https://learncard.app
// Override: ?lc_host_override=https://staging.learncard.app ✅
// Override: ?lc_host_override=https://evil.com ❌
```

### Message Security

- **Protocol Verification**: Messages must match expected protocol version
- **Request ID Tracking**: Only tracked requests are processed
- **Timeout Protection**: Requests automatically timeout to prevent hanging
- **Cleanup on Destroy**: Pending requests are properly rejected

## Error Handling

All SDK methods reject with structured `LearnCardError` objects:

```typescript
interface LearnCardError {
    code: string;
    message: string;
}
```

### Error Codes

| Code                   | Description                         |
| ---------------------- | ----------------------------------- |
| `LC_TIMEOUT`           | Request timed out                   |
| `LC_UNAUTHENTICATED`   | User not logged in                  |
| `USER_REJECTED`        | User declined the request           |
| `CREDENTIAL_NOT_FOUND` | Requested credential doesn't exist  |
| `UNAUTHORIZED`         | User lacks permission               |
| `TEMPLATE_NOT_FOUND`   | Template doesn't exist              |
| `SDK_NOT_INITIALIZED`  | SDK not properly initialized        |
| `SDK_DESTROYED`        | SDK was destroyed before completion |

### Error Handling Patterns

```typescript
try {
    const result = await learnCard.someMethod();
} catch (error) {
    switch (error.code) {
        case 'LC_UNAUTHENTICATED':
            // Redirect to login or show auth prompt
            showLoginPrompt();
            break;
        case 'LC_TIMEOUT':
            // Show timeout message, offer retry
            showRetryOption();
            break;
        case 'USER_REJECTED':
            // User declined, handle gracefully
            showAlternativeFlow();
            break;
        default:
            // Generic error handling
            showErrorMessage(error.message);
    }
}
```

## Advanced Configuration

### Multiple Origins (Staging Support)

```typescript
const learnCard = createPartnerConnect({
    hostOrigin: [
        'https://learncard.app', // Production
        'https://staging.learncard.app', // Staging
        'https://dev.learncard.app', // Development
    ],
});

// LearnCard host can specify which origin to use:
// Production iframe: https://partner-app.com/
// Staging iframe: https://partner-app.com/?lc_host_override=https://staging.learncard.app
```

### Native App Support

For Capacitor/Ionic apps:

```typescript
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
    allowNativeAppOrigins: true, // Default: true
});

// Automatically accepts messages from:
// - capacitor://localhost
// - ionic://localhost
// - https://localhost:*
// - http://localhost:*
// - http://127.0.0.1:*
```

### Custom Timeouts

```typescript
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
    requestTimeout: 60000, // 60 seconds for slow networks
});
```

## Browser Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile**: iOS Safari 14+, Android Chrome 90+

**Required APIs:**

- `postMessage`
- `Promise`
- `URLSearchParams`
- `addEventListener`

## Migration Guide

### From Manual postMessage

**Before** (80+ lines of boilerplate):

```typescript
const pendingRequests = new Map();

function sendPostMessage(action, payload = {}) {
    return new Promise((resolve, reject) => {
        const requestId = `${action}-${Date.now()}-${Math.random()}`;
        pendingRequests.set(requestId, { resolve, reject });

        window.parent.postMessage(
            {
                protocol: 'LEARNCARD_V1',
                action,
                requestId,
                payload,
            },
            'https://learncard.app'
        );

        setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject({ code: 'LC_TIMEOUT', message: 'Request timed out' });
            }
        }, 30000);
    });
}

window.addEventListener('message', event => {
    if (event.origin !== 'https://learncard.app') return;
    const { protocol, requestId, type, data, error } = event.data;
    if (protocol !== 'LEARNCARD_V1' || !requestId) return;

    const pending = pendingRequests.get(requestId);
    if (!pending) return;

    pendingRequests.delete(requestId);
    if (type === 'SUCCESS') {
        pending.resolve(data);
    } else {
        pending.reject(error);
    }
});

// Usage
const identity = await sendPostMessage('REQUEST_IDENTITY');
```

**After** (3 lines):

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});

// Usage - same result, much cleaner
const identity = await learnCard.requestIdentity();
```

**Benefits:**

- **85% code reduction** in typical integrations
- **Type safety** with full TypeScript support
- **Better error handling** with structured error codes
- **Security improvements** with origin validation
- **No manual cleanup** required

## Examples

### SSO Authentication Flow

```typescript
async function authenticateUser() {
    try {
        const identity = await learnCard.requestIdentity();

        // Send JWT to your backend for validation
        const response = await fetch('/api/auth/learncard', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: identity.token,
                userDid: identity.user.did,
            }),
        });

        if (response.ok) {
            const session = await response.json();
            setUserSession(session);
            showAuthenticatedContent();
        } else {
            showAuthError('Backend validation failed');
        }
    } catch (error) {
        if (error.code === 'LC_UNAUTHENTICATED') {
            showLoginPrompt('Please log in to LearnCard to continue');
        } else {
            showAuthError(error.message);
        }
    }
}
```

### Credential Gating (Premium Content)

```typescript
async function unlockPremiumContent() {
    try {
        const response = await learnCard.askCredentialSearch({
            query: [
                {
                    type: 'QueryByTitle',
                    credentialQuery: {
                        reason: 'Access premium content requires certification',
                        title: 'Premium Membership',
                    },
                },
            ],
            challenge: generateChallenge(),
            domain: window.location.hostname,
        });

        if (response.verifiablePresentation) {
            const credentials = response.verifiablePresentation.verifiableCredential;
            if (validatePremiumCredentials(credentials)) {
                showPremiumContent();
            } else {
                showUpgradePrompt();
            }
        } else {
            showCredentialRequiredMessage();
        }
    } catch (error) {
        if (error.code === 'USER_REJECTED') {
            showAlternativeContent();
        } else {
            showErrorMessage(error.message);
        }
    }
}
```

### Credential Issuance (Certificate Award)

```typescript
async function awardCertificate(courseName, studentDid) {
    try {
        // Issue credential on your backend
        const credential = await fetch('/api/issue-certificate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseName,
                recipientDid: studentDid,
                completionDate: new Date().toISOString(),
            }),
        }).then(r => r.json());

        // Send to student's wallet
        const result = await learnCard.sendCredential(credential);

        showSuccessMessage(
            `Certificate for ${courseName} sent to wallet! ID: ${result.credentialId}`
        );
    } catch (error) {
        if (error.code === 'LC_UNAUTHENTICATED') {
            showMessage('Student must be logged in to receive certificate');
        } else {
            showErrorMessage(`Failed to send certificate: ${error.message}`);
        }
    }
}
```

## TypeScript Types

All types are exported from the package for full type safety:

```typescript
import type {
    // Configuration
    PartnerConnectOptions,

    // Responses
    IdentityResponse,
    SendCredentialResponse,
    TemplateCredentialInput,
    TemplateCredentialResponse,
    TemplateIssueResponse,
    CredentialSearchResponse,
    CredentialSpecificResponse,
    ConsentResponse,
    RequestConsentOptions,

    // Credential queries
    VerifiablePresentationRequest,
    VPRQuery,

    // Errors
    LearnCardError,
    ErrorCode,

    // App events
    AppEvent,
    AppEventResponse,
    SendCredentialEvent,

    // AI Sessions
    SendAiSessionCredentialInput,
    SendAiSessionCredentialResponse,
    SummaryCredentialData,
    SummaryCredentialNextStep,
    SummaryCredentialReflection,
} from '@learncard/partner-connect';
```

### Key Type Definitions

```typescript
interface TemplateCredentialInput {
    templateAlias: string;
    templateData?: Record<string, unknown>;
}

interface TemplateCredentialResponse {
    credentialUri: string;
    boostUri: string;
}

interface SendCredentialResponse {
    credentialId: string;
}

interface TemplateIssueResponse {
    issued: boolean;
}

interface ConsentResponse {
    granted: boolean;
}

interface RequestConsentOptions {
    redirect?: boolean;
}

interface RequestLearnerContextOptions {
    includeCredentials?: boolean;
    includePersonalData?: boolean;
    format?: 'prompt' | 'structured';
    instructions?: string;
    detailLevel?: 'compact' | 'expanded';
}

interface LearnerContextResponse {
    prompt: string;
    raw?: {
        credentials: unknown[];
        personalData?: Record<string, unknown>;
    };
    did: string;
    displayName?: string;
}

interface SendAiSessionCredentialInput {
    sessionTitle: string;
    summaryData: SummaryCredentialData;
    metadata?: Record<string, unknown>;
}

interface SummaryCredentialData {
    keyTakeaways: string[];
    skillsDemonstrated: string[];
    learningOutcomes: string[];
    nextSteps: SummaryCredentialNextStep[];
    reflections: SummaryCredentialReflection[];
}

interface SummaryCredentialNextStep {
    title: string;
    description?: string;
    type?: 'course' | 'practice' | 'assessment' | 'resource';
}

interface SummaryCredentialReflection {
    prompt: string;
    response: string;
}

interface SendAiSessionCredentialResponse {
    topicUri: string;
    sessionCredentialUri: string;
    sessionBoostUri: string;
    isNewTopic: boolean;
}

type ErrorCode =
    | 'LC_TIMEOUT'
    | 'LC_UNAUTHENTICATED'
    | 'CREDENTIAL_NOT_FOUND'
    | 'USER_REJECTED'
    | 'UNAUTHORIZED'
    | 'TEMPLATE_NOT_FOUND'
    | string;

interface LearnCardError {
    code: ErrorCode;
    message: string;
}
```

## Related Documentation

- [Connect an Embedded App](../how-to-guides/connect-systems/connect-an-embedded-app.md) - Step-by-step guide for App Store credential issuance
- [LearnCard Core SDK](/sdks/learncard-core/) - Backend credential operations
- [LearnCard Network](/sdks/learncard-network/) - Network integration
- [Creating Connected Websites](/how-to-guides/connect-systems/connect-a-website) - Integration guide
- [App Store Development](/apps/learn-card-app/) - LearnCard app ecosystem

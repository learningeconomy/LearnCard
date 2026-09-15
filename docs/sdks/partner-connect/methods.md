# Methods

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

    /**
     * Automatic standalone mock mode.
     * 'auto' (default) mocks only when no LearnCard host is present AND the
     * page runs on a local dev host; 'standalone' mocks whenever no host is
     * present, on any origin; true always mocks; false never mocks.
     * @default 'auto'
     */
    mock?: boolean | 'auto' | 'standalone';

    /**
     * Mock behavior overrides (UI, logging, persistence, fake DID, namespace).
     */
    mockOptions?: MockHostOptions;

    /**
     * Wait (ms) for the host presence probe when embedded in a frame whose
     * parent can't be confirmed as LearnCard.
     * @default 1500
     */
    hostProbeTimeout?: number;
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
    headers: { Authorization: `Bearer ${identity.token}` },
});
```

**Verifying the token:**

The `token` is a DID-Auth Verifiable Presentation JWT signed by the user's key and bound to your app's origin. Never trust `user.did` from the browser without verifying `token` on your backend:

```typescript
import { initLearnCard } from '@learncard/init';

const lc = await initLearnCard();
const result = await lc.invoke.verifyPresentation(token, { proofFormat: 'jwt' });
if (result.errors.length > 0) throw new Error('Invalid token');

const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
if (payload.iss !== user.did) throw new Error('Token issuer does not match user DID');
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
For App Store embedded apps, template-based issuance is strongly recommended. See [Build an App Inside LearnCard](../../how-to-guides/publish-your-app.md) for a complete walkthrough.
{% endhint %}

#### `launchFeature(featurePath, initialPrompt?)`

Navigate the **LearnCard host wallet** to one of its built-in features. Use this when you want to send the user from your embedded app into a wallet route (e.g. AI Topics, Wallet Share, Profile).

{% hint style="warning" %}
**Don't confuse this with `sendNotification({ actionPath })`.** `launchFeature` paths resolve **inside the LearnCard wallet**. `actionPath` paths resolve **inside your embedded app's iframe**. See the [comparison table below](#launchfeature-vs-sendnotification-actionpath).
{% endhint %}

**Parameters:**

- `featurePath` (`string`): Wallet route to navigate to (e.g., `/ai/topics`, `/wallet/share`, `/profile`)
- `initialPrompt` (`string`, optional): Initial prompt or data to pass to the feature

**Returns:** `Promise<void>`

**Errors:** `LC_TIMEOUT`, `UNAUTHORIZED` (if your app lacks the `launch_feature` permission)

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

#### `launchFeature` vs `sendNotification` `actionPath`

These two APIs both take a `/path` string and look interchangeable, but they navigate to **different origins**:

| API                                | Scope                 | Use when                                                                                                                                    |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `launchFeature(path)`              | **LearnCard wallet**  | You want to send the user into a wallet feature (`/ai/topics`, `/wallet/share`, `/profile`). Path is interpreted by the LearnCard host.     |
| `sendNotification({ actionPath })` | **Your embedded app** | You want a notification's tap action to deep-link the user to a route **inside your own app's iframe**. Path is appended to your app's URL. |

**Bridge pattern — deep-linking from a notification to a wallet feature:**

If you want a notification to take the user to a wallet route (e.g. `/ai/topics`), you must route them through one of your own pages that calls `launchFeature()`:

```typescript
// 1. Send a notification with an actionPath that points to YOUR app:
await learnCard.sendNotification({
    title: 'New AI Topic ready',
    body: 'Tap to review your latest tutoring session',
    actionPath: '/ai-topics-bridge', // a real route in YOUR app
});

// 2. In your app, src/pages/ai-topics-bridge.{astro|tsx|html}:
//    On mount, immediately ask the wallet to navigate.
await learnCard.launchFeature('/ai/topics');
```

The wallet's iframe host enforces this: any `actionPath` is appended to your app's iframe URL and the host explicitly rejects values that would escape your origin.

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

{% hint style="warning" %}
**Schema verified against SDK v0.2.16.** The fields are `title`, `summary`, `learned`, `skills`, `nextSteps`, `reflections` — **not** `keyTakeaways`/`skillsDemonstrated`/`learningOutcomes`. Earlier versions of these docs showed an incorrect schema; if you're upgrading, double-check your call sites.
{% endhint %}

```typescript
interface SummaryCredentialData {
    /** Short, concise title for the learning session or credential */
    title: string;
    /** Comprehensive summary of what happened during the session */
    summary: string;
    /** Bullet points of key knowledge gained */
    learned: string[];
    /** Categorized skills learned during the session */
    skills: SummaryCredentialSkill[];
    /** Recommended follow-up activities or learning modules */
    nextSteps: SummaryCredentialNextStep[];
    /** Reflections on the learning experience */
    reflections: SummaryCredentialReflection[];
}

interface SummaryCredentialSkill {
    /** Name of the skill category */
    title: string;
    /** Detailed description of what this skill category involves */
    description: string;
}

interface SummaryCredentialNextStep {
    /** Title of the suggested next step */
    title: string;
    /** Description explaining why this next step is recommended */
    description: string;
    /**
     * Optional taxonomy keywords (occupations, careers, jobs, skills, fieldOfStudy).
     * Omit entirely if you don't have taxonomy data.
     */
    keywords?: SummaryCredentialKeyword;
}

interface SummaryCredentialKeyword {
    occupations: string[] | null;
    careers: string[] | null;
    jobs: string[] | null;
    skills: string[] | null;
    fieldOfStudy: string | null;
}

interface SummaryCredentialReflection {
    /** Title of the reflection */
    title: string;
    /** Detailed description of what this reflection involves */
    description: string;
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
        title: 'Intro to Machine Learning',
        summary:
            'Walked through ML fundamentals: supervised vs unsupervised learning, ' +
            'training data, and an intuitive overview of neural networks.',
        learned: [
            'Machine learning is a subset of AI focused on pattern recognition',
            'Supervised learning uses labeled training data',
            'Neural networks are inspired by biological neurons',
        ],
        skills: [
            {
                title: 'ML Fundamentals',
                description:
                    'Can articulate what machine learning is and how it differs from rule-based programming.',
            },
            {
                title: 'Supervised vs Unsupervised',
                description: 'Distinguishes the two paradigms and gives examples of each.',
            },
        ],
        nextSteps: [
            {
                title: 'Deep Learning Fundamentals',
                description: 'Learn about neural network architectures',
                // keywords is optional — omit it if you have no taxonomy data
            },
            {
                title: 'Build a Simple Classifier',
                description: 'Hands-on practice with scikit-learn',
            },
        ],
        reflections: [
            {
                title: 'Most surprising concept',
                description:
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

// 🎉 isNewTopic is a great UX hook: the first session ever from your app
// returns true and creates the AI Topic. Use it to celebrate first-run.
if (session.isNewTopic) {
    showCelebration('First AI session recorded!');
}
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

**Errors:** `LC_UNAUTHENTICATED`, `UNAUTHORIZED`, `USER_REJECTED`, `LC_TIMEOUT`, `BAD_REQUEST` (when `summaryData` fails server-side validation — see the [Source-of-Truth note](#schema-source-of-truth) below).

```typescript
try {
    const session = await learnCard.sendAiSessionCredential({
        sessionTitle: 'Learning Session',
        summaryData: {/* ... */},
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
        case 'BAD_REQUEST':
            console.error('Schema validation failed:', error.message);
            break;
        default:
            console.error('Failed to send session:', error.message);
    }
}
```

#### Schema Source of Truth

The `summaryData` shape is defined by `SummaryCredentialDataValidator` in `@learncard/types` (`packages/learn-card-types/src/lcn.ts`). The brain service deep-validates every `sendAiSessionCredential` call against this discriminated union, so a malformed `summaryData` will fail fast with a clear zod error rather than producing a broken credential.

#### `sendNotification(input)`

Send a notification to the current user from this app. The notification appears in the user's LearnCard notification inbox.

**Parameters:** `AppNotificationInput`

| Property     | Type                 | Required | Description                                                                                                         |
| ------------ | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `title`      | `string`             | No       | Notification title.                                                                                                 |
| `body`       | `string`             | No       | Notification body text.                                                                                             |
| `actionPath` | `string`             | No       | **App-local** path. When the user taps the notification, this path is appended to your app's iframe URL. See below. |
| `category`   | `string`             | No       | Optional category tag for grouping notifications.                                                                   |
| `priority`   | `'normal' \| 'high'` | No       | Visual priority. `'high'` notifications are styled more prominently in the inbox.                                   |

**Returns:** `Promise<AppNotificationResponse>`

**Errors:** `LC_UNAUTHENTICATED`, `UNAUTHORIZED`, `LC_TIMEOUT`

{% hint style="warning" %}
**`actionPath` is APP-LOCAL.** It is appended to your embedded app's iframe URL — **not** routed inside the LearnCard wallet. If you want to deep-link into a wallet route (e.g. `/ai/topics`), use the [bridge pattern shown above](#launchfeature-vs-sendnotification-actionpath).
{% endhint %}

**Example — notify within your own app:**

```typescript
await learnCard.sendNotification({
    title: 'Lesson 3 unlocked',
    body: 'Continue where you left off',
    actionPath: '/lessons/3', // a route in YOUR app
    priority: 'normal',
});
```

**Example — bridge to a wallet feature:**

```typescript
// In your app, expose a route that just calls launchFeature on mount:
// src/pages/ai-bridge.tsx
useEffect(() => {
    learnCard.launchFeature('/ai/topics');
}, []);

// Then send a notification that points to your bridge route:
await learnCard.sendNotification({
    title: 'Your AI Topic is ready',
    actionPath: '/ai-bridge',
});
```

#### Counters: `incrementCounter`, `getCounter`, `getCounters`

Lightweight per-user-app counters for tracking app-defined integer state (e.g. "sessions completed", "streak days"). Counters are scoped to **(user, listing)** — every user has an independent set of counters per app.

**Limits (load-bearing — design around these):**

- **Maximum 50 distinct keys** per `(user, app)` pair
- **Maximum 100 writes per minute** per `(user, app)` pair
- **Integer values only** (use `Math.floor` or pre-aggregate if you need fractional state)
- **Key format:** `^[a-zA-Z0-9_-]+$`, 1–64 characters

If you need to track more than 50 things, consolidate (e.g. one `lessons_completed` counter rather than one counter per lesson).

**Signatures:**

```typescript
incrementCounter(key: string, amount: number): Promise<IncrementCounterResponse>;
getCounter(key: string): Promise<GetCounterResponse>;
getCounters(keys?: string[]): Promise<GetCountersResponse>; // omit `keys` to fetch all
```

**Examples:**

```typescript
// Increment by 1 (or any signed integer — pass a negative to decrement)
const { newValue } = await learnCard.incrementCounter('sessions_completed', 1);

// Read one
const { value, updatedAt } = await learnCard.getCounter('sessions_completed');

// Read several (omit the array to fetch every counter for this user-app)
const { counters } = await learnCard.getCounters(['sessions_completed', 'streak_days']);
```

**Errors:** `LC_UNAUTHENTICATED`, `UNAUTHORIZED`, `BAD_REQUEST` (invalid key format, > 50 keys, or rate-limit exceeded), `LC_TIMEOUT`

#### `destroy()`

Clean up the SDK and remove event listeners.

**Returns:** `void`

**Example:**

```typescript
// Clean up when component unmounts or page unloads
learnCard.destroy();
```

#### `isEmbedded()`

Check whether your app is running inside LearnCard (an iframe) or on its own. Use it to change behavior — for example, showing an "Open in LearnCard" prompt when standalone — without writing your own detection.

**Returns:** `boolean` (`false` during server-side rendering)

```typescript
import { isEmbedded } from '@learncard/partner-connect';

if (isEmbedded()) {
    // Inside LearnCard — SDK talks to the real host.
} else {
    // Standalone — show a preview banner, or rely on mock mode (below).
}
```

Also available as `PartnerConnect.isEmbedded()` (static) and `learnCard.isEmbedded()` (instance).

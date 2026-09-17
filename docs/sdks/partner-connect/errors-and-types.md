# Errors, Types & Migration

## Error Handling

All SDK methods reject with a `PartnerConnectError` (a real `Error` subclass) carrying both `code` and `message`. The legacy `LearnCardError` shape is preserved — `error.code` keeps working — so existing call sites continue to function unchanged:

```typescript
import { PartnerConnectError } from '@learncard/partner-connect';

try {
    await learnCard.requestLearnerContext();
} catch (err) {
    if (err instanceof PartnerConnectError) {
        // Type-narrowed: TypeScript knows err.code: ErrorCode
        switch (err.code) {
            case 'LC_UNAUTHENTICATED':
                showLogin();
                break;
            case 'USER_REJECTED':
                showPrivacyNotice();
                break;
            case 'UNAUTHORIZED':
                showPermissionsError();
                break;
            default:
                console.error(err);
        }
    }
}
```

The `LearnCardError` interface remains exported for backwards compatibility:

```typescript
interface LearnCardError {
    code: string;
    message: string;
}
```

### Error Codes

| Code                   | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `LC_TIMEOUT`           | Request timed out                                          |
| `LC_NOT_EMBEDDED`      | Not embedded in a LearnCard host (standalone, not mocking) |
| `LC_UNAUTHENTICATED`   | User not logged in                                         |
| `USER_REJECTED`        | User declined the request                                  |
| `CREDENTIAL_NOT_FOUND` | Requested credential doesn't exist                         |
| `UNAUTHORIZED`         | User lacks permission                                      |
| `TEMPLATE_NOT_FOUND`   | Template doesn't exist                                     |
| `SDK_NOT_INITIALIZED`  | SDK not properly initialized                               |
| `SDK_DESTROYED`        | SDK was destroyed before completion                        |

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
    SummaryCredentialSkill,
    SummaryCredentialNextStep,
    SummaryCredentialKeyword,
    SummaryCredentialReflection,

    // Notifications
    AppNotificationInput,
    AppNotificationResponse,
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

interface MockHostOptions {
    ui?: boolean; // show toasts/banners (default true)
    log?: boolean; // console logging (default true)
    persist?: boolean; // save counters to the browser (default true)
    did?: string; // fake identity DID
    namespace?: string; // storage namespace for mock data
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
    title: string;
    summary: string;
    learned: string[];
    skills: SummaryCredentialSkill[];
    nextSteps: SummaryCredentialNextStep[];
    reflections: SummaryCredentialReflection[];
}

interface SummaryCredentialSkill {
    title: string;
    description: string;
}

interface SummaryCredentialNextStep {
    title: string;
    description: string;
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
    title: string;
    description: string;
}

interface SendAiSessionCredentialResponse {
    topicUri: string;
    sessionCredentialUri: string;
    sessionBoostUri: string;
    isNewTopic: boolean;
}

type ErrorCode =
    | 'LC_TIMEOUT'
    | 'LC_NOT_EMBEDDED'
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

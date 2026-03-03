# Partner Connect SDK

> Promise-based JavaScript SDK for secure cross-origin communication between partner apps and LearnCard

The Partner Connect SDK transforms complex `postMessage` communication into clean, modern Promise-based functions. It handles the entire cross-origin message lifecycle, including request queuing, origin validation, and timeout management.

## Features

- **🔒 Secure**: Multi-layered origin validation prevents unauthorized access
- **🎯 Type-safe**: Full TypeScript support with comprehensive type definitions  
- **⚡ Promise-based**: Modern async/await API eliminates callback complexity
- **🧹 Clean**: Abstracts away all postMessage implementation details
- **📦 Lightweight**: Zero dependencies, ~8KB minified
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
  hostOrigin: 'https://learncard.app'
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

#### `createPartnerConnect(options)`

Creates a new Partner Connect SDK instance.

**Parameters:**
- `options` (`PartnerConnectOptions`): Configuration options

**Returns:** `PartnerConnect` instance

**Example:**
```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app',
  requestTimeout: 30000
});
```

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
  headers: { 'Authorization': `Bearer ${identity.token}` }
});
```

**Response Type:**
```typescript
interface IdentityResponse {
  token: string;  // JWT token for backend validation
  user: {
    did: string;  // User's decentralized identifier
    [key: string]: unknown;
  };
}
```

#### `sendCredential(credential)`

Send a verifiable credential to the user's LearnCard wallet.

**Parameters:**
- `credential` (`unknown`): The verifiable credential to send

**Returns:** `Promise<SendCredentialResponse>`

**Example:**
```typescript
// Your backend issues the credential
const credential = await yourBackend.issueCredential(identity.user.did);

// Send to user's wallet
const response = await learnCard.sendCredential(credential);
console.log('Credential ID:', response.credentialId);
```

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
  query: [{
    type: 'QueryByTitle',
    credentialQuery: {
      reason: 'Verify your certification',
      title: 'JavaScript Expert'
    }
  }],
  challenge: `${Date.now()}-${Math.random()}`,
  domain: window.location.hostname
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

#### `requestConsent(contractUri)`

Request user consent for data access permissions.

**Parameters:**
- `contractUri` (`string`): URI of the consent contract

**Returns:** `Promise<ConsentResponse>`

**Example:**
```typescript
const response = await learnCard.requestConsent(
  'lc:network:network.learncard.com/trpc:contract:abc123'
);

if (response.granted) {
  console.log('User granted consent');
  // Proceed with data access
} else {
  console.log('User denied consent');
  // Handle gracefully
}
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
  ['did:key:abc123', 'did:key:def456']
);

if (response.issued) {
  console.log('Template issued successfully');
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
  hostOrigin: 'https://learncard.app'
});
// Uses: https://learncard.app
// Override: ?lc_host_override=X (not validated, warning logged)

// Staging configuration with whitelist
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app', 
    'https://staging.learncard.app'
  ]
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

| Code | Description |
|------|-------------|
| `LC_TIMEOUT` | Request timed out |
| `LC_UNAUTHENTICATED` | User not logged in |
| `USER_REJECTED` | User declined the request |
| `CREDENTIAL_NOT_FOUND` | Requested credential doesn't exist |
| `UNAUTHORIZED` | User lacks permission |
| `TEMPLATE_NOT_FOUND` | Template doesn't exist |
| `SDK_NOT_INITIALIZED` | SDK not properly initialized |
| `SDK_DESTROYED` | SDK was destroyed before completion |

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
    'https://learncard.app',           // Production
    'https://staging.learncard.app',   // Staging
    'https://dev.learncard.app'        // Development
  ]
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
  allowNativeAppOrigins: true  // Default: true
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
  requestTimeout: 60000  // 60 seconds for slow networks
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
    
    window.parent.postMessage({
      protocol: 'LEARNCARD_V1',
      action,
      requestId,
      payload,
    }, 'https://learncard.app');
    
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject({ code: 'LC_TIMEOUT', message: 'Request timed out' });
      }
    }, 30000);
  });
}

window.addEventListener('message', (event) => {
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
  hostOrigin: 'https://learncard.app'
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        token: identity.token,
        userDid: identity.user.did
      })
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
      query: [{
        type: 'QueryByTitle',
        credentialQuery: {
          reason: 'Access premium content requires certification',
          title: 'Premium Membership'
        }
      }],
      challenge: generateChallenge(),
      domain: window.location.hostname
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
        completionDate: new Date().toISOString()
      })
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

## Related Documentation

- [LearnCard Core SDK](/sdks/learncard-core/) - Backend credential operations
- [LearnCard Network](/sdks/learncard-network/) - Network integration
- [Creating Connected Websites](/how-to-guides/connect-systems/connect-a-website) - Integration guide
- [App Store Development](/apps/learn-card-app/) - LearnCard app ecosystem
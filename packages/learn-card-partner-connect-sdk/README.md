# @learncard/partner-connect

> Promise-based JavaScript SDK for managing cross-origin messaging between partner apps and LearnCard

The LearnCard Partner Connect SDK transforms complex `postMessage` communication into clean, modern Promise-based functions. It handles the entire cross-origin message lifecycle, including request queuing, message validation, and timeout management.

## Features

- 🔒 **Secure**: Origin validation for all messages
- 🎯 **Type-safe**: Full TypeScript support with comprehensive types
- ⚡ **Promise-based**: Modern async/await API
- 🧹 **Clean**: Abstracts away all postMessage complexity
- 📦 **Lightweight**: Zero dependencies
- 🛡️ **Robust**: Built-in timeout handling and error management

## Installation

```bash
npm install @learncard/partner-connect
```

```bash
pnpm add @learncard/partner-connect
```

```bash
yarn add @learncard/partner-connect
```

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

## Configuration

### Options

```typescript
interface PartnerConnectOptions {
  /**
   * The origin of the LearnCard host (e.g., 'https://learncard.app')
   * All messages will be validated against this origin for security
   * (default: 'https://learncard.app')
   */
  hostOrigin?: string;

  /**
   * Protocol identifier (default: 'LEARNCARD_V1')
   */
  protocol?: string;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  requestTimeout?: number;
}
```

### Dynamic Origin Configuration

The SDK uses a hierarchical approach to determine the active host origin:

#### 1. **Hardcoded Default** (Security Anchor)
```typescript
PartnerConnect.DEFAULT_HOST_ORIGIN // 'https://learncard.app'
```

#### 2. **Query Parameter Override** (Staging/Testing)
```typescript
// Your app URL: https://partner-app.com/?lc_host_override=https://staging.learncard.app

const learnCard = createPartnerConnect({
  hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
});
// Active origin: https://staging.learncard.app (from query param)
// ✅ Only accepts messages from: https://staging.learncard.app
// ✅ Sends messages to: https://staging.learncard.app
```

**How the LearnCard Host Uses This:**
- Production: Iframe URL has no `lc_host_override` parameter
- Staging: Iframe URL includes `?lc_host_override=https://staging.learncard.app`
- This allows testing against non-production environments without recompiling partner code

#### 3. **Configured Origin** (Fallback)
```typescript
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});
// Active origin: https://learncard.app (configured)
```

### Origin Whitelist (Security Gate)

When providing multiple origins, they serve as a **whitelist** for the `lc_host_override` parameter:

```typescript
const learnCard = createPartnerConnect({
  hostOrigin: [
    'https://learncard.app',
    'https://staging.learncard.app',
    'https://preview.learncard.app'
  ]
});

// Scenario 1: No query param
// → Uses: https://learncard.app (first in array)

// Scenario 2: Valid override
// URL: ?lc_host_override=https://staging.learncard.app
// → Uses: https://staging.learncard.app ✅

// Scenario 3: Invalid override (not in whitelist)
// URL: ?lc_host_override=https://evil.com
// → Uses: https://learncard.app (falls back to first) ⚠️
// → Logs warning about unauthorized override
```

### Security Model

**STRICT Origin Validation:**
```
Incoming Message Origin ≡ Configured Host Origin
```

The SDK enforces an exact match between incoming message origins and the active host origin:

- ✅ **Secure**: Even if a malicious actor adds `?lc_host_override=https://evil.com`, messages from `evil.com` will be rejected
- ✅ **Cannot be spoofed**: Browser security prevents malicious sites from faking their `event.origin`
- ✅ **No wildcards**: Only exact matches are accepted

```typescript
// Active origin: https://staging.learncard.app
// ✅ Accepts: messages from https://staging.learncard.app
// ❌ Rejects: messages from https://learncard.app
// ❌ Rejects: messages from https://evil.com
// ❌ Rejects: messages from any other origin
```

## API Reference

### `requestIdentity()`

Request user identity information (Single Sign-On).

```typescript
const identity = await learnCard.requestIdentity();
// Returns: { token: string, user: { did: string, ... } }
```

**Error Codes:**
- `LC_UNAUTHENTICATED`: User is not logged in to LearnCard
- `LC_TIMEOUT`: Request timed out

---

### `sendCredential(credential)`

Send a verifiable credential to the user's LearnCard wallet.

```typescript
const response = await learnCard.sendCredential({
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential', 'AchievementCredential'],
  credentialSubject: {
    id: identity.user.did,
    achievement: {
      name: 'JavaScript Expert',
      description: 'Mastered advanced JavaScript concepts'
    }
  }
});

console.log('Credential ID:', response.credentialId);
```

**Returns:** `{ credentialId: string }`

---

### `launchFeature(featurePath, initialPrompt?)`

Launch a feature in the LearnCard host application.

```typescript
await learnCard.launchFeature(
  '/ai/topics?shortCircuitStep=newTopic&selectedAppId=null',
  'Explain the postMessage security model'
);
```

**Parameters:**
- `featurePath`: Path to the feature
- `initialPrompt`: Optional initial data or prompt

---

### `askCredentialSearch(verifiablePresentationRequest)`

Request credentials from the user's wallet using a Verifiable Presentation Request.

```typescript
const response = await learnCard.askCredentialSearch({
  query: [
    {
      type: 'QueryByTitle',
      credentialQuery: {
        reason: 'We need to verify your teamwork skills',
        title: 'Capstone'
      }
    }
  ],
  challenge: `challenge-${Date.now()}`,
  domain: window.location.hostname
});

if (response.verifiablePresentation) {
  const credentials = response.verifiablePresentation.verifiableCredential;
  console.log(`Received ${credentials.length} credential(s)`);
}
```

**Returns:** `{ verifiablePresentation?: { verifiableCredential: unknown[], ... } }`

---

### `askCredentialSpecific(credentialId)`

Request a specific credential by ID.

```typescript
const response = await learnCard.askCredentialSpecific('credential-id-123');

if (response.credential) {
  console.log('Received credential:', response.credential);
}
```

**Error Codes:**
- `CREDENTIAL_NOT_FOUND`: Credential doesn't exist
- `USER_REJECTED`: User declined to share

---

### `requestConsent(contractUri)`

Request user consent for permissions.

```typescript
const response = await learnCard.requestConsent(
  'lc:network:network.learncard.com/trpc:contract:abc123'
);

if (response.granted) {
  console.log('User granted consent');
} else {
  console.log('User denied consent');
}
```

**Returns:** `{ granted: boolean }`

---

### `initiateTemplateIssue(templateId, draftRecipients?)`

Initiate a template-based credential issuance flow (e.g., Send Boost).

```typescript
const response = await learnCard.initiateTemplateIssue(
  'lc:network:network.learncard.com/trpc:boost:xyz789',
  ['did:key:z6Mkr...', 'did:key:z6Mks...']
);

if (response.issued) {
  console.log('Template issued successfully');
}
```

**Error Codes:**
- `UNAUTHORIZED`: Not an admin of this template
- `TEMPLATE_NOT_FOUND`: Template doesn't exist

---

### `destroy()`

Clean up the SDK and remove event listeners. Call this when unmounting your component or closing your app.

```typescript
learnCard.destroy();
```

## Complete Example

Here's a complete example showing how to refactor a manual postMessage implementation to use the SDK:

### Before (Manual postMessage)

```typescript
// Manual setup - verbose and error-prone
const LEARNCARD_HOST_ORIGIN = 'https://learncard.app';
const PROTOCOL = 'LEARNCARD_V1';
const pendingRequests = new Map();

function sendPostMessage(action, payload = {}) {
  return new Promise((resolve, reject) => {
    const requestId = `${action}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    pendingRequests.set(requestId, { resolve, reject });

    window.parent.postMessage({
      protocol: PROTOCOL,
      action,
      requestId,
      payload,
    }, LEARNCARD_HOST_ORIGIN);

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject({ code: 'LC_TIMEOUT', message: 'Request timed out' });
      }
    }, 30000);
  });
}

window.addEventListener('message', (event) => {
  if (event.origin !== LEARNCARD_HOST_ORIGIN) return;
  const { protocol, requestId, type, data, error } = event.data;
  if (protocol !== PROTOCOL || !requestId) return;

  const pending = pendingRequests.get(requestId);
  if (!pending) return;

  pendingRequests.delete(requestId);
  if (type === 'SUCCESS') {
    pending.resolve(data);
  } else if (type === 'ERROR') {
    pending.reject(error);
  }
});

// Usage
const identity = await sendPostMessage('REQUEST_IDENTITY');
```

### After (With SDK)

```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

// Clean, one-line setup
const learnCard = createPartnerConnect({
  hostOrigin: 'https://learncard.app'
});

// Usage - same result, much cleaner
const identity = await learnCard.requestIdentity();
```

## Error Handling

All methods return Promises that reject with a `LearnCardError` object:

```typescript
interface LearnCardError {
  code: string;
  message: string;
}
```

**Common Error Codes:**
- `LC_TIMEOUT`: Request timed out
- `LC_UNAUTHENTICATED`: User not logged in
- `USER_REJECTED`: User declined the request
- `CREDENTIAL_NOT_FOUND`: Credential doesn't exist
- `UNAUTHORIZED`: User lacks permission
- `TEMPLATE_NOT_FOUND`: Template doesn't exist
- `SDK_NOT_INITIALIZED`: SDK initialization failed
- `SDK_DESTROYED`: SDK was destroyed before completion

**Example:**

```typescript
try {
  const identity = await learnCard.requestIdentity();
  // Success
} catch (error) {
  switch (error.code) {
    case 'LC_UNAUTHENTICATED':
      console.log('Please log in to your LearnCard account');
      break;
    case 'LC_TIMEOUT':
      console.log('Request timed out. Please try again.');
      break;
    default:
      console.error('An error occurred:', error.message);
  }
}
```

## Integration with Astro

```astro
---
// src/pages/index.astro
const config = {
  learnCardHostOrigin: import.meta.env.PUBLIC_LEARNCARD_HOST || 'https://learncard.app'
};
---

<script>
  import { createPartnerConnect } from '@learncard/partner-connect';

  const config = window.__LC_CONFIG;
  const learnCard = createPartnerConnect({
    hostOrigin: config.learnCardHostOrigin
  });

  async function init() {
    try {
      const identity = await learnCard.requestIdentity();
      console.log('Logged in as:', identity.user.did);
    } catch (error) {
      console.error('Not authenticated:', error);
    }
  }

  init();
</script>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires `postMessage` API and `Promise` support.

## Security

The SDK implements multiple security layers:

### 1. **Strict Origin Validation**
- Messages must come from the **exact** active host origin
- No wildcards, no pattern matching, no exceptions
- Mathematical equivalence: `event.origin === activeHostOrigin`

### 2. **Query Parameter Whitelist**
- `lc_host_override` values are validated against configured `hostOrigin` array
- Invalid overrides are rejected and logged
- Falls back to first configured origin on validation failure

### 3. **Anti-Spoofing Protection**
Even if a malicious actor injects `?lc_host_override=https://evil.com`:
- The SDK may adopt `evil.com` as the active origin (if not whitelisted)
- **BUT** messages from `evil.com` will only be accepted if `event.origin === 'evil.com'`
- Browser security prevents `evil.com` from spoofing another domain's origin
- Malicious messages are silently rejected

### 4. **Additional Security Layers**
- **Protocol Validation**: Messages must match the expected protocol identifier
- **Request ID Tracking**: Only tracked requests with valid IDs are processed
- **Timeout Protection**: Requests automatically timeout to prevent hanging
- **Explicit targetOrigin**: Never uses `'*'` in postMessage calls

### Example Attack Scenario (Prevented)

```typescript
// Attacker adds malicious query param
// URL: https://partner-app.com/?lc_host_override=https://evil.com

// SDK configuration
const learnCard = createPartnerConnect({
  hostOrigin: ['https://learncard.app', 'https://staging.learncard.app']
});

// What happens:
// 1. SDK detects lc_host_override=https://evil.com
// 2. Validates against whitelist: NOT FOUND
// 3. Falls back to: https://learncard.app
// 4. Sends messages to: https://learncard.app
// 5. Only accepts messages from: https://learncard.app
// 6. Attacker's messages from evil.com: REJECTED ❌
```

## TypeScript

The SDK is written in TypeScript and includes comprehensive type definitions:

```typescript
import type {
  PartnerConnectOptions,
  IdentityResponse,
  SendCredentialResponse,
  VerifiablePresentationRequest,
  CredentialSearchResponse,
  ConsentResponse,
  LearnCardError,
} from '@learncard/partner-connect';
```

## License

MIT

## Contributing

Contributions are welcome! Please see the [main LearnCard repository](https://github.com/learningeconomy/LearnCard) for contribution guidelines.

## Support

For issues and questions:
- GitHub Issues: https://github.com/learningeconomy/LearnCard/issues
- Documentation: https://docs.learncard.com

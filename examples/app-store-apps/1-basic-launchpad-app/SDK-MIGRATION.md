# Migration to @learncard/partner-connect SDK

This example app has been refactored to use the `@learncard/partner-connect` SDK, replacing manual postMessage handling with a clean, Promise-based API.

## Changes Summary

### Before: Manual postMessage Implementation
- **Lines of code**: 467
- **Manual setup**: ~80 lines of boilerplate
- Required understanding of:
  - postMessage API
  - Request ID generation
  - Promise queue management
  - Message listener setup
  - Origin validation
  - Timeout handling

### After: SDK Implementation
- **Lines of code**: 402 (-65 lines, 14% reduction)
- **Setup**: 3 lines
- Clean API with zero boilerplate

## Code Comparison

### Before (Manual)
```typescript
// Manual setup - verbose and error-prone
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

### After (SDK)
```typescript
import { createPartnerConnect } from '@learncard/partner-connect';

// Clean, one-line setup
const learnCard = createPartnerConnect({
  hostOrigin: LEARNCARD_HOST_ORIGIN
});

// Usage - same result, much cleaner
const identity = await learnCard.requestIdentity();
```

## API Method Mappings

| Manual postMessage | SDK Method |
|-------------------|------------|
| `sendPostMessage('REQUEST_IDENTITY')` | `learnCard.requestIdentity()` |
| `sendPostMessage('SEND_CREDENTIAL', { credential })` | `learnCard.sendCredential(credential)` |
| `sendPostMessage('LAUNCH_FEATURE', { featurePath, initialPrompt })` | `learnCard.launchFeature(featurePath, initialPrompt)` |
| `sendPostMessage('ASK_CREDENTIAL_SEARCH', { verifiablePresentationRequest })` | `learnCard.askCredentialSearch(vpr)` |
| `sendPostMessage('ASK_CREDENTIAL_SPECIFIC', { credentialId })` | `learnCard.askCredentialSpecific(credentialId)` |
| `sendPostMessage('REQUEST_CONSENT', { contractUri })` | `learnCard.requestConsent(contractUri)` |
| `sendPostMessage('INITIATE_TEMPLATE_ISSUE', { templateId, draftRecipients })` | `learnCard.initiateTemplateIssue(templateId, draftRecipients)` |

## Benefits

### 1. **Reduced Complexity**
- No manual Promise queue management
- No manual timeout handling
- No manual request ID generation

### 2. **Improved Security**
- Automatic origin validation
- Protocol verification built-in
- Request ID tracking managed internally

### 3. **Better Developer Experience**
- Full TypeScript support with IntelliSense
- Documented error codes
- Consistent error handling
- Self-documenting API

### 4. **Maintainability**
- Single source of truth for protocol
- Easy to update when protocol changes
- Testable in isolation

### 5. **Type Safety**
All methods return properly typed responses:
```typescript
const identity: IdentityResponse = await learnCard.requestIdentity();
const response: SendCredentialResponse = await learnCard.sendCredential(credential);
const consent: ConsentResponse = await learnCard.requestConsent(contractUri);
```

## Migration Steps for Other Apps

1. **Install the SDK**
   ```json
   {
     "dependencies": {
       "@learncard/partner-connect": "workspace:*"
     }
   }
   ```

2. **Import and Initialize**
   ```typescript
   import { createPartnerConnect } from '@learncard/partner-connect';
   
   const learnCard = createPartnerConnect({
     hostOrigin: 'https://learncard.app'
   });
   ```

3. **Replace postMessage calls**
   - Use the appropriate SDK method
   - Remove manual Promise creation
   - Remove pendingRequests Map
   - Remove message listener

4. **Update error handling** (optional)
   - Error codes remain the same
   - Error structure is consistent

## Running the Example

```bash
# Install dependencies
pnpm install

# Run the dev server
pnpm --filter @learncard/app-store-demo-basic-launchpad dev
```

The app will be available at `http://localhost:4321` (or similar).

## Notes

- The SDK handles all cross-origin messaging internally
- Origin validation is automatic and secure
- Request timeouts default to 30 seconds (configurable)
- All methods return Promises with proper error handling
- The SDK is framework-agnostic and works with any JS framework

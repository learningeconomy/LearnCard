# LearnCard PostMessage System (LEARNCARD_V1 Protocol)

## Overview

This is a robust, secure postMessage communication system that allows trusted partner iframes to interact with the LearnCard platform. It implements the **LEARNCARD_V1** protocol for structured, validated, and secure cross-origin messaging.

## Architecture

The system consists of three main components:

1. **`useLearnCardPostMessage.ts`** - Core hook with validation, routing, and security
2. **`useLearnCardPostMessage.handlers.ts`** - Individual action handler implementations
3. **Integration in components** - Usage example in `LaunchPadAppListItem.tsx`

## Security Model

### Critical Security Features

- ✅ **Origin Validation** - Only messages from trusted domains are processed
- ✅ **Protocol Validation** - Messages must include `protocol: 'LEARNCARD_V1'`
- ✅ **Structured Validation** - All messages require `action` and `requestId` fields
- ✅ **Response Tracking** - Every request gets a response with the same `requestId`

### Trusted Origins

Add trusted partner domains to the `trustedOrigins` array:

```typescript
useLearnCardPostMessage({
    trustedOrigins: [
        'https://partner1.example.com',
        'https://partner2.example.com',
    ],
    handlers,
    debug: true,
});
```

⚠️ **WARNING**: Never add untrusted domains to this list. This is your primary security boundary.

## Message Protocol

### Incoming Message Structure (from iframe)

```typescript
{
    protocol: 'LEARNCARD_V1',
    action: string,        // One of the supported actions
    requestId: string,     // Unique identifier for tracking
    payload?: any          // Optional data specific to the action
}
```

### Outgoing Response Structure (to iframe)

```typescript
{
    protocol: 'LEARNCARD_V1',
    requestId: string,
    type: 'SUCCESS' | 'ERROR',
    data?: any,            // Present on SUCCESS
    error?: {              // Present on ERROR
        code: string,
        message: string
    }
}
```

## Supported Actions

### 1. REQUEST_IDENTITY

**Purpose**: Partner needs the user's delegated SSO token.

**Payload**: None

**Success Response**:
```typescript
{
    token: string,
    expiresIn: number
}
```

**Error Codes**:
- `LC_UNAUTHENTICATED` - User is not logged in

**Implementation Requirements**:
- Check user authentication status
- Mint a short-lived JWT token from your backend
- Return the token with expiration time

---

### 2. REQUEST_CONSENT

**Purpose**: Partner needs general user permission.

**Payload**:
```typescript
{
    reason: string  // Description of what consent is being requested for
}
```

**Success Response**:
```typescript
{
    granted: boolean
}
```

**Error Codes**:
- `INVALID_PAYLOAD` - Missing reason
- `UNKNOWN_ERROR` - Failed to process consent

**Implementation Requirements**:
- Show a consent modal to the user
- Wait for user decision (Accept/Reject)
- Return the user's decision

---

### 3. SEND_CREDENTIAL

**Purpose**: Partner wants to issue a Verifiable Credential to the user.

**Payload**:
```typescript
{
    credential: any  // The Verifiable Credential JSON
}
```

**Success Response**:
```typescript
{
    credentialId: string,
    saved: boolean
}
```

**Error Codes**:
- `INVALID_PAYLOAD` - Missing or invalid credential
- `USER_REJECTED` - User declined the credential
- `UNKNOWN_ERROR` - Failed to save credential

**Implementation Requirements**:
- Parse the credential
- Show credential acceptance modal
- If accepted, save to LearnCard wallet
- Return the saved credential ID

---

### 4. ASK_CREDENTIAL_SPECIFIC

**Purpose**: Partner needs a specific credential by ID.

**Payload**:
```typescript
{
    credentialId: string
}
```

**Success Response**:
```typescript
{
    credential: any  // Signed Verifiable Credential
}
```

**Error Codes**:
- `INVALID_PAYLOAD` - Missing credential ID
- `CREDENTIAL_NOT_FOUND` - Credential doesn't exist
- `USER_REJECTED` - User declined to share
- `UNKNOWN_ERROR` - Failed to retrieve credential

**Implementation Requirements**:
- Look up credential by ID
- Show share confirmation modal
- If accepted, sign and return the credential

---

### 5. ASK_CREDENTIAL_SEARCH

**Purpose**: Partner needs credentials matching certain criteria.

**Payload**:
```typescript
{
    criteria: {
        type?: string,      // e.g., 'ProofOfEducation'
        issuer?: string,    // Filter by issuer
        // Additional search parameters
    }
}
```

**Success Response**:
```typescript
{
    credentials: any[]  // Array of signed Verifiable Credentials
}
```

**Error Codes**:
- `INVALID_PAYLOAD` - Missing or invalid criteria
- `CREDENTIAL_NOT_FOUND` - No matching credentials
- `USER_REJECTED` - User didn't select any to share
- `UNKNOWN_ERROR` - Search failed

**Implementation Requirements**:
- Search wallet for matching credentials
- Show selection modal if multiple matches
- Sign and return selected credentials

---

### 6. LAUNCH_FEATURE

**Purpose**: Navigate to a specific LearnCard feature.

**Payload**:
```typescript
{
    feature: string,              // Feature name (e.g., 'ai-tutor')
    params?: Record<string, string>  // Optional query parameters
}
```

**Success Response**:
```typescript
{
    launched: boolean,
    feature: string
}
```

**Error Codes**:
- `INVALID_PAYLOAD` - Missing or unknown feature
- `UNKNOWN_ERROR` - Navigation failed

**Implementation Requirements**:
- Map feature name to route
- Navigate with parameters
- Immediately send success response

---

## Usage Example

### In a React Component

```typescript
import { useLearnCardPostMessage } from '../../hooks/post-message/useLearnCardPostMessage';
import { createActionHandlers } from '../../hooks/post-message/useLearnCardPostMessage.handlers';

function MyIframeModal() {
    const isLoggedIn = useIsLoggedIn();
    const history = useHistory();
    
    const handlers = React.useMemo(
        () => createActionHandlers({
            // Identity
            isUserAuthenticated: () => isLoggedIn,
            mintDelegatedToken: async () => {
                const response = await fetch('/api/auth/delegate-token', { method: 'POST' });
                const { token } = await response.json();
                return token;
            },
            
            // Consent
            showConsentModal: async (reason) => {
                // Show your custom consent modal
                return await ConsentModal.show(reason);
            },
            
            // Credentials
            saveCredential: async (credential) => {
                return await wallet.addCredential(credential);
            },
            
            // ... implement other handlers ...
            
            // Navigation
            navigate: (path, params) => {
                const query = params ? '?' + new URLSearchParams(params).toString() : '';
                history.push(path + query);
            },
        }),
        [isLoggedIn, history]
    );
    
    useLearnCardPostMessage({
        trustedOrigins: ['https://trusted-partner.com'],
        handlers,
        debug: true,
    });
    
    return <iframe src="https://trusted-partner.com/app" />;
}
```

## Implementation Checklist

### Current Status

The infrastructure is complete. The following handlers need to be connected to real implementations:

- [ ] **REQUEST_IDENTITY**
  - [ ] Connect to backend token minting API
  - [ ] Add token expiration management

- [ ] **REQUEST_CONSENT**
  - [ ] Replace `window.confirm` with custom modal
  - [ ] Add consent logging/audit trail

- [ ] **SEND_CREDENTIAL**
  - [ ] Connect to LearnCard wallet storage API
  - [ ] Create credential acceptance modal
  - [ ] Add credential validation

- [ ] **ASK_CREDENTIAL_SPECIFIC**
  - [ ] Connect to wallet retrieval API
  - [ ] Create share confirmation modal
  - [ ] Implement credential signing

- [ ] **ASK_CREDENTIAL_SEARCH**
  - [ ] Connect to wallet search API
  - [ ] Create multi-select credential modal
  - [ ] Implement batch signing

- [x] **LAUNCH_FEATURE**
  - [x] React Router navigation working
  - [ ] Add feature name validation
  - [ ] Add analytics tracking

## Testing from Partner Iframe

Partner applications can test the integration by sending messages:

```javascript
// In the partner iframe
function requestIdentity() {
    const requestId = 'req-' + Date.now();
    
    window.parent.postMessage({
        protocol: 'LEARNCARD_V1',
        action: 'REQUEST_IDENTITY',
        requestId: requestId,
    }, 'https://learncard.app');
    
    // Listen for response
    window.addEventListener('message', (event) => {
        if (event.data.requestId === requestId) {
            console.log('Response:', event.data);
            if (event.data.type === 'SUCCESS') {
                const token = event.data.data.token;
                // Use the token...
            }
        }
    });
}
```

## Debug Mode

Enable detailed logging:

```typescript
useLearnCardPostMessage({
    trustedOrigins: [...],
    handlers,
    debug: true,  // Logs all messages, validations, and responses
});
```

## Error Handling

All handlers should return structured errors:

```typescript
return {
    success: false,
    error: {
        code: 'LC_UNAUTHENTICATED',
        message: 'User is not authenticated'
    }
};
```

Standard error codes:
- `LC_UNAUTHENTICATED` - User not logged in
- `USER_REJECTED` - User declined the action
- `INVALID_PAYLOAD` - Missing or invalid data
- `CREDENTIAL_NOT_FOUND` - Credential doesn't exist
- `UNAUTHORIZED` - Permission denied
- `UNKNOWN_ERROR` - Unexpected failure

## Data Flow Diagram

```
┌─────────────┐                           ┌──────────────────┐
│   Partner   │                           │   LearnCard      │
│   Iframe    │                           │   Host App       │
└─────────────┘                           └──────────────────┘
       │                                            │
       │  1. postMessage(LEARNCARD_V1)             │
       │──────────────────────────────────────────>│
       │                                            │
       │                                    2. Validate Origin
       │                                    3. Validate Protocol
       │                                    4. Route to Handler
       │                                            │
       │                                    5. Execute Logic
       │                                    6. User Interaction
       │                                            │
       │  7. postMessage(SUCCESS/ERROR)            │
       │<──────────────────────────────────────────│
       │                                            │
```

## Extension Guide

To add a new action:

1. Add the action type to `LearnCardAction` in `useLearnCardPostMessage.ts`
2. Create a handler in `useLearnCardPostMessage.handlers.ts`
3. Add the handler to the `ActionHandlers` interface
4. Include it in the `createActionHandlers` factory
5. Document it in this README

## Security Best Practices

1. **Always validate origins** - Never skip origin checking
2. **Validate payload structure** - Check all required fields
3. **Use HTTPS only** - Never trust HTTP origins
4. **Log security events** - Track all origin rejections
5. **Rate limit** - Consider adding rate limiting for sensitive actions
6. **Audit trail** - Log all credential sharing events
7. **User consent** - Always require explicit user approval for sensitive actions

## Support

For questions or issues with the PostMessage system, contact the LearnCard platform team.

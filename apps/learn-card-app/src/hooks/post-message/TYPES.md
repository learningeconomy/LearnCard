# LEARNCARD_V1 PostMessage Type System

## Overview

The LEARNCARD_V1 protocol now has **strongly-typed payloads** for each action type, providing compile-time type safety and better developer experience.

## Payload Types

Each action type has a corresponding payload interface:

### REQUEST_IDENTITY
```typescript
interface RequestIdentityPayload {
    challenge?: string;  // Optional challenge string for DID Auth
}
```

### REQUEST_CONSENT
```typescript
interface RequestConsentPayload {
    contractUri: string;  // Required: URI pointing to the consent contract
}
```

### SEND_CREDENTIAL
```typescript
interface SendCredentialPayload {
    credential: any;  // The verifiable credential to store
}
```

### ASK_CREDENTIAL_SPECIFIC
```typescript
interface AskCredentialSpecificPayload {
    credentialId: string;  // ID of the specific credential to retrieve
}
```

### ASK_CREDENTIAL_SEARCH
```typescript
interface AskCredentialSearchPayload {
    verifiablePresentationRequest: {
        query: Array<{
            type: 'QueryByExample';
            credentialQuery: {
                reason: string;
                example: {
                    '@context': string[];
                    type: string | string[];
                    [key: string]: any;
                };
            };
        }>;
        challenge?: string;
        domain?: string;
    };
}
```

**Purpose:** Partner requests credentials matching specific criteria using a Verifiable Presentation Request (VPR).

**Workflow:**
1. Opens the `VprQueryByExample` modal showing user's credentials that match the VPR query
2. Filters and displays matching credentials based on the query example
3. User selects which credentials to share from the filtered list
4. Selected credentials are packaged into a Verifiable Presentation and signed
5. Returns the signed VP to the partner

**Example Request:**
```typescript
// Partner app sends VPR request
window.parent.postMessage({
    protocol: 'LEARNCARD_V1',
    action: 'ASK_CREDENTIAL_SEARCH',
    requestId: 'unique-id',
    payload: {
        verifiablePresentationRequest: {
            query: [
                {
                    type: 'QueryByExample',
                    credentialQuery: {
                        reason: 'Verify your identity',
                        example: {
                            '@context': ['https://www.w3.org/2018/credentials/v1'],
                            type: 'VerifiableCredential'
                        }
                    }
                }
            ],
            challenge: 'abc123',
            domain: 'partner.com'
        }
    }
}, '*');
```

**Response:**
- **Success:** 
```typescript
{ 
    success: true, 
    data: { 
        verifiablePresentation: {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: 'VerifiablePresentation',
            verifiableCredential: [/* selected credentials */],
            holder: 'did:example:123',
            proof: {
                type: 'Ed25519Signature2020',
                created: '2025-10-27T20:45:30Z',
                proofPurpose: 'authentication',
                verificationMethod: 'did:example:123#key-1',
                challenge: 'abc123',
                domain: 'partner.com',
                jws: '...'
            }
        }
    } 
}
```
- **User rejected:** `{ success: false, error: { code: 'USER_REJECTED', message: 'User did not select any credentials to share' } }`
- **Invalid VPR:** `{ success: false, error: { code: 'INVALID_PAYLOAD', message: 'Verifiable Presentation Request is required' } }`

### LAUNCH_FEATURE
```typescript
interface LaunchFeaturePayload {
    featurePath: string;  // Path to navigate to (e.g., '/wallet')
    params?: Record<string, string>;  // Optional query parameters
}
```

### INITIATE_TEMPLATE_ISSUE
```typescript
interface InitiateTemplateIssuePayload {
    templateId: string;  // The boost ID/template to issue
    draftRecipients?: string[];  // Optional list of profile IDs/DIDs to pre-select
}
```

**Purpose:** Partner prompts an admin user to issue a specific Boost template they manage.

**Workflow:**
1. Validates that the current LearnCard user is an administrator of the `templateId`
2. Launches the "Send Boost" modal, pre-loaded with the specified template
3. Allows user to select recipients (or uses `draftRecipients` if provided) and confirm sending
4. Returns success when user completes recipient selection, or error if cancelled

**Response:**
- **Success:** `{ success: true, data: { issued: true } }`
- **User cancelled:** `{ success: true, data: { issued: false } }`
- **Unauthorized:** `{ success: false, error: { code: 'UNAUTHORIZED', message: '...' } }`

## Type Safety Benefits

### 1. Compile-Time Validation
The handler signatures now enforce correct payload types:

```typescript
// ✅ Correct: challenge is properly typed as string | undefined
const handler: ActionHandler<'REQUEST_IDENTITY'> = async ({ payload }) => {
    const token = await mintToken(payload.challenge);  // TypeScript knows about 'challenge'
};

// ❌ Error: TypeScript catches typos at compile time
const handler: ActionHandler<'REQUEST_IDENTITY'> = async ({ payload }) => {
    const token = await mintToken(payload.challange);  // Error: Property 'challange' does not exist
};
```

### 2. Required vs Optional Fields
TypeScript enforces which fields are required:

```typescript
// ✅ 'reason' is required for REQUEST_CONSENT
const handler: ActionHandler<'REQUEST_CONSENT'> = async ({ payload }) => {
    const granted = await showModal(payload.reason);  // Always safe to access
};

// ❌ TypeScript error if you forget to check required fields
if (!payload.reason) {  // TypeScript knows this is necessary
    return { success: false, error: { ... } };
}
```

### 3. Autocomplete Support
IDEs now provide full autocomplete for payload properties:

```typescript
const handler: ActionHandler<'ASK_CREDENTIAL_SPECIFIC'> = async ({ payload }) => {
    // Typing 'payload.' shows: credentialId
    const cred = await getById(payload.credentialId);
};
```

## Implementation Pattern

### Handler Factories
Each handler factory now has a typed signature:

```typescript
export const createRequestIdentityHandler = (dependencies: {
    isUserAuthenticated: () => boolean;
    mintDelegatedToken: (challenge?: string) => Promise<string>;
}): ActionHandler<'REQUEST_IDENTITY'> => {
    return async ({ payload }) => {
        // payload is automatically typed as RequestIdentityPayload
        const token = await mintDelegatedToken(payload.challenge);
        // ...
    };
};
```

### ActionContext Generic
The `ActionContext` type is now generic over the action type:

```typescript
export interface ActionContext<T extends LearnCardAction = LearnCardAction> {
    origin: string;
    source: MessageEventSource;
    payload: ActionPayloadMap[T];  // Maps action type to payload type
}
```

### ActionPayloadMap
The central mapping from actions to payloads:

```typescript
export interface ActionPayloadMap {
    REQUEST_IDENTITY: RequestIdentityPayload;
    REQUEST_CONSENT: RequestConsentPayload;
    SEND_CREDENTIAL: SendCredentialPayload;
    ASK_CREDENTIAL_SPECIFIC: AskCredentialSpecificPayload;
    ASK_CREDENTIAL_SEARCH: AskCredentialSearchPayload;
    LAUNCH_FEATURE: LaunchFeaturePayload;
}
```

## Usage Example

### Creating a Handler with Strong Types

```typescript
import { ActionHandler, RequestIdentityPayload } from './useLearnCardPostMessage';

const myHandler: ActionHandler<'REQUEST_IDENTITY'> = async ({ payload, origin }) => {
    // TypeScript knows payload is RequestIdentityPayload
    // TypeScript provides autocomplete for payload.challenge
    
    if (payload.challenge) {
        console.log('Challenge provided:', payload.challenge);
    }
    
    // Return properly typed response
    return {
        success: true,
        data: { token: 'abc123' }
    };
};
```

### Type-Safe Handler Registry

```typescript
export interface ActionHandlers {
    REQUEST_IDENTITY?: ActionHandler<'REQUEST_IDENTITY'>;
    REQUEST_CONSENT?: ActionHandler<'REQUEST_CONSENT'>;
    SEND_CREDENTIAL?: ActionHandler<'SEND_CREDENTIAL'>;
    ASK_CREDENTIAL_SPECIFIC?: ActionHandler<'ASK_CREDENTIAL_SPECIFIC'>;
    ASK_CREDENTIAL_SEARCH?: ActionHandler<'ASK_CREDENTIAL_SEARCH'>;
    LAUNCH_FEATURE?: ActionHandler<'LAUNCH_FEATURE'>;
}
```

## Migration Notes

### No Breaking Changes for Consumers
Partner applications sending messages don't need to change - the payload structure remains the same. The type safety is purely on the LearnCard side.

### Handler Implementation Updates
If you're implementing handlers, you now get:
- ✅ Better autocomplete
- ✅ Compile-time error detection
- ✅ Safer refactoring
- ✅ Self-documenting code

### Future Extensibility
To add a new action type:

1. Add the action to `LearnCardAction` union
2. Define the payload interface
3. Add mapping in `ActionPayloadMap`
4. Create handler factory with typed signature
5. Add to `ActionHandlers` interface

TypeScript will ensure all pieces are connected correctly!

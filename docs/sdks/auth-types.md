---
description: Provider-agnostic interfaces for authentication and key derivation
---

# Auth Types

The auth types are defined in `@learncard/types` (in `src/auth.ts`) and provide the abstract interfaces used by the [AuthCoordinator](../core-concepts/architecture-and-principles/auth-coordinator.md), auth providers, and key derivation strategies.

## Installation

```bash
pnpm add @learncard/types
```

## Interfaces

### AuthProvider

The interface that authentication providers must implement. Handles sign-in, sign-out, and token management.

```typescript
interface AuthProvider {
    /** Get the provider type identifier (e.g., 'firebase') */
    getProviderType(): AuthProviderType;

    /** Get the currently authenticated user, or null */
    getCurrentUser(): Promise<AuthUser | null>;

    /** Get a fresh ID token for the current user */
    getIdToken(): Promise<string>;

    /** Sign out the current user */
    signOut(): Promise<void>;

    /** Subscribe to auth state changes. Returns an unsubscribe function. */
    onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;

    /** Re-authenticate with a custom token (e.g., after contact method upgrade) */
    reauthenticateWithToken?(token: string): Promise<void>;
}
```

### AuthUser

Represents an authenticated user in a provider-agnostic way:

```typescript
interface AuthUser {
    id: string;
    email?: string;
    phone?: string;
    displayName?: string;
    photoUrl?: string;
    providerType: AuthProviderType;
}
```

### KeyDerivationStrategy

The interface that key derivation strategies must implement. Handles key generation, storage, reconstruction, and recovery.

```typescript
interface KeyDerivationStrategy<
    TRecoveryInput = unknown,
    TSetupInput = unknown,
    TSetupResult = unknown
> {
    /** Check the server for an existing key record */
    fetchServerKeyStatus(token: string, providerType: string): Promise<ServerKeyStatus>;

    /** Generate a new key, split it, and store shares */
    setupNewKey(
        token: string,
        providerType: string,
        signDidAuthVp: (privateKey: string) => Promise<string>
    ): Promise<string>;

    /** Reconstruct the key from device share + auth share */
    reconstructKey(token: string, providerType: string): Promise<string>;

    /** Recover the key using a recovery method */
    recoverKey(token: string, providerType: string, input: TRecoveryInput): Promise<string>;

    /** Check if a device share exists locally */
    hasLocalKey(): Promise<boolean>;

    /** Clear the local device share */
    clearLocalKey(): Promise<void>;

    /** Migrate a legacy key to this strategy */
    migrateFromLegacy?(
        token: string,
        providerType: string,
        legacyKey: string,
        signDidAuthVp: (privateKey: string) => Promise<string>
    ): Promise<string>;

    /** Set up a new recovery method */
    setupRecoveryMethod?(params: {
        token: string;
        providerType: string;
        privateKey: string;
        input: TSetupInput;
        authUser?: AuthUser;
        signDidAuthVp: (privateKey: string) => Promise<string>;
    }): Promise<TSetupResult>;

    /** List available recovery methods for the user */
    getAvailableRecoveryMethods?(
        token: string,
        providerType: string
    ): Promise<RecoveryMethodInfo[]>;
}
```

### ServerKeyStatus

The response from checking the server for an existing key record:

```typescript
interface ServerKeyStatus {
    exists: boolean;
    keyProvider?: 'sss' | 'web3auth';
    securityLevel?: 'basic' | 'enhanced' | 'advanced';
    recoveryMethods?: RecoveryMethodInfo[];
    maskedRecoveryEmail?: string;
    shareVersion?: number;
}
```

### RecoveryMethodInfo

Information about a configured recovery method:

```typescript
interface RecoveryMethodInfo {
    type: string;
    createdAt: Date;
    credentialId?: string;
}
```

### SignInAdapter

The interface for sign-in UI adapters (Phase 2 of auth abstraction). Handles the UI-layer sign-in methods:

```typescript
interface SignInAdapter {
    readonly providerType: AuthProviderType;
    subscribe(onUser: (user: AuthUser | null) => void): () => void;
    sendEmailLink?(email: string, settings: ActionCodeSettings): Promise<void>;
    completeEmailLink?(email: string, link: string): Promise<AuthUser>;
    sendPhoneOtp?(phoneNumber: string): Promise<PhoneVerificationHandle>;
    confirmPhoneOtp?(verificationId: string, code: string): Promise<AuthUser>;
    signInWithOAuth?(provider: 'google' | 'apple'): Promise<AuthUser>;
    signOut(): Promise<void>;
    deleteAccount?(): Promise<void>;
}
```

### AuthSessionError

Typed error class for authentication session issues:

```typescript
class AuthSessionError extends Error {
    constructor(
        message: string,
        public readonly code: 'expired' | 'invalid' | 'network' | 'unknown'
    );
}
```

## Usage

These types are re-exported by both `@learncard/sss-key-manager` and `learn-card-base` for convenience.

```typescript
// From sss-key-manager (SSS-specific types + auth-types re-exports)
import type { AuthProvider, KeyDerivationStrategy, ContactMethod } from '@learncard/sss-key-manager';

// From learn-card-base (coordinator types + auth-types re-exports)
import type { AuthProvider, UnifiedAuthState } from 'learn-card-base';

// Direct import (only needed for new provider/strategy implementations)
import type { AuthProvider, KeyDerivationStrategy } from '@learncard/types';
```

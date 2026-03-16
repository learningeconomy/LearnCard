# Auth Provider Abstraction — Phase 2: Sign-In UI Layer

## Implementation Status ✅

Phase 2 has been implemented. Here's what was built:

### New Files
- **`packages/auth-types/src/index.ts`** — Added `SignInAdapter`, `PhoneVerificationHandle` interfaces
- **`packages/learn-card-base/src/auth-adapters/createFirebaseSignInAdapter.ts`** — Firebase implementation of `SignInAdapter`
- **`packages/learn-card-base/src/auth-adapters/index.ts`** — Barrel exports
- **`packages/learn-card-base/src/providers/SignInAdapterProvider.tsx`** — React context provider + `useSignInAdapter` hook

### Modified Files
- **`packages/learn-card-base/src/config/providerRegistry.ts`** — Added `registerSignInAdapterFactory()`, `resolveSignInAdapter()`
- **`packages/learn-card-base/src/auth-coordinator/types.ts`** — Re-exports `SignInAdapter`, `PhoneVerificationHandle`
- **`packages/learn-card-base/src/index.ts`** — Exports new modules
- **`apps/learn-card-app/src/providers/AuthCoordinatorProvider.tsx`** — Registered Firebase sign-in adapter, wrapped with `SignInAdapterProvider`, removed Phase 1 bridge
- **`apps/learn-card-app/src/hooks/useFirebase.ts`** — Removed all `firebaseAuthStore.set.setFirebaseCurrentUser()` calls
- **`apps/scouts/src/providers/AuthCoordinatorProvider.tsx`** — Same as LCA
- **`apps/scouts/src/hooks/useFirebase.ts`** — Same as LCA

### Architecture Decisions
- The `SignInAdapterProvider` subscribes to `onAuthStateChanged` and writes to `authUserStore` — this is the **single source of truth**, replacing the Phase 1 bridge.
- `useFirebase` hooks retain their existing Firebase SDK calls and error handling but no longer manually update `firebaseAuthStore.setFirebaseCurrentUser()` — the subscription handles state propagation.
- `useSignInAdapter()` hook is available for components that want to call adapter methods directly.
- Adding a new auth provider (Supertokens, Keycloak) requires: (1) implementing `SignInAdapter`, (2) registering via `registerSignInAdapterFactory()`, (3) setting `VITE_AUTH_PROVIDER`.

---

## Overview

Phase 1 established environment-driven auth provider selection at the **coordinator layer**:
- `authUserStore` — generic user state store
- `registerAuthProviderFactory()` / `resolveAuthProvider()` — registry pattern
- Bridge effect syncs `firebaseAuthStore` → `authUserStore` (temporary)

Phase 2 completes the abstraction by making the **sign-in UI layer** generic, allowing apps to swap auth providers (Firebase, Supertokens, Keycloak, etc.) via environment variables with zero code changes to sign-in components.

---

## Current State (Post-Phase 1)

### What's Generic
- `AuthProvider` interface (`getIdToken`, `signOut`, `reauthenticateWithToken`, etc.)
- `authUserStore` — provider-agnostic user state
- Coordinator layer uses `authProvider.*` methods exclusively
- Factory registration via `registerAuthProviderFactory()`

### What's Still Firebase-Specific
- `useFirebase` hook — contains all sign-in methods (phone, email, Google, Apple)
- `firebaseAuthStore` — written to by `useFirebase`, bridged to `authUserStore`
- Firebase SDK imports scattered across sign-in UI components
- Native Capacitor Firebase plugin usage (`@capacitor-firebase/authentication`)

---

## Phase 2 Architecture

### 1. Sign-In Adapter Interface

```typescript
// packages/auth-types/src/index.ts

export interface SignInAdapter {
    /** Auth provider type identifier */
    readonly providerType: AuthProviderType;

    /** Subscribe to auth state changes (returns unsubscribe function) */
    subscribe(onUser: (user: AuthUser | null) => void): () => void;

    /** Sign in with email link (passwordless) */
    sendEmailLink?(email: string, actionCodeSettings: ActionCodeSettings): Promise<void>;
    completeEmailLink?(email: string, link: string): Promise<AuthUser>;

    /** Sign in with phone/SMS OTP */
    sendPhoneOtp?(phoneNumber: string): Promise<ConfirmationResult>;
    confirmPhoneOtp?(verificationId: string, code: string): Promise<AuthUser>;

    /** OAuth sign-in (Google, Apple, etc.) */
    signInWithOAuth?(provider: 'google' | 'apple'): Promise<AuthUser>;

    /** Sign out */
    signOut(): Promise<void>;

    /** Delete account */
    deleteAccount?(): Promise<void>;
}

export interface ActionCodeSettings {
    url: string;
    handleCodeInApp: boolean;
    iOS?: { bundleId: string };
    android?: { packageName: string; installApp?: boolean; minimumVersion?: string };
    dynamicLinkDomain?: string;
}

export interface ConfirmationResult {
    verificationId: string;
}
```

### 2. Firebase Sign-In Adapter

```typescript
// packages/learn-card-base/src/auth-adapters/createFirebaseSignInAdapter.ts

export interface FirebaseSignInAdapterConfig {
    getAuth: () => Auth;
    getNativeAuth?: () => typeof FirebaseAuthentication;
    isNativePlatform?: () => boolean;
}

export function createFirebaseSignInAdapter(config: FirebaseSignInAdapterConfig): SignInAdapter {
    const { getAuth, getNativeAuth, isNativePlatform } = config;

    return {
        providerType: 'firebase',

        subscribe(onUser) {
            return onAuthStateChanged(getAuth(), (fbUser) => {
                if (fbUser) {
                    onUser({
                        id: fbUser.uid,
                        email: fbUser.email || undefined,
                        phone: fbUser.phoneNumber || undefined,
                        displayName: fbUser.displayName || undefined,
                        photoUrl: fbUser.photoURL || undefined,
                        providerType: 'firebase',
                    });
                } else {
                    onUser(null);
                }
            });
        },

        async sendEmailLink(email, settings) {
            await sendSignInLinkToEmail(getAuth(), email, settings);
            localStorage.setItem('emailForSignIn', email);
        },

        async completeEmailLink(email, link) {
            const result = await signInWithEmailLink(getAuth(), email, link);
            return mapFirebaseUser(result.user);
        },

        async sendPhoneOtp(phoneNumber) {
            // Native path vs. web path
            if (isNativePlatform?.()) {
                const nativeAuth = getNativeAuth?.();
                if (!nativeAuth) throw new Error('Native auth not configured');
                // Use Capacitor Firebase plugin
                await nativeAuth.signInWithPhoneNumber({ phoneNumber });
                return { verificationId: '__native__' };
            }

            // Web path — requires RecaptchaVerifier
            const appVerifier = new RecaptchaVerifier(getAuth(), 'recaptcha-container', { size: 'invisible' });
            const result = await signInWithPhoneNumber(getAuth(), phoneNumber, appVerifier);
            return { verificationId: result.verificationId };
        },

        async confirmPhoneOtp(verificationId, code) {
            if (verificationId === '__native__') {
                const nativeAuth = getNativeAuth?.();
                if (!nativeAuth) throw new Error('Native auth not configured');
                // Native confirmation
                const result = await nativeAuth.confirmVerificationCode({ verificationCode: code });
                // Map native result to AuthUser
                return mapNativeUser(result.user);
            }

            const credential = PhoneAuthProvider.credential(verificationId, code);
            const result = await signInWithCredential(getAuth(), credential);
            return mapFirebaseUser(result.user);
        },

        async signInWithOAuth(provider) {
            // Implementation varies by platform and provider
            // Native: use Capacitor Firebase plugin
            // Web: use Firebase popup/redirect
        },

        async signOut() {
            await getAuth().signOut();
            if (isNativePlatform?.()) {
                await getNativeAuth?.()?.signOut();
            }
        },

        async deleteAccount() {
            const user = getAuth().currentUser;
            if (user) await deleteUser(user);
        },
    };
}
```

### 3. Sign-In Adapter Registry

```typescript
// packages/learn-card-base/src/config/signInAdapterRegistry.ts

type SignInAdapterFactory = (config: AuthConfig) => SignInAdapter;

const signInAdapterRegistry = new Map<string, SignInAdapterFactory>();

export function registerSignInAdapterFactory(type: string, factory: SignInAdapterFactory): void {
    signInAdapterRegistry.set(type, factory);
}

export function resolveSignInAdapter(config: AuthConfig): SignInAdapter {
    const type = config.authProvider ?? 'firebase';
    const factory = signInAdapterRegistry.get(type);

    if (!factory) {
        throw new Error(`No sign-in adapter registered for type: ${type}`);
    }

    return factory(config);
}
```

### 4. Generic `useAuth` Hook (Replaces `useFirebase`)

```typescript
// packages/learn-card-base/src/hooks/useAuth.ts

export function useAuth() {
    const adapter = useSignInAdapter(); // from context
    const authUser = authUserStore.use.currentUser();

    // Memoized methods that delegate to the adapter
    const sendEmailLink = useCallback(async (email: string) => {
        if (!adapter.sendEmailLink) throw new Error('Email link not supported');
        await adapter.sendEmailLink(email, getActionCodeSettings());
    }, [adapter]);

    const confirmPhoneOtp = useCallback(async (verificationId: string, code: string) => {
        if (!adapter.confirmPhoneOtp) throw new Error('Phone auth not supported');
        return adapter.confirmPhoneOtp(verificationId, code);
    }, [adapter]);

    const signInWithGoogle = useCallback(async () => {
        if (!adapter.signInWithOAuth) throw new Error('OAuth not supported');
        return adapter.signInWithOAuth('google');
    }, [adapter]);

    const signOut = useCallback(async () => {
        await adapter.signOut();
        authUserStore.set.setUser(null);
    }, [adapter]);

    return {
        user: authUser,
        isAuthenticated: !!authUser,
        sendEmailLink,
        confirmPhoneOtp,
        signInWithGoogle,
        signOut,
        // ... other methods
    };
}
```

### 5. Sign-In Adapter Provider

```typescript
// packages/learn-card-base/src/providers/SignInAdapterProvider.tsx

const SignInAdapterContext = createContext<SignInAdapter | null>(null);

export function SignInAdapterProvider({ children }: { children: React.ReactNode }) {
    const authConfig = getAuthConfig();

    // Resolve adapter from registry (env-driven)
    const adapter = useMemo(() => resolveSignInAdapter(authConfig), [authConfig.authProvider]);

    // Subscribe to auth state changes → write to authUserStore
    useEffect(() => {
        return adapter.subscribe((user) => {
            authUserStore.set.setUser(user);
        });
    }, [adapter]);

    return (
        <SignInAdapterContext.Provider value={adapter}>
            {children}
        </SignInAdapterContext.Provider>
    );
}

export function useSignInAdapter(): SignInAdapter {
    const adapter = useContext(SignInAdapterContext);
    if (!adapter) throw new Error('useSignInAdapter must be used within SignInAdapterProvider');
    return adapter;
}
```

---

## Migration Plan

### Step 1: Create Sign-In Adapter Interface + Firebase Implementation
- Add `SignInAdapter` interface to `auth-types`
- Create `createFirebaseSignInAdapter()` in `learn-card-base`
- Create `signInAdapterRegistry` with `registerSignInAdapterFactory()` / `resolveSignInAdapter()`

### Step 2: Create Generic `useAuth` Hook
- Extract sign-in logic from `useFirebase` into adapter methods
- Create `useAuth` hook that delegates to `SignInAdapter`
- Create `SignInAdapterProvider` that sets up subscription

### Step 3: Migrate Sign-In Components
- Update `LoginPage`, `PhoneForm`, `EmailForm`, `GoogleButton`, `AppleButton` to use `useAuth`
- Remove direct Firebase SDK imports from UI components
- Remove `useFirebase` hook (or deprecate as re-export of `useAuth`)

### Step 4: Remove Phase 1 Bridge
- Remove `firebaseAuthStore` → `authUserStore` bridge effect
- Remove `firebaseAuthStore` reads from coordinator layer
- `useFirebase` writes to `firebaseAuthStore` are replaced by adapter's `subscribe()`

### Step 5: Retire `firebaseAuthStore`
- Mark as deprecated
- Remove from apps after verifying no remaining usages

---

## Environment Configuration

After Phase 2, swapping auth providers requires only:

```env
# .env
VITE_AUTH_PROVIDER=supertokens  # or 'firebase', 'keycloak', etc.
VITE_SUPERTOKENS_API_URL=https://auth.example.com
```

And registering the adapter at app startup:

```typescript
// App entry point
registerSignInAdapterFactory('supertokens', (config) =>
    createSupertokensSignInAdapter({ apiUrl: config.supertokensApiUrl })
);
```

---

## Testing Strategy

1. **Unit tests** for each adapter (mock provider SDKs)
2. **Integration tests** for `useAuth` hook with mock adapters
3. **E2E tests** per provider (Firebase, Supertokens) in CI with test accounts

---

## Timeline Estimate

| Phase | Scope | Estimate |
|-------|-------|----------|
| 2a | `SignInAdapter` interface + Firebase impl | 1-2 days |
| 2b | `useAuth` hook + `SignInAdapterProvider` | 1 day |
| 2c | Migrate LCA sign-in components | 2-3 days |
| 2d | Migrate Scouts sign-in components | 1-2 days |
| 2e | Remove bridge + retire `firebaseAuthStore` | 0.5 day |

**Total: ~6-8 days**

---

## Open Questions

1. **Supertokens specifics**: What sign-in methods are needed? (email/password, OAuth, magic link?)
2. **Native mobile**: Does Supertokens have a Capacitor plugin, or web-only?
3. **Session management**: Supertokens uses its own session tokens — how does this interact with `AuthProvider.getIdToken()`?

---

## Summary

Phase 2 completes the auth abstraction by:
- Moving all sign-in logic behind a `SignInAdapter` interface
- Creating a generic `useAuth` hook that works with any provider
- Enabling environment-driven provider selection for the full auth stack (not just coordinator)
- Retiring Firebase-specific stores and hooks

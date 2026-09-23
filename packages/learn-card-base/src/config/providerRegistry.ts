/**
 * Provider Registry
 *
 * Env-var-driven factory registry for auth providers and key derivation strategies.
 * Apps register concrete factories at startup; the registry resolves the correct
 * implementation based on environment variables at runtime.
 *
 * Environment Variables (checked in order: VITE_ → REACT_APP_ → default):
 *   VITE_AUTH_PROVIDER / REACT_APP_AUTH_PROVIDER           — 'firebase' (default)
 *   VITE_KEY_DERIVATION / REACT_APP_KEY_DERIVATION_PROVIDER — 'sss' (default)
 *
 * @example
 * ```ts
 * import { registerAuthProviderFactory, registerKeyDerivationFactory, resolveAuthProvider, resolveKeyDerivation } from 'learn-card-base';
 *
 * // At app startup — register concrete factories
 * registerAuthProviderFactory('firebase', (config) =>
 *     createFirebaseAuthProvider({ getAuth: () => auth(), user: firebaseUser })
 * );
 * registerKeyDerivationFactory('sss', () => {
 *     const sss = getSSSConfig();
 *     return createSSSStrategy({ serverUrl: sss.serverUrl });
 * });
 *
 * // Later — resolve by env var (or explicit override)
 * const authProvider = resolveAuthProvider(config);
 * const keyDerivation = resolveKeyDerivation(config);
 * ```
 */

import type { AuthProvider, KeyDerivationStrategy, SignInAdapter } from '../auth-coordinator/types';
import type { AuthConfig } from './authConfig';
import { getLogger } from '../logging/logger';

const log = getLogger('provider-registry');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthProviderFactory = (config: AuthConfig) => AuthProvider | null;

export type KeyDerivationFactory = (config: AuthConfig) => KeyDerivationStrategy;

export type SignInAdapterFactory = (config: AuthConfig) => SignInAdapter;

// ---------------------------------------------------------------------------
// Registries (module-level singletons)
// ---------------------------------------------------------------------------

const authProviderFactories = new Map<string, AuthProviderFactory>();

const keyDerivationFactories = new Map<string, KeyDerivationFactory>();

const signInAdapterFactories = new Map<string, SignInAdapterFactory>();

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a factory that creates an AuthProvider for the given provider name.
 * Calling with the same name replaces any previously registered factory.
 */
export const registerAuthProviderFactory = (name: string, factory: AuthProviderFactory): void => {
    authProviderFactories.set(name, factory);
};

/**
 * Register a factory that creates a KeyDerivationStrategy for the given name.
 * Calling with the same name replaces any previously registered factory.
 */
export const registerKeyDerivationFactory = (name: string, factory: KeyDerivationFactory): void => {
    keyDerivationFactories.set(name, factory);
};

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the auth provider using the registered factory for `config.authProvider`.
 * Returns `null` if the factory returns null (e.g. no Firebase user yet).
 * Throws if no factory is registered for the configured provider name.
 */
export const resolveAuthProvider = (config: AuthConfig): AuthProvider | null => {
    const factory = authProviderFactories.get(config.authProvider);

    if (!factory) {
        const registered = [...authProviderFactories.keys()].join(', ') || '(none)';

        throw new Error(
            `No auth provider factory registered for "${config.authProvider}". ` +
                `Registered: ${registered}. ` +
                `Set VITE_AUTH_PROVIDER or register a factory with registerAuthProviderFactory().`
        );
    }

    return factory(config);
};

/**
 * Resolve the key derivation strategy using the registered factory for `config.keyDerivation`.
 * Throws if no factory is registered for the configured key derivation name.
 */
export const resolveKeyDerivation = (config: AuthConfig): KeyDerivationStrategy => {
    const factory = keyDerivationFactories.get(config.keyDerivation);

    if (!factory) {
        const registered = [...keyDerivationFactories.keys()].join(', ') || '(none)';

        throw new Error(
            `No key derivation factory registered for "${config.keyDerivation}". ` +
                `Registered: ${registered}. ` +
                `Set VITE_KEY_DERIVATION or register a factory with registerKeyDerivationFactory().`
        );
    }

    return factory(config);
};

// ---------------------------------------------------------------------------
// Introspection (useful for debug widgets / tests)
// ---------------------------------------------------------------------------

export const getRegisteredAuthProviders = (): string[] => [...authProviderFactories.keys()];

export const getRegisteredKeyDerivations = (): string[] => [...keyDerivationFactories.keys()];

// ---------------------------------------------------------------------------
// Sign-In Adapter Registration & Resolution
// ---------------------------------------------------------------------------

/**
 * Register a factory that creates a SignInAdapter for the given provider name.
 * Calling with the same name replaces any previously registered factory.
 */
export const registerSignInAdapterFactory = (name: string, factory: SignInAdapterFactory): void => {
    signInAdapterFactories.set(name, factory);
};

/**
 * Resolve the sign-in adapter using the registered factory for `config.authProvider`.
 * Throws if no factory is registered for the configured provider name.
 *
 * **Note:** This calls the factory on every invocation. Callers should cache
 * the result (e.g., via `useMemo` in `SignInAdapterProvider`) to avoid
 * creating multiple adapter instances.
 */
export const resolveSignInAdapter = (config: AuthConfig): SignInAdapter => {
    const factory = signInAdapterFactories.get(config.authProvider);

    if (!factory) {
        const registered = [...signInAdapterFactories.keys()].join(', ') || '(none)';

        throw new Error(
            `No sign-in adapter factory registered for "${config.authProvider}". ` +
                `Registered: ${registered}. ` +
                `Set VITE_AUTH_PROVIDER or register a factory with registerSignInAdapterFactory().`
        );
    }

    return factory(config);
};

export const getRegisteredSignInAdapters = (): string[] => [...signInAdapterFactories.keys()];

// ---------------------------------------------------------------------------
// Auth Provider Initializer Registration & Execution
// ---------------------------------------------------------------------------

/**
 * One-time SDK bootstrap for a given auth provider (e.g. Firebase's
 * `initializeApp()` + analytics). Distinct from `AuthProviderFactory`: the
 * factory builds the per-session `AuthProvider` instance (invoked possibly
 * many times), while the initializer performs the provider's *global* SDK
 * setup that must run at most once per session.
 */
export type AuthProviderInitializer = (config: AuthConfig) => void | Promise<void>;

const authProviderInitializers = new Map<string, AuthProviderInitializer>();

/** Provider names whose initializer has already run (or started running). */
const initializedAuthProviderNames = new Set<string>();

/**
 * Register a one-time SDK bootstrap initializer for the given provider name.
 * Calling with the same name replaces any previously registered initializer
 * (the replacement only takes effect if that provider hasn't already been
 * initialized in this session — see `initializeAuthProvider`).
 */
export const registerAuthProviderInitializer = (
    name: string,
    initializer: AuthProviderInitializer
): void => {
    authProviderInitializers.set(name, initializer);
};

/**
 * Run the initializer registered for `config.authProvider`, and only that
 * one — every other registered initializer is skipped. This is what keeps a
 * tenant configured with e.g. `authProvider: 'keycloak'` from ever touching
 * the Firebase SDK: Firebase's initializer simply never runs.
 *
 * Idempotent: a given provider name is initialized at most once per session,
 * no matter how many times (or how early/often) this is called.
 *
 * Logs a warning (does not throw) when no initializer is registered for the
 * configured provider, since that usually means the provider's init module
 * wasn't imported before bootstrap.
 */
export const initializeAuthProvider = async (config: AuthConfig): Promise<void> => {
    const { authProvider } = config;

    if (initializedAuthProviderNames.has(authProvider)) return;

    const initializer = authProviderInitializers.get(authProvider);

    if (!initializer) {
        log.warn('No auth provider initializer registered; skipping SDK bootstrap', {
            authProvider,
            registered: [...authProviderInitializers.keys()],
        });
        return;
    }

    // Mark before awaiting so a second call issued before this one settles
    // (e.g. duplicate bootstrap invocations) can't re-enter the initializer.
    initializedAuthProviderNames.add(authProvider);

    try {
        await initializer(config);
    } catch (error) {
        initializedAuthProviderNames.delete(authProvider);
        throw error;
    }
};

export const getRegisteredAuthProviderInitializers = (): string[] => [
    ...authProviderInitializers.keys(),
];

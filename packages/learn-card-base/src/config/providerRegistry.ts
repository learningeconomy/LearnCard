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
 * registerKeyDerivationFactory('sss', (config) =>
 *     createSSSStrategy({ serverUrl: config.serverUrl })
 * );
 *
 * // Later — resolve by env var (or explicit override)
 * const authProvider = resolveAuthProvider(config);
 * const keyDerivation = resolveKeyDerivation(config);
 * ```
 */

import type { AuthProvider, KeyDerivationStrategy } from '../auth-coordinator/types';
import type { AuthConfig } from './authConfig';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthProviderFactory = (config: AuthConfig) => AuthProvider | null;

export type KeyDerivationFactory = (config: AuthConfig) => KeyDerivationStrategy;

// ---------------------------------------------------------------------------
// Registries (module-level singletons)
// ---------------------------------------------------------------------------

const authProviderFactories = new Map<string, AuthProviderFactory>();

const keyDerivationFactories = new Map<string, KeyDerivationFactory>();

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a factory that creates an AuthProvider for the given provider name.
 * Calling with the same name replaces any previously registered factory.
 */
export const registerAuthProviderFactory = (
    name: string,
    factory: AuthProviderFactory
): void => {
    authProviderFactories.set(name, factory);
};

/**
 * Register a factory that creates a KeyDerivationStrategy for the given name.
 * Calling with the same name replaces any previously registered factory.
 */
export const registerKeyDerivationFactory = (
    name: string,
    factory: KeyDerivationFactory
): void => {
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

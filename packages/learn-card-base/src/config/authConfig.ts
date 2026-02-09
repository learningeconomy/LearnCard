/**
 * Auth Configuration
 *
 * Environment-driven configuration for the auth coordinator.
 * Reads from environment variables with sensible defaults.
 *
 * For each key the lookup order is: VITE_ prefix → REACT_APP_ prefix → default.
 *
 * Environment Variables:
 *   VITE_AUTH_PROVIDER / REACT_APP_AUTH_PROVIDER                   — 'firebase' (default)
 *   VITE_KEY_DERIVATION / REACT_APP_KEY_DERIVATION_PROVIDER        — 'sss' (default)
 *   VITE_SSS_SERVER_URL / REACT_APP_SSS_SERVER_URL                 — 'http://localhost:5100/api' (default)
 *   VITE_ENABLE_MIGRATION / REACT_APP_ENABLE_MIGRATION             — 'true' (default)
 *   VITE_ENABLE_EMAIL_BACKUP_SHARE / REACT_APP_ENABLE_EMAIL_BACKUP_SHARE — 'false' (default)
 *   VITE_WEB3AUTH_CLIENT_ID                                                 — Web3Auth client ID from dashboard
 *   VITE_WEB3AUTH_NETWORK                                                   — Web3Auth network (e.g. 'testnet', 'cyan', 'sapphire_mainnet')
 *   VITE_WEB3AUTH_VERIFIER_ID                                               — Web3Auth verifier name (e.g. 'learncardapp-firebase')
 *   VITE_WEB3AUTH_RPC_TARGET                                                — Ethereum RPC URL for Web3Auth (e.g. Infura endpoint)
 *
 * For self-hosting, set these in your .env file or deployment environment.
 */

import type { AuthProviderType } from '../auth-coordinator/types';

export type KeyDerivationProviderType = 'sss' | 'web3auth';

export interface AuthConfig {
    /** Which auth provider to use */
    authProvider: AuthProviderType;

    /** Which key derivation provider to use */
    keyDerivation: KeyDerivationProviderType;

    /** Server URL for key share operations */
    serverUrl: string;

    /** Whether migration from Web3Auth to SSS is enabled */
    enableMigration: boolean;

    /** Whether to automatically send a backup share to the user's email during key setup */
    enableEmailBackupShare: boolean;

    /** Web3Auth client ID from the Web3Auth dashboard */
    web3AuthClientId: string;

    /** Web3Auth network (e.g. 'testnet', 'cyan', 'sapphire_mainnet') */
    web3AuthNetwork: string;

    /** Web3Auth verifier ID (e.g., 'learncardapp-firebase'). Used for migration and Web3Auth strategy. */
    web3AuthVerifierId: string;

    /** Ethereum RPC URL for Web3Auth private key provider (e.g. Infura endpoint) */
    web3AuthRpcTarget: string;
}

const getEnvVar = (key: string): string | undefined => {
    // Vite exposes VITE_* env vars from .env files via import.meta.env
    try {
        const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;

        if (metaEnv) {
            const val = metaEnv[key];
            if (val !== undefined) return val;
        }
    } catch {
        // import.meta may not be available in all environments
    }

    // CRA / Node-style
    if (typeof process !== 'undefined' && process.env) {
        const val = process.env[key];
        if (val !== undefined) return val;
    }

    // Runtime injection (e.g. Docker / Vite runtime config)
    if (typeof window !== 'undefined' && (window as Record<string, unknown>).__ENV__) {
        const val = (window as Record<string, unknown> & { __ENV__: Record<string, string> }).__ENV__[key];
        if (val !== undefined) return val;
    }

    return undefined;
};

/**
 * Read an env var with Vite and CRA prefix fallback.
 * e.g. readEnv('AUTH_PROVIDER') checks VITE_AUTH_PROVIDER then REACT_APP_AUTH_PROVIDER.
 */
const readEnv = (suffix: string, legacySuffix?: string): string | undefined => {
    return (
        getEnvVar(`VITE_${suffix}`) ??
        getEnvVar(`REACT_APP_${legacySuffix ?? suffix}`) ??
        undefined
    );
};

/**
 * Get the auth configuration from environment variables.
 * 
 * @example
 * ```ts
 * const config = getAuthConfig();
 * console.log(config.authProvider); // 'firebase'
 * console.log(config.serverUrl);   // 'http://localhost:5100/api'
 * ```
 */
export const getAuthConfig = (): AuthConfig => {
    const authProvider: AuthProviderType =
        readEnv('AUTH_PROVIDER', 'AUTH_PROVIDER') || 'firebase';

    const keyDerivationEnv =
        readEnv('KEY_DERIVATION', 'KEY_DERIVATION_PROVIDER') || 'sss';

    const keyDerivation: KeyDerivationProviderType =
        keyDerivationEnv === 'web3auth' ? 'web3auth' : 'sss';

    const serverUrl =
        readEnv('SSS_SERVER_URL', 'SSS_SERVER_URL') || 'http://localhost:5100/api';

    const enableMigration =
        readEnv('ENABLE_MIGRATION', 'ENABLE_MIGRATION') !== 'false';

    const enableEmailBackupShare =
        readEnv('ENABLE_EMAIL_BACKUP_SHARE', 'ENABLE_EMAIL_BACKUP_SHARE') === 'true';

    const web3AuthClientId =
        readEnv('WEB3AUTH_CLIENT_ID', 'WEB3AUTH_CLIENT_ID') || '';

    const web3AuthNetwork =
        readEnv('WEB3AUTH_NETWORK', 'WEB3AUTH_NETWORK') || '';

    const web3AuthVerifierId =
        readEnv('WEB3AUTH_VERIFIER_ID', 'WEB3AUTH_VERIFIER_ID') || '';

    const web3AuthRpcTarget =
        readEnv('WEB3AUTH_RPC_TARGET', 'WEB3AUTH_RPC_TARGET') || 'https://rpc.ankr.com/eth';

    return {
        authProvider,
        keyDerivation,
        serverUrl,
        enableMigration,
        enableEmailBackupShare,
        web3AuthClientId,
        web3AuthNetwork,
        web3AuthVerifierId,
        web3AuthRpcTarget,
    };
};

/**
 * Check if the current configuration uses SSS key derivation.
 */
export const shouldUseSSS = (): boolean => {
    return getAuthConfig().keyDerivation === 'sss';
};

/**
 * Check if migration from Web3Auth to SSS is enabled.
 */
export const isAuthMigrationEnabled = (): boolean => {
    return getAuthConfig().enableMigration;
};

/**
 * Check if the email backup share feature is enabled.
 */
export const isEmailBackupShareEnabled = (): boolean => {
    return getAuthConfig().enableEmailBackupShare;
};

export default getAuthConfig;

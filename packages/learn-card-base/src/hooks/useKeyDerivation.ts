/**
 * Unified Key Derivation Hook
 * 
 * Switches between Web3Auth SFA and SSS Key Manager based on configuration.
 * This provides a consistent interface for the app regardless of which provider is active.
 */

import { useCallback, useMemo } from 'react';

import { shouldUseSSSKeyManager, getKeyDerivationConfig } from '../config/keyDerivation';
import { useWeb3AuthSFA } from './useWeb3AuthSFA';
import { useSSSKeyManager, type AuthProviderAdapter } from './useSSSKeyManager';

export interface UnifiedKeyDerivationHook {
    provider: 'web3auth' | 'sss';
    logout: (redirectUrl?: string) => Promise<void>;
    loggingOut: boolean;
    connecting: boolean;
    error: string | null;

    connectSSS?: (authProvider: AuthProviderAdapter) => Promise<string | null>;
    setupWithPrivateKey?: (
        authProvider: AuthProviderAdapter,
        privateKey: string,
        primaryDid: string
    ) => Promise<void>;
    migrateFromWeb3Auth?: (
        authProvider: AuthProviderAdapter,
        privateKey: string,
        primaryDid: string
    ) => Promise<void>;

    web3AuthSFAInit?: () => Promise<any>;
}

export const useKeyDerivation = (): UnifiedKeyDerivationHook => {
    const config = getKeyDerivationConfig();
    const useSSS = shouldUseSSSKeyManager();

    const web3AuthHook = useWeb3AuthSFA();
    const sssHook = useSSSKeyManager({ serverUrl: config.sssServerUrl || '' });

    const logout = useCallback(async (redirectUrl?: string) => {
        if (useSSS) {
            await sssHook.logout(redirectUrl);
        } else {
            await web3AuthHook.logout(redirectUrl);
        }
    }, [useSSS, sssHook, web3AuthHook]);

    return useMemo(() => {
        if (useSSS) {
            return {
                provider: 'sss' as const,
                logout,
                loggingOut: sssHook.loggingOut,
                connecting: sssHook.connecting,
                error: sssHook.error,
                connectSSS: sssHook.connect,
                setupWithPrivateKey: sssHook.setupWithPrivateKey,
                migrateFromWeb3Auth: sssHook.migrateFromWeb3Auth,
            };
        }

        return {
            provider: 'web3auth' as const,
            logout,
            loggingOut: web3AuthHook.loggingOut,
            connecting: false,
            error: null,
            web3AuthSFAInit: web3AuthHook.web3AuthSFAInit,
        };
    }, [useSSS, logout, sssHook, web3AuthHook]);
};

export default useKeyDerivation;

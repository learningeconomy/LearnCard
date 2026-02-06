/**
 * Key Derivation Configuration
 * 
 * Controls which key derivation provider to use:
 * - 'web3auth': Legacy Web3Auth SFA (default for prod until migration complete)
 * - 'sss': New Shamir Secret Sharing key manager
 */

export type KeyDerivationProvider = 'web3auth' | 'sss';

export interface KeyDerivationConfig {
    provider: KeyDerivationProvider;
    sssServerUrl?: string;
    enableMigration: boolean;
}

const getEnvVar = (key: string): string | undefined => {
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
        return (window as any).__ENV__[key];
    }
    return undefined;
};

export const getKeyDerivationConfig = (): KeyDerivationConfig => {
    const providerEnv = getEnvVar('REACT_APP_KEY_DERIVATION_PROVIDER');
    const sssServerUrl = getEnvVar('REACT_APP_SSS_SERVER_URL');
    const enableMigration = getEnvVar('REACT_APP_ENABLE_SSS_MIGRATION') === 'true';

    const provider: KeyDerivationProvider = 
        providerEnv === 'sss' ? 'sss' : 'web3auth';

    return {
        provider,
        sssServerUrl: sssServerUrl || undefined,
        enableMigration,
    };
};

export const useKeyDerivationProvider = (): KeyDerivationProvider => {
    const config = getKeyDerivationConfig();
    return config.provider;
};

export const shouldUseSSSKeyManager = (): boolean => {
    return getKeyDerivationConfig().provider === 'sss';
};

export const isMigrationEnabled = (): boolean => {
    return getKeyDerivationConfig().enableMigration;
};

export default getKeyDerivationConfig;

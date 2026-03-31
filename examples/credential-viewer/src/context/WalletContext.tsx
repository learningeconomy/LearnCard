import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

import type { VC } from '@learncard/types';

import { getCategoryForCredential } from '../lib/category';

// The exact wallet type is a complex generic union from initLearnCard.
// We store it loosely and expose typed operations via context methods.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WalletInstance = any;

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type NetworkEnvKey = 'production' | 'staging' | 'local' | 'custom';

export interface NetworkEnvConfig {
    label: string;
    network: string;
    cloud: string;
}

export const NETWORK_PRESETS: Record<Exclude<NetworkEnvKey, 'custom'>, NetworkEnvConfig> = {
    production: {
        label: 'Production',
        network: 'https://network.learncard.com/trpc',
        cloud: 'https://cloud.learncard.com/trpc',
    },
    staging: {
        label: 'Staging',
        network: 'https://staging.network.learncard.com/trpc',
        cloud: 'https://staging.cloud.learncard.com/trpc',
    },
    local: {
        label: 'Local',
        network: 'http://localhost:4000/trpc',
        cloud: 'http://localhost:4100/trpc',
    },
};

interface WalletContextValue {
    wallet: WalletInstance | null;
    did: string | null;
    seed: string | null;
    status: ConnectionStatus;
    error: string | null;
    envKey: NetworkEnvKey;
    envConfig: NetworkEnvConfig;

    setEnv: (key: NetworkEnvKey, custom?: NetworkEnvConfig) => void;
    connect: (seed: string) => Promise<void>;
    disconnect: () => void;
    generateSeed: () => string;

    issueAndStore: (unsigned: Record<string, unknown>, categoryOverride?: string) => Promise<{ uri: string; signed: VC }>;

    send: (input: {
        recipient: string;
        credential: Record<string, unknown>;
        name?: string;
        category?: string;
    }) => Promise<unknown>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = (): WalletContextValue => {
    const ctx = useContext(WalletContext);

    if (!ctx) throw new Error('useWallet must be used within WalletProvider');

    return ctx;
};

const SEED_STORAGE_KEY = 'credential-viewer:seed';
const ENV_KEY_STORAGE = 'credential-viewer:env-key';
const ENV_CUSTOM_STORAGE = 'credential-viewer:env-custom';

const loadEnv = (): { key: NetworkEnvKey; config: NetworkEnvConfig } => {
    const stored = localStorage.getItem(ENV_KEY_STORAGE) as NetworkEnvKey | null;

    if (stored && stored !== 'custom' && NETWORK_PRESETS[stored]) {
        return { key: stored, config: NETWORK_PRESETS[stored] };
    }

    if (stored === 'custom') {
        try {
            const custom = JSON.parse(localStorage.getItem(ENV_CUSTOM_STORAGE) ?? '');

            if (custom?.network && custom?.cloud) {
                return { key: 'custom', config: custom as NetworkEnvConfig };
            }
        } catch { /* fall through */ }
    }

    return { key: 'production', config: NETWORK_PRESETS.production };
};

const generateHexSeed = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));

    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wallet, setWallet] = useState<WalletInstance | null>(null);
    const [did, setDid] = useState<string | null>(null);
    const [seed, setSeed] = useState<string | null>(
        () => localStorage.getItem(SEED_STORAGE_KEY)
    );
    const [envKey, setEnvKey] = useState<NetworkEnvKey>(() => loadEnv().key);
    const [envConfig, setEnvConfig] = useState<NetworkEnvConfig>(() => loadEnv().config);
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    const envConfigRef = useRef(envConfig);
    envConfigRef.current = envConfig;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walletRef = useRef<any>(null);

    const setEnv = useCallback((key: NetworkEnvKey, custom?: NetworkEnvConfig) => {
        if (key === 'custom' && custom) {
            setEnvKey('custom');
            setEnvConfig(custom);
            localStorage.setItem(ENV_KEY_STORAGE, 'custom');
            localStorage.setItem(ENV_CUSTOM_STORAGE, JSON.stringify(custom));
        } else if (key !== 'custom') {
            setEnvKey(key);
            setEnvConfig(NETWORK_PRESETS[key]);
            localStorage.setItem(ENV_KEY_STORAGE, key);
            localStorage.removeItem(ENV_CUSTOM_STORAGE);
        }
    }, []);

    const connect = useCallback(async (inputSeed: string) => {
        setStatus('connecting');
        setError(null);

        const cfg = envConfigRef.current;

        try {
            const { initLearnCard } = await import('@learncard/init');

            const lc = await initLearnCard({
                seed: inputSeed,
                network: cfg.network,
                cloud: { url: cfg.cloud },
                allowRemoteContexts: true,
            });
            const walletDid = lc.id.did();

            walletRef.current = lc;
            setWallet(lc);
            setDid(walletDid);
            setSeed(inputSeed);
            setStatus('connected');

            localStorage.setItem(SEED_STORAGE_KEY, inputSeed);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            setError(msg);
            setStatus('error');
            walletRef.current = null;
            setWallet(null);
            setDid(null);
        }
    }, []);

    const disconnect = useCallback(() => {
        walletRef.current = null;
        setWallet(null);
        setDid(null);
        setSeed(null);
        setStatus('disconnected');
        setError(null);

        localStorage.removeItem(SEED_STORAGE_KEY);
        // Keep env prefs across disconnects
    }, []);

    const generateSeed = useCallback((): string => {
        return generateHexSeed();
    }, []);

    const issueAndStore = useCallback(async (
        unsigned: Record<string, unknown>,
        categoryOverride?: string,
    ): Promise<{ uri: string; signed: VC }> => {
        const lc = walletRef.current;

        if (!lc) throw new Error('Wallet not connected');

        const signed = await lc.invoke.issueCredential(unsigned);

        const uri = await lc.store.LearnCloud?.uploadEncrypted?.(signed) ?? '';

        if (!uri) throw new Error('Failed to upload to LearnCloud');

        const id = (signed as Record<string, unknown>).id as string | undefined ?? uri;

        const category = categoryOverride || getCategoryForCredential(signed as Record<string, unknown>);

        await lc.index.LearnCloud?.add?.({
            id,
            uri,
            category,
        });

        return { uri, signed: signed as VC };
    }, []);

    const send = useCallback(async (input: {
        recipient: string;
        credential: Record<string, unknown>;
        name?: string;
        category?: string;
    }): Promise<unknown> => {
        const lc = walletRef.current;

        if (!lc) throw new Error('Wallet not connected');

        if (!lc.invoke.send) {
            throw new Error('Wallet does not have send capability. Network mode required.');
        }

        const result = await lc.invoke.send({
            type: 'boost',
            recipient: input.recipient,
            template: {
                credential: input.credential,
                name: input.name ?? 'Credential from Viewer',
                category: input.category ?? getCategoryForCredential(input.credential),
            },
        });

        return result;
    }, []);

    const value: WalletContextValue = {
        wallet,
        did,
        seed,
        status,
        error,
        envKey,
        envConfig,
        setEnv,
        connect,
        disconnect,
        generateSeed,
        issueAndStore,
        send,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

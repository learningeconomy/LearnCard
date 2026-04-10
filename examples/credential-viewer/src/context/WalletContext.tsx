import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

import type { VC } from '@learncard/types';

import { getCategoryForCredential } from '../lib/category';

// The exact wallet type is a complex generic union from initLearnCard.
// We store it loosely and expose typed operations via context methods.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WalletInstance = any;

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LCNProfileInfo {
    did: string;
    profileId: string;
    displayName: string;
    image?: string;
}

export interface SigningAuthorityInfo {
    name: string;
    endpoint: string;
    did: string;
}

export type NetworkEnvKey = 'production' | 'staging' | 'local' | 'custom';

export interface NetworkEnvConfig {
    label: string;
    network: string;
    cloud: string;
    signingAuthority?: string;
}

export const NETWORK_PRESETS: Record<Exclude<NetworkEnvKey, 'custom'>, NetworkEnvConfig> = {
    production: {
        label: 'Production',
        network: 'https://network.learncard.com/trpc',
        cloud: 'https://cloud.learncard.com/trpc',
        signingAuthority: 'https://api.learncard.app/trpc',
    },
    staging: {
        label: 'Staging',
        network: 'https://staging.network.learncard.com/trpc',
        cloud: 'https://staging.cloud.learncard.com/trpc',
        signingAuthority: 'https://staging.api.learncard.app/trpc',
    },
    local: {
        label: 'Local',
        network: 'http://localhost:4000/trpc',
        cloud: 'http://localhost:4100/trpc',
        signingAuthority: 'http://localhost:5100/trpc'
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

    profile: LCNProfileInfo | null;
    profileLoading: boolean;
    profileError: string | null;

    signingAuthority: SigningAuthorityInfo | null;
    saLoading: boolean;
    saError: string | null;

    setEnv: (key: NetworkEnvKey, custom?: NetworkEnvConfig) => void;
    connect: (seed: string) => Promise<void>;
    disconnect: () => void;
    generateSeed: () => string;

    fetchProfile: () => Promise<void>;
    createProfile: (input: { displayName: string; profileId: string }) => Promise<void>;
    ensureSigningAuthority: () => Promise<void>;

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

    const [profile, setProfile] = useState<LCNProfileInfo | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [signingAuthority, setSigningAuthority] = useState<SigningAuthorityInfo | null>(null);
    const [saLoading, setSaLoading] = useState(false);
    const [saError, setSaError] = useState<string | null>(null);

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

    const DEFAULT_SA_NAME = 'viewer-sa';

    const doEnsureSigningAuthority = useCallback(async () => {
        const lc = walletRef.current;

        if (!lc?.invoke?.getRegisteredSigningAuthorities) {
            throw new Error('Wallet missing network plugin');
        }

        setSaLoading(true);
        setSaError(null);

        try {
            // 1. Check if any signing authorities already registered
            const existing = await lc.invoke.getRegisteredSigningAuthorities();

            if (existing && existing.length > 0) {
                // Already have at least one — check if primary is set
                const primary = await lc.invoke.getPrimaryRegisteredSigningAuthority();

                if (primary?.signingAuthority?.endpoint) {
                    setSigningAuthority({
                        name: primary.relationship?.name ?? DEFAULT_SA_NAME,
                        endpoint: primary.signingAuthority.endpoint,
                        did: primary.relationship?.did ?? '',
                    });
                    return;
                }

                // Has registered SAs but no primary — set first one as primary
                const first = existing[0];

                await lc.invoke.setPrimaryRegisteredSigningAuthority(
                    first.signingAuthority.endpoint,
                    first.relationship.name,
                );

                setSigningAuthority({
                    name: first.relationship.name,
                    endpoint: first.signingAuthority.endpoint,
                    did: first.relationship.did ?? '',
                });

                return;
            }

            // 2. No registered SAs — check managed SAs or create one
            let sa: { name: string; endpoint: string; did: string } | undefined;

            if (lc.invoke.getSigningAuthorities) {
                const managed = await lc.invoke.getSigningAuthorities();

                sa = managed?.find((s: { name: string }) => s?.name === DEFAULT_SA_NAME);
            }

            if (!sa && lc.invoke.createSigningAuthority) {
                sa = await lc.invoke.createSigningAuthority(DEFAULT_SA_NAME);
            }

            if (!sa || !sa.endpoint) {
                const hasPlugin = !!lc.invoke.createSigningAuthority;

                throw new Error(
                    hasPlugin
                        ? 'Signing authority was created but has no endpoint. Is the signing authority service running?'
                        : 'No signing authority plugin available. Make sure the environment has a signingAuthority URL configured.'
                );
            }

            // 3. Register it
            await lc.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);

            // 4. Set as primary
            await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint, sa.name);

            setSigningAuthority({
                name: sa.name,
                endpoint: sa.endpoint,
                did: sa.did,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            setSaError(msg);
            throw err;
        } finally {
            setSaLoading(false);
        }
    }, []);

    const doFetchProfile = useCallback(async () => {
        const lc = walletRef.current;

        if (!lc?.invoke?.getProfile) return;

        setProfileLoading(true);
        setProfileError(null);

        try {
            const existing = await lc.invoke.getProfile();

            if (existing && 'profileId' in existing && existing.profileId) {
                setProfile({
                    did: 'did' in existing ? (existing.did as string) : '',
                    profileId: existing.profileId as string,
                    displayName: ('displayName' in existing ? existing.displayName as string : undefined) ?? (existing.profileId as string),
                    image: 'image' in existing ? (existing.image as string | undefined) : undefined,
                });
            } else {
                setProfile(null);
            }
        } catch {
            // No profile exists yet — that's fine
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const connect = useCallback(async (inputSeed: string) => {
        setStatus('connecting');
        setError(null);
        setProfile(null);
        setProfileError(null);
        setSigningAuthority(null);
        setSaError(null);

        const cfg = envConfigRef.current;

        try {
            const { initLearnCard } = await import('@learncard/init');

            let lc = await initLearnCard({
                seed: inputSeed,
                network: cfg.network,
                cloud: { url: cfg.cloud },
                allowRemoteContexts: true,
            });

            // Add Simple Signing plugin if a signing authority URL is configured
            if (cfg.signingAuthority) {
                try {
                    const { getSimpleSigningPlugin } = await import('@learncard/simple-signing-plugin');

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    lc = await (lc as any).addPlugin(
                        await getSimpleSigningPlugin(lc as any, cfg.signingAuthority)
                    );
                } catch (err) {
                    console.warn('Could not load Simple Signing plugin:', err);
                }
            }

            const walletDid = lc.id.did();

            walletRef.current = lc;
            setWallet(lc);
            setDid(walletDid);
            setSeed(inputSeed);
            setStatus('connected');

            localStorage.setItem(SEED_STORAGE_KEY, inputSeed);

            // Auto-fetch existing LCN profile after connection
            setProfileLoading(true);

            try {
                const existing = await lc.invoke.getProfile();

                if (existing && 'profileId' in existing && existing.profileId) {
                    setProfile({
                        did: 'did' in existing ? (existing.did as string) : walletDid,
                        profileId: existing.profileId as string,
                        displayName: ('displayName' in existing ? existing.displayName as string : undefined) ?? (existing.profileId as string),
                        image: 'image' in existing ? (existing.image as string | undefined) : undefined,
                    });

                    // Auto-check signing authority when profile exists
                    try {
                        setSaLoading(true);

                        const primary = await lc.invoke.getPrimaryRegisteredSigningAuthority?.();

                        if (primary?.signingAuthority?.endpoint) {
                            setSigningAuthority({
                                name: primary.relationship?.name ?? 'viewer-sa',
                                endpoint: primary.signingAuthority.endpoint,
                                did: primary.relationship?.did ?? '',
                            });
                        }
                    } catch {
                        // No SA yet — user can set up later
                    } finally {
                        setSaLoading(false);
                    }
                }
            } catch {
                // No profile — user can create one
            } finally {
                setProfileLoading(false);
            }
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
        setProfile(null);
        setProfileError(null);
        setSigningAuthority(null);
        setSaError(null);

        localStorage.removeItem(SEED_STORAGE_KEY);
        // Keep env prefs across disconnects
    }, []);

    const generateSeed = useCallback((): string => {
        return generateHexSeed();
    }, []);

    const handleCreateProfile = useCallback(async (input: { displayName: string; profileId: string }) => {
        const lc = walletRef.current;

        if (!lc?.invoke?.createProfile) {
            throw new Error('Wallet not connected or missing network plugin');
        }

        setProfileLoading(true);
        setProfileError(null);

        try {
            await lc.invoke.createProfile({
                displayName: input.displayName,
                profileId: input.profileId,
            });

            // Re-fetch the full profile after creation
            const created = await lc.invoke.getProfile();

            if (created && 'profileId' in created && created.profileId) {
                setProfile({
                    did: 'did' in created ? (created.did as string) : '',
                    profileId: created.profileId as string,
                    displayName: ('displayName' in created ? created.displayName as string : undefined) ?? (created.profileId as string),
                    image: 'image' in created ? (created.image as string | undefined) : undefined,
                });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            setProfileError(msg);
            throw err;
        } finally {
            setProfileLoading(false);
        }
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
        profile,
        profileLoading,
        profileError,
        setEnv,
        connect,
        disconnect,
        generateSeed,
        signingAuthority,
        saLoading,
        saError,
        fetchProfile: doFetchProfile,
        createProfile: handleCreateProfile,
        ensureSigningAuthority: doEnsureSigningAuthority,
        issueAndStore,
        send,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

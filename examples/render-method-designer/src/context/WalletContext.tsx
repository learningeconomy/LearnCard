import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type WalletInstance = unknown;

interface WalletContextValue {
    wallet: WalletInstance | null;
    did: string | null;
    seed: string | null;
    status: ConnectionStatus;
    error: string | null;
    connect: (seed: string) => Promise<void>;
    disconnect: () => void;
    generateSeed: () => string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const useWallet = (): WalletContextValue => {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error('useWallet must be used within WalletProvider');
    return ctx;
};

const SEED_STORAGE_KEY = 'render-method-designer:seed';

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
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    const walletRef = useRef<WalletInstance | null>(null);

    const connect = useCallback(async (inputSeed: string) => {
        setStatus('connecting');
        setError(null);
        try {
            const { initLearnCard } = await import('@learncard/init');
            const lc = await initLearnCard({ seed: inputSeed });
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
    }, []);

    const generateSeed = useCallback((): string => generateHexSeed(), []);

    const value: WalletContextValue = {
        wallet,
        did,
        seed,
        status,
        error,
        connect,
        disconnect,
        generateSeed,
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

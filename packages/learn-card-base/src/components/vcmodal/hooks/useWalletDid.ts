import { useState, useEffect, useCallback } from 'react';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import useWallet from 'learn-card-base/hooks/useWallet';

const useWalletDid = (lc?: BespokeLearnCard) => {
    const [dids, setDids] = useState<string[]>([]);
    const { initWallet } = useWallet();
    const getWalletDid = useCallback(async () => {
        try {
            // Use the provided wallet or initialize a new wallet
            const wallet = lc ||await initWallet();
            const defaultDid = wallet.id.did();
            const keyDid = wallet.id.did('key');

            // Set the DIDs, ensuring that only unique values are present
            setDids(defaultDid === keyDid ? [defaultDid] : [defaultDid, keyDid]);
        } catch (error) {
            console.warn('Error initializing wallet DID:', error);
        }
    }, [lc]);

    // Fetch the DIDs on component mount or whenever the dependency changes
    useEffect(() => {
        getWalletDid();
    }, [getWalletDid]);

    return {
        dids,
        getWalletDid,
    };
};

export default useWalletDid;
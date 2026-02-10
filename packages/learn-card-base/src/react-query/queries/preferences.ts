import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PreferencesType, useWallet, useIsLoggedIn } from 'learn-card-base';

export const useGetPreferencesForDid = (enabled: boolean = true) => {
    const { initWallet, getDID } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const [did, setDid] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn) return;

        const updateDid = async () => {
            try {
                const currentDid = await getDID();
                setDid(currentDid === false ? null : currentDid);
            } catch (error) {
                console.debug('Failed to get DID:', error);
                setDid(null);
            }
        };

        updateDid();
    }, [getDID, isLoggedIn]);

    return useQuery<PreferencesType>({
        queryKey: ['useGetPreferencesForDid', did],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getPreferencesForDid();
        },
        enabled: enabled && Boolean(did),
    });
};

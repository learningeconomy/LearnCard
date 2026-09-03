import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { PreferencesType, useWallet } from 'learn-card-base';

import { getLogger } from '../../logging/logger';
import currentUserStore from '../../stores/currentUserStore';
import { switchedProfileStore } from '../../stores/walletStore';
const log = getLogger('preferences');

export const useGetPreferencesForDid = (enabled: boolean = true) => {
    const { initWallet, getDID } = useWallet();
    const getDIDRef = useRef(getDID);
    getDIDRef.current = getDID;
    const currentUser = currentUserStore.useTracked.currentUser();
    const accountId = currentUser?.uid ?? null;
    const switchedDid = switchedProfileStore.use.switchedDid();
    const identityKey = accountId ? `${accountId}:${switchedDid ?? ''}` : null;
    const [resolvedIdentity, setResolvedIdentity] = useState<{
        identityKey: string;
        did: string | null;
    } | null>(null);
    const identityMatches = Boolean(identityKey && resolvedIdentity?.identityKey === identityKey);
    const did = identityMatches ? resolvedIdentity?.did ?? null : null;

    useEffect(() => {
        let cancelled = false;

        if (!identityKey) {
            setResolvedIdentity(null);
            return;
        }

        const commitIdentity = (nextDid: string | null) => {
            setResolvedIdentity(current => {
                if (current?.identityKey === identityKey && current.did === nextDid) return current;
                return { identityKey, did: nextDid };
            });
        };

        const updateDid = async () => {
            try {
                const currentDid = await getDIDRef.current();
                if (!cancelled) commitIdentity(currentDid === false ? null : currentDid);
            } catch (error) {
                log.debug('Failed to get DID:', error);
                if (!cancelled) commitIdentity(null);
            }
        };

        void updateDid();

        return () => {
            cancelled = true;
        };
    }, [identityKey]);

    const query = useQuery<PreferencesType>({
        queryKey: ['useGetPreferencesForDid', did],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getPreferencesForDid();
        },
        enabled: enabled && Boolean(did),
    });

    const isResolvingIdentity = enabled && Boolean(identityKey) && !identityMatches;

    return {
        ...query,
        data: identityMatches && did ? query.data : undefined,
        isLoading: isResolvingIdentity || query.isLoading,
        isFetched: !isResolvingIdentity && query.isFetched,
    };
};

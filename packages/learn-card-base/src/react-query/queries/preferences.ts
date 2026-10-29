import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { PreferencesType, useWallet } from 'learn-card-base';

import { getLogger } from '../../logging/logger';
import currentUserStore from '../../stores/currentUserStore';
import { switchedProfileStore, walletStore } from '../../stores/walletStore';
import { isResolvedPreferenceResponse, resolvePreferenceResponse } from '../preferences.shared';
const log = getLogger('preferences');

export const useGetPreferencesForDid = (enabled: boolean = true) => {
    const { initWallet, getDID } = useWallet();
    const getDIDRef = useRef(getDID);
    useEffect(() => {
        getDIDRef.current = getDID;
    }, [getDID]);
    const currentUser = currentUserStore.useTracked.currentUser();
    const activeWallet = walletStore.use.wallet();
    // Private-key-first sign-in does not require an auth-provider UID.
    const accountId = currentUser ? currentUser.uid || activeWallet?.id.did() || null : null;
    const switchedDid = switchedProfileStore.use.switchedDid();
    const identityKey = accountId ? `${accountId}:${switchedDid ?? ''}` : null;
    const walletReady = Boolean(activeWallet);
    const [resolvedIdentity, setResolvedIdentity] = useState<{
        identityKey: string;
        did: string | null;
    } | null>(null);
    if (!identityKey && resolvedIdentity) setResolvedIdentity(null);
    const identityMatches = Boolean(
        walletReady && identityKey && resolvedIdentity?.identityKey === identityKey
    );
    const did = identityMatches ? (resolvedIdentity?.did ?? null) : null;

    useEffect(() => {
        let cancelled = false;

        if (!identityKey || !walletReady) return;

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
    }, [identityKey, walletReady]);

    const query = useQuery<PreferencesType>({
        queryKey: ['useGetPreferencesForDid', did],
        queryFn: async () => {
            const wallet = await initWallet();
            return resolvePreferenceResponse(await wallet.invoke.getPreferencesForDid());
        },
        enabled: enabled && Boolean(did),
        structuralSharing: false,
    });

    const isResolvingIdentity = enabled && Boolean(identityKey) && !identityMatches;

    return {
        ...query,
        identityKey: identityMatches && did ? identityKey : null,
        did,
        // Persisted cache is useful for display, never sufficient to authorize
        // collection in a new observer/session before the server has answered.
        consentResolved:
            identityMatches &&
            Boolean(did) &&
            query.isFetchedAfterMount &&
            !query.isError &&
            isResolvedPreferenceResponse(query.data),
        data: identityMatches && did ? query.data : undefined,
        isLoading: isResolvingIdentity || query.isLoading,
        isFetched: !isResolvingIdentity && query.isFetched,
    };
};

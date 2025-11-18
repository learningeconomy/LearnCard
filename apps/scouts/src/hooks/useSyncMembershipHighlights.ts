import { useEffect, useMemo, useRef } from 'react';
import { useGetIDs, useGetProfile, useWallet } from 'learn-card-base';

/**
 * Syncs Troop-related ID credentials (Global Admin, National Admin, Troop Leader, Scout IDs)
 * shown on the Membership page to the user's profile.highlightedCredentials.
 *
 * - Collects up to 5 unique boost URIs from the displayed ID credentials
 * - Only updates the profile if the set differs from the current highlightedCredentials
 * - Debounced to avoid rapid repeated updates during background refetches
 */
export const useSyncMembershipHighlights = (enabled: boolean = true) => {
    const { data: ids } = useGetIDs();
    const { data: profile } = useGetProfile();

    const { initWallet } = useWallet();

    const lastSyncedRef = useRef<string>('');
    const inFlightRef = useRef(false);

    // Compute desired highlighted credential URIs (boost URIs)
    const desiredHighlights = useMemo(() => {
        if (!ids || ids.length === 0) return [] as string[];

        // useGetIDs() returns resolved VCs augmented with a uri field
        // Boost URIs are embedded on Boost credentials as vc.boostId
        const boostUris = (ids as any[])
            .map(item => (item?.boostId ?? item?.vc?.boostId) as string | undefined)
            .filter(Boolean) as string[];

        // Ensure uniqueness and max length (API enforces max 5)
        const unique = Array.from(new Set(boostUris));
        return unique.slice(0, 5);
    }, [ids]);

    // Compare arrays ignoring order
    const arraysEqual = (a: string[], b: string[]) => {
        if (a.length !== b.length) return false;
        const as = [...a].sort();
        const bs = [...b].sort();
        for (let i = 0; i < as.length; i++) if (as[i] !== bs[i]) return false;
        return true;
    };

    useEffect(() => {
        if (!enabled) return;
        if (!profile) return;
        if (!desiredHighlights) return;

        const current = profile.highlightedCredentials ?? [];

        // Avoid unnecessary updates
        if (arraysEqual(current, desiredHighlights)) return;

        // Avoid duplicate network calls
        const key = JSON.stringify(desiredHighlights);
        if (lastSyncedRef.current === key || inFlightRef.current) return;

        let timeout: any;
        timeout = setTimeout(async () => {
            try {
                inFlightRef.current = true;
                const wallet = await initWallet();
                await wallet.invoke.updateProfile({ highlightedCredentials: desiredHighlights });
                lastSyncedRef.current = key;
            } catch (e) {
                // swallow; hook should be resilient
            } finally {
                inFlightRef.current = false;
            }
        }, 500); // debounce to tolerate background list refetches

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, profile?.profileId, JSON.stringify(desiredHighlights)]);
};

export default useSyncMembershipHighlights;

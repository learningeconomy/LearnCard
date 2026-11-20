import { useEffect, useRef, useState } from 'react';

/**
 * Ownership token for the post-sign-in redirect. Every newer redirect attempt,
 * route change, auth identity change, or real unmount bumps the counter, which
 * invalidates any attempt still awaiting its dashboard prime (#2107 review).
 */
export type LoginRedirectGeneration = {
    /** Start an attempt; invalidates every earlier one. */
    begin: () => number;
    isCurrent: (generation: number) => boolean;
};

type HistoryListener = { listen: (listener: () => void) => () => void };

export const useLoginRedirectGeneration = (
    history: HistoryListener,
    /** Changes on sign-out or a different signed-in user. */
    authIdentityKey: string
): LoginRedirectGeneration => {
    const generationRef = useRef(0);
    const [generation] = useState<LoginRedirectGeneration>(() => ({
        begin: () => ++generationRef.current,
        isCurrent: value => value === generationRef.current,
    }));

    useEffect(
        () =>
            history.listen(() => {
                generationRef.current += 1;
            }),
        [history]
    );

    const identityRef = useRef(authIdentityKey);
    useEffect(() => {
        if (identityRef.current === authIdentityKey) return;
        identityRef.current = authIdentityKey;
        generationRef.current += 1;
    }, [authIdentityKey]);

    const mountedRef = useRef(false);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // StrictMode remounts effects immediately; only a real removal cancels.
            queueMicrotask(() => {
                if (!mountedRef.current) generationRef.current += 1;
            });
        };
    }, []);

    return generation;
};

/**
 * Await `prime`, then run `commit` only if `generation` still owns the redirect.
 * A cancelled attempt runs nothing, so the pending redirect stays for the newer flow.
 */
export const commitLoginRedirectIfCurrent = async (
    owner: LoginRedirectGeneration,
    generation: number,
    prime: () => Promise<void>,
    commit: () => void
): Promise<boolean> => {
    await prime();
    if (!owner.isCurrent(generation)) return false;
    commit();
    return true;
};

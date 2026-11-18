import React, { Suspense } from 'react';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';

export type LazyModalContent<P> = React.FC<P> & {
    /**
     * Start downloading the module now, without rendering it, so a later open doesn't wait on the
     * network. Safe to call often: it does nothing once a download has started or finished, and a
     * failed prefetch is forgotten, so the open still loads (and recovers) through lazyWithRetry.
     */
    prefetch: () => void;
};

/**
 * A component whose module loads the first time it renders, inside its own Suspense boundary (renders
 * nothing until then). For modal bodies that AppRouter and friends only open on a deep link or a user
 * action: importing them statically put their whole subtrees (admin tools, CLR transcript, onboarding,
 * date and phone pickers...) on the startup path.
 */
export const lazyModalContent = <P extends object>(
    factory: () => Promise<{ default: React.ComponentType<P> }>
): LazyModalContent<P> => {
    // One loader for both paths. The first render picks up an in-flight or finished prefetch instead of
    // importing again. A prefetch never retries or reloads; only an open does, through lazyWithRetry.
    let prefetched: ReturnType<typeof factory> | null = null;
    let loading = false;

    const load = (): ReturnType<typeof factory> => {
        loading = true;
        const pending = prefetched ?? factory();
        prefetched = null;
        pending.catch(() => {
            loading = false;
        });
        return pending;
    };

    const prefetch = (): void => {
        if (loading || prefetched) return;
        const attempt = factory();
        prefetched = attempt;
        attempt.catch(() => {
            if (prefetched === attempt) prefetched = null;
        });
    };

    const Lazy = lazyWithRetry(load) as unknown as React.ComponentType<P>;
    const LazyModalContent: React.FC<P> = props => (
        <Suspense fallback={null}>
            <Lazy {...props} />
        </Suspense>
    );
    return Object.assign(LazyModalContent, { prefetch });
};

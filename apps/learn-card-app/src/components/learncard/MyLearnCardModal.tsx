import { afterFirstScreen } from 'learn-card-base/helpers/firstScreen';

import { lazyModalContent } from '../generic/lazyModalContent';
import { prefetchChunk, waitForPrefetch } from '../../helpers/prefetchChunk';

// Loads on first render (opened from the dashboard avatar and deep links), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
// If the prefetch is still downloading, let it finish first so the import reads the cache
// rather than requesting the same files again in parallel.
const MyLearnCardModal = lazyModalContent(async () => {
    await waitForPrefetch('my-learncard');
    return import('./MyLearnCardModalContent');
});

/**
 * Download the My LearnCard modal's files now, so opening it doesn't wait on the network. Only
 * warms the HTTP cache; the open still does the import (see helpers/prefetchChunk.ts).
 */
export const prefetchMyLearnCard = (): void => {
    void prefetchChunk('my-learncard');
};

/**
 * Put on every control that opens My LearnCard: hovering, focusing, or starting to press it begins the
 * download, which usually finishes before the click lands.
 */
export const myLearnCardIntentHandlers = {
    onPointerEnter: prefetchMyLearnCard,
    onFocus: prefetchMyLearnCard,
    onPointerDown: prefetchMyLearnCard,
    onTouchStart: prefetchMyLearnCard,
} as const;

/**
 * Prefetch the modal once the first screen has painted and the browser is idle, so it doesn't compete
 * with startup. Returns a cancel function for effect cleanup.
 */
export const prefetchMyLearnCardWhenIdle = (): (() => void) => {
    let cancelled = false;
    afterFirstScreen()
        .then(() => {
            if (cancelled) return;
            const run = () => {
                if (!cancelled) prefetchMyLearnCard();
            };
            if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 2000 });
            else setTimeout(run, 200);
        })
        .catch(() => undefined);
    return () => {
        cancelled = true;
    };
};

export default MyLearnCardModal;

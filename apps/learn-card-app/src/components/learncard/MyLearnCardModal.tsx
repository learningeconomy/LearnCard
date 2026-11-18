import { afterFirstScreen } from 'learn-card-base/helpers/firstScreen';

import { lazyModalContent } from '../generic/lazyModalContent';

// Loads on first render (opened from the dashboard avatar and deep links), not at app start: statically importing this subtree from the
// dashboard and AppRouter put it on the startup path.
const MyLearnCardModal = lazyModalContent(() => import('./MyLearnCardModalContent'));

/** Download the My LearnCard modal now, so opening it doesn't wait on the network. */
export const prefetchMyLearnCard = (): void => MyLearnCardModal.prefetch();

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

import { useEffect } from 'react';

import type { AppContentScrollEvent } from 'learn-card-base/ui/chrome/AppContent';
import headerScrollStore from '../stores/headerScrollStore';
import { useViewWillEnter } from 'learn-card-base/ui/app-shell/AppOutlet';

/** Past this scroll offset the condensed header title swaps in (LC-1921). */
const SCROLL_THRESHOLD = 24;

/**
 * Syncs an `AppContent`'s scroll position into `headerScrollStore` so the
 * condensed header title (see `HeaderBranding`) swaps in once the page is
 * scrolled past the threshold, and resets the store when the page unmounts.
 *
 * Returns the `onIonScroll` handler — set `scrollEvents` on the AppContent:
 *
 * ```tsx
 * const onHeaderScroll = useHeaderScrollSync();
 * <AppContent scrollEvents onIonScroll={onHeaderScroll}>…</AppContent>
 * ```
 */
export const useHeaderScrollSync = () => {
    // `headerScrollStore.scrolled` is a single global flag. A page can stay
    // mounted while the URL changes (a modal route over a background page, or
    // two paths sharing one page), so the unmount cleanup below doesn't cover
    // every entry — without an enter-time reset, the condensed title could show
    // at scrollTop 0. Resetting on view enter clears it each time.
    useViewWillEnter(() => headerScrollStore.set.scrolled(false));
    useEffect(() => () => headerScrollStore.set.scrolled(false), []);

    return (event: AppContentScrollEvent) => {
        const next = event.detail.scrollTop > SCROLL_THRESHOLD;
        if (headerScrollStore.get.scrolled() !== next) {
            headerScrollStore.set.scrolled(next);
        }
    };
};

export default useHeaderScrollSync;

import { useEffect } from 'react';
import { IonContentCustomEvent, ScrollDetail } from '@ionic/core';

import headerScrollStore from '../stores/headerScrollStore';
import { useViewWillEnter } from '../components/app-shell/AppOutlet';

/** Past this scroll offset the condensed header title swaps in (LC-1921). */
const SCROLL_THRESHOLD = 24;

/**
 * Syncs an `IonContent`'s scroll position into `headerScrollStore` so the
 * condensed header title (see `HeaderBranding`) swaps in once the page is
 * scrolled past the threshold, and resets the store when the page unmounts.
 *
 * Returns the `onIonScroll` handler — spread `scrollEvents` on the IonContent:
 *
 * ```tsx
 * const onHeaderScroll = useHeaderScrollSync();
 * <IonContent scrollEvents onIonScroll={onHeaderScroll}>…</IonContent>
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

    return (event: IonContentCustomEvent<ScrollDetail>) => {
        const next = event.detail.scrollTop > SCROLL_THRESHOLD;
        if (headerScrollStore.get.scrolled() !== next) {
            headerScrollStore.set.scrolled(next);
        }
    };
};

export default useHeaderScrollSync;

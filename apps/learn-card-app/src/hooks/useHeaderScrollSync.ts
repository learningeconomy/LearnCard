import { useEffect } from 'react';
import { useIonViewWillEnter } from '@ionic/react';
import { IonContentCustomEvent, ScrollDetail } from '@ionic/core';

import headerScrollStore from '../stores/headerScrollStore';

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
    // `headerScrollStore.scrolled` is a single global flag. Ionic keeps
    // previously-visited pages mounted in the IonRouterOutlet stack, so the
    // unmount cleanup below does NOT fire on forward navigation — without an
    // enter-time reset, a page navigated to while another page left the flag
    // `true` would show its condensed title at scrollTop 0. Resetting on view
    // enter clears it every time a (possibly cached) page is re-entered.
    useIonViewWillEnter(() => headerScrollStore.set.scrolled(false));
    useEffect(() => () => headerScrollStore.set.scrolled(false), []);

    return (event: IonContentCustomEvent<ScrollDetail>) => {
        const next = event.detail.scrollTop > SCROLL_THRESHOLD;
        if (headerScrollStore.get.scrolled() !== next) {
            headerScrollStore.set.scrolled(next);
        }
    };
};

export default useHeaderScrollSync;

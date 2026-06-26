import { useEffect } from 'react';
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
    useEffect(() => () => headerScrollStore.set.scrolled(false), []);

    return (event: IonContentCustomEvent<ScrollDetail>) => {
        const next = event.detail.scrollTop > SCROLL_THRESHOLD;
        if (headerScrollStore.get.scrolled() !== next) {
            headerScrollStore.set.scrolled(next);
        }
    };
};

export default useHeaderScrollSync;

import { createStore } from '@udecode/zustood';

/**
 * Tracks whether the active page is scrolled past the header threshold (LC-1921).
 * When true, the condensed header shows the current page title instead of the brand.
 * Pages set this from their IonContent `onIonScroll`; reset to false on unmount.
 */
export const headerScrollStore = createStore('headerScrollStore')<{
    scrolled: boolean;
}>({ scrolled: false });

export default headerScrollStore;

/**
 * The platform style mode Ionic picked for this document (`ios` on iOS, `md` elsewhere).
 *
 * `setupIonicReact()` writes it to `<html mode="…">` during initialization, so the app-owned
 * shell reads the same value instead of importing Ionic. It drives the mode-specific classes
 * and timings Ionic's shell components used (`split-pane-md`, menu duration, tab-button styles).
 */
export type IonMode = 'ios' | 'md';

export const getIonMode = (): IonMode =>
    typeof document !== 'undefined' && document.documentElement.getAttribute('mode') === 'ios'
        ? 'ios'
        : 'md';

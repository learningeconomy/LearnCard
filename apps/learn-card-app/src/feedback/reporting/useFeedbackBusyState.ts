/**
 * Busy-state detection for automatic feedback triggers (LC-2086 Task 8).
 *
 * "Busy" means any open modal, an active QR scanner, or an open native
 * keyboard. Automatic feedback triggers (shake / iOS screenshot) capture
 * immediately but defer presentation while the app is busy; explicit entry
 * points (Settings / error boundary) ignore busy state entirely.
 *
 * Only modals with `open === true` count — a closing modal flips `open` to
 * false synchronously while its stack entry is removed 300ms later, and the
 * deferred prompt must be offered as soon as the surface is actually gone.
 */

import { QRCodeScannerStore, useModalsContext } from 'learn-card-base';
import keyboardStore from 'learn-card-base/stores/keyboardStore';

/** Inputs consumed by the pure busy-state gate. */
export interface FeedbackBusyStateInput {
    /** Number of modals currently in the `open === true` state. */
    openModals: number;
    /** Whether the QR code scanner overlay is active. */
    scanner: boolean;
    /** Whether the native keyboard is open. */
    keyboard: boolean;
}

/**
 * Whether an automatic feedback trigger must defer its presentation.
 * Busy when any single source is active.
 */
export const getFeedbackBusyState = ({
    openModals,
    scanner,
    keyboard,
}: FeedbackBusyStateInput): boolean => openModals > 0 || scanner || keyboard;

/**
 * Reactive busy-state adapter over the shared modal stack, scanner store, and
 * keyboard store.
 */
export const useFeedbackBusyState = (): boolean => {
    const { modals } = useModalsContext();
    const showScanner = QRCodeScannerStore.useTracked.showScanner();
    const keyboardOpen = keyboardStore.useTracked.isOpen();

    return getFeedbackBusyState({
        openModals: modals.filter(modal => modal.open === true).length,
        scanner: showScanner,
        keyboard: keyboardOpen,
    });
};

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * `useFeedbackBusyState` reads three store surfaces (modal stack, QR scanner,
 * native keyboard). The `learn-card-base` barrel cannot load under jsdom (it
 * pulls the web3auth/ethereum stack), so each source is replaced with a small
 * controllable stub. The hook logic under test — counting only `open === true`
 * modals and OR-ing the three sources — stays production code.
 */
const mocks = vi.hoisted(() => ({
    state: {
        modals: [] as Array<{ id: number; open: boolean }>,
        showScanner: false,
        keyboardOpen: false,
    },
}));

vi.mock('learn-card-base', () => ({
    useModalsContext: () => ({ modals: mocks.state.modals }),
    QRCodeScannerStore: {
        useTracked: { showScanner: () => mocks.state.showScanner },
    },
}));

vi.mock('learn-card-base/stores/keyboardStore', () => ({
    default: {
        useTracked: { isOpen: () => mocks.state.keyboardOpen },
    },
}));

import { getFeedbackBusyState, useFeedbackBusyState } from './useFeedbackBusyState';

describe('getFeedbackBusyState', () => {
    it('is busy when any modal is open', () => {
        expect(getFeedbackBusyState({ openModals: 1, scanner: false, keyboard: false })).toBe(true);
    });

    it('is busy when the QR scanner is active', () => {
        expect(getFeedbackBusyState({ openModals: 0, scanner: true, keyboard: false })).toBe(true);
    });

    it('is busy when the native keyboard is open', () => {
        expect(getFeedbackBusyState({ openModals: 0, scanner: false, keyboard: true })).toBe(true);
    });

    it('is idle when every source is inactive', () => {
        expect(getFeedbackBusyState({ openModals: 0, scanner: false, keyboard: false })).toBe(
            false
        );
    });
});

describe('useFeedbackBusyState', () => {
    beforeEach(() => {
        mocks.state.modals = [];
        mocks.state.showScanner = false;
        mocks.state.keyboardOpen = false;
    });

    it('counts only modals with open === true', () => {
        const { result, rerender } = renderHook(() => useFeedbackBusyState());

        expect(result.current).toBe(false);

        // A closing modal flips `open` to false synchronously (the stack entry
        // itself is removed 300ms later) — it must stop counting as busy
        // immediately.
        mocks.state.modals = [
            { id: 0, open: false },
            { id: 1, open: true },
        ];
        rerender();
        expect(result.current).toBe(true);

        mocks.state.modals = [
            { id: 0, open: false },
            { id: 1, open: false },
        ];
        rerender();
        expect(result.current).toBe(false);
    });

    it('is busy while the QR scanner is active', () => {
        const { result, rerender } = renderHook(() => useFeedbackBusyState());

        mocks.state.showScanner = true;
        rerender();
        expect(result.current).toBe(true);

        mocks.state.showScanner = false;
        rerender();
        expect(result.current).toBe(false);
    });

    it('is busy while the native keyboard is open', () => {
        const { result, rerender } = renderHook(() => useFeedbackBusyState());

        mocks.state.keyboardOpen = true;
        rerender();
        expect(result.current).toBe(true);

        mocks.state.keyboardOpen = false;
        rerender();
        expect(result.current).toBe(false);
    });
});

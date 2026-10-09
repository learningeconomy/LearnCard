// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    showScanner: false,
    native: true,
    start: vi.fn(),
    stop: vi.fn(),
    addListener: vi.fn(),
    remove: vi.fn(),
    closeScanner: vi.fn(),
    newModal: vi.fn(),
    initWallet: vi.fn(),
    events: {} as Record<
        string,
        (event: { barcodes: { rawValue: string }[] } | { message: string }) => void
    >,
}));
vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => mocks.native },
}));
vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
    BarcodeScanner: {
        startScan: mocks.start,
        stopScan: mocks.stop,
        addListener: mocks.addListener,
    },
    BarcodeFormat: { QrCode: 'QR_CODE' },
    LensFacing: { Back: 'BACK' },
}));
vi.mock('learn-card-base/stores/QRCodeScannerStore', () => ({
    default: {
        useTracked: { showScanner: () => mocks.showScanner },
        set: { closeScanner: mocks.closeScanner },
    },
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useModal: () => ({ newModal: mocks.newModal, closeModal: vi.fn() }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));
vi.mock('../../pages/claimBoost/ClaimBoost', () => ({ ClaimBoostModal: () => null }));
vi.mock('../../pages/addressBook/addContactView/AddContactView', () => ({
    default: () => null,
    AddContactViewMode: { requestConnection: 'request' },
}));
vi.mock('../../paraglide/messages.js', () => ({
    'scanner.eek': () => 'Something went wrong',
    'scanner.errOcurred': () => 'Please try again',
    'common.cancel': () => 'Cancel',
}));

import QRCodeScannerListener from './QRCodeScannerListener';

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(done => {
        resolve = done;
    });
    return { promise, resolve };
};

describe('native scanner session', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.showScanner = true;
        mocks.native = true;
        mocks.events = {};
        mocks.start.mockResolvedValue(undefined);
        mocks.stop.mockResolvedValue(undefined);
        mocks.remove.mockResolvedValue(undefined);
        mocks.initWallet.mockResolvedValue({});
        mocks.addListener.mockImplementation(async (event, callback) => {
            mocks.events[event] = callback;
            return { remove: mocks.remove };
        });
    });
    afterEach(async () => {
        cleanup();
        await act(async () => {});
        document.body.classList.remove('scanner-active');
    });

    it('opens the rear camera and reveals the preview after the scanner is requested', async () => {
        render(<QRCodeScannerListener />);
        await waitFor(() =>
            expect(mocks.start).toHaveBeenCalledWith({
                formats: ['QR_CODE'],
                lensFacing: 'BACK',
            })
        );
        expect(document.body.classList.contains('scanner-active')).toBe(true);
    });

    it('does not stop another camera session while idle', async () => {
        mocks.showScanner = false;
        render(<QRCodeScannerListener />);
        await act(async () => {});
        expect(mocks.start).not.toHaveBeenCalled();
        expect(mocks.stop).not.toHaveBeenCalled();
    });

    it('restores the app and shows a failure when native startup rejects', async () => {
        mocks.start.mockRejectedValue(new Error('Camera unavailable'));
        render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        expect(mocks.closeScanner).toHaveBeenCalledOnce();
        expect(mocks.stop).toHaveBeenCalledOnce();
        expect(mocks.remove).toHaveBeenCalledTimes(2);
        expect(document.body.classList.contains('scanner-active')).toBe(false);
    });

    it('handles listener registration failure without starting the camera', async () => {
        mocks.addListener.mockRejectedValue(new Error('Plugin unavailable'));
        render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        expect(mocks.start).not.toHaveBeenCalled();
        expect(mocks.closeScanner).toHaveBeenCalledOnce();
    });

    it('handles native scan errors after startup', async () => {
        render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
        await act(async () => mocks.events.scanError({ message: 'Camera failed' }));
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        expect(document.body.classList.contains('scanner-active')).toBe(false);
    });

    it('stops the camera before routing a result and ignores duplicate results', async () => {
        render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
        const result = { barcodes: [{ rawValue: 'boostUri=test&challenge=test' }] };
        await act(async () => {
            mocks.events.barcodesScanned(result);
            mocks.events.barcodesScanned(result);
        });
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        expect(mocks.initWallet).toHaveBeenCalledOnce();
        expect(mocks.stop).toHaveBeenCalledOnce();
        expect(document.body.classList.contains('scanner-active')).toBe(false);
    });

    it('waits for pending startup before stopping and reopening the camera', async () => {
        const pendingStart = deferred();
        mocks.start.mockReturnValueOnce(pendingStart.promise);
        const view = render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
        mocks.showScanner = false;
        view.rerender(<QRCodeScannerListener />);
        mocks.showScanner = true;
        view.rerender(<QRCodeScannerListener />);
        expect(mocks.stop).not.toHaveBeenCalled();
        expect(mocks.start).toHaveBeenCalledOnce();
        await act(async () => pendingStart.resolve());
        await waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(2));
        expect(mocks.stop).toHaveBeenCalledOnce();
        expect(document.body.classList.contains('scanner-active')).toBe(true);
        expect(mocks.closeScanner).not.toHaveBeenCalled();
    });

    it('restores visibility on close even if native stop fails', async () => {
        mocks.stop.mockRejectedValue(new Error('Already stopped'));
        const view = render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
        view.unmount();
        await waitFor(() => expect(document.body.classList.contains('scanner-active')).toBe(false));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });
});

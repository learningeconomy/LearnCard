// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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
    getProfile: vi.fn(),
    openBrowser: vi.fn(),
    events: {} as Record<
        string,
        (event: { barcodes: { rawValue: string }[] } | { message: string }) => void
    >,
}));
vi.mock('@capacitor/browser', () => ({ Browser: { open: mocks.openBrowser } }));
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
    'scanner.incompatibleTitle': () => 'QR code not supported',
    'scanner.incompatible': () => 'The QR code you have scanned is not compatible.',
    'common.done': () => 'Done',
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
        mocks.initWallet.mockResolvedValue({ invoke: { getProfile: mocks.getProfile } });
        mocks.openBrowser.mockResolvedValue(undefined);
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
        expect(mocks.initWallet).not.toHaveBeenCalled();
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

    const scan = async (value: string): Promise<void> => {
        render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
        await act(async () => mocks.events.barcodesScanned({ barcodes: [{ rawValue: value }] }));
    };

    it.each(['https://example.com/path?x=1#section', 'http://example.com/'])(
        'opens a website in the native browser after stopping the scanner: %s',
        async url => {
            await scan(url);
            await waitFor(() => expect(mocks.openBrowser).toHaveBeenCalledWith({ url }));
            expect(mocks.stop.mock.invocationCallOrder[0]).toBeLessThan(
                mocks.openBrowser.mock.invocationCallOrder[0]
            );
            expect(mocks.closeScanner).toHaveBeenCalledOnce();
            expect(document.body.classList.contains('scanner-active')).toBe(false);
            expect(mocks.initWallet).not.toHaveBeenCalled();
            expect(mocks.newModal).not.toHaveBeenCalled();
        }
    );

    it('trims whitespace around website URLs', async () => {
        await scan('  https://example.com/  ');
        expect(mocks.openBrowser).toHaveBeenCalledWith({ url: 'https://example.com/' });
    });

    it.each([
        'random text',
        '   ',
        'https://',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'intent://example.com',
        'mailto:person@example.com',
        'did=did:web:scoutnetwork.org',
        'boostUri=incomplete',
    ])('shows the compatibility message for unsupported content: %s', async value => {
        await scan(value);
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        render(mocks.newModal.mock.calls[0][0]);
        expect(screen.getByText('The QR code you have scanned is not compatible.')).toBeTruthy();
        expect(mocks.openBrowser).not.toHaveBeenCalled();
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });

    it('shows the compatibility message if the browser cannot open the website', async () => {
        mocks.openBrowser.mockRejectedValue(new Error('Cannot open browser'));
        await scan('https://example.com/');
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        render(mocks.newModal.mock.calls[0][0]);
        expect(screen.getByText('The QR code you have scanned is not compatible.')).toBeTruthy();
    });

    it.each([
        'https://pass.scout.org/claim?boostUri=boost%3Atest&challenge=secret',
        'boostUri=boost%3Atest&challenge=secret',
        '?challenge=secret&boostUri=boost%3Atest',
    ])('routes boost codes before the browser fallback: %s', async value => {
        await scan(value);
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        expect(mocks.newModal.mock.calls[0][0].props).toMatchObject({
            uri: 'boost:test',
            claimChallenge: 'secret',
        });
        expect(mocks.openBrowser).not.toHaveBeenCalled();
        expect(mocks.initWallet).not.toHaveBeenCalled();
    });

    it.each([
        'https://pass.scout.org/connect?did=did%3Aweb%3Ascoutnetwork.org%3Ausers%3Ascout',
        'https://pass.scout.org/connect?connect=true&did=did:web:scoutnetwork.org:users:scout',
        'did=did:web:scoutnetwork.org:users:scout',
    ])('routes profile codes before the browser fallback: %s', async value => {
        const user = { profileId: 'scout' };
        mocks.getProfile.mockResolvedValue(user);
        await scan(value);
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        expect(mocks.getProfile).toHaveBeenCalledWith('scout');
        expect(mocks.newModal.mock.calls[0][0].props).toMatchObject({ user, mode: 'request' });
        expect(mocks.openBrowser).not.toHaveBeenCalled();
    });

    it('shows the compatibility message when the profile does not exist', async () => {
        mocks.getProfile.mockResolvedValue(undefined);
        await scan('https://pass.scout.org/connect?did=did:web:scoutnetwork.org:users:missing');
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        render(mocks.newModal.mock.calls[0][0]);
        expect(screen.getByText('The QR code you have scanned is not compatible.')).toBeTruthy();
        expect(mocks.openBrowser).not.toHaveBeenCalled();
    });

    it('keeps operational failures distinct from incompatible QR codes', async () => {
        mocks.getProfile.mockRejectedValue(new Error('Network unavailable'));
        await scan('did=did:web:scoutnetwork.org:users:scout');
        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());
        render(mocks.newModal.mock.calls[0][0]);
        expect(screen.getByText('Please try again')).toBeTruthy();
        expect(mocks.openBrowser).not.toHaveBeenCalled();
    });
});

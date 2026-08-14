import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const mocks = vi.hoisted(() => {
    let showScanner = true;

    return {
        callbacks: [] as Array<(result: { barcode: { rawValue: string } }) => void>,
        listenerRemovers: [] as Mock[],
        route: vi.fn(async () => ({ kind: 'routed', surface: 'lcw-https', path: '/' })),
        startScan: vi.fn(async () => undefined),
        stopScan: vi.fn(async () => undefined),
        presentToast: vi.fn(),
        newModal: vi.fn(),
        closeModal: vi.fn(),
        getShowScanner: () => showScanner,
        setShowScanner: (value: boolean) => {
            showScanner = value;
        },
    };
});

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => true },
}));
vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
    BarcodeFormat: { QrCode: 'qr-code' },
    LensFacing: { Back: 'back' },
    BarcodeScanner: {
        addListener: vi.fn(async (_event, callback) => {
            const remove = vi.fn(async () => undefined);
            mocks.callbacks.push(callback);
            mocks.listenerRemovers.push(remove);
            return { remove };
        }),
        startScan: mocks.startScan,
        stopScan: mocks.stopScan,
    },
}));
vi.mock('@ionic/react', () => ({
    IonModal: ({ children }: React.PropsWithChildren) => <>{children}</>,
    IonContent: ({ children }: React.PropsWithChildren) => <>{children}</>,
    IonPage: ({ children }: React.PropsWithChildren) => <>{children}</>,
    IonSpinner: () => null,
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
    ToastTypeEnum: { Error: 'error' },
    useToast: () => ({ presentToast: mocks.presentToast }),
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
}));
vi.mock('learn-card-base/stores/QRCodeScannerStore', () => ({
    default: {
        useTracked: { showScanner: mocks.getShowScanner },
        set: { showScanner: mocks.setShowScanner },
    },
}));
vi.mock('../../pages/claimBoost/ClaimBoost', () => ({ default: () => null }));
vi.mock('../../pages/addressBook/addContactView/AddContactView', () => ({
    AddContactViewMode: { requestConnection: 'requestConnection' },
    default: () => null,
}));
vi.mock('../../hooks/useClaimInputRouter', () => ({
    useClaimInputRouter: () => (value: string) => mocks.route(value),
}));
vi.mock('../../paraglide/messages.js', () => ({
    'scanner.failed': () => 'Scan failed',
    'scanner.processing': () => 'Processing',
    'common.close': () => 'Close',
}));

import QRCodeScannerListener from './QRCodeScannerListener';

describe('QRCodeScannerListener', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.callbacks.length = 0;
        mocks.listenerRemovers.length = 0;
        mocks.setShowScanner(true);
    });

    it('creates a fresh owned listener for every scan session', async () => {
        const { rerender } = render(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledTimes(1));

        await act(async () => {
            mocks.callbacks[0]({ barcode: { rawValue: 'https://learncard.app/?request=first' } });
        });
        await waitFor(() =>
            expect(mocks.route).toHaveBeenCalledWith('https://learncard.app/?request=first')
        );

        rerender(<QRCodeScannerListener />);
        mocks.setShowScanner(true);
        rerender(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledTimes(2));

        await act(async () => {
            mocks.callbacks[1]({ barcode: { rawValue: 'https://learncard.app/?request=second' } });
        });
        await waitFor(() =>
            expect(mocks.route).toHaveBeenCalledWith('https://learncard.app/?request=second')
        );

        expect(mocks.listenerRemovers).toHaveLength(2);
        expect(mocks.listenerRemovers[0]).toHaveBeenCalledOnce();
        expect(mocks.listenerRemovers[1]).toHaveBeenCalledOnce();
        expect(mocks.stopScan).toHaveBeenCalledTimes(2);
    });

    it('opens a scanned boost in the shared full-screen modal', async () => {
        mocks.route.mockResolvedValueOnce({
            kind: 'open_claim_boost',
            boost: { uri: 'lc:boost:test', challenge: 'test-challenge' },
        });

        render(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.callbacks).toHaveLength(1));

        await act(async () => {
            mocks.callbacks[0]({ barcode: { rawValue: 'https://learncard.app/boost/test' } });
        });

        await waitFor(() => expect(mocks.newModal).toHaveBeenCalledOnce());

        const [content, options, modalTypes] = mocks.newModal.mock.calls[0];

        expect(content.props).toMatchObject({
            uri: 'lc:boost:test',
            claimChallenge: 'test-challenge',
            vc: null,
        });
        expect(options).toEqual({ hideButton: true });
        expect(modalTypes).toEqual({ desktop: 'fullscreen', mobile: 'fullscreen' });
    });

    it('keeps the active scan when the router function changes identity', async () => {
        const { rerender } = render(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledOnce());

        await act(async () => {
            rerender(<QRCodeScannerListener />);
        });

        expect(mocks.startScan).toHaveBeenCalledOnce();
        expect(mocks.stopScan).not.toHaveBeenCalled();
        expect(mocks.listenerRemovers[0]).not.toHaveBeenCalled();
    });

    it('does not let a cancelled session stop a newer scan', async () => {
        let resolveFirstStart: (() => void) | undefined;
        mocks.startScan.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    resolveFirstStart = resolve;
                })
        );

        const { rerender } = render(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.callbacks).toHaveLength(1));

        mocks.setShowScanner(false);
        rerender(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.stopScan).toHaveBeenCalledOnce());

        mocks.setShowScanner(true);
        rerender(<QRCodeScannerListener />);
        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledTimes(2));

        await act(async () => resolveFirstStart?.());

        expect(mocks.stopScan).toHaveBeenCalledOnce();
        expect(mocks.listenerRemovers[0]).toHaveBeenCalledOnce();
        expect(mocks.listenerRemovers[1]).not.toHaveBeenCalled();
    });

    it('waits for the previous cleanup before starting a new scan', async () => {
        let resolveListenerRemoval: (() => void) | undefined;
        const { rerender } = render(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledOnce());
        mocks.listenerRemovers[0].mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    resolveListenerRemoval = resolve;
                })
        );

        mocks.setShowScanner(false);
        rerender(<QRCodeScannerListener />);
        mocks.setShowScanner(true);
        rerender(<QRCodeScannerListener />);

        await act(async () => {});
        expect(mocks.startScan).toHaveBeenCalledOnce();
        expect(mocks.callbacks).toHaveLength(1);

        await act(async () => resolveListenerRemoval?.());

        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledTimes(2));
        expect(mocks.stopScan).toHaveBeenCalledOnce();
        expect(mocks.callbacks).toHaveLength(2);
    });

    it('stops a scan that starts after the session was cancelled', async () => {
        let resolveStart: (() => void) | undefined;
        mocks.startScan.mockImplementationOnce(
            () =>
                new Promise<void>(resolve => {
                    resolveStart = resolve;
                })
        );

        const { rerender } = render(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.callbacks).toHaveLength(1));

        mocks.setShowScanner(false);
        rerender(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.stopScan).toHaveBeenCalledTimes(1));

        await act(async () => resolveStart?.());

        await waitFor(() => expect(mocks.stopScan).toHaveBeenCalledTimes(2));
        expect(mocks.listenerRemovers[0]).toHaveBeenCalledOnce();
    });
    it('stops the scan when listener removal fails', async () => {
        const { rerender } = render(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.startScan).toHaveBeenCalledOnce());
        mocks.listenerRemovers[0].mockRejectedValueOnce(new Error('Listener removal failed'));

        mocks.setShowScanner(false);
        rerender(<QRCodeScannerListener />);

        await waitFor(() => expect(mocks.stopScan).toHaveBeenCalledOnce());
        expect(mocks.listenerRemovers[0]).toHaveBeenCalledOnce();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import QRCodeScannerStore from './QRCodeScannerStore';

describe('QRCodeScannerStore', () => {
    beforeEach(() => QRCodeScannerStore.set.closeScanner());

    it('opens a scoped scan and consumes its handler once', () => {
        const onResult = vi.fn();

        QRCodeScannerStore.set.openScanner({ onResult, mode: 'recipient' });

        expect(QRCodeScannerStore.get.showScanner()).toBe(true);
        expect(QRCodeScannerStore.get.mode()).toBe('recipient');
        expect(QRCodeScannerStore.set.consumeResultHandler()).toBe(onResult);
        expect(QRCodeScannerStore.set.consumeResultHandler()).toBeUndefined();
    });

    it('clears the scoped handler when closing the scanner', () => {
        QRCodeScannerStore.set.openScanner({ onResult: vi.fn() });
        QRCodeScannerStore.set.feedbackMessage('Found @someone');

        QRCodeScannerStore.set.closeScanner();

        expect(QRCodeScannerStore.get.showScanner()).toBe(false);
        expect(QRCodeScannerStore.get.onResult()).toBeUndefined();
        expect(QRCodeScannerStore.get.mode()).toBe('default');
        expect(QRCodeScannerStore.get.feedbackMessage()).toBeUndefined();
    });
});

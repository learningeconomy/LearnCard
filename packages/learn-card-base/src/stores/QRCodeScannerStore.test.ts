import { beforeEach, describe, expect, it, vi } from 'vitest';

import QRCodeScannerStore from './QRCodeScannerStore';

describe('QRCodeScannerStore', () => {
    beforeEach(() => QRCodeScannerStore.set.closeScanner());

    it('opens a scoped scan with its handler and mode', () => {
        const onResult = vi.fn();

        QRCodeScannerStore.set.openScanner({ onResult, mode: 'recipient' });

        expect(QRCodeScannerStore.get.showScanner()).toBe(true);
        expect(QRCodeScannerStore.get.mode()).toBe('recipient');
        expect(QRCodeScannerStore.get.onResult()).toBe(onResult);
    });

    it('clears the scoped handler when closing the scanner', () => {
        QRCodeScannerStore.set.openScanner({ onResult: vi.fn() });
        QRCodeScannerStore.set.setFeedback({ message: 'Own profile', tone: 'error' });

        QRCodeScannerStore.set.closeScanner();

        expect(QRCodeScannerStore.get.showScanner()).toBe(false);
        expect(QRCodeScannerStore.get.onResult()).toBeUndefined();
        expect(QRCodeScannerStore.get.mode()).toBe('default');
        expect(QRCodeScannerStore.get.feedbackMessage()).toBeUndefined();
        expect(QRCodeScannerStore.get.feedbackTone()).toBe('success');
    });

    it('clears feedback without closing the active scanner or dropping its handler', () => {
        const onResult = vi.fn();
        QRCodeScannerStore.set.openScanner({ onResult, mode: 'recipient' });
        QRCodeScannerStore.set.setFeedback({ message: 'Try another code', tone: 'error' });

        QRCodeScannerStore.set.clearFeedback();

        expect(QRCodeScannerStore.get.showScanner()).toBe(true);
        expect(QRCodeScannerStore.get.onResult()).toBe(onResult);
        expect(QRCodeScannerStore.get.mode()).toBe('recipient');
        expect(QRCodeScannerStore.get.feedbackMessage()).toBeUndefined();
        expect(QRCodeScannerStore.get.feedbackTone()).toBe('success');
    });
});

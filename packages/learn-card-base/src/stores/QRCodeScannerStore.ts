import { createStore } from '@udecode/zustood';

export const QRCodeScannerStore = createStore('qrCodeScannerStore')<{
    showScanner: boolean;
}>({ showScanner: false });

export const useShowScanner = QRCodeScannerStore.useTracked.showScanner;

export default QRCodeScannerStore;

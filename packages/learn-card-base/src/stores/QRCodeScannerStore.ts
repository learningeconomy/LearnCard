import { createStore } from '@udecode/zustood';

export type QRCodeScannerMode = 'default' | 'recipient';

export interface QRCodeScannerResultFeedback {
    message: string;
    durationMs?: number;
}

export type QRCodeScannerResultHandler = (
    value: string
) => void | QRCodeScannerResultFeedback | Promise<void | QRCodeScannerResultFeedback>;

export interface OpenQRCodeScannerOptions {
    onResult?: QRCodeScannerResultHandler;
    mode?: QRCodeScannerMode;
}

export const QRCodeScannerStore = createStore('qrCodeScannerStore')<{
    showScanner: boolean;
    onResult: QRCodeScannerResultHandler | undefined;
    mode: QRCodeScannerMode;
    feedbackMessage: string | undefined;
}>(
    {
        showScanner: false,
        onResult: undefined,
        mode: 'default',
        feedbackMessage: undefined,
    },
    { persist: { name: 'qrCodeScannerStore', enabled: false } }
).extendActions((set, get) => ({
    openScanner: ({ onResult, mode = 'default' }: OpenQRCodeScannerOptions = {}) => {
        set.state(state => {
            state.onResult = onResult;
            state.mode = mode;
            state.feedbackMessage = undefined;
            state.showScanner = true;
        });
    },
    closeScanner: () => {
        set.state(state => {
            state.showScanner = false;
            state.onResult = undefined;
            state.mode = 'default';
            state.feedbackMessage = undefined;
        });
    },
    consumeResultHandler: (): QRCodeScannerResultHandler | undefined => {
        const onResult = get.onResult();
        set.onResult(undefined);
        return onResult;
    },
    clearResultHandler: () => set.onResult(undefined),
}));

export const useShowScanner = QRCodeScannerStore.useTracked.showScanner;

export default QRCodeScannerStore;

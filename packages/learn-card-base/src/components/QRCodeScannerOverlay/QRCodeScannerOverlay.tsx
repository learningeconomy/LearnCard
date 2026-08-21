import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';
import { QRCodeScannerCloseButton } from './QRCodeScannerFooter';

export interface QRCodeScannerOverlayProps {
    title?: string;
    description?: string;
    frameLabel?: string;
    searchingLabel?: string;
    helperLabel?: string;
    closeLabel?: string;
}

export const QRCodeScannerOverlay: React.FC<QRCodeScannerOverlayProps> = ({
    title = 'Scan QR Code',
    description = 'Point your camera at a QR code',
    frameLabel = 'Place QR inside frame',
    searchingLabel = 'Looking for QR code…',
    helperLabel,
    closeLabel = 'Close scanner',
}) => {
    const feedbackMessage = QRCodeScannerStore.useTracked.feedbackMessage();
    const feedbackTone = QRCodeScannerStore.useTracked.feedbackTone();
    const hasErrorFeedback = Boolean(feedbackMessage && feedbackTone === 'error');

    return (
        <div
            className="fixed inset-0 z-50 grid h-full w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden font-poppins text-white qr-code-scanner-overlay"
            style={{
                paddingTop: 'var(--ion-safe-area-top, 0px)',
                paddingRight: 'var(--ion-safe-area-right, 0px)',
                paddingBottom: 'var(--ion-safe-area-bottom, 0px)',
                paddingLeft: 'var(--ion-safe-area-left, 0px)',
            }}
        >
            <header className="relative z-20 min-h-[116px] px-16 pb-3 pt-4 text-center">
                <QRCodeScannerCloseButton
                    ariaLabel={closeLabel}
                    className="absolute left-4 top-4"
                />

                <h1 className="m-0 text-xl font-semibold leading-tight text-white">{title}</h1>
                <p className="mx-auto mb-0 mt-2 max-w-xs text-sm leading-relaxed text-white/80">
                    {description}
                </p>
            </header>

            <main className="relative z-10 flex min-h-0 items-center justify-center px-6 py-3">
                <div
                    className="qr-code-scanner-target relative aspect-square max-h-full max-w-full overflow-hidden rounded-[20px]"
                    style={{ width: 'min(78vw, 43vh, 340px)' }}
                >
                    <span className="pointer-events-none absolute left-0 top-0 h-12 w-12 rounded-tl-xl border-l-[6px] border-t-[6px] border-[var(--ion-color-tertiary)]" />
                    <span className="pointer-events-none absolute right-0 top-0 h-12 w-12 rounded-tr-xl border-r-[6px] border-t-[6px] border-[var(--ion-color-tertiary)]" />
                    <span className="pointer-events-none absolute bottom-0 left-0 h-12 w-12 rounded-bl-xl border-b-[6px] border-l-[6px] border-[var(--ion-color-tertiary)]" />
                    <span className="pointer-events-none absolute bottom-0 right-0 h-12 w-12 rounded-br-xl border-b-[6px] border-r-[6px] border-[var(--ion-color-tertiary)]" />

                    {!feedbackMessage && (
                        <span
                            className="qr-code-scanner-line pointer-events-none absolute left-5 right-5 h-0.5 rounded-full"
                            aria-hidden="true"
                        />
                    )}

                    <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium text-white/90 shadow-sm backdrop-blur-sm">
                        {frameLabel}
                    </span>
                </div>
            </main>

            <footer className="relative z-20 min-h-[120px] px-6 pb-6 pt-4 text-center">
                <div
                    className="flex min-h-6 items-center justify-center gap-2 text-sm font-medium text-white"
                    role="status"
                    aria-live="polite"
                >
                    {feedbackMessage ? (
                        <IonIcon
                            icon={hasErrorFeedback ? alertCircleOutline : checkmarkCircleOutline}
                            className={`text-lg ${
                                hasErrorFeedback ? 'text-red-400' : 'text-emerald-400'
                            }`}
                            aria-hidden="true"
                        />
                    ) : (
                        <span
                            className="h-2.5 w-2.5 rounded-full bg-[var(--ion-color-tertiary)] shadow-[0_0_0_4px_rgba(var(--ion-color-tertiary-rgb),0.18)] motion-safe:animate-pulse"
                            aria-hidden="true"
                        />
                    )}
                    <span>{feedbackMessage ?? searchingLabel}</span>
                </div>

                {helperLabel && !hasErrorFeedback && (
                    <p className="mb-0 mt-2 text-xs leading-relaxed text-white/70">{helperLabel}</p>
                )}
            </footer>
        </div>
    );
};

export default QRCodeScannerOverlay;

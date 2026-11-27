import React from 'react';
import { closeOutline } from 'learn-card-base/icons/ionicons';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';
import { AppIcon } from 'learn-card-base/ui/icon';

export interface QRCodeScannerCloseButtonProps {
    ariaLabel?: string;
    className?: string;
}

export const QRCodeScannerCloseButton: React.FC<QRCodeScannerCloseButtonProps> = ({
    ariaLabel = 'Close scanner',
    className = '',
}) => {
    return (
        <button
            type="button"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-xs transition-colors hover:bg-black/60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${className}`}
            onClick={() => QRCodeScannerStore.set.closeScanner()}
            aria-label={ariaLabel}
        >
            <AppIcon icon={closeOutline} className="text-2xl" aria-hidden="true" />
        </button>
    );
};

/** @deprecated Use QRCodeScannerCloseButton for the current scanner layout. */
export const QRCodeScannerFooter = QRCodeScannerCloseButton;

export default QRCodeScannerFooter;

import React from 'react';

import { QRCodeScannerFooter } from 'learn-card-base';

export const QRCodeScannerOverlay: React.FC = () => {
    return (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center qr-code-scanner-overlay z-50">
            <div className="qr-code-scanner-square">
                <div />
            </div>

            <QRCodeScannerFooter />
        </div>
    );
};

export default QRCodeScannerOverlay;

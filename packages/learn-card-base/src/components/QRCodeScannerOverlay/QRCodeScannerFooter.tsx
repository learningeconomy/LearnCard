import React from 'react';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';

export const QRCodeScannerFooter: React.FC = () => {
    return (
        <footer className="flex items-center justify-center absolute bottom-[5%] left-0 w-full z-50">
            <button
                className="flex items-center justify-center text-center rounded-full bg-grayscale-800 w-[90%] px-[16px] py-[12px] text-xl"
                onClick={() => QRCodeScannerStore.set.showScanner(false)}
            >
                Cancel
            </button>
        </footer>
    );
};

export default QRCodeScannerFooter;

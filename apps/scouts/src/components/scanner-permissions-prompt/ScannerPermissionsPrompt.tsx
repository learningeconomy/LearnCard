import React from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import { IonRow, IonCol, IonPage } from '@ionic/react';
import ModalLayout from '../../layout/ModalLayout';
import Camera from 'learn-card-base/svgs/Camera';

import { openToS, openPP } from '../../helpers/externalLinkHelpers';

export const ScannerPermissionsPrompt: React.FC<{
    handleCloseModal: () => void;
    showScanner: () => void;
}> = ({ handleCloseModal, showScanner }) => {
    const handleScan = async () => {
        const scannerPermissions = await BarcodeScanner.checkPermissions();

        if (scannerPermissions.camera === 'granted') {
            handleCloseModal();
            showScanner();
            return;
        } else if (scannerPermissions.camera === 'denied') {
            handleCloseModal();
            BarcodeScanner.openSettings();
            return;
        } else if (scannerPermissions.camera === 'prompt') {
            const reqScannerPermissions = await BarcodeScanner.requestPermissions();

            if (reqScannerPermissions.camera === 'granted') {
                handleCloseModal();
                showScanner();
            } else if (reqScannerPermissions.camera === 'denied') {
                handleCloseModal();
            }
            return;
        } else {
            const reqScannerPermissions = await BarcodeScanner.requestPermissions();

            if (reqScannerPermissions.camera === 'granted') {
                handleCloseModal();
                showScanner();
            }
        }
    };

    return (
        <div className="mt-[10px] h-full flex flex-col items-center justify-end">
            <div className="bg-white py-6 rounded-t-3xl">
                <IonRow className="flex flex-col pb-6 pt-2 w-full">
                    <IonCol className="w-full flex items-center justify-center">
                        <h6 className="tracking-[12px] text-base font-bold text-black">
                            SCOUTPASS
                        </h6>
                    </IonCol>
                </IonRow>
                <IonRow className="w-full flex items-center justify-center">
                    <IonCol className="flex items-center justify-around w-full max-w-[600px]">
                        <div className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1">
                            <div className="absolute top-0 left-[%50] w-[70px] h-[70px] bg-rose-100 rounded-full" />
                            <Camera className="z-50 h-[50px] w-[50px]" />
                        </div>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center w-full">
                    <IonCol className="text-center">
                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                            <span className="font-bold text-grayscale-800">
                                Enable camera permissions for:
                            </span>
                            <br />
                            New connection requests, New boosts (like achievements, credentials, and
                            badges) via QR codes.
                        </p>
                        <br />
                    </IonCol>
                </IonRow>
                <IonRow className="w-full flex items-center justify-center mt-4">
                    <IonCol className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                        <button
                            onClick={async () => {
                                handleScan();
                            }}
                            type="button"
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 text-xl w-full shadow-lg max-w-[320px]"
                        >
                            Continue
                        </button>

                        <div className="w-full flex items-center justify-center m-4">
                            <button
                                onClick={() => {
                                    handleScan();
                                }}
                                className="text-grayscale-900 text-center text-base w-full font-medium"
                            >
                                Not Yet
                            </button>
                        </div>
                    </IonCol>
                </IonRow>
                <IonRow className="flex items-center justify-center mt-4 w-full">
                    <IonCol className="flex items-center justify-center w-full">
                        <button onClick={openPP} className="text-indigo-500 font-bold text-sm">
                            Privacy Policy
                        </button>
                        <span className="text-indigo-500 font-bold text-sm">&nbsp;•&nbsp;</span>
                        <button onClick={openToS} className="text-indigo-500 font-bold text-sm">
                            Terms of Service
                        </button>
                    </IonCol>
                </IonRow>
            </div>
        </div>
    );
};

export default ScannerPermissionsPrompt;

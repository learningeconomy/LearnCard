import React, { useRef } from 'react';

import { IonModal } from '@ionic/react';

import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import QrCodeUserCardModal from 'learn-card-base/components/qrcode-user-card/QRCodeUserCard';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';

import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';

export const QRCodeScannerButton: React.FC<{ branding: BrandingEnum }> = ({ branding }) => {
    const isOpen = useRef(false);
    const modal = useRef(null);

    const handleQRCodeCardModal = () => {
        if (isOpen.current) {
            isOpen.current = false;
            modal.current.dismiss();
        } else {
            isOpen.current = true;
            modal.current.present();
        }
    };

    return (
        <button
            type="button"
            name="qr-code-scanner-button"
            className="flex justify-between items-center bg-grayscale-100/40 rounded-[40px] p-0 m-0 pr-[10px] pb-[3px] pt-[3px] object-fill"
            onClick={handleQRCodeCardModal}
        >
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-12 w-12 rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl"
                customImageClass="flex justify-center items-center h-12 w-12 rounded-full overflow-hidden object-cover border-white border-solid border-2"
                customSize={120}
            />
            <section className="flex justify-center items-center h-9 w-9 ml-3 rounded-full bg-white text-black">
                <QRCodeScanner className="h-[70%]" />
            </section>
            <IonModal ref={modal} isOpen={isOpen} className="qr-code-card-modal safe--area">
                <QrCodeUserCardModal
                    handleQRCodeCardModal={handleQRCodeCardModal}
                    branding={branding}
                />
            </IonModal>
        </button>
    );
};

export default QRCodeScannerButton;

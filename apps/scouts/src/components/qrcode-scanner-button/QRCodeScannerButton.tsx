import React, { useEffect, useState } from 'react';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import {
    useCurrentUser,
    useGetProfile,
    useModal,
    ModalTypes,
    useGetConnections,
} from 'learn-card-base';
import MyScoutsModal from '../scouts/MyScoutsModal';
import QrCodeUserCardModal from '../qrcode-user-card/QRCodeUserCard';

export const QRCodeScannerButton: React.FC<{ branding: BrandingEnum }> = ({ branding }) => {
    const currentUser = useCurrentUser();
    const { data: connections } = useGetConnections();

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [photo, setPhoto] = useState<string | undefined>(currentUser?.profileImage);

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useGetProfile();

    useEffect(() => {
        if (currentLCNUser && currentLCNUser?.image) {
            setPhoto(currentLCNUser?.image);
        }
    }, []);

    const handleQrCodeClick = () => {
        newModal(
            <QrCodeUserCardModal
                branding={branding}
                history={history}
                connections={connections ?? []}
                qrOnly
            />,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return (
        <div className="flex justify-between items-center bg-grayscale-200 rounded-[40px] p-0 m-0 pr-[10px] pb-[3px] pt-[3px] object-fill">
            <button
                type="button"
                aria-label="qr-code-scanner-button"
                onClick={() => {
                    newModal(<MyScoutsModal branding={branding} />);
                }}
            >
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[48px] min-h-[48px]"
                    customImageClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[48px] min-h-[48px]"
                    customSize={500}
                    overrideSrc={photo?.length > 0}
                    overrideSrcURL={photo}
                />
            </button>
            <button
                onClick={handleQrCodeClick}
                aria-label="qr-code-scanner-button"
                className="flex justify-center items-center h-9 w-9 ml-3 rounded-full bg-white text-black"
            >
                <QRCodeScanner className="h-[70%]" />
            </button>
        </div>
    );
};

export default QRCodeScannerButton;

import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import MyLearnCardModal from '../learncard/MyLearnCardModal';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import QrCodeUserCardModal from '../qrcode-user-card/QRCodeUserCard';
import ProfilePicture from 'learn-card-base/components/profilePicture/ProfilePicture';
import AdminToolsModal from '../../pages/adminToolsPage/AdminToolsModal/AdminToolsModal';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { AdminToolOptionsEnum } from '../../pages/adminToolsPage/AdminToolsModal/admin-tools.helpers';
import { useModal, ModalTypes, usePathQuery, useGetConnections } from 'learn-card-base';

export const QRCodeScannerButton: React.FC<{ branding: BrandingEnum }> = ({ branding }) => {
    const query = usePathQuery();
    const history = useHistory();
    const { data: connections } = useGetConnections();

    const showTokenDevTools = query.get('showTokenDevTools');
    const showSigningAuthorityDevTools = query.get('showSigningAuthorityDevTools');

    const { newModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    useEffect(() => {
        if (showTokenDevTools) {
            setTimeout(() => {
                newModal(<AdminToolsModal shortCircuitDevTool={AdminToolOptionsEnum.API_TOKENS} />);
            }, 500);
        }
    }, [showTokenDevTools]);

    useEffect(() => {
        if (showSigningAuthorityDevTools) {
            setTimeout(() => {
                newModal(
                    <AdminToolsModal shortCircuitDevTool={AdminToolOptionsEnum.SIGNING_AUTHORITY} />
                );
            }, 500);
        }
    }, [showSigningAuthorityDevTools]);

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
        <div className="flex justify-between items-center bg-grayscale-100/40 rounded-[40px] p-0 m-0 pr-[10px] pb-[3px] pt-[3px] object-fill">
            <button
                type="button"
                aria-label="learn-card-modal-button"
                onClick={() => {
                    newModal(
                        <MyLearnCardModal branding={branding} />,
                        {},
                        { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                    );
                }}
            >
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[48px] min-h-[48px]"
                    customImageClass="flex justify-center items-center h-[48px] w-[48px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[48px] min-h-[48px]"
                    customSize={120}
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

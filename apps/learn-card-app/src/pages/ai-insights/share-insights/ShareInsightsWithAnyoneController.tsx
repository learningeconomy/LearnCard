import React from 'react';

import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import QRCodeUserCard from '../../../components/qrcode-user-card/QRCodeUserCard';

import { useModal, ModalTypes, useGetCurrentLCNUser } from 'learn-card-base';

export const ShareInsightsWithAnyoneController: React.FC = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { closeModal, newModal, closeAllModals } = useModal();

    const cardTitle = (
        <h1 className="text-grayscale-900 text-2xl font-semibold text-center">
            Share Insights <br />
            with <span className="text-indigo-500">anyone.</span>
        </h1>
    );

    const handleUserQRCodeCard = () => {
        const overrideShareLink = `${
            IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
        }/passport?shareInsights=true&learnerProfileId=${currentLCNUser?.profileId}`;

        newModal(
            <QRCodeUserCard
                showBackButton
                handleBackButton={() => closeModal()}
                handleClose={() => closeAllModals()}
                cardTitle={cardTitle}
                overrideShareLink={overrideShareLink}
            />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="w-full ion-padding">
            <button
                onClick={handleUserQRCodeCard}
                className="w-full bg-white rounded-[16px] flex items-center justify-between relative"
            >
                <span className="flex items-center text-grayscale-900 text-lg font-semibold">
                    <QRCodeScanner className="text-grayscale-800 h-[40px] w-[40px] min-h-[40px] min-w-[40px] mr-4" />
                    Share insights with anyone
                </span>
                <SkinnyCaretRight className="text-grayscale-400 h-[24px] w-[20px] min-h-[20px] min-w-[20px]" />
            </button>
        </div>
    );
};

export default ShareInsightsWithAnyoneController;

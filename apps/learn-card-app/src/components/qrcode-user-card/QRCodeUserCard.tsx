import React, { useEffect, useState } from 'react';
import UserQRCode from './UserQRCode/UserQRCode';
import QrCodeUserCardHeader from './QrCodeUserCardHeader';
import QrCodeUserCardBasicInfo from './QrCodeUserCardBasicInfo/QrCodeUserCardBasicInfo';
import QRCodeUserCardShareOptions from './QrCodeUserCardShareOptions/QrCodeUserCardShareOptions';

import { useWallet, useGetCurrentLCNUser } from 'learn-card-base';
import { getProfileIdFromLCNDidWeb } from 'learn-card-base/helpers/credentialHelpers';

const QrCodeUserCard: React.FC<{
    showBackButton?: boolean;
    handleBackButton?: () => void;
    handleClose?: () => void;
    cardTitle?: React.ReactNode | string | null;
    contractUri?: string;
    overrideShareLink?: string;
}> = ({
    showBackButton,
    handleBackButton,
    handleClose,
    cardTitle = null,
    contractUri,
    overrideShareLink,
}) => {
    const { initWallet } = useWallet();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const [walletDid, setWalletDid] = useState('');
    const [showCompactHeader, setShowCompactHeader] = useState(false);

    const basicInfoRef = React.useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const getWalletDid = async () => {
            const wallet = await initWallet();
            setWalletDid(wallet?.id?.did());
        };
        if (!walletDid) getWalletDid();
    }, [walletDid]);

    // Observe when basic info scrolls out of view
    useEffect(() => {
        if (!basicInfoRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // If NOT intersecting → show compact header
                setShowCompactHeader(!entry.isIntersecting);
            },
            { threshold: 0.99 }
        );

        observer.observe(basicInfoRef.current);
        return () => observer.disconnect();
    }, []);

    const profileId = currentLCNUser?.profileId || getProfileIdFromLCNDidWeb(walletDid);

    return (
        <div className="h-full w-full overflow-y-auto bg-white relative">
            <QrCodeUserCardHeader
                showCompact={showCompactHeader}
                showBackButton={showBackButton}
                handleBackButton={handleBackButton}
                handleClose={handleClose}
            />

            {cardTitle && (
                <div className="text-grayscale-900 text-lg font-semibold w-full">{cardTitle}</div>
            )}

            <div id="qr-code-user-card-screenshot" className="flex flex-col gap-2">
                <div ref={basicInfoRef}>
                    <QrCodeUserCardBasicInfo
                        profileId={profileId}
                        walletDid={walletDid}
                        contractUri={contractUri}
                        overrideShareLink={overrideShareLink}
                    />
                </div>

                <UserQRCode
                    profileId={profileId}
                    walletDid={walletDid}
                    contractUri={contractUri}
                    overrideShareLink={overrideShareLink}
                />
            </div>

            <QRCodeUserCardShareOptions
                contractUri={contractUri}
                profileId={profileId}
                overrideShareLink={overrideShareLink}
            />
        </div>
    );
};

export default QrCodeUserCard;

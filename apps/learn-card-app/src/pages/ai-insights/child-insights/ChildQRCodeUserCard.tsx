import React, { useEffect, useState } from 'react';

import UserQRCode from '../../../components/qrcode-user-card/UserQRCode/UserQRCode';
import QrCodeUserCardHeader from '../../../components/qrcode-user-card/QrCodeUserCardHeader';
import QrCodeUserCardBasicInfo from '../../../components/qrcode-user-card/QrCodeUserCardBasicInfo/QrCodeUserCardBasicInfo';
import QRCodeUserCardShareOptions from '../../../components/qrcode-user-card/QrCodeUserCardShareOptions/QrCodeUserCardShareOptions';

import { LCNProfile, LCNProfileManager } from '@learncard/types';

const ChildQRCodeUserCard: React.FC<{
    showBackButton?: boolean;
    handleBackButton?: () => void;
    handleClose?: () => void;
    cardTitle?: React.ReactNode | string | null;
    contractUri?: string;
    overrideShareLink?: string;
    childProfile?: LCNProfile;
    childProfileManager?: LCNProfileManager;
}> = ({
    showBackButton,
    handleBackButton,
    handleClose,
    cardTitle = null,
    contractUri,
    overrideShareLink,
    childProfile,
    childProfileManager,
}) => {
    const walletDid = childProfile?.did;
    const profileId = childProfile?.profileId;

    const [showCompactHeader, setShowCompactHeader] = useState(false);

    const basicInfoRef = React.useRef<HTMLDivElement | null>(null);

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

    const name = childProfileManager?.displayName || childProfile?.displayName || '';
    const image = childProfileManager?.image || childProfile?.image || '';

    return (
        <div className="h-full w-full overflow-y-auto bg-white relative">
            <QrCodeUserCardHeader
                showCompact={showCompactHeader}
                showBackButton={showBackButton}
                handleBackButton={handleBackButton}
                handleClose={handleClose}
                overrideName={name}
                overrideImage={image}
            />

            {cardTitle && (
                <div className="text-grayscale-900 text-lg font-semibold w-full">{cardTitle}</div>
            )}

            <div ref={basicInfoRef}>
                <QrCodeUserCardBasicInfo
                    profileId={profileId}
                    walletDid={walletDid}
                    contractUri={contractUri}
                    overrideShareLink={overrideShareLink}
                    overrideImage={image}
                    overrideName={name}
                />
            </div>

            <UserQRCode
                profileId={profileId}
                walletDid={walletDid}
                contractUri={contractUri}
                overrideShareLink={overrideShareLink}
            />
            <QRCodeUserCardShareOptions
                contractUri={contractUri}
                profileId={profileId}
                overrideShareLink={overrideShareLink}
            />
        </div>
    );
};

export default ChildQRCodeUserCard;

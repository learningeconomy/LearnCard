import React, { useEffect, useState } from 'react';
import UserQRCode from './UserQRCode/UserQRCode';
import QrCodeUserCardHeader from './QrCodeUserCardHeader';
import QrCodeUserCardBasicInfo from './QrCodeUserCardBasicInfo/QrCodeUserCardBasicInfo';
import QRCodeUserCardShareOptions from './QrCodeUserCardShareOptions/QrCodeUserCardShareOptions';

import { useWallet, useGetCurrentLCNUser } from 'learn-card-base';
import { getProfileIdFromLCNDidWeb } from 'learn-card-base/helpers/credentialHelpers';

const QrCodeUserCard: React.FC = () => {
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
        <>
            <div className="h-full w-full overflow-y-auto bg-white relative">
                <QrCodeUserCardHeader showCompact={showCompactHeader} />

                <div id="qr-code-user-card-screenshot" className="flex flex-col gap-2">
                    <div ref={basicInfoRef}>
                        <QrCodeUserCardBasicInfo profileId={profileId} walletDid={walletDid} />
                    </div>

                    <UserQRCode profileId={profileId} walletDid={walletDid} />
                </div>

                <QRCodeUserCardShareOptions />
            </div>
        </>
    );
};

export default QrCodeUserCard;

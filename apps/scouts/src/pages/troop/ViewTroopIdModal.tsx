import React, { useEffect, useState } from 'react';

import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import {
    useClaimCredential,
    useGetCurrentLCNUser,
    useModal,
    useResolveBoost,
} from 'learn-card-base';

import ViewTroopIdTemplate from './ViewTroopIdTemplate';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import TroopIdDetails from './TroopIdDetails/TroopIdDetails';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import X from 'learn-card-base/svgs/X';
import Lottie from 'react-lottie-player';
import HourGlass from '../../assets/lotties/hourglass.json';

import { getWallpaperBackgroundStyles } from '../../helpers/troop.helpers';
import { VC, VerificationItem } from '@learncard/types';

type ViewTroopIdModalProps = {
    credential: VC;
    boostUri: string;
    name?: string;
    image?: string;
    profileId?: string;
    useCurrentUserInfo?: boolean;
    handleShare?: () => void;

    isClaimMode?: boolean;
    isAlreadyClaimed?: boolean;
    claimCredentialUri?: string;
    onClaimSuccess?: () => Promise<void>;
    handleClaimOverride?: () => void;
    isClaimingOverride?: boolean;

    handleCloseOverride?: () => void;

    skipProofCheck?: boolean;
    className?: string;

    showCounts?: boolean;
};

const ViewTroopIdModal: React.FC<ViewTroopIdModalProps> = ({
    credential,
    boostUri,
    name,
    image,
    profileId,
    useCurrentUserInfo,
    handleShare,

    isClaimMode = false,
    isAlreadyClaimed,
    claimCredentialUri,
    onClaimSuccess,
    handleClaimOverride,
    isClaimingOverride,

    handleCloseOverride,

    skipProofCheck,
    className,

    showCounts,
}) => {
    const { closeModal } = useModal();

    const { currentLCNUser } = useGetCurrentLCNUser();
    name = useCurrentUserInfo ? currentLCNUser?.displayName : name;
    image = useCurrentUserInfo ? currentLCNUser?.image : image;

    const [showDetails, setShowDetails] = useState(false);

    const { data: resolvedCredential } = useResolveBoost(boostUri);
    credential = resolvedCredential ?? credential;

    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const { verifyCredential } = useVerifyCredential(!isClaimMode && !skipProofCheck);

    useEffect(() => {
        verifyCredential(credential, verifications => setVerificationItems(verifications));
    }, [credential]);

    const backgroundStyles = getWallpaperBackgroundStyles(undefined, credential);

    const { handleClaimCredential: _handleClaimCredential, isClaiming: _isClaiming } =
        useClaimCredential(claimCredentialUri, {
            successCallback: onClaimSuccess,
        });

    const handleClaimCredential = handleClaimOverride ?? _handleClaimCredential;
    const isClaiming = isClaimingOverride ?? _isClaiming;

    const handleClose = handleCloseOverride ?? closeModal;

    return (
        <section className={`${className} h-full w-full`} style={backgroundStyles}>
            {isClaiming && (
                <div className="absolute w-full h-full top-0 left-0 z-50 flex items-center justify-center flex-col boost-loading-wrapper">
                    <div className="w-[180px] h-full m-auto mt-[5px] flex items-center justify-center">
                        <Lottie
                            loop
                            animationData={HourGlass}
                            play
                            style={{ width: '180px', height: '180px' }}
                        />
                    </div>
                </div>
            )}
            <div className="h-full w-full overflow-y-auto">
                {!showDetails && (
                    <ViewTroopIdTemplate
                        idMainText={name}
                        idThumb={image}
                        credential={{ ...credential, boostId: boostUri }}
                        divetButton={
                            handleShare ? (
                                <button
                                    onClick={handleShare}
                                    className="bg-white rounded-full p-[10px] h-[50px] w-[50px] shadow-box-bottom"
                                >
                                    <QRCodeScanner className="text-grayscale-900" />
                                </button>
                            ) : undefined
                        }
                        isClaimMode={isClaimMode}
                        isAlreadyClaimed={isAlreadyClaimed}
                        isClaiming={isClaiming}
                        handleClaim={handleClaimCredential}
                        skipProofCheck={skipProofCheck}
                        showCounts={showCounts}
                        otherUserProfileID={profileId}
                    />
                )}

                {showDetails && (
                    <div className="max-w-[335px] mx-auto pt-[80px] pb-[120px]">
                        <TroopIdDetails
                            credential={credential}
                            verificationItems={verificationItems}
                            boostUri={boostUri}
                            profileId={profileId}
                        />
                    </div>
                )}
            </div>

            <footer className="w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white absolute bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]">
                <div className="max-w-[600px] mx-auto flex gap-[10px]">
                    {!isClaimMode && (
                        <>
                            <button
                                onClick={handleClose}
                                className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom"
                            >
                                <X className="h-[20px] w-[20px]" />
                            </button>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                            >
                                {showDetails ? 'Back' : 'Details'}
                            </button>
                            {handleShare && (
                                <button
                                    onClick={handleShare}
                                    className="bg-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center"
                                >
                                    Share
                                    <ReplyIcon />
                                </button>
                            )}
                            <button className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom">
                                <ThreeDots />
                            </button>
                        </>
                    )}
                    {isClaimMode && (
                        <>
                            <button
                                onClick={handleClose}
                                className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                            >
                                {showDetails ? 'Back' : 'Details'}
                            </button>
                        </>
                    )}
                </div>
            </footer>
        </section>
    );
};

export default ViewTroopIdModal;

import React, { useEffect, useState } from 'react';

import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import {
    useClaimCredential,
    useGetCurrentLCNUser,
    useModal,
    useResolveBoost,
} from 'learn-card-base';

import ViewIdTemplate from './ViewIdTemplate';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import IdDetails from './IdDetails/IdDetails';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import X from 'learn-card-base/svgs/X';
import Lottie from 'react-lottie-player';
const HourGlass = '/lotties/hourglass.json';

// import { getWallpaperBackgroundStyles } from '../../helpers/troop.helpers';
import { VC, VerificationItem } from '@learncard/types';

type ViewIdModalProps = {
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

    skipProofCheck?: boolean;
};

const ViewIdModal: React.FC<ViewIdModalProps> = ({
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

    skipProofCheck,
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

    // const backgroundStyles = getWallpaperBackgroundStyles(undefined, credential);
    const backgroundStyles = {};

    const { handleClaimCredential, isClaiming } = useClaimCredential(claimCredentialUri, {
        successCallback: onClaimSuccess,
    });

    return (
        <section className="h-full w-full" style={backgroundStyles}>
            {isClaiming && (
                <div className="absolute w-full h-full top-0 left-0 z-50 flex items-center justify-center flex-col boost-loading-wrapper">
                    <div className="w-[180px] h-full m-auto mt-[5px] flex items-center justify-center">
                        <Lottie
                            loop
                            path={HourGlass}
                            play
                            style={{ width: '180px', height: '180px' }}
                        />
                    </div>
                </div>
            )}
            <div className="h-full w-full overflow-y-auto">
                {!showDetails && (
                    <ViewIdTemplate
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
                    />
                )}

                {showDetails && (
                    <div className="max-w-[335px] mx-auto pt-[80px] pb-[120px]">
                        <IdDetails
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
                                onClick={closeModal}
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
                                onClick={closeModal}
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

export default ViewIdModal;

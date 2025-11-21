import React, { useState } from 'react';

import troopPageStore from '../../stores/troopPageStore';
import useGetTroopNetwork from '../../hooks/useGetTroopNetwork';
import { useGetCredentialWithEdits, useGetCurrentLCNUser } from 'learn-card-base';

import TroopID from './TroopID';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import TroopIdStatusButton, { useIsTroopIDRevokedFake } from './TroopIdStatusButton';
import TroopIdBoxQRCodeFrame from '../../components/svgs/TroopIdBoxQRCodeFrame';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import { VC } from '@learncard/types';
import { getDefaultBadgeThumbForCredential } from '../../helpers/troop.helpers';
import { insertParamsToFilestackUrl } from 'learn-card-base';

type TroopPageIdAndTroopBoxProps = {
    credential: VC;
    ownsCurrentId: boolean;
    boostUri: string;
    handleShare: () => void;
    handleShowIdDetails: () => void;
};

const TroopPageIdAndTroopBox: React.FC<TroopPageIdAndTroopBoxProps> = ({
    credential: credentialNoEdits,
    ownsCurrentId,
    boostUri,
    handleShare,
    handleShowIdDetails,
}) => {
    const [expandDescription, setExpandDescription] = useState(false);

    const currentUser = useGetCurrentLCNUser();

    const { credentialWithEdits, isError, error } = useGetCredentialWithEdits(
        credentialNoEdits,
        boostUri
    );
    const credential = credentialWithEdits ?? credentialNoEdits;

    const isRevoked = useIsTroopIDRevokedFake(credentialNoEdits, isError, error);

    const network = useGetTroopNetwork(credential);

    const description = credential?.credentialSubject?.achievement?.description;
    const networkName = network?.name;

    const MAX_DESCRIPTION_LENGTH = 168; // 4 lines = 91 @'s = roughtly 168 regular characters
    const isLongDescription = description?.length > MAX_DESCRIPTION_LENGTH;

    const getDescription = () => {
        if (isLongDescription && !expandDescription) {
            return `${description.substring(0, MAX_DESCRIPTION_LENGTH)}...`;
        }
        return description;
    };

    return (
        <div className="rounded-[20px] shadow-box-bottom overflow-hidden flex flex-col">
            {ownsCurrentId && (
                <div className="flex flex-col bg-white bg-opacity-70 backdrop-blur-[10px]">
                    <div className="p-[15px]">
                        <TroopID
                            credential={credential}
                            name={currentUser.currentLCNUser?.displayName ?? 'Unknown'}
                            thumbSrc={currentUser.currentLCNUser?.image}
                            showDetails={true}
                        />
                    </div>

                    <div className="flex justify-center relative pb-[10px]">
                        <button
                            onClick={() => {
                                if (isRevoked) return;

                                handleShare();
                            }}
                            className="bg-white rounded-full p-[10px] h-[50px] w-[50px] shadow-box-bottom"
                        >
                            <QRCodeScanner className="text-grayscale-900" />
                        </button>
                        <TroopIdBoxQRCodeFrame className="absolute bottom-0 pointer-events-none" />
                    </div>
                </div>
            )}

            <div
                className={`bg-white relative px-[20px] flex flex-col gap-[10px] ${
                    !ownsCurrentId ? 'pt-[15px] pb-[20px]' : 'pb-[10px]'
                }`}
            >
                {ownsCurrentId && (
                    <TroopIdStatusButton
                        credential={credentialNoEdits}
                        onClick={handleShowIdDetails}
                        skeletonStyles={{
                            padding: '8px 14px 8px 14px',
                            width: '100px',
                            position: 'absolute',
                            top: '-26px',
                            right: '-10px',
                        }}
                    />
                )}
                <div className="flex gap-[10px] items-center pt-[10px]">
                    {credential?.boostID?.issuerThumbnail ? (
                        <img
                            src={insertParamsToFilestackUrl(
                                credential?.boostID?.issuerThumbnail,
                                'resize=width:100/quality=value:75/'
                            )}
                            alt="logo"
                            className="h-[60px] w-[60px] rounded-full object-cover"
                        />
                    ) : (
                        getDefaultBadgeThumbForCredential(credential, 'h-[60px] w-[60px]')
                    )}
                    <div className="flex flex-col">
                        <span className="flex font-poppins text-[20px] leading-[125%] text-grayscale-900 gap-[3px] mb-[5px]">
                            {credential?.name}
                        </span>
                        {networkName && (
                            <span className="font-notoSans text-grayscale-800 font-[600] line-clamp-1 text-[14px]">
                                {networkName}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-[5px]">
                    <span className="font-notoSans text-[14px] text-grayscale-600">
                        {getDescription()}
                    </span>
                    {isLongDescription && (
                        <button
                            onClick={() => {
                                setExpandDescription(!expandDescription);
                            }}
                            className="font-notoSans text-[14px] font-[600] text-indigo-500 w-fit"
                        >
                            {!expandDescription && 'Read more'}
                            {expandDescription && 'Show less'}
                        </button>
                    )}
                    {/* <a
                        className="font-notoSans text-[14px] font-[600] text-indigo-500 w-fit"
                        href="www.girlscouts.org"
                    >
                        www.girlscouts.org
                    </a> */}
                </div>

                {ownsCurrentId && (
                    <>
                        {/* <CredentialVerificationDisplay
                            credential={credential}
                            showText
                            className="!text-[12px] mx-auto"
                            iconClassName="!h-[18px] !w-[18px]"
                        /> */}
                    </>
                )}
            </div>
        </div>
    );
};

export default TroopPageIdAndTroopBox;

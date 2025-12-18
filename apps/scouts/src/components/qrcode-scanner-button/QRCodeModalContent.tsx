import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { VC } from '../../../../../../LearnCard/packages/learn-card-types/dist';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

type QRCodeModalContentProps = {
    boostClaimLink: string;
    credential: VC;
    type: string;
    copyTroopLinkToClipBoard: () => void;
};

const QRCodeModalContent: React.FC<QRCodeModalContentProps> = ({
    boostClaimLink,
    credential,
    type,
    copyTroopLinkToClipBoard,
}) => {
    return (
        <>
            <div className="flex flex-col gap-[0.62rem]">
                <div className="p-8 flex flex-col items-center gap-4 rounded-[20px] bg-white">
                    <img
                        src={credential?.boostID?.issuerThumbnail}
                        className="rounded-full h-[50px] w-[50px] object-cover"
                    />
                    <span className="flex items-center gap-[4px] font-notoSans text-[16px] text-grayscale-900 font-semibold">
                        <CredentialVerificationDisplay
                            credential={credential}
                            iconClassName="!h-[20px] !w-[20px]"
                        />
                        {credential?.name}
                    </span>
                    <span className="font-['Noto_Sans'] text-[20px] font-semibold text-[#18224E] -mt-4">
                        {type}
                    </span>
                    <div className="flex flex-col justify-center items-center relative h-[255px] w-[255px]">
                        <QRCodeSVG
                            className="h-full w-full"
                            value={boostClaimLink}
                            data-testid="qrcode-card"
                            bgColor="transparent"
                        />
                    </div>
                </div>
            </div>
            <div className="mt-3 rounded-2xl">
                <button
                    onClick={copyTroopLinkToClipBoard}
                    className="shrink-0 w-full py-2 h-full flex items-center justify-center text-grayscale-900 text-lg bg-purple-800 rounded-[20px] shadow-bottom font-notoSans"
                >
                    <span className="mx-auto w-[90px] font-notoSans font-normal text-lg text-white">
                        Share Link
                    </span>
                </button>
            </div>
        </>
    );
};

export default QRCodeModalContent;

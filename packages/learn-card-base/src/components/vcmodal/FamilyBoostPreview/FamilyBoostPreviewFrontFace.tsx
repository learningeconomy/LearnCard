import React from 'react';

import FamilyCrest from './FamilyCrest';
import FamilyMembersList from './FamilyMembersList';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';

import { VC } from '@learncard/types';

export const FamilyBoostPreviewFrontFace: React.FC<{
    credential: VC;
    handleClaim?: () => void;
    claimStatusText?: string;
    hideFrontFaceDetails?: boolean;
}> = ({ credential, handleClaim, claimStatusText, hideFrontFaceDetails }) => {
    const thumbnail = credential?.image;
    const familyName = credential?.name;
    const familyMotto = credential?.credentialSubject?.achievement?.description;
    const emoji = credential?.display?.emoji;

    let _claimStatusText = claimStatusText;
    if (claimStatusText === 'Join') _claimStatusText = `${claimStatusText} Family`;

    return (
        <div className="w-full max-w-[600px] pb-[100px]">
            <FamilyCrest
                thumbnail={thumbnail}
                familyName={familyName}
                familyMotto={familyMotto}
                showQRCode={false}
                showEmoji={emoji?.unified}
                emoji={emoji}
            />

            <div className="bg-white ion-padding rounded-b-[20px] shadow-soft-bottom">
                {!hideFrontFaceDetails && (
                    <p className="text-grayscale-900 text-center text-[17px] font-poppins px-2 mb-2">
                        {credential?.issuer} has invited you to join the family.
                    </p>
                )}

                <FamilyMembersList credential={credential} />

                {!hideFrontFaceDetails && (
                    <button
                        onClick={handleClaim}
                        className="bg-grayscale-900 text-white font-poppins font-semibold w-full rounded-full py-2 my-2"
                    >
                        {_claimStatusText}
                    </button>
                )}

                <h3 className="flex items-center justify-center font-poppins uppercase text-xs text-blue-light font-medium mt-2 border-t-2 border-t-solid border-t-grayscale-100 pt-2">
                    <VerifiedBadge className="mr-1" /> Trusted
                </h3>
            </div>
        </div>
    );
};

export default FamilyBoostPreviewFrontFace;

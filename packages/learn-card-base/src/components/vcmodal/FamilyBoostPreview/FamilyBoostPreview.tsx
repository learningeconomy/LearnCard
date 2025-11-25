import React from 'react';

import FamilyBoostPreviewFrontFace from './FamilyBoostPreviewFrontFace';

import { VC } from '@learncard/types';
import FamilyBoostPreviewBackFace from './FamilyBoostPreviewBackFace';

export const FamilyBoostPreview: React.FC<{
    credential: VC;
    handleClaim?: () => void;
    isFront?: boolean;
    claimStatusText?: string;
    hideFrontFaceDetails?: boolean;
}> = ({
    credential,
    handleClaim,
    isFront = true,
    claimStatusText,
    hideFrontFaceDetails = false,
}) => {
    return (
        <div className="w-full flex flex-col items-center justify-start ion-padding overflow-y-scroll h-full">
            {isFront ? (
                <FamilyBoostPreviewFrontFace
                    credential={credential}
                    handleClaim={handleClaim}
                    claimStatusText={claimStatusText}
                    hideFrontFaceDetails={hideFrontFaceDetails}
                />
            ) : (
                <FamilyBoostPreviewBackFace credential={credential} />
            )}
        </div>
    );
};

export default FamilyBoostPreview;

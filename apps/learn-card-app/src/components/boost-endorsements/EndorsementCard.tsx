import React from 'react';

import EndorsementButton from './EndorsementButton';
import EndorsementsList from './EndorsementsList/EndorsementsList';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';

import {
    CredentialCategoryEnum,
    useGetCurrentLCNUser,
    useGetVCInfo,
    useIsLoggedIn,
} from 'learn-card-base';

import { VC } from '@learncard/types';
import { hasEndorsedCredential } from 'learn-card-base/helpers/credentialHelpers';

export const EndorsementCard: React.FC<{
    credential: VC;
    categoryType: CredentialCategoryEnum;
    existingEndorsements?: VC[];
}> = ({ credential, categoryType, existingEndorsements = [] }) => {
    const isLoggedIn = useIsLoggedIn();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const {
        achievementType,
        title,
        badgeThumbnail,
        backgroundImage,
        backgroundColor,
        displayType,
        isCurrentUserSubject,
    } = useGetVCInfo(credential, categoryType);

    const isAwardDisplay = displayType === 'award';
    const isCertDisplayType = displayType === 'certificate';
    const isMeritBadge = displayType === 'meritBadge';

    const categoryTypeString = categoryType as CredentialCategoryEnum;

    const hasEndorsed =
        currentLCNUser?.did && existingEndorsements?.length > 0
            ? hasEndorsedCredential(existingEndorsements, currentLCNUser?.did)
            : false;

    if (hasEndorsed || !isLoggedIn) return <></>;

    return isCurrentUserSubject ? (
        <div className="py-4 pr-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4">
            <div className="flex items-center w-full">
                <CredentialBadge
                    achievementType={achievementType}
                    fallbackCircleText={title}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail as string}
                    backgroundImage={backgroundImage as string}
                    backgroundColor={backgroundColor as string}
                    badgeContainerCustomClass={
                        isCertDisplayType || isAwardDisplay || isMeritBadge
                            ? 'hidden'
                            : 'mt-[0px] mb-[8px]'
                    }
                    badgeCircleCustomClass={`!w-[80px] h-[80px] mt-1 ${
                        isAwardDisplay || isMeritBadge ? 'mt-[17px]' : 'shadow-3xl'
                    }`}
                    badgeRibbonContainerCustomClass="left-[31%] bottom-[-40%]"
                    badgeRibbonCustomClass="w-[26px]"
                    badgeRibbonIconCustomClass="w-[70%] mt-[4px]"
                    displayType={displayType}
                    credential={credential}
                    hideMediaBadge
                />

                <div className="flex items-start">
                    <p className="text-sm text-grayscale-900 text-left">
                        Send a request to someone who can vouch for your {categoryTypeString},{' '}
                        <span className="font-semibold">{title}</span>.
                    </p>
                </div>
            </div>

            <div className="flex items-center w-full pl-4">
                <EndorsementButton credential={credential} categoryType={categoryType} />
            </div>
        </div>
    ) : null;
};

export default EndorsementCard;

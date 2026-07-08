import React from 'react';

import EndorsementButton from './EndorsementButton';
import { IDsIconSolid } from 'learn-card-base/svgs/wallet/IDsIcon';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';

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
    const { title, badgeThumbnail, achievementType, displayType, isCurrentUserSubject } =
        useGetVCInfo(credential, categoryType);

    const categoryTypeString = categoryType as CredentialCategoryEnum;

    const hasEndorsed =
        currentLCNUser?.did && existingEndorsements?.length > 0
            ? hasEndorsedCredential(existingEndorsements, currentLCNUser?.did)
            : false;

    if (hasEndorsed || !isLoggedIn) return <></>;

    const isIDCategory = categoryType === CredentialCategoryEnum.id;

    return isCurrentUserSubject ? (
        <div className="py-4 pr-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4">
            <div className="flex items-center w-full">
                {isIDCategory ? (
                    <div className="ml-2 mr-2 flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full border-[4px] border-white bg-grayscale-100 shadow-sm">
                        <IDsIconSolid className="h-[34px] w-[34px] text-grayscale-800" />
                    </div>
                ) : (
                    <div className="mr-3 shrink-0">
                        <CredentialBadgeNew
                            achievementType={achievementType}
                            fallbackCircleText={title}
                            boostType={categoryType}
                            badgeThumbnail={badgeThumbnail}
                            badgeCircleCustomClass="!w-[80px] h-[80px] mt-1 shadow-3xl"
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            displayType={displayType}
                            credential={credential}
                            hideMediaBadge
                        />
                    </div>
                )}

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

import React from 'react';

import EndorsementButton from './EndorsementButton';
import { IDsIconSolid } from 'learn-card-base/svgs/wallet/IDsIcon';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';

import {
    BoostCategoryOptionsEnum,
    CredentialCategoryEnum,
    getBoostMetadata,
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
    const isCertificateDisplayType = displayType === 'certificate';
    const isAwardDisplayType = displayType === 'award';
    const isMediaDisplayType = displayType === 'media';
    const isMeritStyleBadge =
        isAwardDisplayType || categoryType === CredentialCategoryEnum.meritBadge;
    const badgeScaleClass = isCertificateDisplayType
        ? 'w-[120px] min-w-[120px] scale-[0.7]'
        : isMeritStyleBadge
        ? 'w-[138px] min-w-[138px] scale-[0.8]'
        : 'w-full';

    const categoryMeta = getBoostMetadata(
        (categoryType as unknown as BoostCategoryOptionsEnum) ??
            BoostCategoryOptionsEnum.socialBadge
    );
    const CategoryIcon = categoryMeta?.SolidIconComponent ?? categoryMeta?.IconComponent;
    const categoryCircleColor = categoryMeta?.badgeBackgroundColor ?? 'gray-500';

    const renderCredentialBadge = () => {
        if (isIDCategory) {
            return (
                <div className="w-[90px] h-[90px] min-w-[90px] min-h-[90px] rounded-full bg-blue-400 border-4 border-solid border-white flex items-center justify-center overflow-hidden">
                    {badgeThumbnail ? (
                        <img
                            src={badgeThumbnail}
                            alt=""
                            className="w-[70%] h-[70%] rounded-full object-cover border-4 border-solid border-white"
                        />
                    ) : (
                        <IDsIconSolid className="w-[36px] h-[36px] text-white" />
                    )}
                </div>
            );
        }

        if (isMediaDisplayType) {
            return (
                <div
                    className={`w-[90px] h-[90px] min-w-[90px] min-h-[90px] rounded-full border-4 border-solid border-white flex items-center justify-center overflow-hidden bg-${categoryCircleColor}`}
                >
                    <div className="w-[70%] h-[70%] rounded-full border-4 border-solid border-white flex items-center justify-center">
                        {CategoryIcon && <CategoryIcon className="w-[32px] h-[32px] text-white" />}
                    </div>
                </div>
            );
        }

        return (
            <div className="w-[90px] h-[90px] min-w-[90px] min-h-[90px] flex items-center justify-center">
                <div
                    className={`flex flex-col items-center justify-center shrink-0 ${badgeScaleClass}`}
                >
                    <CredentialBadgeNew
                        credential={undefined as never}
                        achievementType={achievementType}
                        fallbackCircleText={title}
                        boostType={categoryType as unknown as BoostCategoryOptionsEnum}
                        badgeThumbnail={badgeThumbnail || ''}
                        showBackgroundImage={false}
                        backgroundImage=""
                        backgroundColor=""
                        badgeCircleCustomClass="!w-[90px] h-[90px]"
                        badgeContainerCustomClass="notification-cred-badge mt-[0px] mb-[0px]"
                        badgeRibbonContainerCustomClass="notification-cred-badge-ribbon my-[0px]"
                        displayType={displayType}
                    />
                </div>
            </div>
        );
    };

    return isCurrentUserSubject ? (
        <div className="py-4 pr-4 gap-4 bg-white flex flex-col items-start rounded-[20px] w-full shadow-bottom-2-4">
            <div className="flex items-center w-full">
                <div className="ml-2 mr-3 shrink-0">{renderCredentialBadge()}</div>

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

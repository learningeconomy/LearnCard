import React from 'react';
import {
    BoostUserTypeEnum,
    CredentialCategory,
    CredentialCategoryEnum,
    useModal,
} from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import { useLCAStylesPackRegistry } from 'learn-card-base/hooks/useRegistry';
import { getDefaultAchievementTypeImage, getDefaultDisplayType } from '../boostHelpers';
import { boostCategoryOptions } from '../boost-options/boostOptions';
import { BoostCMSAppearanceDisplayTypeEnum } from '../boost';
import { getAchievementTypeDisplayText } from 'learn-card-base/helpers/credentialHelpers';
import CredentialGeneralPlus from '../../svgs/CredentialGeneralPlus';

type LearnCardTemplateListItemProps = {
    categoryType: CredentialCategory;
    userToBoostProfileId?: string;
    subType?: string;
};

const LearnCardTemplateListItem: React.FC<LearnCardTemplateListItemProps> = ({
    categoryType,
    userToBoostProfileId,
    subType,
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();

    const baseLink = `/boost?boostUserType=${BoostUserTypeEnum.someone}&boostCategoryType=${categoryType}&boostSubCategoryType=${subType}`;
    let link = baseLink;
    if (userToBoostProfileId) {
        link = `${baseLink}&otherUserProfileId=${userToBoostProfileId}`;
    }

    const { data: boostAppearanceBadgeList, isLoading: stylePackLoading } =
        useLCAStylesPackRegistry();

    const badgeThumbnail = getDefaultAchievementTypeImage(
        categoryType,
        subType,
        boostCategoryOptions[categoryType]?.CategoryImage,
        boostAppearanceBadgeList
    );

    const displayType: BoostCMSAppearanceDisplayTypeEnum = getDefaultDisplayType(categoryType);

    const categoryColors = {
        [CredentialCategoryEnum.learningHistory]: 'emerald-700',
        [CredentialCategoryEnum.socialBadge]: 'cyan-700',
        [CredentialCategoryEnum.achievement]: 'pink-400',
        [CredentialCategoryEnum.accomplishment]: 'yellow-400',
        [CredentialCategoryEnum.workHistory]: 'cyan-400',
        [CredentialCategoryEnum.accommodation]: 'violet-400',
        [CredentialCategoryEnum.id]: 'teal-500',
        [CredentialCategoryEnum.membership]: 'teal-400',
    };
    const textColor = categoryColors[categoryType];

    const bgColors = {
        [CredentialCategoryEnum.learningHistory]: 'bg-emerald-700',
        [CredentialCategoryEnum.socialBadge]: 'bg-blue-400',
        [CredentialCategoryEnum.achievement]: 'bg-pink-400',
        [CredentialCategoryEnum.accomplishment]: 'bg-yellow-400',
        [CredentialCategoryEnum.workHistory]: 'bg-cyan-400',
        [CredentialCategoryEnum.accommodation]: 'bg-violet-400',
        [CredentialCategoryEnum.id]: 'bg-blue-500',
        [CredentialCategoryEnum.membership]: 'bg-teal-400',
    };

    const achievementTypeDisplay = getAchievementTypeDisplayText(subType, categoryType);
    const { color } = boostCategoryOptions[categoryType];

    return (
        <div
            // role="button"
            onClick={e => {
                e.stopPropagation();
                closeAllModals();
                history.push(link);
            }}
            className="flex items-center gap-[10px] w-full p-[10px] rounded-[15px] bg-white shadow-bottom-2-4"
        >
            <img src={badgeThumbnail} className="rounded-full object-cover h-[40px] w-[40px]" />
            <div className="flex flex-col font-poppins">
                <h3 className="text-[16.5px] font-[600] text-grayscale-900 line-clamp-1">
                    {achievementTypeDisplay}
                </h3>
                <p className="text-[13.5px] font-[600] text-grayscale-700 line-clamp-1">
                    LearnCard Template
                </p>
            </div>
            <button
                onClick={e => {
                    e.stopPropagation();
                    closeAllModals();
                    history.push(link);
                }}
                className={`ml-auto bg-${color} p-[5px] rounded-full text-${color}`}
            >
                <CredentialGeneralPlus className="h-[30px] w-[30px]" plusColor="currentColor" />
            </button>
        </div>
    );
};

export default LearnCardTemplateListItem;

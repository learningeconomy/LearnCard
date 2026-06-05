import React from 'react';
import { IonSpinner } from '@ionic/react';

import * as m from '../../paraglide/messages.js';

import DotIcon from 'learn-card-base/svgs/DotIcon';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';

import { conditionalPluralize, CredentialCategoryEnum } from 'learn-card-base';

import { useTheme } from '../../theme/hooks/useTheme';

/**
 * CredentialCategoryEnum → wallet.categories.* translation lookup.
 * Mirrors the map in WalletPageSquare.tsx; lets the list-view Passport
 * tile read the same translated title as the grid-view square.
 */
const CATEGORY_TITLE: Partial<Record<CredentialCategoryEnum, () => string>> = {
    [CredentialCategoryEnum.aiTopic]: m['wallet.categories.aiSessions'],
    [CredentialCategoryEnum.aiPathway]: m['wallet.categories.aiPathways'],
    [CredentialCategoryEnum.aiInsight]: m['wallet.categories.aiInsights'],
    [CredentialCategoryEnum.skill]: m['wallet.categories.skills'],
    [CredentialCategoryEnum.socialBadge]: m['wallet.categories.socialBadges'],
    [CredentialCategoryEnum.achievement]: m['wallet.categories.achievements'],
    [CredentialCategoryEnum.learningHistory]: m['wallet.categories.studies'],
    [CredentialCategoryEnum.accomplishment]: m['wallet.categories.portfolio'],
    [CredentialCategoryEnum.accommodation]: m['wallet.categories.assistance'],
    [CredentialCategoryEnum.workHistory]: m['wallet.categories.experiences'],
    [CredentialCategoryEnum.family]: m['wallet.categories.families'],
    [CredentialCategoryEnum.id]: m['wallet.categories.ids'],
};

type WalletPageListItemProps = {
    handleItemClick: (categoryType: CredentialCategoryEnum) => void;
    walletPageItem: {
        categoryId: CredentialCategoryEnum;
        labels: { singular: string; plural: string };
    };
    count: number;
    showNewItemIndicator?: boolean;
    loading?: boolean;
};

const WalletPageListItem: React.FC<WalletPageListItemProps> = ({
    handleItemClick,
    walletPageItem,
    count,
    showNewItemIndicator,
    loading,
}) => {
    const { categoryId: categoryType } = walletPageItem;
    const { getThemedCategory, colors: themeColors } = useTheme();
    const { icons, colors } = getThemedCategory(categoryType);
    const { IconWithShape, Icon } = icons;
    const { primaryColor, indicatorColor, borderColor } = colors;

    const passportCardBgColor = themeColors?.defaults?.passportCardBgColor;
    const passportCardTextColor = themeColors?.defaults?.passportCardTextColor;

    let countDisplay: React.ReactNode | null = (
        <p className={`font-poppins text-[14px] ${passportCardTextColor ?? 'text-grayscale-900'}`}>
            {loading ? (
                <div className="flex items-center gap-[5px]">
                    <IonSpinner name="crescent" className="h-[14px] w-[14px]" /> Items
                </div>
            ) : (
                conditionalPluralize(count, 'Item')
            )}
        </p>
    );

    if (
        categoryType === CredentialCategoryEnum.aiInsight ||
        categoryType === CredentialCategoryEnum.aiPathway
    ) {
        countDisplay = null;
    }

    return (
        <div
            role="button"
            onClick={() => handleItemClick(categoryType)}
            className={`flex gap-[10px] w-full rounded-[15px] p-[10px] shadow-bottom-2-6 border-[3px] border-white ${!passportCardBgColor ? `bg-${primaryColor}` : ''}`}
            style={passportCardBgColor ? { backgroundColor: passportCardBgColor } : undefined}
        >
            <div className="flex items-center justify-center relative">
                {IconWithShape ? (
                    <IconWithShape className="w-[40px] h-[40px]" />
                ) : (
                    <Icon className="w-[40px] h-[40px]" />
                )}
            </div>

            <div className="flex flex-col items-start justify-center">
                <p className={`font-poppins text-[17px] font-[600] leading-[130%] ${passportCardTextColor ?? 'text-grayscale-900'}`}>
                    {CATEGORY_TITLE[walletPageItem.categoryId]?.() ?? walletPageItem.labels.plural}
                </p>
                {countDisplay}
            </div>

            <div className="ml-auto flex items-center gap-[5px]">
                {showNewItemIndicator && (
                    <div className={`border-2 rounded-full border-solid border-${borderColor}`}>
                        <DotIcon className={`text-${indicatorColor}`} />
                    </div>
                )}
                <SkinnyCaretRight className="w-[20px] h-[20px]" />
            </div>
        </div>
    );
};

export default WalletPageListItem;

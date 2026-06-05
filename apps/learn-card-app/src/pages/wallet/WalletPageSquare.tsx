import React from 'react';
import numeral from 'numeral';
import { useTranslation } from 'react-i18next';

import DotIcon from 'learn-card-base/svgs/DotIcon';

import { CredentialCategoryEnum } from 'learn-card-base';
import { IonSkeletonText, IonSpinner } from '@ionic/react';

import { useTheme } from '../../theme/hooks/useTheme';
import { StyleSetEnum } from '../../theme/styles';

/**
 * Maps each CredentialCategoryEnum value to the wallet.categories.* translation
 * key + EN fallback string for use with t(). Mirrors the Paraglide branch's
 * CATEGORY_TITLE map. Lets us render the Passport tile title in the active
 * locale instead of the hardcoded EN string in DEFAULT_CATEGORIES'
 * `labels.plural`. Falls back to walletPageItem.labels.plural for any
 * category not in this map (custom-theme categories, etc.).
 */
const CATEGORY_TITLE_KEY: Partial<Record<CredentialCategoryEnum, [string, string]>> = {
    [CredentialCategoryEnum.aiTopic]: ['wallet.categories.aiSessions', 'AI Sessions'],
    [CredentialCategoryEnum.aiPathway]: ['wallet.categories.aiPathways', 'AI Pathways'],
    [CredentialCategoryEnum.aiInsight]: ['wallet.categories.aiInsights', 'AI Insights'],
    [CredentialCategoryEnum.skill]: ['wallet.categories.skills', 'Skills'],
    [CredentialCategoryEnum.socialBadge]: ['wallet.categories.socialBadges', 'Boosts'],
    [CredentialCategoryEnum.achievement]: ['wallet.categories.achievements', 'Achievements'],
    [CredentialCategoryEnum.learningHistory]: ['wallet.categories.studies', 'Studies'],
    [CredentialCategoryEnum.accomplishment]: ['wallet.categories.portfolio', 'Portfolio'],
    [CredentialCategoryEnum.accommodation]: ['wallet.categories.assistance', 'Assistance'],
    [CredentialCategoryEnum.workHistory]: ['wallet.categories.experiences', 'Experiences'],
    [CredentialCategoryEnum.family]: ['wallet.categories.families', 'Families'],
    [CredentialCategoryEnum.id]: ['wallet.categories.ids', 'IDs'],
};
interface WalletPageSquareProps {
    handleClickSquare: (subtype: CredentialCategoryEnum) => void;
    walletPageItem: {
        categoryId: CredentialCategoryEnum;
        labels: { singular: string; plural: string };
    };
    count: number;
    showNewItemIndicator?: boolean;
    loading?: boolean;
}

const WalletPageSquare: React.FC<WalletPageSquareProps> = ({
    handleClickSquare,
    walletPageItem,
    count,
    showNewItemIndicator,
    loading,
}) => {
    const { t } = useTranslation();
    const { categoryId: categoryType } = walletPageItem;
    const { getThemedCategory, getStyleSet, colors: themeColors } = useTheme();
    const { icons, colors } = getThemedCategory(categoryType);

    const { IconWithShape, Icon } = icons;
    const { primaryColor, secondaryColor, indicatorColor, borderColor } = colors;

    const passportCardBgColor = themeColors?.defaults?.passportCardBgColor;
    const passportCardTextColor = themeColors?.defaults?.passportCardTextColor;

    let metaData: React.ReactNode | null = (
        <p className="text-white font-poppins font-semibold text-base">
            {numeral(count).format('0a')}
        </p>
    );

    let metaDataContainerStyles = 'w-[50px]';

    if (
        categoryType === CredentialCategoryEnum.aiInsight ||
        categoryType === CredentialCategoryEnum.aiPathway
    ) {
        metaData = <p className="text-white font-poppins font-semibold text-base">{t('passport.explore', 'Explore')}</p>;
        metaDataContainerStyles = 'w-[80px]';
    }

    let cardStyles = 'pt-8';
    if (
        categoryType === CredentialCategoryEnum.aiInsight ||
        categoryType === CredentialCategoryEnum.accommodation ||
        categoryType === CredentialCategoryEnum.id
    ) {
        cardStyles = 'pt-6';
    }

    const styles = getStyleSet(StyleSetEnum.wallet);

    return (
        <div
            key={walletPageItem.categoryId}
            className="w-full flex items-center justify-center flex-1"
            role="button"
            onClick={() => handleClickSquare(categoryType)}
        >
            <div
                className={`w-[160px] flex-1 rounded-[25px] shadow-bottom-2-6 px-4 pb-6  flex flex-col items-center justify-between border-[3px] border-white ${cardStyles} ${!passportCardBgColor ? `bg-${primaryColor}` : ''} ${styles?.cardStyles}`}
                style={passportCardBgColor ? { backgroundColor: passportCardBgColor } : undefined}
            >
                <div className="w-full flex items-center justify-center relative">
                    {IconWithShape ? (
                        <IconWithShape className={styles?.iconStyles} />
                    ) : (
                        <Icon className={styles?.iconStyles} />
                    )}
                </div>

                <div className="w-full flex items-center justify-center flex-col relative">
                    <p className={`font-poppins text-[18px] font-[600] xs:text-[14px] text-center ${passportCardTextColor ?? 'text-grayscale-900'}`}>
                        {CATEGORY_TITLE_KEY[categoryType]
                            ? t(...CATEGORY_TITLE_KEY[categoryType]!)
                            : walletPageItem.labels.plural}
                    </p>
                    {/* TODO: ADD SKELETON LOADER HERE ... i want the skeleton loader to retain the same width and height as the div + color but with a skeleton loader */}
                    <div
                        className={`flex items-center justify-center rounded-full mt-1 relative h-[30px] bg-${secondaryColor} ${metaDataContainerStyles}`}
                    >
                        {showNewItemIndicator && (
                            <div
                                className={`absolute top-[-3px] right-[-3px] border-2 rounded-full border-solid z-10 border-${borderColor}`}
                            >
                                <DotIcon className={`text-${indicatorColor}`} />
                            </div>
                        )}
                        {loading ? (
                            <div className="relative w-full h-full rounded-full overflow-hidden">
                                <IonSkeletonText className="h-full m-0" animated />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <IonSpinner name="crescent" className="text-white h-5 w-5" />
                                </div>
                            </div>
                        ) : (
                            metaData
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPageSquare;

import React from 'react';
import numeral from 'numeral';

import DotIcon from 'learn-card-base/svgs/DotIcon';

import { CredentialCategoryEnum } from 'learn-card-base';
import { IonSkeletonText, IonSpinner } from '@ionic/react';

import { useTheme } from '../../theme/hooks/useTheme';
import { StyleSetEnum } from '../../theme/styles';
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
    const { categoryId: categoryType } = walletPageItem;
    const { getThemedCategory, getStyleSet } = useTheme();
    const { icons, colors } = getThemedCategory(categoryType);

    const { IconWithShape, Icon } = icons;
    const { primaryColor, secondaryColor, indicatorColor, borderColor } = colors;

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
                className={`w-[160px] flex-1 rounded-[25px] shadow-bottom-2-6 px-4 pb-6  flex flex-col items-center justify-between border-[3px] border-white ${cardStyles} bg-${primaryColor} ${styles?.cardStyles}`}
            >
                <div className="w-full flex items-center justify-center relative">
                    {IconWithShape ? (
                        <IconWithShape className={styles?.iconStyles} />
                    ) : (
                        <Icon className={styles?.iconStyles} />
                    )}
                </div>

                <div className="w-full flex items-center justify-center flex-col relative">
                    <p className="font-poppins text-[18px] font-[600] text-grayscale-900 xs:text-[14px] text-center">
                        {walletPageItem.labels.plural}
                    </p>
                    {/* TODO: ADD SKELETON LOADER HERE ... i want the skeleton loader to retain the same width and height as the div + color but with a skeleton loader */}
                    <div
                        className={`w-[50px] h-[30px] flex items-center justify-center rounded-full mt-1 relative bg-${secondaryColor}`}
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
                            <p className="text-white font-poppins font-semibold text-base">
                                {numeral(count).format('0a')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletPageSquare;

import React from 'react';
import { IonSpinner } from '@ionic/react';

import DotIcon from 'learn-card-base/svgs/DotIcon';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';

import { conditionalPluralize, CredentialCategoryEnum } from 'learn-card-base';

import { useTheme } from '../../theme/hooks/useTheme';

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
    const { getThemedCategory } = useTheme();
    const { icons, colors } = getThemedCategory(categoryType);
    const { IconWithShape, Icon } = icons;
    const { primaryColor, indicatorColor, borderColor } = colors;

    return (
        <div
            role="button"
            onClick={() => handleItemClick(categoryType)}
            className={`flex gap-[10px] w-full rounded-[15px] p-[10px] shadow-bottom-2-6 border-[3px] border-white bg-${primaryColor}`}
        >
            <div className="flex items-center justify-center relative">
                {IconWithShape ? (
                    <IconWithShape className="w-[40px] h-[40px]" />
                ) : (
                    <Icon className="w-[40px] h-[40px]" />
                )}
            </div>

            <div className="flex flex-col">
                <p className="font-poppins text-[17px] font-[600] leading-[130%] text-grayscale-900">
                    {walletPageItem.labels.plural}
                </p>
                <p className="font-poppins text-[14px] text-grayscale-900">
                    {loading ? (
                        <div className="flex items-center gap-[5px]">
                            <IonSpinner name="crescent" className="h-[14px] w-[14px]" /> Items
                        </div>
                    ) : (
                        conditionalPluralize(count, 'Item')
                    )}
                </p>
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

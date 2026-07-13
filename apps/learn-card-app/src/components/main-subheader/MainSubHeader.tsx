import React from 'react';

import { IonRow, IonCol, useIonModal, IonSpinner } from '@ionic/react';

import AiPassportPersonalizationContainer from '../../components/ai-passport/AiPassportPersonalizationContainer';
import CategoryDescriptorModal from '../category-descriptor/CategoryDescriptorModal';

import { CredentialCategoryEnum, useModal, ModalTypes } from 'learn-card-base';
import { SubheaderTypeEnum, SubheaderContentType } from './MainSubHeader.types';

import useTheme from '../../theme/hooks/useTheme';
import newCredsStore from 'learn-card-base/stores/newCredsStore';
import { usePersonalizationQA } from '../ai-passport/usePersonalizationQA';
import NewCredentialsPill from './NewCredentialsPill';

const formatCount = (count: number | string): string => {
    if (typeof count === 'string') return count;
    if (count < 1000) return count.toString();
    const formatted = count / 1000;
    return `${formatted.toFixed(1)}k`;
};

type MainSubHeaderProps = {
    category?: CredentialCategoryEnum;
    subheaderType: SubheaderTypeEnum;
    hidePlusBtn?: boolean;
    plusButtonOverride?: React.ReactNode;
    count?: number;
    countLoading?: boolean;
};

export const MainSubHeader: React.FC<MainSubHeaderProps> = ({
    category,
    subheaderType = SubheaderTypeEnum.Achievement,
    hidePlusBtn = false,
    plusButtonOverride,
    count,
    countLoading,
}) => {
    const { newModal } = useModal();
    const { completionPercentage } = usePersonalizationQA();
    const { getThemedCategoryColors, getThemedCategoryIcons, theme } = useTheme();
    const colors = getThemedCategoryColors(category as CredentialCategoryEnum);
    const { Icon } = getThemedCategoryIcons(category as CredentialCategoryEnum);

    const newCreds = newCredsStore.use.newCreds();
    const newCredsForCategory = newCreds?.[category as CredentialCategoryEnum] ?? [];
    const newCredsCount = newCredsForCategory?.length ?? 0;

    const { labels } = theme?.categories.find(c => c.categoryId === category) || {};
    const { headerTextColor, helperTextColor } = colors;

    const { iconPadding, helperText, helperTextClickable, showBetaLabel } =
        SubheaderContentType[subheaderType];

    const [presentCategoryDescriptorModal, dismissCategoryDescriptorModal] = useIonModal(
        CategoryDescriptorModal,
        {
            handleCloseModal: () => dismissCategoryDescriptorModal(),
            title: labels?.plural,
        }
    );

    const handlePersonalizeMyAi = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    let titleDisplay = labels?.plural;
    if (count !== undefined) {
        titleDisplay = `${formatCount(count)} ${titleDisplay}`;
        if (count === 1) titleDisplay = labels?.singular;
    }

    const showNewCredsPill = newCredsCount > 0 && category !== CredentialCategoryEnum.aiPathway;

    let helperTextComponent = (
        <span className={`font-poppins text-[12px] ${helperTextColor || ''}`}>
            <span>{helperText}</span>{' '}
            {helperTextClickable && (
                <button
                    className="font-[600] underline"
                    onClick={() => presentCategoryDescriptorModal()}
                >
                    {helperTextClickable}.
                </button>
            )}
        </span>
    );

    if (subheaderType === SubheaderTypeEnum.AiSessions) {
        helperTextComponent = (
            <span className={`font-poppins text-[12px]`}>
                <button
                    className={`font-semibold !text-${colors?.indicatorColor || ''}`}
                    onClick={() => handlePersonalizeMyAi()}
                >
                    {helperTextClickable}
                </button>{' '}
                <span className={`${helperTextColor || ''} font-medium text-[12px]`}>
                    • {completionPercentage}% Optimized
                </span>
            </span>
        );
    }

    return (
        <IonRow className="max-w-[700px] mx-auto">
            <IonCol size={'9'} className="flex items-center justify-start gap-[10px]">
                {Icon && (
                    <Icon
                        className={`h-[60px] w-[60px] shrink-0 ${
                            iconPadding || 'p-0'
                        } ${headerTextColor}`}
                    />
                )}
                <h2
                    className={`select-none whitespace-nowrap flex flex-col gap-[4px] ${headerTextColor}`}
                >
                    <span className="font-poppins text-[30px] leading-[100%] flex items-center">
                        {countLoading && (
                            <IonSpinner
                                name="crescent"
                                className="text-white w-[20px] h-[20px] mr-[5px]"
                            />
                        )}{' '}
                        {titleDisplay}
                        {showBetaLabel && (
                            <span className="ml-[6px] text-[15px] font-normal text-grayscale-400 leading-[100%]">
                                beta
                            </span>
                        )}
                    </span>
                    {(helperText || showNewCredsPill) && (
                        <div className="flex items-center gap-[8px] flex-wrap">
                            {helperText && helperTextComponent}
                            {showNewCredsPill && (
                                <NewCredentialsPill count={newCredsCount} tone="onColor" />
                            )}
                        </div>
                    )}
                </h2>
            </IonCol>

            <IonCol size="3" className="flex items-center justify-end">
                {!hidePlusBtn && plusButtonOverride}
            </IonCol>
        </IonRow>
    );
};

export default MainSubHeader;

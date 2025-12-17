import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { IonRow, IonCol, IonModal, useIonModal, IonSpinner } from '@ionic/react';
import useBoostModal from '../boost/hooks/useBoostModal';

import ShareCredentialsModal from '../../../../../packages/learn-card-base/src/components/sharecreds/ShareCredentialsModal';
import PlusButtonModalContent from '../../../../../packages/learn-card-base/src/components/plusButton/PlusButtonModalContent';
import CategoryDescriptorModal from '../category-descriptor/CategoryDescriptorModal';
import CenteredSubHeader from '../../pages/skills/CenteredSubHeader';
import DotIcon from 'learn-card-base/svgs/DotIcon';
import Plus from 'learn-card-base/svgs/Plus';

import { CredentialCategoryEnum } from 'learn-card-base';
import { SubheaderTypeEnum, SubheaderContentType } from './MainSubHeader.types';

import useTheme from '../../theme/hooks/useTheme';
import newCredsStore from 'learn-card-base/stores/newCredsStore';

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
    const { getThemedCategoryColors, getThemedCategoryIcons, theme } = useTheme();
    const colors = getThemedCategoryColors(category as CredentialCategoryEnum);
    const { Icon } = getThemedCategoryIcons(category as CredentialCategoryEnum);

    const newCreds = newCredsStore.use.newCreds();
    const newCredsForCategory = newCreds?.[category as CredentialCategoryEnum] ?? [];
    const newCredsCount = newCredsForCategory?.length ?? 0;

    const { labels } = theme?.categories.find(c => c.categoryId === category) || {};
    const { headerTextColor, backgroundPrimaryColor } = colors;

    const history = useHistory();
    const [shareCredsIsOpen, setShareCredsIsOpen] = useState(false);

    const sheetModal = useRef<HTMLIonModalElement>(null);
    const centerModal = useRef<HTMLIonModalElement>(null);

    const { iconPadding, helperText, helperTextClickable } = SubheaderContentType[subheaderType];

    const handleCloseShareModal = () => {
        setShareCredsIsOpen(false);
    };

    const [presentCategoryDescriptorModal, dismissCategoryDescriptorModal] = useIonModal(
        CategoryDescriptorModal,
        {
            handleCloseModal: () => dismissCategoryDescriptorModal(),
            title: labels?.plural,
        }
    );

    const { handlePresentBoostModal } = useBoostModal(history, category as CredentialCategoryEnum);

    let titleDisplay = labels?.plural;
    if (count !== undefined) {
        titleDisplay = `${formatCount(count)} ${titleDisplay}`;
        if (count === 1) titleDisplay = labels?.singular;
    }

    const newCredsCountDisplay =
        newCredsCount > 0 ? (
            <span
                className={`text-${colors?.indicatorColor} font-poppins text-[17px] font-[600] inline-flex items-center gap-[5px] ml-[5px]`}
            >
                <DotIcon className="w-[10px] h-[10px]" /> {newCredsCount} New
            </span>
        ) : null;

    return (
        <IonRow className="max-w-[700px] mx-auto">
            {subheaderType === SubheaderTypeEnum.AiInsights ? (
                <CenteredSubHeader subheaderType={subheaderType} />
            ) : (
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
                        <span className="font-poppins text-[22px] leading-[100%] flex items-center">
                            {countLoading && (
                                <IonSpinner
                                    name="crescent"
                                    className="text-white w-[20px] h-[20px] mr-[5px]"
                                />
                            )}{' '}
                            {titleDisplay}
                            {newCredsCountDisplay}
                        </span>
                        <span className="font-poppins text-[12px]">
                            <span>{helperText}</span>{' '}
                            <button
                                className="font-[600] underline"
                                onClick={() => presentCategoryDescriptorModal()}
                            >
                                {helperTextClickable}.
                            </button>
                        </span>
                    </h2>
                </IonCol>
            )}

            <IonCol size="3" className="flex items-center justify-end">
                {plusButtonOverride}
                {!hidePlusBtn && !plusButtonOverride && (
                    <button
                        type="button"
                        aria-label="plus-button"
                        onClick={handlePresentBoostModal}
                        className={`flex items-center justify-center h-fit w-fit p-[8px] rounded-full bg-${backgroundPrimaryColor}`}
                    >
                        <Plus className={`h-[20px] w-[20px] ${headerTextColor}`} />
                    </button>
                )}

                <IonModal className="main-header-modal" isOpen={shareCredsIsOpen}>
                    <ShareCredentialsModal onDismiss={handleCloseShareModal} />
                </IonModal>

                <IonModal ref={centerModal} trigger="open-center-modal" className="center-modal">
                    <PlusButtonModalContent
                        handleCloseModal={() => centerModal.current?.dismiss()}
                        showFixedFooter={false}
                        showCloseButton={false}
                    />
                </IonModal>
                <IonModal
                    ref={sheetModal}
                    initialBreakpoint={0.25}
                    breakpoints={[0, 0.25, 0.5, 0.75]}
                    handleBehavior="cycle"
                    trigger="open-sheet-modal"
                    className="mobile-modal"
                >
                    <PlusButtonModalContent
                        handleCloseModal={() => sheetModal.current?.dismiss()}
                        showFixedFooter={false}
                        showCloseButton={false}
                    />
                </IonModal>
            </IonCol>
        </IonRow>
    );
};

export default MainSubHeader;

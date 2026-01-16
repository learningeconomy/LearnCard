import React, { useState, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import useBoostModal from '../boost/hooks/useBoostModal';
import modalStateStore from 'learn-card-base/stores/modalStateStore';

import { IonRow, IonCol, IonModal, IonSpinner } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';

import IssueVCModal from '../../../../../packages/learn-card-base/src/components/IssueVC/IssueVCModal';
import ShareCredentialsModal from '../../../../../packages/learn-card-base/src/components/sharecreds/ShareCredentialsModal';
import PlusButtonModalContent from '../../../../../packages/learn-card-base/src/components/plusButton/PlusButtonModalContent';
import SubheaderPlusActionButton from './SubheaderPlusActionButton';
import CategoryDescriptorModal from '../category-descriptor/CategoryDescriptorModal';

import { ACHIEVEMENT_CATEGORIES } from '../../../../../packages/learn-card-base/src/components/IssueVC/constants';
import { SubheaderTypeEnum, SubheaderContentType } from './MainSubHeader.types';
import { BoostCategoryOptionsEnum, useModal, ModalTypes } from 'learn-card-base';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

const formatCount = (count: number | string): string => {
    if (typeof count === 'string') return count;
    if (count < 1000) return count.toString();
    const formatted = count / 1000;
    return `${formatted.toFixed(1)}k`;
};

type MainSubHeaderProps = {
    subheaderType: SubheaderTypeEnum;
    hidePlusBtn?: boolean;
    branding?: BrandingEnum;
    plusButtonOverride?: React.ReactNode;
    count?: number;
    countLoading?: boolean;
};

export const MainSubHeader: React.FC<MainSubHeaderProps> = ({
    subheaderType = SubheaderTypeEnum.Achievement,
    hidePlusBtn = false,
    branding,
    plusButtonOverride,
    count,
    countLoading,
}) => {
    const flags = useFlags();
    const history = useHistory();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [shareCredsIsOpen, setShareCredsIsOpen] = useState(false);

    let category = BoostCategoryOptionsEnum.socialBadge;
    switch (subheaderType) {
        case SubheaderTypeEnum.Membership: // Troops
            category = BoostCategoryOptionsEnum.membership;
            break;
        case SubheaderTypeEnum.SocialBadge: // Boosts
            category = BoostCategoryOptionsEnum.socialBadge;
            break;
        case SubheaderTypeEnum.MeritBadge:
            category = BoostCategoryOptionsEnum.meritBadge;
            break;
        case SubheaderTypeEnum.Skill:
            category = BoostCategoryOptionsEnum.skill;
            break;
    }

    const { handlePresentBoostModal } = useBoostModal(history, category);

    const sheetModal = useRef<HTMLIonModalElement>(null);
    const centerModal = useRef<HTMLIonModalElement>(null);

    const { title, IconComponent, iconColor, textColor, helperText, helperTextClickable } =
        SubheaderContentType[subheaderType];

    const hideSelfIssueBtn = true;

    const _hidePlusBtn =
        hidePlusBtn || (location.pathname === '/troops' && flags.disableTroopCreation);

    const pathName = location?.pathname?.replace('/', '');
    const PATH_TO_CATEGORY: Record<string, any> = {
        learninghistory: ACHIEVEMENT_CATEGORIES.LearningHistory,
        workhistory: ACHIEVEMENT_CATEGORIES.WorkHistory,
        ids: ACHIEVEMENT_CATEGORIES.ID,
        skills: ACHIEVEMENT_CATEGORIES.Skill,
        achievements: ACHIEVEMENT_CATEGORIES.Achievement,
        memberships: ACHIEVEMENT_CATEGORIES.Membership,
    };

    const achievementCategory = PATH_TO_CATEGORY[pathName];

    const handleClickModal = () => {
        modalStateStore.set.issueVcModal({ open: true, name: pathName });
        setIsOpen(true);
    };

    const handleCloseModal = () => {
        modalStateStore.set.issueVcModal({
            open: false,
            name: null,
        });
        setIsOpen(false);
    };

    const handleShareModal = () => {
        setShareCredsIsOpen(true);
    };

    const handleCloseShareModal = () => {
        setShareCredsIsOpen(false);
    };

    let _titleOverride = title;
    let IconComponentOverride = IconComponent;
    if (subheaderType === SubheaderTypeEnum.MeritBadge && branding === BrandingEnum.scoutPass) {
        _titleOverride = 'Merit Badges';
        IconComponentOverride = PurpleMeritBadgesIcon;
    } else if (
        subheaderType === SubheaderTypeEnum.SocialBadge &&
        branding === BrandingEnum.scoutPass
    ) {
        _titleOverride = 'Social Boosts';
        IconComponentOverride = BlueBoostOutline2;
    } else if (
        subheaderType === SubheaderTypeEnum.Membership &&
        branding === BrandingEnum.scoutPass
    ) {
        _titleOverride = 'Troops';
        IconComponentOverride = GreenScoutsPledge2;
    }

    if (count !== undefined) {
        _titleOverride = `${formatCount(count)} ${_titleOverride}`;
        if (count === 1 && _titleOverride.endsWith('s')) {
            _titleOverride = _titleOverride.substring(0, _titleOverride.length - 1);
        }
    }

    const { newModal: newDescriptorModal, closeModal: closeDescriptorModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const presentCategoryDescriptorModal = () => {
        newDescriptorModal(
            <CategoryDescriptorModal
                handleCloseModal={closeDescriptorModal}
                title={title}
            />
        );
    };

    return (
        <IonRow className="max-w-[700px] mx-auto p-0">
            <IonCol
                size={plusButtonOverride ? '9' : '10'}
                className="flex items-center justify-start gap-[5px] pl-0"
            >
                {IconComponentOverride && (
                    <IconComponentOverride className={`h-[60px] w-[60px] shrink-1 ${textColor}`} />
                )}
                <h2
                    className={`select-none whitespace-nowrap flex flex-col gap-[1px] ${textColor}`}
                >
                    <span className="font-notoSans text-[22px] leading-[130%] tracking-[-0.25px] flex items-center">
                        {countLoading && (
                            <IonSpinner
                                name="crescent"
                                className="text-white w-[20px] h-[20px] mr-[5px]"
                            />
                        )}{' '}
                        {_titleOverride}
                    </span>
                    <span className="font-notoSans text-[12px]">
                        <span className="font-[600] opacity-75 font-notoSans">{helperText}</span>{' '}
                        <button
                            className="font-[700] underline"
                            onClick={() => presentCategoryDescriptorModal()}
                        >
                            {helperTextClickable}
                        </button>
                    </span>
                </h2>
            </IonCol>

            <IonCol
                size={plusButtonOverride ? '3' : '2'}
                className="flex items-center justify-end p-0 ml-auto"
            >
                {!hideSelfIssueBtn && (
                    <SubheaderPlusActionButton
                        iconColor={iconColor}
                        location={location as any}
                        handleSelfIssue={handleClickModal}
                        handleShareCreds={handleShareModal}
                        subheaderType={subheaderType}
                    />
                )}

                {plusButtonOverride}
                {!_hidePlusBtn && !plusButtonOverride && (
                    <button
                        type="button"
                        aria-label="plus-button"
                        onClick={handlePresentBoostModal}
                        className={`flex items-center justify-center h-fit w-fit p-[8px] rounded-full bg-white ${textColor}`}
                    >
                        <Plus className={`h-[20px] w-[20px] ${iconColor}`} />
                    </button>
                )}

                <IonModal className="main-header-modal" isOpen={shareCredsIsOpen}>
                    <ShareCredentialsModal onDismiss={handleCloseShareModal} />
                </IonModal>

                <IonModal className="main-header-modal" isOpen={isOpen}>
                    <IssueVCModal
                        achievementCategory={achievementCategory}
                        onDismiss={handleCloseModal}
                    />
                </IonModal>
                <IonModal ref={centerModal} className="center-modal">
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

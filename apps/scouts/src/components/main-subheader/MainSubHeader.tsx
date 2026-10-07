import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';
import * as m from '../../paraglide/messages.js';

import useBoostModal from '../boost/hooks/useBoostModal';

import { IonRow, IonCol, IonSpinner } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';
import { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { PurpleMeritBadgesIcon } from 'learn-card-base/svgs/MeritBadgesIcon';

import CategoryDescriptorModal from '../category-descriptor/CategoryDescriptorModal';

import { SubheaderTypeEnum, SubheaderContentType, getSubheaderCopy } from './MainSubHeader.types';
import { BoostCategoryOptionsEnum, useModal, ModalTypes } from 'learn-card-base';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { getScoutPassCategoryCopy } from '../category-descriptor/scoutPassCategoryCopy';
import {
    getScoutPassSubheaderDisplayCopy,
    isScoutPassCategorySubheader,
} from './scoutPassSubheaderCopy';

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

    const { IconComponent, iconColor, textColor } = SubheaderContentType[subheaderType];

    const _hidePlusBtn =
        hidePlusBtn || (location.pathname === '/troops' && flags.disableTroopCreation);

    const categoryCopy = isScoutPassCategorySubheader(subheaderType)
        ? getScoutPassCategoryCopy(m, category)
        : undefined;
    const subheaderCopy = getScoutPassSubheaderDisplayCopy({
        isScoutPass: branding === BrandingEnum.scoutPass,
        subheaderType,
        count,
        fallback: getSubheaderCopy(subheaderType),
        categoryCopy,
    });

    let _titleOverride = subheaderCopy.title;
    let _helperText = subheaderCopy.helperText;
    let _helperTextClickable = subheaderCopy.helperTextClickable;
    let IconComponentOverride = IconComponent;

    if (branding === BrandingEnum.scoutPass && categoryCopy) {
        _titleOverride = count === 1 ? categoryCopy.titleOne : categoryCopy.titleOther;
        _helperText = categoryCopy.helperPrefix;
        _helperTextClickable = categoryCopy.helperAction;

        if (subheaderType === SubheaderTypeEnum.MeritBadge) {
            IconComponentOverride = PurpleMeritBadgesIcon;
        } else if (subheaderType === SubheaderTypeEnum.SocialBadge) {
            IconComponentOverride = BlueBoostOutline2;
        } else if (subheaderType === SubheaderTypeEnum.Membership) {
            IconComponentOverride = GreenScoutsPledge2;
        }
    }

    if (count !== undefined) _titleOverride = `${formatCount(count)} ${_titleOverride}`;

    const { newModal: newDescriptorModal, closeModal: closeDescriptorModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const presentCategoryDescriptorModal = () => {
        newDescriptorModal(
            <CategoryDescriptorModal handleCloseModal={closeDescriptorModal} category={category} />
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
                        <span className="font-[600] opacity-75 font-notoSans">{_helperText}</span>{' '}
                        <button
                            className="font-[700] underline"
                            onClick={() => presentCategoryDescriptorModal()}
                        >
                            {_helperTextClickable}
                        </button>
                    </span>
                </h2>
            </IonCol>

            <IonCol
                size={plusButtonOverride ? '3' : '2'}
                className="flex items-center justify-end p-0 ml-auto"
            >
                {plusButtonOverride}
                {!_hidePlusBtn && !plusButtonOverride && (
                    <button
                        type="button"
                        aria-label={m['common.add']()}
                        onClick={handlePresentBoostModal}
                        className={`flex items-center justify-center h-fit w-fit p-[8px] rounded-full bg-white ${textColor}`}
                    >
                        <Plus className={`h-[20px] w-[20px] ${iconColor}`} />
                    </button>
                )}
            </IonCol>
        </IonRow>
    );
};

export default MainSubHeader;

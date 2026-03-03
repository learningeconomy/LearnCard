import React, { useState, useRef } from 'react';

import { IonItem, IonList, IonPopover } from '@ionic/react';
import SortIcon from 'learn-card-base/svgs/SortButton';
import { Checkmark } from '@learncard/react';

import { useModal, ModalTypes, useDeviceTypeByWidth } from 'learn-card-base';

import {
    LEARNER_INSIGHTS_FILTER_OPTIONS,
    LEARNER_INSIGHTS_SORT_OPTIONS,
    LearnerInsightsFilterOptionsEnum,
    LearnerInsightsSortOptionsEnum,
} from './learner-insights.helpers';
import LaunchPadFilterSortingOptionsModal from './LearnerInsightsFilterSortingOptionsModal';

import { ThemeEnum } from '../../../theme/helpers/theme-helpers';
import { useTheme } from '../../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../../theme/colors/index';

type RequestInsightsPopOverButtonProps = {
    filterBy: LearnerInsightsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<LearnerInsightsFilterOptionsEnum>>;
    sortBy: LearnerInsightsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<LearnerInsightsSortOptionsEnum>>;
};

export const LearnerInsightsPopOverButton: React.FC<RequestInsightsPopOverButtonProps> = ({
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
}) => {
    const { getColorSet, theme } = useTheme();
    const colorSet = getColorSet(ColorSetEnum.defaults);
    const primaryColor = colorSet.primaryColor;

    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const [showSortPopover, setShowSortPopover] = useState<boolean>(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { isMobile } = useDeviceTypeByWidth(true);

    const handleSortMenu = () => {
        if (isMobile) {
            newModal(
                <LaunchPadFilterSortingOptionsModal
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />,
                {
                    sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
                },
                {}
            );
        } else {
            setShowSortPopover(!showSortPopover);
        }
    };

    return (
        <>
            <button
                id={isMobile ? undefined : `trigger-button`}
                onClick={handleSortMenu}
                type="button"
                ref={isMobile ? null : buttonRef}
                className={`bg-white flex items-center justify-center p-2 rounded-[10px] shadow-sm border-solid border-[1px] ${
                    showSortPopover ? `border-${primaryColor}` : 'border-grayscale-200'
                }`}
            >
                <SortIcon
                    className={`h-[32px] w-[32px] ${
                        showSortPopover ? `text-${primaryColor}` : 'text-grayscale-900'
                    }`}
                />
            </button>
            <IonPopover
                onDidDismiss={() => setShowSortPopover(false)}
                reference="trigger"
                trigger="trigger-button"
                className={` ${
                    theme.id === ThemeEnum.Formal ? 'launchpad-formal' : 'launchpad-popover'
                }`}
            >
                <IonList>
                    {LEARNER_INSIGHTS_SORT_OPTIONS.map(option => {
                        return (
                            <IonItem
                                className="font-notoSans text-sm flex items-center justify-start text-left"
                                key={option.id}
                                lines="none"
                                button={true}
                                detail={false}
                                onClick={() => setSortBy(option.type)}
                            >
                                {option.type === sortBy ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                                ) : (
                                    <div className="w-[24px] h-[24px] mr-1" />
                                )}
                                Sort by {option.title}
                            </IonItem>
                        );
                    })}
                    <div className="w-full flex items-center justify-center">
                        <div className="w-[90%] h-[1px] bg-grayscale-100 mt-2 mb-2" />
                    </div>
                    {LEARNER_INSIGHTS_FILTER_OPTIONS.map(option => {
                        return (
                            <IonItem
                                className="font-notoSans text-sm flex items-center justify-start text-left"
                                key={option.id}
                                lines="none"
                                button={true}
                                detail={false}
                                onClick={() => setFilterBy(option.type)}
                            >
                                {option.type === filterBy ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] mr-1" />
                                ) : (
                                    <div className="w-[24px] h-[24px] mr-1" />
                                )}
                                {option.title}
                            </IonItem>
                        );
                    })}
                </IonList>
            </IonPopover>
        </>
    );
};

export default LearnerInsightsPopOverButton;

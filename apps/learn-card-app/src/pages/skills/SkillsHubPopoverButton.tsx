import React, { useState, useRef, useEffect } from 'react';

import useTheme from '../../theme/hooks/useTheme';
import { useModal, ModalTypes, useDeviceTypeByWidth, ThemeEnum, useWallet } from 'learn-card-base';

import { IonPopover, IonSpinner } from '@ionic/react';
import { Checkmark } from '@learncard/react';
import SortIcon from 'learn-card-base/svgs/SortButton';
import FrameworkImage from '../SkillFrameworks/FrameworkImage';
import SkillsHubFilterSortingOptionsModal from './SkillsHubFilterSortingOptionsModal';

import {
    SKILLSHUB_FILTER_OPTIONS,
    SKILLSHUB_SORT_OPTIONS,
    SkillsHubFilterOptionsEnum,
    SkillsHubFilterValue,
    SkillsHubSortOptionsEnum,
} from './skillshub-search.helpers';

import { SetState } from 'packages/shared-types/dist';
import { ColorSetEnum } from '../../theme/colors/index';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';

// Helper to toggle a filter value in/out of the array
const toggleFilter = (
    currentFilters: SkillsHubFilterValue[],
    value: SkillsHubFilterValue
): SkillsHubFilterValue[] => {
    // If selecting "all", clear everything and set to just ["all"]
    if (value === SkillsHubFilterOptionsEnum.all) {
        return [SkillsHubFilterOptionsEnum.all];
    }

    // Remove "all" if it was selected when adding a specific filter
    const withoutAll = currentFilters.filter(f => f !== SkillsHubFilterOptionsEnum.all);

    // Toggle the value
    if (withoutAll.includes(value)) {
        const newFilters = withoutAll.filter(f => f !== value);
        // If nothing left, default back to "all"
        return newFilters.length === 0 ? [SkillsHubFilterOptionsEnum.all] : newFilters;
    } else {
        return [...withoutAll, value];
    }
};

type SkillsHubPopOverButtonProps = {
    filterBy: SkillsHubFilterValue[];
    setFilterBy: SetState<SkillsHubFilterValue[]>;
    sortBy: SkillsHubSortOptionsEnum;
    setSortBy: SetState<SkillsHubSortOptionsEnum>;
    frameworkIds: string[]; // (to filter by)
};

export const SkillsHubPopOverButton: React.FC<SkillsHubPopOverButtonProps> = ({
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
    frameworkIds,
}) => {
    const { initWallet } = useWallet();
    const { getColorSet, theme } = useTheme();
    const colorSet = getColorSet(ColorSetEnum.defaults);
    const primaryColor = colorSet.primaryColor;

    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const [availableFrameworks, setAvailableFrameworks] = useState<ApiFrameworkInfo[]>([]);
    const [frameworksLoading, setFrameworksLoading] = useState(false);

    useEffect(() => {
        const populateFrameworks = async () => {
            setFrameworksLoading(true);
            const wallet = await initWallet();

            const frameworkResults = await Promise.all(
                frameworkIds.map(async frameworkId => {
                    try {
                        const frameworkAndSkills = await wallet.invoke.getSkillFrameworkById(
                            frameworkId
                        );

                        return frameworkAndSkills.framework;
                    } catch (error) {
                        console.error(`Failed to fetch framework ${frameworkId}:`, error);
                        return null;
                    }
                })
            );

            const frameworks = frameworkResults.filter(
                (framework): framework is NonNullable<typeof framework> => framework !== null
            ) as ApiFrameworkInfo[];

            setAvailableFrameworks(frameworks);
            setFrameworksLoading(false);
        };

        populateFrameworks();
    }, [frameworkIds]);

    const [showSortPopover, setShowSortPopover] = useState<boolean>(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { isMobile } = useDeviceTypeByWidth(true);

    const handleSortMenu = () => {
        if (isMobile) {
            newModal(
                <SkillsHubFilterSortingOptionsModal
                    filterBy={filterBy}
                    setFilterBy={setFilterBy}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    availableFrameworks={availableFrameworks}
                    frameworksLoading={frameworksLoading}
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
                className={`bg-white flex items-center justify-center p-[10px] rounded-[10px] shadow-sm border-solid border-[1px] ${
                    showSortPopover ? `border-${primaryColor}` : 'border-grayscale-200'
                }`}
            >
                <span className="font-popins font-[600] text-[12px] text-grayscale-700">
                    {SKILLSHUB_SORT_OPTIONS.find(option => option.type === sortBy)?.buttonText}
                </span>
                <SortIcon className="h-[32px] w-[32px] text-grayscale-700" />
            </button>
            <IonPopover
                onDidDismiss={() => setShowSortPopover(false)}
                reference="trigger"
                trigger="trigger-button"
                className={theme.id === ThemeEnum.Formal ? 'launchpad-formal' : 'launchpad-popover'}
                style={{ '--min-width': '300px' } as React.CSSProperties}
            >
                <div className="p-[15px] rounded-[20px] bg-white">
                    <div className="flex flex-col gap-[5px]">
                        {SKILLSHUB_SORT_OPTIONS.map(option => {
                            return (
                                <button
                                    className={`font-poppins text-[16px] flex gap-[10px] items-center justify-start text-left text-grayscale-900 rounded-[15px] w-full p-[10px] ${
                                        option.type === sortBy ? '!bg-grayscale-100' : ''
                                    }`}
                                    key={option.id}
                                    onClick={() => setSortBy(option.type)}
                                >
                                    {option.type === sortBy ? (
                                        <Checkmark className="text-grayscale-800 w-[22px] h-[22px]" />
                                    ) : (
                                        <div className="w-[22px] h-[22px] shrink-0"> </div>
                                    )}
                                    Sort{' '}
                                    {option.type === SkillsHubSortOptionsEnum.recentlyAdded
                                        ? 'by '
                                        : ''}
                                    {option.title}
                                </button>
                            );
                        })}
                    </div>
                    <div className="w-full flex items-center justify-center">
                        <div className="w-[90%] h-[1px] bg-grayscale-100 mt-2 mb-2" />
                    </div>
                    <div className="flex flex-col gap-[5px]">
                        {SKILLSHUB_FILTER_OPTIONS.map(option => {
                            return (
                                <button
                                    className={`font-poppins text-[16px] flex gap-[10px] items-start justify-start text-left text-grayscale-900 rounded-[15px] w-full p-[10px] ${
                                        filterBy.includes(option.type) ? '!bg-grayscale-100' : ''
                                    }`}
                                    key={option.id}
                                    onClick={() => setFilterBy(toggleFilter(filterBy, option.type))}
                                >
                                    {filterBy.includes(option.type) ? (
                                        <Checkmark className="text-grayscale-800 w-[22px] h-[22px] shrink-0" />
                                    ) : (
                                        <div className="w-[22px] h-[22px] shrink-0"> </div>
                                    )}
                                    {option.type === SkillsHubFilterOptionsEnum.legacy && (
                                        <FrameworkImage
                                            sizeClassName="w-[25px] h-[25px]"
                                            iconSizeClassName="w-[16px] h-[16px]"
                                        />
                                    )}
                                    {option.title}
                                </button>
                            );
                        })}
                        {availableFrameworks.map(option => {
                            return (
                                <button
                                    className={`font-poppins text-[16px] flex gap-[10px] items-start justify-start text-left text-grayscale-900 w-full p-[10px] rounded-[15px] ${
                                        filterBy.includes(option.id) ? '!bg-grayscale-100' : ''
                                    }`}
                                    key={option.id}
                                    onClick={() => setFilterBy(toggleFilter(filterBy, option.id))}
                                >
                                    {filterBy.includes(option.id) ? (
                                        <Checkmark className="text-grayscale-800 w-[22px] h-[22px] shrink-0" />
                                    ) : (
                                        <div className="w-[22px] h-[22px] shrink-0"> </div>
                                    )}
                                    <FrameworkImage
                                        image={option.image}
                                        sizeClassName="w-[25px] h-[25px]"
                                        iconSizeClassName="w-[16px] h-[16px]"
                                    />
                                    {option.name}
                                </button>
                            );
                        })}
                        {frameworksLoading && (
                            <div className="flex items-center justify-center">
                                <IonSpinner name="crescent" color="dark" />
                            </div>
                        )}
                    </div>
                </div>
            </IonPopover>
        </>
    );
};

export default SkillsHubPopOverButton;

import React, { useState } from 'react';

import { Checkmark } from '@learncard/react';
import { IonSpinner } from '@ionic/react';
import FrameworkImage from '../SkillFrameworks/FrameworkImage';
import {
    SKILLSHUB_FILTER_OPTIONS,
    SKILLSHUB_SORT_OPTIONS,
    SkillsHubFilterOptionsEnum,
    SkillsHubFilterValue,
    SkillsHubSortOptionsEnum,
} from './skillshub-search.helpers';
import { useModal } from 'learn-card-base';
import { SetState } from 'packages/shared-types/dist';
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

export const SkillsHubFilterSortingOptionsModal: React.FC<{
    filterBy: SkillsHubFilterValue[];
    setFilterBy: SetState<SkillsHubFilterValue[]>;
    sortBy: SkillsHubSortOptionsEnum;
    setSortBy: SetState<SkillsHubSortOptionsEnum>;
    availableFrameworks: ApiFrameworkInfo[];
    frameworksLoading: boolean;
}> = ({ filterBy, setFilterBy, sortBy, setSortBy, availableFrameworks, frameworksLoading }) => {
    const { closeModal } = useModal();

    const [_filterBy, _setFilterBy] = useState<SkillsHubFilterValue[]>(filterBy);
    const [_sortBy, _setSortBy] = useState<SkillsHubSortOptionsEnum>(sortBy);

    const handleSetState = () => {
        setFilterBy(_filterBy);
        setSortBy(_sortBy);
        closeModal();
    };

    return (
        <>
            <div className="p-[20px] rounded-[20px] bg-white">
                <div className="flex flex-col gap-[5px]">
                    {SKILLSHUB_SORT_OPTIONS.map(option => {
                        return (
                            <button
                                className={`font-poppins text-[17px] flex gap-[10px] items-center justify-start text-left text-grayscale-900 rounded-[15px] w-full p-[10px] ${
                                    option.type === _sortBy ? '!bg-grayscale-100' : ''
                                }`}
                                key={option.id}
                                onClick={() => _setSortBy(option.type)}
                            >
                                {option.type === _sortBy ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] shrink-0" />
                                ) : (
                                    <div className="w-[24px] h-[24px] shrink-0"> </div>
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
                                className={`font-poppins text-[17px] flex gap-[10px] items-center justify-start text-left text-grayscale-900 rounded-[15px] w-full p-[10px] ${
                                    _filterBy.includes(option.type) ? '!bg-grayscale-100' : ''
                                }`}
                                key={option.id}
                                onClick={() => _setFilterBy(toggleFilter(_filterBy, option.type))}
                            >
                                {_filterBy.includes(option.type) ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] shrink-0" />
                                ) : (
                                    <div className="w-[24px] h-[24px] shrink-0"> </div>
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
                                className={`font-poppins text-[17px] flex gap-[10px] items-start justify-start text-left text-grayscale-900 w-full p-[10px] rounded-[15px] ${
                                    _filterBy.includes(option.id) ? '!bg-grayscale-100' : ''
                                }`}
                                key={option.id}
                                onClick={() => _setFilterBy(toggleFilter(_filterBy, option.id))}
                            >
                                {_filterBy.includes(option.id) ? (
                                    <Checkmark className="text-grayscale-800 w-[24px] h-[24px] shrink-0" />
                                ) : (
                                    <div className="w-[24px] h-[24px] shrink-0"> </div>
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
            <div className="w-full flex items-center justify-center mt-4">
                <button
                    onClick={handleSetState}
                    type="button"
                    className="shrink-0 w-full py-2 h-full font-notoSans flex items-center justify-center text-xl bg-grayscale-900 rounded-[20px] shadow-bottom text-white"
                >
                    Set
                </button>
            </div>
        </>
    );
};

export default SkillsHubFilterSortingOptionsModal;

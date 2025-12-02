import React from 'react';

import CheckListItem from './CheckListItem';

import {
    ChecklistEnum,
    useGetCheckListStatus,
    ChecklistItem,
    checklistItems,
} from 'learn-card-base';
import ExperimentalFeatureBox from '../../generic/ExperimentalFeatureBox';

export const CheckList: React.FC<{ activeChecklistStep?: ChecklistEnum }> = ({
    activeChecklistStep,
}) => {
    const { checklistItemsWithStatus, completedItems, numStepsRemaining } = useGetCheckListStatus();

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-[15px] mt-4 rounded-[15px]">
            <div className="w-full flex items-center justify-start py-[10px]">
                <h4 className="text-[20px] text-grayscale-900 font-notoSans">
                    <span className="font-semibold">{completedItems}</span> of{' '}
                    <span className="font-semibold">{checklistItems.length}</span> Steps Completed
                </h4>
            </div>
            <div className="w-full flex items-center justify-start">
                <ul className="w-full">
                    {checklistItemsWithStatus.map((item: ChecklistItem) => (
                        <CheckListItem
                            checkListItem={item}
                            key={item.type}
                            activeChecklistStep={activeChecklistStep}
                        />
                    ))}
                </ul>
            </div>
            <ExperimentalFeatureBox className="mt-[20px]" />
        </div>
    );
};

export default CheckList;

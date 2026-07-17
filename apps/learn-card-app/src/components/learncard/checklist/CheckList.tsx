import React, { useEffect } from 'react';

import {
    ModalTypes,
    useModal,
    ChecklistEnum,
    ChecklistItem,
    checklistItems,
} from 'learn-card-base';

import CheckListItem from './CheckListItem';
import CheckListManagerContainer from './CheckListManager/CheckListManagerContainer';

export const CheckList: React.FC<{ activeChecklistStep?: ChecklistEnum }> = ({
    activeChecklistStep,
}) => {
    const { newModal } = useModal();

    const handleOpenChecklistManager = (checkListItem: ChecklistItem) => {
        newModal(
            <CheckListManagerContainer checkListItem={checkListItem} />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    useEffect(() => {
        if (!activeChecklistStep) return;

        const autoOpenItem = checklistItems.find(item => item.type === activeChecklistStep);
        if (autoOpenItem) {
            handleOpenChecklistManager(autoOpenItem);
        }
    }, [activeChecklistStep]);

    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-2xl p-5 mt-4 rounded-[20px]">
            <div className="w-full flex flex-col items-start justify-start">
                <p className="text-xs font-medium tracking-[0.14em] text-grayscale-500 uppercase">
                    Get started
                </p>
                <h4 className="mt-1 text-xl font-semibold text-grayscale-900 leading-tight">
                    Choose what to add next
                </h4>
                <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                    Pick the document that fits best, then we’ll open the right upload flow.
                </p>
            </div>

            <div className="w-full flex items-center justify-start mt-5">
                <ul className="w-full flex flex-col gap-4">
                    {checklistItems.map((item: ChecklistItem) => (
                        <CheckListItem
                            checkListItem={item}
                            key={item.type}
                            onOpen={() => handleOpenChecklistManager(item)}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CheckList;

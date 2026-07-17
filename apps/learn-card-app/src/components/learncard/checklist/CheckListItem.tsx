import React from 'react';

import { ChecklistItem } from 'learn-card-base';
import SlimCaretRight from '../../svgs/SlimCaretRight';

type CheckListItemProps = {
    checkListItem: ChecklistItem;
    onOpen: () => void;
};

export const CheckListItem: React.FC<CheckListItemProps> = ({ checkListItem, onOpen }) => {
    return (
        <li className="w-full">
            <button
                type="button"
                onClick={onOpen}
                aria-label={`${checkListItem.title}. ${checkListItem.description}`}
                className="w-full py-4 text-left transition-opacity hover:opacity-80"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-grayscale-900 leading-relaxed">
                            {checkListItem.title}
                        </p>
                        <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                            {checkListItem.description}
                        </p>
                    </div>
                    <SlimCaretRight className="w-6 h-6 shrink-0 text-grayscale-400 mt-0.5" />
                </div>
            </button>
        </li>
    );
};

export default CheckListItem;

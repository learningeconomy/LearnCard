import React from 'react';

import { ChecklistItem } from 'learn-card-base';
import SlimCaretRight from '../../svgs/SlimCaretRight';

type CheckListItemProps = {
    checkListItem: ChecklistItem;
    count?: number;
    onOpen: () => void;
};

export const CheckListItem: React.FC<CheckListItemProps> = ({ checkListItem, count, onOpen }) => {
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
                    <div className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                        {count ? (
                            <>
                                <span>{count}</span>{' '}
                            </>
                        ) : null}
                        <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
                    </div>
                </div>
            </button>
        </li>
    );
};

export default CheckListItem;

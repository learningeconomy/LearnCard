import React from 'react';

import { SLOT_ORDER, type ResolvedAction } from '../quickActions/types';

type QuickActionsRowProps = {
    slots: Record<'collect' | 'understand' | 'navigate', ResolvedAction | null>;
};

const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ slots }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 animate-fade-in-up">
            {SLOT_ORDER.map(slot => {
                const action = slots[slot];
                if (!action) {
                    return (
                        <div
                            key={slot}
                            aria-hidden
                            className="hidden sm:block rounded-[20px] border border-dashed border-grayscale-200 bg-grayscale-10/40"
                        />
                    );
                }

                const { Icon } = action;

                return (
                    <button
                        key={slot}
                        type="button"
                        onClick={action.onClick}
                        className="group flex w-full min-h-[76px] items-center gap-4 bg-white rounded-[20px] py-4 px-4 border border-grayscale-200 hover:border-grayscale-300 hover:bg-grayscale-10 transition-all text-start min-w-0"
                    >
                        <span className="shrink-0 w-11 h-11 rounded-full bg-grayscale-100 group-hover:bg-grayscale-200 transition-colors flex items-center justify-center text-grayscale-800">
                            <Icon className="w-[30px] h-[30px]" />
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-[12px] font-semibold text-grayscale-900 whitespace-normal">
                                {action.label}
                            </span>
                            <span className="text-[12px] text-grayscale-500 leading-4 whitespace-normal">
                                {action.caption}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default QuickActionsRow;
export type { ResolvedAction };

import React from 'react';

import { SLOT_ORDER, type ResolvedAction } from '../quickActions/types';

type QuickActionsRowProps = {
    slots: Record<'collect' | 'understand' | 'navigate', ResolvedAction | null>;
};

const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ slots }) => {
    return (
        <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
            {SLOT_ORDER.map(slot => {
                const action = slots[slot];
                if (!action) {
                    return (
                        <div
                            key={slot}
                            aria-hidden
                            className="rounded-2xl border border-dashed border-grayscale-200 bg-grayscale-10/40"
                        />
                    );
                }
                const { Icon } = action;
                return (
                    <button
                        key={slot}
                        type="button"
                        onClick={action.onClick}
                        className="group flex items-center gap-3 bg-white rounded-2xl py-3 px-3 border border-grayscale-200 hover:border-grayscale-300 hover:bg-grayscale-10 transition-all text-left min-w-0"
                    >
                        <span className="shrink-0 w-9 h-9 rounded-full bg-grayscale-100 group-hover:bg-grayscale-200 transition-colors flex items-center justify-center text-grayscale-800">
                            <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-grayscale-900 truncate">
                                {action.label}
                            </span>
                            <span className="hidden desktop:inline text-[11px] text-grayscale-500 leading-tight truncate">
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

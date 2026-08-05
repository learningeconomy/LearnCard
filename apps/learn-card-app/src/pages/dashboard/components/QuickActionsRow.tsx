import React from 'react';

import { SLOT_ORDER, type ResolvedAction } from '../quickActions/types';

type QuickActionsRowProps = {
    slots: Record<'collect' | 'understand' | 'navigate', ResolvedAction | null>;
};

const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ slots }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2 animate-fade-in-up">
            {SLOT_ORDER.map(slot => {
                const action = slots[slot];
                if (!action) {
                    return (
                        <div
                            key={slot}
                            aria-hidden
                            className="hidden sm:block rounded-2xl border border-dashed border-grayscale-200 bg-grayscale-10/40"
                        />
                    );
                }

                const isSelfAssignedSkillsAction = action.id === 'understand-new';
                const { Icon } = action;

                return (
                    <button
                        key={slot}
                        type="button"
                        onClick={action.onClick}
                        className={`group flex w-full items-center bg-white rounded-2xl border border-grayscale-200 hover:border-grayscale-300 hover:bg-grayscale-10 transition-all text-left min-w-0 ${
                            isSelfAssignedSkillsAction
                                ? 'min-h-[72px] gap-4 py-4 px-4'
                                : 'min-h-[44px] gap-3 py-3 px-3'
                        }`}
                    >
                        <span
                            className={`shrink-0 rounded-full bg-grayscale-100 group-hover:bg-grayscale-200 transition-colors flex items-center justify-center text-grayscale-800 ${
                                isSelfAssignedSkillsAction ? 'w-11 h-11' : 'w-9 h-9'
                            }`}
                        >
                            <Icon
                                className={
                                    isSelfAssignedSkillsAction ? 'w-[30px] h-[30px]' : 'w-5 h-5'
                                }
                            />
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span
                                className={`font-semibold text-grayscale-900 ${
                                    isSelfAssignedSkillsAction
                                        ? 'text-[12px] whitespace-normal'
                                        : 'text-sm truncate'
                                }`}
                            >
                                {action.label}
                            </span>
                            <span
                                className={`text-grayscale-500 ${
                                    isSelfAssignedSkillsAction
                                        ? 'inline text-[12px] leading-4 whitespace-normal'
                                        : 'inline sm:hidden desktop:inline text-[11px] leading-tight truncate'
                                }`}
                            >
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

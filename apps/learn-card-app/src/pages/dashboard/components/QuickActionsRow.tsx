import React from 'react';

type QuickActionIcon = React.FC<{ className?: string; shadeColor?: string }>;

type QuickAction = {
    key: string;
    label: string;
    caption: string;
    Icon: QuickActionIcon;
    onClick: () => void;
};

type QuickActionsRowProps = {
    actions: QuickAction[];
};

const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ actions }) => {
    return (
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
            {actions.map(action => {
                const { Icon } = action;
                return (
                    <button
                        key={action.key}
                        type="button"
                        onClick={action.onClick}
                        className="group flex flex-col items-start gap-2 bg-white rounded-[20px] p-4 border border-grayscale-200 shadow-soft-bottom hover:border-grayscale-300 hover:bg-grayscale-10 transition-all text-left"
                    >
                        <span className="w-11 h-11 rounded-full bg-grayscale-100 group-hover:bg-grayscale-200 transition-colors flex items-center justify-center text-grayscale-800">
                            <Icon className="w-7 h-7" />
                        </span>
                        <span className="text-sm font-semibold text-grayscale-900">
                            {action.label}
                        </span>
                        <span className="text-xs text-grayscale-500 leading-tight">
                            {action.caption}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default QuickActionsRow;
export type { QuickAction, QuickActionIcon };

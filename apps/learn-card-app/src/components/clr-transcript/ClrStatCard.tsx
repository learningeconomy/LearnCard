import React from 'react';

import PaperClip from '../svgs/PaperClip';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';

export type StatCardType = 'gpa' | 'courses' | 'competencies' | 'evidence';

type StatCardConfig = {
    label: string;
    icon?: React.ReactNode;
    variant: 'highlight' | 'default';
};

export const FlatIcon = ({ children }: { children: React.ReactNode }) => (
    <span className="[&_path]:!fill-current [&_path]:!stroke-none shrink-0">{children}</span>
);

const STAT_CARD_CONFIG: Record<StatCardType, StatCardConfig> = {
    gpa: {
        label: 'Cumulative GPA',
        variant: 'highlight',
    },
    courses: {
        label: 'Courses',
        icon: (
            <FlatIcon>
                <StudiesIcon className="w-5 h-5" />
            </FlatIcon>
        ),
        variant: 'default',
    },
    competencies: {
        label: 'Competencies',
        icon: (
            <FlatIcon>
                <SkillsIcon className="w-5 h-5" />
            </FlatIcon>
        ),
        variant: 'default',
    },
    evidence: {
        label: 'Evidence',
        icon: <PaperClip className="w-5 h-5" />,
        variant: 'default',
    },
};

export const StatCard: React.FC<{
    type: StatCardType;
    value: string | number;
    onClick?: () => void;
}> = ({ type, value, onClick }) => {
    const { label, icon, variant } = STAT_CARD_CONFIG[type];
    const cardClasses = `flex flex-col rounded-2xl px-4 py-3 min-w-[110px] w-full max-w-[48%] sm:w-auto sm:max-w-none text-left transition-colors ${
        variant === 'highlight' ? 'bg-white border border-grayscale-200' : 'bg-grayscale-100/70'
    } ${onClick ? 'cursor-pointer hover:bg-grayscale-100' : 'cursor-default'}`;

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cardClasses}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-grayscale-600 mb-1.5">
                    {label}
                </p>
                <div className="flex items-center gap-1.5">
                    {icon && <span className="text-grayscale-700 shrink-0">{icon}</span>}
                    <p className="text-2xl font-bold text-grayscale-900 leading-none">{value}</p>
                </div>
            </button>
        );
    }

    return (
        <div className={cardClasses}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-grayscale-600 mb-1.5">
                {label}
            </p>
            <div className="flex items-center gap-1.5">
                {icon && <span className="text-grayscale-700 shrink-0">{icon}</span>}
                <p className="text-2xl font-bold text-grayscale-900 leading-none">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;

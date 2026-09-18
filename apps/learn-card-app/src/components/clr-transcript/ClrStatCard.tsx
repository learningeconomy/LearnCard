import React from 'react';

import PaperClip from '../svgs/PaperClip';
import { FlatIcon } from 'learn-card-base/components/FlatIcon';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';
import { ClipboardCheck, Award } from 'lucide-react';

export type StatCardType =
    'gpa' | 'courses' | 'assessments' | 'awards' | 'competencies' | 'evidence';

type StatCardConfig = {
    label: string;
    icon?: React.ReactNode;
    variant: 'highlight' | 'default';
};

const STAT_CARD_CONFIG: Record<StatCardType, StatCardConfig> = {
    gpa: {
        label: 'Cumulative GPA',
        variant: 'highlight',
    },
    courses: {
        label: 'Courses',
        icon: (
            <FlatIcon>
                <StudiesIcon className="w-4 h-4" />
            </FlatIcon>
        ),
        variant: 'default',
    },
    assessments: {
        label: 'Assessments',
        icon: <ClipboardCheck className="w-4 h-4" />,
        variant: 'default',
    },
    awards: {
        label: 'Awards',
        icon: <Award className="w-4 h-4" />,
        variant: 'default',
    },
    competencies: {
        label: 'Competencies',
        icon: (
            <FlatIcon>
                <SkillsIcon className="w-4 h-4" />
            </FlatIcon>
        ),
        variant: 'default',
    },
    evidence: {
        label: 'Evidence',
        icon: <PaperClip className="w-4 h-4" />,
        variant: 'default',
    },
};

export const StatCard: React.FC<{
    type: StatCardType;
    value: string | number;
    onClick?: () => void;
}> = ({ type, value, onClick }) => {
    const { label, icon, variant } = STAT_CARD_CONFIG[type];
    const cardClasses = `flex flex-col rounded-xl px-2.5 py-2 min-w-[90px] w-full max-w-[48%] sm:w-auto sm:max-w-none text-left transition-colors ${
        variant === 'highlight' ? 'bg-white border border-grayscale-200' : 'bg-grayscale-100/70'
    } ${onClick ? 'cursor-pointer hover:bg-grayscale-100' : 'cursor-default'}`;

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={cardClasses}>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-grayscale-600 mb-0.5">
                    {label}
                </p>
                <div className="flex items-center gap-1">
                    {icon && <span className="text-grayscale-700 shrink-0">{icon}</span>}
                    <p className="text-lg font-bold text-grayscale-900 leading-none">{value}</p>
                </div>
            </button>
        );
    }

    return (
        <div className={cardClasses}>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-grayscale-600 mb-0.5">
                {label}
            </p>
            <div className="flex items-center gap-1">
                {icon && <span className="text-grayscale-700 shrink-0">{icon}</span>}
                <p className="text-lg font-bold text-grayscale-900 leading-none">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;

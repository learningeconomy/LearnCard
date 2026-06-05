import React from 'react';

import type {
    DashboardLearningSnapshot,
    DashboardLearningSnapshotsViewModel,
} from '../DashboardView.types';

type LearningSnapshotsCardProps = {
    vm: NonNullable<DashboardLearningSnapshotsViewModel>;
};

type ToneStyle = {
    label: string;
    text: string;
    iconBg: string;
    Icon: React.FC<{ className?: string }>;
};

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" />
    </svg>
);

const WrenchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L4 17v3h3l5.4-5.3a4 4 0 0 0 5.3-5.4l-2.5 2.5-2.1-.4-.4-2.1 2.5-2.5Z" />
    </svg>
);

const SproutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M12 21V9M12 13c-3 0-6-2-6-6 3 0 6 2 6 6ZM12 11c2.5 0 5-1.7 5-5-2.5 0-5 1.7-5 5Z" />
    </svg>
);

const TONE_STYLES: Record<DashboardLearningSnapshot['tone'], ToneStyle> = {
    strength: {
        label: 'Strongest area',
        text: 'text-emerald-700',
        iconBg: 'bg-emerald-50 text-emerald-600',
        Icon: TrophyIcon,
    },
    weakness: {
        label: 'Needs work',
        text: 'text-amber-700',
        iconBg: 'bg-amber-50 text-amber-600',
        Icon: WrenchIcon,
    },
    growth: {
        label: 'Room for growth',
        text: 'text-grayscale-700',
        iconBg: 'bg-grayscale-100 text-grayscale-700',
        Icon: SproutIcon,
    },
};

const LearningSnapshotsCard: React.FC<LearningSnapshotsCardProps> = ({ vm }) => {
    const { snapshots, onViewAll } = vm;

    return (
        <section className="bg-white rounded-[20px] p-4 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up flex flex-col font-poppins h-full">
            <h2 className="text-xs font-medium tracking-wider text-grayscale-500 uppercase mb-3">
                Learning snapshots
            </h2>

            <div className="flex flex-col gap-3">
                {snapshots.map((snapshot, index) => {
                    const tone = TONE_STYLES[snapshot.tone];
                    const ToneIcon = tone.Icon;

                    return (
                        <div
                            key={`${snapshot.tone}-${index}`}
                            className="flex items-start gap-3 animate-fade-in-up"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <span
                                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${tone.iconBg}`}
                            >
                                <ToneIcon className="w-[18px] h-[18px]" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-[11px] font-semibold uppercase tracking-wider ${tone.text}`}
                                >
                                    {tone.label}
                                </p>
                                <p className="text-sm font-semibold text-grayscale-900 leading-tight mt-0.5">
                                    {snapshot.title}
                                </p>
                                <p className="text-xs text-grayscale-600 leading-relaxed mt-1">
                                    {snapshot.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={onViewAll}
                className="self-start text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors mt-3"
            >
                View insights →
            </button>
        </section>
    );
};

export default LearningSnapshotsCard;

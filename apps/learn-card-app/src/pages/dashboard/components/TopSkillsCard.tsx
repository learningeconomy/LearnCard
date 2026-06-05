import React from 'react';
import type { DashboardTopSkillsViewModel, DashboardSkillCategory } from '../DashboardView.types';

const StemIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3v5.25l-6 10.5a1.5 1.5 0 001.3 2.25h13.9a1.5 1.5 0 001.3-2.25l-6-10.5V3h-4.5z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15h10.5" />
    </svg>
);

const DigitalIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
    </svg>
);

const MedicalIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
    </svg>
);

const CreativeIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.455L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
        />
    </svg>
);

const SocialIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
    </svg>
);

const BusinessIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
        />
    </svg>
);

const DurableIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
    </svg>
);

const AthleticIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
    </svg>
);

const TradeIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
        />
    </svg>
);

const DefaultIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
    </svg>
);

const getCategoryConfig = (category: DashboardSkillCategory | null) => {
    switch (category) {
        case 'stem':
            return {
                colors: {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    barBg: 'bg-emerald-100',
                    barFill: 'bg-emerald-500',
                },
                Icon: StemIcon,
            };
        case 'digital':
            return {
                colors: {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    barBg: 'bg-emerald-100',
                    barFill: 'bg-emerald-500',
                },
                Icon: DigitalIcon,
            };
        case 'medical':
            return {
                colors: {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    barBg: 'bg-emerald-100',
                    barFill: 'bg-emerald-500',
                },
                Icon: MedicalIcon,
            };

        case 'creative':
            return {
                colors: {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    barBg: 'bg-amber-100',
                    barFill: 'bg-amber-500',
                },
                Icon: CreativeIcon,
            };
        case 'social':
            return {
                colors: {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    barBg: 'bg-amber-100',
                    barFill: 'bg-amber-500',
                },
                Icon: SocialIcon,
            };
        case 'business':
            return {
                colors: {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    barBg: 'bg-amber-100',
                    barFill: 'bg-amber-500',
                },
                Icon: BusinessIcon,
            };

        case 'durable':
            return {
                colors: {
                    bg: 'bg-grayscale-100',
                    text: 'text-grayscale-700',
                    barBg: 'bg-grayscale-200',
                    barFill: 'bg-grayscale-900',
                },
                Icon: DurableIcon,
            };
        case 'athletic':
            return {
                colors: {
                    bg: 'bg-grayscale-100',
                    text: 'text-grayscale-700',
                    barBg: 'bg-grayscale-200',
                    barFill: 'bg-grayscale-900',
                },
                Icon: AthleticIcon,
            };
        case 'trade':
            return {
                colors: {
                    bg: 'bg-grayscale-100',
                    text: 'text-grayscale-700',
                    barBg: 'bg-grayscale-200',
                    barFill: 'bg-grayscale-900',
                },
                Icon: TradeIcon,
            };

        default:
            return {
                colors: {
                    bg: 'bg-grayscale-100',
                    text: 'text-grayscale-700',
                    barBg: 'bg-grayscale-200',
                    barFill: 'bg-grayscale-900',
                },
                Icon: DefaultIcon,
            };
    }
};

export const TopSkillsCard: React.FC<{ vm: NonNullable<DashboardTopSkillsViewModel> }> = ({
    vm,
}) => {
    if (!vm || !vm.skills) return null;

    const maxCount = Math.max(...vm.skills.map(s => s.count), 1);

    return (
        <section className="flex flex-col bg-white rounded-[20px] shadow-soft-bottom border border-grayscale-200 animate-fade-in-up font-poppins h-full p-4">
            <h2 className="text-xs font-medium tracking-wider text-grayscale-500 uppercase mb-3">
                Top skills
            </h2>

            {vm.skills.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-grayscale-400">
                    No skills yet
                </div>
            ) : (
                <div className="flex flex-col gap-5 flex-1">
                    {vm.skills.map((skill, index) => {
                        const isTop = index === 0;
                        const { colors, Icon } = getCategoryConfig(skill.category);
                        const percentage = Math.min(
                            100,
                            Math.max(0, (skill.count / maxCount) * 100)
                        );

                        return (
                            <div
                                key={`${skill.title}-${index}`}
                                className="flex items-start gap-3.5 animate-fade-in-up"
                                style={{
                                    animationDelay: `${index * 80}ms`,
                                    animationFillMode: 'both',
                                }}
                            >
                                <div
                                    className={`shrink-0 flex items-center justify-center ${
                                        isTop ? 'w-12 h-12 rounded-2xl' : 'w-10 h-10 rounded-xl'
                                    } ${colors.bg} ${colors.text}`}
                                >
                                    <Icon className={isTop ? 'w-6 h-6' : 'w-5 h-5'} />
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center pt-0.5">
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <span
                                            className={`truncate ${
                                                isTop
                                                    ? 'text-base font-semibold text-grayscale-900'
                                                    : 'text-sm font-medium text-grayscale-800'
                                            }`}
                                        >
                                            {skill.title}
                                        </span>
                                        <span className="text-xs font-medium text-grayscale-500 shrink-0">
                                            {skill.count} {skill.count === 1 ? 'cred' : 'creds'}
                                        </span>
                                    </div>

                                    {skill.description && (
                                        <p className="text-xs text-grayscale-500 truncate mb-2">
                                            {skill.description}
                                        </p>
                                    )}

                                    <div
                                        className={`w-full rounded-full overflow-hidden ${
                                            colors.barBg
                                        } ${isTop ? 'h-2' : 'h-1.5'} ${
                                            !skill.description ? 'mt-1.5' : ''
                                        }`}
                                    >
                                        <div
                                            className={`h-full rounded-full ${colors.barFill} transition-all duration-1000 ease-out`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <button
                onClick={vm.onViewAll}
                className="self-start text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors mt-auto pt-5"
            >
                View all skills →
            </button>
        </section>
    );
};

export default TopSkillsCard;

import React from 'react';
import { IonIcon } from '@ionic/react';
import { shieldCheckmarkOutline } from 'ionicons/icons';
import { formatDistanceToNow } from 'date-fns';

import type {
    DashboardLearningProfileViewModel,
    DashboardProfileSkill,
} from '../DashboardView.types';
import Trophy from 'learn-card-base/svgs/Trophy';
import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';

type LearningProfileCardProps = {
    vm: DashboardLearningProfileViewModel;
};

const LearningProfileCard: React.FC<LearningProfileCardProps> = ({ vm }) => {
    const { state, strength, verifiedRecords, skills, updatedAt, onViewInsights } = vm;

    const renderSkillPill = (skill: DashboardProfileSkill, index: number) => {
        let tierClasses = 'bg-grayscale-100 text-grayscale-600';
        let tierLabel = 'Growing';
        let filledBars = 1;
        let barColor = 'bg-grayscale-400';

        if (skill.strengthTier === 'strongest') {
            tierClasses = 'bg-emerald-600 text-white';
            tierLabel = 'Strongest';
            filledBars = 3;
            barColor = 'bg-emerald-600';
        } else if (skill.strengthTier === 'strong') {
            tierClasses = 'bg-emerald-50 text-emerald-700';
            tierLabel = 'Strong';
            filledBars = 2;
            barColor = 'bg-emerald-500';
        }

        return (
            <div
                key={skill.name}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border border-grayscale-200 bg-white animate-pop-in opacity-0"
                style={{ animationDelay: `${index * 100}ms` }}
            >
                <SkillsIcon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium text-grayscale-900">{skill.title}</span>

                <div className="flex items-center gap-1.5 ml-1">
                    <div className="flex items-end gap-0.5 h-2.5">
                        {[1, 2, 3].map(bar => (
                            <div
                                key={bar}
                                className={`w-1 rounded-full ${
                                    bar <= filledBars ? barColor : 'bg-grayscale-200'
                                }`}
                                style={{ height: `${40 + bar * 20}%` }}
                            />
                        ))}
                    </div>
                    <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierClasses}`}
                    >
                        {tierLabel}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <section className="bg-white rounded-[20px] p-5 desktop:p-6 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up font-poppins w-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                    Your Learning Profile
                </h2>
                {updatedAt && state !== 'empty' && (
                    <span className="text-[11px] text-grayscale-400">
                        Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
                    </span>
                )}
            </div>

            {state === 'empty' ? (
                <div className="flex flex-col gap-4 mt-1">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl border border-dashed border-grayscale-200 bg-grayscale-10 text-grayscale-300 flex items-center justify-center shrink-0">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                Add a course to reveal your strengths.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dashed border-grayscale-200 bg-grayscale-10 animate-pulse-opacity"
                                style={{ animationDelay: `${i * 150}ms` }}
                            >
                                <div className="w-3 h-3 rounded-full bg-grayscale-200" />
                                <div className="w-12 h-2 rounded-full bg-grayscale-200" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4 mt-1">
                    {state === 'early' && (
                        <div className="self-start bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5">
                            Early read
                        </div>
                    )}

                    {strength ? (
                        <div className="relative overflow-hidden rounded-xl -mx-2 p-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer z-10 pointer-events-none" />
                            <div className="flex items-start gap-3 relative z-0">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <p className="text-base text-grayscale-900 font-semibold leading-snug">
                                        You're strongest in{' '}
                                        <span className="text-emerald-700">{strength.title}</span>.
                                    </p>
                                    {strength.summary && (
                                        <p className="text-sm text-grayscale-600 truncate mt-0.5">
                                            {strength.summary}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-grayscale-600">
                            Your learning profile takes shape as you add courses, achievements, and
                            experiences.
                        </p>
                    )}

                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, idx) => renderSkillPill(skill, idx))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-grayscale-100 mt-1">
                {state !== 'empty' ? (
                    <div className="flex items-center gap-1.5">
                        <IonIcon
                            icon={shieldCheckmarkOutline}
                            className="text-grayscale-400 text-sm"
                        />
                        <span className="text-[11px] font-medium text-grayscale-500">
                            Grounded in {verifiedRecords} verified{' '}
                            {verifiedRecords === 1 ? 'record' : 'records'}
                        </span>
                    </div>
                ) : (
                    <div />
                )}

                <button
                    onClick={onViewInsights}
                    className="text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors ml-auto"
                >
                    View insights &rarr;
                </button>
            </div>
        </section>
    );
};

export default LearningProfileCard;

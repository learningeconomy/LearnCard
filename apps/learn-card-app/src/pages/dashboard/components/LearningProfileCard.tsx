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
        let tierClasses = 'bg-grayscale-100 text-grayscale-700';
        let tierLabel = 'Growing';
        if (skill.strengthTier === 'strongest') {
            tierClasses = 'bg-emerald-50 text-emerald-700';
            tierLabel = 'Strongest';
        } else if (skill.strengthTier === 'strong') {
            tierClasses = 'bg-emerald-50 text-emerald-700';
            tierLabel = 'Strong';
        }

        return (
            <div
                key={skill.name}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border border-grayscale-200 bg-white"
                style={{ animationDelay: `${index * 100}ms` }}
            >
                <SkillsIcon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium text-grayscale-900">{skill.title}</span>
                <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierClasses}`}
                >
                    {tierLabel}
                </span>
            </div>
        );
    };

    return (
        <section className="bg-white rounded-[20px] p-4 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up font-poppins w-full flex flex-col gap-3">
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
                <p className="text-sm text-grayscale-600">
                    Your learning profile takes shape as you add courses, achievements, and
                    experiences.
                </p>
            ) : (
                <div className="flex flex-col gap-3">
                    {state === 'early' && (
                        <div className="self-start bg-amber-50 text-amber-700 text-[10px] font-semibold uppercase rounded-full px-2 py-0.5">
                            Early read
                        </div>
                    )}

                    {strength ? (
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 text-emerald-500 shrink-0">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-grayscale-900 font-medium leading-snug">
                                    You're strongest in {strength.title}.
                                </p>
                                {strength.summary && (
                                    <p className="text-sm text-grayscale-600 truncate">
                                        {strength.summary}
                                    </p>
                                )}
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

import React from 'react';
import type { PathwayNode } from '../../pathways/types';

import * as m from '../../../paraglide/messages.js';

type GoalSummary = {
    title: string;
    goal: string;
    total: number;
    completed: number;
    nextNode: PathwayNode | null;
    pathwayId: string;
    goals?: string[];
} | null;

type CurrentGoalCardProps = {
    goalSummary: GoalSummary;
    pathwaysEnabled: boolean;
    reviewsDueToday: number;
    onContinue: () => void;
    onReview?: () => void;
    primaryButtonClass?: string;
    variant?: 'default' | 'hero';
};

const DEFAULT_PRIMARY_BUTTON = 'bg-grayscale-900 text-white';

const ProgressSegments: React.FC<{ total: number; completed: number }> = ({ total, completed }) => {
    if (total <= 0) return null;
    return (
        <div className="flex gap-1.5 flex-1 min-w-0">
            {Array.from({ length: total }).map((_, i) => {
                const isComplete = i < completed;
                const isCurrent = i === completed;
                return (
                    <span
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-colors ${
                            isComplete
                                ? 'bg-grayscale-900'
                                : isCurrent
                                ? 'bg-grayscale-300'
                                : 'bg-grayscale-100'
                        }`}
                    />
                );
            })}
        </div>
    );
};

const CurrentGoalCard: React.FC<CurrentGoalCardProps> = ({
    goalSummary,
    pathwaysEnabled,
    reviewsDueToday,
    onContinue,
    onReview,
    primaryButtonClass = DEFAULT_PRIMARY_BUTTON,
    variant = 'default',
}) => {
    const isHero = variant === 'hero';
    const buttonClass = `mt-4 w-full py-3 px-4 rounded-[20px] font-medium text-sm hover:opacity-90 transition-opacity ${primaryButtonClass}`;
    if (!goalSummary) {
        if (isHero) {
            return (
                <section className="relative overflow-hidden rounded-[20px] p-6 desktop:p-8 bg-gradient-to-br from-grayscale-900 via-grayscale-800 to-grayscale-900 text-white shadow-soft-bottom animate-fade-in-up">
                    <span
                        aria-hidden
                        className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-indigo-500/20 blur-2xl"
                    />
                    <div className="relative">
                        <p className="text-[11px] font-medium tracking-[0.14em] text-white/60 uppercase">
                            {m['dashboard.currentGoal.label']()}
                        </p>
                        <h2 className="mt-1 text-2xl desktop:text-3xl font-semibold leading-tight">
                            {m['dashboard.currentGoal.emptyHeroTitle']()}
                        </h2>
                        <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-md">
                            {m['dashboard.currentGoal.emptyHeroSubtitle']()}
                        </p>
                        <button
                            type="button"
                            onClick={onContinue}
                            className={`mt-5 inline-flex w-full desktop:w-auto justify-center py-3 px-6 rounded-[20px] font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.99] ${primaryButtonClass}`}
                        >
                            {pathwaysEnabled
                                ? m['dashboard.currentGoal.startJourney']()
                                : m['dashboard.currentGoal.startPathway']()}
                        </button>
                    </div>
                </section>
            );
        }
        return (
            <section className="bg-white rounded-[20px] p-5 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
                <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                    {m['dashboard.currentGoal.label']()}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-grayscale-900">
                    {m['dashboard.currentGoal.emptyTitle']()}
                </h2>
                <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                    {m['dashboard.currentGoal.emptySubtitle']()}
                </p>
                <button type="button" onClick={onContinue} className={buttonClass}>
                    {pathwaysEnabled
                        ? m['dashboard.currentGoal.startJourney']()
                        : m['dashboard.currentGoal.startPathway']()}
                </button>
            </section>
        );
    }

    const { title, goal, total, completed, nextNode, goals } = goalSummary;
    const hasGoalsList = goals && goals.length > 0;

    if (isHero) {
        if (hasGoalsList) {
            const [primaryGoal, ...secondaryGoals] = goals;
            return (
                <section className="relative overflow-hidden rounded-[20px] p-6 desktop:p-8 bg-gradient-to-br from-grayscale-900 via-grayscale-800 to-grayscale-900 text-white shadow-soft-bottom animate-fade-in-up">
                    <span
                        aria-hidden
                        className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl"
                    />
                    <div className="relative">
                        <p className="text-[11px] font-medium tracking-[0.14em] text-white/60 uppercase">
                            {goals.length === 1 ? 'Current goal' : 'Current goals'}
                        </p>
                        <h2 className="mt-1 text-2xl desktop:text-3xl font-semibold leading-tight">
                            {primaryGoal}
                        </h2>

                        {secondaryGoals.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {secondaryGoals.map((g, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white/90"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                                        {g}
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onContinue}
                            className={`mt-5 w-full py-3 px-4 rounded-[20px] font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.99] ${primaryButtonClass}`}
                        >
                            {pathwaysEnabled
                                ? nextNode
                                    ? 'Continue journey'
                                    : 'Open journey'
                                : 'Navigate pathways'}
                        </button>
                    </div>
                </section>
            );
        }

        return (
            <section className="relative overflow-hidden rounded-[20px] p-6 desktop:p-8 bg-gradient-to-br from-grayscale-900 via-grayscale-800 to-grayscale-900 text-white shadow-soft-bottom animate-fade-in-up">
                <span
                    aria-hidden
                    className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-2xl"
                />
                <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-medium tracking-[0.14em] text-white/60 uppercase">
                            {m['dashboard.currentGoal.label']()}
                        </p>
                        {reviewsDueToday > 0 && (
                            <button
                                type="button"
                                onClick={onReview}
                                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/25 text-indigo-100 text-xs font-medium hover:bg-indigo-500/35 transition-colors"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                                {m['dashboard.currentGoal.dueToday']({ count: reviewsDueToday })}
                            </button>
                        )}
                    </div>
                    <h2 className="mt-1 text-2xl desktop:text-3xl font-semibold leading-tight">
                        {title}
                    </h2>
                    {goal && (
                        <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
                            {goal}
                        </p>
                    )}

                    {total > 0 && (
                        <div className="mt-5 flex items-center gap-3">
                            <div className="flex gap-1.5 flex-1 min-w-0">
                                {Array.from({ length: total }).map((_, i) => {
                                    const isComplete = i < completed;
                                    const isCurrent = i === completed;
                                    return (
                                        <span
                                            key={i}
                                            className={`h-2 flex-1 rounded-full transition-colors ${
                                                isComplete
                                                    ? 'bg-white'
                                                    : isCurrent
                                                    ? 'bg-white/40'
                                                    : 'bg-white/15'
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                            <span className="shrink-0 text-xs text-white/80 font-medium">
                                {m['dashboard.currentGoal.progress']({ completed, total })}
                            </span>
                        </div>
                    )}

                    {nextNode && (
                        <div className="mt-5 bg-white/10 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-sm">
                            <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-indigo-300 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium tracking-[0.14em] text-white/60 uppercase">
                                    {m['dashboard.currentGoal.nextStep']()}
                                </p>
                                <p className="mt-1 text-sm font-medium leading-relaxed">
                                    {nextNode.title}
                                </p>
                                {nextNode.description && (
                                    <p className="mt-1 text-xs text-white/70 leading-relaxed line-clamp-2">
                                        {nextNode.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onContinue}
                        className={`mt-5 w-full py-3 px-4 rounded-[20px] font-semibold text-sm hover:opacity-90 transition-opacity active:scale-[0.99] ${primaryButtonClass}`}
                    >
                        {pathwaysEnabled
                            ? nextNode
                                ? m['dashboard.currentGoal.continueJourney']()
                                : m['dashboard.currentGoal.openJourney']()
                            : m['dashboard.currentGoal.navigatePathways']()}
                    </button>
                </div>
            </section>
        );
    }

    if (hasGoalsList) {
        const [primaryGoal, ...secondaryGoals] = goals;
        return (
            <section className="bg-white rounded-[20px] p-5 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
                <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                    {goals.length === 1 ? 'Current goal' : 'Current goals'}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-grayscale-900 leading-tight">
                    {primaryGoal}
                </h2>

                {secondaryGoals.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {secondaryGoals.map((g, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-grayscale-100 text-xs font-medium text-grayscale-700"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-grayscale-900 shrink-0" />
                                {g}
                            </span>
                        ))}
                    </div>
                )}

                <button type="button" onClick={onContinue} className={buttonClass}>
                    {pathwaysEnabled
                        ? nextNode
                            ? 'Continue journey'
                            : 'Open journey'
                        : 'Navigate pathways'}
                </button>
            </section>
        );
    }

    return (
        <section className="bg-white rounded-[20px] p-5 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
            <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                Current goal
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-grayscale-900 leading-tight flex-1 min-w-0">
                    {title}
                </h2>
                {reviewsDueToday > 0 && (
                    <button
                        type="button"
                        onClick={onReview}
                        className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {m['dashboard.currentGoal.dueToday']({ count: reviewsDueToday })}
                    </button>
                )}
            </div>
            {goal && <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">{goal}</p>}

            {total > 0 && (
                <div className="mt-5 flex items-center gap-3">
                    <ProgressSegments total={total} completed={completed} />
                    <span className="shrink-0 text-xs text-grayscale-600 font-medium">
                        {m['dashboard.currentGoal.progressSteps']({ completed, total })}
                    </span>
                </div>
            )}

            {nextNode && (
                <div className="mt-4 bg-grayscale-100 rounded-2xl p-4 flex items-start gap-3">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-grayscale-900 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                            {m['dashboard.currentGoal.nextStep']()}
                        </p>
                        <p className="mt-1 text-sm text-grayscale-900 font-medium leading-relaxed">
                            {nextNode.title}
                        </p>
                        {nextNode.description && (
                            <p className="mt-1 text-xs text-grayscale-600 leading-relaxed line-clamp-2">
                                {nextNode.description}
                            </p>
                        )}
                    </div>
                </div>
            )}

            <button type="button" onClick={onContinue} className={buttonClass}>
                {pathwaysEnabled
                    ? nextNode
                        ? m['dashboard.currentGoal.continueJourney']()
                        : m['dashboard.currentGoal.openJourney']()
                    : m['dashboard.currentGoal.navigatePathways']()}
            </button>
        </section>
    );
};

export default CurrentGoalCard;

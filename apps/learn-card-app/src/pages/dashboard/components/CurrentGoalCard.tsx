import React from 'react';
import type { PathwayNode } from '../../pathways/types';

type GoalSummary = {
    title: string;
    goal: string;
    total: number;
    completed: number;
    nextNode: PathwayNode | null;
    pathwayId: string;
} | null;

type CurrentGoalCardProps = {
    goalSummary: GoalSummary;
    pathwaysEnabled: boolean;
    reviewsDueToday: number;
    onContinue: () => void;
    onReview?: () => void;
    primaryButtonClass?: string;
};

const DEFAULT_PRIMARY_BUTTON =
    'bg-grayscale-900 text-white';

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
}) => {
    const buttonClass = `mt-4 w-full py-3 px-4 rounded-[20px] font-medium text-sm hover:opacity-90 transition-opacity ${primaryButtonClass}`;
    if (!goalSummary) {
        return (
            <section className="bg-white rounded-[20px] p-5 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
                <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                    Current goal
                </p>
                <h2 className="mt-1 text-lg font-semibold text-grayscale-900">
                    No active journey yet
                </h2>
                <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                    Set a goal and we&apos;ll help you build the path to get there.
                </p>
                {pathwaysEnabled && (
                    <button type="button" onClick={onContinue} className={buttonClass}>
                        Start a journey
                    </button>
                )}
            </section>
        );
    }

    const { title, goal, total, completed, nextNode } = goalSummary;

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
                        {reviewsDueToday} due today
                    </button>
                )}
            </div>
            {goal && <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">{goal}</p>}

            {total > 0 && (
                <div className="mt-5 flex items-center gap-3">
                    <ProgressSegments total={total} completed={completed} />
                    <span className="shrink-0 text-xs text-grayscale-600 font-medium">
                        {completed} of {total} steps complete
                    </span>
                </div>
            )}

            {nextNode && (
                <div className="mt-4 bg-grayscale-100 rounded-2xl p-4 flex items-start gap-3">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-grayscale-900 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                            Next step
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

            {pathwaysEnabled && (
                <button type="button" onClick={onContinue} className={buttonClass}>
                    {nextNode ? 'Continue journey' : 'Open journey'}
                </button>
            )}
        </section>
    );
};

export default CurrentGoalCard;

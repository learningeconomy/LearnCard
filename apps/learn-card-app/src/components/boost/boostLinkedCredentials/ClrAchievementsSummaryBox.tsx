import React, { useState } from 'react';

type ClrAchievement = {
    id?: string;
    type?: string[];
    name?: string;
    description?: string;
    achievementType?: string;
    criteria?: { narrative?: string };
};

type ClrAssociation = {
    type?: string[];
    associationType?: string;
    sourceId?: string;
    targetId?: string;
};

type ClrAchievementsSummaryBoxProps = {
    achievements: ClrAchievement[];
    associations?: ClrAssociation[];
};

// Human-readable labels for CLR 2.0 association types
const ASSOCIATION_LABELS: Record<string, string> = {
    isChildOf: 'Child of',
    isPartOf: 'Part of',
    isRelatedTo: 'Related to',
    isPeerOf: 'Peer of',
    isEnabledBy: 'Requires',
    precedes: 'Precedes',
    replacedBy: 'Replaced by',
};

const ClrAchievementsSummaryBox: React.FC<ClrAchievementsSummaryBoxProps> = ({
    achievements,
    associations = [],
}) => {
    const [expanded, setExpanded] = useState(false);

    if (!achievements || achievements.length === 0) return null;

    // Build a name lookup map: achievement id → name
    const achievementNameById = new Map<string, string>(
        achievements
            .filter(a => a.id)
            .map(a => [a.id!, a.name || 'Unnamed Achievement'])
    );

    // Build a map: achievement id → outgoing associations
    const outgoingBySource = new Map<string, ClrAssociation[]>();
    for (const assoc of associations) {
        if (!assoc.sourceId) continue;
        const existing = outgoingBySource.get(assoc.sourceId) ?? [];
        outgoingBySource.set(assoc.sourceId, [...existing, assoc]);
    }

    const visibleAchievements = expanded ? achievements : achievements.slice(0, 3);
    const hasMore = achievements.length > 3;

    return (
        <div className="bg-white flex flex-col items-start gap-[12px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full">
            <div className="w-full flex items-center justify-between gap-[8px]">
                <h3 className="text-[17px] text-grayscale-900 font-poppins">Achievements</h3>
                <span className="text-[11px] leading-[16px] font-semibold uppercase text-grayscale-600 bg-grayscale-100 rounded-[999px] px-[8px] py-[2px]">
                    {achievements.length} item{achievements.length === 1 ? '' : 's'}
                </span>
            </div>

            <div className="w-full flex flex-col gap-[10px]">
                {visibleAchievements.map((achievement, index) => {
                    const outgoing = achievement.id
                        ? (outgoingBySource.get(achievement.id) ?? [])
                        : [];

                    return (
                        <div
                            key={achievement.id || index}
                            className="bg-grayscale-100 rounded-[14px] px-[12px] py-[10px] flex flex-col gap-[4px] border border-grayscale-200"
                        >
                            <p className="text-grayscale-900 text-[13px] font-semibold leading-[17px]">
                                {achievement.name || 'Unnamed Achievement'}
                            </p>
                            {achievement.achievementType && (
                                <p className="text-grayscale-600 text-[10px] leading-[14px] font-semibold uppercase tracking-[0.4px]">
                                    {achievement.achievementType}
                                </p>
                            )}
                            {achievement.description && (
                                <p className="text-grayscale-700 text-[11px] font-normal leading-[15px] line-clamp-2">
                                    {achievement.description}
                                </p>
                            )}
                            {achievement.criteria?.narrative && (
                                <p className="text-grayscale-600 text-[10px] font-normal leading-[14px] line-clamp-2 mt-[2px] italic">
                                    Criteria: {achievement.criteria.narrative}
                                </p>
                            )}
                            {outgoing.length > 0 && (
                                <div className="flex flex-col gap-[3px] mt-[4px] pt-[6px] border-t border-grayscale-200">
                                    {outgoing.map((assoc, i) => {
                                        const label =
                                            ASSOCIATION_LABELS[assoc.associationType ?? ''] ??
                                            assoc.associationType ??
                                            'Related to';
                                        const targetName = assoc.targetId
                                            ? (achievementNameById.get(assoc.targetId) ??
                                              assoc.targetId)
                                            : '—';
                                        return (
                                            <p
                                                key={i}
                                                className="text-grayscale-500 text-[10px] leading-[14px] font-medium"
                                            >
                                                <span className="text-grayscale-700 font-semibold">
                                                    {label}:
                                                </span>{' '}
                                                {targetName}
                                            </p>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {hasMore && (
                <button
                    onClick={() => setExpanded(prev => !prev)}
                    className="text-[13px] font-semibold text-grayscale-600 underline self-center"
                >
                    {expanded ? 'Show less' : `Show ${achievements.length - 3} more`}
                </button>
            )}
        </div>
    );
};

export default ClrAchievementsSummaryBox;

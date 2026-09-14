import React from 'react';

import { ChevronRight, Award } from 'lucide-react';

import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import { formatAchievementType } from './clr.helpers';

import type { AwardDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrAwardsSection: React.FC<{
    awards: AwardDisplayModel[];
    onSelectAward?: (award: AwardDisplayModel) => void;
    adminMode?: boolean;
}> = ({ awards, onSelectAward, adminMode = false }) => {
    if (awards.length === 0) return null;

    return (
        <div id="awards" className="space-y-3 scroll-mt-6">
            <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2 mb-4">
                <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                    Awards & Recognitions
                </p>
                <p className="text-xs text-grayscale-500">
                    {awards.length} award{awards.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="bg-white border border-grayscale-200 rounded-[20px] overflow-hidden">
                {awards.map(award => (
                    <button
                        key={award.sourceCredentialId}
                        type="button"
                        className="w-full flex items-center gap-4 px-3 sm:px-5 py-4 border-b border-grayscale-100 last:border-0 text-left odd:bg-white even:bg-grayscale-50 transition-colors"
                        onClick={() => onSelectAward?.(award)}
                        disabled={!onSelectAward}
                    >
                        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-grayscale-900 leading-snug">
                                {award.name?.value ?? 'Award'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-grayscale-500 flex-wrap">
                                <span>{formatAchievementType(award.achievementType.value)}</span>
                                {adminMode && award.earnedAt?.value && (
                                    <>
                                        <span className="text-grayscale-300">•</span>
                                        <span>{formatClrDate(award.earnedAt.value)}</span>
                                    </>
                                )}
                            </div>
                            {award.description?.value && (
                                <p className="text-xs text-grayscale-600 leading-relaxed mt-1.5 line-clamp-2">
                                    {award.description.value}
                                </p>
                            )}
                        </div>

                        {onSelectAward && (
                            <ChevronRight className="w-5 h-5 text-grayscale-400 shrink-0" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ClrAwardsSection;

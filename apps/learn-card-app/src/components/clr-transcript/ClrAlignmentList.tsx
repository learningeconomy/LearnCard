import React from 'react';

import { Target, ExternalLink } from 'lucide-react';

import type { AlignmentDisplayModel } from '../../helpers/clrRenderer.helpers';

/**
 * Renders a record's `achievement.alignment[]` entries — the CLR/OB mechanism for tying
 * an achievement (course, degree, competency) to an external competency framework node.
 */
const ClrAlignmentList: React.FC<{
    alignments: AlignmentDisplayModel[];
    title?: string;
}> = ({ alignments, title = 'Aligned Competencies & Frameworks' }) => {
    if (alignments.length === 0) return null;

    return (
        <div className="bg-white border border-grayscale-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-grayscale-500" />
                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                    {title}
                </p>
            </div>
            <div className="space-y-2">
                {alignments.map((alignment, index) => {
                    const name =
                        alignment.targetName?.value ??
                        alignment.targetCode?.value ??
                        'Framework alignment';
                    const url = alignment.targetUrl?.value;

                    return (
                        <div
                            key={`${name}-${index}`}
                            className="rounded-xl border border-grayscale-200 bg-grayscale-50 px-3.5 py-3 space-y-1"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-grayscale-900 leading-snug">
                                    {name}
                                </p>
                                {url && (
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="shrink-0 text-grayscale-400 hover:text-indigo-600"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>

                            {(alignment.targetCode?.value || alignment.targetFramework?.value) && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {alignment.targetCode?.value && (
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[11px] font-medium text-indigo-800">
                                            {alignment.targetCode.value}
                                        </span>
                                    )}
                                    {alignment.targetFramework?.value && (
                                        <span className="text-[11px] text-grayscale-500">
                                            {alignment.targetFramework.value}
                                        </span>
                                    )}
                                </div>
                            )}

                            {alignment.targetDescription?.value && (
                                <p className="text-xs text-grayscale-600 leading-relaxed">
                                    {alignment.targetDescription.value}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ClrAlignmentList;

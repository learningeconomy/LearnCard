import React from 'react';
import { Target, ExternalLink, X, ShieldCheck } from 'lucide-react';

import type { AlignmentTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { isSkillAlignment } from './skillAlignment';

interface AlignmentsShowcaseProps {
    alignments: AlignmentTemplate[];
    onRemove: (id: string) => void;
}

export const AlignmentsShowcase: React.FC<AlignmentsShowcaseProps> = ({ alignments, onRemove }) => {
    const shown = alignments.filter(a => !isSkillAlignment(a));
    if (shown.length === 0) return null;

    const credentialEngine: AlignmentTemplate[] = [];
    const other: AlignmentTemplate[] = [];

    shown.forEach(a => {
        if (
            a.targetType?.value === 'ceterms:Credential' ||
            a.targetFramework?.value === 'Credential Engine Registry'
        ) {
            credentialEngine.push(a);
        } else {
            other.push(a);
        }
    });

    const renderRow = (alignment: AlignmentTemplate, isVerified: boolean) => {
        const name =
            alignment.targetName?.value || alignment.targetCode?.value || 'Framework alignment';
        const url = alignment.targetUrl?.value;

        return (
            <div
                key={alignment.id}
                className={`rounded-xl border px-3.5 py-3 space-y-1 ${
                    isVerified
                        ? 'border-emerald-100 bg-emerald-50'
                        : 'border-grayscale-200 bg-grayscale-50'
                }`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                        <p className="text-sm font-semibold text-grayscale-900 leading-snug">
                            {name}
                        </p>
                        {isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0 mt-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                Verified
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-grayscale-400 hover:text-grayscale-700 transition-colors"
                                onClick={e => e.stopPropagation()}
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => onRemove(alignment.id)}
                            className="text-grayscale-400 hover:text-grayscale-700 transition-colors"
                            aria-label="Remove alignment"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {(alignment.targetCode?.value || alignment.targetFramework?.value) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {alignment.targetCode?.value && (
                            <span className="inline-flex items-center rounded-full bg-grayscale-100 border border-grayscale-200 px-2 py-0.5 text-[11px] font-medium text-grayscale-700">
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
                    <p className="text-xs text-grayscale-600 leading-relaxed line-clamp-3">
                        {alignment.targetDescription.value}
                    </p>
                )}
            </div>
        );
    };

    return (
        <section className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4">
            <div>
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-grayscale-900" />
                    <h3 className="text-base font-semibold text-grayscale-900">Alignments</h3>
                </div>
                <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                    External standards and frameworks this credential maps to.
                </p>
            </div>

            <div className="space-y-4">
                {credentialEngine.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500">Verified source</p>
                        <div className="space-y-2">
                            {credentialEngine.map(a => renderRow(a, true))}
                        </div>
                    </div>
                )}

                {other.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-grayscale-500">
                            Occupations &amp; programs
                        </p>
                        <div className="space-y-2">{other.map(a => renderRow(a, false))}</div>
                    </div>
                )}
            </div>
        </section>
    );
};

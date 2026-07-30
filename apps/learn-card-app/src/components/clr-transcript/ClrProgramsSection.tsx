import React from 'react';
import { formatLocaleDate } from '../../i18n/formatters';

import { CertificateDisplayIcon } from 'learn-card-base';

import type { ProgramDisplayModel } from '../../helpers/clrRenderer.helpers';
import { inferProgramKind, achievementTypeLabel, formatAchievementType } from './clr.helpers';

const ClrProgramsSection: React.FC<{
    programs: ProgramDisplayModel[];
    onSelectProgram: (program: ProgramDisplayModel) => void;
}> = ({ programs, onSelectProgram }) => {
    const primaryType = programs[0]?.achievementType.value ?? 'Program';
    const countLabel = achievementTypeLabel(primaryType, programs.length);
    const formatEarnedAt = (earnedAt?: string): string => {
        if (!earnedAt) return '';

        const date = new Date(earnedAt);
        if (Number.isNaN(date.getTime())) return ` • ${earnedAt}`;

        return ` • ${formatLocaleDate(date, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })}`;
    };

    return (
        <>
            <div className="space-y-3">
                {/* Section header */}
                <div className="flex items-center justify-between px-1 border-b border-grayscale-100 pb-2 mb-4">
                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-widest">
                        Programs
                    </p>
                    <p className="text-xs text-grayscale-500">{countLabel}</p>
                </div>

                {/* Program cards */}
                {programs.map(p => (
                    <div
                        key={p.sourceCredentialId}
                        className="bg-white border border-grayscale-200 rounded-[20px] p-5"
                    >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            {/* Left: name + meta */}
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-sm font-semibold text-grayscale-900 leading-snug break-words">
                                    {p.name?.value ?? 'Program'}
                                </p>
                                <p className="text-xs text-grayscale-500">
                                    {formatAchievementType(p.achievementType.value)}
                                    {formatEarnedAt(p.earnedAt?.value)}
                                </p>
                                {p.description?.value && (
                                    <p className="text-xs text-grayscale-600 leading-relaxed pt-1 break-words">
                                        {p.description.value}
                                    </p>
                                )}
                            </div>

                            {/* Right: View button */}
                            <button
                                onClick={() => onSelectProgram(p)}
                                className="shrink-0 self-end md:self-auto flex items-center gap-1.5 border-[1px] border-solid border-grayscale-100 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-grayscale-800 whitespace-nowrap md:ml-auto"
                            >
                                <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-200" />
                                View {inferProgramKind(p.achievementType.value)}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default ClrProgramsSection;

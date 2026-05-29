import { useState } from 'react';

import { CertificateDisplayIcon } from 'learn-card-base';

import ClrProgramDetailPanel from './ClrProgramDetailPanel';
import { inferProgramKind, achievementTypeLabel, formatAchievementType } from './clr.helpers';

import type { ProgramDisplayModel } from '../../helpers/clrRenderer.helpers';

type Props = {
    programs: ProgramDisplayModel[];
    adminMode?: boolean;
};

const ClrProgramsSection = ({ programs, adminMode = false }: Props) => {
    const [selectedProgram, setSelectedProgram] = useState<ProgramDisplayModel | null>(null);

    const handleSelect = (program: ProgramDisplayModel) => {
        setSelectedProgram(prev =>
            prev?.sourceCredentialId === program.sourceCredentialId ? null : program
        );
    };

    // Derive a concise count label (e.g. "1 Degree", "2 Degrees")
    const primaryType = programs[0]?.achievementType.value ?? 'Program';
    const countLabel = achievementTypeLabel(primaryType, programs.length);

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
                        <div className="flex items-start justify-between gap-4">
                            {/* Left: name + meta */}
                            <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-grayscale-900 leading-snug">
                                    {p.name?.value ?? 'Program'}
                                </p>
                                <p className="text-xs text-grayscale-500">
                                    {formatAchievementType(p.achievementType.value)}
                                    {p.earnedAt?.value && ` • ${p.earnedAt.value}`}
                                </p>
                                {p.description?.value && (
                                    <p className="text-xs text-grayscale-600 leading-relaxed pt-1">
                                        {p.description.value}
                                    </p>
                                )}
                            </div>

                            {/* Right: View button */}
                            <button
                                onClick={() => handleSelect(p)}
                                className="shrink-0 flex items-center gap-1.5 border-[1px] border-solid border-grayscale-100 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-grayscale-800 whitespace-nowrap"
                            >
                                <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-200" />
                                View {inferProgramKind(p.achievementType.value)}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ClrProgramDetailPanel
                program={selectedProgram}
                onClose={() => setSelectedProgram(null)}
                adminMode={adminMode}
            />
        </>
    );
};

export default ClrProgramsSection;

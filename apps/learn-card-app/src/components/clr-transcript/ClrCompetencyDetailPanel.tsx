import React, { useState } from 'react';

import X from '../svgs/X';
import { FlatIcon } from './ClrStatCard';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';

import { useModal } from 'learn-card-base';
import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import type { CompetencyDisplayModel } from '../../helpers/clrRenderer.helpers';

const ClrCompetencyDetailPanel: React.FC<{
    competencies: CompetencyDisplayModel[];
    adminMode?: boolean;
}> = ({ competencies, adminMode = false }) => {
    const { closeModal } = useModal();
    const [open, setOpen] = useState(true);
    const [selectedCompetencyId, setSelectedCompetencyId] = useState(
        competencies[0]?.sourceCredentialId
    );
    const selectedCompetency =
        competencies.find(competency => competency.sourceCredentialId === selectedCompetencyId) ??
        competencies[0];

    const getScaleLabel = (
        result: CompetencyDisplayModel['results'][number]
    ): string | undefined => {
        if (result.valueMin && result.valueMax) {
            return `${result.valueMin.value}–${result.valueMax.value}`;
        }

        if (result.valueMax) {
            return `max ${result.valueMax.value}`;
        }

        if (result.allowedValue && result.allowedValue.value.length > 0) {
            return result.allowedValue.value.join(', ');
        }

        return undefined;
    };

    return (
        <div className="space-y-5 pb-10 h-full bg-grayscale-100 overflow-y-auto">
            {/* Header */}
            <div className="bg-white rounded-b-[15px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <FlatIcon>
                            <SkillsIcon className="w-6 h-6 text-grayscale-600" />
                        </FlatIcon>
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            {competencies.length}{' '}
                            {competencies.length === 1 ? 'Competency' : 'Competencies'}
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="px-5 space-y-4">
                <div className="bg-white border border-grayscale-200 rounded-[15px] shadow-box-bottom overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        className="w-full flex items-center justify-between px-4 py-3.5"
                    >
                        <p className="text-sm font-semibold text-grayscale-900">
                            {competencies.length} Competenc
                            {competencies.length === 1 ? 'y' : 'ies'}
                        </p>
                        <span className="text-grayscale-600 text-xs">
                            {open ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </span>
                    </button>

                    {open && (
                        <div className="px-4 pb-4 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {competencies.map(competency => {
                                    const isSelected =
                                        competency.sourceCredentialId ===
                                        selectedCompetency?.sourceCredentialId;
                                    return (
                                        <button
                                            key={competency.sourceCredentialId}
                                            type="button"
                                            onClick={() =>
                                                setSelectedCompetencyId(
                                                    competency.sourceCredentialId
                                                )
                                            }
                                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                                                isSelected
                                                    ? 'bg-indigo-50 border border-solid border-indigo-200 text-indigo-900'
                                                    : 'bg-grayscale-100 border-grayscale-200 text-grayscale-700 hover:bg-grayscale-100'
                                            }`}
                                        >
                                            <span
                                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                                                    isSelected
                                                        ? 'bg-white/15 text-indigo-900'
                                                        : 'bg-grayscale-100 text-grayscale-500'
                                                }`}
                                            >
                                                <FlatIcon>
                                                    <SkillsIcon className="w-6 h-6 text-grayscale-600" />
                                                </FlatIcon>
                                            </span>
                                            <span className="truncate">
                                                {competency.name?.value ?? 'Competency'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {selectedCompetency && (
                    <div className="bg-white border border-grayscale-200 rounded-[15px] overflow-hidden shadow-box-bottom">
                        <div className="px-5 py-3.5 bg-grayscale-50 border-b border-grayscale-100">
                            <p className="text-[15px] font-semibold text-grayscale-900">
                                {selectedCompetency.name?.value ?? 'Competency'}
                            </p>
                            {selectedCompetency.earnedAt?.value && (
                                <p className="text-xs text-grayscale-500 mt-1">
                                    Earned {formatClrDate(selectedCompetency.earnedAt.value)}
                                </p>
                            )}
                        </div>

                        <div className="px-5 py-4 space-y-3">
                            {selectedCompetency.description?.value && (
                                <p className="text-sm text-grayscale-600 leading-relaxed">
                                    {selectedCompetency.description.value}
                                </p>
                            )}

                            {selectedCompetency.results.length > 0 && (
                                <div className="space-y-3">
                                    {selectedCompetency.results.map((result, index) => {
                                        const scale = getScaleLabel(result);
                                        const label = result.label?.value ?? 'Competency Level';

                                        return (
                                            <div
                                                key={index}
                                                className="rounded-[15px] border border-grayscale-200 bg-white p-4 space-y-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-grayscale-500">
                                                            Category
                                                        </p>
                                                        <p className="text-base font-medium text-grayscale-700 mt-1">
                                                            {label}
                                                            {adminMode &&
                                                                result.resultType?.value && (
                                                                    <span className="text-grayscale-400 ml-1">
                                                                        [{result.resultType.value}]
                                                                    </span>
                                                                )}
                                                        </p>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-grayscale-500">
                                                            Score
                                                        </p>
                                                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900 mt-1">
                                                            {String(result.value.value)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {scale && (
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-grayscale-500 mb-2">
                                                            Scale
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {scale.split(',').map(item => (
                                                                <span
                                                                    key={item.trim()}
                                                                    className="inline-flex items-center rounded-full border border-grayscale-200 bg-grayscale-50 px-3 py-1 text-xs font-medium text-grayscale-600"
                                                                >
                                                                    {item.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {adminMode && (
                                <div className="pt-1 border-t border-grayscale-100">
                                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                                        Source credential
                                    </p>
                                    <p className="text-xs font-mono text-grayscale-400 break-all mt-1">
                                        {selectedCompetency.sourceCredentialId}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClrCompetencyDetailPanel;

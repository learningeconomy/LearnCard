import { useState } from 'react';
import { useModal } from 'learn-card-base';

import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import ClrTranscriptResultsList from './ClrTranscriptResultsList';
import ClrProgramCredentialCollapsible from './ClrProgramCredentialCollapsible';
import { formatAchievementType } from './clr.helpers';
import { FlatIcon } from './ClrStatCard';
import { CertificateDisplayIcon } from 'learn-card-base';
import X from '../svgs/X';

import type { ProgramDisplayModel } from '../../helpers/clrRenderer.helpers';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
    program: ProgramDisplayModel;
    onClose?: () => void;
    adminMode?: boolean;
    issuerName?: string;
};

const ClrProgramDetailPanel = ({ program, adminMode = false, issuerName }: Props) => {
    const { closeModal } = useModal();
    const [resultsOpen, setResultsOpen] = useState(true);

    return (
        <div className="space-y-5 pb-10 h-full bg-grayscale-100">
            {/* Header */}
            <div className="bg-white rounded-b-[30px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            {program.name?.value ?? 'Program Details'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-base leading-none text-grayscale-600">
                                <FlatIcon>
                                    <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-400" />
                                </FlatIcon>
                            </span>
                            <p className="text-sm text-grayscale-600">
                                {formatAchievementType(program.achievementType.value)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={closeModal}
                        className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px] mt-0.5"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="px-5 space-y-5">
                <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden w-full p-4">
                    {/* Description + dates */}
                    {(program.description?.value ||
                        program.earnedAt?.value ||
                        program.validUntil?.value) && (
                        <div className="space-y-2">
                            {program.description?.value && (
                                <div>
                                    <h3 className="text-lg font-medium text-grayscale-900 mb-2">
                                        Description
                                    </h3>
                                    <p className="text-sm text-grayscale-700">
                                        {program.description.value}
                                    </p>
                                </div>
                            )}
                            {(program.earnedAt?.value || program.validUntil?.value) && (
                                <div className="flex gap-4 flex-wrap">
                                    {program.earnedAt?.value && (
                                        <div>
                                            <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                                Awarded
                                            </p>
                                            <p className="text-sm text-grayscale-900">
                                                {formatClrDate(program.earnedAt.value)}
                                            </p>
                                        </div>
                                    )}
                                    {program.validUntil?.value && (
                                        <div>
                                            <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                                Expires
                                            </p>
                                            <p className="text-sm text-grayscale-900">
                                                {formatClrDate(program.validUntil.value)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results collapsible */}
                {program.results.length > 0 && (
                    <div className="bg-white shadow-box-bottom rounded-2xl overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setResultsOpen(o => !o)}
                            className="w-full flex items-center justify-between px-4 py-3.5"
                        >
                            <p className="text-sm font-semibold text-grayscale-900">
                                {program.results.length} Result
                                {program.results.length !== 1 ? 's' : ''}
                            </p>
                            <span className="text-grayscale-600 text-xs">
                                {resultsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </span>
                        </button>
                        {resultsOpen && (
                            <div className="px-4 pb-4">
                                <ClrTranscriptResultsList
                                    results={program.results}
                                    showResultType={adminMode}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Source credential collapsible */}
                <ClrProgramCredentialCollapsible program={program} issuerName={issuerName} />

                {/* Admin provenance */}
                {adminMode && (
                    <>
                        <div className="border-t border-grayscale-200" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                Provenance
                            </p>
                            <p className="text-xs font-mono text-grayscale-400 break-all">
                                {program.sourceCredentialId}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ClrProgramDetailPanel;

import { formatClrDate } from '../../helpers/clrRenderer.helpers';
import ClrTranscriptResultsList from './ClrTranscriptResultsList';

import type { ProgramDisplayModel } from '../../helpers/clrRenderer.helpers';

type Props = {
    program: ProgramDisplayModel | null;
    onClose: () => void;
    adminMode?: boolean;
};

const ClrProgramDetailPanel = ({ program, onClose, adminMode = false }: Props) => {
    return (
        <>
            {program && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}

            <div
                className={`fixed inset-y-0 right-0 w-full max-w-[420px] bg-white border-l border-grayscale-200 shadow-2xl overflow-y-auto z-50 transition-transform duration-200 ease-out ${
                    program ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {program && (
                    <div className="p-5 space-y-5 pb-10">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 pt-1">
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-grayscale-900 leading-tight">
                                    {program.name?.value ?? 'Program Details'}
                                </p>
                                <p className="text-xs text-grayscale-500 mt-0.5">
                                    {program.achievementType.value}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-grayscale-100 text-grayscale-500 text-sm transition-colors mt-0.5"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Description */}
                        {program.description?.value && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                    Description
                                </p>
                                <p className="text-sm text-grayscale-700 leading-relaxed">
                                    {program.description.value}
                                </p>
                            </div>
                        )}

                        {/* Dates */}
                        {(program.earnedAt?.value || program.validUntil?.value) && (
                            <div className="grid grid-cols-2 gap-4">
                                {program.earnedAt?.value && (
                                    <div>
                                        <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide mb-0.5">
                                            Conferred
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

                        {/* Results */}
                        {program.results.length > 0 && (
                            <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-grayscale-600 uppercase tracking-wide">
                                    Results
                                </p>
                                <ClrTranscriptResultsList
                                    results={program.results}
                                    showResultType={adminMode}
                                />
                            </div>
                        )}

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
                )}
            </div>
        </>
    );
};

export default ClrProgramDetailPanel;

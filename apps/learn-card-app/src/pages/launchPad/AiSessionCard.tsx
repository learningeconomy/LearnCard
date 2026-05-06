import React, { useState, useEffect } from 'react';

import { Sparkles, Check, Hourglass, BookOpen, Target, ChevronRight, X } from 'lucide-react';

import {
    ModalTypes,
    useModal,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

import AiSessionAssessmentPreviewContainer from '../../components/ai-assessment/AiSessionAssessmentPreviewContainer';
import { CredentialRecord } from './AppCredentialDashboard';

/**
 * Wraps the AI session preview with a floating close button.
 * The underlying AiSessionAssessmentPreviewContainer does not expose a
 * top-level dismiss affordance on every screen state (e.g., the assessment
 * intro on mobile), so we overlay one that calls the modal's closeModal.
 */
const AiSessionPreviewWithClose: React.FC<{ summaryUri: string }> = ({ summaryUri }) => {
    const { closeModal } = useModal();

    return (
        <div className="relative w-full h-full">
            <button
                type="button"
                onClick={closeModal}
                aria-label="Close AI session"
                className="absolute top-3 right-3 z-50 w-10 h-10 rounded-full bg-white shadow-md
                           flex items-center justify-center text-grayscale-800
                           hover:bg-grayscale-10 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-indigo-400
                           safe-area-top-margin"
            >
                <X className="w-5 h-5" aria-hidden="true" />
            </button>
            <AiSessionAssessmentPreviewContainer summaryUri={summaryUri} />
        </div>
    );
};

interface Skill {
    title: string;
    description?: string;
}

interface SummaryInfo {
    title?: string;
    summary?: string;
    learned?: string[];
    skills?: Skill[];
    nextSteps?: { title: string; description?: string }[];
    reflections?: { title: string; description?: string }[];
}

interface AiSessionCardProps {
    record: CredentialRecord;
    isNew?: boolean;
    index: number;
}

/**
 * Detects whether a credential record represents an AI Session summary.
 * Matches on backend category or on the presence of `summaryInfo` in the
 * unwrapped boost credential.
 */
export const isAiSessionSummaryRecord = (record: CredentialRecord): boolean => {
    if (record.boostCategory === 'ai-summary' || record.boostCategory === 'AI Summary') {
        return true;
    }

    if (record.credential) {
        const unwrapped = unwrapBoostCredential(record.credential);
        if (unwrapped && 'summaryInfo' in unwrapped) return true;
    }

    return false;
};

const AiSessionCard: React.FC<AiSessionCardProps> = ({ record, isNew, index }) => {
    const [isAnimating, setIsAnimating] = useState(isNew);
    const { newModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();

    useEffect(() => {
        if (isNew) {
            const timer = setTimeout(() => setIsAnimating(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    const unwrapped = record.credential ? unwrapBoostCredential(record.credential) : undefined;
    const summaryInfo = (unwrapped as { summaryInfo?: SummaryInfo } | undefined)?.summaryInfo;

    const title =
        summaryInfo?.title ||
        record.credential?.name ||
        record.boostName ||
        'AI Session Summary';

    const summaryText = summaryInfo?.summary;
    const learnedCount = summaryInfo?.learned?.length ?? 0;
    const skillsCount = summaryInfo?.skills?.length ?? 0;

    const formattedDate = record.dateEarned.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const handleOpenDetails = () => {
        newModal(
            <AiSessionPreviewWithClose summaryUri={record.uri} />,
            {},
            {
                desktop: isDesktop ? ModalTypes.Right : ModalTypes.FullScreen,
                mobile: ModalTypes.Right,
            }
        );
    };

    return (
        <button
            type="button"
            onClick={handleOpenDetails}
            aria-label={`View AI session: ${title}`}
            className={`
                group relative w-full text-left bg-white rounded-xl shadow-sm overflow-hidden
                border border-indigo-100/70
                hover:border-indigo-300 hover:shadow-md
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1
                ${isAnimating ? 'animate-slide-in-right ring-2 ring-indigo-400 ring-opacity-50' : ''}
            `}
            style={{
                animationDelay: isNew ? '0ms' : `${index * 50}ms`,
            }}
        >
            {isNew && (
                <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full animate-pulse font-poppins">
                        NEW
                    </span>
                </div>
            )}

            {/* Gradient accent strip */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* AI icon badge */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold font-poppins text-gray-900 text-[15px] leading-snug line-clamp-2 capitalize">
                                {title}
                            </h4>
                            <ChevronRight
                                className="w-4 h-4 text-gray-300 mt-1 shrink-0 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                                aria-hidden="true"
                            />
                        </div>

                        {summaryText && (
                            <p className="mt-1 text-sm text-gray-600 font-poppins leading-relaxed line-clamp-2">
                                {summaryText}
                            </p>
                        )}

                        {(learnedCount > 0 || skillsCount > 0) && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {learnedCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full font-poppins">
                                        <BookOpen className="w-3 h-3" aria-hidden="true" />
                                        {learnedCount} learned
                                    </span>
                                )}
                                {skillsCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full font-poppins">
                                        <Target className="w-3 h-3" aria-hidden="true" />
                                        {skillsCount} {skillsCount === 1 ? 'skill' : 'skills'}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Footer row */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-poppins">
                            {record.status === 'claimed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                    <Check className="w-3 h-3" aria-hidden="true" />
                                    Claimed
                                </span>
                            )}
                            {record.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                    <Hourglass className="w-3 h-3" aria-hidden="true" />
                                    Pending
                                </span>
                            )}
                            <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                AI Session
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                                Earned {formattedDate}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default AiSessionCard;

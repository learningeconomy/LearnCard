import React, { useState, useEffect } from 'react';

import { useHistory } from 'react-router-dom';
import { Compass, Check, Hourglass, MessagesSquare, ChevronRight } from 'lucide-react';

import { useModal } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

import { CredentialRecord } from './AppCredentialDashboard';

interface TopicInfo {
    title?: string;
    threadId?: string;
}

interface AiTopicCardProps {
    record: CredentialRecord;
    isNew?: boolean;
    index: number;
}

/**
 * Detects whether a credential record represents an AI Topic credential.
 * Matches on backend category or on the presence of `topicInfo` in the
 * unwrapped boost credential.
 */
export const isAiTopicRecord = (record: CredentialRecord): boolean => {
    if (record.boostCategory === 'ai-topic' || record.boostCategory === 'AI Topic') {
        return true;
    }

    if (record.credential) {
        const unwrapped = unwrapBoostCredential(record.credential);
        if (unwrapped && 'topicInfo' in unwrapped) return true;
    }

    return false;
};

const AiTopicCard: React.FC<AiTopicCardProps> = ({ record, isNew, index }) => {
    const [isAnimating, setIsAnimating] = useState(isNew);
    const history = useHistory();
    const { closeAllModals } = useModal();

    useEffect(() => {
        if (isNew) {
            const timer = setTimeout(() => setIsAnimating(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    const unwrapped = record.credential ? unwrapBoostCredential(record.credential) : undefined;
    const topicInfo = (unwrapped as { topicInfo?: TopicInfo } | undefined)?.topicInfo;
    const topicBoostUri =
        (unwrapped as { boostId?: string } | undefined)?.boostId ??
        (record.credential as { boostId?: string } | undefined)?.boostId;

    const title =
        topicInfo?.title ||
        record.credential?.name ||
        record.boostName ||
        'AI Topic';

    const subject = Array.isArray(record.credential?.credentialSubject)
        ? record.credential?.credentialSubject[0]
        : record.credential?.credentialSubject;
    const description = (subject as { description?: string } | undefined)?.description;

    const formattedDate = record.dateEarned.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const handleOpenTopic = () => {
        if (!topicBoostUri) return;
        closeAllModals();
        history.push(`/ai/sessions?topicBoostUri=${encodeURIComponent(topicBoostUri)}`);
    };

    return (
        <button
            type="button"
            onClick={handleOpenTopic}
            disabled={!topicBoostUri}
            aria-label={`View AI topic: ${title}`}
            className={`
                group relative w-full text-left bg-white rounded-xl shadow-sm overflow-hidden
                border border-emerald-100/70
                hover:border-emerald-300 hover:shadow-md
                transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1
                disabled:opacity-70 disabled:cursor-default disabled:hover:shadow-sm disabled:hover:border-emerald-100/70
                ${isAnimating ? 'animate-slide-in-right ring-2 ring-emerald-400 ring-opacity-50' : ''}
            `}
            style={{
                animationDelay: isNew ? '0ms' : `${index * 50}ms`,
            }}
        >
            {isNew && (
                <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse font-poppins">
                        NEW
                    </span>
                </div>
            )}

            {/* Gradient accent strip */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* AI Topic icon badge */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                        <Compass className="w-5 h-5 text-white" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold font-poppins text-gray-900 text-[15px] leading-snug line-clamp-2 capitalize">
                                {title}
                            </h4>
                            {topicBoostUri && (
                                <ChevronRight
                                    className="w-4 h-4 text-gray-300 mt-1 shrink-0 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all"
                                    aria-hidden="true"
                                />
                            )}
                        </div>

                        {description && (
                            <p className="mt-1 text-sm text-gray-600 font-poppins leading-relaxed line-clamp-2">
                                {description}
                            </p>
                        )}

                        {topicBoostUri && (
                            <div className="mt-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full font-poppins">
                                    <MessagesSquare className="w-3 h-3" aria-hidden="true" />
                                    View sessions
                                </span>
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
                                AI Topic
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

export default AiTopicCard;

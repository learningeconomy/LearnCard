import React, { useState } from 'react';
import { XAPIStatement } from './XApiDataFeedModal';
import { useGetDid } from 'learn-card-base/react-query/queries/queries';
import { useCurrentUser } from 'learn-card-base';
import ResultDisplay from './ResultDisplay';

import { ChevronDown, ChevronUp, Code, Clock, User, Zap } from 'lucide-react';

type StatementCardProps = {
    statement: XAPIStatement;
};

const StatementCard: React.FC<StatementCardProps> = ({ statement }) => {
    const [showRawJson, setShowRawJson] = useState(false);

    const getVerbFromId = (verbId?: string): string => {
        if (!verbId) return 'Unknown';

        const verbMap: Record<string, string> = {
            'http://adlnet.gov/expapi/verbs/completed': 'Completed',
            'http://adlnet.gov/expapi/verbs/attempted': 'Attempted',
            'http://adlnet.gov/expapi/verbs/passed': 'Passed',
            'http://adlnet.gov/expapi/verbs/failed': 'Failed',
            'http://adlnet.gov/expapi/verbs/experienced': 'Experienced',
            'http://adlnet.gov/expapi/verbs/progressed': 'Progressed',
            'http://adlnet.gov/expapi/verbs/mastered': 'Mastered',
            'http://adlnet.gov/expapi/verbs/launched': 'Launched',
            'http://adlnet.gov/expapi/verbs/answered': 'Answered',
            'http://adlnet.gov/expapi/verbs/interacted': 'Interacted',
            'http://adlnet.gov/expapi/verbs/registered': 'Registered',
            'http://adlnet.gov/expapi/verbs/voided': 'Voided',
        };

        return verbMap[verbId] ?? verbId.split('/').pop() ?? 'Unknown';
    };

    const formatTimestamp = (timestamp: string): string => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            });
        } catch {
            return timestamp;
        }
    };

    const getVerbStyle = (verb?: string): { bg: string; text: string } => {
        const styles: Record<string, { bg: string; text: string }> = {
            completed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
            passed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
            mastered: { bg: 'bg-blue-100', text: 'text-blue-700' },
            attempted: { bg: 'bg-amber-100', text: 'text-amber-700' },
            progressed: { bg: 'bg-violet-100', text: 'text-violet-700' },
            failed: { bg: 'bg-rose-100', text: 'text-rose-700' },
            experienced: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
            launched: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
            answered: { bg: 'bg-sky-100', text: 'text-sky-700' },
            interacted: { bg: 'bg-teal-100', text: 'text-teal-700' },
            registered: { bg: 'bg-purple-100', text: 'text-purple-700' },
            voided: { bg: 'bg-grayscale-200', text: 'text-grayscale-600' },
        };

        return styles[verb ?? ''] ?? { bg: 'bg-grayscale-100', text: 'text-grayscale-700' };
    };

    const verbDisplay = statement.verb?.display?.['en-US'] ?? getVerbFromId(statement.verb?.id);
    const objectName = statement.object?.definition?.name?.['en-US'] ?? 'Unknown Activity';
    const objectDescription = statement.object?.definition?.description?.['en-US'];
    const actorName = statement.actor?.name ?? 'Unknown User';
    const timestamp = statement?.timestamp ? formatTimestamp(statement?.timestamp) : null;
    const { data: currentUserDidKey } = useGetDid('key');
    const currentUser = useCurrentUser();

    const verbStyle = getVerbStyle(verbDisplay?.toLowerCase());

    return (
        <div className="bg-white border border-grayscale-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${verbStyle.bg} ${verbStyle.text}`}
                    >
                        <Zap className="w-3 h-3" />
                        {verbDisplay}
                    </span>

                    {timestamp && (
                        <span className="flex items-center gap-1 text-xs text-grayscale-500">
                            <Clock className="w-3 h-3" />
                            {timestamp}
                        </span>
                    )}
                </div>
                <h3 className="font-semibold text-grayscale-900 mb-1">{objectName}</h3>

                {objectDescription && (
                    <p className="text-sm text-grayscale-600 mb-3 line-clamp-2">
                        {objectDescription}
                    </p>
                )}

                <div className="flex items-center gap-2 text-xs text-grayscale-500">
                    <User className="w-3.5 h-3.5" />
                    <span>{actorName === currentUserDidKey ? currentUser?.name : actorName}</span>
                </div>

                {statement?.result && <ResultDisplay result={statement?.result} />}
            </div>

            <div className="border-t border-grayscale-100">
                <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-grayscale-600 hover:bg-grayscale-50 transition-colors"
                >
                    <span className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5" />
                        View Raw Data
                    </span>
                    {showRawJson ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>

                {showRawJson && (
                    <div className="px-4 pb-4">
                        <pre className="bg-grayscale-900 text-grayscale-100 p-3 rounded-lg text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                            {JSON.stringify(statement, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatementCard;

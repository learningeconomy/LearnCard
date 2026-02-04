import React, { useState, useRef, useEffect } from 'react';

import { IonSpinner } from '@ionic/react';
import {
    ChevronLeft,
    Activity,
    ChevronDown,
    ChevronUp,
    Code,
    Clock,
    User,
    Zap,
    FlaskConical,
    Eye,
} from 'lucide-react';
import { useXApiStatementsForContract } from 'learn-card-base/hooks/useXApiStatementsForContract';
import { useCurrentUser, useWallet } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { useGetDid } from 'learn-card-base/react-query/queries/queries';

type XApiDataFeedModalProps = {
    contractUri: string;
    contractName: string;
    onBack?: () => void;
};
interface XAPIStatement {
    actor: {
        objectType: 'Agent';
        name: string;
        account: {
            homePage: string;
            name: string;
        };
    };
    verb: {
        id: string;
        display: {
            'en-US': string;
        };
    };
    object: {
        id: string;
        definition: {
            name: { 'en-US': string };
            description: { 'en-US': string };
            type: string;
        };
    };
    result?: {
        success?: boolean;
        completion?: boolean;
        extensions?: Record<string, string>;
    };
    context?: {
        extensions?: Record<string, string>;
    };
}

const XApiDataFeedModal: React.FC<XApiDataFeedModalProps> = ({
    contractUri,
    contractName,
    onBack,
}) => {
    const { data, fetchNextPage, hasNextPage, isFetching, isLoading, refetch } =
        useXApiStatementsForContract(contractUri);
    const { initWallet } = useWallet();
    const [isWritingTestData, setIsWritingTestData] = useState(false);
    const infiniteScrollRef = useRef<HTMLDivElement>(null);
    const onScreen = useOnScreen(infiniteScrollRef as any, '300px', [
        data?.pages?.[0]?.statements?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage && !isFetching) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen, isFetching]);

    const allStatements = data?.pages.flatMap(page => page?.statements ?? []) ?? [];

    const { data: currentUserDidKey } = useGetDid('key');

    const attemptStatement: XAPIStatement[] | null = currentUserDidKey
        ? [
              {
                  actor: {
                      objectType: 'Agent',
                      name: currentUserDidKey,
                      account: {
                          homePage: 'https://www.w3.org/TR/did-core/',
                          name: currentUserDidKey,
                      },
                  },
                  verb: {
                      id: 'http://adlnet.gov/expapi/verbs/attempted',
                      display: {
                          'en-US': 'attempted',
                      },
                  },
                  object: {
                      id: 'http://yourgame.com/activities/level-1-challenge',
                      definition: {
                          name: { 'en-US': 'Level 1 Challenge' },
                          description: { 'en-US': 'First challenge of the game' },
                          type: 'http://adlnet.gov/expapi/activities/simulation',
                      },
                  },
                  context: {
                      extensions: {
                          'https://learncard.com/xapi/extensions/contractUri': contractUri,
                      },
                  },
              },
              {
                  actor: {
                      objectType: 'Agent',
                      name: currentUserDidKey,
                      account: {
                          homePage: 'https://www.w3.org/TR/did-core/',
                          name: currentUserDidKey,
                      },
                  },
                  verb: {
                      id: 'http://adlnet.gov/expapi/verbs/mastered',
                      display: {
                          'en-US': 'mastered',
                      },
                  },
                  object: {
                      id: 'http://yourgame.com/achievements/speed-runner',
                      definition: {
                          name: { 'en-US': 'Speed Runner' },
                          description: { 'en-US': 'Completed level with exceptional speed' },
                          type: 'http://adlnet.gov/expapi/activities/performance',
                      },
                  },
                  result: {
                      success: true,
                      completion: true,
                      extensions: {
                          'http://yourgame.com/xapi/extensions/completion-time': '120_seconds',
                          'http://yourgame.com/xapi/extensions/score': '95',
                      },
                  },
                  context: {
                      extensions: {
                          'https://learncard.com/xapi/extensions/contractUri': contractUri,
                      },
                  },
              },
              {
                  actor: {
                      objectType: 'Agent',
                      name: currentUserDidKey,
                      account: {
                          homePage: 'https://www.w3.org/TR/did-core/',
                          name: currentUserDidKey,
                      },
                  },
                  verb: {
                      id: 'http://adlnet.gov/expapi/verbs/mastered',
                      display: {
                          'en-US': 'mastered',
                      },
                  },
                  object: {
                      id: 'http://yourgame.com/achievements/speed-runner',
                      definition: {
                          name: { 'en-US': 'Speed Runner' },
                          description: { 'en-US': 'Completed level with exceptional speed' },
                          type: 'http://adlnet.gov/expapi/activities/performance',
                      },
                  },
                  context: {
                      extensions: {
                          'https://learncard.com/xapi/extensions/contractUri': contractUri,
                      },
                  },
              },
          ]
        : null;

    const sendXAPIStatement = async (statement: XAPIStatement) => {
        const wallet = await initWallet();
        const vpToken = await wallet?.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        const endpoint =
            typeof LEARN_CLOUD_XAPI_URL === 'string'
                ? LEARN_CLOUD_XAPI_URL
                : typeof CLOUD_URL === 'string'
                ? CLOUD_URL.replace(/\/trpc\/?$/, '/xapi')
                : undefined;

        if (!endpoint) {
            throw new Error('LEARN_CLOUD_XAPI_URL is not configured');
        }

        const response = await fetch(`${endpoint}/statements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Experience-API-Version': '1.0.3',
                'X-VP': vpToken,
            },
            body: JSON.stringify(statement),
        });

        if (response.ok) {
            const data = await response.json();
        } else {
            const errorText = await response.text();
            console.error('❌ Failed:', response.status, errorText);
        }
        return response;
    };

    return (
        <div className="bg-white rounded-l-[20px] h-full w-full max-w-[450px] flex flex-col shadow-xl">
            <div className="flex items-center gap-3 p-4 border-b border-grayscale-100">
                <button
                    onClick={onBack}
                    className="p-1 -ml-1 hover:bg-grayscale-50 rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-grayscale-700" />
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-grayscale-900 truncate">
                            Activity Feed
                        </h2>
                        <p className="text-xs text-grayscale-500 truncate">{contractName}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <IonSpinner name="crescent" className="w-8 h-8 mb-4" />
                        <p className="text-grayscale-600">Loading activity data...</p>
                    </div>
                )}

                {!isLoading && allStatements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-grayscale-100 flex items-center justify-center mb-4">
                            <Activity className="w-8 h-8 text-grayscale-400" />
                        </div>
                        <p className="text-grayscale-700 font-medium">No activity data yet</p>
                        <p className="text-sm text-grayscale-500 mt-1 max-w-[280px]">
                            Activity from this app will appear here when it becomes available.
                        </p>
                    </div>
                )}

                {!isLoading && allStatements.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {allStatements.map((statement, index) => (
                            <StatementCard key={statement.id || index} statement={statement} />
                        ))}

                        {isFetching && (
                            <div className="flex justify-center py-4">
                                <IonSpinner name="crescent" className="w-6 h-6" />
                            </div>
                        )}

                        <div ref={infiniteScrollRef} />
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-grayscale-100 bg-grayscale-50">
                <p className="text-xs text-grayscale-500 text-center mb-2">
                    Showing {allStatements.length} activit{allStatements.length === 1 ? 'y' : 'ies'}{' '}
                    from this app
                </p>

                {/* DEV ONLY: Test buttons - Remove after testing */}
                <div className="flex gap-2">
                    <button
                        onClick={() => attemptStatement?.forEach(s => sendXAPIStatement(s))}
                        disabled={isWritingTestData}
                        className="flex-1 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors disabled:opacity-50"
                    >
                        <FlaskConical className="w-3.5 h-3.5" />
                        {isWritingTestData ? 'Writing...' : 'Write to API'}
                    </button>
                </div>
            </div>
        </div>
    );
};

type StatementCardProps = {
    statement: XAPIStatement;
};

const StatementCard: React.FC<StatementCardProps> = ({ statement }) => {
    const [showRawJson, setShowRawJson] = useState(false);

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

type ResultDisplayProps = {
    result: NonNullable<XAPIStatement['result']>;
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    const hasScore = result.score !== undefined;
    const hasCompletion = result.completion !== undefined;
    const hasSuccess = result.success !== undefined;

    if (!hasScore && !hasCompletion && !hasSuccess) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-grayscale-100">
            {hasScore && result.score?.scaled !== undefined && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-600 font-medium">
                        Score: {Math.round(result.score.scaled * 100)}%
                    </span>
                </div>
            )}

            {hasCompletion && (
                <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        result.completion ? 'bg-emerald-50' : 'bg-amber-50'
                    }`}
                >
                    <span
                        className={`text-xs font-medium ${
                            result.completion ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                    >
                        {result.completion ? 'Completed' : 'In Progress'}
                    </span>
                </div>
            )}

            {hasSuccess && (
                <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                        result.success ? 'bg-emerald-50' : 'bg-rose-50'
                    }`}
                >
                    <span
                        className={`text-xs font-medium ${
                            result.success ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                    >
                        {result.success ? 'Passed' : 'Failed'}
                    </span>
                </div>
            )}
        </div>
    );
};

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

export default XApiDataFeedModal;

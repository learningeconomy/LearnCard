import React, { useState, useRef, useEffect } from 'react';

import { IonSpinner } from '@ionic/react';
import { ChevronLeft, Activity, FlaskConical } from 'lucide-react';
import { useXApiStatementsForContract } from 'learn-card-base/hooks/useXApiStatementsForContract';
import { useWallet } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { useGetDid } from 'learn-card-base/react-query/queries/queries';
import StatementCard from './StatementCard';

type XApiDataFeedModalProps = {
    contractUri: string;
    contractName: string;
    onBack?: () => void;
};
export interface XAPIStatement {
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

export default XApiDataFeedModal;

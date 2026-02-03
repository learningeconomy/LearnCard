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
import {
    useXApiStatementsForContract,
    XAPIStatement,
} from 'learn-card-base/hooks/useXApiStatementsForContract';
import { useWallet } from 'learn-card-base';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import Lottie from 'react-lottie-player';
import { useGetDid } from 'learn-card-base/react-query/queries/queries';

import Pulpo from '../../assets/lotties/cuteopulpo.json';
import { writeTestXApiStatements } from '../../utils/testXApiStatements';

type XApiDataFeedModalProps = {
    contractUri: string;
    contractName: string;
    onBack?: () => void;
};

const MOCK_STATEMENTS: XAPIStatement[] = [
    {
        id: 'mock-1',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-US': 'completed' } },
        object: {
            id: 'http://example.org/activities/intro-to-blockchain',
            definition: {
                name: { 'en-US': 'Introduction to Blockchain Technology' },
                description: {
                    'en-US':
                        'A comprehensive overview of blockchain fundamentals, distributed ledgers, and cryptographic principles.',
                },
                type: 'http://adlnet.gov/expapi/activities/course',
            },
        },
        result: { completion: true, success: true, score: { scaled: 0.92 } },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-2',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: { id: 'http://adlnet.gov/expapi/verbs/passed', display: { 'en-US': 'passed' } },
        object: {
            id: 'http://example.org/activities/digital-credentials-assessment',
            definition: {
                name: { 'en-US': 'Digital Credentials Assessment' },
                description: {
                    'en-US':
                        'Final assessment covering verifiable credentials, DIDs, and credential verification processes.',
                },
                type: 'http://adlnet.gov/expapi/activities/assessment',
            },
        },
        result: { success: true, score: { scaled: 0.88 } },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-3',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: {
            id: 'http://adlnet.gov/expapi/verbs/progressed',
            display: { 'en-US': 'progressed' },
        },
        object: {
            id: 'http://example.org/activities/decentralized-identity-course',
            definition: {
                name: { 'en-US': 'Decentralized Identity Fundamentals' },
                description: {
                    'en-US':
                        'Learning path covering self-sovereign identity, DID methods, and privacy-preserving authentication.',
                },
                type: 'http://adlnet.gov/expapi/activities/course',
            },
        },
        result: { completion: false, score: { scaled: 0.45 } },
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-4',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: { id: 'http://adlnet.gov/expapi/verbs/failed', display: { 'en-US': 'failed' } },
        object: {
            id: 'http://example.org/activities/cryptography-quiz',
            definition: {
                name: { 'en-US': 'Applied Cryptography Quiz' },
                description: {
                    'en-US':
                        'Quiz covering symmetric/asymmetric encryption, digital signatures, and hash functions.',
                },
                type: 'http://adlnet.gov/expapi/activities/assessment',
            },
        },
        result: { success: false, score: { scaled: 0.42 } },
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-5',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: { id: 'http://adlnet.gov/expapi/verbs/mastered', display: { 'en-US': 'mastered' } },
        object: {
            id: 'http://example.org/activities/credential-issuance',
            definition: {
                name: { 'en-US': 'Credential Issuance Best Practices' },
                description: {
                    'en-US':
                        'Advanced techniques for issuing verifiable credentials with proper schemas and revocation support.',
                },
                type: 'http://adlnet.gov/expapi/activities/objective',
            },
        },
        result: { success: true, completion: true, score: { scaled: 0.97 } },
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-6',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: { id: 'http://adlnet.gov/expapi/verbs/attempted', display: { 'en-US': 'attempted' } },
        object: {
            id: 'http://example.org/activities/smart-contract-workshop',
            definition: {
                name: { 'en-US': 'Smart Contract Development Workshop' },
                description: {
                    'en-US':
                        'Hands-on workshop for building and deploying smart contracts on Ethereum.',
                },
                type: 'http://adlnet.gov/expapi/activities/simulation',
            },
        },
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-7',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: { id: 'http://adlnet.gov/expapi/verbs/launched', display: { 'en-US': 'launched' } },
        object: {
            id: 'http://example.org/activities/learning-path-web3',
            definition: {
                name: { 'en-US': 'Web3 Developer Learning Path' },
                description: {
                    'en-US':
                        'Comprehensive curriculum for becoming a Web3 developer, from basics to advanced topics.',
                },
                type: 'http://adlnet.gov/expapi/activities/course',
            },
        },
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'mock-8',
        actor: {
            name: 'Test User',
            account: { homePage: 'https://example.com', name: 'test-user' },
        },
        verb: {
            id: 'http://adlnet.gov/expapi/verbs/experienced',
            display: { 'en-US': 'experienced' },
        },
        object: {
            id: 'http://example.org/activities/wallet-demo',
            definition: {
                name: { 'en-US': 'Digital Wallet Interactive Demo' },
                description: {
                    'en-US':
                        'Interactive demonstration of credential storage, presentation, and verification flows.',
                },
                type: 'http://adlnet.gov/expapi/activities/simulation',
            },
        },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
];

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
    const [useMockData, setUseMockData] = useState(false);
    const infiniteScrollRef = useRef<HTMLDivElement>(null);
    const onScreen = useOnScreen(infiniteScrollRef as any, '300px', [
        data?.pages?.[0]?.statements?.length,
    ]);

    useEffect(() => {
        if (onScreen && hasNextPage && !isFetching) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen, isFetching]);

    const realStatements = data?.pages.flatMap(page => page?.statements ?? []) ?? [];
    const allStatements = useMockData ? MOCK_STATEMENTS : realStatements;

    const { data: currentUserDidKey } = useGetDid('key');

    // Build statement dynamically using the contractUri prop
    const attemptStatement: XAPIStatement | null = currentUserDidKey
        ? {
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
          }
        : null;
    const sendXAPIStatement = async (statement: XAPIStatement) => {
        const wallet = await initWallet();
        const vpToken = await wallet?.invoke.getDidAuthVp({ proofFormat: 'jwt' });
        console.log('vpToken type:', typeof vpToken);
        console.log('vpToken length:', vpToken?.length);

        console.log('vpToken', vpToken);
        // Determine endpoint based on contract network (localhost vs production)
        const endpoint = 'http://localhost:4100/xapi';

        console.log('📝 Sending xAPI statement to:', endpoint);
        console.log('Contract URI:', contractUri);
        console.log('Statement:', statement);

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
            console.log('✅ Statement created! ID:', data?.[0]);
        } else {
            const errorText = await response.text();
            console.error('❌ Failed:', response.status, errorText);
        }
        return response;
    };

    return (
        <div className="bg-white rounded-l-[20px] h-full w-full max-w-[450px] flex flex-col shadow-xl">
            {/* Header */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <IonSpinner name="crescent" className="w-8 h-8 mb-4" />
                        <p className="text-grayscale-600">Loading activity data...</p>
                    </div>
                )}

                {!isLoading && allStatements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-[200px] h-[200px] mt-[-20px]">
                            <Lottie
                                loop
                                animationData={Pulpo}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
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

            {/* Footer */}
            <div className="p-4 border-t border-grayscale-100 bg-grayscale-50">
                <p className="text-xs text-grayscale-500 text-center mb-2">
                    Showing {allStatements.length} activit{allStatements.length === 1 ? 'y' : 'ies'}{' '}
                    from this app
                </p>

                {/* DEV ONLY: Test buttons - Remove after testing */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setUseMockData(!useMockData)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                            useMockData
                                ? 'bg-violet-500 text-white'
                                : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                        }`}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        {useMockData ? 'Hide Mock Data' : 'Show Mock Data'}
                    </button>
                    <button
                        onClick={() => attemptStatement && sendXAPIStatement(attemptStatement)}
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
    const timestamp = statement.timestamp ? formatTimestamp(statement.timestamp) : null;

    const verbStyle = getVerbStyle(verbDisplay?.toLowerCase());

    return (
        <div className="bg-white border border-grayscale-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Main Content */}
            <div className="p-4">
                {/* Verb Badge and Timestamp */}
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

                {/* Activity Name */}
                <h3 className="font-semibold text-grayscale-900 mb-1">{objectName}</h3>

                {/* Description */}
                {objectDescription && (
                    <p className="text-sm text-grayscale-600 mb-3 line-clamp-2">
                        {objectDescription}
                    </p>
                )}

                {/* Actor */}
                <div className="flex items-center gap-2 text-xs text-grayscale-500">
                    <User className="w-3.5 h-3.5" />
                    <span>{actorName}</span>
                </div>

                {/* Result Info (if available) */}
                {statement.result && <ResultDisplay result={statement.result} />}
            </div>

            {/* Raw JSON Toggle */}
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

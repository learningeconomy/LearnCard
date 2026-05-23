import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useGetCurrentLCNUser } from 'learn-card-base';

import { useConsentFlowByUri } from '../../consentFlow/useConsentFlow';

type AgentMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type AgentToolRun = {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    error?: string;
};

type AgentRunResponse = {
    message: string;
    messages: AgentMessage[];
    toolRuns?: AgentToolRun[];
};

type AgentMemoryDoc = {
    name: string;
    kind: 'skill' | 'user-profile' | 'memory' | 'wiki';
    description: string;
    content: string;
    status: 'active' | 'proposed' | 'archived';
    sourceType?: string;
    confidence?: number;
    sensitivity?: 'low' | 'normal' | 'high';
    requiresApproval?: boolean;
    version?: number;
    updatedAt?: string;
    expiresAt?: string;
    listedCount?: number;
    readCount?: number;
};

type AgentMemoryManifest = {
    counts: {
        active: number;
        proposed: number;
        archived: number;
        expired: number;
        visibleToAgent: number;
    };
};

type AgentMemoryResponse = {
    ok: boolean;
    manifest?: AgentMemoryManifest;
    docs?: AgentMemoryDoc[];
    error?: string;
};

type ConsentFlowContractResponse = {
    ok: boolean;
    contract?: {
        uri: string;
        consentUrl: string;
        source: string;
        created: boolean;
    };
    error?: string;
};

const AGENT_URL_STORAGE_KEY = 'learnCardAiAgentDebugUrl';
const DEFAULT_AGENT_URL = 'http://localhost:4300';

const normalizeAgentUrl = (url: string): string => {
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    if (!trimmedUrl) return DEFAULT_AGENT_URL;

    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `http://${trimmedUrl}`;
};

const getInitialAgentUrl = (): string => {
    try {
        return localStorage.getItem(AGENT_URL_STORAGE_KEY) || DEFAULT_AGENT_URL;
    } catch {
        return DEFAULT_AGENT_URL;
    }
};

const AiAgentDebug: React.FC = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const currentDid = currentLCNUser?.did ?? '';
    const [agentUrl, setAgentUrl] = useState(getInitialAgentUrl);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [latestToolRuns, setLatestToolRuns] = useState<AgentToolRun[]>([]);
    const [contractUri, setContractUri] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [memoryManifest, setMemoryManifest] = useState<AgentMemoryManifest | null>(null);
    const [memoryDocs, setMemoryDocs] = useState<AgentMemoryDoc[]>([]);
    const [memoryError, setMemoryError] = useState('');
    const [memoryDescription, setMemoryDescription] = useState('');
    const [memoryContent, setMemoryContent] = useState('');
    const [memoryKind, setMemoryKind] = useState<AgentMemoryDoc['kind']>('memory');
    const [memoryStatus, setMemoryStatus] = useState<'active' | 'proposed'>('proposed');
    const [isFetchingContract, setIsFetchingContract] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isFetchingMemory, setIsFetchingMemory] = useState(false);
    const [isSavingMemory, setIsSavingMemory] = useState(false);
    const [openContractWhenLoaded, setOpenContractWhenLoaded] = useState(false);

    const normalizedAgentUrl = useMemo(() => normalizeAgentUrl(agentUrl), [agentUrl]);
    const { contract, contractLoading, openConsentFlowModal } = useConsentFlowByUri(
        contractUri || undefined
    );
    const sortedMemoryDocs = useMemo(
        () =>
            [...memoryDocs].sort((first, second) => {
                const statusComparison = first.status.localeCompare(second.status);
                if (statusComparison !== 0) return statusComparison;

                const kindComparison = first.kind.localeCompare(second.kind);
                if (kindComparison !== 0) return kindComparison;

                return first.name.localeCompare(second.name);
            }),
        [memoryDocs]
    );

    const handleAgentUrlChange = (url: string): void => {
        setAgentUrl(url);
        setContractUri('');
        setStatus('');
        setError('');
    };

    useEffect(() => {
        try {
            localStorage.setItem(AGENT_URL_STORAGE_KEY, agentUrl);
        } catch {
            // Ignore storage failures in embedded or restricted browser contexts.
        }
    }, [agentUrl]);

    useEffect(() => {
        if (!openContractWhenLoaded || !contractUri || contractLoading || !contract) return;

        openConsentFlowModal(true, undefined, undefined, undefined, true);
        setOpenContractWhenLoaded(false);
    }, [contract, contractLoading, contractUri, openConsentFlowModal, openContractWhenLoaded]);

    const fetchMemory = useCallback(async (): Promise<void> => {
        if (!currentDid) {
            setMemoryManifest(null);
            setMemoryDocs([]);
            return;
        }

        setMemoryError('');
        setIsFetchingMemory(true);

        try {
            const response = await fetch(
                `${normalizedAgentUrl}/api/debug/users/${encodeURIComponent(currentDid)}/memory`
            );
            const payload = (await response.json()) as AgentMemoryResponse;

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'Could not load agent memory.');
            }

            setMemoryManifest(payload.manifest ?? null);
            setMemoryDocs(payload.docs ?? []);
        } catch (fetchError) {
            setMemoryError(
                fetchError instanceof Error ? fetchError.message : 'Could not load agent memory.'
            );
        } finally {
            setIsFetchingMemory(false);
        }
    }, [currentDid, normalizedAgentUrl]);

    useEffect(() => {
        void fetchMemory();
    }, [fetchMemory]);

    const fetchContractAndOpenConsentFlow = async (): Promise<void> => {
        setError('');
        setStatus('');
        setIsFetchingContract(true);

        try {
            const response = await fetch(`${normalizedAgentUrl}/api/consent-flow/contract`);
            const payload = (await response.json()) as ConsentFlowContractResponse;

            if (!response.ok || !payload.ok || !payload.contract?.uri) {
                throw new Error(payload.error || 'Could not load the agent contract.');
            }

            setContractUri(payload.contract.uri);
            setStatus(
                payload.contract.created
                    ? 'Created a development contract.'
                    : 'Loaded the agent contract.'
            );
            setOpenContractWhenLoaded(true);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Could not load contract.');
        } finally {
            setIsFetchingContract(false);
        }
    };

    const sendMessage = async (): Promise<void> => {
        const content = messageInput.trim();
        if (!content || isSending || !currentDid) return;

        setError('');
        setStatus('');
        setIsSending(true);

        const nextMessages = [...messages, { role: 'user' as const, content }];
        setMessages(nextMessages);
        setMessageInput('');

        try {
            const response = await fetch(`${normalizedAgentUrl}/api/agent/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages,
                    ...(currentDid ? { did: currentDid } : {}),
                    ...(contractUri ? { consentFlowContractUri: contractUri } : {}),
                }),
            });
            const payload = (await response.json()) as AgentRunResponse & { error?: string };

            if (!response.ok) throw new Error(payload.error || 'The agent did not respond.');

            setMessages(payload.messages);
            setLatestToolRuns(payload.toolRuns ?? []);
            void fetchMemory();
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : 'The agent did not respond.');
            setMessages(messages);
        } finally {
            setIsSending(false);
        }
    };

    const postMemoryAction = async (body: Record<string, unknown>): Promise<boolean> => {
        if (!currentDid || isSavingMemory) return false;

        setMemoryError('');
        setIsSavingMemory(true);

        try {
            const response = await fetch(
                `${normalizedAgentUrl}/api/debug/users/${encodeURIComponent(currentDid)}/memory`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }
            );
            const payload = (await response.json()) as AgentMemoryResponse;

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || 'Could not update agent memory.');
            }

            await fetchMemory();
            return true;
        } catch (saveError) {
            setMemoryError(
                saveError instanceof Error ? saveError.message : 'Could not update agent memory.'
            );
            return false;
        } finally {
            setIsSavingMemory(false);
        }
    };

    const createMemory = async (): Promise<void> => {
        const description = memoryDescription.trim();
        const content = memoryContent.trim();
        if (!description || !content || !currentDid) return;

        const saved = await postMemoryAction({
            action: 'create',
            kind: memoryKind,
            description,
            content,
            status: memoryStatus,
            requiresApproval: memoryStatus === 'proposed',
        });

        if (!saved) return;

        setMemoryDescription('');
        setMemoryContent('');
        setMemoryKind('memory');
        setMemoryStatus('proposed');
    };

    const getStatusClasses = (docStatus: AgentMemoryDoc['status']): string => {
        if (docStatus === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (docStatus === 'proposed') return 'bg-amber-50 text-amber-700 border-amber-100';

        return 'bg-grayscale-100 text-grayscale-700 border-grayscale-200';
    };

    const getMemoryMeta = (doc: AgentMemoryDoc): string =>
        [
            doc.kind,
            doc.sourceType,
            doc.confidence !== undefined ? `confidence ${Math.round(doc.confidence * 100)}%` : '',
            doc.sensitivity ? `sensitivity ${doc.sensitivity}` : '',
            doc.version ? `v${doc.version}` : '',
            doc.readCount !== undefined ? `${doc.readCount} reads` : '',
            doc.listedCount !== undefined ? `${doc.listedCount} lists` : '',
        ]
            .filter(Boolean)
            .join(' · ');

    return (
        <div className="w-full text-left space-y-5">
            <section className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4">
                <div>
                    <h2 className="text-xl font-semibold text-grayscale-900 mb-1">Agent Debug</h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Connect this wallet to a local agent and test consented chat context.
                    </p>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="agent-url"
                        className="block text-xs font-medium text-grayscale-700"
                    >
                        Agent URL
                    </label>
                    <input
                        id="agent-url"
                        type="text"
                        value={agentUrl}
                        onChange={event => handleAgentUrlChange(event.target.value)}
                        placeholder={DEFAULT_AGENT_URL}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                </div>

                <div className="space-y-2">
                    <span className="block text-xs font-medium text-grayscale-700">
                        Current DID
                    </span>
                    <div className="px-4 py-3 bg-grayscale-10 border border-grayscale-200 rounded-xl text-xs text-grayscale-700 break-all">
                        {currentDid || 'No DID available.'}
                    </div>
                </div>

                {!currentDid && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700 leading-relaxed">
                        Sign in with a network profile before sending messages to the agent.
                    </div>
                )}

                <button
                    type="button"
                    onClick={fetchContractAndOpenConsentFlow}
                    disabled={isFetchingContract}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isFetchingContract || (openContractWhenLoaded && contractLoading)
                        ? 'Loading Consent Flow...'
                        : 'Open Consent Flow'}
                </button>

                {contractUri && (
                    <div className="px-4 py-3 bg-grayscale-10 border border-grayscale-200 rounded-xl text-xs text-grayscale-700 break-all">
                        {contractUri}
                    </div>
                )}
            </section>

            <section className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-4">
                <div className="min-h-[260px] max-h-[420px] overflow-y-auto border border-grayscale-200 rounded-2xl bg-grayscale-10 p-3 space-y-3">
                    {messages.length === 0 ? (
                        <div className="h-[220px] flex items-center justify-center text-sm text-grayscale-500 text-center">
                            Start a debug chat with the agent.
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                    message.role === 'user'
                                        ? 'ml-auto bg-grayscale-900 text-white'
                                        : 'mr-auto bg-white border border-grayscale-200 text-grayscale-800'
                                }`}
                            >
                                {message.content}
                            </div>
                        ))
                    )}
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="agent-message"
                        className="block text-xs font-medium text-grayscale-700"
                    >
                        Message
                    </label>
                    <textarea
                        id="agent-message"
                        value={messageInput}
                        onChange={event => setMessageInput(event.target.value)}
                        placeholder="Ask the agent a question"
                        rows={3}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-y"
                    />
                </div>

                <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || !messageInput.trim() || !currentDid}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSending ? 'Sending...' : currentDid ? 'Send Message' : 'No DID Available'}
                </button>

                {latestToolRuns.length > 0 && (
                    <details className="border border-grayscale-200 rounded-2xl bg-grayscale-10 overflow-hidden">
                        <summary className="cursor-pointer px-4 py-3 text-xs font-medium text-grayscale-700">
                            {latestToolRuns.length} tool call
                            {latestToolRuns.length === 1 ? '' : 's'}
                        </summary>
                        <pre className="max-h-[320px] overflow-auto border-t border-grayscale-200 p-4 text-xs text-grayscale-800 whitespace-pre-wrap">
                            {JSON.stringify(latestToolRuns, null, 2)}
                        </pre>
                    </details>
                )}
            </section>

            <section className="bg-white border border-grayscale-200 rounded-[20px] p-5 space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                            Agent Memory
                        </h2>
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            Review and manage the current user's agent memory.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchMemory}
                        disabled={isFetchingMemory || !currentDid}
                        className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isFetchingMemory ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {memoryManifest?.counts && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {[
                            ['Visible', memoryManifest.counts.visibleToAgent],
                            ['Active', memoryManifest.counts.active],
                            ['Proposed', memoryManifest.counts.proposed],
                            ['Archived', memoryManifest.counts.archived],
                            ['Expired', memoryManifest.counts.expired],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="border border-grayscale-200 rounded-2xl bg-grayscale-10 px-3 py-2"
                            >
                                <div className="text-xs font-medium text-grayscale-700">
                                    {label}
                                </div>
                                <div className="text-lg font-semibold text-grayscale-900">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {memoryError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 leading-relaxed">
                        {memoryError}
                    </div>
                )}

                <div className="border border-grayscale-200 rounded-2xl p-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label
                                htmlFor="memory-kind"
                                className="block text-xs font-medium text-grayscale-700"
                            >
                                Type
                            </label>
                            <select
                                id="memory-kind"
                                value={memoryKind}
                                onChange={event =>
                                    setMemoryKind(event.target.value as AgentMemoryDoc['kind'])
                                }
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            >
                                <option value="memory">Memory</option>
                                <option value="user-profile">Profile</option>
                                <option value="wiki">Wiki</option>
                                <option value="skill">Skill</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="memory-status"
                                className="block text-xs font-medium text-grayscale-700"
                            >
                                Save Mode
                            </label>
                            <select
                                id="memory-status"
                                value={memoryStatus}
                                onChange={event =>
                                    setMemoryStatus(event.target.value as 'active' | 'proposed')
                                }
                                className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            >
                                <option value="proposed">Needs Approval</option>
                                <option value="active">Save Now</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="memory-description"
                            className="block text-xs font-medium text-grayscale-700"
                        >
                            Description
                        </label>
                        <input
                            id="memory-description"
                            type="text"
                            value={memoryDescription}
                            onChange={event => setMemoryDescription(event.target.value)}
                            placeholder="Short memory label"
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="memory-content"
                            className="block text-xs font-medium text-grayscale-700"
                        >
                            Content
                        </label>
                        <textarea
                            id="memory-content"
                            value={memoryContent}
                            onChange={event => setMemoryContent(event.target.value)}
                            placeholder="Markdown content"
                            rows={4}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white resize-y"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={createMemory}
                        disabled={
                            isSavingMemory ||
                            !currentDid ||
                            !memoryDescription.trim() ||
                            !memoryContent.trim()
                        }
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSavingMemory ? 'Saving...' : 'Save Memory'}
                    </button>
                </div>

                <div className="space-y-3">
                    {isFetchingMemory && sortedMemoryDocs.length === 0 ? (
                        <div className="border border-grayscale-200 rounded-2xl bg-grayscale-10 p-4 text-sm text-grayscale-500 text-center">
                            Loading memory...
                        </div>
                    ) : sortedMemoryDocs.length === 0 ? (
                        <div className="border border-grayscale-200 rounded-2xl bg-grayscale-10 p-4 text-sm text-grayscale-500 text-center">
                            No memory saved for this user.
                        </div>
                    ) : (
                        sortedMemoryDocs.map(doc => (
                            <div
                                key={doc.name}
                                className="border border-grayscale-200 rounded-2xl p-4 space-y-3"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-grayscale-900 break-words">
                                                {doc.description}
                                            </h3>
                                            <span
                                                className={`px-2.5 py-1 rounded-full border text-xs font-medium ${getStatusClasses(
                                                    doc.status
                                                )}`}
                                            >
                                                {doc.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-grayscale-500 break-all mt-1">
                                            {doc.name}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        {doc.status === 'proposed' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    postMemoryAction({
                                                        action: 'approve',
                                                        name: doc.name,
                                                    })
                                                }
                                                disabled={isSavingMemory}
                                                className="py-2 px-3 rounded-[20px] bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Approve
                                            </button>
                                        )}

                                        {doc.status !== 'archived' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    postMemoryAction({
                                                        action: 'archive',
                                                        name: doc.name,
                                                        reason: 'Archived in debug UI.',
                                                    })
                                                }
                                                disabled={isSavingMemory}
                                                className="py-2 px-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-xs hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Archive
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs text-grayscale-500 break-words">
                                    {getMemoryMeta(doc)}
                                </div>

                                <pre className="max-h-[220px] overflow-auto border border-grayscale-200 rounded-xl bg-grayscale-10 p-3 text-xs text-grayscale-800 whitespace-pre-wrap break-words">
                                    {doc.content}
                                </pre>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {(status || error) && (
                <div
                    className={`p-3 border rounded-2xl text-sm leading-relaxed ${
                        error
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    }`}
                >
                    {error || status}
                </div>
            )}
        </div>
    );
};

export default AiAgentDebug;

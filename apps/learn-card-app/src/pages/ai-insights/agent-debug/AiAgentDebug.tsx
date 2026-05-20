import React, { useEffect, useMemo, useState } from 'react';

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
    const [isFetchingContract, setIsFetchingContract] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [openContractWhenLoaded, setOpenContractWhenLoaded] = useState(false);

    const normalizedAgentUrl = useMemo(() => normalizeAgentUrl(agentUrl), [agentUrl]);
    const { contract, contractLoading, openConsentFlowModal } = useConsentFlowByUri(
        contractUri || undefined
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
        } catch (sendError) {
            setError(sendError instanceof Error ? sendError.message : 'The agent did not respond.');
            setMessages(messages);
        } finally {
            setIsSending(false);
        }
    };

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

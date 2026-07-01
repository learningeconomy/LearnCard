export const AGENT_URL_STORAGE_KEY = 'learnCardAiAgentDebugUrl';
export const DEFAULT_AGENT_URL = 'http://localhost:4300';

export type LearnCardAssistantCardType =
    | 'message'
    | 'job-suggestion'
    | 'pathway-update'
    | 'action-item';
export type LearnCardAssistantCardPriority = 'normal' | 'high';

export interface LearnCardAssistantCardCta {
    label: string;
    href: string;
}

export interface LearnCardAssistantCardFeedback {
    type: 'thumbs-down';
    createdAt: string;
}

export interface LearnCardAssistantCard {
    id: string;
    ownerDid: string;
    dedupeKey?: string;
    type: LearnCardAssistantCardType;
    title: string;
    description: string;
    detail?: string;
    priority: LearnCardAssistantCardPriority;
    cta?: LearnCardAssistantCardCta;
    sourceRunId?: string;
    readAt?: string;
    feedback?: LearnCardAssistantCardFeedback;
    createdAt: string;
    updatedAt: string;
}

export interface LearnCardAssistantProfile {
    ownerDid: string;
    name: string;
    personality: string;
    avatarVariant: 'robot';
    createdAt: string;
    updatedAt: string;
}

export interface LearnCardAssistantMemoryManifest {
    ownerDid: string;
    generatedAt: string;
    policy: {
        activeDocsVisibleToAgent: boolean;
        proposedDocsVisibleToAgent: boolean;
        archivedDocsVisibleToAgent: boolean;
        expiredDocsVisibleToAgent: boolean;
        note: string;
    };
    counts: {
        active: number;
        proposed: number;
        archived: number;
        expired: number;
        visibleToAgent: number;
    };
    byKind: Record<string, number>;
    docs: Array<{
        ownerDid: string;
        name: string;
        kind: string;
        description: string;
        status: string;
        source: string;
        sourceType: string;
        confidence: number;
        sensitivity: string;
        expiresAt?: string;
        requiresApproval: boolean;
        listedCount: number;
        readCount: number;
        version: number;
        updatedAt: string;
    }>;
}

export interface LearnCardAssistantMemoryDoc {
    name: string;
    kind: string;
    description: string;
    content: string;
    status: 'proposed' | 'active' | 'archived';
    sourceType: string;
    confidence: number;
    sensitivity: string;
    requiresApproval: boolean;
    version: number;
    createdAt: string;
    updatedAt: string;
    proposedAt?: string;
    approvedAt?: string;
    archivedAt?: string;
}

export type LearnCardAssistantConsentContract = {
    uri: string;
    consentUrl: string;
    source: string;
    created: boolean;
};

export interface LearnCardAssistantAgentMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface LearnCardAssistantAgentRunResponse {
    runId: string;
    message: string;
    messages: LearnCardAssistantAgentMessage[];
    toolRuns?: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
        result?: unknown;
        error?: string;
    }>;
}

interface AssistantCardsResponse {
    ok: boolean;
    items?: LearnCardAssistantCard[];
    error?: string;
}

interface AssistantCardResponse {
    ok: boolean;
    item?: LearnCardAssistantCard;
    error?: string;
}

interface AssistantProfileResponse {
    ok: boolean;
    profile?: LearnCardAssistantProfile;
    error?: string;
}

interface AssistantMemoriesResponse {
    ok: boolean;
    manifest?: LearnCardAssistantMemoryManifest;
    docs?: LearnCardAssistantMemoryDoc[];
    error?: string;
}

interface AssistantMemoryMutationResponse {
    ok: boolean;
    doc?: LearnCardAssistantMemoryDoc;
    manifest?: LearnCardAssistantMemoryManifest;
    error?: string;
}

interface AssistantConsentContractResponse {
    ok: boolean;
    contract?: LearnCardAssistantConsentContract;
    error?: string;
}

export interface CreateLearnCardAssistantDebugCardInput {
    dedupeKey?: string;
    type: LearnCardAssistantCardType;
    title: string;
    description: string;
    detail?: string;
    priority?: LearnCardAssistantCardPriority;
    cta?: LearnCardAssistantCardCta;
}

export const normalizeAgentUrl = (url: string): string => {
    const trimmedUrl = url.trim().replace(/\/+$/, '');
    if (!trimmedUrl) return DEFAULT_AGENT_URL;

    return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `http://${trimmedUrl}`;
};

export const getInitialAgentUrl = (): string => {
    try {
        return localStorage.getItem(AGENT_URL_STORAGE_KEY) || DEFAULT_AGENT_URL;
    } catch {
        return DEFAULT_AGENT_URL;
    }
};

const parseJson = async <T>(response: Response): Promise<T> => (await response.json()) as T;

export const fetchLearnCardAssistantCards = async (
    agentUrl: string,
    did: string,
    limit = 50
): Promise<LearnCardAssistantCard[]> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(
            did
        )}/assistant-feed?limit=${limit}`
    );
    const payload = await parseJson<AssistantCardsResponse>(response);

    if (!response.ok || !payload.ok) throw new Error('Could not load assistant updates.');

    return payload.items ?? [];
};

export const markLearnCardAssistantCardRead = async (
    agentUrl: string,
    did: string,
    id: string
): Promise<LearnCardAssistantCard> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(
            did
        )}/assistant-feed/${encodeURIComponent(id)}/read`,
        { method: 'POST' }
    );
    const payload = await parseJson<AssistantCardResponse>(response);

    if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error || 'Could not update assistant card.');
    }

    return payload.item;
};

export const sendLearnCardAssistantCardFeedback = async (
    agentUrl: string,
    did: string,
    id: string
): Promise<LearnCardAssistantCard> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(
            did
        )}/assistant-feed/${encodeURIComponent(id)}/feedback`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'thumbs-down' }),
        }
    );
    const payload = await parseJson<AssistantCardResponse>(response);

    if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error || 'Could not send assistant feedback.');
    }

    return payload.item;
};

export const fetchLearnCardAssistantProfile = async (
    agentUrl: string,
    did: string
): Promise<LearnCardAssistantProfile> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(did)}/assistant-profile`
    );
    const payload = await parseJson<AssistantProfileResponse>(response);

    if (!response.ok || !payload.ok || !payload.profile) {
        throw new Error(payload.error || 'Could not load assistant profile.');
    }

    return payload.profile;
};

export const updateLearnCardAssistantProfile = async (
    agentUrl: string,
    did: string,
    input: { name?: string; personality?: string }
): Promise<LearnCardAssistantProfile> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(did)}/assistant-profile`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        }
    );
    const payload = await parseJson<AssistantProfileResponse>(response);

    if (!response.ok || !payload.ok || !payload.profile) {
        throw new Error(payload.error || 'Could not update assistant profile.');
    }

    return payload.profile;
};

export const createLearnCardAssistantDebugCard = async (
    agentUrl: string,
    did: string,
    input: CreateLearnCardAssistantDebugCardInput
): Promise<LearnCardAssistantCard> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/debug/users/${encodeURIComponent(did)}/assistant-feed`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        }
    );
    const payload = await parseJson<AssistantCardResponse>(response);

    if (!response.ok || !payload.ok || !payload.item) {
        throw new Error(payload.error || 'Could not create assistant test card.');
    }

    return payload.item;
};

export const runLearnCardAssistantAgent = async (
    agentUrl: string,
    did: string,
    messages: LearnCardAssistantAgentMessage[],
    consentFlowContractUri?: string
): Promise<LearnCardAssistantAgentRunResponse> => {
    const response = await fetch(`${normalizeAgentUrl(agentUrl)}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            did,
            messages,
            ...(consentFlowContractUri ? { consentFlowContractUri } : {}),
        }),
    });
    const payload = (await response.json()) as LearnCardAssistantAgentRunResponse & {
        error?: string;
    };

    if (!response.ok) throw new Error(payload.error || 'The assistant did not respond.');

    return payload;
};

export const fetchLearnCardAssistantMemories = async (
    agentUrl: string,
    did: string
): Promise<{
    manifest?: LearnCardAssistantMemoryManifest;
    docs: LearnCardAssistantMemoryDoc[];
}> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(did)}/assistant-memories`
    );
    const payload = await parseJson<AssistantMemoriesResponse>(response);

    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not load memories.');

    return { manifest: payload.manifest, docs: payload.docs ?? [] };
};

export const approveLearnCardAssistantMemory = async (
    agentUrl: string,
    did: string,
    name: string
): Promise<AssistantMemoryMutationResponse> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(
            did
        )}/assistant-memories/${encodeURIComponent(name)}/approve`,
        { method: 'POST' }
    );
    const payload = await parseJson<AssistantMemoryMutationResponse>(response);

    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not approve memory.');

    return payload;
};

export const archiveLearnCardAssistantMemory = async (
    agentUrl: string,
    did: string,
    name: string
): Promise<AssistantMemoryMutationResponse> => {
    const response = await fetch(
        `${normalizeAgentUrl(agentUrl)}/api/users/${encodeURIComponent(
            did
        )}/assistant-memories/${encodeURIComponent(name)}/archive`,
        { method: 'POST' }
    );
    const payload = await parseJson<AssistantMemoryMutationResponse>(response);

    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not remove memory.');

    return payload;
};

export const fetchLearnCardAssistantConsentContract = async (
    agentUrl: string
): Promise<LearnCardAssistantConsentContract> => {
    const response = await fetch(`${normalizeAgentUrl(agentUrl)}/api/consent-flow/contract`);
    const payload = await parseJson<AssistantConsentContractResponse>(response);

    if (!response.ok || !payload.ok || !payload.contract) {
        throw new Error(payload.error || 'Could not load shared data settings.');
    }

    return payload.contract;
};

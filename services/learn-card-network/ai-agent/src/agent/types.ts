export type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AgentToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

export interface AgentMessage {
    role: AgentMessageRole;
    content: string;
    toolCallId?: string;
    toolCalls?: AgentToolCall[];
}

export interface AgentToolContext {
    runId: string;
    signal?: AbortSignal;
}

export interface AgentSkillDefinition {
    name: string;
    description: string;
    load: () => Promise<string>;
    source?: string;
    kind?: string;
    dynamic?: boolean;
    onList?: (context: AgentToolContext) => Promise<void>;
    onRead?: (context: AgentToolContext) => Promise<void>;
}

export interface AgentToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    skill?: AgentSkillDefinition;
    execute: (args: Record<string, unknown>, context: AgentToolContext) => Promise<unknown>;
}

export interface AgentProviderRequest {
    model: string;
    messages: AgentMessage[];
    tools: AgentToolDefinition[];
    signal?: AbortSignal;
    maxOutputTokens?: number;
}

export interface AgentTokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export interface AgentModelRun {
    requestId?: string;
    durationMs: number;
    usage?: AgentTokenUsage;
}

export interface AgentRunObserver {
    onModelComplete?: (event: {
        runId: string;
        model: string;
        round: number;
        durationMs: number;
        requestId?: string;
        usage?: AgentTokenUsage;
    }) => void;
    onModelError?: (event: {
        runId: string;
        model: string;
        round: number;
        durationMs: number;
        error: unknown;
    }) => void;
    onToolComplete?: (event: {
        runId: string;
        name: string;
        durationMs: number;
        success: boolean;
        error?: unknown;
    }) => void;
}

export interface AgentProviderResponse {
    message: AgentMessage;
    requestId?: string;
    usage?: AgentTokenUsage;
}

export interface AgentProvider {
    complete: (request: AgentProviderRequest) => Promise<AgentProviderResponse>;
}

export interface AgentToolRun {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    error?: string;
    durationMs?: number;
}

export interface AgentRunRequest {
    model: string;
    messages: AgentMessage[];
    provider: AgentProvider;
    tools: AgentToolDefinition[];
    skills?: AgentSkillDefinition[];
    maxToolRounds?: number;
    systemPrompt?: string;
    contextPrompt?: string;
    signal?: AbortSignal;
    runId?: string;
    maxOutputTokens?: number;
    maxTotalTokens?: number;
    maxEstimatedCostUsd?: number;
    inputTokenCostUsdPerMillion?: number;
    outputTokenCostUsdPerMillion?: number;
    observer?: AgentRunObserver;
}

export interface AgentRunResult {
    runId: string;
    message: string;
    messages: AgentMessage[];
    toolRuns: AgentToolRun[];
    modelRuns: AgentModelRun[];
    usage: AgentTokenUsage & {
        estimatedCostUsd?: number;
    };
}

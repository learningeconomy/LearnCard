import OpenAI from 'openai';

import type {
    AgentMessage,
    AgentProvider,
    AgentProviderRequest,
    AgentToolCall,
    AgentToolDefinition,
} from './types';

type OpenAIMessage = {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_call_id?: string;
    tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
            name: string;
            arguments: string;
        };
    }>;
};

const parseToolArguments = (rawArguments: string): Record<string, unknown> => {
    if (!rawArguments.trim()) return {};

    const parsed = JSON.parse(rawArguments) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return parsed as Record<string, unknown>;
};

const toOpenAIMessage = (message: AgentMessage): OpenAIMessage => {
    if (message.role === 'tool') {
        return {
            role: 'tool',
            content: message.content,
            tool_call_id: message.toolCallId ?? '',
        };
    }

    if (message.role === 'assistant' && message.toolCalls?.length) {
        return {
            role: 'assistant',
            content: message.content || null,
            tool_calls: message.toolCalls.map(toolCall => ({
                id: toolCall.id,
                type: 'function',
                function: {
                    name: toolCall.name,
                    arguments: JSON.stringify(toolCall.arguments),
                },
            })),
        };
    }

    return {
        role: message.role,
        content: message.content,
    };
};

const toOpenAITool = (tool: AgentToolDefinition): Record<string, unknown> => ({
    type: 'function',
    function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
    },
});

const toAgentToolCalls = (
    toolCalls: Array<{
        id: string;
        function?: {
            name?: string;
            arguments?: string;
        };
    }>
): AgentToolCall[] =>
    toolCalls.map(toolCall => ({
        id: toolCall.id,
        name: toolCall.function?.name ?? '',
        arguments: parseToolArguments(toolCall.function?.arguments ?? '{}'),
    }));

export const createOpenAIProvider = (apiKey: string): AgentProvider => {
    const client = new OpenAI({ apiKey });

    return {
        complete: async ({ model, messages, tools }: AgentProviderRequest) => {
            const completion = await client.chat.completions.create({
                model,
                messages: messages.map(toOpenAIMessage) as never,
                tools: tools.map(toOpenAITool) as never,
                tool_choice: 'auto',
            });

            const message = completion.choices[0]?.message;

            if (!message) throw new Error('No model response returned.');

            return {
                message: {
                    role: 'assistant',
                    content: message.content ?? '',
                    toolCalls: message.tool_calls ? toAgentToolCalls(message.tool_calls) : undefined,
                },
            };
        },
    };
};

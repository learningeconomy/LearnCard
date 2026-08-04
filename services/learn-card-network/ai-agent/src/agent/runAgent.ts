import type {
    AgentMessage,
    AgentRunRequest,
    AgentRunResult,
    AgentToolCall,
    AgentToolDefinition,
    AgentToolRun,
} from './types';
import { getSkillSystemPrompt, withSkillTools } from './skills';

const DEFAULT_SYSTEM_PROMPT = `You are a LearnCard AI assistant prototype.
Answer conversationally and use tools when they are helpful.
When a tool gives you data, summarize it clearly instead of dumping raw JSON.`;

const safeStringify = (value: unknown): string => {
    try {
        return JSON.stringify(value);
    } catch {
        return JSON.stringify({ error: 'Tool returned a value that could not be serialized.' });
    }
};

const getTool = (
    toolsByName: Map<string, AgentToolDefinition>,
    toolCall: AgentToolCall
): AgentToolDefinition | undefined => toolsByName.get(toolCall.name);

const awaitWithSignal = async <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
    signal?.throwIfAborted();
    if (!signal) return promise;
    const activeSignal = signal;

    return new Promise<T>((resolve, reject) => {
        let settled = false;

        const resolveOnce = (value: T): void => {
            if (settled) return;

            settled = true;
            activeSignal.removeEventListener('abort', onAbort);
            resolve(value);
        };
        const rejectOnce = (error: unknown): void => {
            if (settled) return;

            settled = true;
            activeSignal.removeEventListener('abort', onAbort);
            reject(error);
        };
        function onAbort(): void {
            rejectOnce(activeSignal.reason ?? new Error('Agent run aborted.'));
        }

        activeSignal.addEventListener('abort', onAbort, { once: true });
        if (activeSignal.aborted) onAbort();

        promise.then(resolveOnce, rejectOnce);
    });
};

export const runAgent = async ({
    model,
    messages,
    provider,
    tools,
    skills = [],
    maxToolRounds = 3,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    contextPrompt,
    signal,
}: AgentRunRequest): Promise<AgentRunResult> => {
    const runId = crypto.randomUUID();
    const agentTools = withSkillTools(tools, skills);
    const toolsByName = new Map(agentTools.map(tool => [tool.name, tool]));
    const skillSystemPrompt = getSkillSystemPrompt(tools, skills);
    const conversation: AgentMessage[] = [
        {
            role: 'system',
            content: [systemPrompt, contextPrompt, skillSystemPrompt].filter(Boolean).join('\n\n'),
        },
        ...messages,
    ];
    const toolRuns: AgentToolRun[] = [];

    signal?.throwIfAborted();
    for (let round = 0; round <= maxToolRounds; round += 1) {
        const response = await provider.complete({
            model,
            messages: conversation,
            tools: agentTools,
            ...(signal ? { signal } : {}),
        });
        signal?.throwIfAborted();
        conversation.push(response.message);

        const toolCalls = response.message.toolCalls ?? [];

        if (toolCalls.length === 0) {
            return {
                runId,
                message: response.message.content,
                messages: conversation,
                toolRuns,
            };
        }

        for (const toolCall of toolCalls) {
            signal?.throwIfAborted();
            const tool = getTool(toolsByName, toolCall);
            const toolRun: AgentToolRun = {
                id: toolCall.id,
                name: toolCall.name,
                arguments: toolCall.arguments,
            };

            if (!tool) {
                toolRun.error = `Unknown tool: ${toolCall.name}`;
                toolRuns.push(toolRun);
                conversation.push({
                    role: 'tool',
                    toolCallId: toolCall.id,
                    content: safeStringify({ error: toolRun.error }),
                });
                continue;
            }

            try {
                const result = await awaitWithSignal(
                    tool.execute(toolCall.arguments, {
                        runId,
                        ...(signal ? { signal } : {}),
                    }),
                    signal
                );
                signal?.throwIfAborted();
                toolRun.result = result;
                toolRuns.push(toolRun);
                conversation.push({
                    role: 'tool',
                    toolCallId: toolCall.id,
                    content: safeStringify(result),
                });
            } catch (error) {
                signal?.throwIfAborted();
                const message = error instanceof Error ? error.message : 'Tool failed.';
                toolRun.error = message;
                toolRuns.push(toolRun);
                conversation.push({
                    role: 'tool',
                    toolCallId: toolCall.id,
                    content: safeStringify({ error: message }),
                });
            }
        }
    }

    throw new Error('Agent reached the maximum tool-call rounds before producing a response.');
};

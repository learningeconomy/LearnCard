import {
    ConverseCommand,
    ConverseStreamCommand,
    type BedrockRuntimeClient,
    type ContentBlock,
    type ConverseCommandInput,
    type Message,
    type SystemContentBlock,
    type Tool,
    type ToolUseBlock,
} from '@aws-sdk/client-bedrock-runtime';
import { partialParse } from 'openai/_vendor/partial-json-parser/parser';
import { z } from 'zod';
import { createBedrockConverseClient, resolveBedrockGenerationModel } from './bedrock-generation';
import { compileBedrockSchema, parseBedrockOutput } from './bedrock-schema';
import {
    getOpenAIReasoningEffort,
    parseOpenAIModelAlias,
    type AIProviderClient,
    type GenericMessageParam,
    type StreamingOptions,
} from './providers';
import { createJsonStringTracker } from './streaming-output';
import { AiProviderError, normalizeAiProviderError } from './errors';

// SDK authentication may await a credential refresh before the HTTP handler
// sees abortSignal. Keep owner/deadline cancellation bounded during that wait.
async function abortableRequest<Result>(
    call: () => Promise<Result>,
    signal: AbortSignal
): Promise<Result> {
    signal.throwIfAborted();
    const cancelled = Promise.withResolvers<never>();
    const abort = () => cancelled.reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    try {
        return await Promise.race([call(), cancelled.promise]);
    } finally {
        signal.removeEventListener('abort', abort);
    }
}

const malformed = (): Error => new Error('Invalid Bedrock generation response');
const incomplete = (): Error => new Error('Bedrock generation stream did not complete');

function responseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        throw malformed();
    }
}

const historyItemSchema = z.record(z.string(), z.unknown());
const historyToolSchema = z.object({
    id: z.string(),
    type: z.literal('function'),
    function: z.object({ name: z.string(), arguments: z.string() }),
});

function toolInput(argumentsText: string): ToolUseBlock['input'] {
    return z.json().parse(JSON.parse(argumentsText));
}

function textContent(content: unknown): string {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) throw new Error('Unsupported Bedrock history content');
    return content
        .map((part: unknown) => {
            const item = historyItemSchema.parse(part);
            if (
                (item.type !== 'text' &&
                    item.type !== 'input_text' &&
                    item.type !== 'output_text') ||
                typeof item.text !== 'string'
            )
                throw new Error('Unsupported Bedrock history content');
            return item.text;
        })
        .join('');
}

/** Convert client-owned text/tool history without discarding turns or tool results. */
export function buildConverseHistory(
    systemPrompt: string,
    message: string | GenericMessageParam[]
): { messages: Message[]; system?: SystemContentBlock[] } {
    const system: SystemContentBlock[] = systemPrompt ? [{ text: systemPrompt }] : [];
    const messages: Message[] = [];
    const input = typeof message === 'string' ? [{ role: 'user', content: message }] : message;
    for (const value of input) {
        const item = historyItemSchema.parse(value);
        let role: 'user' | 'assistant';
        const content: ContentBlock[] = [];
        if (item.type === 'function_call') {
            if (
                typeof item.name !== 'string' ||
                typeof item.call_id !== 'string' ||
                typeof item.arguments !== 'string'
            )
                throw new Error('Unsupported Bedrock tool history');
            role = 'assistant';
            content.push({
                toolUse: {
                    name: item.name,
                    toolUseId: item.call_id,
                    input: toolInput(item.arguments),
                },
            });
        } else if (item.type === 'function_call_output' || item.role === 'tool') {
            const id = item.type === 'function_call_output' ? item.call_id : item.tool_call_id;
            if (typeof id !== 'string') throw new Error('Unsupported Bedrock tool history');
            role = 'user';
            content.push({
                toolResult: {
                    toolUseId: id,
                    content: [{ text: textContent(item.output ?? item.content) }],
                },
            });
        } else {
            if (item.type !== undefined && item.type !== 'message')
                throw new Error('Unsupported Bedrock history item');
            if (item.role === 'system' || item.role === 'developer') {
                system.push({ text: textContent(item.content) });
                continue;
            }
            if (item.role !== 'user' && item.role !== 'assistant')
                throw new Error('Unsupported Bedrock history role');
            role = item.role;
            if (item.content != null) content.push({ text: textContent(item.content) });
            if (item.tool_calls !== undefined) {
                if (role !== 'assistant' || !Array.isArray(item.tool_calls))
                    throw new Error('Unsupported Bedrock tool history');
                for (const value of item.tool_calls) {
                    const call = historyToolSchema.parse(value);
                    content.push({
                        toolUse: {
                            toolUseId: call.id,
                            name: call.function.name,
                            input: toolInput(call.function.arguments),
                        },
                    });
                }
            }
        }
        if (!content.length) throw new Error('Empty Bedrock history turn');
        const previous = messages.at(-1);
        if (previous?.role === role) previous.content!.push(...content);
        else messages.push({ role, content });
    }
    if (!messages.length) throw new Error('Bedrock generation requires message history');
    return { messages, ...(system.length && { system }) };
}

function requestSignal(signal?: AbortSignal, timeoutMs?: number): AbortSignal {
    // The previous OpenAI SDK default was ten minutes; retain that budget and
    // enforce it across stream consumption, not only the initial HTTP response.
    const timeout = AbortSignal.timeout(Math.max(1, Math.floor(timeoutMs ?? 600_000)));
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export function buildConverseRequest(params: {
    systemPrompt?: string;
    message: string | GenericMessageParam[];
    model: string;
}): ConverseCommandInput {
    const modelId = resolveBedrockGenerationModel(params.model);
    const configuredEffort = process.env.OPENAI_REASONING_EFFORT;
    if (
        parseOpenAIModelAlias(params.model).reasoningEffort !== undefined ||
        configuredEffort !== undefined
    ) {
        // Preserve first-party configuration validation, never use it as a
        // Bedrock request-field mapping. Only the implicit documented default is safe.
        getOpenAIReasoningEffort(params.model, configuredEffort);
        throw new AiProviderError({
            code: 'ai_provider_unavailable',
            provider: 'bedrock',
            retryable: false,
            httpStatus: 503,
            cause: new Error(
                'Luna activation blocked: explicit reasoning effort has no verified native Converse mapping'
            ),
        });
    }
    return {
        modelId,
        ...buildConverseHistory(params.systemPrompt ?? '', params.message),
    };
}

function wrappedSchema(schema: z.ZodType): {
    schema: z.ZodType;
    wrapped: boolean;
} {
    return schema instanceof z.ZodObject
        ? { schema, wrapped: false }
        : { schema: z.object({ args: schema }), wrapped: true };
}

export function buildConverseTools(
    schemas: z.ZodType[],
    model: string,
    names?: string[]
): {
    tools: Tool[];
    schemas: { schema: z.ZodType; wrapped: boolean }[];
} {
    const wrapped = schemas.map(wrappedSchema);
    const tools: Tool[] = wrapped.map(({ schema }, index) => {
        const name = names?.[index] ?? `function_${index}`;
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) throw new Error('Invalid Bedrock tool name');
        return {
            toolSpec: {
                name,
                description: `Function for structured output ${index}`,
                strict: true,
                inputSchema: {
                    json: compileBedrockSchema(schema, model) as NonNullable<ToolUseBlock['input']>,
                },
            },
        };
    });
    return { tools, schemas: wrapped };
}

function assertHistoryTools(input: ConverseCommandInput): void {
    const names =
        input.toolConfig?.tools?.flatMap(tool =>
            tool.toolSpec?.name ? [tool.toolSpec.name] : []
        ) ?? [];
    const ids = new Map<string, string>();
    for (const message of input.messages ?? []) {
        for (const block of message.content ?? []) {
            if (block.toolUse) {
                const { name, toolUseId } = block.toolUse;
                if (!name || !toolUseId || !names.includes(name))
                    throw new Error(
                        'Bedrock tool history requires its original registered tool definitions'
                    );
                ids.set(toolUseId, name);
            }
            if (block.toolResult && !ids.has(block.toolResult.toolUseId ?? ''))
                throw new Error('Bedrock tool result history requires its original tool call');
        }
    }
}

type StreamBlock = {
    kind: 'text' | 'reasoning' | 'tool';
    closed: boolean;
    arguments: string;
};

export class BedrockConverseProvider implements AIProviderClient {
    private client?: BedrockRuntimeClient;
    constructor(private readonly clientFactory = createBedrockConverseClient) {}

    private getClient(): BedrockRuntimeClient {
        return (this.client ??= this.clientFactory());
    }

    async call<T extends z.ZodType | z.ZodType[]>({
        systemPrompt = '',
        message,
        output,
        model,
        signal,
        timeoutMs,
    }: {
        systemPrompt?: string;
        message: string | GenericMessageParam[];
        output: T;
        model: string;
        signal?: AbortSignal;
        timeoutMs?: number;
    }): Promise<
        T extends z.ZodType ? z.infer<T> : T extends z.ZodType[] ? z.infer<T[number]> : never
    > {
        signal?.throwIfAborted();
        const input = buildConverseRequest({ systemPrompt, message, model });
        const schemas: z.ZodType[] = Array.isArray(output) ? output : [output as z.ZodType];
        if (!schemas.length) throw new Error('Bedrock generation requires an output schema');
        const multiple =
            Array.isArray(output) ||
            input.messages?.some(message =>
                message.content?.some(
                    block => block.toolUse !== undefined || block.toolResult !== undefined
                )
            );
        let prepared: { schema: z.ZodType; wrapped: boolean }[];
        if (multiple) {
            const { tools, schemas: wrapped } = buildConverseTools(schemas, model);
            prepared = wrapped;
            input.toolConfig = { tools, toolChoice: { any: {} } };
        } else {
            prepared = schemas.map(wrappedSchema);
            input.outputConfig = {
                textFormat: {
                    type: 'json_schema',
                    structure: {
                        jsonSchema: {
                            name: 'structured_output',
                            schema: JSON.stringify(
                                compileBedrockSchema(prepared[0]!.schema, model)
                            ),
                        },
                    },
                },
            };
        }
        assertHistoryTools(input);
        const abortSignal = requestSignal(signal, timeoutMs);
        abortSignal.throwIfAborted();
        const response = await abortableRequest(
            () => this.getClient().send(new ConverseCommand(input), { abortSignal }),
            abortSignal
        );
        abortSignal.throwIfAborted();
        const content = response.output?.message?.content;
        if (response.output?.message?.role !== 'assistant' || !content) throw malformed();
        let index = 0;
        let value: unknown;
        if (multiple) {
            const calls = content.filter(block => block.toolUse !== undefined);
            if (response.stopReason !== 'tool_use' || calls.length !== 1) throw malformed();
            const call = calls[0]!.toolUse!;
            const match = /^function_(0|[1-9][0-9]*)$/.exec(call.name ?? '');
            if (!match || !call.toolUseId) throw malformed();
            index = Number(match[1]);
            if (index >= schemas.length) throw malformed();
            value = call.input;
        } else {
            if (response.stopReason !== 'end_turn' && response.stopReason !== 'stop_sequence')
                throw malformed();
            if (content.some(block => block.toolUse !== undefined)) throw malformed();
            const text = content
                .filter(block => block.text !== undefined)
                .map(block => block.text)
                .join('');
            value = responseJson(text);
        }
        const parsed = await parseBedrockOutput(value, prepared[index]!.schema);
        abortSignal.throwIfAborted();
        if (prepared[index]!.wrapped) {
            if (!parsed || typeof parsed !== 'object' || !('args' in parsed)) throw malformed();
            value = parsed.args;
        } else value = parsed;
        // The original schema has validated value; TypeScript cannot express this
        // conditional return across the runtime array-versus-single-schema branch.
        return value as T extends z.ZodType
            ? z.infer<T>
            : T extends z.ZodType[]
              ? z.infer<T[number]>
              : never;
    }

    async streamingCall({
        systemPrompt = '',
        message,
        model,
        options = {},
    }: {
        systemPrompt?: string;
        message: string | GenericMessageParam[];
        model: string;
        options?: StreamingOptions;
    }): Promise<string> {
        return this.consumeStream({ systemPrompt, message, model, options });
    }

    async structuredStreamingCall<Shape extends z.ZodRawShape>(params: {
        systemPrompt: string;
        message: string;
        model: string;
        output: z.ZodObject<Shape>;
        toolName: string;
        signal?: AbortSignal;
        timeoutMs: number;
        onPartial: (value: Partial<z.output<z.ZodObject<Shape>>>) => void | Promise<void>;
    }): Promise<z.output<z.ZodObject<Shape>>> {
        params.signal?.throwIfAborted();
        const { tools } = buildConverseTools([params.output], params.model, [params.toolName]);
        const operationSignal = requestSignal(params.signal, params.timeoutMs);
        const argumentsText = await this.consumeStream({
            ...params,
            toolConfig: { tools, toolChoice: { any: {} } },
            expectedTool: params.toolName,
            operationSignal,
            options: {
                signal: params.signal,
                timeoutMs: params.timeoutMs,
                accumulateContent: true,
            },
            onArguments: async text => {
                let partial: Partial<z.output<z.ZodObject<Shape>>>;
                try {
                    // Zod's mapped partial output loses the generic object-output relation.
                    const parsed = await params.output.partial().parseAsync(partialParse(text));
                    partial = parsed as Partial<z.output<z.ZodObject<Shape>>>;
                } catch {
                    return;
                }
                await params.onPartial(partial);
            },
        });
        const result = await parseBedrockOutput(responseJson(argumentsText), params.output);
        operationSignal.throwIfAborted();
        return result as z.output<z.ZodObject<Shape>>;
    }

    private async consumeStream(params: {
        systemPrompt: string;
        message: string | GenericMessageParam[];
        model: string;
        options: StreamingOptions;
        toolConfig?: ConverseCommandInput['toolConfig'];
        expectedTool?: string;
        onArguments?: (text: string) => Promise<void>;
        operationSignal?: AbortSignal;
    }): Promise<string> {
        const { signal, timeoutMs, onChunk, accumulateContent = true } = params.options;
        signal?.throwIfAborted();
        const input = buildConverseRequest(params);
        if (params.toolConfig) input.toolConfig = params.toolConfig;
        assertHistoryTools(input);
        const abortSignal = params.operationSignal ?? requestSignal(signal, timeoutMs);
        abortSignal.throwIfAborted();
        const response = await abortableRequest(
            () =>
                this.getClient().send(new ConverseStreamCommand(input), {
                    abortSignal,
                }),
            abortSignal
        );
        abortSignal.throwIfAborted();
        if (!response.stream) throw incomplete();
        const blocks = new Map<number, StreamBlock>();
        let started = false;
        let completed = false;
        let toolIndex: number | undefined;
        let content = '';
        const trackString = createJsonStringTracker();
        for await (const event of response.stream) {
            abortSignal.throwIfAborted();
            const exceptionName = event.throttlingException
                ? 'ThrottlingException'
                : event.serviceUnavailableException
                  ? 'ServiceUnavailableException'
                  : event.internalServerException
                    ? 'InternalServerException'
                    : event.modelStreamErrorException
                      ? 'ModelStreamErrorException'
                      : event.validationException
                        ? 'ValidationException'
                        : undefined;
            if (exceptionName) throw normalizeAiProviderError({ name: exceptionName }, 'bedrock');
            if (event.metadata) {
                if (!completed) throw incomplete();
                continue;
            }
            if (completed) throw incomplete();
            if (event.messageStart) {
                if (started || event.messageStart.role !== 'assistant') throw incomplete();
                started = true;
                continue;
            }
            if (!started) throw incomplete();
            if (event.messageStop) {
                const validReason = params.expectedTool
                    ? event.messageStop.stopReason === 'tool_use' && toolIndex !== undefined
                    : event.messageStop.stopReason === 'end_turn' ||
                      event.messageStop.stopReason === 'stop_sequence';
                if (!validReason || [...blocks.values()].some(block => !block.closed))
                    throw incomplete();
                completed = true;
                continue;
            }
            if (event.contentBlockStart) {
                const { contentBlockIndex: index, start } = event.contentBlockStart;
                if (
                    index === undefined ||
                    !Number.isInteger(index) ||
                    index < 0 ||
                    blocks.has(index) ||
                    !params.expectedTool ||
                    start?.toolUse?.name !== params.expectedTool ||
                    !start.toolUse.toolUseId ||
                    toolIndex !== undefined
                )
                    throw incomplete();
                toolIndex = index;
                blocks.set(index, { kind: 'tool', closed: false, arguments: '' });
                continue;
            }
            if (event.contentBlockStop) {
                const block = blocks.get(event.contentBlockStop.contentBlockIndex ?? -1);
                if (!block || block.closed) throw incomplete();
                block.closed = true;
                continue;
            }
            if (event.contentBlockDelta) {
                const { contentBlockIndex: index, delta } = event.contentBlockDelta;
                if (index === undefined || !Number.isInteger(index) || index < 0 || !delta)
                    throw incomplete();
                let block = blocks.get(index);
                const kind = delta.toolUse
                    ? 'tool'
                    : delta.text !== undefined
                      ? 'text'
                      : delta.reasoningContent
                        ? 'reasoning'
                        : undefined;
                if (!kind || (params.expectedTool === undefined && kind === 'tool'))
                    throw incomplete();
                if (!block) {
                    if (kind === 'tool') throw incomplete();
                    block = { kind, closed: false, arguments: '' };
                    blocks.set(index, block);
                }
                if (block.closed || block.kind !== kind) throw incomplete();
                if (kind === 'tool') {
                    if (index !== toolIndex || typeof delta.toolUse?.input !== 'string')
                        throw incomplete();
                    block.arguments += delta.toolUse.input;
                    if (!trackString(delta.toolUse.input))
                        await params.onArguments?.(block.arguments);
                } else if (kind === 'text' && !params.expectedTool) {
                    await onChunk?.(delta.text!);
                    if (accumulateContent) content += delta.text!;
                }
                continue;
            }
            // Exception/unknown unions must not turn into successful truncated output.
            throw incomplete();
        }
        abortSignal.throwIfAborted();
        if (!completed) throw incomplete();
        return params.expectedTool ? blocks.get(toolIndex!)!.arguments : content;
    }
}

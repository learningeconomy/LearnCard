import { markGenerationFailure } from './generation-failure';
import OpenAI from 'openai';
import type {
    ResponseInputItem,
    ResponseCreateParamsNonStreaming,
} from 'openai/resources/responses/responses';
import { z } from 'zod';
import { createBedrockResponsesClient, resolveBedrockResponsesModel } from './bedrock-generation';
import {
    getOpenAIReasoningEffort,
    type GenericMessageParam,
    type StreamingOptions,
} from './providers';
import { buildConverseHistory } from './bedrock-converse';
import { AiProviderError, normalizeAiProviderError } from './errors';
import { compileProjectedSchema } from './bedrock-schema';
import { markProviderFailure, withProviderRequest } from './provider-diagnostics';
import { partialParse } from 'openai/_vendor/partial-json-parser/parser';
import { createJsonStringTracker } from './streaming-output';
import type { LlmRoute } from './ai-provider-config';
import { recordUsageRequest, reserveProviderRequest, usageField } from './usage-meter';

const generationUsage = (response: unknown) => {
    const usage = usageField(response, 'usage');
    return {
        // Rate all input conservatively; do not assume a cache discount.
        inputTokens: usageField(usage, 'input_tokens'),
        outputTokens: usageField(usage, 'output_tokens'),
    };
};

export class BedrockResponsesProtocolError extends Error {
    constructor(
        readonly failureCode: 'invalid_response_protocol' | 'incomplete_response_lifecycle'
    ) {
        super(
            failureCode === 'invalid_response_protocol'
                ? 'Invalid Bedrock Responses result'
                : 'Bedrock Responses stream did not complete'
        );
    }
}
const malformed = () => new BedrockResponsesProtocolError('invalid_response_protocol');
const incomplete = () => new BedrockResponsesProtocolError('incomplete_response_lifecycle');

// Retain only the provider code: raw messages/payloads must not enter causes or logs.
function lifecycleFailure(error?: { code?: unknown } | null): Error {
    if (typeof error?.code === 'string') {
        const normalized = normalizeAiProviderError({ code: error.code }, 'bedrock');
        if (normalized.code !== 'ai_unknown_error')
            return new AiProviderError({
                code: normalized.code,
                provider: 'bedrock',
                retryable: normalized.retryable,
                httpStatus: normalized.httpStatus,
            });
    }
    return incomplete();
}

// Reuse validated history parsing, then encode the Responses protocol without
// flattening calls/results or passing arbitrary provider fields through.
export function buildResponsesRequest(params: {
    systemPrompt?: string;
    message: string | GenericMessageParam[];
    model: string;
}): ResponseCreateParamsNonStreaming {
    const model = resolveBedrockResponsesModel(params.model);
    const effort = getOpenAIReasoningEffort(
        params.model,
        // Match constants/env.ts normalization while reading current configuration.
        process.env.OPENAI_REASONING_EFFORT || undefined
    );
    const history = buildConverseHistory(params.systemPrompt ?? '', params.message);
    const input: ResponseInputItem[] = [];
    const calls = new Set<string>();
    for (const turn of history.messages) {
        for (const block of turn.content ?? []) {
            if (block.text !== undefined) input.push({ role: turn.role!, content: block.text });
            else if (block.toolUse) {
                const { toolUseId, name, input: args } = block.toolUse;
                if (!toolUseId || !name || calls.has(toolUseId)) throw malformed();
                calls.add(toolUseId);
                input.push({
                    type: 'function_call',
                    call_id: toolUseId,
                    name,
                    arguments: JSON.stringify(args),
                });
            } else if (block.toolResult) {
                if (!block.toolResult.toolUseId || !calls.has(block.toolResult.toolUseId))
                    throw malformed();
                input.push({
                    type: 'function_call_output',
                    call_id: block.toolResult.toolUseId,
                    output: (block.toolResult.content ?? []).map(item => item.text ?? '').join(''),
                });
            } else throw malformed();
        }
    }
    return {
        model,
        input,
        ...(history.system?.length && {
            instructions: history.system.map(block => block.text ?? '').join('\n'),
        }),
        store: false,
        ...(effort && { reasoning: { effort } }),
    };
}

function operationSignal(signal?: AbortSignal, timeoutMs?: number): AbortSignal {
    const timeout = AbortSignal.timeout(Math.max(1, Math.floor(timeoutMs ?? 600_000)));
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function abortable<Result>(
    call: () => PromiseLike<Result>,
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

export function buildResponsesTools(schemas: z.ZodType[], model: string, names?: string[]) {
    resolveBedrockResponsesModel(model);
    if (!schemas.length) throw new Error('Bedrock generation requires an output schema');
    const prepared = schemas.map(schema => ({
        schema: schema instanceof z.ZodObject ? schema : z.object({ args: schema }),
        wrapped: !(schema instanceof z.ZodObject),
    }));
    const tools: OpenAI.Responses.FunctionTool[] = prepared.map(({ schema }, index) => {
        const name = names?.[index] ?? `function_${index}`;
        if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) throw new Error('Invalid Bedrock tool name');
        return {
            type: 'function',
            name,
            description: `Function for structured output ${index}`,
            parameters: compileProjectedSchema(schema),
            strict: false,
        };
    });
    if (new Set(tools.map(tool => tool.name)).size !== tools.length)
        throw new Error('Duplicate Bedrock tool names');
    return { tools, prepared };
}

function assertHistoryTools(
    input: ResponseCreateParamsNonStreaming,
    tools: OpenAI.Responses.FunctionTool[]
): void {
    const names = new Set(tools.map(tool => tool.name));
    for (const item of input.input as ResponseInputItem[]) {
        if (item.type === 'function_call' && !names.has(item.name))
            throw new Error(
                'Bedrock tool history requires its original registered tool definitions'
            );
    }
}
function parseArguments(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch (error) {
        throw markProviderFailure(error, {
            providerOperation: 'argument_parse',
            providerFailureReason: 'arguments_json',
        });
    }
}
async function validateOutput(value: unknown, schema: z.ZodType): Promise<unknown> {
    try {
        return await schema.parseAsync(value);
    } catch (error) {
        throw markProviderFailure(error, {
            providerOperation: 'response_validation',
            providerFailureReason:
                error instanceof z.ZodError
                    ? error.issues.some(
                          issue => issue.code === 'too_big' || issue.code === 'too_small'
                      )
                        ? 'response_bounds'
                        : 'response_shape'
                    : 'response_value',
        });
    }
}
function selectedCall(
    response: OpenAI.Responses.Response,
    names: string[]
): OpenAI.Responses.ResponseFunctionToolCall {
    if (response.status !== 'completed') throw lifecycleFailure(response.error);
    if (!Array.isArray(response.output))
        throw markProviderFailure(malformed(), {
            providerOperation: 'tool_selection',
            providerFailureReason: 'response_shape',
        });
    const calls = response.output.filter(
        (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call'
    );
    if (
        calls.length !== 1 ||
        !names.includes(calls[0]!.name) ||
        !calls[0]!.call_id ||
        calls[0]!.status === 'incomplete' ||
        calls[0]!.status === 'in_progress' ||
        response.output.some(
            item => item.type === 'message' && item.content.some(part => part.type === 'refusal')
        )
    )
        throw markProviderFailure(malformed(), {
            providerOperation: 'tool_selection',
            providerFailureReason: !calls.length ? 'missing_tool' : 'invalid_tool',
        });
    return calls[0]!;
}

export class BedrockResponsesProvider {
    private client?: OpenAI;
    constructor(
        private readonly clientFactory = createBedrockResponsesClient,
        private readonly onEvent?: (type: string) => void,
        // Same Responses protocol against OpenAI when LLM_PROVIDER=openai.
        private readonly route: Pick<LlmRoute, 'provider' | 'requestModel'> = {
            provider: 'bedrock',
            requestModel: profile => profile,
        }
    ) {}
    private buildRequest(
        params: Parameters<typeof buildResponsesRequest>[0]
    ): ReturnType<typeof buildResponsesRequest> {
        const request = buildResponsesRequest(params);
        return {
            ...request,
            model: request.model && this.route.requestModel(request.model),
        };
    }
    private getClient(): OpenAI {
        return (this.client ??= this.clientFactory());
    }

    async call<T extends z.ZodType | z.ZodType[]>({
        systemPrompt = '',
        message,
        model,
        output,
        signal: callerSignal,
        timeoutMs,
        maxOutputTokens,
    }: {
        systemPrompt?: string;
        message: string | GenericMessageParam[];
        model: string;
        output: T;
        signal?: AbortSignal;
        timeoutMs?: number;
        maxOutputTokens?: number;
    }): Promise<
        T extends z.ZodType ? z.infer<T> : T extends z.ZodType[] ? z.infer<T[number]> : never
    > {
        if (
            maxOutputTokens !== undefined &&
            (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 4096)
        )
            throw new Error('Bounded generation unavailable');
        const signal = operationSignal(callerSignal, timeoutMs);
        signal.throwIfAborted();
        const input = this.buildRequest({ systemPrompt, message, model });
        const schemas: z.ZodType[] = Array.isArray(output) ? output : [output as z.ZodType];
        const { tools, prepared } = buildResponsesTools(schemas, model);
        assertHistoryTools(input, tools);
        this.onEvent?.('request_started');
        let response: OpenAI.Responses.Response;
        try {
            response = await withProviderRequest(() =>
                abortable(async () => {
                    const client = this.getClient();
                    await reserveProviderRequest('generation');
                    signal.throwIfAborted();
                    const recordUsage = recordUsageRequest('generation');
                    const result = await client.responses.create(
                        {
                            ...input,
                            ...(maxOutputTokens === undefined
                                ? {}
                                : { max_output_tokens: maxOutputTokens }),
                            tools,
                            tool_choice: 'required',
                            parallel_tool_calls: false,
                        },
                        { signal }
                    );
                    recordUsage(generationUsage(result));
                    return result;
                }, signal)
            );
        } catch (error) {
            const failure = signal.aborted
                ? signal.reason
                : normalizeAiProviderError(error, this.route.provider);
            // Only the provider request boundary can establish timeout replay evidence.
            // An expired caller/stage/owner signal never authorizes automatic recovery.
            if (callerSignal?.aborted) markGenerationFailure(failure, 'caller_aborted');
            else if (
                (signal.aborted &&
                    signal.reason instanceof DOMException &&
                    signal.reason.name === 'TimeoutError') ||
                (failure instanceof AiProviderError && failure.code === 'ai_request_timeout')
            )
                markGenerationFailure(failure, 'provider_timeout');
            throw failure;
        }
        signal.throwIfAborted();
        this.onEvent?.('response_received');
        const call = selectedCall(
            response,
            tools.map(tool => tool.name)
        );
        const index = tools.findIndex(tool => tool.name === call.name);
        this.onEvent?.('schema_validation');
        const parsed = await validateOutput(
            parseArguments(call.arguments),
            prepared[index]!.schema
        );
        signal.throwIfAborted();
        const value = prepared[index]!.wrapped ? (parsed as { args: unknown }).args : parsed;
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
        return this.consume({ systemPrompt, message, model, options });
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
        const signal = operationSignal(params.signal, params.timeoutMs);
        signal.throwIfAborted();
        const { tools } = buildResponsesTools([params.output], params.model, [params.toolName]);
        const trackString = createJsonStringTracker();
        const argumentsText = await this.consume({
            ...params,
            tools,
            expectedTool: params.toolName,
            operationSignal: signal,
            options: { signal: params.signal, timeoutMs: params.timeoutMs },
            onArguments: async (text, delta) => {
                if (trackString(delta)) return;
                let partial: Partial<z.output<z.ZodObject<Shape>>>;
                try {
                    partial = (await params.output
                        .partial()
                        .parseAsync(partialParse(text))) as Partial<z.output<z.ZodObject<Shape>>>;
                } catch {
                    return;
                }
                signal.throwIfAborted();
                await params.onPartial(partial);
            },
        });
        this.onEvent?.('schema_validation');
        const result = (await validateOutput(
            parseArguments(argumentsText),
            params.output
        )) as z.output<z.ZodObject<Shape>>;
        signal.throwIfAborted();
        return result;
    }

    private async consume(params: {
        systemPrompt: string;
        message: string | GenericMessageParam[];
        model: string;
        options: StreamingOptions;
        tools?: OpenAI.Responses.FunctionTool[];
        expectedTool?: string;
        operationSignal?: AbortSignal;
        onArguments?: (text: string, delta: string) => Promise<void>;
    }): Promise<string> {
        const { options } = params;
        const signal = params.operationSignal ?? operationSignal(options.signal, options.timeoutMs);
        signal.throwIfAborted();
        const input = this.buildRequest(params);
        assertHistoryTools(input, params.tools ?? []);
        const request = {
            ...input,
            stream: true as const,
            ...(params.tools && {
                tools: params.tools,
                tool_choice: { type: 'function' as const, name: params.expectedTool! },
                parallel_tool_calls: false,
            }),
        };
        this.onEvent?.('request_started');
        let stream;
        let recordUsage: ((usage: unknown) => void) | undefined;
        try {
            stream = await withProviderRequest(() =>
                abortable(async () => {
                    const client = this.getClient();
                    await reserveProviderRequest('generation');
                    signal.throwIfAborted();
                    recordUsage = recordUsageRequest('generation');
                    return client.responses.create(request, { signal });
                }, signal)
            );
        } catch (error) {
            signal.throwIfAborted();
            throw normalizeAiProviderError(error, this.route.provider);
        }
        this.onEvent?.('stream_received');
        let content = '';
        let completed = false;
        let tool:
            | {
                  id: string;
                  callId: string;
                  index: number;
                  arguments: string;
                  done: boolean;
              }
            | undefined;
        try {
            for await (const event of stream) {
                if (
                    event.type === 'response.completed' ||
                    event.type === 'response.failed' ||
                    event.type === 'response.incomplete'
                )
                    recordUsage?.(generationUsage(event.response));
                signal.throwIfAborted();
                this.onEvent?.(
                    /^response\.(created|in_progress|completed|failed|incomplete|output_item\.(added|done)|function_call_arguments\.(delta|done)|output_text\.(delta|done)|refusal\.(delta|done))$/.test(
                        event.type
                    ) || event.type === 'error'
                        ? event.type
                        : 'other_event'
                );
                if (completed) throw incomplete();
                if (event.type === 'response.output_text.delta') {
                    if (!params.expectedTool) {
                        await abortable(async () => options.onChunk?.(event.delta), signal);
                        if (options.accumulateContent !== false) content += event.delta;
                    }
                } else if (
                    event.type === 'response.output_item.added' &&
                    event.item.type === 'function_call'
                ) {
                    if (
                        !params.expectedTool ||
                        tool ||
                        event.item.name !== params.expectedTool ||
                        !event.item.id ||
                        !event.item.call_id ||
                        event.item.arguments
                    )
                        throw malformed();
                    tool = {
                        id: event.item.id,
                        callId: event.item.call_id,
                        index: event.output_index,
                        arguments: '',
                        done: false,
                    };
                } else if (event.type === 'response.function_call_arguments.delta') {
                    if (
                        !tool ||
                        tool.done ||
                        event.item_id !== tool.id ||
                        event.output_index !== tool.index
                    )
                        throw malformed();
                    tool.arguments += event.delta;
                    await abortable(
                        async () => params.onArguments?.(tool!.arguments, event.delta),
                        signal
                    );
                } else if (event.type === 'response.function_call_arguments.done') {
                    if (
                        !tool ||
                        tool.done ||
                        event.item_id !== tool.id ||
                        event.output_index !== tool.index ||
                        (event.name !== undefined && event.name !== params.expectedTool) ||
                        event.arguments !== tool.arguments
                    )
                        throw malformed();
                    tool.done = true;
                } else if (
                    event.type === 'response.output_item.done' &&
                    event.item.type === 'function_call'
                ) {
                    if (
                        !tool ||
                        !tool.done ||
                        event.output_index !== tool.index ||
                        event.item.id !== tool.id ||
                        event.item.call_id !== tool.callId ||
                        event.item.name !== params.expectedTool ||
                        event.item.arguments !== tool.arguments
                    )
                        throw malformed();
                } else if (event.type === 'response.completed') {
                    if (event.response.status !== 'completed')
                        throw lifecycleFailure(event.response.error);
                    if (params.expectedTool) {
                        this.onEvent?.('response_received');
                        const call = selectedCall(event.response, [params.expectedTool]);
                        if (
                            !tool?.done ||
                            call.id !== tool.id ||
                            call.call_id !== tool.callId ||
                            call.arguments !== tool.arguments
                        )
                            throw incomplete();
                    } else if (
                        event.response.status !== 'completed' ||
                        event.response.output.some(
                            item =>
                                item.type === 'function_call' ||
                                (item.type === 'message' &&
                                    item.content.some(part => part.type === 'refusal'))
                        )
                    )
                        throw incomplete();
                    completed = true;
                } else if (
                    event.type === 'error' ||
                    event.type === 'response.failed' ||
                    event.type === 'response.incomplete' ||
                    event.type === 'response.refusal.delta' ||
                    event.type === 'response.refusal.done'
                ) {
                    throw lifecycleFailure(
                        event.type === 'error'
                            ? event
                            : event.type === 'response.failed' ||
                                event.type === 'response.incomplete'
                              ? event.response?.error
                              : undefined
                    );
                } else if (
                    ![
                        'response.created',
                        'response.in_progress',
                        'response.output_item.added',
                        'response.output_item.done',
                        'response.content_part.added',
                        'response.content_part.done',
                        'response.output_text.done',
                        'response.reasoning_text.delta',
                        'response.reasoning_text.done',
                        'response.reasoning_summary_text.delta',
                        'response.reasoning_summary_text.done',
                        'response.reasoning_summary_part.added',
                        'response.reasoning_summary_part.done',
                    ].includes(event.type)
                ) {
                    throw incomplete();
                }
            }
            signal.throwIfAborted();
            if (!completed) throw incomplete();
            return params.expectedTool ? tool!.arguments : content;
        } catch (error) {
            stream.controller.abort();
            throw error;
        }
    }
}

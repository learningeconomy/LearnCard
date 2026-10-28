import { recoverEmbeddingPrivacy } from './embedding-privacy-recovery';
import { currentEmbeddingRecovery } from './embedding-recovery';
import { currentGeneration, NOVA_MODEL, assertNovaEnabled } from './embedding-generation';
import { novaEmbeddings, novaPayload, type EmbeddingPurpose } from './nova-embeddings';
import { withPrivacyInputOrigin } from './privacy-diagnostics';
import { settleAll } from '../utils/settleAll';
import { withAiInsightStage } from '../diagnostics/ai-insight';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions.mjs';
import type { z } from 'zod';
import { CHAT_MODEL, EMBEDDING_MODEL, OPENAI_API_KEY } from '../constants/env';
import { getProviderModel, type GenericMessageParam, type StreamingOptions } from './providers';
import { BedrockResponsesProvider } from './bedrock-responses';
import { getLlmRoute } from './ai-provider-config';
import { appendLocaleInstruction, getCurrentLocale } from './locale';
import { withAiProviderCircuit } from './provider-circuit';
import { withAiAudit } from './audit';
import { pseudonymizeProviderInput, restoreProviderOutput } from './pseudonymization';
import { createRestoredTextStream } from './streaming-output';
import { assertCurrentAiConsent } from './privacy';
import { runInAiCallConsentScope } from '../learncard/requestScope';

// Every check in this module guards a provider dispatch, a provider result or a
// publication, so it reads the consent contract again instead of reusing the
// request's shared read. Revocation then stops work at the next boundary.
//
// Each exported call runs in its own AI call consent scope. The audit,
// guardrail and Nova checks inside it share one read per call; the dispatch and
// publication checks here still read fresh and refresh that shared read, except
// the embedding's pre-dispatch check (see assertEmbeddingDispatchConsent).
const assertFreshAiConsent = (purpose: Parameters<typeof assertCurrentAiConsent>[0]) =>
    assertCurrentAiConsent(purpose, { fresh: true });
const assertFreshEmbeddingConsent = () => assertFreshAiConsent('embedding');
// The embedding's pre-dispatch check shares the AI call's read. The audit check
// read the contract live when this call began, and only the guardrail runs
// between them; its own checks before and after ApplyGuardrail already share
// that read, as do Nova's per-dispatch checks. A third live read here cost the
// opening one LearnCard round trip (seconds) of its 8 s budget before Qdrant.
// With no read in the call yet this still reads live. The result check after
// the provider stays fully fresh.
const assertEmbeddingDispatchConsent = () =>
    assertCurrentAiConsent('embedding', { fresh: true, oncePerAiCall: true });
import { getCurrentOwnerOperation } from '../services/dataErasure';

// One AI call: one consent scope.
const runInAiCallScope = <Result>(operation: () => Promise<Result>) =>
    runInAiCallConsentScope(operation);

const ownerBoundSignal = (signal?: AbortSignal): AbortSignal | undefined => {
    const owner = getCurrentOwnerOperation();
    return owner ? (signal ? AbortSignal.any([signal, owner.signal]) : owner.signal) : signal;
};

// Pin embeddings independently; ambient OPENAI_BASE_URL must not reroute them.
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
    maxRetries: 0,
});
// LLM_PROVIDER=bedrock (default) or openai; validated at startup.
const llm = getLlmRoute();
const llmProvider = new BedrockResponsesProvider(llm.clientFactory, undefined, llm);
const STREAM_CONSENT_CHECK_INTERVAL_MS = 15_000;

// Re-export types from providers
export type { StreamingOptions } from './providers';

/**
 * Generic AI call function that takes a zod validator and returns a validated response
 * @param options Configuration options for the AI call
 * @returns A validated response based on the provided zod schema(s)
 */
export async function aiCall<T extends z.ZodType | z.ZodType[]>({
    systemPrompt = '',
    message,
    output,
    model = CHAT_MODEL,
    signal,
    timeoutMs,
    maxOutputTokens,
}: {
    systemPrompt?: string;
    message: string | GenericMessageParam[];
    output: T;
    model?: ChatCompletionCreateParamsBase['model'];
    signal?: AbortSignal;
    timeoutMs?: number;
    maxOutputTokens?: number;
}): Promise<T extends z.ZodType ? z.infer<T> : T extends z.ZodType[] ? z.infer<T[number]> : never> {
    signal = ownerBoundSignal(signal);
    if (
        maxOutputTokens !== undefined &&
        (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 4096)
    )
        throw new Error('Bounded generation unavailable');
    const providerModel = getProviderModel(model, 'openai');
    const client = llmProvider;
    const recipient = llm.provider;
    const auditModel = llm.auditModel(providerModel);

    return runInAiCallScope(() =>
        withAiAudit(
            {
                provider: recipient,
                model: auditModel,
                operation: 'structured-output',
                purpose: 'model-inference',
            },
            async () => {
                if (!client) throw new Error(`No provider available for model: ${model}`);

                const [providerSystemPrompt, providerMessage] = await settleAll([
                    withPrivacyInputOrigin('request_instructions', () =>
                        pseudonymizeProviderInput(
                            systemPrompt + appendLocaleInstruction(getCurrentLocale())
                        )
                    ),
                    pseudonymizeProviderInput(message),
                ]);
                await assertFreshAiConsent('model-inference');

                const result = await withAiInsightStage('generation', () =>
                    withAiProviderCircuit(recipient, () =>
                        client.call({
                            systemPrompt: providerSystemPrompt,
                            message: providerMessage,
                            output,
                            model: providerModel,
                            signal,
                            timeoutMs,
                            maxOutputTokens,
                        })
                    )
                );
                const restored = await restoreProviderOutput(result);
                await assertFreshAiConsent('model-inference');
                return restored;
            }
        )
    );
}

/**
 * Generic AI call function for streaming responses
 * @param options Configuration options for the streaming AI call
 * @returns A promise that resolves to the accumulated content or undefined if not accumulating
 */
export async function streamingAiCall({
    systemPrompt = '',
    message,
    model = CHAT_MODEL,
    options = {},
}: {
    systemPrompt?: string;
    message: string | ChatCompletionMessageParam[];
    model?: ChatCompletionCreateParamsBase['model'];
    options?: StreamingOptions;
}): Promise<string> {
    options = { ...options, signal: ownerBoundSignal(options.signal) };
    const providerModel = getProviderModel(model, 'openai');
    const client = llmProvider;
    const recipient = llm.provider;
    const auditModel = llm.auditModel(providerModel);

    return runInAiCallScope(() =>
        withAiAudit(
            {
                provider: recipient,
                model: auditModel,
                operation: 'streaming-output',
                purpose: 'model-inference',
            },
            async () => {
                if (!client) throw new Error(`No provider available for model: ${model}`);

                const [providerSystemPrompt, providerMessage] = await settleAll([
                    withPrivacyInputOrigin('request_instructions', () =>
                        pseudonymizeProviderInput(
                            systemPrompt + appendLocaleInstruction(getCurrentLocale())
                        )
                    ),
                    pseudonymizeProviderInput(message),
                ]);
                await assertFreshAiConsent('model-inference');
                let lastConsentCheck = performance.now();

                if (options.audience === 'external-model') {
                    // MCP answers leave Passport for another model. Keep known tokens masked
                    // and inspect the complete answer for additional PII before publishing it.
                    const result = await withAiProviderCircuit(recipient, () =>
                        client.streamingCall({
                            systemPrompt: providerSystemPrompt,
                            message: providerMessage,
                            model: providerModel,
                            options: {
                                ...options,
                                accumulateContent: true,
                                onChunk: async () => {
                                    options.signal?.throwIfAborted();
                                    if (
                                        performance.now() - lastConsentCheck >=
                                        STREAM_CONSENT_CHECK_INTERVAL_MS
                                    ) {
                                        await assertFreshAiConsent('model-inference');
                                        lastConsentCheck = performance.now();
                                    }
                                },
                            },
                        })
                    );
                    await assertFreshAiConsent('model-inference');
                    options.signal?.throwIfAborted();
                    const masked = await pseudonymizeProviderInput(result, 'OUTPUT');
                    await assertFreshAiConsent('model-inference');
                    options.signal?.throwIfAborted();
                    await options.onChunk?.(masked);
                    await assertFreshAiConsent('model-inference');
                    options.signal?.throwIfAborted();
                    return options.accumulateContent === false ? '' : masked;
                }

                const restoredStream = createRestoredTextStream(async text => {
                    const restored = await restoreProviderOutput(text);
                    if (performance.now() - lastConsentCheck >= STREAM_CONSENT_CHECK_INTERVAL_MS) {
                        await assertFreshAiConsent('model-inference');
                        lastConsentCheck = performance.now();
                    }
                    return restored;
                }, options);
                await withAiProviderCircuit(recipient, () =>
                    client.streamingCall({
                        systemPrompt: providerSystemPrompt,
                        message: providerMessage,
                        model: providerModel,
                        options: {
                            ...options,
                            signal: ownerBoundSignal(options.signal),
                            accumulateContent: false,
                            onChunk: restoredStream.push,
                        },
                    })
                );
                await assertFreshAiConsent('model-inference');
                return restoredStream.finish();
            }
        )
    );
}

export async function embeddingAiCall(
    texts: string[],
    signal?: AbortSignal,
    purpose: EmbeddingPurpose = 'document'
): Promise<number[][]> {
    if (texts.length === 0) return [];
    signal = ownerBoundSignal(signal);
    const nova = currentGeneration() === 'nova1024v1';
    if (nova) {
        assertNovaEnabled();
        texts.forEach(text => novaPayload(text, purpose));
    }

    return runInAiCallScope(() =>
        withAiAudit(
            {
                provider: nova ? 'bedrock' : 'openai',
                model: nova ? NOVA_MODEL : EMBEDDING_MODEL,
                operation: 'embedding',
                purpose: 'embedding',
            },
            async () => {
                signal?.throwIfAborted();

                const providerTexts = await recoverEmbeddingPrivacy(
                    nova && purpose === 'document'
                        ? currentEmbeddingRecovery()?.privacy
                        : undefined,
                    signal,
                    () => pseudonymizeProviderInput(texts)
                );
                await assertEmbeddingDispatchConsent();

                return withAiProviderCircuit(
                    nova ? 'bedrock-embeddings' : 'openai',
                    async () => {
                        signal?.throwIfAborted();

                        if (nova) {
                            const result = await novaEmbeddings(providerTexts, purpose, signal);
                            await assertFreshEmbeddingConsent();
                            signal?.throwIfAborted();
                            return result;
                        }
                        const response = await openai.embeddings.create(
                            {
                                model: EMBEDDING_MODEL,
                                input: providerTexts,
                            },
                            { signal, maxRetries: 0 }
                        );

                        await assertFreshEmbeddingConsent();
                        signal?.throwIfAborted();

                        return response.data
                            .toSorted((left, right) => left.index - right.index)
                            .map(({ embedding }) => embedding);
                    },
                    { signal }
                );
            }
        )
    );
}

export async function streamingStructuredAiCall<Shape extends z.ZodRawShape>({
    systemPrompt,
    message,
    output,
    toolName,
    model,
    signal,
    timeoutMs,
    onPartial,
}: {
    systemPrompt: string;
    message: string;
    output: z.ZodObject<Shape>;
    toolName: string;
    model: string;
    signal?: AbortSignal;
    timeoutMs: number;
    onPartial: (partial: Partial<z.output<z.ZodObject<Shape>>>) => void | Promise<void>;
}): Promise<z.output<z.ZodObject<Shape>>> {
    signal = ownerBoundSignal(signal);
    const recipient = llm.provider;
    const providerModel = getProviderModel(model, 'openai');
    const auditModel = llm.auditModel(providerModel);

    return runInAiCallScope(() =>
        withAiAudit(
            {
                provider: recipient,
                model: auditModel,
                operation: 'structured-streaming-output',
                purpose: 'model-inference',
            },
            async () => {
                const [providerSystemPrompt, providerMessage] = await settleAll([
                    withPrivacyInputOrigin('request_instructions', () =>
                        pseudonymizeProviderInput(
                            systemPrompt + appendLocaleInstruction(getCurrentLocale())
                        )
                    ),
                    pseudonymizeProviderInput(message),
                ]);
                await assertFreshAiConsent('model-inference');
                let lastConsentCheck = performance.now();

                return withAiProviderCircuit(recipient, async () => {
                    signal?.throwIfAborted();
                    const result = await llmProvider.structuredStreamingCall({
                        systemPrompt: providerSystemPrompt,
                        message: providerMessage,
                        output,
                        toolName,
                        model: providerModel,
                        signal,
                        timeoutMs,
                        onPartial: async partial => {
                            const restored = await restoreProviderOutput(partial);
                            if (
                                performance.now() - lastConsentCheck >=
                                STREAM_CONSENT_CHECK_INTERVAL_MS
                            ) {
                                await assertFreshAiConsent('model-inference');
                                lastConsentCheck = performance.now();
                            }
                            signal?.throwIfAborted();
                            await onPartial(restored);
                        },
                    });
                    signal?.throwIfAborted();
                    const restored = await restoreProviderOutput(result);
                    await assertFreshAiConsent('model-inference');
                    return restored;
                });
            }
        )
    );
}

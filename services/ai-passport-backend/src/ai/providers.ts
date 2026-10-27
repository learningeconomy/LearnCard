import type { ChatCompletionMessageParam } from 'openai/resources';
import type { ResponseInputItem } from 'openai/resources/responses/responses';
import type { z } from 'zod';

/**
 * Generic message type that works with both Chat Completions and Responses API
 */
export type GenericMessageParam = ChatCompletionMessageParam | ResponseInputItem;

/**
 * Options for streaming AI calls
 */
export type StreamingOptions = {
    /**
     * Handle an ordered text chunk. Async consumers apply backpressure.
     * Raw provider envelopes are never exposed to callers.
     */
    onChunk?: (chunk: string) => void | Promise<void>;

    /**
     * Whether to accumulate chunks into a complete message
     * Default: true
     */
    accumulateContent?: boolean;
    /** External model consumers receive masked output without identity restoration. */
    audience?: 'learner' | 'external-model';
    signal?: AbortSignal;
    timeoutMs?: number;
};

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'google';

/**
 * Provider-specific model configurations
 */
export const PROVIDER_MODELS = {
    openai: {
        // Required logical roles; Bedrock invocation resolves only verified profiles.
        'gpt-6.1-sol': 'gpt-6.1-sol',
        'gpt-6-luna': 'gpt-6-luna',
        // GPT-5.6 family
        'gpt-5.6': 'gpt-5.6-sol',
        'gpt-5.6-sol': 'gpt-5.6-sol',
        'gpt-5.6-terra': 'gpt-5.6-terra',
        'gpt-5.6-luna': 'gpt-5.6-luna',
        // Earlier GPT-5 families
        'gpt-5.5': 'gpt-5.5',
        'gpt-5.5-pro': 'gpt-5.5-pro',
        'gpt-5.4': 'gpt-5.4',
        'gpt-5.4-pro': 'gpt-5.4-pro',
        'gpt-5-mini': 'gpt-5-mini',
        'gpt-5-nano': 'gpt-5-nano',
        // Legacy mappings for backward compatibility
        'gpt-4o': 'gpt-5.5',
        'gpt-4o-mini': 'gpt-5-nano',
        'o4-mini': 'gpt-5-mini',
        'o3-mini': 'gpt-5-mini',
        'gpt-4.1': 'gpt-5-mini',
        'gpt-4.1-mini': 'gpt-5-nano',
        'gpt-4.1-nano': 'gpt-5-nano',
        'text-embedding-3-small': 'text-embedding-3-small',
    },
    anthropic: {
        'claude-4-sonnet': 'claude-sonnet-4-20250514',
        'claude-4-opus': 'claude-opus-4-20250514',
        'claude-3.7-sonnet': 'claude-3-7-sonnet-20250219',
        'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
    },
    google: {
        'gemini-2.5-pro': 'gemini-2.5-pro-preview-06-05',
        'gemini-2.5-flash': 'gemini-2.5-flash-preview-05-20',
    },
} as const;

export type OpenAIReasoningEffort =
    'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

const OPENAI_REASONING_SUFFIXES = [
    'none',
    'minimal',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
] as const satisfies readonly OpenAIReasoningEffort[];
const GPT_56_REASONING_EFFORTS: readonly OpenAIReasoningEffort[] = [
    'none',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
];
// Exact Luna Responses contract, kept separate from earlier-family assumptions.
const LUNA_6_REASONING_EFFORTS: readonly OpenAIReasoningEffort[] = [
    'none',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
];
const SOL_61_REASONING_EFFORTS: readonly OpenAIReasoningEffort[] = [
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
];
const EARLIER_GPT_5_REASONING_EFFORTS: readonly OpenAIReasoningEffort[] = [
    'none',
    'minimal',
    'low',
    'medium',
    'high',
];

const resolveOpenAIModel = (model: string): string => {
    const baseModel = model.startsWith('us.openai.') ? model.slice('us.openai.'.length) : model;
    return baseModel in PROVIDER_MODELS.openai
        ? PROVIDER_MODELS.openai[baseModel as keyof typeof PROVIDER_MODELS.openai]
        : baseModel;
};

export function assertOpenAIReasoningEffort(
    model: string,
    effort: string
): asserts effort is OpenAIReasoningEffort {
    const resolvedModel = resolveOpenAIModel(model);
    const supportedEfforts =
        resolvedModel === 'gpt-6.1-sol'
            ? SOL_61_REASONING_EFFORTS
            : resolvedModel === 'gpt-6-luna'
              ? LUNA_6_REASONING_EFFORTS
              : resolvedModel.startsWith('gpt-5.6') || resolvedModel.startsWith('gpt-6')
                ? GPT_56_REASONING_EFFORTS
                : EARLIER_GPT_5_REASONING_EFFORTS;

    if (supportedEfforts.some(supported => supported === effort)) return;

    throw new RangeError(`Reasoning effort "${effort}" is not supported for model "${model}"`);
}

export function parseOpenAIModelAlias(model: string): {
    apiModel: string;
    reasoningEffort?: OpenAIReasoningEffort;
} {
    for (const suffix of OPENAI_REASONING_SUFFIXES) {
        const candidateSuffix = `-${suffix}`;

        if (!model.endsWith(candidateSuffix)) continue;

        const apiModel = model.slice(0, -candidateSuffix.length);
        const resolvedModel = resolveOpenAIModel(apiModel);

        if (!resolvedModel.startsWith('gpt-5') && !resolvedModel.startsWith('gpt-6')) continue;

        assertOpenAIReasoningEffort(resolvedModel, suffix);

        return { apiModel, reasoningEffort: suffix };
    }

    return { apiModel: model };
}

export function getOpenAIReasoningEffort(
    model: string,
    configuredEffort?: string
): OpenAIReasoningEffort | undefined {
    const { apiModel, reasoningEffort } = parseOpenAIModelAlias(model);
    const resolvedModel = resolveOpenAIModel(apiModel);

    if (!resolvedModel.startsWith('gpt-5') && !resolvedModel.startsWith('gpt-6')) return undefined;

    const usesDocumentedModelDefault =
        resolvedModel === 'gpt-6.1-sol' || resolvedModel === 'gpt-6-luna';
    // Exact models default to medium. An explicitly configured unsupported effort
    // is an error, even when a supported model alias would otherwise override it.
    if (usesDocumentedModelDefault && configuredEffort !== undefined)
        assertOpenAIReasoningEffort(resolvedModel, configuredEffort);
    const effectiveEffort =
        reasoningEffort ?? configuredEffort ?? (usesDocumentedModelDefault ? 'medium' : 'none');
    const supportsNoneReasoning =
        resolvedModel.startsWith('gpt-5.4') ||
        resolvedModel.startsWith('gpt-5.5') ||
        resolvedModel.startsWith('gpt-5.6') ||
        resolvedModel.startsWith('gpt-6');

    if (effectiveEffort === 'none' && !supportsNoneReasoning) return 'minimal';

    assertOpenAIReasoningEffort(resolvedModel, effectiveEffort);

    return effectiveEffort;
}

/**
 * Detect which provider a model belongs to
 */
export function detectProvider(model: string): AIProvider {
    const { apiModel: openaiBaseModel } = parseOpenAIModelAlias(model);

    // Check OpenAI models
    if (openaiBaseModel in PROVIDER_MODELS.openai) {
        return 'openai';
    }

    // Check Anthropic models
    if (model in PROVIDER_MODELS.anthropic) {
        return 'anthropic';
    }

    // Check Google models
    if (model in PROVIDER_MODELS.google) {
        return 'google';
    }

    // Default to OpenAI for unknown models
    return 'openai';
}

/**
 * Get the provider-specific model name
 */
export function getProviderModel(model: string, provider: AIProvider): string {
    const providerModels = PROVIDER_MODELS[provider];

    if (provider === 'openai') {
        const { apiModel: openaiBaseModel, reasoningEffort } = parseOpenAIModelAlias(model);
        const providerModel =
            openaiBaseModel in providerModels
                ? providerModels[openaiBaseModel as keyof typeof providerModels]
                : openaiBaseModel;

        return reasoningEffort ? `${providerModel}-${reasoningEffort}` : providerModel;
    }

    return model in providerModels ? providerModels[model as keyof typeof providerModels] : model;
}

/**
 * Interface for AI provider implementations
 */
export type AIProviderClient = {
    /**
     * Make a structured AI call with tool calling
     */
    call<T extends z.ZodType | z.ZodType[]>(params: {
        systemPrompt?: string;
        message: string | GenericMessageParam[];
        output: T;
        model: string;
        signal?: AbortSignal;
        timeoutMs?: number;
        maxOutputTokens?: number;
    }): Promise<
        T extends z.ZodType ? z.infer<T> : T extends z.ZodType[] ? z.infer<T[number]> : never
    >;

    /**
     * Make a streaming AI call
     */
    streamingCall(params: {
        systemPrompt?: string;
        message: string | GenericMessageParam[];
        model: string;
        options?: StreamingOptions;
    }): Promise<string>;
};

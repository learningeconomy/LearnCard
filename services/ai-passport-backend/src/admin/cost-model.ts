// Planning only. No provider, credential, database, or network dependencies.
// Prices checked 2026-10-13; on-demand text inference, not AWS batch pricing.
export const PRICE_SOURCES = {
    embedding:
        'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/us-east-1/index.json',
    generation:
        'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-luna.html#model-card-openai-gpt-6-luna-pricing',
    privacy: 'https://aws.amazon.com/bedrock/pricing/',
} as const;
export type CostPricing = {
    embeddingModel: string;
    generationModel: string | null;
    generationConfiguration?: string | null;
    region: string;
    checkedAt: string;
    embeddingRateSource: string | null;
    generationRateSource: string | null;
    privacyRateSource: string | null;
    embeddingUsdPerMillionTokens: number | null;
    generationInputUsdPerMillionTokens: number | null;
    generationOutputUsdPerMillionTokens: number | null;
    privacyUsdPerThousandTextUnits: number | null;
};

/** Configuration identity only; this never probes provider availability. */
export function costPricing(environment: Record<string, string | undefined>): CostPricing {
    const regional =
        environment.AWS_REGION === 'us-east-1' &&
        !['AWS_ENDPOINT_URL', 'AWS_ENDPOINT_URL_BEDROCK', 'AWS_ENDPOINT_URL_BEDROCK_RUNTIME'].some(
            key => Boolean(environment[key])
        );
    const baseUrl = 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1';
    const generationEndpoint =
        environment.BEDROCK_BASE_URL === undefined ||
        environment.BEDROCK_BASE_URL === baseUrl ||
        environment.BEDROCK_BASE_URL === `${baseUrl}/`;
    const model = environment.TITLE_MODEL || 'gpt-6-luna-none';
    const luna = /^(?:us\.openai\.)?gpt-6-luna(?:-(?:none|low|medium|high|xhigh|max))?$/.test(
        model
    );
    const configuredEffort = environment.OPENAI_REASONING_EFFORT || undefined;
    const validEffort =
        configuredEffort === undefined ||
        /^(?:none|low|medium|high|xhigh|max)$/.test(configuredEffort);
    const aliasEffort = model.match(/-(none|low|medium|high|xhigh|max)$/)?.[1];
    const effectiveEffort = aliasEffort ?? configuredEffort ?? 'medium';
    // Old overrides have no model binding; do not silently replace them with public prices.
    const embeddingOverride =
        environment.NOVA_EMBEDDING_USD_PER_MILLION_TOKENS !== undefined ||
        environment.NOVA_EMBEDDING_RATE_SOURCE !== undefined;
    const configuredRate = Number(environment.NOVA_EMBEDDING_USD_PER_MILLION_TOKENS);
    const validEmbeddingOverride =
        configuredRate === 0.135 &&
        Boolean(environment.NOVA_EMBEDDING_USD_PER_MILLION_TOKENS?.trim()) &&
        environment.NOVA_EMBEDDING_RATE_SOURCE === PRICE_SOURCES.embedding;
    const generationOverride =
        environment.EMBEDDING_REPRESENTATION_USD_PER_CALL_ESTIMATE !== undefined ||
        environment.EMBEDDING_REPRESENTATION_RATE_SOURCE !== undefined;
    const generationKnown =
        regional && generationEndpoint && luna && validEffort && !generationOverride;
    const embeddingRate = !regional
        ? null
        : embeddingOverride
          ? validEmbeddingOverride
              ? configuredRate
              : null
          : 0.135;
    return {
        embeddingModel: 'amazon.nova-2-multimodal-embeddings-v1:0',
        generationModel: luna ? 'us.openai.gpt-6-luna' : null,
        generationConfiguration:
            luna && validEffort ? `us.openai.gpt-6-luna:${effectiveEffort}` : null,
        region: regional
            ? 'us-east-1 (generation: US geographic routing)'
            : 'unsupported configuration',
        checkedAt: '2026-10-13',
        embeddingRateSource: embeddingRate === null ? null : PRICE_SOURCES.embedding,
        generationRateSource: generationKnown ? PRICE_SOURCES.generation : null,
        privacyRateSource: regional ? PRICE_SOURCES.privacy : null,
        embeddingUsdPerMillionTokens: embeddingRate,
        generationInputUsdPerMillionTokens: generationKnown ? 0.11 : null,
        generationOutputUsdPerMillionTokens: generationKnown ? 0.55 : null,
        privacyUsdPerThousandTextUnits: regional ? 0.1 : null,
    };
}

const rate = (value: number | null) => value !== null && Number.isFinite(value) && value >= 0;
const priced = (units: number, value: number | null, divisor: number) =>
    units === 0 ? 0 : rate(value) ? (units * value!) / divisor : null;

export function estimateCosts(
    embeddingRequests: number,
    representationCalls: number,
    pricing: CostPricing,
    generationInputTokensPerCall = 20000
) {
    for (const count of [embeddingRequests, representationCalls])
        if (!Number.isSafeInteger(count) || count < 0 || count > 1_000_000)
            throw new RangeError('Invalid planning request count');
    // This allowance includes transformed input, instructions and schemas. It is
    // an editable assumption, NOT derived from the 16,384-byte source limit.
    if (
        !Number.isSafeInteger(generationInputTokensPerCall) ||
        generationInputTokensPerCall < 0 ||
        generationInputTokensPerCall > 272000
    )
        throw new RangeError('Input-token assumption must be between 0 and 272000');
    const generationOutputTokensPerCall = 4096;
    const embeddingTokensPerRequest = 8192;
    const privacyTextUnitsPerRequest = 100;
    // Credential: two generation-input masks + one batched five-text mask.
    // Remaining requests are messages with one mask each. Reservations count
    // attempts; this deliberately does not pretend to reconcile actual billing.
    const consistent = embeddingRequests >= representationCalls * 5;
    const privacyRequests =
        representationCalls * 3 + Math.max(0, embeddingRequests - representationCalls * 5);
    const embeddingUsd = priced(
        embeddingRequests * embeddingTokensPerRequest,
        pricing.embeddingUsdPerMillionTokens,
        1e6
    );
    const input = priced(
        representationCalls * generationInputTokensPerCall,
        pricing.generationInputUsdPerMillionTokens,
        1e6
    );
    const output = priced(
        representationCalls * generationOutputTokensPerCall,
        pricing.generationOutputUsdPerMillionTokens,
        1e6
    );
    const generationUsd = input === null || output === null ? null : input + output;
    const privacyUsd = consistent
        ? priced(
              privacyRequests * privacyTextUnitsPerRequest,
              pricing.privacyUsdPerThousandTextUnits,
              1000
          )
        : null;
    const components = { embedding: embeddingUsd, generation: generationUsd, privacy: privacyUsd };
    const missingComponents = Object.entries(components)
        .filter(([, value]) => value === null)
        .map(([key]) => key);
    const knownSubtotalUsd = Object.values(components).reduce<number>(
        (sum, value) => sum + (value ?? 0),
        0
    );
    return {
        estimateKind: 'stress-scenario' as const,
        expectedTotalUsd: null,
        embeddingRequests,
        representationCalls,
        privacyRequests,
        generationInputTokensPerCall,
        generationOutputTokensPerCall,
        embeddingTokensPerRequest,
        privacyTextUnitsPerRequest,
        embeddingUsd,
        generationUsd,
        privacyUsd,
        knownSubtotalUsd,
        missingComponents,
        totalUsd: missingComponents.length ? null : knownSubtotalUsd,
    };
}

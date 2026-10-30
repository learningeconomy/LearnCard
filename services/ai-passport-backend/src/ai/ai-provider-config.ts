import OpenAI from 'openai';
import {
    BEDROCK_API_KEY_ENV,
    getBedrockAuth,
    hasAwsCredentialSource,
    type BedrockAuth,
} from './bedrock-auth';
import {
    createBedrockResponsesClient,
    getBedrockGenerationConfig,
    getBedrockGenerationModelForAudit,
} from './bedrock-generation';
import { isPrivacyGuardrailBypassEnabled } from './privacy-guardrail-bypass';
import {
    activeGeneration,
    novaEmbeddingsEnabled,
    writeGenerations,
    type EmbeddingGeneration,
} from './embedding-generation';

// Default is the deployed path. `openai` exists so someone without AWS access
// can run generation locally on OPENAI_API_KEY.
export type LlmProvider = 'bedrock' | 'openai';
// EMBEDDINGS_PROVIDER only picks the default embedding generation: bedrock
// (default) is Nova 2 (nova1024v1), openai is legacy text-embedding-3-small
// (openai1536) for local dev without AWS access. The generation settings
// (EMBEDDINGS_READ_GENERATION, EMBEDDINGS_WRITE_GENERATION, EMBEDDINGS_DUAL_WRITE,
// BEDROCK_EMBEDDINGS_ENABLED) still override it and are what pin model,
// dimensions and Qdrant collection, so there is one switch, not two. See
// embedding-generation.ts.
export type EmbeddingsProvider = 'openai' | 'bedrock';

// The openai1536 collections only hold text-embedding-3-small vectors. Another
// model, even a 1536-dimensional one, would silently mix vector spaces.
export const APPROVED_OPENAI_EMBEDDING_MODELS = ['text-embedding-3-small'] as const;

export type AiProviderConfig = {
    llm: LlmProvider;
    embeddings: EmbeddingsProvider;
    bedrockAuth: BedrockAuth;
    /** DANGEROUSLY_BYPASS_PRIVACY_GUARDRAIL=true, already checked to be local dev. */
    privacyGuardrailBypass: boolean;
};

/** Role name (env var) to configured model alias, e.g. CHAT_MODEL: gpt-6-luna. */
export type GenerationModels = Record<string, string>;

export class AiProviderConfigError extends Error {
    constructor(readonly problems: string[]) {
        super(`Invalid AI provider configuration:\n- ${problems.join('\n- ')}`);
        this.name = 'AiProviderConfigError';
    }
}

const PROVIDERS = ['bedrock', 'openai'] as const;

const parseProvider = (
    name: 'LLM_PROVIDER' | 'EMBEDDINGS_PROVIDER',
    value: string | undefined,
    fallback: (typeof PROVIDERS)[number]
): { provider: (typeof PROVIDERS)[number] } | { problem: string } => {
    const raw = value?.trim().toLowerCase();
    if (!raw) return { provider: fallback };
    return PROVIDERS.includes(raw as (typeof PROVIDERS)[number])
        ? { provider: raw as (typeof PROVIDERS)[number] }
        : { problem: `${name} must be bedrock or openai (got "${value}")` };
};

export const getLlmProvider = (environment: NodeJS.ProcessEnv = process.env): LlmProvider => {
    const parsed = parseProvider('LLM_PROVIDER', environment.LLM_PROVIDER, 'bedrock');
    if ('problem' in parsed) throw new AiProviderConfigError([parsed.problem]);
    return parsed.provider;
};

/**
 * Parse and check every provider setting once, at process startup, so a bad
 * local .env fails with a list of fixes instead of a 503 on the first AI call.
 */
export const validateAiProviderEnvironment = (
    environment: NodeJS.ProcessEnv,
    models: GenerationModels,
    fileExists?: (path: string) => boolean
): AiProviderConfig => {
    const problems: string[] = [];
    const parsedLlm = parseProvider('LLM_PROVIDER', environment.LLM_PROVIDER, 'bedrock');
    const parsedEmbeddings = parseProvider(
        'EMBEDDINGS_PROVIDER',
        environment.EMBEDDINGS_PROVIDER,
        // Unset follows the generation provider (see defaultEmbeddingGeneration).
        'provider' in parsedLlm ? parsedLlm.provider : 'bedrock'
    );
    for (const parsed of [parsedLlm, parsedEmbeddings])
        if ('problem' in parsed) problems.push(parsed.problem);
    const llm = 'provider' in parsedLlm ? parsedLlm.provider : undefined;
    const embeddings = 'provider' in parsedEmbeddings ? parsedEmbeddings.provider : undefined;

    const onFly = Boolean(environment.FLY_APP_NAME);
    let bedrockAuth: BedrockAuth = { kind: 'credential-chain' };
    try {
        bedrockAuth = getBedrockAuth(environment);
    } catch (error) {
        problems.push((error as Error).message);
    }

    let privacyGuardrailBypass = false;
    try {
        privacyGuardrailBypass = isPrivacyGuardrailBypassEnabled(environment);
    } catch (error) {
        problems.push((error as Error).message);
    }

    // Resolve the generations every embedding call will use, so the key and
    // Nova checks follow what actually runs rather than the provider label.
    let readGeneration: EmbeddingGeneration | undefined;
    let writes: EmbeddingGeneration[] = [];
    try {
        readGeneration = activeGeneration(environment);
    } catch {
        problems.push(
            `EMBEDDINGS_READ_GENERATION must be nova1024v1 or openai1536 (got "${environment.EMBEDDINGS_READ_GENERATION}")`
        );
    }
    try {
        writes = writeGenerations(environment);
    } catch {
        problems.push(
            `EMBEDDINGS_WRITE_GENERATION must be nova1024v1 or openai1536 (got "${environment.EMBEDDINGS_WRITE_GENERATION}")`
        );
    }
    const generationSource = (name: string, explicit: string | undefined) =>
        explicit?.trim()
            ? `${name}=${explicit.trim()}`
            : environment.EMBEDDINGS_PROVIDER?.trim()
              ? 'EMBEDDINGS_PROVIDER=openai'
              : 'LLM_PROVIDER=openai';

    const needsOpenAIKey = [
        llm === 'openai' && 'LLM_PROVIDER=openai',
        readGeneration === 'openai1536' &&
            generationSource('EMBEDDINGS_READ_GENERATION', environment.EMBEDDINGS_READ_GENERATION),
        writes.includes('openai1536') &&
            (environment.EMBEDDINGS_DUAL_WRITE === 'true'
                ? 'EMBEDDINGS_DUAL_WRITE=true'
                : generationSource(
                      'EMBEDDINGS_WRITE_GENERATION',
                      environment.EMBEDDINGS_WRITE_GENERATION
                  )),
    ].filter((reason): reason is string => Boolean(reason));
    if (needsOpenAIKey.length && !environment.OPENAI_API_KEY?.trim())
        problems.push(`OPENAI_API_KEY is required (${[...new Set(needsOpenAIKey)].join(', ')})`);

    const embeddingModel = environment.EMBEDDING_MODEL?.trim();
    if (
        embeddingModel &&
        !(APPROVED_OPENAI_EMBEDDING_MODELS as readonly string[]).includes(embeddingModel)
    )
        problems.push(
            `EMBEDDING_MODEL="${embeddingModel}" is not an approved embeddings model; unset it or use ${APPROVED_OPENAI_EMBEDDING_MODELS.join(', ')}`
        );

    const novaInUse = readGeneration === 'nova1024v1' || writes.includes('nova1024v1');
    const legacyWritesOff = writes.length > 0 && !writes.includes('openai1536');
    if (novaInUse) {
        // Retirement configuration (Nova-only writes, also the default):
        // openai1536 copies stop being current, so reads must be on Nova and
        // there is no OpenAI fallback.
        if (legacyWritesOff && readGeneration === 'openai1536')
            problems.push(
                'EMBEDDINGS_WRITE_GENERATION=nova1024v1 without dual writes retires the openai1536 copies; it needs EMBEDDINGS_READ_GENERATION=nova1024v1; there is no OpenAI read fallback once legacy writes stop'
            );
        if (!novaEmbeddingsEnabled(environment))
            problems.push(
                legacyWritesOff
                    ? 'EMBEDDINGS_WRITE_GENERATION=nova1024v1 without dual writes needs BEDROCK_EMBEDDINGS_ENABLED=true (or unset)'
                    : 'nova1024v1 embeddings need BEDROCK_EMBEDDINGS_ENABLED=true (or unset)'
            );
        if (llm === 'openai' && environment.AWS_REGION !== 'us-east-1')
            problems.push(
                `Nova embeddings need AWS_REGION=us-east-1 (got ${environment.AWS_REGION ? `"${environment.AWS_REGION}"` : 'nothing'}); use EMBEDDINGS_PROVIDER=openai with OPENAI_API_KEY to run without AWS`
            );
        if (
            llm === 'openai' &&
            !onFly &&
            bedrockAuth.kind === 'credential-chain' &&
            !hasAwsCredentialSource(environment, fileExists)
        )
            problems.push(
                `Nova embeddings found no Bedrock credentials. Set ${BEDROCK_API_KEY_ENV}, configure AWS credentials (AWS_PROFILE or ~/.aws), or use EMBEDDINGS_PROVIDER=openai with OPENAI_API_KEY`
            );
    }

    if (llm === 'openai' && onFly)
        problems.push(
            'LLM_PROVIDER=openai is for local development only; deployed Fly apps must use LLM_PROVIDER=bedrock'
        );

    if (llm === 'bedrock') {
        if (environment.AWS_REGION !== 'us-east-1')
            problems.push(
                `LLM_PROVIDER=bedrock needs AWS_REGION=us-east-1 (got ${environment.AWS_REGION ? `"${environment.AWS_REGION}"` : 'nothing'}); the generation endpoint and model profiles are only approved there`
            );
        try {
            getBedrockGenerationConfig(environment);
        } catch {
            problems.push(
                'BEDROCK_BASE_URL must be unset or https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1'
            );
        }
        if (
            !onFly &&
            bedrockAuth.kind === 'credential-chain' &&
            !hasAwsCredentialSource(environment, fileExists)
        )
            problems.push(
                `LLM_PROVIDER=bedrock found no Bedrock credentials. Set ${BEDROCK_API_KEY_ENV} to a Bedrock API key, configure AWS credentials (AWS_PROFILE or ~/.aws), or use LLM_PROVIDER=openai with OPENAI_API_KEY`
            );
    }

    // Both providers share the Responses request builder, which only accepts
    // the reviewed GPT-6 Luna and GPT-6.1 Sol aliases.
    for (const [name, model] of Object.entries(models)) {
        try {
            getBedrockGenerationModelForAudit(model);
        } catch {
            problems.push(
                `${name}="${model}" is not an approved generation model; use gpt-6-luna or gpt-6.1-sol, optionally with a reasoning suffix such as -none or -low`
            );
        }
    }

    if (problems.length) throw new AiProviderConfigError(problems);
    return {
        llm: llm!,
        embeddings: embeddings!,
        bedrockAuth,
        privacyGuardrailBypass,
    };
};

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Local-dev generation on OpenAI. Pinned like the embeddings client so an
// ambient OPENAI_BASE_URL cannot reroute prompts.
export const createOpenAIResponsesClient = (
    environment: NodeJS.ProcessEnv = process.env,
    fetch?: OpenAI['fetch']
): OpenAI =>
    new OpenAI({
        apiKey: environment.OPENAI_API_KEY,
        baseURL: OPENAI_BASE_URL,
        organization: null,
        project: null,
        maxRetries: 0,
        // SDK decode/debug logging can contain raw SSE payloads.
        logLevel: 'off',
        fetch: (input, init) => (fetch ?? globalThis.fetch)(input, { ...init, redirect: 'error' }),
    });

/** Where generation requests go and how they are labelled in audit and circuit state. */
export type LlmRoute = {
    provider: LlmProvider;
    clientFactory: () => OpenAI;
    /** Bedrock inference profile (us.openai.gpt-6-luna) to the wire model id. */
    requestModel: (profile: string) => string;
    /** Configured alias (gpt-6-luna-none) to the model id recorded in audit. */
    auditModel: (model: string) => string;
};

const toOpenAIModel = (profile: string) => profile.replace(/^us\.openai\./, '');

export const getLlmRoute = (environment: NodeJS.ProcessEnv = process.env): LlmRoute =>
    getLlmProvider(environment) === 'openai'
        ? {
              provider: 'openai',
              clientFactory: () => createOpenAIResponsesClient(environment),
              requestModel: toOpenAIModel,
              auditModel: model => toOpenAIModel(getBedrockGenerationModelForAudit(model)),
          }
        : {
              provider: 'bedrock',
              clientFactory: () => createBedrockResponsesClient(environment),
              requestModel: profile => profile,
              auditModel: getBedrockGenerationModelForAudit,
          };

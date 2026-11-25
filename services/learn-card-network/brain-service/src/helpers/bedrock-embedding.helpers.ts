import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import { NOVA2_MAX_TEXT_CHARS } from '../config/skillEmbedding';

/**
 * LC-2206 Bedrock adapter for Amazon Nova 2 Multimodal Embeddings.
 *
 * Style follows lca-api's Bedrock image adapter (LC-2205): one InvokeModel per request,
 * SigV4 with the execution role's rotating credentials (never a long-term
 * AWS_BEARER_TOKEN_BEDROCK key), no SDK retries, a hard timeout, and sanitised errors that
 * never carry provider bodies, input text, credentials or vectors.
 */

/** `index` embeds stored skills (GENERIC_INDEX); `query` embeds search text (TEXT_RETRIEVAL). */
export type EmbeddingPurpose = 'index' | 'query';

export type BedrockEmbeddingConfig = {
    modelId: string;
    region: string;
    dimension: number;
    timeoutMs: number;
};

export type SkillEmbeddingErrorCode =
    | 'disabled'
    | 'invalid_input'
    | 'throttled'
    | 'unavailable'
    | 'access_denied'
    | 'timeout'
    | 'invalid_response'
    | 'failed';

export class SkillEmbeddingError extends Error {
    readonly code: SkillEmbeddingErrorCode;

    readonly retryable: boolean;

    readonly httpStatus?: number;

    constructor(code: SkillEmbeddingErrorCode, httpStatus?: number) {
        super(`Skill embedding failed (${code})`);
        this.name = 'SkillEmbeddingError';
        this.code = code;
        this.retryable = code === 'throttled' || code === 'unavailable' || code === 'timeout';
        this.httpStatus = httpStatus;
    }
}

export const isSkillEmbeddingError = (error: unknown): error is SkillEmbeddingError =>
    error instanceof SkillEmbeddingError;

/** Raw InvokeModel transport; injectable so unit tests never reach AWS. */
export type BedrockInvoke = (
    request: { modelId: string; body: string },
    options: { abortSignal: AbortSignal }
) => Promise<Uint8Array>;

export const buildNovaEmbeddingRequest = (
    text: string,
    purpose: EmbeddingPurpose,
    dimension: number
) => ({
    schemaVersion: 'nova-multimodal-embed-v1',
    taskType: 'SINGLE_EMBEDDING',
    singleEmbeddingParams: {
        embeddingPurpose: purpose === 'index' ? 'GENERIC_INDEX' : 'TEXT_RETRIEVAL',
        embeddingDimension: dimension,
        // Fail instead of silently embedding a truncated text; callers bound input length.
        text: { truncationMode: 'NONE', value: text },
    },
});

/** L2-normalise so cosine and dot-product scores agree (AI Passport does the same). */
export const normalizeEmbedding = (vector: number[]): number[] => {
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (!Number.isFinite(norm) || norm === 0) throw new SkillEmbeddingError('invalid_response');
    return vector.map(value => value / norm);
};

/** Validate the documented Nova InvokeModel envelope: exactly one finite TEXT vector. */
export const parseNovaEmbeddingResponse = (body: Uint8Array, dimension: number): number[] => {
    let parsed: unknown;

    try {
        parsed = JSON.parse(new TextDecoder().decode(body));
    } catch {
        throw new SkillEmbeddingError('invalid_response');
    }

    const rows = (parsed as { embeddings?: unknown } | null)?.embeddings;
    if (!Array.isArray(rows) || rows.length !== 1)
        throw new SkillEmbeddingError('invalid_response');

    const row = rows[0] as {
        embeddingType?: unknown;
        embedding?: unknown;
        truncatedCharLength?: unknown;
    } | null;

    if (
        !row ||
        row.embeddingType !== 'TEXT' ||
        row.truncatedCharLength !== undefined ||
        !Array.isArray(row.embedding) ||
        row.embedding.length !== dimension ||
        !row.embedding.every(value => typeof value === 'number' && Number.isFinite(value))
    ) {
        throw new SkillEmbeddingError('invalid_response');
    }

    return normalizeEmbedding(row.embedding as number[]);
};

const providerStatus = (error: unknown): number | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const { $metadata: metadata } = error as { $metadata?: { httpStatusCode?: unknown } };
    return typeof metadata?.httpStatusCode === 'number' ? metadata.httpStatusCode : undefined;
};

const providerName = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const { name } = error as { name?: unknown };
    return typeof name === 'string' ? name : undefined;
};

/** Map an SDK failure to a code. The provider message and body are deliberately dropped. */
export const sanitizeBedrockError = (error: unknown): SkillEmbeddingError => {
    if (error instanceof SkillEmbeddingError) return error;

    const status = providerStatus(error);
    const name = providerName(error);

    if (name === 'AbortError' || name === 'TimeoutError') return new SkillEmbeddingError('timeout');
    if (
        status === 429 ||
        name === 'ThrottlingException' ||
        name === 'ServiceQuotaExceededException'
    ) {
        return new SkillEmbeddingError('throttled', 429);
    }
    if (status === 403 || name === 'AccessDeniedException') {
        return new SkillEmbeddingError('access_denied', 403);
    }
    if (
        status === 503 ||
        status === 504 ||
        name === 'ServiceUnavailableException' ||
        name === 'ModelNotReadyException' ||
        name === 'ModelTimeoutException'
    ) {
        return new SkillEmbeddingError('unavailable', status);
    }
    if (status === 400 || name === 'ValidationException') {
        return new SkillEmbeddingError('invalid_input', 400);
    }

    return new SkillEmbeddingError('failed', status);
};

const clients = new Map<string, BedrockRuntimeClient>();

const getClient = (config: BedrockEmbeddingConfig): BedrockRuntimeClient => {
    const key = `${config.region}:${config.timeoutMs}`;
    let client = clients.get(key);

    if (!client) {
        client = new BedrockRuntimeClient({
            region: config.region,
            // One paid attempt per call; the backfill decides whether to retry later.
            maxAttempts: 1,
            // Execution-role SigV4 only, matching lca-api's credential policy.
            authSchemePreference: ['sigv4'],
            requestHandler: { requestTimeout: config.timeoutMs, connectionTimeout: 3_000 },
        });
        clients.set(key, client);
    }

    return client;
};

/** Test hook: drop cached SDK clients. */
export const resetBedrockEmbeddingClients = (): void => {
    for (const client of clients.values()) client.destroy();
    clients.clear();
};

export const createDefaultBedrockInvoke =
    (config: BedrockEmbeddingConfig): BedrockInvoke =>
    async (request, options) => {
        const response = await getClient(config).send(
            new InvokeModelCommand({
                modelId: request.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: request.body,
            }),
            { abortSignal: options.abortSignal }
        );

        return response.body;
    };

/** Embed one text with Nova 2. Exactly one InvokeModel call; throws SkillEmbeddingError. */
export const embedTextWithBedrock = async (
    text: string,
    purpose: EmbeddingPurpose,
    config: BedrockEmbeddingConfig,
    invoke: BedrockInvoke = createDefaultBedrockInvoke(config)
): Promise<number[]> => {
    const value = text.trim();
    if (!value || value.length > NOVA2_MAX_TEXT_CHARS)
        throw new SkillEmbeddingError('invalid_input');

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
        const body = await Promise.race([
            invoke(
                {
                    modelId: config.modelId,
                    body: JSON.stringify(
                        buildNovaEmbeddingRequest(value, purpose, config.dimension)
                    ),
                },
                { abortSignal: controller.signal }
            ),
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                    controller.abort();
                    reject(new SkillEmbeddingError('timeout'));
                }, config.timeoutMs);
            }),
        ]);

        return parseNovaEmbeddingResponse(body, config.dimension);
    } catch (error) {
        throw sanitizeBedrockError(error);
    } finally {
        clearTimeout(timer);
    }
};

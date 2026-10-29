import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { TRPCError } from '@trpc/server';
import type OpenAI from 'openai';
import { PNG } from 'pngjs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

export interface ImageGenerationConfig {
    IMAGE_PROVIDER: 'openai' | 'bedrock';
    BEDROCK_IMAGE_REGION: string;
    BEDROCK_IMAGE_MODEL_ID: string;
    IMAGE_TIMEOUT_MS: number;
}

interface ImageStorage {
    storeURL: (url: string) => Promise<{ url?: string }>;
    upload: (
        bytes: Buffer,
        options: { timeout: number },
        storeOptions: { filename: string }
    ) => Promise<{ url?: string }>;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 14 * 1024 * 1024;
/** At most two quick retries, and only for rejections Bedrock does not bill (throttling/unavailable). */
const MAX_BEDROCK_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;
const RETRY_MAX_DELAY_MS = 2_000;
/** Do not start another attempt unless a full generation (~6 s) plus upload still fits the deadline. */
const MIN_ATTEMPT_BUDGET_MS = 12_000;

const failure = (): TRPCError =>
    new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Image generation failed. Please try again later.',
    });
const rateLimited = (): TRPCError =>
    new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'AI generation rate limited' });
const unavailable = (): TRPCError =>
    new TRPCError({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Image generation unavailable. Please try again later.',
    });
const filtered = (): TRPCError =>
    new TRPCError({ code: 'BAD_REQUEST', message: 'The image request was filtered.' });

/** Sanitized, allowlisted diagnostics for one request. Never holds prompts, bodies or headers. */
export interface ImageDiagnostics {
    stage?: 'invoke' | 'decode' | 'storage' | 'timeout' | 'config';
    category?: ProviderErrorCategory;
    decodeReason?: string;
    finishReason?: string | null;
    errorName?: string;
    errorCode?: string;
    httpStatus?: number;
    awsRequestId?: string;
    sdkRetryable?: boolean;
    attempts?: number;
}

type ProviderErrorCategory = 'throttled' | 'unavailable' | 'timeout' | 'filtered' | 'rejected';

const SAFE_IDENTIFIER = /^[A-Za-z][\w.]{0,63}$/;
const SAFE_REQUEST_ID = /^[\w-]{1,128}$/;
const SAFE_FINISH_REASON = /^Filter reason: [a-z ]{1,32}$/;

/** HTTP status from an OpenAI SDK APIError or an AWS SDK service exception, if any. */
const providerStatus = (error: unknown): number | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const { status, $metadata: metadata } = error as {
        status?: unknown;
        $metadata?: { httpStatusCode?: unknown };
    };
    if (typeof status === 'number') return status;
    return typeof metadata?.httpStatusCode === 'number' ? metadata.httpStatusCode : undefined;
};

/** Allowlisted metadata from an AWS SDK / OpenAI SDK / Node network error. Messages are never read. */
export const providerErrorInfo = (error: unknown): Partial<ImageDiagnostics> => {
    if (!error || typeof error !== 'object') return {};
    const {
        name,
        code,
        $metadata: metadata,
        $retryable: retryable,
    } = error as {
        name?: unknown;
        code?: unknown;
        $metadata?: { requestId?: unknown };
        $retryable?: unknown;
    };
    const requestId = metadata?.requestId;
    return {
        errorName: typeof name === 'string' && SAFE_IDENTIFIER.test(name) ? name : undefined,
        errorCode: typeof code === 'string' && SAFE_IDENTIFIER.test(code) ? code : undefined,
        httpStatus: providerStatus(error),
        awsRequestId:
            typeof requestId === 'string' && SAFE_REQUEST_ID.test(requestId)
                ? requestId
                : undefined,
        sdkRetryable: retryable ? true : undefined,
    };
};

const THROTTLED_NAMES = new Set([
    'ThrottlingException',
    // Bedrock reports some account quotas (e.g. requests/tokens per day or minute for a newly
    // enabled model) as HTTP 400 ServiceQuotaExceededException rather than 429.
    'ServiceQuotaExceededException',
    'ModelNotReadyException',
    'TooManyRequestsException',
]);
const UNAVAILABLE_NAMES = new Set(['ServiceUnavailableException', 'InternalServerException']);
const TIMEOUT_NAMES = new Set(['ModelTimeoutException', 'TimeoutError', 'RequestTimeout']);
/** Matched only to classify; the provider message is never logged or returned. */
const CONTENT_FILTER_MESSAGE = /content filter|blocked by our|moderation|flagged/i;

/** Classify a provider failure. Only throttling/unavailable rejections are retried. */
export const classifyProviderError = (
    error: unknown
): { category: ProviderErrorCategory; retryable: boolean } => {
    const { errorName, httpStatus } = providerErrorInfo(error);
    const name = errorName ?? '';
    if (THROTTLED_NAMES.has(name) || httpStatus === 429) {
        return { category: 'throttled', retryable: true };
    }
    if (UNAVAILABLE_NAMES.has(name) || httpStatus === 503 || httpStatus === 500) {
        return { category: 'unavailable', retryable: true };
    }
    if (TIMEOUT_NAMES.has(name) || httpStatus === 504 || httpStatus === 408) {
        // The model may have run (and billed); never retry inside the same request.
        return { category: 'timeout', retryable: false };
    }
    const message = (error as { message?: unknown } | null)?.message;
    if (
        name === 'ValidationException' &&
        typeof message === 'string' &&
        CONTENT_FILTER_MESSAGE.test(message)
    ) {
        return { category: 'filtered', retryable: false };
    }
    return { category: 'rejected', retryable: false };
};

const clientError = (category: ProviderErrorCategory): TRPCError => {
    if (category === 'throttled') return rateLimited();
    if (category === 'unavailable' || category === 'timeout') return unavailable();
    if (category === 'filtered') return filtered();
    return failure();
};

const PASSTHROUGH_CODES = new Set(['BAD_REQUEST', 'TOO_MANY_REQUESTS', 'SERVICE_UNAVAILABLE']);

const promptHash = (prompt: string): string =>
    createHash('sha256').update(prompt).digest('hex').slice(0, 12);

const abortableDelay = (ms: number, signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
        if (signal.aborted) reject(unavailable());
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        const onAbort = () => {
            clearTimeout(timer);
            reject(unavailable());
        };
        signal.addEventListener('abort', onAbort, { once: true });
    });

/** Full jitter: uniform in [0, min(cap, base * 2^(attempt-1))]. */
const retryDelay = (attempt: number): number =>
    Math.floor(Math.random() * Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** attempt));

/** Validate a single unfiltered, bounded square PNG before handing bytes to storage. */
export const decodeBedrockImage = (
    body: Uint8Array,
    diagnostics: ImageDiagnostics = {}
): Buffer => {
    function reject(reason: string): never {
        diagnostics.decodeReason = reason;
        throw failure();
    }
    if (body.byteLength > MAX_RESPONSE_BYTES) reject('response_too_large');
    let result: unknown;
    try {
        result = JSON.parse(Buffer.from(body).toString('utf8'));
    } catch {
        reject('json_invalid');
    }
    if (!result || typeof result !== 'object') reject('json_invalid');
    const { images, finish_reasons: reasons } = result as Record<string, unknown>;
    if (!Array.isArray(reasons) || reasons.length !== 1) reject('finish_reasons_invalid');
    const reason: unknown = reasons[0];
    diagnostics.finishReason =
        reason === null
            ? null
            : typeof reason === 'string' && SAFE_FINISH_REASON.test(reason)
              ? reason
              : 'other';
    if (typeof reason === 'string' && reason.startsWith('Filter reason:')) {
        diagnostics.decodeReason = 'filtered';
        throw filtered();
    }
    if (reason !== null) reject('not_success');
    if (!Array.isArray(images) || images.length !== 1) reject('image_count_invalid');
    const encoded: unknown = images[0];
    if (
        typeof encoded !== 'string' ||
        !encoded.length ||
        encoded.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)
    )
        reject('base64_invalid');
    const bytes = Buffer.from(encoded, 'base64');
    if (
        bytes.length < 33 ||
        bytes.length > MAX_IMAGE_BYTES ||
        bytes.toString('base64') !== encoded ||
        !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
        bytes.readUInt32BE(8) !== 13 ||
        bytes.toString('ascii', 12, 16) !== 'IHDR'
    )
        reject('png_header_invalid');
    const width = bytes.readUInt32BE(16);
    if (width !== bytes.readUInt32BE(20) || width < 640 || width > 1536) {
        reject('png_dimensions_invalid');
    }
    // Reject duplicate headers and bound decompression, including interlaced PNGs.
    const compressed: Buffer[] = [];
    let ended = false;
    for (let offset = 8; offset < bytes.length;) {
        if (offset + 12 > bytes.length || ended) reject('png_structure_invalid');
        const length = bytes.readUInt32BE(offset);
        const end = offset + 12 + length;
        if (end > bytes.length) reject('png_structure_invalid');
        const type = bytes.toString('ascii', offset + 4, offset + 8);
        if (type === 'IHDR' && offset !== 8) reject('png_structure_invalid');
        if (type === 'IDAT') compressed.push(bytes.subarray(offset + 8, end - 4));
        if (type === 'IEND') {
            if (length !== 0) reject('png_structure_invalid');
            ended = true;
        }
        offset = end;
    }
    if (!ended || !compressed.length) reject('png_structure_invalid');
    try {
        inflateSync(Buffer.concat(compressed), { maxOutputLength: 20 * 1024 * 1024 });
        // Dimensions are bounded before decode, preventing oversized pixel allocations.
        const image = PNG.sync.read(bytes, { checkCRC: true });
        if (image.width !== width || image.height !== width) reject('png_dimensions_invalid');
    } catch (error) {
        if (error instanceof TRPCError) throw error;
        reject('png_decode_failed');
    }
    return bytes;
};

/**
 * One successful paid invocation per request, no provider fallback. Bedrock throttling/unavailable
 * rejections (not billed) get at most two jittered retries, only while a full attempt still fits
 * inside IMAGE_TIMEOUT_MS. Every failure logs one sanitized `image_generation_failure` record.
 */
export const generateStoredImage = async (
    prompt: string,
    did: string,
    config: ImageGenerationConfig,
    openai: OpenAI | undefined,
    storage: ImageStorage
): Promise<{ url: string }> => {
    if (config.IMAGE_PROVIDER === 'bedrock' && prompt.length > 10_000) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Image prompt exceeds 10000 characters.',
        });
    }
    const startedAt = Date.now();
    const deadline = startedAt + config.IMAGE_TIMEOUT_MS;
    const bedrock = config.IMAGE_PROVIDER === 'bedrock';
    const logBase = () => ({
        provider: config.IMAGE_PROVIDER,
        modelId: bedrock ? config.BEDROCK_IMAGE_MODEL_ID : 'dall-e-3',
        region: bedrock ? config.BEDROCK_IMAGE_REGION : undefined,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        promptHash: promptHash(prompt),
    });
    const diagnostics: ImageDiagnostics = { attempts: 0 };
    const providerError = (error: unknown): TRPCError => {
        if (error instanceof TRPCError) return error;
        const { category } = classifyProviderError(error);
        Object.assign(diagnostics, providerErrorInfo(error), { stage: 'invoke', category });
        return clientError(category);
    };
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const work = async (): Promise<{ url: string }> => {
        let stored: { url?: string };
        if (bedrock) {
            // SigV4 with the execution role's rotating credentials only: never a long-term
            // AWS_BEARER_TOKEN_BEDROCK API key, matching the text adapter's credential policy.
            const client = new BedrockRuntimeClient({
                region: config.BEDROCK_IMAGE_REGION,
                maxAttempts: 1,
                authSchemePreference: ['sigv4'],
            });
            try {
                let response: { body: Uint8Array } | undefined;
                for (let attempt = 1; !response; attempt += 1) {
                    diagnostics.attempts = attempt;
                    try {
                        response = await client.send(
                            new InvokeModelCommand({
                                modelId: config.BEDROCK_IMAGE_MODEL_ID,
                                contentType: 'application/json',
                                accept: 'application/json',
                                body: JSON.stringify({
                                    prompt,
                                    aspect_ratio: '1:1',
                                    output_format: 'png',
                                }),
                            }),
                            { abortSignal: controller.signal }
                        );
                    } catch (error) {
                        // Our own deadline aborted the call: the timeout path owns the outcome/log.
                        if (controller.signal.aborted) throw unavailable();
                        const mapped = providerError(error);
                        const delay = retryDelay(attempt);
                        if (
                            !classifyProviderError(error).retryable ||
                            attempt >= MAX_BEDROCK_ATTEMPTS ||
                            controller.signal.aborted ||
                            deadline - Date.now() - delay < MIN_ATTEMPT_BUDGET_MS
                        ) {
                            throw mapped;
                        }
                        console.warn({
                            event: 'image_generation_retry',
                            ...logBase(),
                            ...providerErrorInfo(error),
                            category: diagnostics.category,
                            attempt,
                            delayMs: delay,
                        });
                        await abortableDelay(delay, controller.signal);
                    }
                }
                diagnostics.stage = 'decode';
                const bytes = decodeBedrockImage(response.body, diagnostics);
                if (controller.signal.aborted) throw failure();
                diagnostics.stage = 'storage';
                // The upload isn't tied to the abort signal, so cap it at the remaining budget
                // rather than a fresh IMAGE_TIMEOUT_MS that would outlive the request.
                const uploadTimeoutMs = Math.max(1000, deadline - Date.now());
                stored = await storage.upload(
                    bytes,
                    { timeout: uploadTimeoutMs },
                    { filename: 'generated-image.png' }
                );
            } finally {
                client.destroy();
            }
        } else {
            if (!openai) {
                diagnostics.stage = 'config';
                throw failure();
            }
            diagnostics.attempts = 1;
            diagnostics.stage = 'invoke';
            const response = await openai.images
                .generate(
                    { prompt, model: 'dall-e-3', size: '1024x1024', n: 1, user: did },
                    { signal: controller.signal, timeout: config.IMAGE_TIMEOUT_MS, maxRetries: 0 }
                )
                .catch((error: unknown) => {
                    throw providerError(error);
                });
            if (!response.data?.[0]?.url || controller.signal.aborted) throw failure();
            diagnostics.stage = 'storage';
            stored = await storage.storeURL(response.data[0].url);
        }
        if (!stored?.url) throw failure();
        return { url: stored.url };
    };
    try {
        const result = await Promise.race([
            work(),
            new Promise<never>((_, reject) => {
                timeout = setTimeout(() => {
                    diagnostics.stage = 'timeout';
                    controller.abort();
                    reject(unavailable());
                }, config.IMAGE_TIMEOUT_MS);
            }),
        ]);
        console.info({
            event: 'image_generation_success',
            ...logBase(),
            attempts: diagnostics.attempts,
        });
        return result;
    } catch (error) {
        // Storage/config/decode failures are not provider statuses: keep them generic.
        const clientFacing =
            error instanceof TRPCError && PASSTHROUGH_CODES.has(error.code) ? error : failure();
        // Allowlisted fields only: no prompt text, provider messages, headers, URLs or bytes.
        console.error({
            event: 'image_generation_failure',
            ...logBase(),
            stage: diagnostics.stage,
            attempts: diagnostics.attempts,
            category: diagnostics.category,
            errorName: diagnostics.errorName,
            errorCode: diagnostics.errorCode,
            httpStatus: diagnostics.httpStatus,
            awsRequestId: diagnostics.awsRequestId,
            sdkRetryable: diagnostics.sdkRetryable,
            retryable: diagnostics.category
                ? diagnostics.category === 'throttled' || diagnostics.category === 'unavailable'
                : undefined,
            finishReason: diagnostics.finishReason,
            decodeReason: diagnostics.decodeReason,
            ...(diagnostics.stage === 'storage' ? { storage: providerErrorInfo(error) } : {}),
            clientCode: clientFacing.code,
        });
        throw clientFacing;
    } finally {
        clearTimeout(timeout);
    }
};

import { copyEmbeddingStop } from './embedding-recovery';
import { copyGenerationFailure } from './generation-failure';
import { copyEmbeddingFailureDetails } from './embedding-diagnostics';
import { copyProviderFailureDetails } from './provider-diagnostics';
export const AI_ERROR_CODES = [
    'ai_provider_quota_exhausted',
    'ai_provider_rate_limited',
    'ai_provider_unavailable',
    'ai_request_timeout',
    'ai_unknown_error',
] as const;

export type AiErrorCode = (typeof AI_ERROR_CODES)[number];

export type AiProviderErrorPayload = {
    event: 'ai_error';
    code: AiErrorCode;
    message: string;
    retryable: boolean;
    operation?: string;
    requestId?: string;
    threadId?: string;
    retryAfterSeconds?: number;
};

const ERROR_MESSAGES: Record<AiErrorCode, string> = {
    ai_provider_quota_exhausted: 'LearnCard AI is temporarily unavailable. Please try again later.',
    ai_provider_rate_limited:
        'LearnCard AI is receiving too many requests. Please try again shortly.',
    ai_provider_unavailable: 'LearnCard AI is temporarily unavailable. Please try again later.',
    ai_request_timeout: 'LearnCard AI took too long to respond. Please try again.',
    ai_unknown_error: 'LearnCard AI could not complete this request. Please try again later.',
};

export class AiProviderError extends Error {
    readonly code: AiErrorCode;
    readonly provider: string;
    readonly retryable: boolean;
    readonly httpStatus: number;
    readonly retryAfterSeconds?: number;

    constructor({
        code,
        provider,
        retryable,
        httpStatus,
        retryAfterSeconds,
        cause,
    }: {
        code: AiErrorCode;
        provider: string;
        retryable: boolean;
        httpStatus: number;
        retryAfterSeconds?: number;
        cause?: unknown;
    }) {
        super(ERROR_MESSAGES[code], { cause });
        this.name = 'AiProviderError';
        this.code = code;
        this.provider = provider;
        this.retryable = retryable;
        this.httpStatus = httpStatus;
        this.retryAfterSeconds = retryAfterSeconds;
        copyProviderFailureDetails(cause, this);
        copyEmbeddingFailureDetails(cause, this);
        copyGenerationFailure(cause, this);
        copyEmbeddingStop(cause, this);
    }
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;

const asString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const getErrorDetails = (error: unknown) => {
    const record = asRecord(error);
    const body = asRecord(record?.body);
    const nested = asRecord(record?.error) ?? asRecord(body?.error) ?? asRecord(record?.cause);
    const metadata = asRecord(record?.$metadata) ?? asRecord(nested?.$metadata);
    const status =
        asNumber(record?.status) ??
        asNumber(record?.statusCode) ??
        asNumber(metadata?.httpStatusCode);
    const code = asString(record?.code) ?? asString(nested?.code);
    const type = asString(record?.type) ?? asString(nested?.type);
    const name = asString(record?.name);
    const message = asString(record?.message);
    const retryAfter = asNumber(record?.retryAfterSeconds) ?? asNumber(nested?.retryAfterSeconds);

    return {
        status,
        retryAfter,
        text: [code, type, name, message].filter(Boolean).join(' ').toLowerCase(),
    };
};

export const isAiProviderError = (error: unknown): error is AiProviderError =>
    error instanceof AiProviderError;

export const normalizeAiProviderError = (error: unknown, provider: string): AiProviderError => {
    if (isAiProviderError(error)) return error;

    const { status, retryAfter, text } = getErrorDetails(error);

    if (
        /insufficient[_ -]?quota|billing[_ -]?(hard[_ -]?limit|not[_ -]?active)|quota[_ -]?exhausted|exceeded.*quota|credit balance|servicequotaexceededexception/.test(
            text
        )
    ) {
        return new AiProviderError({
            code: 'ai_provider_quota_exhausted',
            provider,
            retryable: false,
            httpStatus: 503,
            cause: error,
        });
    }

    if (status === 429 || /rate[_ -]?limit|too many requests|throttlingexception/.test(text)) {
        return new AiProviderError({
            code: 'ai_provider_rate_limited',
            provider,
            retryable: true,
            httpStatus: 429,
            retryAfterSeconds: retryAfter,
            cause: error,
        });
    }

    if (/timeout|timed out|etimedout|apiconnectiontimeouterror/.test(text)) {
        return new AiProviderError({
            code: 'ai_request_timeout',
            provider,
            retryable: true,
            httpStatus: 504,
            cause: error,
        });
    }

    if (
        (status !== undefined && status >= 500) ||
        /apiconnectionerror|connection (error|refused|reset)|econn(refused|reset)|service unavailable|serviceunavailableexception|internalserverexception|modelstreamerrorexception/.test(
            text
        )
    ) {
        return new AiProviderError({
            code: 'ai_provider_unavailable',
            provider,
            retryable: true,
            httpStatus: 503,
            cause: error,
        });
    }

    return new AiProviderError({
        code: 'ai_unknown_error',
        provider,
        retryable: false,
        httpStatus: 500,
        cause: error,
    });
};

export const toAiErrorPayload = (
    error: AiProviderError,
    context: {
        operation?: string;
        requestId?: string;
        threadId?: string;
    } = {}
): AiProviderErrorPayload => ({
    event: 'ai_error',
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    ...context,
    ...(error.retryAfterSeconds !== undefined
        ? { retryAfterSeconds: error.retryAfterSeconds }
        : {}),
});

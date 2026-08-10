export const AI_ERROR_CODES = {
    ai_provider_quota_exhausted: true,
    ai_provider_rate_limited: true,
    ai_provider_unavailable: true,
    ai_request_timeout: true,
    ai_unknown_error: true,
} as const;

export type AiErrorCode = keyof typeof AI_ERROR_CODES;

export type AiErrorPayload = {
    event: 'ai_error';
    code: AiErrorCode;
    message: string;
    retryable: boolean;
    operation?: string;
    requestId?: string;
    threadId?: string;
    retryAfterSeconds?: number;
};

export type AiClientError = AiErrorPayload & { at: number };

export class AiServiceError extends Error {
    readonly payload: AiErrorPayload;

    constructor(payload: AiErrorPayload) {
        super(payload.message);
        this.name = 'AiServiceError';
        this.payload = payload;
    }
}

export const parseAiErrorPayload = (value: unknown): AiErrorPayload | undefined => {
    if (typeof value !== 'object' || value === null) return;

    const data = value as Record<string, unknown>;

    if (
        data.event !== 'ai_error' ||
        typeof data.code !== 'string' ||
        !Object.hasOwn(AI_ERROR_CODES, data.code) ||
        typeof data.message !== 'string' ||
        typeof data.retryable !== 'boolean'
    )
        return;

    return {
        event: 'ai_error',
        code: data.code as AiErrorCode,
        message: data.message,
        retryable: data.retryable,
        ...(typeof data.operation === 'string' ? { operation: data.operation } : {}),
        ...(typeof data.requestId === 'string' ? { requestId: data.requestId } : {}),
        ...(typeof data.threadId === 'string' ? { threadId: data.threadId } : {}),
        ...(typeof data.retryAfterSeconds === 'number'
            ? { retryAfterSeconds: data.retryAfterSeconds }
            : {}),
    };
};

export const getAiServiceError = async (
    response: Response
): Promise<AiServiceError | undefined> => {
    try {
        const payload = parseAiErrorPayload(await response.clone().json());

        return payload ? new AiServiceError(payload) : undefined;
    } catch {
        return;
    }
};

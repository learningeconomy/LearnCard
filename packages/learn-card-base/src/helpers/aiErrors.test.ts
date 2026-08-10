import { describe, expect, it } from 'vitest';
import { AiServiceError, getAiServiceError, parseAiErrorPayload } from './aiErrors';

describe('AI service errors', () => {
    it('parses the additive backend error contract', () => {
        expect(
            parseAiErrorPayload({
                event: 'ai_error',
                code: 'ai_provider_quota_exhausted',
                message: 'Safe message',
                retryable: false,
                operation: 'session_start',
                requestId: 'request-1',
            })
        ).toEqual({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe message',
            retryable: false,
            operation: 'session_start',
            requestId: 'request-1',
        });
    });

    it.each([
        null,
        { event: 'error', code: 'ai_provider_quota_exhausted', message: 'x', retryable: false },
        { event: 'ai_error', code: 'provider-secret', message: 'x', retryable: false },
        { event: 'ai_error', code: 'ai_unknown_error', message: 'x', retryable: 'no' },
    ])('rejects malformed or unknown payloads', value => {
        expect(parseAiErrorPayload(value)).toBeUndefined();
    });

    it('creates a typed error from a failed HTTP response', async () => {
        const response = new Response(
            JSON.stringify({
                event: 'ai_error',
                code: 'ai_provider_quota_exhausted',
                message: 'Safe message',
                retryable: false,
            }),
            { status: 503 }
        );

        const error = await getAiServiceError(response);

        expect(error).toBeInstanceOf(AiServiceError);
        expect(error?.payload).toMatchObject({
            code: 'ai_provider_quota_exhausted',
            retryable: false,
        });
        await expect(response.json()).resolves.toMatchObject({
            code: 'ai_provider_quota_exhausted',
        });
    });
});

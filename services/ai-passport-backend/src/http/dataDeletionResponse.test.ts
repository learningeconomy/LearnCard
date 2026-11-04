import { describe, expect, test } from 'bun:test';

import { createDataDeletionResponse } from './dataDeletionResponse';

const jsonResponse = <T>(data: T, status: number) => Response.json(data, { status });

describe('data deletion HTTP response', () => {
    test('keeps authentication available for an incomplete retry', async () => {
        const response = createDataDeletionResponse(
            { status: 'incomplete' as const, retryable: true },
            jsonResponse,
            'auth'
        );

        expect(response.status).toBe(202);
        expect(response.headers.get('Set-Cookie')).toBeNull();
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(await response.json()).toEqual({
            status: 'incomplete',
            retryable: true,
        });
    });

    test('keeps authentication and disables caching when deletion infrastructure fails', async () => {
        const response = createDataDeletionResponse(
            { status: 'error' as const, retryable: true },
            jsonResponse,
            'auth'
        );
        expect(response.status).toBe(503);
        expect(response.headers.get('Set-Cookie')).toBeNull();
        expect(response.headers.get('Cache-Control')).toBe('no-store');
        expect(await response.json()).toEqual({ status: 'error', retryable: true });
    });

    test('clears authentication only after deletion completes', () => {
        const response = createDataDeletionResponse(
            { status: 'complete' as const },
            jsonResponse,
            'auth'
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('Set-Cookie')).toBe(
            'auth=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0'
        );
    });
});

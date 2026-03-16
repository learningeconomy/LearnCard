/**
 * Tests for QR Login Push Notification helper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { notifyDevicesForQrSession } from './qr-login';

const SERVER_URL = 'https://api.example.com';

let mockFetch: ReturnType<typeof vi.fn>;

describe('notifyDevicesForQrSession', () => {
    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends a POST to /qr-login/notify with correct body', async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ sent: true, deviceCount: 2 }), { status: 200 })
        );

        const result = await notifyDevicesForQrSession(
            { serverUrl: SERVER_URL },
            'session-123',
            '12345678',
            'firebase-token-abc',
            'firebase'
        );

        expect(result).toEqual({ sent: true, deviceCount: 2 });

        expect(mockFetch).toHaveBeenCalledOnce();

        const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

        expect(url).toBe(`${SERVER_URL}/qr-login/notify`);
        expect(init.method).toBe('POST');

        const body = JSON.parse(init.body as string);

        expect(body.authToken).toBe('firebase-token-abc');
        expect(body.providerType).toBe('firebase');
        expect(body.sessionId).toBe('session-123');
        expect(body.shortCode).toBe('12345678');
    });

    it('defaults providerType to firebase', async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ sent: true, deviceCount: 1 }), { status: 200 })
        );

        await notifyDevicesForQrSession(
            { serverUrl: SERVER_URL },
            'session-456',
            '87654321',
            'token-xyz'
        );

        const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);

        expect(body.providerType).toBe('firebase');
    });

    it('returns { sent: false, deviceCount: 0 } on HTTP error', async () => {
        mockFetch.mockResolvedValueOnce(new Response('Server Error', { status: 500 }));

        const result = await notifyDevicesForQrSession(
            { serverUrl: SERVER_URL },
            'session-err',
            '00000000',
            'token'
        );

        expect(result).toEqual({ sent: false, deviceCount: 0 });
    });

    it('returns { sent: false, deviceCount: 0 } on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

        const result = await notifyDevicesForQrSession(
            { serverUrl: SERVER_URL },
            'session-net',
            '11111111',
            'token'
        );

        expect(result).toEqual({ sent: false, deviceCount: 0 });
    });
});

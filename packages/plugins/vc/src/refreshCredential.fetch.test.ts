import { EventEmitter } from 'node:events';

import { vi } from 'vitest';

import { fetchWithPinnedAddress } from './refreshCredential.fetch';

const requestMock = vi.hoisted(() => vi.fn());

vi.mock('node:https', () => ({ request: requestMock }));

describe('fetchWithPinnedAddress', () => {
    afterEach(() => {
        requestMock.mockReset();
        vi.restoreAllMocks();
    });

    it('connects to the validated address while retaining the URL hostname for TLS', async () => {
        let capturedOptions: Record<string, unknown> | undefined;

        requestMock.mockImplementation(
            (
                _url: URL,
                options: Record<string, unknown>,
                onResponse: (response: EventEmitter & Record<string, unknown>) => void
            ) => {
                capturedOptions = options;

                const request = new EventEmitter() as EventEmitter & { end: () => void };

                request.end = () => {
                    const response = new EventEmitter() as EventEmitter & Record<string, unknown>;

                    response.statusCode = 200;
                    response.statusMessage = 'OK';
                    response.headers = { 'content-type': 'application/json' };
                    response.destroy = vi.fn();
                    onResponse(response);
                    queueMicrotask(() => {
                        response.emit('data', Buffer.from('{"ok":true}'));
                        response.emit('end');
                    });
                };

                return request;
            }
        );

        const response = await fetchWithPinnedAddress(
            new URL('https://refresh.example.com/refresh/1'),
            { method: 'GET', headers: { accept: 'application/json' } },
            { address: '93.184.216.34', family: 4 }
        );

        expect(await response.text()).toBe('{"ok":true}');
        expect(capturedOptions?.servername).toBe('refresh.example.com');
        expect(capturedOptions?.agent).toBe(false);

        const lookup = capturedOptions?.lookup as (
            hostname: string,
            options: { all?: boolean },
            callback: (
                error: Error | null,
                address: string | Array<{ address: string; family: number }>,
                family?: number
            ) => void
        ) => void;

        const lookupResult = await new Promise<{
            address: string | Array<{ address: string; family: number }>;
            family?: number;
        }>((resolve, reject) => {
            lookup('refresh.example.com', {}, (error, address, family) => {
                if (error) reject(error);
                else resolve({ address, family });
            });
        });

        expect(lookupResult).toEqual({ address: '93.184.216.34', family: 4 });
    });
});

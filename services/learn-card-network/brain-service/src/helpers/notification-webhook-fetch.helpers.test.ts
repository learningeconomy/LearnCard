import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LookupAddress } from 'node:dns';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import type { RequestOptions } from 'node:https';

const mocks = vi.hoisted(() => ({ lookup: vi.fn(), request: vi.fn() }));
vi.mock('node:dns', () => ({ lookup: mocks.lookup }));
vi.mock('node:http', () => ({ request: mocks.request }));
vi.mock('node:https', () => ({ request: mocks.request }));

import {
    fetchNotificationWebhook,
    isPublicNotificationAddress,
} from './notification-webhook-fetch.helpers';

const request = (): Parameters<typeof fetchNotificationWebhook>[1] => ({
    method: 'POST',
    headers: { Authorization: 'Bearer synthetic', 'Content-Type': 'application/json' },
    body: '{"type":"ANNOUNCEMENT"}',
    signal: AbortSignal.timeout(1000),
});
const resolve = (addresses: LookupAddress[]): void => {
    mocks.lookup.mockImplementation((_host, _options, callback) => callback(null, addresses));
};
const respond = (status = 200, body = '{"sent":true}'): void => {
    mocks.request.mockImplementation((_options, callback) => {
        const outgoing = new EventEmitter() as EventEmitter & { end: (body: string) => void };
        outgoing.end = () => {
            const response = Object.assign(new PassThrough(), {
                statusCode: status,
                headers: { location: 'http://127.0.0.1/private' },
            });
            callback(response);
            response.end(body);
        };
        return outgoing;
    });
};
beforeEach(() => {
    vi.resetAllMocks();
    respond();
});
afterEach(() => vi.unstubAllGlobals());

describe('notification destination boundary', () => {
    it.each([
        '0.0.0.0',
        '10.0.0.1',
        '100.64.0.1',
        '127.0.0.1',
        '169.254.169.254',
        '172.16.0.1',
        '192.0.0.1',
        '192.0.2.1',
        '192.88.99.1',
        '192.168.1.1',
        '198.18.0.1',
        '198.51.100.1',
        '203.0.113.1',
        '224.0.0.1',
        '255.255.255.255',
        '::',
        '::1',
        'fc00::1',
        'fe80::1',
        'ff02::1',
        '::ffff:127.0.0.1',
        '::ffff:8.8.8.8',
        '64:ff9b::a00:1',
        '2001::1',
        '2001:db8::1',
        '2002:0a00:0001::1',
        '3fff::1',
        '4000::1',
        'not-an-ip',
    ])('rejects nonpublic or transition address %s', address => {
        expect(isPublicNotificationAddress(address)).toBe(false);
    });

    it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700:4700::1111'])(
        'accepts public address %s',
        address => {
            expect(isPublicNotificationAddress(address)).toBe(true);
        }
    );

    it.each([
        'http://127.0.0.1/',
        'http://2130706433/',
        'http://0x7f000001/',
        'http://127.1/',
        'http://0177.0.0.1/',
        'http://10.0.1.10/',
        'http://169.254.169.254/latest/meta-data/',
        'https://[::1]/',
        'http://[::ffff:127.0.0.1]/',
        'ftp://public.example/',
        'https://user:password@public.example/',
        'not a URL',
    ])('blocks %s before sending the token or body', async destination => {
        await expect(fetchNotificationWebhook(destination, request(), false)).rejects.toThrow();
        expect(mocks.request).not.toHaveBeenCalled();
    });

    it.each([
        [],
        [{ address: '10.0.1.10', family: 4 }],
        [
            { address: '8.8.8.8', family: 4 },
            { address: '127.0.0.1', family: 4 },
        ],
        [
            { address: '8.8.8.8', family: 4 },
            { address: 'fd00::1', family: 6 },
        ],
    ])('rejects unsafe DNS answers before opening a connection', async (...addresses) => {
        resolve(addresses as LookupAddress[]);
        await expect(
            fetchNotificationWebhook('http://receiver.example/events', request(), false)
        ).rejects.toThrow();
        expect(mocks.lookup).toHaveBeenCalled();
        expect(mocks.request).not.toHaveBeenCalled();
    });

    it('pins the validated IP, preserves Host/TLS identity, and checks again on retry', async () => {
        resolve([{ address: '8.8.8.8', family: 4 }]);
        const response = await fetchNotificationWebhook(
            'https://receiver.example:8443/events?q=1',
            request(),
            false
        );
        expect(await response.text()).toBe('{"sent":true}');
        expect(mocks.request).toHaveBeenCalledWith(
            expect.objectContaining({
                hostname: '8.8.8.8',
                servername: 'receiver.example',
                port: '8443',
                path: '/events?q=1',
                agent: false,
                headers: expect.objectContaining({
                    Host: 'receiver.example:8443',
                    Authorization: 'Bearer synthetic',
                }),
            }),
            expect.any(Function)
        );
        const options = mocks.request.mock.calls[0]![0] as RequestOptions;
        expect(
            options.checkServerIdentity!('8.8.8.8', {
                subjectaltname: 'DNS:receiver.example',
            } as never)
        ).toBeUndefined();
        expect(
            options.checkServerIdentity!('8.8.8.8', {
                subjectaltname: 'DNS:other.example',
            } as never)
        ).toBeInstanceOf(Error);
        expect(mocks.lookup).toHaveBeenCalledOnce();
        resolve([{ address: '10.0.1.10', family: 4 }]);
        await expect(
            fetchNotificationWebhook('https://receiver.example:8443/events?q=1', request(), false)
        ).rejects.toThrow();
        expect(mocks.lookup).toHaveBeenCalledTimes(2);
        expect(mocks.request).toHaveBeenCalledOnce();
    });

    it('pins a public IPv6 DNS result', async () => {
        resolve([{ address: '2606:4700:4700::1111', family: 6 }]);
        await fetchNotificationWebhook('https://receiver.example/', request(), false);
        expect(mocks.request.mock.calls[0]![0].hostname).toBe('2606:4700:4700::1111');
    });

    it('fails closed on DNS errors and aborts stalled resolution', async () => {
        mocks.lookup.mockImplementationOnce((_host, _options, callback) =>
            callback(new Error('DNS failed'))
        );
        await expect(
            fetchNotificationWebhook('http://unresolved.example/', request(), false)
        ).rejects.toThrow('DNS failed');
        const controller = new AbortController();
        const pending = fetchNotificationWebhook(
            'http://stalled.example/',
            { ...request(), signal: controller.signal },
            false
        );
        controller.abort(new Error('deadline'));
        await expect(pending).rejects.toThrow('deadline');
        expect(mocks.request).not.toHaveBeenCalled();
    });

    it.each([301, 302, 303, 307, 308])('rejects %i without a second request', async status => {
        respond(status);
        await expect(
            fetchNotificationWebhook('https://8.8.8.8/', request(), false)
        ).rejects.toThrow('without redirects');
        expect(mocks.request).toHaveBeenCalledOnce();
    });

    it('bounds the acknowledgement body', async () => {
        respond(200, 'x'.repeat(64 * 1024 + 1));
        await expect(
            fetchNotificationWebhook('https://8.8.8.8/', request(), false)
        ).rejects.toThrow('exceeds 64 KiB');
    });

    it('never relies on the runtime global fetch for hosted delivery', async () => {
        const globalFetch = vi.fn();
        vi.stubGlobal('fetch', globalFetch);
        const response = await fetchNotificationWebhook('https://8.8.8.8/', request(), false);
        expect(response.ok).toBe(true);
        expect(globalFetch).not.toHaveBeenCalled();
    });

    it('permits local development only with the explicit offline runtime flag', async () => {
        const globalFetch = vi.fn().mockResolvedValue(new Response('{"sent":true}'));
        vi.stubGlobal('fetch', globalFetch);
        await expect(
            fetchNotificationWebhook('http://127.0.0.1:5100/', request(), false)
        ).rejects.toThrow();
        expect(globalFetch).not.toHaveBeenCalled();
        await fetchNotificationWebhook('http://127.0.0.1:5100/', request(), true);
        expect(globalFetch).toHaveBeenCalledWith(
            'http://127.0.0.1:5100/',
            expect.objectContaining({ redirect: 'error' })
        );
    });
});

import { lookup } from 'node:dns';
import { BlockList, isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { checkServerIdentity } from 'node:tls';

const nonpublicV4 = new BlockList();
for (const [address, prefix] of [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.88.99.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
] as const) {
    nonpublicV4.addSubnet(address, prefix, 'ipv4');
}

const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
const nonpublicV6 = new BlockList();
// Special-purpose space, documentation and 6to4 (which can embed a private IPv4).
nonpublicV6.addSubnet('2001::', 23, 'ipv6');
nonpublicV6.addSubnet('2001:db8::', 32, 'ipv6');
nonpublicV6.addSubnet('2002::', 16, 'ipv6');
nonpublicV6.addSubnet('3fff::', 20, 'ipv6');

export const isPublicNotificationAddress = (address: string): boolean => {
    if (isIP(address) === 4) return !nonpublicV4.check(address, 'ipv4');
    // Fail closed for mapped/translated IPv4, NAT64, local, multicast and reserved IPv6.
    return (
        isIP(address) === 6 &&
        !address.includes('%') &&
        globalV6.check(address, 'ipv6') &&
        !nonpublicV6.check(address, 'ipv6')
    );
};

export class UnsafeNotificationWebhookError extends Error {
    constructor() {
        super('Notification webhook must use a public HTTP(S) destination without redirects');
        this.name = 'UnsafeNotificationWebhookError';
    }
}

/**
 * The destination answered with a redirect, which is never followed. Unlike the refusals of
 * its parent class a request was sent and an answer arrived; `status` is the 3xx code.
 */
export class NotificationWebhookRedirectError extends UnsafeNotificationWebhookError {
    readonly status: number;

    constructor(status: number) {
        super();
        this.name = 'NotificationWebhookRedirectError';
        this.status = status;
    }
}

/** Resolve once; the HTTP transport receives only a validated literal IP. */
const resolvePublicAddress = (hostname: string, signal: AbortSignal): Promise<string> => {
    signal.throwIfAborted();
    if (isIP(hostname)) {
        if (!isPublicNotificationAddress(hostname)) throw new UnsafeNotificationWebhookError();
        return Promise.resolve(hostname);
    }
    return new Promise((resolve, reject) => {
        const abort = (): void => reject(signal.reason);
        signal.addEventListener('abort', abort, { once: true });
        lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
            signal.removeEventListener('abort', abort);
            if (error) return reject(error);
            if (
                !addresses.length ||
                addresses.some(({ address }) => !isPublicNotificationAddress(address))
            ) {
                return reject(new UnsafeNotificationWebhookError());
            }
            resolve(addresses[0]!.address);
        });
    });
};

type WebhookRequest = {
    method: 'POST';
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
};

const fetchPinnedResource = async (
    destination: string,
    request: Omit<WebhookRequest, 'method' | 'body'> & { method: 'GET' | 'POST'; body?: string },
    isOffline: boolean,
    maxBytes = 64 * 1024
): Promise<Pick<Response, 'ok' | 'status' | 'text'>> => {
    let url: URL;
    try {
        url = new URL(destination);
    } catch {
        throw new UnsafeNotificationWebhookError();
    }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
        throw new UnsafeNotificationWebhookError();
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    // Literal addresses bypass DNS lookup in the transport, so check them here too.
    if (!isOffline && isIP(hostname) && !isPublicNotificationAddress(hostname)) {
        throw new UnsafeNotificationWebhookError();
    }
    // Only the trusted runtime's explicit local-development mode permits private hosts.
    // Neither NODE_ENV=test nor notification/profile fields can disable the guard.
    if (isOffline) {
        // 'manual' hands back the redirect response itself instead of following it, so it can be
        // told apart from a refused address. It is still never followed.
        const response = await fetch(destination, { ...request, redirect: 'manual' });

        if (response.status >= 300 && response.status < 400) {
            await response.body?.cancel().catch(() => undefined);
            throw new NotificationWebhookRedirectError(response.status);
        }

        return response;
    }
    const address = await resolvePublicAddress(hostname, request.signal);
    request.signal.throwIfAborted();
    // Pin the connection target instead of relying on a fetch dispatcher/lookup hook:
    // runtimes can ignore those hooks. Preserve HTTP Host, TLS SNI and certificate identity.
    return new Promise((resolve, reject) => {
        const send = url.protocol === 'https:' ? httpsRequest : httpRequest;
        const outgoing = send(
            {
                protocol: url.protocol,
                hostname: address,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: request.method,
                headers: {
                    ...request.headers,
                    Host: url.host,
                    ...(request.body === undefined
                        ? {}
                        : { 'Content-Length': String(Buffer.byteLength(request.body)) }),
                },
                servername: isIP(hostname) ? undefined : hostname,
                rejectUnauthorized: true,
                checkServerIdentity: (_server, cert) => checkServerIdentity(hostname, cert),
                // A fresh pinned connection per attempt; no pooled connection can bypass validation.
                agent: false,
                signal: request.signal,
            },
            response => {
                const status = response.statusCode ?? 0;
                // node:http never follows redirects. Reject them explicitly as failed delivery.
                if (status >= 300 && status < 400) {
                    response.destroy();
                    reject(new NotificationWebhookRedirectError(status));
                    return;
                }
                const chunks: Buffer[] = [];
                let bytes = 0;
                response.on('error', reject);
                response.on('data', (chunk: Buffer) => {
                    bytes += chunk.length;
                    if (bytes > maxBytes) {
                        response.destroy(
                            new Error(
                                maxBytes === 64 * 1024
                                    ? 'Notification webhook acknowledgement exceeds 64 KiB'
                                    : 'Response exceeds size limit'
                            )
                        );
                        return;
                    }
                    chunks.push(chunk);
                });
                response.on('end', () =>
                    resolve({
                        ok: status >= 200 && status < 300,
                        status,
                        text: async () => Buffer.concat(chunks).toString('utf8'),
                    })
                );
            }
        );
        outgoing.on('error', reject);
        outgoing.end(request.body);
    });
};

/** Existing notification contract, using the shared DNS-pinned transport. */
export const fetchNotificationWebhook = (
    destination: string,
    request: WebhookRequest,
    isOffline: boolean
): Promise<Pick<Response, 'ok' | 'status' | 'text'>> =>
    fetchPinnedResource(destination, request, isOffline);

/** Public verification documents only; the owned local origin is the sole development exception. */
export const fetchVerificationResource = async (
    destination: string,
    signal: AbortSignal,
    localOrigin?: string
): Promise<string> => {
    const url = new URL(destination);
    const local = localOrigin !== undefined && url.origin === localOrigin;
    if ((!local && url.protocol !== 'https:') || url.username || url.password || url.hash)
        throw new UnsafeNotificationWebhookError();
    const response = await fetchPinnedResource(
        destination,
        { method: 'GET', headers: { Accept: 'application/json, application/ld+json' }, signal },
        local,
        2 * 1024 * 1024
    );
    if (!response.ok) throw new Error('Verification document unavailable');
    // The offline transport uses fetch, so bound its body as well.
    if ('body' in response && response.body instanceof ReadableStream) {
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                bytes += value.byteLength;
                if (bytes > 2 * 1024 * 1024) throw new Error('Response exceeds size limit');
                chunks.push(value);
            }
            return Buffer.concat(chunks).toString('utf8');
        } finally {
            await reader.cancel();
        }
    }
    return response.text();
};

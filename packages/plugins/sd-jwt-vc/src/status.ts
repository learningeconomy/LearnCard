import { base64url } from 'jose';
import type { IssuerVerifier } from './signer';
import type { TokenStatusListResult } from './types';

const MAX_TOKEN_BYTES = 256 * 1024;
const MAX_LIST_BYTES = 2 * 1024 * 1024;
const MAX_AGE_MS = 5 * 60_000;
const RECHECK_MS = 60_000;

const object = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
const numericDate = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= Number.MAX_SAFE_INTEGER / 1000;
const requireStatus: (condition: unknown) => asserts condition = condition => {
    if (!condition) throw new Error('Invalid token status list');
};

const readBounded = async (
    stream: ReadableStream<Uint8Array>,
    limit: number
): Promise<Uint8Array> => {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            requireStatus(size <= limit);
            chunks.push(value);
        }
    } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
};

const fetchToken = async (uri: string): Promise<string> => {
    const url = new URL(uri);
    // The initial profile accepts HTTPS public DNS names, without credentials,
    // fragments, redirects, cookies or a referrer. No token or index is sent.
    requireStatus(url.protocol === 'https:' && !url.username && !url.password && !url.hash);
    requireStatus(
        url.hostname.includes('.') &&
            !/^[\d.]+$/.test(url.hostname) &&
            !url.hostname.includes(':') &&
            !/(^|\.)(localhost|local|internal)\.?$/.test(url.hostname)
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(uri, {
            signal: controller.signal,
            headers: { Accept: 'application/statuslist+jwt' },
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            cache: 'no-store',
            redirect: 'error',
        });
        requireStatus(response.ok && !response.redirected && response.body);
        requireStatus(!response.url || new URL(response.url).href === url.href);
        requireStatus(
            response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ===
                'application/statuslist+jwt'
        );
        const bytes = await readBounded(response.body, MAX_TOKEN_BYTES);
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } finally {
        clearTimeout(timer);
        controller.abort();
    }
};

const decodeObject = (segment: string): Record<string, unknown> => {
    requireStatus(/^[A-Za-z0-9_-]+$/.test(segment));
    const value: unknown = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(base64url.decode(segment))
    );
    requireStatus(object(value));
    return value;
};

/**
 * IETF Token Status List draft-21, JWT / same credential-signing-key profile.
 * Authenticate before decompressing; do not trust HTTP caching for freshness.
 * https://datatracker.ietf.org/doc/html/draft-ietf-oauth-status-list-21#section-8.3
 */
export const checkTokenStatusList = async (
    reference: unknown,
    issuer: string,
    alg: string,
    verifier: IssuerVerifier,
    now: () => Date
): Promise<TokenStatusListResult> => {
    requireStatus(
        object(reference) && Object.keys(reference).length === 1 && object(reference.status_list)
    );
    // Only protocol fields may be carried as non-selective credential metadata.
    // Do not admit an arbitrary container of undisclosed personal claims here.
    requireStatus(
        Object.keys(reference.status_list).length === 2 &&
            Object.keys(reference.status_list).every(key => key === 'idx' || key === 'uri')
    );
    const { idx, uri } = reference.status_list;
    requireStatus(
        Number.isSafeInteger(idx) &&
            (idx as number) >= 0 &&
            typeof uri === 'string' &&
            uri.length <= 2048
    );
    const token = await fetchToken(uri);
    const segments = token.split('.');
    requireStatus(segments.length === 3 && segments.every(s => /^[A-Za-z0-9_-]+$/.test(s)));
    const header = decodeObject(segments[0]!);
    requireStatus(
        header.typ === 'statuslist+jwt' &&
            header.alg === alg &&
            header.crit === undefined &&
            header.b64 !== false
    );
    requireStatus(await verifier(`${segments[0]}.${segments[1]}`, segments[2]!));
    const payload = decodeObject(segments[1]!);
    const checkedAt = now().getTime();
    requireStatus(Number.isFinite(checkedAt));
    requireStatus(payload.sub === uri && (payload.iss === undefined || payload.iss === issuer));
    requireStatus(payload.aud === undefined && numericDate(payload.iat));
    requireStatus(
        payload.iat * 1000 <= checkedAt + 60_000 && payload.iat * 1000 + MAX_AGE_MS > checkedAt
    );
    requireStatus(
        payload.exp === undefined ||
            (numericDate(payload.exp) &&
                payload.exp * 1000 > checkedAt &&
                payload.exp > payload.iat)
    );
    requireStatus(
        payload.nbf === undefined || (numericDate(payload.nbf) && payload.nbf * 1000 <= checkedAt)
    );
    requireStatus(
        payload.ttl === undefined ||
            (typeof payload.ttl === 'number' && Number.isFinite(payload.ttl) && payload.ttl > 0)
    );
    requireStatus(object(payload.status_list));
    const { bits, lst } = payload.status_list;
    requireStatus(typeof bits === 'number' && [1, 2, 4, 8].includes(bits));
    requireStatus(typeof lst === 'string' && /^[A-Za-z0-9_-]+$/.test(lst));
    const compressed = base64url.decode(lst);
    let offset = 0;
    // Small input chunks bound the output queued by one decompression step,
    // as well as the total bytes consumed by the application.
    const input = new ReadableStream<BufferSource>(
        {
            pull(controller) {
                if (offset === compressed.length) {
                    controller.close();
                    return;
                }
                controller.enqueue(Uint8Array.from(compressed.subarray(offset, offset + 512)));
                offset = Math.min(compressed.length, offset + 512);
            },
        },
        { highWaterMark: 0 }
    );
    const list = await readBounded(
        input.pipeThrough(new DecompressionStream('deflate')),
        MAX_LIST_BYTES
    );
    requireStatus((idx as number) < list.length * (8 / bits));
    const bit = (idx as number) * bits;
    const value = (list[Math.floor(bit / 8)]! >> (bit % 8)) & ((1 << bits) - 1);
    const validUntil = Math.min(
        checkedAt + RECHECK_MS,
        payload.iat * 1000 + MAX_AGE_MS,
        payload.exp === undefined ? Infinity : (payload.exp as number) * 1000,
        payload.ttl === undefined ? Infinity : checkedAt + (payload.ttl as number) * 1000
    );
    requireStatus(validUntil > now().getTime());
    return { value, checkedAt, validUntil };
};

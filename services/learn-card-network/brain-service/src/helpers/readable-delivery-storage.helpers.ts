import { JWEValidator, type JWE } from '@learncard/types';
import { getCredentialById } from '@accesslayer/credential/read';
import { getUriParts } from './uri.helpers';

const MAX_BYTES = 2 * 1024 * 1024;
const normalizeDomain = (domain: string): string =>
    domain.replace(/\/trpc$/, '').replace(/%3a/gi, ':');

/** Resolve only local network storage or the explicitly configured LearnCloud. No redirects. */
export const readDeliveryCiphertext = async (
    uri: string,
    config: {
        domain: string;
        cloudUrl?: string;
        cloudInternalUrl?: string;
        local: boolean;
        signal?: AbortSignal;
    },
    fetchImpl: typeof fetch = fetch
): Promise<JWE> => {
    if (!uri.startsWith('lc:')) throw new Error('Unsupported storage reference');
    const parts = getUriParts(uri, true);
    if (parts.type !== 'credential' || !/^[a-zA-Z0-9_-]{1,128}$/.test(parts.id))
        throw new Error('Unsupported storage reference');
    let value: unknown;
    if (
        parts.method === 'network' &&
        normalizeDomain(parts.domain) === normalizeDomain(config.domain)
    ) {
        const record = await getCredentialById(parts.id);
        if (!record || Buffer.byteLength(record.credential) > MAX_BYTES)
            throw new Error('Credential unavailable');
        value = JSON.parse(record.credential);
    } else if (parts.method === 'cloud' && config.cloudUrl) {
        const publicUrl = new URL(config.cloudUrl);
        const endpoint = new URL(config.cloudInternalUrl ?? config.cloudUrl);
        if (
            normalizeDomain(parts.domain) !== publicUrl.host ||
            publicUrl.pathname !== '/' ||
            endpoint.pathname !== '/' ||
            endpoint.username ||
            endpoint.password ||
            endpoint.search ||
            endpoint.hash ||
            (!config.local &&
                (publicUrl.protocol !== 'https:' || endpoint.protocol !== 'https:')) ||
            !['http:', 'https:'].includes(endpoint.protocol)
        )
            throw new Error('Unsupported storage reference');
        endpoint.pathname = '/api/storage/resolve';
        endpoint.searchParams.set('uri', uri);
        const response = await fetchImpl(endpoint, {
            redirect: 'error',
            signal: config.signal ?? AbortSignal.timeout(10_000),
        });
        if (!response.ok || !response.body) throw new Error('Credential unavailable');
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
            for (;;) {
                const { done, value: chunk } = await reader.read();
                if (done) break;
                size += chunk.byteLength;
                if (size > MAX_BYTES) throw new Error('Credential too large');
                chunks.push(chunk);
            }
            value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } finally {
            await reader.cancel();
        }
    } else throw new Error('Unsupported storage reference');
    return JWEValidator.parse(value);
};

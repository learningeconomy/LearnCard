import { TRPCError } from '@trpc/server';

export type URIType = 'credential' | 'presentation' | 'boost';

export type URIParts = {
    domain: string;
    type: URIType;
    id: string;
};

export const isURIType = (type: string): type is URIType =>
    ['credential', 'presentation', 'boost'].includes(type);

// Encode colons within the domain portion of a URI so they don't conflict
// with the colon-delimited lc:method:domain/trpc:type:id format.
// Handles preview domains with path prefixes (e.g. domain:cloud/trpc).
export const escapeColonsInDomain = (uri: string): string => {
    const trpcIdx = uri.indexOf('/trpc:');

    if (trpcIdx === -1) return uri;

    const secondColon = uri.indexOf(':', uri.indexOf(':') + 1);

    if (secondColon === -1) return uri;

    const header = uri.substring(0, secondColon + 1);
    const domain = uri.substring(secondColon + 1, trpcIdx);
    const suffix = uri.substring(trpcIdx);

    return header + domain.replace(/:/g, '%3A') + suffix;
};

export const getUriParts = (_uri: string): URIParts => {
    const uri = escapeColonsInDomain(_uri);
    const parts = uri.split(':');

    if (parts.length !== 5) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URI',
        });
    }

    const [lc, method, domain, type, id] = parts as [string, string, string, string, string];

    if (lc !== 'lc' || method !== 'cloud') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'URI is not an lc:cloud URI',
        });
    }

    if (!isURIType(type)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown URI type ${type}` });
    }

    return { domain, type, id };
};

export const getIdFromUri = (uri: string): string => getUriParts(uri).id;

export const constructUri = (type: URIType, id: string, domain: string): string => {
    const isLocal = domain.includes('localhost');
    const encodedDomain = isLocal
        ? domain.replace(/:/g, '%3A')
        : domain.replace(/:/g, '/');

    return `lc:cloud:${encodedDomain}/trpc:${type}:${id}`;
};

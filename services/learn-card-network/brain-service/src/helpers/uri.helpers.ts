import { TRPCError } from '@trpc/server';

export const URI_TYPES = ['credential', 'presentation', 'boost', 'contract', 'terms'] as const;

export type URIType = (typeof URI_TYPES)[number];

export type URIParts = {
    domain: string;
    type: URIType;
    id: string;
};

export const isURIType = (type: string): type is URIType => URI_TYPES.includes(type as any);

export const getUriParts = (uri: string): URIParts => {
    const parts = uri.split(':');

    if (parts.length !== 5) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URI',
        });
    }

    const [lc, method, domain, type, id] = parts as [string, string, string, string, string];

    if (lc !== 'lc' || method !== 'network') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'URI is not an lc:network URI',
        });
    }

    if (!isURIType(type)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown URI type ${type}` });
    }

    return { domain, type, id };
};

export const getIdFromUri = (uri: string): string => getUriParts(uri).id;

export const constructUri = (type: URIType, id: string, domain: string): string =>
    `lc:network:${domain}/trpc:${type}:${id}`;

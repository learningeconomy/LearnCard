import { TRPCError } from '@trpc/server';

export type URIType = 'credential' | 'presentation' | 'boost';

export type URIParts = {
    domain: string;
    type: URIType;
    id: string;
};

export const isURIType = (type: string): type is URIType =>
    ['credential', 'presentation', 'boost'].includes(type);

export const getUriParts = (uri: string): URIParts => {
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

export const constructUri = (type: URIType, id: string, domain: string): string =>
    `lc:cloud:${domain}/trpc:${type}:${id}`;

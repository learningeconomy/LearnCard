import { getBoostByUri } from '@accesslayer/boost/read';
import { getContractByUri } from '@accesslayer/consentflowcontract/read';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getCredentialByUri } from '@accesslayer/credential/read';
import { getPresentationByUri } from '@accesslayer/presentation/read';
import { isEncrypted } from '@learncard/helpers';
import { TRPCError } from '@trpc/server';
import { getLearnCard } from './learnCard.helpers';

export const URI_TYPES = ['credential', 'presentation', 'boost', 'contract', 'terms'] as const;

export type URIType = (typeof URI_TYPES)[number];

export type URIParts = {
    domain: string;
    type: URIType;
    id: string;
    method: string;
};

export const escapeLocalhostInUri = (uri: string): string =>
    uri.replace('localhost:', 'localhost%3A');

export const isURIType = (type: string): type is URIType => URI_TYPES.includes(type as any);

export const getUriParts = (_uri: string, allowOutsideUris: boolean = false): URIParts => {
    const uri = escapeLocalhostInUri(_uri);
    const parts = uri.split(':');

    if (parts.length !== 5) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URI',
        });
    }

    const [lc, method, domain, type, id] = parts as [string, string, string, string, string];

    if ((lc !== 'lc' || method !== 'network') && !allowOutsideUris) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'URI is not an lc:network URI',
        });
    }

    if (!isURIType(type)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown URI type ${type}` });
    }

    return { domain, type, id, method };
};

export const getIdFromUri = (uri: string): string => getUriParts(uri).id;

export const constructUri = (type: URIType, id: string, domain: string): string =>
    `lc:network:${domain}/trpc:${type}:${id}`;

export const resolveUri = async (uri: string) => {
    const { domain, type, method } = getUriParts(uri, true);

    if (method === 'cloud') {
        const isLocal = domain.includes('localhost');
        const url = `http${isLocal ? '' : 's'}://${domain
            .replace('%3A', ':')
            .replace('/trpc', '/api')}/storage/resolve?uri=${encodeURIComponent(uri)}`;

        const res = await fetch(url);
        const resolved = await res.json();
        if (isEncrypted(resolved)) {
            const learnCard = await getLearnCard();

            return await learnCard.invoke.decryptDagJwe(resolved);
        }
        return resolved;
    }

    // should probably be if method === 'network' && domain === 'domain'
    switch (type) {
        case 'credential':
            return await getCredentialByUri(uri);
        case 'presentation':
            return await getPresentationByUri(uri);
        case 'boost':
            return await getBoostByUri(uri);
        case 'contract':
            return await getContractByUri(uri);
        case 'terms':
            return await getContractTermsByUri(uri);
    }
};

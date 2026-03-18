import { getBoostByUri } from '@accesslayer/boost/read';
import { getContractByUri } from '@accesslayer/consentflowcontract/read';
import { getContractTermsByUri } from '@accesslayer/consentflowcontract/relationships/read';
import { getCredentialByUri } from '@accesslayer/credential/read';
import { getPresentationByUri } from '@accesslayer/presentation/read';
import { getSkillFrameworkById } from '@accesslayer/skill-framework/read';
import { getSkillByFrameworkAndId } from '@accesslayer/skill/read';
import { isEncrypted } from '@learncard/helpers';
import { TRPCError } from '@trpc/server';
import { getLearnCard } from './learnCard.helpers';

export const URI_TYPES = [
    'credential',
    'presentation',
    'boost',
    'contract',
    'terms',
    'framework',
    'skill',
] as const;

export type URIType = (typeof URI_TYPES)[number];

export type URIParts = {
    domain: string;
    type: URIType;
    id: string;
    method: string;
};

// Encode colons within the domain portion of a URI so they don't conflict
// with the colon-delimited lc:method:domain/trpc:type:id format.
// Handles preview domains with path prefixes (e.g. domain:brain/trpc).
export const escapeColonsInDomain = (uri: string): string => {
    const trpcIdx = uri.indexOf('/trpc:');

    if (trpcIdx === -1) return uri.replace('localhost:', 'localhost%3A');

    const secondColon = uri.indexOf(':', uri.indexOf(':') + 1);

    if (secondColon === -1) return uri;

    const header = uri.substring(0, secondColon + 1);
    const domain = uri.substring(secondColon + 1, trpcIdx);
    const suffix = uri.substring(trpcIdx);

    return header + domain.replace(/:/g, '%3A') + suffix;
};

export const isURIType = (type: string): type is URIType =>
    URI_TYPES.includes(type as (typeof URI_TYPES)[number]);

export const getUriParts = (_uri: string, allowOutsideUris = false): URIParts => {
    const uri = escapeColonsInDomain(_uri);
    const parts = uri.split(':');

    // Allow additional ':' segments in the id portion (e.g., skill URIs with frameworkId:skillId)
    if (parts.length < 5) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URI',
        });
    }

    const [lc, method, domain, type, ...rest] = parts as [
        string,
        string,
        string,
        string,
        ...string[],
    ];
    const id = rest.join(':');

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

export const getDomainFromUri = (uri: string): string =>
    getUriParts(uri).domain.replace(/\/trpc$/, '');

export const constructUri = (type: URIType, id: string, domain: string): string => {
    const isLocal = domain.includes('localhost');
    const encodedDomain = isLocal ? domain.replace(/:/g, '%3A') : domain.replace(/:/g, '/');

    return `lc:network:${encodedDomain}/trpc:${type}:${id}`;
};

// Helper specifically for skill URIs which must be of the form
// lc:network:<domain>/trpc:skill:<frameworkId>:<skillId>
export const getSkillCompoundFromUri = (uri: string): { frameworkId: string; id: string } => {
    const { type, id } = getUriParts(uri);

    if (type !== 'skill') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not a skill URI' });
    }

    const [frameworkId, skillId, ...extra] = id.split(':');
    if (!frameworkId || !skillId || extra.length > 0) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                "Invalid skill URI. Expected format 'lc:network:<domain>/trpc:skill:<frameworkId>:<skillId>'",
        });
    }

    return { frameworkId, id: skillId };
};

export const resolveUri = async (uri: string, localDomain?: string): Promise<unknown> => {
    const { domain, type, method } = getUriParts(uri, true);

    const _localDomain = localDomain || process.env.DOMAIN_NAME;
    const normalizedDomain = domain.replace('/trpc', '').replace(/%3A/g, ':');
    const normalizedLocalDomain = (_localDomain || '').replace('/trpc', '').replace(/%3A/g, ':');
    const isLocalUri = !domain || normalizedDomain === normalizedLocalDomain;

    if (method === 'cloud') {
        const isLocal = domain.includes('localhost');
        const url = `http${isLocal ? '' : 's'}://${domain
            .replace(/%3A/g, isLocal ? ':' : '/')
            .replace('/trpc', '/api')}/storage/resolve?uri=${encodeURIComponent(uri)}`;

        const res = await fetch(url);
        const resolved = await res.json();
        if (isEncrypted(resolved)) {
            const learnCard = await getLearnCard();

            return await learnCard.invoke.decryptDagJwe(resolved);
        }
        return resolved;
    }

    if (method === 'network' && !isLocalUri) {
        return await resolveExternalNetworkUri(uri, domain);
    }

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
        case 'framework':
            return await getSkillFrameworkById(getIdFromUri(uri));
        case 'skill': {
            const { frameworkId, id } = getSkillCompoundFromUri(uri);
            const skill = await getSkillByFrameworkAndId(frameworkId, id);
            if (!skill) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Skill not found' });
            }
            return skill;
        }
    }
};

const resolveExternalNetworkUri = async (uri: string, domain: string): Promise<unknown> => {
    const isLocal = domain.includes('localhost');
    const baseUrl = `http${isLocal ? '' : 's'}://${domain.replace('%3A', ':').replace('/trpc', '')}`;

    const response = await fetch(`${baseUrl}/api/storage/resolve?uri=${encodeURIComponent(uri)}`);

    if (!response.ok) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `External resource not found: ${uri}`,
        });
    }

    return await response.json();
};

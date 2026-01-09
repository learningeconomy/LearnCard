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

export const escapeLocalhostInUri = (uri: string): string =>
    uri.replace('localhost:', 'localhost%3A');

export const isURIType = (type: string): type is URIType => URI_TYPES.includes(type as any);

export const getUriParts = (_uri: string, allowOutsideUris: boolean = false): URIParts => {
    const uri = escapeLocalhostInUri(_uri);
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
        ...string[]
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

export const constructUri = (type: URIType, id: string, domain: string): string =>
    `lc:network:${domain}/trpc:${type}:${id}`;

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

export const resolveUri = async (uri: string) => {
    const { domain, type, method } = getUriParts(uri, true);
    console.log('uri', uri);
    console.log('Parsed URI parts:', { domain, type, method });
    if (method === 'cloud') {
        const isLocal = domain.includes('localhost');
        const url = `http${isLocal ? '' : 's'}://${domain
            .replace('%3A', ':')
            .replace('/trpc', '/api')}/storage/resolve?uri=${encodeURIComponent(uri)}`;
        console.log('url', url);
        const res = await fetch(url);
        console.log('res', res);
        const resolved = await res.json();
        console.log('resolved', resolved);
        if (isEncrypted(resolved)) {
            try {
                const learnCard = await getLearnCard();
                console.log('JWE Structure:', {
                    protected: resolved.protected,
                    recipients: Array.isArray(resolved.recipients)
                        ? resolved.recipients.map((r: any) => ({
                              header: r.header, //should show DID
                              encrypted_key: r.encrypted_key ? '***' : undefined,
                          }))
                        : resolved.recipients,
                    iv: resolved.iv ? '***' : undefined,
                    ciphertext: resolved.ciphertext ? '***' : undefined,
                    tag: resolved.tag ? '***' : undefined,
                });

                const decryptResolved = await learnCard.invoke.decryptDagJwe(resolved);
                console.log('decryptResolved', decryptResolved);

                return decryptResolved;
            } catch (error) {
                // console.error('Error in decryptDagJwe:', {
                //     message: error.message,
                //     stack: error.stack,
                //     name: error.name,
                //     error: error,
                // });
                throw error;
            }
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

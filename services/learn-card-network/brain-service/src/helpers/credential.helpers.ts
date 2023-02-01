import { TRPCError } from '@trpc/server';
import { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { ProfileInstance, Credential, CredentialInstance } from '@models';

export const getCredentialUri = (id: string, domain: string): string =>
    `lc:network:${domain}/trpc:${id}`;

export const getIdFromCredentialUri = (uri: string): string => {
    const parts = uri.split(':');

    if (parts.length !== 4) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid Credential URI',
        });
    }

    const [lc, method, _domain, id] = parts as [string, string, string, string];

    if (lc !== 'lc' || method !== 'network') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot get ID from Credential URI',
        });
    }

    return id;
};

/** Stores a Credential */
export const storeCredential = async (credential: VC | UnsignedVC): Promise<CredentialInstance> => {
    const id = uuid();

    return Credential.createOne({ id, credential: JSON.stringify(credential) });
};

/** Gets a Credential */
export const getCredentialById = async (id: string): Promise<CredentialInstance | null> => {
    return Credential.findOne({ where: { id } });
};

export const sendCredential = async (
    source: ProfileInstance,
    target: ProfileInstance,
    credential: VC | UnsignedVC,
    domain: string
): Promise<string> => {
    const instance = await storeCredential(credential);

    await source.relateTo({
        alias: 'credentialSent',
        where: { id: instance.id },
        properties: { to: target.handle, date: new Date().toISOString() },
    });

    return getCredentialUri(instance.id, domain);
};

/**
 * Accepts a VC
 */
export const acceptCredential = async (
    to: ProfileInstance,
    from: ProfileInstance,
    uri: string
): Promise<boolean> => {
    const id = getIdFromCredentialUri(uri);

    const pendingVc = (
        await from.findRelationships({
            alias: 'credentialSent',
            where: {
                relationship: { to: to.handle },
                target: { id },
            },
        })
    )[0]?.target;

    if (!pendingVc) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Credential not found',
        });
    }

    await pendingVc.relateTo({
        alias: 'credentialReceived',
        where: { handle: to.handle },
        properties: { from: from.handle, date: new Date().toISOString() },
    });

    return true;
};

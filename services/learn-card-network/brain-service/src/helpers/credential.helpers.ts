import { TRPCError } from '@trpc/server';
import { UnsignedVC, VC } from '@learncard/types';

import { ProfileInstance } from '@models';

import { storeCredential } from '@accesslayer/credential/create';
import {
    createReceivedCredentialRelationship,
    createSentCredentialRelationship,
} from '@accesslayer/credential/relationships/create';
import { getCredentialSentToProfile } from '@accesslayer/credential/relationships/read';

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

export const sendCredential = async (
    from: ProfileInstance,
    to: ProfileInstance,
    credential: VC | UnsignedVC,
    domain: string
): Promise<string> => {
    const credentialInstance = await storeCredential(credential);

    await createSentCredentialRelationship(from, to, credentialInstance);

    return getCredentialUri(credentialInstance.id, domain);
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

    const pendingVc = await getCredentialSentToProfile(id, from, to);

    if (!pendingVc) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Credential not found',
        });
    }

    await createReceivedCredentialRelationship(to, from, pendingVc);

    return true;
};

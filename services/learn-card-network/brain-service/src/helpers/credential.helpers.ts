import { TRPCError } from '@trpc/server';
import { UnsignedVC, VC, JWE } from '@learncard/types';

import { ProfileInstance } from '@models';

import { storeCredential } from '@accesslayer/credential/create';
import {
    createReceivedCredentialRelationship,
    createSentCredentialRelationship,
} from '@accesslayer/credential/relationships/create';
import { getCredentialSentToProfile } from '@accesslayer/credential/relationships/read';
import { constructUri, getUriParts } from './uri.helpers';

export const getCredentialUri = (id: string, domain: string): string =>
    constructUri('credential', id, domain);

export const sendCredential = async (
    from: ProfileInstance,
    to: ProfileInstance,
    credential: VC | UnsignedVC | JWE,
    domain: string
): Promise<string> => {
    const credentialInstance = await storeCredential(credential);

    await createSentCredentialRelationship(from, to, credentialInstance);

    return getCredentialUri(credentialInstance.id, domain);
};

/**
 * Accepts a VC
 */
export const acceptCredential = async (profile: ProfileInstance, uri: string): Promise<boolean> => {
    const { id, type } = getUriParts(uri);

    if (type !== 'credential') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not a credential URI' });
    }

    const pendingVc = await getCredentialSentToProfile(id, profile);

    if (!pendingVc) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Credential not found',
        });
    }

    await createReceivedCredentialRelationship(profile, pendingVc.source, pendingVc.target);

    return true;
};

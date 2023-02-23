import { TRPCError } from '@trpc/server';
import { UnsignedVC, VC, JWE } from '@learncard/types';

import { ProfileInstance } from '@models';

import { storeCredential } from '@accesslayer/credential/create';
import {
    createReceivedCredentialRelationship,
    createSentCredentialRelationship,
} from '@accesslayer/credential/relationships/create';
import { getCredentialSentToProfile } from '@accesslayer/credential/relationships/read';
import { isEncrypted } from './types.helpers';
import { createBoost } from '@accesslayer/boost/create';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
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

    if (!isEncrypted(credential)) {
        const boost = await createBoost(credential, from);
        await createBoostInstanceOfRelationship(credentialInstance, boost);
    }

    await createSentCredentialRelationship(from, to, credentialInstance);

    return getCredentialUri(credentialInstance.id, domain);
};

/**
 * Accepts a VC
 */
export const acceptCredential = async (to: ProfileInstance, uri: string): Promise<boolean> => {
    const { id, type } = getUriParts(uri);

    if (type !== 'credential') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not a credential URI' });
    }

    const pendingVc = await getCredentialSentToProfile(id, to);

    if (!pendingVc) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Credential not found',
        });
    }

    await createReceivedCredentialRelationship(to, pendingVc.source, pendingVc.target);

    return true;
};

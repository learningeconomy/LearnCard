import { VC, JWE } from '@learncard/types';

import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { BoostInstance, ProfileInstance } from '@models';
import { constructUri } from './uri.helpers';
import { storeCredential } from '@accesslayer/credential/create';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
import { isEncrypted } from './types.helpers';
import { createSentCredentialRelationship } from '@accesslayer/credential/relationships/create';
import { getCredentialUri } from './credential.helpers';

export const getBoostUri = (id: string, domain: string): string =>
    constructUri('boost', id, domain);

export const isProfileBoostOwner = async (
    profile: ProfileInstance,
    boost: BoostInstance
): Promise<boolean> => {
    const owner = await getBoostOwner(boost);

    return owner?.profileId === profile.profileId;
};

export const sendBoost = async (
    from: ProfileInstance,
    to: ProfileInstance,
    boost: BoostInstance,
    credential: VC | JWE,
    domain: string
): Promise<string> => {
    const credentialInstance = await storeCredential(credential);

    if (!isEncrypted(credential)) {
        await createBoostInstanceOfRelationship(credentialInstance, boost);
    }

    await createSentCredentialRelationship(from, to, credentialInstance);

    return getCredentialUri(credentialInstance.id, domain);
};

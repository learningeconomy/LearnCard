import { TRPCError } from '@trpc/server';
import { UnsignedVC, VC, JWE, LCNNotificationTypeEnumValidator } from '@learncard/types';

import { storeCredential } from '@accesslayer/credential/create';
import {
    createReceivedCredentialRelationship,
    createSentCredentialRelationship,
    setDefaultClaimedRole,
} from '@accesslayer/credential/relationships/create';
import { getCredentialSentToProfile, getCredentialReceivedByProfile } from '@accesslayer/credential/relationships/read';
import { constructUri, getUriParts } from './uri.helpers';
import { addNotificationToQueue } from './notifications.helpers';
import { ProfileType } from 'types/profile';
import { processClaimHooks } from './claim-hooks.helpers';

export const getCredentialUri = (id: string, domain: string): string =>
    constructUri('credential', id, domain);

export const sendCredential = async (
    from: ProfileType,
    to: ProfileType,
    credential: VC | UnsignedVC | JWE,
    domain: string
): Promise<string> => {
    const credentialInstance = await storeCredential(credential);

    await createSentCredentialRelationship(from, to, credentialInstance);

    let uri = getCredentialUri(credentialInstance.id, domain);

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED,
        to,
        from,
        message: {
            title: 'Credential Received',
            body: `${from.displayName} has sent you a credential`,
        },
        data: { vcUris: [uri] },
    });

    return uri;
};

/**
 * Accepts a VC
 */
export const acceptCredential = async (
    profile: ProfileType,
    uri: string,
    options: { skipNotification?: boolean } = { skipNotification: false }
): Promise<boolean> => {
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

    // Check if credential has already been received by this profile
    const alreadyReceived = await getCredentialReceivedByProfile(id, profile);
    if (alreadyReceived) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Credential has already been received',
        });
    }

    await createReceivedCredentialRelationship(profile, pendingVc.source, pendingVc.target);

    await processClaimHooks(profile, pendingVc.target);

    await setDefaultClaimedRole(profile, pendingVc.target);

    if (!options?.skipNotification) {
        await addNotificationToQueue({
            type: LCNNotificationTypeEnumValidator.enum.BOOST_ACCEPTED,
            to: pendingVc.source,
            from: profile,
            message: {
                title: 'Boost Accepted',
                body: `${profile.displayName} has accepted your boost!`,
            },
            data: { vcUris: [uri] },
        });
    }

    return true;
};

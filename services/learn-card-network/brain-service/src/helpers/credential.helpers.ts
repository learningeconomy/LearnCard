import { TRPCError } from '@trpc/server';
import { UnsignedVC, VC, JWE, LCNNotificationTypeEnumValidator } from '@learncard/types';

import { storeCredential } from '@accesslayer/credential/create';
import {
    createReceivedCredentialRelationship,
    createSentCredentialRelationship,
    setDefaultClaimedRole,
} from '@accesslayer/credential/relationships/create';
import {
    getCredentialSentToProfile,
    getCredentialReceivedByProfile,
} from '@accesslayer/credential/relationships/read';
import { constructUri, getUriParts } from './uri.helpers';
import { addNotificationToQueue } from './notifications.helpers';
import { ProfileType } from 'types/profile';
import { processClaimHooks } from './claim-hooks.helpers';
import { ensureConnectionsForCredentialAcceptance } from './connection.helpers';

export const getCredentialUri = (id: string, domain: string): string =>
    constructUri('credential', id, domain);

export const sendCredential = async (
    from: ProfileType,
    to: ProfileType,
    credential: VC | UnsignedVC | JWE,
    domain: string,
    metadata?: Record<string, unknown> | undefined
): Promise<string> => {
    const credentialInstance = await storeCredential(credential);

    await createSentCredentialRelationship(from, to, credentialInstance, metadata);

    let uri = getCredentialUri(credentialInstance.id, domain);

    const isEndorsement = metadata?.type === 'endorsement';

    const notificationTitle = isEndorsement ? 'New Endorsement Received' : 'Credential Received';

    const notificationBody = isEndorsement
        ? `${from.displayName} has endorsed your credential`
        : `${from.displayName} has sent you a credential`;

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED,
        to,
        from,
        message: {
            title: notificationTitle,
            body: notificationBody,
        },
        data: {
            vcUris: [uri],
            ...(metadata ? { metadata } : {}),
        },
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

    await createReceivedCredentialRelationship(
        profile,
        pendingVc.source,
        pendingVc.target,
        pendingVc.relationship.metadata
    );

    await processClaimHooks(profile, pendingVc.target);

    await setDefaultClaimedRole(profile, pendingVc.target);

    // Persist explicit CONNECTED_WITH edges (with sources) for auto-connect mechanics
    await ensureConnectionsForCredentialAcceptance(profile, pendingVc.target.id);

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

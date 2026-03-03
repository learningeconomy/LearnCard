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
    getBoostIdForCredentialInstance,
} from '@accesslayer/credential/relationships/read';
import { constructUri, getDomainFromUri, getUriParts } from './uri.helpers';
import { addNotificationToQueue } from './notifications.helpers';
import { logCredentialClaimed } from './activity.helpers';
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
    metadata?: Record<string, unknown> | undefined,
    activityId?: string,
    integrationId?: string
): Promise<string> => {
    const credentialInstance = await storeCredential(credential);

    await createSentCredentialRelationship(from, to, credentialInstance, metadata, activityId, integrationId);

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
    options: { skipNotification?: boolean; metadata?: Record<string, unknown> } = {
        skipNotification: false,
    }
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
            data: { vcUris: [uri], ...(options?.metadata ? { metadata: options.metadata } : {}) },
        });
    }

    // Log credential activity for claim - chain to original activityId/integrationId if available
    // activityId and integrationId are stored as separate fields on the relationship
    const originalActivityId = pendingVc.relationship.activityId;
    const integrationId = pendingVc.relationship.integrationId;

    // Get boostUri if this credential is associated with a boost
    const boostId = await getBoostIdForCredentialInstance(pendingVc.target);
    const boostUri = boostId ? constructUri('boost', boostId, getDomainFromUri(uri)) : undefined;

    await logCredentialClaimed({
        activityId: originalActivityId,
        actorProfileId: pendingVc.source.profileId,
        recipientType: 'profile',
        recipientIdentifier: profile.profileId,
        recipientProfileId: profile.profileId,
        credentialUri: uri,
        boostUri,
        integrationId,
        source: 'claim',
        metadata: options?.metadata,
    });

    return true;
};

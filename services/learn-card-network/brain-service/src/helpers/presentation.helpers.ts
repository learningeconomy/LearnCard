import { TRPCError } from '@trpc/server';
import { VP, JWE, LCNNotificationTypeEnumValidator } from '@learncard/types';

import { storePresentation } from '@accesslayer/presentation/create';
import {
    createReceivedPresentationRelationship,
    createSentPresentationRelationship,
} from '@accesslayer/presentation/relationships/create';
import {
    getPresentationSentToProfile,
    getPresentationReceivedByProfile,
} from '@accesslayer/presentation/relationships/read';
import { constructUri, getUriParts } from './uri.helpers';
import { addNotificationToQueue } from './notifications.helpers';
import { getNotificationMessage } from './notificationMessages';
import { resolveRecipientLocale } from './getRecipientLocale.helpers';
import { ProfileType } from 'types/profile';

export const getPresentationUri = (id: string, domain: string): string =>
    constructUri('presentation', id, domain);

export const sendPresentation = async (
    from: ProfileType,
    to: ProfileType,
    presentation: VP | JWE,
    domain: string,
    metadata?: Record<string, unknown>
): Promise<string> => {
    const presentationInstance = await storePresentation(presentation);

    await createSentPresentationRelationship(from, to, presentationInstance, metadata);

    const uri = getPresentationUri(presentationInstance.id, domain);

    await addNotificationToQueue({
        type: LCNNotificationTypeEnumValidator.enum.PRESENTATION_RECEIVED,
        to,
        from,
        message: getNotificationMessage('presentationReceived', resolveRecipientLocale(to), {
            from: from.displayName,
        }),
        data: { vpUris: [uri] },
    });

    return uri;
};

/**
 * Accepts a VP
 */
export const acceptPresentation = async (profile: ProfileType, uri: string): Promise<boolean> => {
    const { id, type } = getUriParts(uri);

    if (type !== 'presentation') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not a presentation URI' });
    }

    const pendingVp = await getPresentationSentToProfile(id, profile);

    if (!pendingVp) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Presentation not found',
        });
    }

    // Acceptance is idempotent so a client can safely recover from a response
    // interruption without producing a second received relationship.
    const alreadyReceived = await getPresentationReceivedByProfile(id, profile);
    if (!alreadyReceived) {
        await createReceivedPresentationRelationship(
            profile,
            pendingVp.source,
            pendingVp.target,
            pendingVp.relationship.metadata
        );
    }

    return true;
};

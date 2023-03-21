import { TRPCError } from '@trpc/server';
import { VP, JWE, LCNNotificationTypeEnumValidator } from '@learncard/types';

import { ProfileInstance } from '@models';

import { storePresentation } from '@accesslayer/presentation/create';
import {
    createReceivedPresentationRelationship,
    createSentPresentationRelationship,
} from '@accesslayer/presentation/relationships/create';
import { getPresentationSentToProfile } from '@accesslayer/presentation/relationships/read';
import { constructUri, getUriParts } from './uri.helpers';
import { SendNotification } from './notifications.helpers';

export const getPresentationUri = (id: string, domain: string): string =>
    constructUri('presentation', id, domain);

export const sendPresentation = async (
    from: ProfileInstance,
    to: ProfileInstance,
    presentation: VP | JWE,
    domain: string
): Promise<string> => {
    const presentationInstance = await storePresentation(presentation);

    await createSentPresentationRelationship(from, to, presentationInstance);

    let uri = getPresentationUri(presentationInstance.id, domain);

    await SendNotification({
        type: LCNNotificationTypeEnumValidator.enum.BOOST_RECEIVED,
        to: to.dataValues,
        from: from.dataValues,
        message: {
            title: 'Boost Received',
            body: `${from.displayName} has boosted you!`,
        },
        data: {
            vcUris: [uri],
        },
    });

    return uri;
};

/**
 * Accepts a VP
 */
export const acceptPresentation = async (
    profile: ProfileInstance,
    uri: string
): Promise<boolean> => {
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

    await createReceivedPresentationRelationship(profile, pendingVp.source, pendingVp.target);

    return true;
};
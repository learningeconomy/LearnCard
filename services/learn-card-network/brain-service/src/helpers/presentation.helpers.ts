import { TRPCError } from '@trpc/server';
import { VP, JWE } from '@learncard/types';

import { ProfileInstance } from '@models';

import { storePresentation } from '@accesslayer/presentation/create';
import {
    createReceivedPresentationRelationship,
    createSentPresentationRelationship,
} from '@accesslayer/presentation/relationships/create';
import { getPresentationSentToProfile } from '@accesslayer/presentation/relationships/read';

export const getPresentationUri = (id: string, domain: string): string =>
    `lc:network:${domain}/trpc:${id}`;

export const getIdFromPresentationUri = (uri: string): string => {
    const parts = uri.split(':');

    if (parts.length !== 4) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid Presentation URI',
        });
    }

    const [lc, method, _domain, id] = parts as [string, string, string, string];

    if (lc !== 'lc' || method !== 'network') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot get ID from Presentation URI',
        });
    }

    return id;
};

export const sendPresentation = async (
    from: ProfileInstance,
    to: ProfileInstance,
    presentation: VP | JWE,
    domain: string
): Promise<string> => {
    const presentationInstance = await storePresentation(presentation);

    await createSentPresentationRelationship(from, to, presentationInstance);

    return getPresentationUri(presentationInstance.id, domain);
};

/**
 * Accepts a VP
 */
export const acceptPresentation = async (
    to: ProfileInstance,
    from: ProfileInstance,
    uri: string
): Promise<boolean> => {
    const id = getIdFromPresentationUri(uri);

    const pendingVp = await getPresentationSentToProfile(id, from, to);

    if (!pendingVp) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Pending Presentation not found',
        });
    }

    await createReceivedPresentationRelationship(to, from, pendingVp);

    return true;
};

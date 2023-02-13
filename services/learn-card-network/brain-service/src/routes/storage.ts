import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    UnsignedVC,
    VC,
    VP,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
} from '@learncard/types';

import { getCredentialUri, getIdFromCredentialUri } from '@helpers/credential.helpers';
import { storePresentation } from '@helpers/presentation.helpers';

import { t, didAndChallengeRoute } from '@routes';
import { storeCredential } from '@accesslayer/credential/create';
import { getCredentialById } from '@accesslayer/credential/read';
import { getPresentationById } from '@accesslayer/presentation/read';

export const storageRouter = t.router({
    store: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/storage/store',
                tags: ['Credentials'],
                summary: 'Store a Credential/Presentation',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ item: UnsignedVCValidator.or(VCValidator).or(VPValidator) }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { item } = input;

            const isVP = (await VPValidator.spa(item)).success;

            const credentialInstance = isVP
                ? await storePresentation(item as VP)
                : await storeCredential(item as UnsignedVC | VC);

            return getCredentialUri(credentialInstance.id, ctx.domain);
        }),

    resolve: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/storage/resolve/{uri}',
                tags: ['Credentials'],
                summary: 'Resolves a URI to a Credential/Presentation',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(UnsignedVCValidator.or(VCValidator).or(VPValidator))
        .query(async ({ input }) => {
            const { uri } = input;

            const id = getIdFromCredentialUri(uri);

            const [credentialInstance, presentationInstance] = await Promise.all([
                getCredentialById(id),
                getPresentationById(id),
            ]);

            if (!credentialInstance && !presentationInstance) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'URI did not resolve to anything',
                });
            }

            return JSON.parse(
                (credentialInstance?.credential || presentationInstance?.presentation) ?? ''
            );
        }),
});
export type StorageRouter = typeof storageRouter;

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    UnsignedVC,
    VC,
    VP,
    JWE,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    JWEValidator,
} from '@learncard/types';

import { getCredentialUri, getIdFromCredentialUri } from '@helpers/credential.helpers';

import { t, didAndChallengeRoute } from '@routes';
import { storePresentation } from '@accesslayer/presentation/create';
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
                tags: ['Storage'],
                summary: 'Store a Credential/Presentation',
                description:
                    'This endpoint stores a credential/presentation, returning a uri that can be used to resolve it',
            },
        })
        .input(
            z.object({
                item: UnsignedVCValidator.or(VCValidator).or(VPValidator).or(JWEValidator),
                type: z.enum(['credential', 'presentation']).optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { item, type } = input;

            const isVP = type === 'presentation' || (await VPValidator.spa(item)).success;

            const instance =
                isVP && type !== 'credential'
                    ? await storePresentation(item as VP | JWE)
                    : await storeCredential(item as UnsignedVC | VC | JWE);

            return getCredentialUri(instance.id, ctx.domain);
        }),

    resolve: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/storage/resolve/{uri}',
                tags: ['Storage'],
                summary: 'Resolves a URI to a Credential/Presentation',
                description:
                    'This endpoint stores a credential/presentation, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(UnsignedVCValidator.or(VCValidator).or(VPValidator).or(JWEValidator))
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

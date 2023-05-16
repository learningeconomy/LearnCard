import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { UnsignedVCValidator, VCValidator, VPValidator, JWEValidator } from '@learncard/types';

import { t, didAndChallengeRoute } from '@routes';
import { createCredential } from '@accesslayer/credential/create';
import { getCredentialById } from '@accesslayer/credential/read';
import { getUriParts, constructUri } from '@helpers/uri.helpers';
import { encryptObject } from '@helpers/encryption.helpers';
import { isEncrypted } from '@learncard/helpers';

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
            z.object({ item: UnsignedVCValidator.or(VCValidator).or(VPValidator).or(JWEValidator) })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { item } = input;

            const jwe = isEncrypted(item)
                ? item
                : await encryptObject(item, ctx.domain, [ctx.user.did]);

            const id = await createCredential(jwe);

            if (!id) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to store item',
                });
            }

            return constructUri('credential', id, ctx.domain);
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
        .output(JWEValidator)
        .query(async ({ input }) => {
            const { uri } = input;

            const { id, type } = getUriParts(uri);

            if (type === 'credential') {
                const credential = await getCredentialById(id);

                if (!credential) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
                }

                return credential.jwe;
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Unknown URI type',
            });
        }),
});
export type StorageRouter = typeof storageRouter;

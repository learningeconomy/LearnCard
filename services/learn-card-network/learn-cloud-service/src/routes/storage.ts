import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { UnsignedVCValidator, VCValidator, VPValidator, JWEValidator } from '@learncard/types';

import { t, didAndChallengeRoute } from '@routes';
import { createCredential } from '@accesslayer/credential/create';
import { getCredentialById, getCredentialsById } from '@accesslayer/credential/read';
import { getUriParts, constructUri } from '@helpers/uri.helpers';
import { encryptObject } from '@helpers/encryption.helpers';
import { isEncrypted } from '@learncard/helpers';
import {
    setCredentialForId,
    getCachedCredentialById,
    getCachedCredentialsById,
} from '@cache/credentials';

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

            await setCredentialForId(id, jwe);

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

            const cachedResponse = await getCachedCredentialById(id);

            if (cachedResponse) return cachedResponse;

            if (type === 'credential') {
                const credential = await getCredentialById(id);

                if (!credential) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
                }

                await setCredentialForId(id, credential.jwe);

                return credential.jwe;
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Unknown URI type',
            });
        }),

    batchResolve: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/storage/resolve/batch',
                tags: ['Storage'],
                summary: 'Resolves URIs to Credentials/Presentations',
                description: 'This endpoint resolves a batch or URIs',
            },
        })
        .input(z.object({ uris: z.string().array() }))
        .output(JWEValidator.or(z.null()).array())
        .query(async ({ input }) => {
            const { uris } = input;

            const ids = uris.map(uri => {
                try {
                    const { id } = getUriParts(uri);

                    return id;
                } catch (error) {
                    return null;
                }
            });

            const filteredIds = ids.filter(Boolean) as string[];

            const cachedValues = await getCachedCredentialsById(filteredIds);

            // An array where each element has three possible values:
            // - Resolved object from cache hit
            // - String URI from cache miss
            // - Null from invalid URI or other error
            const withCachedValues = uris.map((uri, index) => {
                const id = ids[index];

                if (!id) return null; // Null if invalid ID

                const filteredIndex = filteredIds.findIndex(filteredId => filteredId === id);

                if (filteredIndex < 0) return null; // This is theoretically impossible, but a good sanity check

                return cachedValues[filteredIndex] || uri; // Resolved object if cache hit, string uri if cache miss
            });

            const cacheMisses = withCachedValues.filter(
                value => typeof value === 'string'
            ) as string[];

            const credentials = await getCredentialsById(cacheMisses);

            return withCachedValues.map(value => {
                if (typeof value !== 'string') return value;

                const index = credentials.findIndex(
                    credential => credential._id.toString() === value
                );

                return index > -1 ? credentials[index]!.jwe : null;
            });
        }),
});
export type StorageRouter = typeof storageRouter;

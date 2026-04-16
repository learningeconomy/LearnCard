import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { JWE, UnsignedVCValidator, VCValidator, VPValidator, JWEValidator } from '@learncard/types';

import { t, didAndChallengeRoute, openRoute } from '@routes';
import { createCredential } from '@accesslayer/credential/create';
import { deleteCredentialById } from '@accesslayer/credential/delete';
import { getCredentialById, getCredentialsById } from '@accesslayer/credential/read';
import { getAllDidsForDid } from '@accesslayer/user/read';
import { getUriParts, constructUri } from '@helpers/uri.helpers';
import { encryptObject } from '@helpers/encryption.helpers';
import { isEncrypted } from '@learncard/helpers';
import {
    setCredentialForId,
    getCachedCredentialById,
    getCachedCredentialsById,
    deleteCredentialForId,
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

            const jwe: JWE = isEncrypted(item)
                ? (item as any)
                : await encryptObject(item, ctx.domain, [ctx.user.did]);

            const id = await createCredential(jwe, ctx.user.did);

            if (!id) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to store item',
                });
            }

            await setCredentialForId(id, jwe);

            return constructUri('credential', id, ctx.domain);
        }),

    delete: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/storage/delete',
                tags: ['Storage'],
                summary: 'Delete a stored Credential/Presentation',
                description: 'Deletes a stored item by URI when the caller is authorized.',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { uri } = input;
            const { id, type } = getUriParts(uri);

            if (type !== 'credential' && type !== 'presentation') {
                return false;
            }

            const credential = await getCredentialById(id);
            if (!credential) return false;

            if (credential.did) {
                const dids = await getAllDidsForDid(ctx.user.did);
                if (!dids.includes(credential.did)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'You do not own this stored credential.',
                    });
                }
            }

            const deletedCount = await deleteCredentialById(id);
            if (!deletedCount) return false;

            await deleteCredentialForId(id);
            return true;
        }),

    resolve: openRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/storage/resolve',
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

            const withCachedValues = uris.map((uri, index) => {
                const id = ids[index];

                if (!id) return null;

                const filteredIndex = filteredIds.findIndex(filteredId => filteredId === id);

                if (filteredIndex < 0) return null;

                return cachedValues[filteredIndex] || uri;
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

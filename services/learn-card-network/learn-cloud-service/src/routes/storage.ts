import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    JWE,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
    JWEValidator,
    StoredCredentialEnvelopeValidator,
} from '@learncard/types';

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
            z.object({
                item: UnsignedVCValidator.or(VCValidator)
                    .or(VPValidator)
                    .or(JWEValidator)
                    .or(StoredCredentialEnvelopeValidator),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { item } = input;

            const jwe: JWE = isEncrypted(item)
                ? (item as JWE)
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
        .query(async ({ ctx, input }) => {
            const { uris } = input;

            // Normalize the request host the same way constructUri encodes domains into URIs.
            const requestDomain = (
                ctx.domain.includes('localhost')
                    ? ctx.domain.replace(/:/g, '%3A')
                    : ctx.domain.replace(/:/g, '/')
            ).replace(/\/$/, '');

            const parsed = uris.map(uri => {
                try {
                    const { id, domain, type } = getUriParts(uri);
                    if (type !== 'credential' && type !== 'presentation') return null;
                    // Reject cross-host URIs so a matching ID on this host cannot be returned
                    // under a foreign URI (copied datasets / multi-cloud).
                    const uriDomain = domain.replace(/\/$/, '');
                    if (uriDomain !== requestDomain && uriDomain !== `${requestDomain}/trpc`) {
                        // constructUri embeds `/trpc` into the domain segment for most hosts.
                        const withTrpc = requestDomain.endsWith('/trpc')
                            ? requestDomain
                            : `${requestDomain}/trpc`;
                        if (uriDomain !== withTrpc) return null;
                    }
                    return id;
                } catch (error) {
                    return null;
                }
            });

            const filteredIds = parsed.filter(Boolean) as string[];
            const cachedValues = await getCachedCredentialsById(filteredIds);

            // Per-URI slot: cached JWE, or `{ missId }` for Redis misses. Never keep the full URI
            // here — getCredentialsById expects Mongo ObjectIds (LC-2382 / goblincore).
            type Slot = JWE | { missId: string } | null;
            const slots: Slot[] = uris.map((_uri, index) => {
                const id = parsed[index];
                if (!id) return null;

                const filteredIndex = filteredIds.findIndex(filteredId => filteredId === id);
                if (filteredIndex < 0) return null;

                const cached = cachedValues[filteredIndex];
                if (cached) return cached;

                return { missId: id };
            });

            const missIds = [
                ...new Set(
                    slots
                        .filter(
                            (slot): slot is { missId: string } =>
                                typeof slot === 'object' && slot !== null && 'missId' in slot
                        )
                        .map(slot => slot.missId)
                ),
            ];

            const credentials = missIds.length > 0 ? await getCredentialsById(missIds) : [];
            const byId = new Map(
                credentials.map(credential => [credential._id.toString(), credential.jwe] as const)
            );

            // Repopulate Redis for cold misses (same as single resolve).
            await Promise.all([...byId.entries()].map(([id, jwe]) => setCredentialForId(id, jwe)));

            return slots.map(slot => {
                if (slot === null) return null;
                if (typeof slot === 'object' && 'missId' in slot) {
                    return byId.get(slot.missId) ?? null;
                }
                return slot;
            });
        }),
});
export type StorageRouter = typeof storageRouter;

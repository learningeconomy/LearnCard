import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { DidDocumentValidator } from '@learncard/types';

import { t, profileRoute } from '@routes';
import { createDidMetadata } from '@accesslayer/did-metadata/create';
import { associateDidMetadataWithProfile } from '@accesslayer/did-metadata/relationships/create';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { deleteDidMetadata } from '@accesslayer/did-metadata/delete';
import { DidMetadataValidator } from 'types/did-metadata';
import { getDidMetadataById } from '@accesslayer/did-metadata/read';
import {
    getDidMetadataForProfile,
    isDidMetadataAssociatedWithProfile,
} from '@accesslayer/did-metadata/relationships/read';
import { updateDidMetadata } from '@accesslayer/did-metadata/update';

export const didMetadataRouter = t.router({
    addDidMetadata: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/did-metadata/create',
                tags: ['DID Metadata'],
                summary: 'Add Metadata to your did web',
                description: 'Add Metadata to your did web',
            },
        })
        .input(DidDocumentValidator.partial())
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const metadata = await createDidMetadata(input);

            await associateDidMetadataWithProfile(metadata.id, ctx.user.profile.profileId);

            if (metadata) {
                // confirm that did is still valid
                try {
                    const learnCard = await getEmptyLearnCard();
                    await learnCard.invoke.resolveDid(
                        getDidWeb(ctx.domain, ctx.user.profile.profileId)
                    );

                    return true;
                } catch (error) {
                    await deleteDidMetadata(metadata.id);

                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Adding this metadata would make your did doc invalid!',
                    });
                }
            }

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occured, please try again later.',
            });
        }),

    getDidMetadata: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/did-metadata/{id}',
                tags: ['DID Metadata'],
                summary: 'Get DID Metadata',
                description: 'Get DID Metadata',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(DidDocumentValidator.partial().optional())
        .query(async ({ input }) => {
            const metadata = await getDidMetadataById(input.id);

            if (!metadata) return undefined;

            const { id: _id, ...doc } = metadata;

            return doc;
        }),

    getMyDidMetadata: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/did-metadata',
                tags: ['DID Metadata'],
                summary: 'Get My DID Metadata',
                description: 'Get My DID Metadata',
            },
        })
        .input(z.void())
        .output(DidMetadataValidator.array())
        .query(async ({ ctx }) => {
            return getDidMetadataForProfile(ctx.user.profile.profileId);
        }),

    updateDidMetadata: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/did-metadata/update/{id}',
                tags: ['DID Metadata'],
                summary: 'Update DID Metadata',
                description: 'Update DID Metadata',
            },
        })
        .input(z.object({ id: z.string(), updates: DidDocumentValidator.partial() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            if (!(await isDidMetadataAssociatedWithProfile(input.id, ctx.user.profile.profileId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This Metadata is not associated with you!',
                });
            }

            const metadata = await getDidMetadataById(input.id);

            if (!metadata) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Metadata not found',
                });
            }

            return updateDidMetadata(metadata, input.updates);
        }),

    deleteDidMetadata: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/did-metadata/{id}',
                tags: ['DID Metadata'],
                summary: 'Delete DID Metadata',
                description: 'Delete DID Metadata',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            if (!(await isDidMetadataAssociatedWithProfile(input.id, ctx.user.profile.profileId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This Metadata is not associated with you!',
                });
            }

            await deleteDidMetadata(input.id);

            return true;
        }),
});

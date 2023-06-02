import { Filter, UpdateFilter } from 'mongodb';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { MongoCustomDocumentType, MongoCustomDocumentValidator } from '@models';
import { createCustomDocument, createCustomDocuments } from '@accesslayer/custom-document/create';
import {
    countCustomDocumentsByQuery,
    getCustomDocumentsByQuery,
} from '@accesslayer/custom-document/read';
import { updateCustomDocumentsByQuery } from '@accesslayer/custom-document/update';
import { deleteCustomDocumentsByQuery } from '@accesslayer/custom-document/delete';

export const customStorageRouter = t.router({
    create: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/custom-storage/create',
                tags: ['Custom Storage'],
                summary: 'Create a document in custom storage',
                description:
                    'This endpoint allows the user to create a document in their custom store.',
            },
        })
        .input(z.object({ item: MongoCustomDocumentValidator }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const id = await createCustomDocument(ctx.user.did, input.item);

            if (!id) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to store item',
                });
            }

            return true;
        }),
    createMany: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/custom-storage/create-many',
                tags: ['Custom Storage'],
                summary: 'Create a document in custom storage',
                description:
                    'This endpoint allows the user to create a document in their custom store.',
            },
        })
        .input(z.object({ items: MongoCustomDocumentValidator.array() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const count = await createCustomDocuments(ctx.user.did, input.items);

            if (count === 0) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to store item',
                });
            }

            return true;
        }),

    read: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/custom-storage/read',
                tags: ['Custom Storage'],
                summary: 'Read custom documents from storage',
                description:
                    'This endpoint allows the user to query for documents in their custom store.',
            },
        })
        .input(
            z
                .object({
                    query: z
                        .custom<Filter<MongoCustomDocumentType>>(z.record(z.any()).parse)
                        .optional(),
                    includeAssociatedDids: z.boolean().default(true),
                })
                .default({})
        )
        .output(MongoCustomDocumentValidator.array())
        .query(async ({ ctx, input }) => {
            const { query, includeAssociatedDids } = input;

            const results = await getCustomDocumentsByQuery(
                ctx.user.did,
                query,
                includeAssociatedDids
            );

            return results.map(_result => {
                const { did, ...result } = _result;

                return result;
            });
        }),

    count: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/custom-storage/count',
                tags: ['Custom Storage'],
                summary: 'Count custom documents from storage',
                description:
                    'This endpoint allows the user to count documents in their custom store.',
            },
        })
        .input(
            z
                .object({
                    query: z
                        .custom<Filter<MongoCustomDocumentType>>(z.record(z.any()).parse)
                        .optional(),
                    includeAssociatedDids: z.boolean().default(true),
                })
                .default({})
        )
        .output(z.number())
        .query(async ({ ctx, input }) => {
            const { query, includeAssociatedDids } = input;

            return countCustomDocumentsByQuery(ctx.user.did, query, includeAssociatedDids);
        }),

    update: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/custom-storage/update',
                tags: ['Custom Storage'],
                summary: 'Update custom documents in storage',
                description:
                    'This endpoint allows the user to update documents in their custom store.',
            },
        })
        .input(
            z.object({
                query: z
                    .custom<Filter<MongoCustomDocumentType>>(z.record(z.any()).parse)
                    .optional(),
                update: z
                    .custom<UpdateFilter<MongoCustomDocumentType>>(z.record(z.any()).parse)
                    .optional(), // For some reason, if this isn't optional, tRPC breaks with a cryptic, [object Object] error...
                includeAssociatedDids: z.boolean().default(true),
            })
        )
        .output(z.number())
        .mutation(async ({ ctx, input }) => {
            const { query, update, includeAssociatedDids } = input;

            return updateCustomDocumentsByQuery(ctx.user.did, query, update, includeAssociatedDids);
        }),

    delete: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/custom-storage/delete',
                tags: ['Custom Storage'],
                summary: 'Delete custom documents in storage',
                description:
                    'This endpoint allows the user to delete documents in their custom store.',
            },
        })
        .input(
            z
                .object({
                    query: z
                        .custom<Filter<MongoCustomDocumentType>>(z.record(z.any()).parse)
                        .optional(),
                    includeAssociatedDids: z.boolean().default(true),
                })
                .default({})
        )
        .output(z.number().or(z.literal(false)))
        .mutation(async ({ ctx, input }) => {
            const { query, includeAssociatedDids } = input;

            return deleteCustomDocumentsByQuery(ctx.user.did, query, includeAssociatedDids);
        }),
});

export type CustomStorageRouter = typeof customStorageRouter;

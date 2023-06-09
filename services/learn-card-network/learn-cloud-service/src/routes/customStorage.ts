import { calculateObjectSize } from 'bson';
import { Filter, ObjectId } from 'mongodb';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    JWEValidator,
    EncryptedRecord,
    EncryptedRecordValidator,
    PaginatedEncryptedRecordsValidator,
} from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';

import { t, didAndChallengeRoute } from '@routes';
import { MongoCustomDocumentType } from '@models';
import { createCustomDocument, createCustomDocuments } from '@accesslayer/custom-document/create';
import {
    countCustomDocumentsByQuery,
    getCustomDocumentsByQuery,
    getUsageForDid,
} from '@accesslayer/custom-document/read';
import { updateCustomDocumentsByQuery } from '@accesslayer/custom-document/update';
import { deleteCustomDocumentsByQuery } from '@accesslayer/custom-document/delete';
import { PaginationOptionsValidator } from 'types/mongo';
import { decryptObject, encryptObject } from '@helpers/encryption.helpers';
import { MAX_CUSTOM_STORAGE_SIZE } from 'src/constants/limits';

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
        .input(z.object({ item: EncryptedRecordValidator.or(JWEValidator) }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { item: _item } = input;

            let item: EncryptedRecord = (_item as any) || [];

            if (isEncrypted(item)) item = await decryptObject(item);

            const itemSize = calculateObjectSize(item);
            const currentUsage = await getUsageForDid(ctx.user.did);

            if (itemSize + currentUsage > MAX_CUSTOM_STORAGE_SIZE) {
                throw new TRPCError({
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'Cannot store more than 10 MB per did',
                });
            }

            const id = await createCustomDocument(ctx.user.did, item);

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
        .input(z.object({ items: EncryptedRecordValidator.array().or(JWEValidator) }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { items: _items } = input;

            let items: EncryptedRecord[] = (_items as any) || [];

            if (isEncrypted(items)) items = await decryptObject(items);

            const itemSize = calculateObjectSize(items);
            const currentUsage = await getUsageForDid(ctx.user.did);

            if (itemSize + currentUsage > MAX_CUSTOM_STORAGE_SIZE) {
                throw new TRPCError({
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'Cannot store more than 10 MB per did',
                });
            }

            const count = await createCustomDocuments(ctx.user.did, items);

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
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: z.record(z.any()).or(JWEValidator).optional(),
                encrypt: z.boolean().default(true),
                includeAssociatedDids: z.boolean().default(true),
            }).default({})
        )
        .output(PaginatedEncryptedRecordsValidator.or(JWEValidator))
        .query(async ({ ctx, input }) => {
            const { query: _query, includeAssociatedDids, limit, cursor, encrypt } = input;
            const {
                user: { did },
            } = ctx;

            let query: Record<string, any> = _query || {};

            if (isEncrypted(query)) query = await decryptObject(query);

            const rawResults = await getCustomDocumentsByQuery(
                ctx.user.did,
                query,
                cursor,
                limit + 1,
                includeAssociatedDids
            );

            const results = rawResults.map(_result => {
                const { did: _did, cursor: _cursor, modified, created, ...result } = _result;

                return {
                    ...result,
                    ...(result._id instanceof ObjectId ? { _id: result._id.toString() } : {}),
                };
            });

            const hasMore = results.length > limit;
            const newCursor = rawResults.at(hasMore ? -2 : -1)?.cursor.toString();

            const paginationResult = {
                records: results.slice(0, limit),
                hasMore,
                ...(newCursor ? { cursor: newCursor } : {}),
            };

            if (encrypt) return encryptObject(paginationResult, ctx.domain, [did]);

            return paginationResult;
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
                        .or(JWEValidator)
                        .optional(),
                    includeAssociatedDids: z.boolean().default(true),
                })
                .default({})
        )
        .output(z.number())
        .query(async ({ ctx, input }) => {
            const { query: _query, includeAssociatedDids } = input;

            let query: MongoCustomDocumentType = (_query as any) || {};

            if (isEncrypted(query)) query = await decryptObject(query);

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
                    .or(JWEValidator)
                    .optional(),
                update: EncryptedRecordValidator.partial().or(JWEValidator),
                includeAssociatedDids: z.boolean().default(true),
            })
        )
        .output(z.number())
        .mutation(async ({ ctx, input }) => {
            const { query: _query, update: _update, includeAssociatedDids } = input;

            let query: MongoCustomDocumentType = (_query as any) || {};
            let update: Partial<EncryptedRecord> = (_update as any) || {};

            if (isEncrypted(query)) query = await decryptObject(query);
            if (isEncrypted(update)) update = await decryptObject(update);

            const recordsToUpdate = await getCustomDocumentsByQuery(
                ctx.user.did,
                query,
                undefined,
                Infinity,
                false
            );

            const updatedRecords = recordsToUpdate.map(record => ({ ...record, ...update }));

            const updatedRecordsSize = calculateObjectSize(updatedRecords);

            if (updatedRecordsSize > MAX_CUSTOM_STORAGE_SIZE) {
                throw new TRPCError({
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'Cannot store more than 10 MB per did',
                });
            }

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
                        .or(JWEValidator)
                        .optional(),
                    includeAssociatedDids: z.boolean().default(true),
                })
                .default({})
        )
        .output(z.number().or(z.literal(false)))
        .mutation(async ({ ctx, input }) => {
            const { query: _query, includeAssociatedDids } = input;

            let query: MongoCustomDocumentType = (_query as any) || {};

            if (isEncrypted(query)) query = await decryptObject(query);

            return deleteCustomDocumentsByQuery(ctx.user.did, query, includeAssociatedDids);
        }),
});

export type CustomStorageRouter = typeof customStorageRouter;

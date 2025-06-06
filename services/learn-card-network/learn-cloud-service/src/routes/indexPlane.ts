import { z } from 'zod';
import { setTimeout } from 'timers/promises';
import { client } from '@mongo';

import {
    JWE,
    JWEValidator,
    EncryptedCredentialRecordValidator,
    EncryptedCredentialRecord,
    PaginatedEncryptedCredentialRecordsValidator,
} from '@learncard/types';

import { t, didAndChallengeRoute } from '@routes';
import { isEncrypted } from '@learncard/helpers';
import {
    countCredentialRecordsForDid,
    getCredentialRecordsForDid,
} from '@accesslayer/credential-record/read';
import {
    createCredentialRecord,
    createCredentialRecords,
} from '@accesslayer/credential-record/create';
import { TRPCError } from '@trpc/server';
import { updateCredentialRecord } from '@accesslayer/credential-record/update';
import {
    deleteCredentialRecordById,
    deleteCredentialRecordsForDid,
} from '@accesslayer/credential-record/delete';
import { decryptObject, encryptObject } from '@helpers/encryption.helpers';
import { PaginationOptionsValidator } from 'types/mongo';
import {
    flushIndexCacheForDid,
    getCachedIndexPageForDid,
    setCachedIndexPageForDid,
} from '@cache/indexPlane';
import { getAllDidsForDid } from '@accesslayer/user/read';

export const indexRouter = t.router({
    get: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/index/get',
                tags: ['Index'],
                summary: 'Get CredentialRecords index',
                description: 'This endpoint allows the user to query their CredentialRecords index',
            },
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: z.record(z.any()).or(JWEValidator).optional(),
                encrypt: z.boolean().default(true),
                sort: z.enum(['newestFirst', 'oldestFirst']).default('newestFirst'),
                includeAssociatedDids: z.boolean().default(true),
            }).default({})
        )
        .output(PaginatedEncryptedCredentialRecordsValidator.or(JWEValidator))
        .query(async ({ ctx, input }) => {
            const { query: _query, encrypt, limit, cursor, includeAssociatedDids, sort } = input;
            const {
                user: { did },
            } = ctx;

            let query: Record<string, any> = _query || {};

            if (isEncrypted(query)) query = await decryptObject(query as JWE);

            const cachedResponse = await getCachedIndexPageForDid(
                did,
                query,
                { limit, cursor, sort },
                includeAssociatedDids
            );

            if (cachedResponse) {
                return encrypt ? encryptObject(cachedResponse, ctx.domain, [did]) : cachedResponse;
            }

            const rawResults = await getCredentialRecordsForDid(
                did,
                query,
                sort,
                cursor,
                limit + 1,
                includeAssociatedDids
            );
            const results = rawResults.map(record => {
                const {
                    did: _did,
                    _id,
                    cursor: _cursor,
                    created: _created,
                    modified: _modified,
                    ...rest
                } = record;

                return { ...rest };
            });

            const hasMore = results.length > limit;
            const newCursor = rawResults.at(hasMore ? -2 : -1)?.cursor.toString();

            const paginationResult = {
                records: results.slice(0, limit),
                hasMore,
                ...(newCursor ? { cursor: newCursor } : {}),
            };

            await setCachedIndexPageForDid(
                did,
                query,
                { limit, cursor, sort },
                paginationResult,
                includeAssociatedDids
            );

            if (encrypt) return encryptObject(paginationResult, ctx.domain, [did]);

            return paginationResult;
        }),

    count: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/index/count',
                tags: ['Index'],
                summary: 'Count records in index for query',
                description:
                    'This endpoint allows the user to see how many records they have in their index for a query',
            },
        })
        .input(
            z
                .object({
                    query: z.record(z.any()).or(JWEValidator).optional(),
                    encrypt: z.boolean().default(true),
                    includeAssociatedDids: z.boolean().default(true),
                })
                .default({})
        )
        .output(z.number().int().positive().or(JWEValidator))
        .query(async ({ ctx, input }) => {
            const { query: _query, encrypt, includeAssociatedDids } = input;
            const {
                user: { did },
            } = ctx;

            let query: Record<string, any> = _query || {};

            if (isEncrypted(query)) query = await decryptObject(query as JWE);

            const count = await countCredentialRecordsForDid(did, query, includeAssociatedDids);

            if (encrypt) return encryptObject(count, ctx.domain, [did]);

            return count;
        }),

    add: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/index/add',
                tags: ['Index'],
                summary: 'Add to index',
                description: "This endpoint adds a CredentialRecord to the user's index",
            },
        })
        .input(
            z.object({
                record: EncryptedCredentialRecordValidator.omit({ id: true }).or(JWEValidator),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { record: _record } = input;
            const {
                user: { did },
            } = ctx;

            let record: EncryptedCredentialRecord = _record as any;

            if (isEncrypted(record)) record = await decryptObject(record as any);

            const success = Boolean(await createCredentialRecord(did, record));

            const flushTimeout = 23000; // 5 seconds timeout
            try {
                const timeoutPromise = setTimeout(flushTimeout, 'Timeout');
                const flushPromise = flushIndexCacheForDid(did);

                const flushResult = await Promise.race([flushPromise, timeoutPromise]);

                if (flushResult === 'Timeout') {
                    console.error(`flushIndexCacheForDid timed out after ${flushTimeout}ms`, did);
                }
            } catch (error) {
                console.error('Error flushing index cache:', error);
            }

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not create record',
                });
            }

            return true;
        }),
    addMany: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/index/addMany',
                tags: ['Index'],
                summary: 'Add many to index',
                description: "This endpoint adds multiple CredentialRecords to the user's index",
            },
        })
        .input(
            z.object({
                records: EncryptedCredentialRecordValidator.omit({ id: true })
                    .array()
                    .or(JWEValidator),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { records: _records } = input;
            const {
                user: { did },
            } = ctx;

            const records = isEncrypted(_records)
                ? await decryptObject<EncryptedCredentialRecord[]>(_records as JWE)
                : _records;

            await createCredentialRecords(did, records);

            await flushIndexCacheForDid(did);

            return true;
        }),
    update: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'PATCH',
                path: '/index/{id}',
                tags: ['Index'],
                summary: 'Update a CredentialRecord',
                description: 'This endpoint updates a CredentialRecord',
            },
        })
        .input(
            z.object({
                id: z.string(),
                updates: EncryptedCredentialRecordValidator.deepPartial().or(JWEValidator),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { id, updates: _updates } = input;
            const {
                user: { did },
            } = ctx;

            let updates: EncryptedCredentialRecord = _updates as any;

            if (isEncrypted(_updates)) {
                updates = await decryptObject(_updates as JWE);
            }

            const session = client.startSession();

            const dids = await session.withTransaction(async () => getAllDidsForDid(did, session));

            const success = Boolean(await updateCredentialRecord(dids, id, updates));
            await flushIndexCacheForDid(did);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not update record',
                });
            }

            return true;
        }),
    remove: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/index/{id}',
                tags: ['Index'],
                summary: 'Deletes a CredentialRecord',
                description: 'This endpoint deletes a CredentialRecord',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { id } = input;
            const {
                user: { did },
            } = ctx;

            const success = Boolean(await deleteCredentialRecordById(did, id));
            await flushIndexCacheForDid(did);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not delete record',
                });
            }

            return true;
        }),
    removeAll: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/index',
                tags: ['Index'],
                summary: 'Deletes all CredentialRecords',
                description: 'This endpoint deletes all CredentialRecords',
            },
        })
        .input(z.void())
        .output(z.boolean())
        .mutation(async ({ ctx }) => {
            const {
                user: { did },
            } = ctx;

            const success = Boolean(await deleteCredentialRecordsForDid(did));
            await flushIndexCacheForDid(did);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not delete record',
                });
            }

            return true;
        }),
});
export type IndexRouter = typeof indexRouter;

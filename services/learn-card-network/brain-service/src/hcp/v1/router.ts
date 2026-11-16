/**
 * HCP v1 transport. Thin: authenticate through the brain's DID-auth chain, build
 * the caller and deps, call the service, map domain errors to tRPC codes.
 *
 * Context operations use DID + challenge auth and accept callers without a profile
 * (agents). Governance operations need a profile; the service enforces that, so
 * the rule lives next to the rest of the policy.
 */
import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { openRoute, privateScopedRoute, t } from '@routes';

import { providerId } from './ports';
import {
    CreateEntryInputSchema,
    CreateGrantInputSchema,
    EntryViewSchema,
    ExportInputSchema,
    ExportResultSchema,
    GetEntryInputSchema,
    GetEntryResultSchema,
    GrantIdInputSchema,
    GrantSchema,
    ListAuditInputSchema,
    ListAuditResultSchema,
    ListGrantsInputSchema,
    MetaSchema,
    QueryInputSchema,
    QueryResultSchema,
    ReviseEntryInputSchema,
    WithdrawEntryInputSchema,
    WithdrawResultSchema,
} from './schemas';
import type { HcpV1Caller, HcpV1Deps } from './service/deps';
import { createEntry, getEntry, queryEntries, reviseEntry, withdrawEntry } from './service/entries';
import { HcpV1Error, type HcpV1ErrorType } from './service/errors';
import { exportContext, listAudit } from './service/governance';
import { createGrant, getGrant, listGrants, revokeGrant } from './service/grants';
import { hcpV1Meta } from './service/meta';
import { createStoreActivitySink, directWritePolicy } from './service/seams';
import { createNeo4jHcpV1Store } from './store/neo4j';

const store = createNeo4jHcpV1Store();
const activity = createStoreActivitySink(store);

const depsFor = (): HcpV1Deps => ({
    store,
    activity,
    writePolicy: directWritePolicy,
    providerId: providerId(),
    now: () => new Date(),
    newId: randomUUID,
});

const TRPC_CODES: Record<HcpV1ErrorType, TRPCError['code']> = {
    'malformed-request': 'BAD_REQUEST',
    'invalid-token': 'UNAUTHORIZED',
    'scope-denied': 'FORBIDDEN',
    'version-conflict': 'CONFLICT',
};

/** The one place v1 domain errors become transport errors. Message: `<hcp code>: <detail>`. */
export const toTRPCError = (error: HcpV1Error): TRPCError =>
    new TRPCError({
        code: TRPC_CODES[error.type],
        message: `${error.type}: ${error.message}`,
        cause: error,
    });

const mapDomainErrors = t.middleware(async ({ next }) => {
    const result = await next();
    if (!result.ok && result.error.cause instanceof HcpV1Error)
        throw toTRPCError(result.error.cause);
    return result;
});

const hcpRoute = privateScopedRoute.use(mapDomainErrors);

const callerOf = (user: { did: string; profile: { did: string } | null }): HcpV1Caller => ({
    did: user.did,
    subjectDid: user.profile?.did ?? null,
});

const TAGS = ['HCP v1'];
const READ = 'hcp:read';
const WRITE = 'hcp:write';

const entriesRouter = t.router({
    create: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/entries',
                tags: TAGS,
                summary: 'Create a context entry',
                description:
                    'HCP Create (Draft 3 §5.2.3). The Context Subject writes to their own context; a Context Client writes under `grantId` and receives a disclosure.',
            },
            requiredScope: WRITE,
        })
        .input(CreateEntryInputSchema)
        .output(EntryViewSchema)
        .mutation(({ ctx, input }) => createEntry(depsFor(), callerOf(ctx.user), input)),

    query: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/entries/query',
                tags: TAGS,
                summary: 'Query context entries',
                description:
                    'HCP Query (Draft 3 §5.2.1). Returns at most `maxEntries` (default 5, ceiling 20) active entries in the categories the grant reads for `purpose`, in lexical relevance order. Not paginated.',
            },
            requiredScope: READ,
        })
        .input(QueryInputSchema)
        .output(QueryResultSchema)
        .query(({ ctx, input }) => queryEntries(depsFor(), callerOf(ctx.user), input)),

    get: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/entries/get',
                tags: TAGS,
                summary: 'Get a context entry',
                description:
                    'HCP Get Entry (Draft 3 §5.2.2). A Context Client names the entry by `ref`; the Context Subject by `entryId`.',
            },
            requiredScope: READ,
        })
        .input(GetEntryInputSchema)
        .output(GetEntryResultSchema)
        .query(({ ctx, input }) => getEntry(depsFor(), callerOf(ctx.user), input)),

    revise: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/entries/revisions',
                tags: TAGS,
                summary: 'Revise a context entry',
                description:
                    'HCP Revise (Draft 3 §5.2.4). Appends a new immutable version. Fails with version-conflict (409) unless `expectedVersion` is the current version.',
            },
            requiredScope: WRITE,
        })
        .input(ReviseEntryInputSchema)
        .output(EntryViewSchema)
        .mutation(({ ctx, input }) => reviseEntry(depsFor(), callerOf(ctx.user), input)),

    withdraw: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/entries/withdraw',
                tags: TAGS,
                summary: 'Withdraw a context entry',
                description:
                    'HCP Withdraw (Draft 3 §5.2.5). Soft delete: hides the entry from Context Clients and keeps it for the Context Subject. Idempotent.',
            },
            requiredScope: WRITE,
        })
        .input(WithdrawEntryInputSchema)
        .output(WithdrawResultSchema)
        .mutation(({ ctx, input }) => withdrawEntry(depsFor(), callerOf(ctx.user), input)),
});

const grantsRouter = t.router({
    create: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/grants',
                tags: TAGS,
                summary: 'Issue a grant to a Context Client',
                description:
                    'Context Subject only. Grants a client DID actions on categories for named purposes. Temporary by default (4h, at most 24h).',
            },
            requiredScope: WRITE,
        })
        .input(CreateGrantInputSchema)
        .output(GrantSchema)
        .mutation(({ ctx, input }) => createGrant(depsFor(), callerOf(ctx.user), input)),

    list: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/hcp/v1/grants',
                tags: TAGS,
                summary: 'List grants',
                description:
                    'Context Subject only (Draft 3 §5.4). Filters by status; default active.',
            },
            requiredScope: READ,
        })
        .input(ListGrantsInputSchema)
        .output(z.array(GrantSchema))
        .query(({ ctx, input }) => listGrants(depsFor(), callerOf(ctx.user), input.status)),

    get: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/hcp/v1/grants/{grantId}',
                tags: TAGS,
                summary: 'Read a grant',
                description:
                    'The Context Subject reads any of their grants; a Context Client reads its own (Draft 3 §5.2.6).',
            },
            requiredScope: READ,
        })
        .input(GrantIdInputSchema)
        .output(GrantSchema)
        .query(({ ctx, input }) => getGrant(depsFor(), callerOf(ctx.user), input.grantId)),

    revoke: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/hcp/v1/grants/{grantId}',
                tags: TAGS,
                summary: 'Revoke a grant',
                description:
                    'The Context Subject revokes any of their grants; a Context Client relinquishes its own (Draft 3 §5.2.7, §6.2). Idempotent.',
            },
            requiredScope: WRITE,
        })
        .input(GrantIdInputSchema)
        .output(GrantSchema)
        .mutation(({ ctx, input }) => revokeGrant(depsFor(), callerOf(ctx.user), input.grantId)),
});

const auditRouter = t.router({
    list: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/audit',
                tags: TAGS,
                summary: 'Read the audit log',
                description:
                    'Context Subject only (Draft 3 §8.3). Lifecycle events, newest first, filtered before paging, with an opaque cursor.',
            },
            requiredScope: READ,
        })
        .input(ListAuditInputSchema)
        .output(ListAuditResultSchema)
        .query(({ ctx, input }) => listAudit(depsFor(), callerOf(ctx.user), input)),
});

export const hcpV1Router = t.router({
    meta: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/hcp/v1/meta',
                tags: TAGS,
                summary: 'HCP v1 discovery',
                description:
                    'Version, pinned spec commit, supported operations and categories. No authentication.',
            },
        })
        .input(z.void())
        .output(MetaSchema)
        .query(() => hcpV1Meta()),

    entries: entriesRouter,
    grants: grantsRouter,
    audit: auditRouter,

    export: hcpRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/hcp/v1/export',
                tags: TAGS,
                summary: 'Export context',
                description:
                    'Context Subject only (Draft 3 §5.4.1). Every held entry in every status unless `excludeDeleted`; superseded versions when `includeVersions`.',
            },
            requiredScope: READ,
        })
        .input(ExportInputSchema)
        .output(ExportResultSchema)
        .mutation(({ ctx, input }) => exportContext(depsFor(), callerOf(ctx.user), input)),
});

export type HcpV1Router = typeof hcpV1Router;

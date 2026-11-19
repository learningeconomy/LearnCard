/**
 * Draft 3 §10.3 MCP tools. Grant comes from the bearer (Unit 1); never from args.
 *
 * LC WritePolicy (canWrite→active else suggested) applies on create/revise via v1
 * seams — marked as an LC extension in the PR Decisions table (Q4).
 */
import { z } from 'zod';
import {
    defineMcpTool,
    jsonToolResponse,
    type McpToolDefinition,
    type McpToolResponse,
} from '@learncard/mcp';

import type { HcpV1Caller, HcpV1Deps } from '../v1/service/deps';
import {
    createEntry,
    getEntry,
    queryEntries,
    reviseEntry,
    withdrawEntry,
} from '../v1/service/entries';
import { requireHcpAuth, withTokenScopedGrant } from './auth-bridge';
import {
    coreErrorResult,
    fromHcpError,
    toCreateEntryInput,
    toGetEntryInput,
    toQueryInput,
    toReviseEntryInput,
    toWithdrawEntryInput,
    type CreateEntryToolArgs,
    type GetEntryToolArgs,
    type QueryToolArgs,
    type ReportSharingToolArgs,
    type ReviseEntryToolArgs,
    type WithdrawEntryToolArgs,
} from './map';

export type HcpMcpToolDeps = {
    hcp: HcpV1Deps;
};

const NOT_IMPLEMENTED_REPORT_SHARING =
    'hcp_reportSharing is not implemented in HCP v1; onward-sharing audit is planned (Draft 3 §5.2.8).';

const clientCaller = (did: string): HcpV1Caller => ({ did, subjectDid: null });

const run = async (
    deps: HcpMcpToolDeps,
    authInfo: Parameters<typeof requireHcpAuth>[0],
    fn: (scoped: HcpV1Deps, auth: ReturnType<typeof requireHcpAuth>) => Promise<unknown>
): Promise<McpToolResponse> => {
    try {
        const auth = requireHcpAuth(authInfo);
        const scoped = withTokenScopedGrant(deps.hcp, auth.grantId, auth.scopes);
        const result = await fn(scoped, auth);
        return jsonToolResponse(result as Record<string, unknown>);
    } catch (error) {
        try {
            return fromHcpError(error);
        } catch {
            return coreErrorResult('internal-error', 'Internal error');
        }
    }
};

const queryInputSchema = {
    query: z.string().min(1).max(2000),
    purpose: z.string().url(),
    categories: z.array(z.string()).optional(),
    purposeDescription: z.string().max(2000).optional(),
    maxEntries: z.number().int().min(1).max(20).optional(),
};

const getEntryInputSchema = {
    ref: z.string().min(1),
    purpose: z.string().url(),
    purposeDescription: z.string().max(2000).optional(),
    version: z.number().int().min(1).optional(),
};

const createEntryInputSchema = {
    categories: z.array(z.string()).min(1),
    content: z.string().min(1).max(20_000),
    declarationType: z.enum(['person-declared', 'model-inferred']),
    sourceContext: z.string().min(1).max(512),
    dimension: z.string().min(1).max(512).nullable().optional(),
    confidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
    assertedBy: z.string().min(1).optional(),
    basis: z
        .object({
            drawnFrom: z
                .array(z.enum(['conversation', 'document', 'observation', 'assessment', 'entries']))
                .optional(),
            task: z.string().max(2000).optional(),
            setting: z.string().max(2000).optional(),
            rationale: z.string().max(4000).optional(),
        })
        .optional(),
    permittedPurposes: z.array(z.string().url()).min(1).max(50).optional(),
};

const reviseEntryInputSchema = {
    ref: z.string().min(1),
    expectedVersion: z.number().int().min(1),
    content: z.string().min(1).max(20_000),
    reason: z.string().min(1).max(2000),
    declarationType: z.enum(['person-declared', 'model-inferred']).optional(),
    confidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
    assertedBy: z.string().min(1).optional(),
    sourceContext: z.string().min(1).max(512).optional(),
};

const withdrawEntryInputSchema = {
    ref: z.string().min(1),
    reason: z.string().min(1).max(2000),
};

const reportSharingInputSchema = {
    recipient: z.object({ domain: z.string().min(1), name: z.string().min(1) }),
    refs: z.array(z.string().min(1)).min(1),
    purpose: z.string().min(1),
    sharedAt: z.string().min(1),
};

export const createHcpMcpTools = (deps: HcpMcpToolDeps): McpToolDefinition[] => {
    const hcp_queryContext = defineMcpTool({
        name: 'hcp_queryContext',
        title: 'Query HCP context',
        description:
            "Retrieve minimal, relevant entries from the person's HCP instance for a stated purpose.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: queryInputSchema,
        handler: async (args, context) =>
            run(deps, context.authInfo, (scoped, auth) =>
                queryEntries(
                    scoped,
                    clientCaller(auth.did),
                    toQueryInput(args as QueryToolArgs, auth.grantId)
                )
            ),
    });

    const hcp_getEntry = defineMcpTool({
        name: 'hcp_getEntry',
        title: 'Get HCP entry',
        description:
            "Retrieve one entry from the person's HCP instance by identifier, for a stated purpose.",
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: getEntryInputSchema,
        handler: async (args, context) =>
            run(deps, context.authInfo, (scoped, auth) =>
                getEntry(
                    scoped,
                    clientCaller(auth.did),
                    toGetEntryInput(args as GetEntryToolArgs, auth.grantId)
                )
            ),
    });

    const hcp_createEntry = defineMcpTool({
        name: 'hcp_createEntry',
        title: 'Create HCP entry',
        description: "Add a new entry to the person's HCP instance.",
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
        inputSchema: createEntryInputSchema,
        handler: async (args, context) =>
            run(deps, context.authInfo, (scoped, auth) =>
                createEntry(
                    scoped,
                    clientCaller(auth.did),
                    toCreateEntryInput(args as CreateEntryToolArgs, auth.grantId, auth.subjectDid)
                )
            ),
    });

    const hcp_reviseEntry = defineMcpTool({
        name: 'hcp_reviseEntry',
        title: 'Revise HCP entry',
        description:
            'Revise an existing entry, creating a new version and preserving version history.',
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
        inputSchema: reviseEntryInputSchema,
        handler: async (args, context) =>
            run(deps, context.authInfo, (scoped, auth) =>
                reviseEntry(
                    scoped,
                    clientCaller(auth.did),
                    toReviseEntryInput(args as ReviseEntryToolArgs, auth.grantId)
                )
            ),
    });

    const hcp_withdrawEntry = defineMcpTool({
        name: 'hcp_withdrawEntry',
        title: 'Withdraw HCP entry',
        description: 'Withdraw an entry. Withdrawn entries are hidden from agents immediately.',
        annotations: {
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: withdrawEntryInputSchema,
        handler: async (args, context) =>
            run(deps, context.authInfo, (scoped, auth) =>
                withdrawEntry(
                    scoped,
                    clientCaller(auth.did),
                    toWithdrawEntryInput(args as WithdrawEntryToolArgs, auth.grantId)
                )
            ),
    });

    const hcp_reportSharing = defineMcpTool({
        name: 'hcp_reportSharing',
        title: 'Report onward sharing',
        description:
            "Report that you told another organization something from the person's context, as their grant allows. Every share must be reported.",
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
        inputSchema: reportSharingInputSchema,
        handler: async (args, context) => {
            // Auth still required so a naked call cannot probe the tool without a grant.
            try {
                requireHcpAuth(context.authInfo);
            } catch {
                return coreErrorResult('invalid-token', 'Bearer token required');
            }
            void (args as ReportSharingToolArgs);
            // Q3: expose with not-implemented error shape; do not omit the tool.
            return coreErrorResult('not-implemented', NOT_IMPLEMENTED_REPORT_SHARING);
        },
    });

    return [
        hcp_queryContext,
        hcp_getEntry,
        hcp_createEntry,
        hcp_reviseEntry,
        hcp_withdrawEntry,
        hcp_reportSharing,
    ];
};

export const HCP_MCP_TOOL_NAMES = [
    'hcp_queryContext',
    'hcp_getEntry',
    'hcp_createEntry',
    'hcp_reviseEntry',
    'hcp_withdrawEntry',
    'hcp_reportSharing',
] as const;

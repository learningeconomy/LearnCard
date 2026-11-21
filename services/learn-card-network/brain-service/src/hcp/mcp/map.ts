/**
 * Flat §10.3 tool args ↔ HCP v1 service inputs, and Core error tool results (§10.4).
 */
import type { McpToolResponse } from '@learncard/mcp';

import {
    GENERAL_CONTEXT_PROFILE,
    HCP_ENTRY_SCHEMA,
    type CreateEntryInput,
    type GetEntryInput,
    type QueryInput,
    type ReviseEntryInput,
    type WithdrawEntryInput,
} from '../v1/schemas';
import { HcpV1Error } from '../v1/service/errors';

export type CoreToolError = { type: string; detail: string };

export const coreErrorResult = (type: string, detail: string): McpToolResponse => {
    const structuredContent: CoreToolError = { type, detail };
    return {
        isError: true,
        structuredContent,
        content: [{ type: 'text', text: `${type}: ${detail}` }],
    };
};

export const fromHcpError = (error: unknown): McpToolResponse => {
    if (error instanceof HcpV1Error) {
        return coreErrorResult(error.type, error.message);
    }
    throw error;
};

export type QueryToolArgs = {
    query: string;
    purpose: string;
    categories?: string[];
    purposeDescription?: string;
    maxEntries?: number;
};

export const toQueryInput = (args: QueryToolArgs, grantId: string): QueryInput => ({
    grantId,
    query: args.query,
    purpose: args.purpose,
    ...(args.categories ? { categories: args.categories } : {}),
    ...(args.purposeDescription !== undefined
        ? { purposeDescription: args.purposeDescription }
        : {}),
    ...(args.maxEntries !== undefined ? { maxEntries: args.maxEntries } : {}),
});

export type GetEntryToolArgs = {
    ref: string;
    purpose: string;
    purposeDescription?: string;
    version?: number;
};

export const toGetEntryInput = (args: GetEntryToolArgs, grantId: string): GetEntryInput => ({
    grantId,
    ref: args.ref,
    purpose: args.purpose,
    ...(args.purposeDescription !== undefined
        ? { purposeDescription: args.purposeDescription }
        : {}),
    ...(args.version !== undefined ? { version: args.version } : {}),
});

export type CreateEntryToolArgs = {
    categories: string[];
    content: string;
    declarationType: 'person-declared' | 'model-inferred';
    sourceContext: string;
    dimension?: string | null;
    confidence?: 'high' | 'medium' | 'low' | null;
    assertedBy?: string;
    basis?: NonNullable<CreateEntryInput['assertion']['basis']>;
    permittedPurposes?: string[];
};

export const toCreateEntryInput = (
    args: CreateEntryToolArgs,
    grantId: string,
    subjectDid: string
): CreateEntryInput => {
    const confidence =
        args.declarationType === 'model-inferred'
            ? (args.confidence ?? undefined)
            : args.confidence === null
              ? null
              : undefined;

    return {
        grantId,
        schema: HCP_ENTRY_SCHEMA,
        subject: { id: subjectDid },
        content: { profile: GENERAL_CONTEXT_PROFILE, value: args.content },
        classification: {
            categories: args.categories,
            ...(args.dimension !== undefined ? { dimension: args.dimension } : {}),
        },
        assertion: {
            declarationType: args.declarationType,
            ...(confidence !== undefined ? { confidence } : {}),
            ...(args.basis ? { basis: args.basis } : {}),
            ...(args.permittedPurposes ? { permittedPurposes: args.permittedPurposes } : {}),
        },
        record: {
            provenance: {
                source: args.sourceContext,
                ...(args.assertedBy ? { assertedBy: { id: args.assertedBy } } : {}),
            },
        },
    };
};

export type ReviseEntryToolArgs = {
    ref: string;
    expectedVersion: number;
    content: string;
    reason: string;
    declarationType?: 'person-declared' | 'model-inferred';
    confidence?: 'high' | 'medium' | 'low' | null;
    assertedBy?: string;
    sourceContext?: string;
};

export const toReviseEntryInput = (
    args: ReviseEntryToolArgs,
    grantId: string
): ReviseEntryInput => ({
    grantId,
    ref: args.ref,
    expectedVersion: args.expectedVersion,
    content: { profile: GENERAL_CONTEXT_PROFILE, value: args.content },
    reason: args.reason,
    ...(args.declarationType !== undefined || args.confidence !== undefined
        ? {
              assertion: {
                  ...(args.declarationType !== undefined
                      ? { declarationType: args.declarationType }
                      : {}),
                  ...(args.confidence !== undefined ? { confidence: args.confidence } : {}),
              },
          }
        : {}),
    record: {
        provenance: {
            source: args.sourceContext ?? 'mcp-revise',
            ...(args.assertedBy ? { assertedBy: { id: args.assertedBy } } : {}),
        },
    },
});

export type WithdrawEntryToolArgs = { ref: string; reason: string };

export const toWithdrawEntryInput = (
    args: WithdrawEntryToolArgs,
    grantId: string
): WithdrawEntryInput => ({
    grantId,
    ref: args.ref,
    reason: args.reason,
});

export type ReportSharingToolArgs = {
    recipient: { domain: string; name: string };
    refs: string[];
    purpose: string;
    sharedAt: string;
};

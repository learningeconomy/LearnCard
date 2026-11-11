import * as Sentry from '@sentry/node';
import { z } from 'zod';
import {
    defineMcpTool,
    getAuthenticatedDid,
    jsonToolResponse,
    McpToolError,
    type McpToolContext,
} from '@learncard/mcp';
import { getLatestUserSummary, getAnswerAboutUser, saveSessionSummary } from './controllers';
import { runMcpOwnerOperation } from './ownerOperation';
import { logSafeEvent } from '../logging';
import { AiConsentError } from '../learncard/consent';
import { classifyToolFailure, unwrapToolFailure, type McpToolName } from './tool-failure';

const requireDid = (context: McpToolContext): string => {
    const did = getAuthenticatedDid(context);
    if (!did) {
        logSafeEvent('warn', 'auth_verification_failed');
        throw new McpToolError(
            'unauthorized',
            'Unauthorized: No DID found in authentication token'
        );
    }
    return did;
};

const CONSENT_REQUIRED_MESSAGE = 'Active LearnCard AI consent is required';

export const reportToolFailure = (tool: McpToolName, error: unknown): void => {
    const tags = { tool, ...classifyToolFailure(error) };
    const sentryTags = Object.fromEntries(
        Object.entries({
            tool: tags.tool,
            error_name: tags.error_name,
            error_code: tags.error_code,
            cause_name: tags.cause_name,
            cause_code: tags.cause_code,
            cause_dependency: tags.cause_dependency,
            stage: tags.stage,
            verify_failure_kind: tags.verify_failure_kind,
        }).filter(([, value]) => value !== undefined)
    );
    const extra = {
        ...(tags.verify_errors ? { mcpVerifyErrors: tags.verify_errors } : {}),
        ...(tags.verify_warnings ? { mcpVerifyWarnings: tags.verify_warnings } : {}),
        ...(tags.verify_checks ? { mcpVerifyChecks: tags.verify_checks } : {}),
        ...(tags.skip_counts ? { mcpSkipCounts: tags.skip_counts } : {}),
    };
    Sentry.captureMessage('backend_operation_failed', {
        level: 'error',
        tags: sentryTags,
        ...(Object.keys(extra).length > 0 ? { extra } : {}),
    });
    logSafeEvent('error', 'request_failed', {
        mcpTool: tool,
        mcpErrorName: tags.error_name,
        mcpErrorCode: tags.error_code,
        mcpCauseName: tags.cause_name,
        mcpCauseCode: tags.cause_code,
        mcpCauseDependency: tags.cause_dependency,
        mcpStage: tags.stage,
        mcpVerifyFailureKind: tags.verify_failure_kind,
        mcpVerifyErrors: tags.verify_errors,
        mcpVerifyWarnings: tags.verify_warnings,
        mcpVerifyChecks: tags.verify_checks,
        mcpSkipCounts: tags.skip_counts,
    });
};

const isConsentFailure = (error: unknown): boolean =>
    unwrapToolFailure(error) instanceof AiConsentError;

export const getUserContextTool = defineMcpTool({
    name: 'get_user_context',
    title: 'Get User Context Tool',
    description:
        'It is recommended to call this tool before teaching the user something. Helps tailor explanations and teaching style for better learning outcomes.',
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    inputSchema: {},
    outputSchema: { general_summary: z.string().nullable() },
    handler: async (_args, context) => {
        const did = requireDid(context);
        try {
            const general_summary = await runMcpOwnerOperation(did, () =>
                getLatestUserSummary(did)
            );
            return jsonToolResponse({ general_summary });
        } catch (error) {
            reportToolFailure('get_user_context', error);
            return jsonToolResponse({
                general_summary: isConsentFailure(error)
                    ? CONSENT_REQUIRED_MESSAGE
                    : 'Unable to retrieve user context',
            });
        }
    },
});

export const getAnswerAboutUserTool = defineMcpTool({
    name: 'get_answer_about_user',
    title: 'Ask Learning Question',
    description:
        "It is recommended to call this tool frequently during teaching to ask specific questions about the user's knowledge, skills, and experience.",
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
    inputSchema: { question: z.string() },
    handler: async (args, context) => {
        const { question } = z.object({ question: z.string() }).parse(args);
        const did = requireDid(context);
        try {
            const answer = await runMcpOwnerOperation(did, () => getAnswerAboutUser(did, question));
            return jsonToolResponse({ answer });
        } catch (error) {
            reportToolFailure('get_answer_about_user', error);
            if (isConsentFailure(error)) {
                throw new McpToolError('forbidden', CONSENT_REQUIRED_MESSAGE);
            }
            throw new McpToolError('internal_error', 'Unable to answer learning question');
        }
    },
});

export const saveSessionSummaryTool = defineMcpTool({
    name: 'save_session_summary',
    title: 'Save Session Summary',
    description:
        'Save a summary at the end of a learning session to track progress. Share the returned sessions link with the learner; they can sign in and choose their session for review and assessment.',
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
    },
    inputSchema: {
        summary: z
            .string()
            .describe(
                'A summary of the learning session including topics covered and insights gained'
            ),
    },
    outputSchema: {
        success: z.boolean(),
        message: z.string(),
        learnCardLink: z.string().optional(),
    },
    handler: async (args, context) => {
        const { summary } = z.object({ summary: z.string() }).parse(args);
        const did = requireDid(context);
        try {
            const threadId = `session:${Date.now()}:${did.slice(-8)}`;
            await runMcpOwnerOperation(did, () => saveSessionSummary(did, threadId, { summary }));
            return jsonToolResponse({
                success: true,
                message: 'Session summary saved successfully',
                // External models must not receive the underlying credential/storage IDs.
                learnCardLink: 'https://learncard.app/ai/sessions',
            });
        } catch (error) {
            reportToolFailure('save_session_summary', error);
            return jsonToolResponse({
                success: false,
                message: isConsentFailure(error)
                    ? CONSENT_REQUIRED_MESSAGE
                    : 'Unable to save session summary',
            });
        }
    },
});

export const aiPassportMcpTools = [
    getUserContextTool,
    getAnswerAboutUserTool,
    saveSessionSummaryTool,
];

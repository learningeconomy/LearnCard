import * as Sentry from '@sentry/node';
import { z } from 'zod';
import {
    defineMcpTool,
    getAuthenticatedDid,
    jsonToolResponse,
    type McpToolContext,
} from '@learncard/mcp';
import { getLatestUserSummary, getAnswerAboutUser, saveSessionSummary } from './controllers';
import { runMcpOwnerOperation } from './ownerOperation';
import { logSafeEvent } from '../logging';

const requireDid = (context: McpToolContext): string => {
    const did = getAuthenticatedDid(context);
    if (!did) {
        logSafeEvent('warn', 'auth_verification_failed');
        throw new Error('Unauthorized: No DID found in authentication token');
    }
    return did;
};

const reportToolFailure = (tool: string) => {
    Sentry.captureMessage('backend_operation_failed', { level: 'error', tags: { tool } });
    logSafeEvent('error', 'request_failed');
};

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
        } catch {
            reportToolFailure('get_user_context');
            return jsonToolResponse({ general_summary: 'Unable to retrieve user context' });
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
        } catch {
            reportToolFailure('get_answer_about_user');
            throw new Error('Unable to answer learning question');
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
        } catch {
            reportToolFailure('save_session_summary');
            return jsonToolResponse({ success: false, message: 'Unable to save session summary' });
        }
    },
});

export const aiPassportMcpTools = [
    getUserContextTool,
    getAnswerAboutUserTool,
    saveSessionSummaryTool,
];

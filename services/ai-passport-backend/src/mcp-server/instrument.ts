import * as Sentry from '@sentry/node';
import {
    MCP_FAILURE_STAGES,
    MCP_TOOLS,
    sanitizeDiagnosticToken,
    type McpFailureStage,
    type McpToolName,
} from './tool-failure';

const isMcpTool = (value: unknown): value is McpToolName =>
    typeof value === 'string' && (MCP_TOOLS as readonly string[]).includes(value);

const isMcpStage = (value: unknown): value is McpFailureStage =>
    typeof value === 'string' && (MCP_FAILURE_STAGES as readonly string[]).includes(value);

export const pickAllowlistedMcpFailureTags = (
    tags: Record<string, unknown> | undefined
): Record<string, string> | undefined => {
    if (!tags) return undefined;
    const allowlisted: Record<string, string> = {};
    if (isMcpTool(tags.tool)) allowlisted.tool = tags.tool;
    const errorName = sanitizeDiagnosticToken(tags.error_name);
    if (errorName) allowlisted.error_name = errorName;
    const errorCode = sanitizeDiagnosticToken(tags.error_code);
    if (errorCode) allowlisted.error_code = errorCode;
    if (isMcpStage(tags.stage)) allowlisted.stage = tags.stage;
    return Object.keys(allowlisted).length > 0 ? allowlisted : undefined;
};

export const scrubMcpSentryEvent = (
    event: Sentry.ErrorEvent,
    hint: Sentry.EventHint
): Sentry.ErrorEvent => {
    // Rebuild, never redact in place: unknown future SDK fields, exception
    // messages/stacks, request data, users, extras and attachments stay local.
    hint.attachments = [];
    const tags = pickAllowlistedMcpFailureTags(event.tags as Record<string, unknown> | undefined);
    return {
        type: undefined,
        ...(typeof event.event_id === 'string' && /^[a-f0-9]{32}$/.test(event.event_id)
            ? { event_id: event.event_id }
            : {}),
        level: 'error',
        platform: 'node',
        message: 'backend_operation_failed',
        ...(tags ? { tags } : {}),
    };
};

export const initializeInstrumentation = (): void => {
    if (!process.env.SENTRY_DSN) return;

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        sendDefaultPii: false,
        defaultIntegrations: false,
        maxBreadcrumbs: 0,
        tracesSampleRate: 0,
        beforeBreadcrumb: () => null,
        beforeSendTransaction: () => null,
        beforeSend: (event, hint) => scrubMcpSentryEvent(event, hint),
    });
};

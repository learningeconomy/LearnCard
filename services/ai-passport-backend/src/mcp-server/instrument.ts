import * as Sentry from '@sentry/node';
import {
    MCP_CAUSE_DEPENDENCIES,
    MCP_FAILURE_STAGES,
    MCP_TOOLS,
    sanitizeDiagnosticToken,
    type McpCauseDependency,
    type McpFailureStage,
    type McpToolName,
} from './tool-failure';
import {
    sanitizeSkipCounts,
    sanitizeVerifyChecks,
    sanitizeVerifyDiagnosticList,
    VERIFY_FAILURE_KINDS,
} from '../credentials/verify-diagnostics';

const isMcpTool = (value: unknown): value is McpToolName =>
    typeof value === 'string' && (MCP_TOOLS as readonly string[]).includes(value);

const isMcpStage = (value: unknown): value is McpFailureStage =>
    typeof value === 'string' && (MCP_FAILURE_STAGES as readonly string[]).includes(value);

const isMcpCauseDependency = (value: unknown): value is McpCauseDependency =>
    typeof value === 'string' && (MCP_CAUSE_DEPENDENCIES as readonly string[]).includes(value);

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
    const causeName = sanitizeDiagnosticToken(tags.cause_name);
    if (causeName) allowlisted.cause_name = causeName;
    const causeCode = sanitizeDiagnosticToken(tags.cause_code);
    if (causeCode) allowlisted.cause_code = causeCode;
    if (isMcpCauseDependency(tags.cause_dependency))
        allowlisted.cause_dependency = tags.cause_dependency;
    if (isMcpStage(tags.stage)) allowlisted.stage = tags.stage;
    if (
        typeof tags.verify_failure_kind === 'string' &&
        (VERIFY_FAILURE_KINDS as readonly string[]).includes(tags.verify_failure_kind)
    )
        allowlisted.verify_failure_kind = tags.verify_failure_kind;
    return Object.keys(allowlisted).length > 0 ? allowlisted : undefined;
};

const pickSanitizedVerifyExtra = (extra: unknown): Record<string, unknown> | undefined => {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return undefined;
    const record = extra as Record<string, unknown>;
    const picked: Record<string, unknown> = {};
    const errors = sanitizeVerifyDiagnosticList(record.mcpVerifyErrors);
    if (errors.length) picked.mcpVerifyErrors = errors;
    const warnings = sanitizeVerifyDiagnosticList(record.mcpVerifyWarnings);
    if (warnings.length) picked.mcpVerifyWarnings = warnings;
    const checks = sanitizeVerifyChecks(record.mcpVerifyChecks);
    if (checks.length) picked.mcpVerifyChecks = checks;
    const skipCounts = sanitizeSkipCounts(record.mcpSkipCounts);
    if (skipCounts) picked.mcpSkipCounts = skipCounts;
    return Object.keys(picked).length > 0 ? picked : undefined;
};

export const scrubMcpSentryEvent = (
    event: Sentry.ErrorEvent,
    hint: Sentry.EventHint
): Sentry.ErrorEvent => {
    // Rebuild, never redact in place: unknown future SDK fields, exception
    // messages/stacks, request data, users, extras and attachments stay local.
    hint.attachments = [];
    const tags = pickAllowlistedMcpFailureTags(event.tags as Record<string, unknown> | undefined);
    const extra = pickSanitizedVerifyExtra(event.extra);
    return {
        type: undefined,
        ...(typeof event.event_id === 'string' && /^[a-f0-9]{32}$/.test(event.event_id)
            ? { event_id: event.event_id }
            : {}),
        level: 'error',
        platform: 'node',
        message: 'backend_operation_failed',
        ...(tags ? { tags } : {}),
        ...(extra ? { extra } : {}),
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

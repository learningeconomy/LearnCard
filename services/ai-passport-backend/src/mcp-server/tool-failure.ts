import { ZodError } from 'zod';
import { getMcpProgress } from '../diagnostics/mcp-progress';
import { logSafeEvent } from '../logging';
import { credentialFailureCodeOf } from '../credentials/batch';
import {
    readCauseStep,
    readVerifyFailureDiagnostics,
    sanitizeCauseFrame,
    sanitizeCauseMessage,
    type CauseStep,
    type VerifyFailureKind,
} from '../credentials/verify-diagnostics';

export const MCP_TOOLS = [
    'get_user_context',
    'get_answer_about_user',
    'save_session_summary',
] as const;
export type McpToolName = (typeof MCP_TOOLS)[number];

export const MCP_FAILURE_STAGES = ['consent', 'learnercontext', 'pseudonymize', 'llm'] as const;
export type McpFailureStage = (typeof MCP_FAILURE_STAGES)[number];

const SAFE_TOKEN = /^[A-Za-z0-9_.-]{1,64}$/;

export const sanitizeDiagnosticToken = (value: unknown): string | undefined => {
    if (typeof value !== 'string' && typeof value !== 'number') return undefined;
    const raw = String(value);
    // Colon-bearing values include DIDs (`did:example:...`); drop them instead of
    // stripping punctuation and keeping the rest.
    if (/did:/i.test(raw)) return undefined;
    const cleaned = raw.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 64);
    return SAFE_TOKEN.test(cleaned) ? cleaned : undefined;
};

const STAGE_KEY = Symbol.for('mcp.toolFailureStage');

export class StagedToolError extends Error {
    constructor(
        readonly stage: McpFailureStage,
        readonly cause: unknown
    ) {
        super('staged_tool_error');
        this.name = 'StagedToolError';
    }
}

const readAttachedStage = (error: unknown): McpFailureStage | undefined => {
    if (!error || typeof error !== 'object' || !(STAGE_KEY in error)) return undefined;
    const stage = (error as Record<typeof STAGE_KEY, unknown>)[STAGE_KEY];
    return (MCP_FAILURE_STAGES as readonly string[]).includes(stage as string)
        ? (stage as McpFailureStage)
        : undefined;
};

export const attachToolStage = (error: unknown, stage: McpFailureStage): unknown => {
    if (error instanceof StagedToolError) return error;
    const existing = readAttachedStage(error);
    if (existing) return error;
    if (error && typeof error === 'object') {
        try {
            Object.defineProperty(error, STAGE_KEY, {
                value: stage,
                enumerable: false,
                configurable: true,
            });
            return error;
        } catch {
            // Non-extensible errors still need a wrapper so the stage is not lost.
        }
    }
    return new StagedToolError(stage, error);
};

export const withToolStage = async <T>(
    stage: McpFailureStage,
    operation: () => Promise<T>
): Promise<T> => {
    const progress = getMcpProgress();
    if (progress)
        logSafeEvent('info', 'mcp_tool_progress', {
            mcpTool: progress.tool,
            mcpRequestId: progress.requestId,
            mcpStage: stage,
        });
    try {
        return await operation();
    } catch (error) {
        throw attachToolStage(error, stage);
    }
};

export const MCP_CAUSE_DEPENDENCIES = ['wallet', 'consent', 'verify', 'credential_store'] as const;
export type McpCauseDependency = (typeof MCP_CAUSE_DEPENDENCIES)[number];

export type ToolFailureTags = {
    error_name?: string;
    error_code?: string;
    cause_name?: string;
    cause_code?: string;
    cause_dependency?: McpCauseDependency;
    stage?: McpFailureStage;
    verify_failure_kind?: VerifyFailureKind;
    verify_errors?: string[];
    verify_warnings?: string[];
    verify_checks?: string[];
    skip_counts?: Record<string, number>;
    cause_step?: CauseStep;
    cause_message?: string;
    cause_frame?: string;
};

const unwrapStaged = (error: unknown): { inner: unknown; stage?: McpFailureStage } => {
    if (error instanceof StagedToolError) {
        const nested = unwrapStaged(error.cause);
        return { inner: nested.inner, stage: nested.stage ?? error.stage };
    }
    return { inner: error };
};

export const unwrapToolFailure = (error: unknown): unknown => unwrapStaged(error).inner;

const readOwnString = (error: object, key: string): string | undefined => {
    if (!Object.prototype.hasOwnProperty.call(error, key)) return undefined;
    const value = (error as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : undefined;
};

const readOwnToken = (error: object, key: string): string | undefined => {
    if (!Object.prototype.hasOwnProperty.call(error, key)) return undefined;
    const value = (error as Record<string, unknown>)[key];
    if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)))
        return sanitizeDiagnosticToken(value);
    return undefined;
};

const classifyErrorName = (error: object): string | undefined => {
    const named = readOwnString(error, 'name') ?? (error instanceof Error ? error.name : undefined);
    if (named && named !== 'Error' && named !== 'Object') return sanitizeDiagnosticToken(named);
    const constructed = error.constructor?.name;
    return constructed && constructed !== 'Object' && constructed !== 'Error'
        ? sanitizeDiagnosticToken(constructed)
        : sanitizeDiagnosticToken(named);
};

const CONSENT_REASONS = new Set([
    'missing',
    'revoked',
    'expired',
    'guardian_required',
    'unavailable',
]);

const classifyErrorCode = (error: object): string | undefined => {
    const named = (error instanceof Error ? error.name : undefined) ?? readOwnString(error, 'name');
    if (named === 'AiConsentError') {
        const reason = readOwnString(error, 'reason');
        if (reason && CONSENT_REASONS.has(reason)) return reason;
    }
    if (named === 'LearnerContextPromptError') {
        const code = readOwnString(error, 'code');
        if (code) return sanitizeDiagnosticToken(code);
    }
    if (named === 'CredentialVerificationUnavailableError') {
        const subreason = readOwnString(error, 'verificationSubreason');
        if (subreason) return sanitizeDiagnosticToken(subreason);
    }
    if (named === 'AbortError') return 'timeout';
    if (error instanceof ZodError) {
        const path = error.issues
            .map(issue => issue.path.map(String).join('.'))
            .filter(Boolean)
            .slice(0, 3)
            .join(',');
        return sanitizeDiagnosticToken(path);
    }
    const ownCode =
        readOwnToken(error, 'code') ??
        readOwnToken(error, 'Code') ??
        readOwnToken(error, 'statusCode');
    if (ownCode) return ownCode;
    const batchCode = credentialFailureCodeOf(error);
    return batchCode && batchCode !== 'unknown' ? sanitizeDiagnosticToken(batchCode) : undefined;
};

const MAX_CAUSE_DEPTH = 5;

const collectCauseChain = (error: object): object[] => {
    const chain: object[] = [error];
    let current: unknown = error;
    for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
        if (!current || typeof current !== 'object' || !('cause' in current)) break;
        const next = (current as { cause?: unknown }).cause;
        if (!next || typeof next !== 'object' || chain.includes(next)) break;
        chain.push(next);
        current = next;
    }
    return chain;
};

const pickInnermostCauseTags = (
    error: object
): Pick<ToolFailureTags, 'cause_name' | 'cause_code'> => {
    const picked: Pick<ToolFailureTags, 'cause_name' | 'cause_code'> = {};
    const chain = collectCauseChain(error);
    for (const frame of chain.slice(1)) {
        const name = classifyErrorName(frame);
        const code = classifyErrorCode(frame);
        const usefulName = name && name !== 'Error' ? name : undefined;
        const usefulCode = code && code !== 'unknown' ? code : undefined;
        if (usefulName) picked.cause_name = usefulName;
        if (usefulCode) picked.cause_code = usefulCode;
    }
    if (chain.length > 1) {
        if (!picked.cause_name) picked.cause_name = 'Error';
        if (!picked.cause_code) picked.cause_code = 'unknown';
    }
    return picked;
};

const readCauseDependency = (error: object): McpCauseDependency | undefined => {
    const value = readOwnString(error, 'dependency');
    return value && (MCP_CAUSE_DEPENDENCIES as readonly string[]).includes(value)
        ? (value as McpCauseDependency)
        : undefined;
};

const pickDeepestError = (error: object): Error | undefined => {
    const chain = collectCauseChain(error);
    for (let index = chain.length - 1; index >= 1; index -= 1) {
        const frame = chain[index];
        if (frame instanceof Error) return frame;
    }
    return undefined;
};

export const classifyToolFailure = (error: unknown): ToolFailureTags => {
    const { inner, stage: wrappedStage } = unwrapStaged(error);
    const stage = readAttachedStage(inner) ?? readAttachedStage(error) ?? wrappedStage;
    const tags: ToolFailureTags = {};
    if (stage) tags.stage = stage;
    if (inner && typeof inner === 'object') {
        const name = classifyErrorName(inner);
        if (name) tags.error_name = name;
        const code = classifyErrorCode(inner);
        if (code) tags.error_code = code;
        const dependency = readCauseDependency(inner);
        if (dependency) tags.cause_dependency = dependency;
        Object.assign(tags, pickInnermostCauseTags(inner));
        const diagnostics = readVerifyFailureDiagnostics(inner);
        if (diagnostics) {
            tags.verify_failure_kind = diagnostics.kind;
            if (diagnostics.errors?.length) tags.verify_errors = diagnostics.errors;
            if (diagnostics.warnings?.length) tags.verify_warnings = diagnostics.warnings;
            if (diagnostics.checks?.length) tags.verify_checks = diagnostics.checks;
            if (diagnostics.skipCounts) tags.skip_counts = diagnostics.skipCounts;
        }
        const step = readCauseStep(inner);
        if (step) tags.cause_step = step;
        const causeError = pickDeepestError(inner);
        const message = sanitizeCauseMessage(causeError?.message);
        if (message) tags.cause_message = message;
        const frame = sanitizeCauseFrame(causeError);
        if (frame) tags.cause_frame = frame;
    }
    return tags;
};

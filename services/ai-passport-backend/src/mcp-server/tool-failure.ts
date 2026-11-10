import { ZodError } from 'zod';

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

export class StagedToolError extends Error {
    constructor(
        readonly stage: McpFailureStage,
        readonly cause: unknown
    ) {
        super('staged_tool_error');
        this.name = 'StagedToolError';
    }
}

export const withToolStage = async <T>(
    stage: McpFailureStage,
    operation: () => Promise<T>
): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof StagedToolError) throw error;
        throw new StagedToolError(stage, error);
    }
};

export type ToolFailureTags = {
    error_name?: string;
    error_code?: string;
    stage?: McpFailureStage;
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
    if (error instanceof ZodError) {
        const path = error.issues
            .map(issue => issue.path.map(String).join('.'))
            .filter(Boolean)
            .slice(0, 3)
            .join(',');
        return sanitizeDiagnosticToken(path);
    }
    return sanitizeDiagnosticToken(readOwnString(error, 'code') ?? readOwnString(error, 'Code'));
};

export const classifyToolFailure = (error: unknown): ToolFailureTags => {
    const { inner, stage } = unwrapStaged(error);
    const tags: ToolFailureTags = {};
    if (stage) tags.stage = stage;
    if (inner && typeof inner === 'object') {
        const name = classifyErrorName(inner);
        if (name) tags.error_name = name;
        const code = classifyErrorCode(inner);
        if (code) tags.error_code = code;
    }
    return tags;
};

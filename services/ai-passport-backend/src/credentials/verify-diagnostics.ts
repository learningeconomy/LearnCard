import { getMcpProgress } from '../diagnostics/mcp-progress';
import {
    SOURCE_CLEANUP_BUSY_MESSAGE,
    SOURCE_CLEANUP_LEASE_EXPIRED_MESSAGE,
    SOURCE_CLEANUP_PENDING_INGEST_MESSAGE,
    SOURCE_CLEANUP_PENDING_MESSAGE,
    SOURCE_CLEANUP_SCOPE_CHANGED_MESSAGE,
} from '../db/source-cleanup';

const MAX_ENTRIES = 5;
const DIAGNOSTICS_KEY = Symbol.for('mcp.verifyDiagnostics');

export const VERIFY_FAILURE_KINDS = [
    'verify_errors',
    'read_empty',
    'read_unauthorized',
    'read_failed',
    'all_skipped',
    'projection_failed',
] as const;
export type VerifyFailureKind = (typeof VERIFY_FAILURE_KINDS)[number];

export const SAFE_VERIFY_CHECKS = [
    'proof',
    'credentialStatus',
    'status',
    'credentialSchema',
] as const;
export type SafeVerifyCheck = (typeof SAFE_VERIFY_CHECKS)[number];

export type VerifyFailureDiagnostics = {
    kind: VerifyFailureKind;
    checks?: SafeVerifyCheck[];
    errors?: string[];
    warnings?: string[];
    skipCounts?: Record<string, number>;
};

export type VerifyFailureDiagnosticsInput = {
    kind: VerifyFailureKind;
    checks?: readonly string[];
    errors?: readonly unknown[];
    warnings?: readonly unknown[];
    skipCounts?: Record<string, number>;
};

const isVerifyFailureKind = (value: unknown): value is VerifyFailureKind =>
    typeof value === 'string' && (VERIFY_FAILURE_KINDS as readonly string[]).includes(value);

const isSafeVerifyCheck = (value: unknown): value is SafeVerifyCheck =>
    typeof value === 'string' && (SAFE_VERIFY_CHECKS as readonly string[]).includes(value);

export const SAFE_CAUSE_MESSAGE_CODES = [
    'unrecognized',
    'source_cleanup_busy',
    'source_cleanup_lease_expired',
    'source_cleanup_pending',
    'source_cleanup_pending_ingest',
    'source_cleanup_scope_changed',
    'invalid_signature',
    'verification_equation_unsatisfied',
    'credential_revoked',
    'consent_changed',
] as const;
export type SafeCauseMessageCode = (typeof SAFE_CAUSE_MESSAGE_CODES)[number];

const normalizeDiagnosticText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const CAUSE_MESSAGE_BY_TEXT = new Map<string, SafeCauseMessageCode>(
    (
        [
            [SOURCE_CLEANUP_BUSY_MESSAGE, 'source_cleanup_busy'],
            [SOURCE_CLEANUP_LEASE_EXPIRED_MESSAGE, 'source_cleanup_lease_expired'],
            [SOURCE_CLEANUP_PENDING_MESSAGE, 'source_cleanup_pending'],
            [SOURCE_CLEANUP_PENDING_INGEST_MESSAGE, 'source_cleanup_pending_ingest'],
            [SOURCE_CLEANUP_SCOPE_CHANGED_MESSAGE, 'source_cleanup_scope_changed'],
            ['Consent changed during this operation', 'consent_changed'],
            ['Invalid signature', 'invalid_signature'],
            [
                'signature error: Verification equation was not satisfied',
                'verification_equation_unsatisfied',
            ],
            ['Verification equation was not satisfied', 'verification_equation_unsatisfied'],
            ['Credential is revoked.', 'credential_revoked'],
            ['Credential is revoked', 'credential_revoked'],
        ] as const
    ).map(([text, code]) => [normalizeDiagnosticText(text), code])
);

const isSafeCauseMessageCode = (value: string): value is SafeCauseMessageCode =>
    (SAFE_CAUSE_MESSAGE_CODES as readonly string[]).includes(value);

/** Map known verifier/app messages to codes. Unknown prose becomes unrecognized. */
export const sanitizeVerifyDiagnosticText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const text = normalizeDiagnosticText(value);
    if (!text) return undefined;
    if (isSafeCauseMessageCode(text)) return text;
    return CAUSE_MESSAGE_BY_TEXT.get(text) ?? 'unrecognized';
};

export const sanitizeVerifyDiagnosticList = (values: unknown): string[] => {
    if (!Array.isArray(values)) return [];
    const cleaned: string[] = [];
    for (const value of values) {
        const text = sanitizeVerifyDiagnosticText(value);
        if (text) cleaned.push(text);
        if (cleaned.length >= MAX_ENTRIES) break;
    }
    return cleaned;
};

export const sanitizeVerifyChecks = (values: unknown): SafeVerifyCheck[] => {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter(isSafeVerifyCheck))].slice(0, MAX_ENTRIES);
};

export const sanitizeSkipCounts = (value: unknown): Record<string, number> | undefined => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const counts: Record<string, number> = {};
    for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
        if (!/^[A-Za-z0-9_.-]{1,64}$/.test(key)) continue;
        if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 10_000)
            continue;
        counts[key] = count;
    }
    return Object.keys(counts).length > 0 ? counts : undefined;
};

const sanitizeDiagnostics = (
    diagnostics: VerifyFailureDiagnosticsInput
): VerifyFailureDiagnostics => ({
    kind: diagnostics.kind,
    ...(diagnostics.checks && diagnostics.checks.length > 0
        ? { checks: sanitizeVerifyChecks(diagnostics.checks) }
        : {}),
    ...(diagnostics.errors && diagnostics.errors.length > 0
        ? { errors: sanitizeVerifyDiagnosticList(diagnostics.errors) }
        : {}),
    ...(diagnostics.warnings && diagnostics.warnings.length > 0
        ? { warnings: sanitizeVerifyDiagnosticList(diagnostics.warnings) }
        : {}),
    ...(sanitizeSkipCounts(diagnostics.skipCounts)
        ? { skipCounts: sanitizeSkipCounts(diagnostics.skipCounts) }
        : {}),
});

export const attachVerifyFailureDiagnostics = <Target>(
    target: Target,
    diagnostics: VerifyFailureDiagnosticsInput
): Target => {
    if (!target || typeof target !== 'object' || !isVerifyFailureKind(diagnostics.kind))
        return target;
    try {
        Object.defineProperty(target, DIAGNOSTICS_KEY, {
            value: sanitizeDiagnostics(diagnostics),
            enumerable: false,
            configurable: true,
        });
    } catch {
        // Non-extensible objects still throw their original error.
    }
    return target;
};

export const copyVerifyFailureDiagnostics = <Target>(from: unknown, target: Target): Target => {
    const diagnostics = readAttachedDiagnostics(from);
    return diagnostics ? attachVerifyFailureDiagnostics(target, diagnostics) : target;
};

const readAttachedDiagnostics = (error: unknown): VerifyFailureDiagnostics | undefined => {
    if (!error || typeof error !== 'object' || !(DIAGNOSTICS_KEY in error)) return undefined;
    const attached = (error as Record<typeof DIAGNOSTICS_KEY, unknown>)[DIAGNOSTICS_KEY];
    if (!attached || typeof attached !== 'object') return undefined;
    const record = attached as Partial<VerifyFailureDiagnostics>;
    if (!isVerifyFailureKind(record.kind)) return undefined;
    return sanitizeDiagnostics({
        kind: record.kind,
        checks: record.checks,
        errors: record.errors,
        warnings: record.warnings,
        skipCounts: record.skipCounts,
    });
};

/** Prefer the outermost kind (e.g. all_skipped) and fill in inner verify strings. */
export const readVerifyFailureDiagnostics = (
    error: unknown
): VerifyFailureDiagnostics | undefined => {
    const merged: Partial<VerifyFailureDiagnostics> = {};
    let current: unknown = error;
    for (let depth = 0; depth < 6; depth += 1) {
        if (!current || typeof current !== 'object') break;
        const attached = readAttachedDiagnostics(current);
        if (attached) {
            if (!merged.kind) merged.kind = attached.kind;
            if (!merged.checks?.length && attached.checks?.length) merged.checks = attached.checks;
            if (!merged.errors?.length && attached.errors?.length) merged.errors = attached.errors;
            if (!merged.warnings?.length && attached.warnings?.length)
                merged.warnings = attached.warnings;
            if (!merged.skipCounts && attached.skipCounts) merged.skipCounts = attached.skipCounts;
        }
        if (!('cause' in current)) break;
        current = (current as { cause?: unknown }).cause;
    }
    return isVerifyFailureKind(merged.kind)
        ? sanitizeDiagnostics(merged as VerifyFailureDiagnostics)
        : undefined;
};

export const CAUSE_STEPS = [
    'consent_read',
    'uri_list',
    'scope',
    'batch_setup',
    'batch',
    'projection',
] as const;
export type CauseStep = (typeof CAUSE_STEPS)[number];

const CAUSE_STEP_KEY = Symbol.for('mcp.causeStep');
export const isCauseStep = (value: unknown): value is CauseStep =>
    typeof value === 'string' && (CAUSE_STEPS as readonly string[]).includes(value);

export const sanitizeCauseMessage = (value: unknown): string | undefined =>
    sanitizeVerifyDiagnosticText(value);

const sanitizeFrameName = (value: string): string | undefined => {
    const cleaned = value.replace(/^Object\./, '').replace(/[^A-Za-z0-9_$.<>]/g, '');
    return cleaned.slice(0, 64) || undefined;
};

const sanitizeFrameFile = (value: string): string | undefined => {
    const base = value.split(/[/\\]/).pop() ?? '';
    return /^[A-Za-z0-9_.-]+\.[A-Za-z]+$/.test(base) ? base.slice(0, 64) : undefined;
};

/** Top app stack frame as `function@basename`, never a path or message. */
export const sanitizeCauseFrame = (error: unknown): string | undefined => {
    if (!(error instanceof Error) || typeof error.stack !== 'string') return undefined;
    for (const line of error.stack.split('\n').slice(1)) {
        if (/did:/i.test(line) || /node_modules|node:internal|^\s*at node:/.test(line)) continue;
        const withFn = line.match(
            /^\s*at (?:async )?([^\s(]+) \((?:file:\/\/)?(?:.*[/\\])?([^/\\:]+):\d+:\d+\)\s*$/
        );
        if (withFn) {
            const file = sanitizeFrameFile(withFn[2] ?? '');
            const name = sanitizeFrameName(withFn[1] ?? 'anonymous');
            if (name && file) return `${name}@${file}`;
            continue;
        }
        const noFn = line.match(/^\s*at (?:file:\/\/)?(?:.*[/\\])?([^/\\:]+):\d+:\d+\s*$/);
        if (!noFn) continue;
        const file = sanitizeFrameFile(noFn[1] ?? '');
        if (file) return `anonymous@${file}`;
    }
    return undefined;
};

export const attachCauseStep = <Target>(target: Target, step: CauseStep): Target => {
    if (!target || typeof target !== 'object' || !isCauseStep(step)) return target;
    if (CAUSE_STEP_KEY in target) return target;
    try {
        Object.defineProperty(target, CAUSE_STEP_KEY, {
            value: step,
            enumerable: false,
            configurable: true,
        });
    } catch {
        /* Non-extensible errors still propagate. */
    }
    return target;
};

export const readCauseStep = (error: unknown): CauseStep | undefined => {
    let current: unknown = error;
    const seen = new Set<object>();
    let found: CauseStep | undefined;
    for (let depth = 0; depth < 6; depth += 1) {
        if (!current || typeof current !== 'object' || seen.has(current)) break;
        seen.add(current);
        if (CAUSE_STEP_KEY in current) {
            const step = (current as Record<typeof CAUSE_STEP_KEY, unknown>)[CAUSE_STEP_KEY];
            if (isCauseStep(step)) found = step;
        }
        current = 'cause' in current ? (current as { cause?: unknown }).cause : undefined;
    }
    return found;
};

export const withCauseStep = async <T>(
    step: CauseStep,
    operation: () => Promise<T> | T
): Promise<T> => {
    const progress = getMcpProgress();
    if (progress) {
        const { logSafeEvent } = await import('../logging');
        logSafeEvent('info', 'mcp_tool_progress', {
            mcpTool: progress.tool,
            mcpRequestId: progress.requestId,
            mcpCauseStep: step,
        });
    }
    try {
        return await operation();
    } catch (error) {
        throw attachCauseStep(error, step);
    }
};

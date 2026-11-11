const MAX_ENTRY_CHARS = 120;
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

const isVerifyFailureKind = (value: unknown): value is VerifyFailureKind =>
    typeof value === 'string' && (VERIFY_FAILURE_KINDS as readonly string[]).includes(value);

const isSafeVerifyCheck = (value: unknown): value is SafeVerifyCheck =>
    typeof value === 'string' && (SAFE_VERIFY_CHECKS as readonly string[]).includes(value);

/** Redact identifiers from verifier text and bound the result for logs. */
export const sanitizeVerifyDiagnosticText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const text = value
        .replace(/\bdid:[^\s]+/gi, '[did]')
        .replace(/\bhttps?:\/\/[^\s]+/gi, '[url]')
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[uuid]')
        .replace(/\b[0-9a-f]{32,}\b/g, '[hex]')
        .replace(/\b[A-Za-z0-9+/]{40,}={0,2}(?![A-Za-z0-9+/=])/g, '[b64]')
        .replace(/\s+/g, ' ')
        .trim();
    if (!text) return undefined;
    return text.length > MAX_ENTRY_CHARS ? `${text.slice(0, MAX_ENTRY_CHARS)}...` : text;
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

const sanitizeDiagnostics = (diagnostics: VerifyFailureDiagnostics): VerifyFailureDiagnostics => ({
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
    diagnostics: VerifyFailureDiagnostics
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

/**
 * Sync, non-cryptographic 32-bit FNV-1a hash. Used to generate stable
 * grouping identifiers for error messages so production dashboards can
 * cluster recurring failures without us shipping raw message text
 * (which could contain user-specific URLs, tokens, transaction codes,
 * or other PII).
 *
 * Cryptographic strength isn't needed — clustering is the goal, not
 * confidentiality. Output is 8 lowercase hex chars; identical inputs
 * produce identical outputs across browsers and Node.
 */
export const hashMessage = (input: string): string => {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
        h ^= input.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
};

/**
 * Typed fields the orchestrator wants to surface on the
 * `unrecognized_recoverable_failure` telemetry event. Extracted
 * defensively because the plugin's error class shape is stable but
 * not guaranteed; callers may pass plain `Error` instances or even
 * non-Error values.
 */
export interface ExtractedErrorFields {
    name?: string;
    code?: string;
    status?: number;
}

export const extractErrorFields = (raw: unknown): ExtractedErrorFields => {
    if (!raw || typeof raw !== 'object') return {};
    const err = raw as { name?: unknown; code?: unknown; status?: unknown };
    return {
        name: typeof err.name === 'string' ? err.name : undefined,
        code: typeof err.code === 'string' ? err.code : undefined,
        status: typeof err.status === 'number' ? err.status : undefined,
    };
};

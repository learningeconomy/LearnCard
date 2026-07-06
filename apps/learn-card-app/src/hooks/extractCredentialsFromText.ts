export interface ExtractionResult {
    /** Candidate credential objects, ready to be uploaded one-by-one. */
    credentials: any[];
    /** Human-readable reasons nothing usable could be extracted. Empty on success. */
    errors: string[];
}

const isVerifiablePresentation = (value: any): boolean => {
    if (!value || typeof value !== 'object') return false;
    const types = Array.isArray(value.type) ? value.type : value.type ? [value.type] : [];
    if (types.includes('VerifiablePresentation')) return true;
    return 'verifiableCredential' in value;
};

/**
 * Scan `text` for the first balanced JSON object or array and return the substring.
 * Respects string literals and escape sequences so braces inside strings don't confuse
 * the depth counter. Returns null if no balanced block is found.
 */
const findFirstJsonBlock = (text: string): string | null => {
    const start = text.search(/[{[]/);
    if (start === -1) return null;

    const open = text[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
        const char = text[i];

        if (inString) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
        } else if (char === open) {
            depth += 1;
        } else if (char === close) {
            depth -= 1;
            if (depth === 0) return text.slice(start, i + 1);
        }
    }

    return null;
};

/**
 * Best-effort extraction of usable credential objects from arbitrary text.
 *
 * Pipeline: trim → JSON.parse → (on failure) substring-scan for the first balanced JSON
 * block → classify. A VerifiablePresentation is unwrapped to its verifiableCredential(s);
 * anything else is returned as a single candidate (single VC or OpenBadge v2 — the caller
 * decides how to store each one). Never throws.
 */
export const extractCredentialsFromText = (text: string): ExtractionResult => {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return { credentials: [], errors: ['No content provided.'] };

    let parsed: any;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        const block = findFirstJsonBlock(trimmed);
        if (block === null) {
            return { credentials: [], errors: ['Could not find valid JSON in the provided text.'] };
        }
        try {
            parsed = JSON.parse(block);
        } catch (err: any) {
            return {
                credentials: [],
                errors: [`Could not parse the JSON found in the provided text: ${err.message}`],
            };
        }
    }

    if (isVerifiablePresentation(parsed)) {
        const inner = parsed.verifiableCredential;
        const list = (Array.isArray(inner) ? inner : inner ? [inner] : []).filter(Boolean);
        if (list.length === 0) {
            return {
                credentials: [],
                errors: ['The VerifiablePresentation contained no credentials.'],
            };
        }
        return { credentials: list, errors: [] };
    }

    return { credentials: [parsed], errors: [] };
};

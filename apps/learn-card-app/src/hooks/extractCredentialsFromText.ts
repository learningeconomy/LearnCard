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

const unwrapPresentation = (vp: any): any[] => {
    const inner = vp.verifiableCredential;
    return (Array.isArray(inner) ? inner : inner ? [inner] : []).filter(Boolean);
};

/**
 * Extract the balanced JSON object/array that begins at `start` (which must index a
 * `{` or `[`). Respects string literals and escape sequences so brackets inside strings
 * don't confuse the depth counter. Returns null if the block never closes.
 */
const extractBalancedBlock = (text: string, start: number): string | null => {
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
 * Yield each balanced `{…}`/`[…]` block in `text`, left to right. A block that never
 * closes is skipped (advance past its opener and keep looking), so an unbalanced or
 * non-JSON bracketed run early in the text doesn't hide a valid credential later.
 */
function* iterateJsonBlocks(text: string): Generator<string> {
    let from = 0;
    while (from < text.length) {
        const rel = text.slice(from).search(/[{[]/);
        if (rel === -1) return;
        const start = from + rel;
        const block = extractBalancedBlock(text, start);
        if (block !== null) {
            yield block;
            from = start + block.length;
        } else {
            from = start + 1;
        }
    }
}

/**
 * Best-effort extraction of usable credential objects from arbitrary text.
 *
 * Pipeline: trim → scan every balanced JSON block left-to-right → parse → classify, and
 * return the first block that yields at least one usable credential. A VerifiablePresentation
 * is unwrapped to its verifiableCredential(s); anything else is returned as a single candidate
 * (single VC or OpenBadge v2 — the caller decides how to store each one). This means JSON
 * embedded in surrounding prose still resolves even when earlier bracketed text isn't valid
 * JSON. Never throws, and never surfaces raw parser messages.
 */
export const extractCredentialsFromText = (text: string): ExtractionResult => {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return { credentials: [], errors: ['No content provided.'] };

    let sawParseableJson = false;
    let sawEmptyPresentation = false;

    for (const block of iterateJsonBlocks(trimmed)) {
        let parsed: any;
        try {
            parsed = JSON.parse(block);
        } catch {
            // Not valid JSON (e.g. `[wallet export]`) — keep scanning for the next block.
            continue;
        }

        sawParseableJson = true;

        if (isVerifiablePresentation(parsed)) {
            const list = unwrapPresentation(parsed);
            if (list.length > 0) return { credentials: list, errors: [] };
            // An empty VP is parseable but unusable — remember it, but keep looking in
            // case a usable credential appears later in the text.
            sawEmptyPresentation = true;
            continue;
        }

        return { credentials: [parsed], errors: [] };
    }

    if (sawEmptyPresentation) {
        return {
            credentials: [],
            errors: ['The VerifiablePresentation contained no credentials.'],
        };
    }

    return {
        credentials: [],
        errors: [
            sawParseableJson
                ? 'Could not find a usable credential in the provided text.'
                : 'Could not find valid JSON in the provided text.',
        ],
    };
};

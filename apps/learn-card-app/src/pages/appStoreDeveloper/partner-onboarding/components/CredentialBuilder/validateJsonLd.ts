/**
 * Client-side JSON-LD credential validator.
 *
 * Uses jsonld.expand() with bundled context files to catch "key expansion failed"
 * and "boost expansion failed" errors before hitting the server.
 */

import { bundledDocumentLoader } from './contexts';

export interface JsonLdValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validate a credential JSON object by attempting JSON-LD expansion.
 * This catches the same errors that the server would return, but client-side.
 */
export const validateCredentialJsonLd = async (
    credential: Record<string, unknown>
): Promise<JsonLdValidationResult> => {
    try {
        const jsonld = (await import('@digitalcredentials/jsonld')).default;

        // Replace Mustache variables with placeholder values so expansion
        // doesn't choke on `{{variable_name}}` strings.
        const sanitized = replaceMustacheForValidation(credential);

        await jsonld.expand(sanitized, {
            documentLoader: bundledDocumentLoader,
        });

        return { valid: true, errors: [] };
    } catch (e) {
        const message = (e as Error).message || String(e);
        const errors = parseJsonLdError(message);
        return { valid: false, errors };
    }
};

/**
 * Deep-clone a credential object, replacing Mustache template variables
 * (e.g. `{{issuer_did}}`) with placeholder values that won't break JSON-LD expansion.
 */
function replaceMustacheForValidation(obj: unknown): unknown {
    if (typeof obj === 'string') {
        // Replace {{variable}} with a valid placeholder
        if (/\{\{.*?\}\}/.test(obj)) {
            // For @id-like fields that need a URI, use a placeholder URI
            return 'https://placeholder.example.com/dynamic';
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(replaceMustacheForValidation);
    }

    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = replaceMustacheForValidation(value);
        }
        return result;
    }

    return obj;
}

/**
 * Parse jsonld expansion errors into user-friendly messages.
 */
function parseJsonLdError(message: string): string[] {
    const errors: string[] = [];

    // Pattern: "Invalid JSON-LD syntax; ... is not valid"
    const invalidPropMatch = message.match(
        /Invalid JSON-LD syntax;[^.]*?"([^"]+)"[^.]*?is not/i
    );
    if (invalidPropMatch) {
        errors.push(
            `Property "${invalidPropMatch[1]}" is not valid in this context. ` +
            'Check that the property name matches the OBv3 specification.'
        );
    }

    // Pattern: protected term redefinition
    if (/protected.*term|redefine.*protected/i.test(message)) {
        const termMatch = message.match(/term "([^"]+)"/);
        const term = termMatch ? termMatch[1] : 'unknown';
        errors.push(
            `Property "${term}" conflicts with a protected term in the JSON-LD context. ` +
            'This property cannot be used on this type.'
        );
    }

    // Pattern: invalid @id / IRI
    if (/@id.*invalid|invalid.*IRI|compaction.*IRI/i.test(message)) {
        errors.push(
            'A field that requires a URL contains an invalid value. ' +
            'Ensure all URL fields start with https:// or urn:.'
        );
    }

    // Pattern: loading remote context failed (shouldn't happen with bundled contexts)
    if (/loading.*remote.*context|dereferencing|could not retrieve/i.test(message)) {
        const urlMatch = message.match(/(https?:\/\/[^\s"]+)/);
        errors.push(
            `Unknown JSON-LD context URL${urlMatch ? `: ${urlMatch[1]}` : ''}. ` +
            'Only standard OBv3 and VC v2 contexts are supported.'
        );
    }

    // Fallback: include the raw error
    if (errors.length === 0) {
        // Clean up the message for display
        const cleaned = message
            .replace(/^jsonld\./, '')
            .replace(/Error:\s*/i, '');
        errors.push(`JSON-LD validation error: ${cleaned}`);
    }

    return errors;
}

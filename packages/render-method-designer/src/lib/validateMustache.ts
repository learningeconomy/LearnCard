import Mustache from 'mustache';

import type { ValidationResult } from '../types';

/**
 * Validate a Mustache template by attempting to parse it. Mustache.parse throws on:
 * - Unclosed sections (`{{#name}}…` without `{{/name}}`)
 * - Mismatched section names
 * - Unbalanced delimiters
 *
 * It does NOT catch:
 * - Variables that don't exist on the data (Mustache renders them as empty string).
 * - HTML/SVG well-formedness — DOMPurify will quietly drop malformed tags.
 *
 * Returns errors and warnings as separate buckets so callers can surface fatal vs advisory
 * states differently.
 */
export const validateMustacheTemplate = (template: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.trim()) {
        errors.push('Template is empty.');
        return { valid: false, errors, warnings };
    }

    try {
        Mustache.parse(template);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Mustache parse error: ${message}`);
        return { valid: false, errors, warnings };
    }

    // Soft warnings: unbalanced angle brackets are usually intentional (Mustache inside SVG
    // attributes) but the most common authoring mistake is forgetting to close a tag.
    const openTags = (template.match(/<[a-zA-Z]/g) || []).length;
    const closeTags = (template.match(/<\//g) || []).length;
    const selfClosing = (template.match(/\/>/g) || []).length;
    if (openTags - closeTags - selfClosing > 0) {
        warnings.push(
            `Possibly unclosed XML tag: detected ${openTags} opens, ${closeTags} closes, ${selfClosing} self-closing.`
        );
    }

    return { valid: true, errors, warnings };
};

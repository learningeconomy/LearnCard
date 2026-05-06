import Mustache from 'mustache';

/**
 * Escapes a string value for safe inclusion in a JSON string.
 * This handles special characters that would break JSON parsing.
 *
 * @param value - The value to escape
 * @returns The escaped string safe for JSON inclusion
 */
const escapeJsonStringValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    const str = String(value);

    // Escape characters that would break JSON string parsing
    return str
        .replace(/\\/g, '\\\\') // Backslash first
        .replace(/"/g, '\\"') // Double quotes
        .replace(/\n/g, '\\n') // Newlines
        .replace(/\r/g, '\\r') // Carriage returns
        .replace(/\t/g, '\\t') // Tabs
        .replace(/\f/g, '\\f') // Form feeds
        .replace(/[\b]/g, '\\b'); // Backspace (in character class to avoid word boundary)
};

/**
 * Prepares templateData for safe JSON rendering while preserving array/object structure.
 *
 * @param templateData - The raw template data from the user
 * @returns Escaped template data safe for JSON rendering
 */
const prepareTemplateValue = (value: unknown): unknown => {
    if (value === null || value === undefined) {
        return '';
    }

    if (Array.isArray(value)) {
        return value.map(prepareTemplateValue);
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
                key,
                prepareTemplateValue(nestedValue),
            ])
        );
    }

    if (typeof value === 'string') {
        return escapeJsonStringValue(value);
    }

    return value;
};

const prepareTemplateData = (templateData: Record<string, unknown>): Record<string, unknown> => {
    const prepared: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(templateData)) {
        prepared[key] = prepareTemplateValue(value);
    }

    return prepared;
};

/**
 * Renders a Mustache template string with the provided data.
 * Missing variables will be rendered as empty strings (Mustache default behavior).
 *
 * Values are automatically escaped for safe JSON inclusion (quotes, newlines, etc.).
 * Uses triple-mustache syntax internally to prevent HTML escaping.
 *
 * @param templateJson - The JSON string containing Mustache variables (e.g., {{variableName}})
 * @param templateData - Key-value object where keys correspond to variable names in the template
 * @returns The rendered string with variables substituted
 */
export const renderBoostTemplate = (
    templateJson: string,
    templateData: Record<string, unknown> = {}
): string => {
    // Prepare data by escaping values for JSON safety
    const preparedData = prepareTemplateData(templateData);

    // Convert {{var}} to {{{var}}} to disable Mustache's HTML escaping
    // We handle our own JSON-safe escaping in prepareTemplateData
    const unescapedTemplate = templateJson.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, tag) => {
        const trimmedTag = tag.trim();

        return /^[#^/!>&=]/.test(trimmedTag) ? match : `{{{${trimmedTag}}}}`;
    });

    return Mustache.render(unescapedTemplate, preparedData);
};

/**
 * Parses a rendered template string back into a JSON object.
 * Throws an error if the rendered string is not valid JSON.
 *
 * @param rendered - The rendered template string
 * @returns The parsed JSON object
 * @throws Error if the rendered string is not valid JSON
 */
export const parseRenderedTemplate = <T = unknown>(rendered: string): T => {
    try {
        return JSON.parse(rendered) as T;
    } catch (e) {
        throw new Error('Rendered template produced invalid JSON');
    }
};

/**
 * Checks if a template string contains Mustache variables.
 *
 * @param templateJson - The JSON string to check
 * @returns True if the template contains Mustache variables
 */
export const hasMustacheVariables = (templateJson: string): boolean => {
    return /\{\{.*?\}\}/.test(templateJson);
};

/**
 * Matches a standalone `evidence` reference inside a Mustache tag, e.g.:
 *   {{evidence}}, {{ evidence }}, {{#evidence}}, {{^evidence}}, {{/evidence}},
 *   {{evidence.foo}}
 *
 * The trailing boundary (`[.\s}]|$`) prevents false positives like
 * `{{evidenceList}}` or `{{evidenceItem.foo}}`.
 */
const TEMPLATE_EVIDENCE_REFERENCE_REGEX = /\{\{\s*[#^/]?\s*evidence(?:[.\s}]|$)/;

/**
 * Checks whether a boost template JSON string references `evidence` as a
 * Mustache variable/section. Used to decide whether the server should
 * auto-append template evidence onto the credential, or leave evidence
 * handling to the template author.
 *
 * @param templateJson - The JSON string to inspect
 * @returns True when the template does NOT reference `evidence`, i.e. the
 *          caller is free to auto-append template evidence.
 */
export const shouldAutoAppendTemplateEvidence = (templateJson: string): boolean => {
    return !TEMPLATE_EVIDENCE_REFERENCE_REGEX.test(templateJson);
};

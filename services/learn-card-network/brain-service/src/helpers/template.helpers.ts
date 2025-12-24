import Mustache from 'mustache';

/**
 * Renders a Mustache template string with the provided data.
 * Missing variables will be rendered as empty strings (Mustache default behavior).
 *
 * @param templateJson - The JSON string containing Mustache variables (e.g., {{variableName}})
 * @param templateData - Key-value object where keys correspond to variable names in the template
 * @returns The rendered string with variables substituted
 */
export const renderBoostTemplate = (
    templateJson: string,
    templateData: Record<string, unknown> = {}
): string => {
    return Mustache.render(templateJson, templateData);
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

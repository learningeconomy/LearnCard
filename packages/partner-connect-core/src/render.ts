/**
 * Renders a compiled credential template JSON string with runtime template data and returns the parsed JSON object.
 */
export const renderCompiledTemplate = (
    credentialTemplateJson: string,
    templateData: Record<string, unknown>
): Record<string, unknown> => {
    const renderedJson = credentialTemplateJson.replace(
        /\{\{(\w+)\}\}/g,
        (match: string, variableName: string) => {
            if (!Object.prototype.hasOwnProperty.call(templateData, variableName)) {
                return ['issue_date', 'issuer_did', 'recipient_did'].includes(variableName)
                    ? match
                    : '';
            }

            const value = templateData[variableName];

            if (value === null || value === undefined) {
                return '';
            }

            if (typeof value === 'string') {
                return value
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t')
                    .replace(/\f/g, '\\f')
                    .replace(/\u0008/g, '\\b');
            }

            if (typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
            }

            return '';
        }
    );

    try {
        return JSON.parse(renderedJson) as Record<string, unknown>;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
        throw new Error(`Failed to render compiled template into valid JSON: ${message}`);
    }
};

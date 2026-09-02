export type VariableInputType = 'text' | 'date' | 'number' | 'url';

export const humanizeVariable = (name: string): string =>
    name
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();

export const inferVariableInputType = (name: string): VariableInputType => {
    const lower = name.toLowerCase();
    if (/(date|time|expires|expiry|issued|valid)/.test(lower)) return 'date';
    if (/(credit|grade|score|hours|count|number|amount|gpa|level|point)/.test(lower))
        return 'number';
    if (/(url|link|website|webpage|image|logo|photo|icon|thumbnail|avatar|uri)/.test(lower)) {
        return 'url';
    }
    return 'text';
};

export const applyVariableValues = (
    json: Record<string, unknown>,
    values: Record<string, string>
): Record<string, unknown> => {
    if (Object.keys(values).length === 0) return json;

    const visit = (obj: unknown): unknown => {
        if (typeof obj === 'string') {
            return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                const value = values[varName];
                return value !== undefined && value !== '' ? value : match;
            });
        }
        if (Array.isArray(obj)) return obj.map(visit);
        if (obj && typeof obj === 'object') {
            return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, visit(v)]));
        }
        return obj;
    };

    return visit(json) as Record<string, unknown>;
};

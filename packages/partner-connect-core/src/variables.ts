import { RESERVED_TEMPLATE_VARIABLES, TEMPLATE_VARIABLE_REGEX } from './constants';
import type { InlineTemplateValidationError, VariableManifest } from './types';
import { getDidYouMean, isReservedTemplateVariable, isPlainObject } from './utils';

const VARIABLE_SENTINEL_PREFIX = '__LC_VAR__';

const getStringVariablePaths = (
    value: unknown,
    path: string,
    variables: Record<string, string[]>
): void => {
    if (typeof value === 'string') {
        TEMPLATE_VARIABLE_REGEX.lastIndex = 0;
        let match = TEMPLATE_VARIABLE_REGEX.exec(value);

        while (match) {
            const variableName = match[1];

            if (!isReservedTemplateVariable(variableName)) {
                variables[variableName] = variables[variableName] ?? [];

                if (!variables[variableName].includes(path)) {
                    variables[variableName].push(path);
                }
            }

            match = TEMPLATE_VARIABLE_REGEX.exec(value);
        }

        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) =>
            getStringVariablePaths(item, `${path}[${index}]`, variables)
        );
        return;
    }

    if (isPlainObject(value)) {
        Object.keys(value).forEach(key => {
            const nextPath = path === '$' ? `$.${key}` : `${path}.${key}`;
            getStringVariablePaths(value[key], nextPath, variables);
        });
    }
};

interface UnquotedVariableSpan {
    name: string;
    start: number;
    end: number;
}

/**
 * Finds `{{variable}}` tokens that sit OUTSIDE JSON string literals — i.e. the
 * unquoted numeric placeholders the compiler emits. A colon-based regex is not
 * enough here: string values like "Demo Achievement: {{courseName}}" contain
 * a literal `: {{...}}` and must NOT be classified as numeric, so this walks
 * the string tracking quote state (with escape handling) instead.
 */
const findUnquotedVariableSpans = (json: string): UnquotedVariableSpan[] => {
    const spans: UnquotedVariableSpan[] = [];
    let inString = false;

    for (let index = 0; index < json.length; index += 1) {
        const char = json[index];

        if (inString) {
            if (char === '\\') index += 1;
            else if (char === '"') inString = false;
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{' && json[index + 1] === '{') {
            const match = /^\{\{(\w+)\}\}/.exec(json.slice(index));

            if (match) {
                spans.push({ name: match[1], start: index, end: index + match[0].length });
                index += match[0].length - 1;
            }
        }
    }

    return spans;
};

const replaceUnquotedVariablesForParsing = (json: string): string => {
    const spans = findUnquotedVariableSpans(json);
    let result = json;

    for (let index = spans.length - 1; index >= 0; index -= 1) {
        const span = spans[index];

        result = `${result.slice(0, span.start)}"${VARIABLE_SENTINEL_PREFIX}${
            span.name
        }"${result.slice(span.end)}`;
    }

    return result;
};

/**
 * Extracts the unique `{{variables}}` used inside a compiled credential template JSON string.
 */
export const extractTemplateVariables = (json: string): string[] => {
    const variables = new Set<string>();

    TEMPLATE_VARIABLE_REGEX.lastIndex = 0;
    let match = TEMPLATE_VARIABLE_REGEX.exec(json);

    while (match) {
        variables.add(match[1]);
        match = TEMPLATE_VARIABLE_REGEX.exec(json);
    }

    return Array.from(variables).sort((a, b) => a.localeCompare(b));
};

/**
 * Builds a variable manifest from compiled template JSON.
 * Reserved server-injected variables are excluded.
 */
export const buildVariableManifest = (credentialTemplateJson: string): VariableManifest => {
    const numericVariables = new Set<string>();
    const stringPaths: Record<string, string[]> = {};

    findUnquotedVariableSpans(credentialTemplateJson).forEach(span => {
        if (!isReservedTemplateVariable(span.name)) {
            numericVariables.add(span.name);
        }
    });

    let parsed: unknown = undefined;

    try {
        parsed = JSON.parse(replaceUnquotedVariablesForParsing(credentialTemplateJson));
        getStringVariablePaths(parsed, '$', stringPaths);
    } catch {
        parsed = undefined;
    }

    const manifestVariables: VariableManifest['variables'] = {};

    extractTemplateVariables(credentialTemplateJson).forEach(variableName => {
        if (isReservedTemplateVariable(variableName)) {
            return;
        }

        const paths = [...(stringPaths[variableName] ?? [])].sort((a, b) => a.localeCompare(b));

        manifestVariables[variableName] = {
            type: numericVariables.has(variableName) ? 'number' : 'string',
            paths,
        };
    });

    return { variables: manifestVariables };
};

/**
 * Validates runtime template data against the compiled variable manifest.
 */
export const validateTemplateData = (
    manifest: VariableManifest,
    templateData: Record<string, unknown> | undefined
): InlineTemplateValidationError[] => {
    const errors: InlineTemplateValidationError[] = [];
    const data = templateData ?? {};
    const manifestKeys = Object.keys(manifest.variables);

    manifestKeys.forEach(variableName => {
        if (
            !Object.prototype.hasOwnProperty.call(data, variableName) ||
            data[variableName] === undefined
        ) {
            errors.push({
                path: `templateData.${variableName}`,
                message: `templateData.${variableName} is required`,
            });
            return;
        }

        const expectedType = manifest.variables[variableName].type;
        const value = data[variableName];

        if (expectedType === 'number') {
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                errors.push({
                    path: `templateData.${variableName}`,
                    message: `templateData.${variableName} must be a finite number`,
                });
            }

            return;
        }

        if (!['string', 'number', 'boolean'].includes(typeof value)) {
            errors.push({
                path: `templateData.${variableName}`,
                message: `templateData.${variableName} must be a string, number, or boolean`,
            });
        }
    });

    Object.keys(data).forEach(key => {
        if (key === 'evidence') {
            return;
        }

        if ((RESERVED_TEMPLATE_VARIABLES as readonly string[]).includes(key)) {
            errors.push({
                path: `templateData.${key}`,
                message: `templateData.${key} is injected automatically by LearnCard and cannot be supplied`,
            });
            return;
        }

        if (!Object.prototype.hasOwnProperty.call(manifest.variables, key)) {
            const suggestion = getDidYouMean(key, manifestKeys);
            const suffix = suggestion ? `; did you mean "${suggestion}"?` : '';

            errors.push({
                path: `templateData.${key}`,
                message: `templateData.${key} is unused${suffix}`,
            });
        }
    });

    return errors;
};

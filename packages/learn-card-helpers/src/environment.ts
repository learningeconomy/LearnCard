import { z } from 'zod';

export type EnvironmentSource = {
    project: string;
    source: string;
    examplePath: string;
};

export class EnvironmentConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EnvironmentConfigurationError';
    }
}

export const requiredEnvironmentString = z.string().trim().min(1, 'Required but missing');

export const optionalEnvironmentString = z.preprocess(
    value => (value === '' ? undefined : value),
    requiredEnvironmentString.optional()
);

export const optionalEnvironmentUrl = z.preprocess(
    value => (value === '' ? undefined : value),
    z.url('Expected a valid URL').optional()
);

/**
 * Deployment manifests historically use both true/false and 1/0. These are the complete
 * accepted spellings; every other value fails validation.
 */
export const environmentBoolean = z
    .enum(['true', 'false', '1', '0'])
    .transform(value => value === 'true' || value === '1');

export const optionalEnvironmentBoolean = z.preprocess(
    value => (value === '' || value === undefined ? undefined : value),
    environmentBoolean.optional()
);

export const environmentPort = z.coerce.number().int().min(1).max(65_535);

export const optionalEnvironmentPort = z.preprocess(
    value => (value === '' || value === undefined ? undefined : value),
    environmentPort.optional()
);

export const parseEnvironment = <Schema extends z.ZodType>(
    schema: Schema,
    raw: Record<string, unknown>,
    context: EnvironmentSource
): z.output<Schema> => {
    const result = schema.safeParse(raw);

    if (result.success) return result.data;

    const issues = result.error.issues
        .map(issue => {
            const key = issue.path.length ? issue.path.map(String).join('.') : '(environment)';

            return `${key}\n  ${issue.message}`;
        })
        .join('\n\n');

    throw new EnvironmentConfigurationError(
        [
            `Invalid ${context.project} configuration`,
            '',
            issues,
            '',
            `Configuration source: ${context.source}`,
            `Copy ${context.examplePath} to .env and correct the values above.`,
        ].join('\n')
    );
};

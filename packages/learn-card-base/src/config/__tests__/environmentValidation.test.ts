import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    environmentBoolean,
    parseEnvironment,
    requiredEnvironmentString,
} from '@learncard/helpers';

const schema = z.object({
    SECRET: requiredEnvironmentString,
    FEATURE_ENABLED: environmentBoolean,
    ENDPOINT: z.url(),
});

const context = {
    project: 'test-service',
    source: 'test environment',
    examplePath: 'test-service/.env.example',
};

describe('environment validation', () => {
    it.each([
        ['true', true],
        ['1', true],
        ['false', false],
        ['0', false],
    ])('normalizes the documented boolean value %s', (value, expected) => {
        const result = parseEnvironment(
            schema,
            { SECRET: 'configured', FEATURE_ENABLED: value, ENDPOINT: 'https://example.com' },
            context
        );

        expect(result.FEATURE_ENABLED).toBe(expected);
    });

    it('rejects unsupported boolean spellings', () => {
        expect(() =>
            parseEnvironment(
                schema,
                { SECRET: 'configured', FEATURE_ENABLED: 'yes', ENDPOINT: 'https://example.com' },
                context
            )
        ).toThrow(/FEATURE_ENABLED/);
    });

    it('reports the project, source, key, and example without exposing secret values', () => {
        const secret = 'do-not-print-this-secret';

        let thrown: unknown;

        try {
            parseEnvironment(
                schema,
                { SECRET: secret, FEATURE_ENABLED: 'true', ENDPOINT: 'not-a-url' },
                context
            );
        } catch (error) {
            thrown = error;
        }

        expect(thrown).toBeInstanceOf(Error);

        const message = thrown instanceof Error ? thrown.message : '';

        expect(message).toContain('Invalid test-service configuration');
        expect(message).toContain('ENDPOINT');
        expect(message).toContain('Configuration source: test environment');
        expect(message).toContain('test-service/.env.example');
        expect(message).not.toContain(secret);
    });
});

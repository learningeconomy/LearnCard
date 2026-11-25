import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { pickNonEmpty, functionEnvironment } = require('../function-env.cjs') as {
    pickNonEmpty: (
        keys: string[],
        env?: Record<string, string | undefined>
    ) => Record<string, string>;
    functionEnvironment: (options?: {
        always?: string[];
        fallback?: string[];
        env?: Record<string, string | undefined>;
    }) => Record<string, string>;
};

describe('pickNonEmpty', () => {
    it('keeps only keys with non-empty values from the provided env', () => {
        const env = { A: 'a', B: '', C: undefined, D: 'd' };
        expect(pickNonEmpty(['A', 'B', 'C', 'D', 'MISSING'], env)).toEqual({ A: 'a', D: 'd' });
    });

    it('defaults to process.env', () => {
        process.env.PICK_TEST_VALUE = 'present';
        process.env.PICK_TEST_EMPTY = '';
        try {
            expect(pickNonEmpty(['PICK_TEST_VALUE', 'PICK_TEST_EMPTY'])).toEqual({
                PICK_TEST_VALUE: 'present',
            });
        } finally {
            delete process.env.PICK_TEST_VALUE;
            delete process.env.PICK_TEST_EMPTY;
        }
    });
});

describe('functionEnvironment', () => {
    it('merges always and fallback when no bundle id is set', () => {
        const env = { A: 'a', FB: 'fb', RUNTIME_SECRETS_ID: '' };
        expect(functionEnvironment({ always: ['A'], fallback: ['FB'], env })).toEqual({
            A: 'a',
            FB: 'fb',
        });
    });

    it('drops the fallback when a bundle id is present', () => {
        const env = { A: 'a', FB: 'fb', RUNTIME_SECRETS_ID: 'bundle' };
        expect(functionEnvironment({ always: ['A'], fallback: ['FB'], env })).toEqual({ A: 'a' });
    });

    it('omits empty keys and tolerates missing option fields', () => {
        expect(functionEnvironment({ env: {} })).toEqual({});
        expect(functionEnvironment({ always: ['X'], env: { X: '' } })).toEqual({});
    });
});

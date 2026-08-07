/// <reference types="node" />

import { createRequire } from 'module';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { Linter } = require('eslint');
const rule = require('../../eslint-rules/no-untranslated-ui-literal.js');
const SINGLE_QUOTE = String.fromCharCode(39);
const messageCall = (key: string) => `m[${SINGLE_QUOTE}${key}${SINGLE_QUOTE}]()`;

const lint = (source: string) => {
    const linter = new Linter();
    linter.defineRule('no-untranslated-ui-literal', rule);

    return linter.verify(source, {
        parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
        rules: { 'no-untranslated-ui-literal': 'error' },
    });
};

describe('no-untranslated-ui-literal', () => {
    it('rejects hard-coded copy passed to a user-facing notification', () => {
        const messages = lint("presentToast('Something went wrong')");

        expect(messages).toHaveLength(1);
        expect(messages[0]?.ruleId).toBe('no-untranslated-ui-literal');
    });

    it('allows catalog-backed notification copy', () => {
        expect(lint(`presentToast(${messageCall('error.generic')})`)).toHaveLength(0);
    });

    it('rejects hard-coded copy in a user-facing configuration property', () => {
        expect(lint("const dialog = { title: 'Delete credential' }")).toHaveLength(1);
    });

    it('ignores non-copy configuration values', () => {
        expect(lint("const request = { method: 'POST', url: '/api/boosts' }")).toHaveLength(0);
    });
});

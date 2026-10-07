/// <reference types="node" />

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import rule from '../../eslint-rules/no-untranslated-ui-literal.js';
const SINGLE_QUOTE = String.fromCharCode(39);
const messageCall = (key: string) => `m[${SINGLE_QUOTE}${key}${SINGLE_QUOTE}]()`;

const lint = (source: string) => {
    const linter = new Linter();

    return linter.verify(source, [
        {
            languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
            plugins: {
                local: {
                    rules: { 'no-untranslated-ui-literal': rule },
                },
            },
            rules: { 'local/no-untranslated-ui-literal': 'error' },
        },
    ]);
};

describe('no-untranslated-ui-literal', () => {
    it('rejects hard-coded copy passed to a user-facing notification', () => {
        const messages = lint("presentToast('Something went wrong')");

        expect(messages).toHaveLength(1);
        expect(messages[0]?.ruleId).toBe('local/no-untranslated-ui-literal');
    });

    it('allows catalog-backed notification copy', () => {
        expect(lint(`presentToast(${messageCall('error.generic')})`)).toHaveLength(0);
    });

    it('rejects hard-coded copy in a user-facing configuration property', () => {
        expect(lint("const dialog = { title: 'Delete credential' }")).toHaveLength(1);
    });

    it('rejects hard-coded Troop ID role copy in configuration', () => {
        expect(lint("const role = { idTypeText: 'National Admin' }")).toHaveLength(1);
    });

    it('ignores non-copy configuration values', () => {
        expect(lint("const request = { method: 'POST', url: '/api/boosts' }")).toHaveLength(0);
    });

    it('ignores structural metadata inside user-facing calls', () => {
        const messages = lint(`
            showConfirmationAlert({
                text: ${messageCall('common.delete')},
                buttons: [{
                    role: 'cancel',
                    confirmButtonClassName: 'bg-grayscale-900 text-white',
                }],
            });
        `);

        expect(messages).toHaveLength(0);
    });
});

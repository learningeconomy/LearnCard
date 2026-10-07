/// <reference types="node" />

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const baselinePath = fileURLToPath(
    new URL('../../scripts/i18n-ast-baseline.json', import.meta.url)
);
const guardPath = fileURLToPath(new URL('../../scripts/check-i18n-ast.mjs', import.meta.url));

describe('ScoutPass AST baseline scope', () => {
    it('accepts no untranslated production content', () => {
        const baseline: string[] = JSON.parse(readFileSync(baselinePath, 'utf8'));

        expect(baseline).toEqual([]);
    });

    it('does not scan test or development-only debug surfaces', () => {
        const guardSource = readFileSync(guardPath, 'utf8');

        expect(guardSource).toContain('!src/**/*.test.{ts,tsx}');
        expect(guardSource).toContain('!src/components/debug/**/*.{ts,tsx}');
    });
});

/// <reference types="node" />

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const baselinePath = fileURLToPath(
    new URL('../../scripts/i18n-ast-baseline.json', import.meta.url)
);
const guardPath = fileURLToPath(new URL('../../scripts/check-i18n-ast.mjs', import.meta.url));

const CANONICAL_CONTENT_FILES = new Set([
    'src/components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills.ts',
    'src/components/boost/boost-options/boostOptions.ts',
]);

describe('ScoutPass AST baseline scope', () => {
    it('contains only the 703 canonical credential-content findings', () => {
        const baseline: string[] = JSON.parse(readFileSync(baselinePath, 'utf8'));
        const files = new Set(baseline.map(fingerprint => fingerprint.split('::')[0]));

        expect(baseline).toHaveLength(703);
        expect(files).toEqual(CANONICAL_CONTENT_FILES);
    });

    it('does not scan test or development-only debug surfaces', () => {
        const guardSource = readFileSync(guardPath, 'utf8');

        expect(guardSource).toContain('!src/**/*.test.{ts,tsx}');
        expect(guardSource).toContain('!src/components/debug/**/*.{ts,tsx}');
    });
});

/// <reference types="node" />

import { readFileSync, readdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const SINGLE_QUOTE = String.fromCharCode(39);
const messageCall = (key: string) => `m[${SINGLE_QUOTE}${key}${SINGLE_QUOTE}]()`;

describe('ScoutPass locale integration', () => {
    const readSourceTree = (directory: string): Array<{ path: string; source: string }> =>
        readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) return readSourceTree(path);
            return ['.ts', '.tsx'].includes(extname(entry.name)) && !entry.name.includes('.test.')
                ? [{ path, source: readFileSync(path, 'utf8') }]
                : [];
        });

    it('exposes every compiled locale through the runtime tenant config', () => {
        const configPath = fileURLToPath(
            new URL('../config/bootstrapTenantConfig.ts', import.meta.url)
        );
        const configSource = readFileSync(configPath, 'utf8');

        expect(configSource).toMatch(/supportedLanguages:\s*\['en', 'es', 'fr', 'ar'\]/);
    });

    it('mounts the compact language picker on the logged-out login page', () => {
        const loginPagePath = fileURLToPath(
            new URL('../pages/login/LoginPage.tsx', import.meta.url)
        );
        const loginPageSource = readFileSync(loginPagePath, 'utf8');

        expect(loginPageSource).toContain('<LanguagePickerCompact');
    });

    it('subscribes the memoized app router to locale changes', () => {
        const appRouterPath = fileURLToPath(new URL('../AppRouter.tsx', import.meta.url));
        const appRouterSource = readFileSync(appRouterPath, 'utf8');

        expect(appRouterSource).toContain('useLocale();');
    });

    it('does not use the English-only pluralization helpers', () => {
        const sourcePath = fileURLToPath(new URL('../', import.meta.url));
        const offenders = readSourceTree(sourcePath)
            .filter(({ source }) => /\bconditionalPluralize\b|\bpluralize\s*\(/.test(source))
            .map(({ path }) => path.replace(`${sourcePath}/`, ''));

        expect(offenders).toEqual([]);
    });

    it('routes displayed dates and times through locale-aware formatters', () => {
        const sourcePath = fileURLToPath(new URL('../', import.meta.url));
        const offenders = readSourceTree(sourcePath)
            .filter(({ path }) => !path.endsWith('/i18n/formatters.ts'))
            .filter(({ source }) => /\.toLocale(?:DateString|TimeString)\s*\(/.test(source))
            .map(({ path }) => path.replace(`${sourcePath}/`, ''));

        expect(offenders).toEqual([]);
    });

    it('uses translated accessible names for every login method', () => {
        const loginPagePath = fileURLToPath(
            new URL('../pages/login/LoginPage.tsx', import.meta.url)
        );
        const loginPageSource = readFileSync(loginPagePath, 'utf8');

        expect(loginPageSource).not.toMatch(/alt:\s*['"](?:google|apple)['"]/);
        expect(loginPageSource).not.toMatch(/alt=['"](?:world scouts|email|phone) icon['"]/);
        expect(loginPageSource).toContain(messageCall('login.accessibility.googleLogin'));
        expect(loginPageSource).toContain(messageCall('login.accessibility.appleLogin'));
    });

    it('runs the broadened untranslated-literal guard as an error', () => {
        const configPath = fileURLToPath(new URL('../../.eslintrc-i18n.cjs', import.meta.url));
        const configSource = readFileSync(configPath, 'utf8');

        expect(configSource).toContain("'error'");
        expect(configSource).toContain("mode: 'jsx-only'");
        expect(configSource).not.toContain("mode: 'jsx-text-only'");
    });

    it('generates Paraglide modules through the Vitest plugin on a clean checkout', () => {
        const configPath = fileURLToPath(new URL('../../vitest.config.ts', import.meta.url));
        const configSource = readFileSync(configPath, 'utf8');
        const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        const workflowPath = fileURLToPath(
            new URL('../../../../.github/workflows/lint.yml', import.meta.url)
        );
        const workflowSource = readFileSync(workflowPath, 'utf8');

        expect(configSource).toContain('paraglideVitePlugin');
        expect(configSource).toContain("outdir: './src/paraglide'");
        expect(packageJson.scripts['test:i18n']).toBe('vitest run src/i18n');
        expect(workflowSource).toContain('bun run test:i18n');
    });
});

/// <reference types="node" />

import { readFileSync, readdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const SINGLE_QUOTE = String.fromCharCode(39);
const messageCall = (key: string) => `m[${SINGLE_QUOTE}${key}${SINGLE_QUOTE}]()`;
const messageInvocation = (key: string) => messageCall(key).slice(0, -1);

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

    it('only uses TransP with messages that contain markup placeholders', () => {
        const sourcePath = fileURLToPath(new URL('../', import.meta.url));
        const catalog = JSON.parse(
            readFileSync(
                fileURLToPath(new URL('../../public/locales/en/translation.json', import.meta.url)),
                'utf8'
            )
        );
        const messageForKey = (key: string): unknown =>
            key.split('.').reduce<unknown>((value, segment) => {
                if (!value || typeof value !== 'object') return undefined;
                return (value as Record<string, unknown>)[segment];
            }, catalog);
        const transPMessage = /<TransP[\s\S]*?m=\{m\['([^']+)'\][\s\S]*?(?:\/>|<\/TransP>)/g;
        const offenders = readSourceTree(sourcePath).flatMap(({ path, source }) =>
            [...source.matchAll(transPMessage)].flatMap(match => {
                const message = messageForKey(match[1]);
                return typeof message === 'string' && !/<\d+\/?\s*>/.test(message)
                    ? [`${path.replace(`${sourcePath}/`, '')}: ${match[1]}`]
                    : [];
            })
        );

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

    it('uses a translated accessible name for the email field', () => {
        const emailFormPath = fileURLToPath(
            new URL('../pages/login/forms/EmailForm.tsx', import.meta.url)
        );
        const emailFormSource = readFileSync(emailFormPath, 'utf8');

        expect(emailFormSource).not.toContain('aria-label="Email"');
        expect(emailFormSource).toContain(`aria-label={${messageCall('login.emailPlaceholder')}}`);
    });

    it('localizes both ScoutPass typewriter loading surfaces', () => {
        const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
        const paths = [
            'components/auth/LoginOverlay.tsx',
            'pages/login/LoginPageLoader/LoginLoader.tsx',
        ];

        for (const path of paths) {
            const source = readFileSync(join(sourceRoot, path), 'utf8');

            expect(source).toContain(messageCall('login.loadingMessages.badgesComing'));
            expect(source).toContain(messageCall('login.loadingMessages.boostSpark'));
            expect(source).not.toContain('Badges coming right up!');
            expect(source).not.toContain('Get ready for boost spark!');
            expect(source).toContain('alt=""');
        }
    });

    it('localizes reviewed search and loading feedback', () => {
        const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
        const paths = [
            'components/boost/boost-earned-card/BoostEarnedList.tsx',
            'components/boost/boost-managed-card/BoostManagedChildrenList.tsx',
            'components/boost/boost-managed-card/BoostManagedIDList.tsx',
            'components/boost/boost-managed-card/BoostManagedList.tsx',
        ];

        for (const path of paths) {
            const source = readFileSync(join(sourceRoot, path), 'utf8');
            expect(source).not.toMatch(
                /`Search \$\{searchResultsCount\} (?:earned|managed) boosts`/
            );
            expect(source).not.toMatch(/`No (?:earned|managed) \$\{category\} titled/);
        }

        const earnedSource = readFileSync(join(sourceRoot, paths[0]), 'utf8');
        expect(earnedSource).toContain(messageInvocation('common.searchResults.earnedCountOne'));
        expect(earnedSource).toContain(messageInvocation('common.searchResults.loadingEarned'));

        for (const path of paths.slice(1)) {
            const source = readFileSync(join(sourceRoot, path), 'utf8');
            expect(source).toContain(messageInvocation('common.searchResults.managedCountOne'));
        }
    });

    it('localizes the named remaining shipping-surface literals', () => {
        const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
        const vprSource = readFileSync(
            join(sourceRoot, 'pages/credentialStorage/vpr/VprQueryByExample.tsx'),
            'utf8'
        );
        const skillsSource = readFileSync(
            join(sourceRoot, 'pages/skills/SkillsEmptyPlaceholder.tsx'),
            'utf8'
        );
        const troopSource = readFileSync(
            join(sourceRoot, 'pages/troop/TroopPageIdAndTroopBox.tsx'),
            'utf8'
        );

        expect(vprSource).toContain(messageCall('credentialStorage.sharing'));
        expect(vprSource).toContain(messageCall('credentialStorage.share'));
        expect(vprSource).not.toMatch(/'Sharing\.\.\.'|'Share'/);
        expect(skillsSource).toContain(messageCall('skills.loading'));
        expect(skillsSource).toContain(messageCall('skills.empty'));
        expect(skillsSource).not.toMatch(/Loading Skills|No Skills yet/);
        expect(troopSource).toContain(messageCall('troops.showMore'));
        expect(troopSource).toContain(messageCall('troops.showLess'));
        expect(troopSource).not.toMatch(/'Read more'|'Show less'/);
    });

    it('runs the broadened untranslated-literal guard as an error', () => {
        const configPath = fileURLToPath(new URL('../../eslint-i18n.config.mjs', import.meta.url));
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

    it('selects category descriptor content by stable enum instead of English title', () => {
        const modalPath = fileURLToPath(
            new URL(
                '../components/category-descriptor/CategoryDescriptorModal.tsx',
                import.meta.url
            )
        );
        const modalSource = readFileSync(modalPath, 'utf8');
        const subheaderPath = fileURLToPath(
            new URL('../components/main-subheader/MainSubHeader.tsx', import.meta.url)
        );
        const subheaderSource = readFileSync(subheaderPath, 'utf8');

        expect(modalSource).toContain('category: BoostCategoryOptionsEnum');
        expect(modalSource).not.toContain('switch (title)');
        expect(modalSource).toContain(messageCall('common.gotIt'));
        expect(subheaderSource).toContain('category={category}');
        expect(subheaderSource).not.toContain("_titleOverride = 'Social Boosts'");
    });

    it('localizes the reviewed profile and launch-pad actions', () => {
        const profileSource = readFileSync(
            fileURLToPath(new URL('../components/scouts/MyScoutsModal.tsx', import.meta.url)),
            'utf8'
        );
        const launchPadSource = readFileSync(
            fileURLToPath(new URL('../pages/launchPad/LaunchPad.tsx', import.meta.url)),
            'utf8'
        );

        expect(profileSource).toContain(messageCall('userProfile.completeProfile'));
        expect(profileSource).not.toMatch(/>\s*Complete Profile\s*</);
        expect(launchPadSource).toContain(messageCall('launchPad.openBoostMenu'));
        expect(launchPadSource).not.toContain('aria-label="Open boost menu"');
        expect(launchPadSource).not.toMatch(/text:\s*['"](?:Contacts|Troops|Alerts)['"]/);
    });

    it('localizes the signup modal skip action', () => {
        const modalHookSource = readFileSync(
            fileURLToPath(
                new URL(
                    '../components/network-prompts/hooks/useJoinLCNetworkModal.tsx',
                    import.meta.url
                )
            ),
            'utf8'
        );

        expect(modalHookSource).toContain(messageCall('common.skipForNow'));
        expect(modalHookSource).not.toContain("cancelButtonTextOverride: 'Skip For Now'");
    });

    it('keeps the side-menu language selector full-width and flat', () => {
        const pickerSource = readFileSync(
            fileURLToPath(new URL('../components/sidemenu/LanguagePicker.tsx', import.meta.url)),
            'utf8'
        );
        const triggerSection = pickerSource.slice(
            pickerSource.indexOf('const LanguagePicker: React.FC'),
            pickerSource.indexOf('export default LanguagePicker')
        );

        expect(triggerSection).not.toContain('shadow-soft-bottom');
        expect(triggerSection).not.toContain('<div className="w-full px-4 mt-4">');
        expect(triggerSection).toContain('rounded-[20px]');
        expect(triggerSection).toContain('hover:bg-grayscale-10');
    });
});

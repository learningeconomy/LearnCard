import { beforeAll, describe, expect, it } from 'vitest';

/**
 * AppToggle paints a theme's `primaryColor` through an `.app-color-<name>` rule in controls.css.
 * ion-toggle used any `.ion-color-<name>` in variables.css, so a theme whose primaryColor has no
 * app rule would silently render a transparent checked track. vetpass already did under Ionic
 * (variables.css has no `.ion-color-baltic-blue-500`), and AppToggle keeps that look on purpose.
 */
const KNOWN_WITHOUT_ION_COLOR = new Set(['baltic-blue-500']);

type ThemeJson = { colors?: { defaults?: { primaryColor?: unknown } } };

const themes = import.meta.glob<ThemeJson>('../../theme/schemas/*/theme.json', {
    eager: true,
    import: 'default',
});

const themePrimaryColors: string[] = Object.values(themes)
    .map(theme => theme.colors?.defaults?.primaryColor)
    .filter((color): color is string => typeof color === 'string');

/** Vitest stubs CSS imports (even `?raw`), so read the file itself. The app has no Node types. */
type Fs = {
    existsSync: (file: string) => boolean;
    readFileSync: (file: string, encoding: 'utf8') => string;
};
/** Relative to the vitest working directory: the app (local runs) or the repo root. */
const CSS_PATHS = [
    'src/components/controls/controls.css',
    'apps/learn-card-app/src/components/controls/controls.css',
];
const NODE_FS = 'node:fs';
let css = '';

describe('theme primaryColor tokens for AppToggle', () => {
    beforeAll(async () => {
        const fs = (await import(/* @vite-ignore */ NODE_FS)) as Fs;
        const file = CSS_PATHS.find(candidate => fs.existsSync(candidate));
        css = file ? fs.readFileSync(file, 'utf8') : '';
        expect(css).toContain('.app-toggle');
    });

    it('finds the bundled themes', () => {
        expect(themePrimaryColors.length).toBeGreaterThan(0);
    });

    it.each(themePrimaryColors)(
        'has an .app-color-%s rule (or is a known no-color theme)',
        (color: string) => {
            if (KNOWN_WITHOUT_ION_COLOR.has(color)) return;
            expect(css).toContain(`.app-color-${color} {`);
        }
    );
});

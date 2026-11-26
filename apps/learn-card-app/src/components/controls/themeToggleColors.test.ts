import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AppToggle paints a theme's `primaryColor` through an `.app-color-<name>` rule in controls.css.
 * ion-toggle used any `.ion-color-<name>` in variables.css, so a theme whose primaryColor has no
 * app rule would silently render a transparent checked track. vetpass already did under Ionic
 * (variables.css has no `.ion-color-baltic-blue-500`), and AppToggle keeps that look on purpose.
 */
const KNOWN_WITHOUT_ION_COLOR = new Set(['baltic-blue-500']);

const schemasDir = path.resolve(__dirname, '../../theme/schemas');
const css = fs.readFileSync(path.resolve(__dirname, 'controls.css'), 'utf8');

const themePrimaryColors = fs
    .readdirSync(schemasDir)
    .map(id => path.join(schemasDir, id, 'theme.json'))
    .filter(file => fs.existsSync(file))
    .map(file => JSON.parse(fs.readFileSync(file, 'utf8'))?.colors?.defaults?.primaryColor)
    .filter((color): color is string => typeof color === 'string');

describe('theme primaryColor tokens for AppToggle', () => {
    it('finds the bundled themes', () => {
        expect(themePrimaryColors.length).toBeGreaterThan(0);
    });

    it.each(themePrimaryColors)(
        'has an .app-color-%s rule (or is a known no-color theme)',
        color => {
            if (KNOWN_WITHOUT_ION_COLOR.has(color)) return;
            expect(css).toContain(`.app-color-${color} {`);
        }
    );
});

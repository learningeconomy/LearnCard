/// <reference types="node" />

import { readFileSync, readdirSync } from 'fs';
import { extname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const DIRECTIONAL_ICONS = [
    'ArrowFatRight',
    'ArrowRight',
    'CaretLeft',
    'ChevronRight',
    'CornerDownRightArrow',
    'LeftArrow',
    'RightArrow',
    'SkinnyArrowLeft',
    'SkinnyArrowRight',
    'SkinnyCaretRight',
    'SlimCaretLeft',
    'SlimCaretRight',
];

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));

const sourceFiles = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(path);
        return ['.ts', '.tsx'].includes(extname(entry.name)) && !entry.name.includes('.test.')
            ? [path]
            : [];
    });

describe('RTL directional icons', () => {
    it('marks physical left/right icons for mirroring', () => {
        const tagPattern = new RegExp(`<(${DIRECTIONAL_ICONS.join('|')})\\b([^>]*)>`, 'g');
        const offenders = sourceFiles(sourceRoot).flatMap(path => {
            if (path.includes('/components/svgs/')) return [];
            const source = readFileSync(path, 'utf8');
            return [...source.matchAll(tagPattern)]
                .filter(match => !match[2].includes('rtl-mirror'))
                .map(match => `${relative(sourceRoot, path)}: <${match[1]}>`);
        });

        expect(offenders).toEqual([]);
    });

    it('mirrors directional notification image assets', () => {
        const offenders = sourceFiles(sourceRoot).flatMap(path => {
            const source = readFileSync(path, 'utf8');
            return [...source.matchAll(/<img\b([^>]*src=\{ArrowArcLeft[^>]*)>/g)]
                .filter(match => !match[1].includes('rtl-mirror'))
                .map(() => relative(sourceRoot, path));
        });

        expect(offenders).toEqual([]);
    });
});

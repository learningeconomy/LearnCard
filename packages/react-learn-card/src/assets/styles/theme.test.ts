// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compile } from '@tailwindcss/node';
import { resolve } from 'node:path';
import { rollup } from 'rollup';
import configs from '../../../rollup.config.js';

describe('published stylesheet theme contract', () => {
    it('keeps palette tokens out of the actual Rollup CSS assets', async () => {
        const config = configs[1];
        const bundle = await rollup(config);
        try {
            const { output } = await bundle.generate(config.output[0]);
            const styles = output.filter(
                asset => asset.type === 'asset' && asset.fileName.endsWith('.css')
            );
            expect(styles.map(asset => asset.fileName).sort()).toEqual(['base.css', 'main.css']);
            for (const asset of styles) {
                if (asset.type !== 'asset') continue;
                const css =
                    typeof asset.source === 'string'
                        ? asset.source
                        : Buffer.from(asset.source).toString('utf8');
                expect(css).not.toMatch(/--color-[\w-]+\s*:/);
                expect(css).not.toMatch(/--tw-border-style:\s*none/);
                if (asset.fileName === 'main.css') {
                    expect(css).toContain('#d6faf0');
                    expect(css).toContain('#ef5d35');
                }
            }
        } finally {
            await bundle.close();
        }
    });

    it('inlines the original palette and fonts without exporting host color tokens', async () => {
        const compiler = await compile("@import './src/assets/styles/main.css';", {
            base: resolve('.'),
            onDependency: () => undefined,
        });
        const css = compiler.build([
            'bg-emerald-50',
            'text-orange-500',
            'bg-rose-500',
            'font-jacques',
            'text-xs',
        ]);
        expect(css).toMatch(/\.bg-emerald-50\s*\{\s*background-color: #d6faf0;/);
        expect(css).toMatch(/\.text-orange-500\s*\{\s*color: #ef5d35;/);
        expect(css).toMatch(/\.bg-rose-500\s*\{\s*background-color: #f43f5e;/);
        expect(css).toMatch(/font-family: ["']?Jacques Francois["']?;/);
        expect(css).not.toMatch(/--color-[\w-]+\s*:/);
        expect(css).toContain('--text-xs: 0.75rem');
    });

    it('keeps the optional reset independent of host palette tokens', async () => {
        const compiler = await compile("@import './src/assets/styles/base.css';", {
            base: resolve('.'),
            onDependency: () => undefined,
        });
        const css = compiler.build([]);
        expect(css).not.toMatch(/--color-[\w-]+\s*:/);
        expect(css).toContain('border-color: #e5e7eb');
        expect(css).toContain('color: #9ca3af');
        expect(css).not.toMatch(/--tw-border-style:\s*none/);
    });
});

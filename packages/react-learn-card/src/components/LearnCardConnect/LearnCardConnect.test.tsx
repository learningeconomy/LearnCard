import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('LearnCardConnect styles', () => {
    test('renders iframe as a block element to avoid baseline overflow gaps', () => {
        const cssPath = resolve(
            process.cwd(),
            'src/components/LearnCardConnect/LearnCardConnect.module.css'
        );
        const css = readFileSync(cssPath, 'utf8');

        expect(css).toMatch(/\.iframe\s*\{[^}]*display:\s*block;/s);
    });
});

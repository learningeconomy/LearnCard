import { readFileSync } from 'node:fs';

const metadata = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('public npm package metadata', () => {
    it('explicitly publishes @learncard/mcp publicly from its monorepo directory', () => {
        expect(metadata.name).toBe('@learncard/mcp');
        expect(metadata.private).not.toBe(true);
        expect(metadata.publishConfig).toEqual({ access: 'public' });
        expect(metadata.repository).toEqual({
            type: 'git',
            url: 'https://github.com/learningeconomy/LearnCard',
            directory: 'packages/learn-card-mcp',
        });
        expect(metadata.description).toMatch(/Model Context Protocol/);
        expect(metadata.files).toEqual(['dist', 'src']);
        expect(metadata.license).toBe('MIT');
    });

    it('ships the repository MIT license', () => {
        const license = readFileSync(new URL('../LICENSE', import.meta.url), 'utf8');
        expect(license).toBe(readFileSync(new URL('../../../LICENSE', import.meta.url), 'utf8'));
    });
});

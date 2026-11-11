import { expect, test } from 'bun:test';

const dockerfile = await Bun.file(new URL('../Dockerfile.mcp', import.meta.url)).text();
const install = await Bun.file(new URL('../privacy/install.sh', import.meta.url)).text();
const envSource = await Bun.file(new URL('../src/constants/env.ts', import.meta.url)).text();

const defaultLanguages = envSource.match(
    /export const AI_PRIVACY_OCR_LANGUAGES\s*=\s*process\.env\.AI_PRIVACY_OCR_LANGUAGES\s*\|\|\s*'([^']+)'/
)?.[1];

const uncommented = install
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('\n');

test('Dockerfile.mcp installs only this service production closure', () => {
    const installs = dockerfile
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('bun install'));

    expect(installs.length).toBeGreaterThan(0);
    for (const line of installs) {
        expect(line).toContain('--frozen-lockfile');
        expect(line).toContain('--filter ai-passport-backend');
        expect(line).toContain('--production');
    }
});

test('install.sh does not pull tesseract-ocr-all', () => {
    expect(uncommented).not.toContain('tesseract-ocr-all');
});

test('install.sh language packs match the env.ts OCR default', () => {
    expect(defaultLanguages).toBeString();
    for (const lang of defaultLanguages!.split('+')) {
        expect(uncommented).toContain(`tesseract-ocr-${lang.replaceAll('_', '-')}`);
    }
});

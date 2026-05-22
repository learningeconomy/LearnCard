import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const SERVICE_ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(SERVICE_ROOT, 'src');
const TEST_ROOT = path.join(SERVICE_ROOT, 'test');
const BRAIN_SERVICE_DID = 'did:web:network.learncard.com';

const getTypeScriptFiles = (rootDir: string): string[] => {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });

    return entries.flatMap(entry => {
        const fullPath = path.join(rootDir, entry.name);

        if (entry.isDirectory()) return getTypeScriptFiles(fullPath);
        if (entry.isFile() && fullPath.endsWith('.ts')) return [fullPath];

        return [];
    });
};

const getStaticFixtureFiles = (rootDir: string): string[] => {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });

    return entries.flatMap(entry => {
        const fullPath = path.join(rootDir, entry.name);

        if (entry.isDirectory()) return getStaticFixtureFiles(fullPath);

        if (entry.isFile() && ['.ts', '.js', '.json'].includes(path.extname(fullPath))) {
            return [fullPath];
        }

        return [];
    });
};

describe('E2EE hardening invariants', () => {
    it('never uses learnCard.id.keypair() as a decryption input', () => {
        const sourceFiles = getTypeScriptFiles(SRC_ROOT);
        const boostHelpersPath = path.join(SRC_ROOT, 'helpers', 'boost.helpers.ts');
        const boostHelpersContents = fs.readFileSync(boostHelpersPath, 'utf8');

        expect(boostHelpersContents).not.toContain('learnCard.id.keypair()');

        const decryptWithKeypairPattern =
            /decrypt[A-Za-z0-9_]*\s*\([\s\S]{0,500}?learnCard\.id\.keypair\s*\(/gm;

        const matches = sourceFiles.flatMap(filePath => {
            const contents = fs.readFileSync(filePath, 'utf8');
            const fileMatches = contents.match(decryptWithKeypairPattern) ?? [];

            return fileMatches.map(match => `${path.relative(SERVICE_ROOT, filePath)} :: ${match}`);
        });

        expect(matches).toEqual([]);
    });

    it('never includes the brain-service DID in JWE recipient lists', () => {
        const filesToScan = [
            ...getStaticFixtureFiles(SRC_ROOT),
            ...getStaticFixtureFiles(TEST_ROOT),
        ];
        const recipientContextPattern = new RegExp(
            String.raw`recipients?\s*:\s*\[[\s\S]{0,1500}?${BRAIN_SERVICE_DID.replace(
                /\./g,
                '\\.'
            )}[\s\S]{0,1500}?\]`,
            'gm'
        );

        const matches = filesToScan.flatMap(filePath => {
            const contents = fs.readFileSync(filePath, 'utf8');
            const fileMatches = contents.match(recipientContextPattern) ?? [];

            return fileMatches.map(match => `${path.relative(SERVICE_ROOT, filePath)} :: ${match}`);
        });

        expect(matches).toEqual([]);
    });
});

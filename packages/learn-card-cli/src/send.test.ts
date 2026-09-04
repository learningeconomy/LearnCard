import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SEND_MJS, parseEnv, upsertEnv, toProfileId } from './send';

describe('send command', () => {
    it('ships the exact send.mjs the Quickstart docs show', () => {
        const docsSnippet = readFileSync(
            resolve(__dirname, '../../../docs/snippets/quickstart/send.mjs'),
            'utf8'
        );
        expect(SEND_MJS).toBe(docsSnippet);
    });

    it('parses and upserts .env without touching unrelated lines', () => {
        const original = '# comment\nOTHER=1\nSECURE_SEED=old\n';
        expect(parseEnv(original)).toEqual({ OTHER: '1', SECURE_SEED: 'old' });
        expect(upsertEnv(original, { SECURE_SEED: 'new', PROFILE_ID: 'acme' })).toBe(
            '# comment\nOTHER=1\nSECURE_SEED=new\nPROFILE_ID=acme\n'
        );
        expect(upsertEnv('', { SECURE_SEED: 'x' })).toBe('SECURE_SEED=x\n');
    });

    it('derives a URL-safe profile id with a random suffix', () => {
        expect(toProfileId('Acme Learning, Inc.')).toMatch(/^acme-learning-inc-[a-z0-9]{4}$/);
        expect(toProfileId('!!!')).toMatch(/^issuer-[a-z0-9]{4}$/);
        expect(toProfileId('x'.repeat(60)).length).toBeLessThanOrEqual(40);
    });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
    SEND_MJS,
    parseEnv,
    upsertEnv,
    toProfileId,
    isPlaceholderRecipient,
    invalidRecipientReason,
    resolveRecipient,
    RECIPIENT_PROMPT,
} from './send';

const fakePrompts = (answers: string[]) => {
    const asked: string[] = [];
    return {
        asked,
        prompts: {
            interactive: true,
            ask: async (question: string, fallback: string) => {
                asked.push(question);
                return answers.shift() ?? fallback;
            },
            close: () => {},
        },
    };
};

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

describe('recipient validation', () => {
    it('flags RFC 2606 / 6761 placeholder domains but not real ones', () => {
        expect(isPlaceholderRecipient('you@example.com')).toBe(true);
        expect(isPlaceholderRecipient('YOU@EXAMPLE.ORG')).toBe(true);
        expect(isPlaceholderRecipient('a@sub.example.net')).toBe(true);
        expect(isPlaceholderRecipient('a@foo.test')).toBe(true);
        expect(isPlaceholderRecipient('a@host.invalid')).toBe(true);
        expect(isPlaceholderRecipient('a@test.com')).toBe(false);
        expect(isPlaceholderRecipient('a@myexample.com')).toBe(false);
        expect(isPlaceholderRecipient('a@example.co.uk')).toBe(false);
        expect(isPlaceholderRecipient('+15555550100')).toBe(false);
    });

    it('explains why a recipient is unusable', () => {
        expect(invalidRecipientReason('you@example.com')).toMatch(/placeholder/);
        expect(invalidRecipientReason('not-an-email')).toMatch(/not an email address/);
        expect(invalidRecipientReason('me@acme.org')).toBeUndefined();
        expect(invalidRecipientReason('+15555550100')).toBeUndefined();
    });

    it('accepts a valid recipient without prompting', async () => {
        const { prompts, asked } = fakePrompts([]);
        expect(await resolveRecipient(' me@acme.org ', prompts, true)).toBe('me@acme.org');
        expect(asked).toEqual([]);
    });

    it('prompts when the recipient is omitted', async () => {
        const { prompts, asked } = fakePrompts(['me@acme.org']);
        expect(await resolveRecipient(undefined, prompts, true)).toBe('me@acme.org');
        expect(asked).toEqual([RECIPIENT_PROMPT]);
    });

    it('re-prompts interactively until a placeholder is replaced', async () => {
        const { prompts, asked } = fakePrompts(['nope', 'me@acme.org']);
        expect(await resolveRecipient('you@example.com', prompts, true)).toBe('me@acme.org');
        expect(asked).toEqual([RECIPIENT_PROMPT, RECIPIENT_PROMPT]);
    });

    it('fails fast on a missing recipient when non-interactive', async () => {
        const { prompts, asked } = fakePrompts(['me@acme.org']);
        await expect(resolveRecipient(undefined, prompts, false)).rejects.toThrow(
            /recipient is required/
        );
        expect(asked).toEqual([]);
    });

    it('fails fast on a placeholder when non-interactive', async () => {
        const { prompts, asked } = fakePrompts(['me@acme.org']);
        await expect(resolveRecipient('you@example.com', prompts, false)).rejects.toThrow(
            /placeholder address/
        );
        expect(asked).toEqual([]);
    });
});

describe('personalizeSendMjs', () => {
    it('substitutes the display name, badge name, and description', async () => {
        const { personalizeSendMjs } = await import('./send');
        const out = personalizeSendMjs('Acme Learning', {
            name: 'Welcome to Acme',
            description: 'You joined.',
        });
        expect(out).toContain('displayName: "Acme Learning"');
        expect(out).toContain('name: "Welcome to Acme"');
        expect(out).not.toContain('Quickstart Complete');
        expect(out).toContain('description: "You joined."');
    });
});

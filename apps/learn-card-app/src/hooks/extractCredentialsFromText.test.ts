import { describe, expect, it } from 'vitest';

import { extractCredentialsFromText } from './extractCredentialsFromText';
import { SHARED_CREDENTIAL_VP } from './__fixtures__/sharedCredentialVp';

describe('extractCredentialsFromText', () => {
    it('extracts the single inner VC from the acceptance-fixture VP (.txt)', () => {
        const { credentials, errors } = extractCredentialsFromText(SHARED_CREDENTIAL_VP);

        expect(errors).toEqual([]);
        expect(credentials).toHaveLength(1);
        expect(credentials[0].type).toContain('OpenBadgeCredential');
        expect(credentials[0].name).toBe('Digital Credential Explorer');
        // The VP wrapper itself must NOT leak through.
        expect(credentials[0].type).not.toContain('VerifiablePresentation');
    });

    it('extracts all VCs when a VP wraps an array', () => {
        const vp = JSON.stringify({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiablePresentation'],
            verifiableCredential: [
                { type: ['VerifiableCredential'], name: 'A' },
                { type: ['VerifiableCredential'], name: 'B' },
            ],
        });

        const { credentials, errors } = extractCredentialsFromText(vp);

        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['A', 'B']);
    });

    it('normalizes a VP whose verifiableCredential is a single object', () => {
        const vp = JSON.stringify({
            type: ['VerifiablePresentation'],
            verifiableCredential: { type: ['VerifiableCredential'], name: 'Solo' },
        });

        const { credentials } = extractCredentialsFromText(vp);

        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('Solo');
    });

    it('returns a bare single VC unchanged (no VP wrapper)', () => {
        const vc = { type: ['VerifiableCredential'], name: 'Bare' };

        const { credentials, errors } = extractCredentialsFromText(JSON.stringify(vc));

        expect(errors).toEqual([]);
        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('Bare');
    });

    it('extracts JSON embedded in surrounding prose via substring scan', () => {
        const messy = `Here is my credential, hope it works!\n\n${JSON.stringify({
            type: ['VerifiableCredential'],
            name: 'Embedded',
        })}\n\nThanks!`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        expect(errors).toEqual([]);
        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('Embedded');
    });

    it('handles a brace inside a string literal without truncating', () => {
        const messy = `prefix ${JSON.stringify({
            type: ['VerifiableCredential'],
            note: 'a } brace in a string',
            name: 'Tricky',
        })} suffix`;

        const { credentials } = extractCredentialsFromText(messy);

        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('Tricky');
    });

    it('returns an error (no throw) for empty input', () => {
        expect(extractCredentialsFromText('   ')).toEqual({
            credentials: [],
            errors: ['No content provided.'],
        });
    });

    it('returns an error (no throw) for input with no JSON', () => {
        const { credentials, errors } = extractCredentialsFromText('just some words');

        expect(credentials).toEqual([]);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('returns an error for an empty VP', () => {
        const vp = JSON.stringify({ type: ['VerifiablePresentation'], verifiableCredential: [] });

        const { credentials, errors } = extractCredentialsFromText(vp);

        expect(credentials).toEqual([]);
        expect(errors.length).toBeGreaterThan(0);
    });
});

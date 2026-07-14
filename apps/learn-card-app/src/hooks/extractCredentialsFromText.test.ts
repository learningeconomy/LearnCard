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

    it('substring-scans a VP-in-prose whose verifiableCredential is a nested array of objects', () => {
        const vpObject = {
            type: ['VerifiablePresentation'],
            verifiableCredential: [
                { type: ['VerifiableCredential'], name: 'One', nested: { arr: [1, 2, 3] } },
                { type: ['VerifiableCredential'], name: 'Two' },
            ],
        };
        // Leading prose forces JSON.parse to fail, exercising findFirstJsonBlock over a
        // `{…}` block that contains nested `[…]` and `{…}`.
        const messy = `Please import these:\n${JSON.stringify(vpObject)}\n-- end --`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['One', 'Two']);
    });

    it('unwraps a bare top-level array of VCs into individual candidates', () => {
        const arr = [
            { type: ['VerifiableCredential'], name: 'A' },
            { type: ['VerifiableCredential'], name: 'B' },
        ];

        const { credentials, errors } = extractCredentialsFromText(JSON.stringify(arr));

        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['A', 'B']);
    });

    it('substring-scans a bare array containing objects without truncating', () => {
        const arr = [
            { type: ['VerifiableCredential'], name: 'A' },
            { type: ['VerifiableCredential'], name: 'B' },
        ];
        const messy = `header text ${JSON.stringify(arr)} footer`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        // A `}` inside an object must NOT decrement the depth of the top-level `[`; the
        // scan must capture the FULL array, and each element becomes a candidate.
        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['A', 'B']);
    });

    it('flattens a mixed bare array of VCs and VPs', () => {
        const mixed = [
            { type: ['VerifiableCredential'], name: 'Loose' },
            {
                type: ['VerifiablePresentation'],
                verifiableCredential: [{ type: ['VerifiableCredential'], name: 'Wrapped' }],
            },
        ];

        const { credentials, errors } = extractCredentialsFromText(JSON.stringify(mixed));

        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['Loose', 'Wrapped']);
    });

    it('returns an error for a bare empty array', () => {
        const { credentials, errors } = extractCredentialsFromText('[]');

        expect(credentials).toEqual([]);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('keeps scanning past an earlier non-JSON bracketed block to find a valid credential', () => {
        const vc = { type: ['VerifiableCredential'], name: 'Later' };
        // `[wallet export]` is a balanced block that is NOT valid JSON; the valid VC comes after.
        const messy = `from [wallet export]: ${JSON.stringify(vc)}`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        expect(errors).toEqual([]);
        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('Later');
    });

    it('keeps scanning past an unbalanced earlier bracket to find a valid credential', () => {
        const vc = { type: ['VerifiableCredential'], name: 'Survivor' };
        // The first `[` never closes; the scanner must not get stuck on it.
        const messy = `note [ unclosed bracket then ${JSON.stringify(vc)}`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        expect(errors).toEqual([]);
        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('Survivor');
    });

    it('keeps scanning past an empty VP to find a later usable credential', () => {
        const emptyVp = { type: ['VerifiablePresentation'], verifiableCredential: [] };
        const vc = { type: ['VerifiableCredential'], name: 'Real' };
        const messy = `${JSON.stringify(emptyVp)} and also ${JSON.stringify(vc)}`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['Real']);
    });

    it('does not surface raw parser messages in errors', () => {
        const { credentials, errors } = extractCredentialsFromText('{ not: valid json ]');

        expect(credentials).toEqual([]);
        // Friendly copy only — no "Unexpected token"/parser internals.
        expect(errors.join(' ')).not.toMatch(/unexpected|token|position|JSON\.parse/i);
        expect(errors.length).toBeGreaterThan(0);
    });

    it('skips parseable non-credential JSON and keeps scanning for the real credential', () => {
        const vc = { type: ['VerifiableCredential'], name: 'RealOne' };
        // The first parseable block is metadata, not a credential.
        const messy = `metadata: {"source":"x"} credential: ${JSON.stringify(vc)}`;

        const { credentials, errors } = extractCredentialsFromText(messy);

        expect(errors).toEqual([]);
        expect(credentials).toHaveLength(1);
        expect(credentials[0].name).toBe('RealOne');
    });

    it('drops non-credential elements from a bare array', () => {
        const arr = [{ source: 'x' }, { type: ['VerifiableCredential'], name: 'Keep' }];

        const { credentials, errors } = extractCredentialsFromText(JSON.stringify(arr));

        expect(errors).toEqual([]);
        expect(credentials.map(c => c.name)).toEqual(['Keep']);
    });

    it('returns an error for a lone non-credential object', () => {
        const { credentials, errors } = extractCredentialsFromText('{"source":"x"}');

        expect(credentials).toEqual([]);
        expect(errors.length).toBeGreaterThan(0);
    });
});

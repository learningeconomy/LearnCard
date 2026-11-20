import { describe, expect, it } from 'vitest';
import { HolderEncryptedHandoffValidator, type JWE } from '@learncard/types';
import { assertExactJweRecipients } from '../src/credential-refresh';

const jweFor = (kids: (string | undefined)[]): JWE => ({
    protected: 'protected',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: kids.map(kid => ({
        header: { kid, alg: 'ECDH-ES+A256KW', iv: 'iv', tag: 'tag' },
        encrypted_key: 'encrypted-key',
    })),
});
const expected = ['did:key:holder#key', 'did:key:manager#key'];
const handoff = {
    refreshId: 'refresh-id',
    credentialId: 'urn:uuid:credential-id',
    holderDid: 'did:key:holder',
    issuerDid: 'did:key:issuer',
    credentialStatus: {
        id: 'https://example.test/status/1#0',
        type: 'BitstringStatusListEntry',
        statusPurpose: 'revocation',
        statusListIndex: '0',
        statusListCredential: 'https://example.test/status/1',
    },
    jwe: jweFor(expected),
};

describe('holder handoff contract', () => {
    it('accepts public bindings and ciphertext', () => {
        expect(HolderEncryptedHandoffValidator.parse(handoff)).toEqual(handoff);
    });

    it.each(['credential', 'templateData', 'signedCredential', 'digest'])(
        'rejects unexpected %s rather than silently stripping it',
        field => {
            expect(
                HolderEncryptedHandoffValidator.safeParse({ ...handoff, [field]: 'private' })
                    .success
            ).toBe(false);
        }
    );

    it('requires the status binding', () => {
        const { credentialStatus: _status, ...missingStatus } = handoff;
        expect(HolderEncryptedHandoffValidator.safeParse(missingStatus).success).toBe(false);
    });
});

describe('exact JWE recipient set', () => {
    it('accepts the exact set regardless of order', () => {
        expect(() =>
            assertExactJweRecipients(jweFor([...expected].reverse()), expected)
        ).not.toThrow();
    });

    it.each([
        { label: 'empty', kids: [] },
        { label: 'missing', kids: [expected[0]] },
        { label: 'extra issuer', kids: [...expected, 'did:key:issuer#key'] },
        { label: 'duplicate', kids: [expected[0], expected[0]] },
        { label: 'wrong key', kids: [expected[0], 'did:key:other#key'] },
        { label: 'missing kid', kids: [expected[0], undefined] },
    ])('rejects $label recipients', ({ kids }) => {
        expect(() => assertExactJweRecipients(jweFor(kids), expected)).toThrow(
            'ENCRYPTION_RECIPIENTS_MISMATCH'
        );
    });

    it('rejects absent recipients and invalid expected sets', () => {
        expect(() =>
            assertExactJweRecipients({ ...jweFor([]), recipients: undefined }, expected)
        ).toThrow();
        expect(() => assertExactJweRecipients(jweFor([]), [])).toThrow();
        expect(() =>
            assertExactJweRecipients(jweFor(expected), [expected[0], expected[0]])
        ).toThrow();
    });
});

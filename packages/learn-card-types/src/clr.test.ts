import { describe, expect, expectTypeOf, it } from 'vitest';

import {
    AssociationValidator,
    ClrCredentialValidator,
    ClrSubjectValidator,
    UnsignedClrCredentialValidator,
    type Association,
} from './clr';

const association = {
    type: 'Association' as const,
    associationType: 'isPartOf',
    sourceId: 'https://example.org/achievements/course',
    targetId: 'https://example.org/achievements/program',
};

const subject = {
    id: 'did:example:learner',
    type: ['ClrSubject'],
    association: [association],
};

const unsignedClr = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
    ],
    id: 'https://example.org/credentials/clr',
    type: ['VerifiableCredential', 'ClrCredential'],
    issuer: { id: 'did:example:issuer', type: ['Profile'], name: 'Example University' },
    validFrom: '2026-01-01T00:00:00Z',
    credentialSubject: subject,
};

const proof = {
    type: 'DataIntegrityProof',
    cryptosuite: 'eddsa-rdfc-2022',
    created: '2026-01-01T00:00:00Z',
    proofPurpose: 'assertionMethod',
    verificationMethod: 'did:example:issuer#key',
    proofValue: 'zExampleSignature',
};

describe('CLR Association.type', () => {
    it('accepts the canonical scalar without changing it or extension fields', () => {
        // CLR 2.0 $defs.Association.properties.type requires the scalar "Association".
        // https://purl.imsglobal.org/spec/clr/v2p0/schema/json/clr_v2p0_clrcredential_schema.json
        const input = { ...association, 'ext:description': 'Course belongs to program' };

        expect(AssociationValidator.parse(input)).toEqual(input);
    });

    it.each(
        [
            ['Association'],
            ['Association', 'https://example.org/ExtendedAssociation'],
            ['https://example.org/LegacyAssociation'],
        ].map(type => ({ type }))
    )('preserves supported legacy arrays: $type', ({ type }) => {
        const input = { ...association, type };

        expect(AssociationValidator.parse(input)).toEqual(input);
    });

    it.each(
        [
            undefined,
            null,
            false,
            42,
            '',
            'NotAssociation',
            'association',
            {},
            [],
            ['Association', 42],
            [['Association']],
        ].map(type => ({ type }))
    )('rejects invalid values: $type', ({ type }) => {
        expect(AssociationValidator.safeParse({ ...association, type }).success).toBe(false);
    });

    it('exposes scalar and legacy array types to callers', () => {
        expectTypeOf<Association['type']>().toEqualTypeOf<'Association' | string[]>();
    });
});

describe('CLR credentials with associations', () => {
    it('parses a subject containing both canonical and legacy associations', () => {
        const input = {
            ...subject,
            association: [association, { ...association, type: ['Association'] }],
        };

        expect(ClrSubjectValidator.parse(input)).toEqual(input);
    });

    it.each([false, true])('parses unsigned and signed CLR subject arrays: %s', subjectArray => {
        const input = {
            ...unsignedClr,
            credentialSubject: subjectArray ? [subject] : subject,
        };

        expect(UnsignedClrCredentialValidator.parse(input)).toEqual(input);
        expect(ClrCredentialValidator.parse({ ...input, proof })).toEqual({ ...input, proof });
    });

    it('preserves nested CLR content and validates its associations when parsed directly', () => {
        const nested = { ...unsignedClr, id: 'https://example.org/credentials/nested-clr', proof };
        const input = {
            ...unsignedClr,
            credentialSubject: { ...subject, verifiableCredential: [nested] },
            proof,
        };

        expect(ClrCredentialValidator.parse(input)).toEqual(input);
        // Embedded verifiableCredential values are intentionally opaque in ClrSubjectValidator.
        expect(ClrCredentialValidator.parse(nested)).toEqual(nested);
    });

    it.each([[], 'NotAssociation', ['Association', null]].map(type => ({ type })))(
        'rejects invalid associations through full CLR parsing: $type',
        ({ type }) => {
            const invalidSubject = { ...subject, association: [{ ...association, type }] };

            for (const credentialSubject of [invalidSubject, [invalidSubject]]) {
                const input = { ...unsignedClr, credentialSubject };

                expect(UnsignedClrCredentialValidator.safeParse(input).success).toBe(false);
                expect(ClrCredentialValidator.safeParse({ ...input, proof }).success).toBe(false);
            }
        }
    );
});

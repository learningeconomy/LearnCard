import { describe, it, expect } from 'vitest';

import { ensureObv3RequiredFields } from './obv3Conformance';

const OBV3_REQUIRED_ROOT = [
    '@context',
    'id',
    'type',
    'credentialSubject',
    'issuer',
    'validFrom',
] as const;

const OBV3_REQUIRED_ACHIEVEMENT = ['id', 'type', 'criteria', 'description', 'name'] as const;

const baseCredential = () => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'did:example:issuer', type: ['Profile'], name: 'Example' },
    validFrom: '2026-01-01T00:00:00.000Z',
    credentialSubject: {
        id: 'did:example:subject',
        type: ['AchievementSubject'],
        achievement: {
            type: ['Achievement'],
            name: 'Test Achievement',
            description: 'A test achievement.',
            criteria: { narrative: 'Do the thing.' },
        },
    },
});

describe('ensureObv3RequiredFields', () => {
    it('injects a credential-level id when absent', () => {
        const result = ensureObv3RequiredFields(baseCredential());

        expect(result.id).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
    });

    it('injects an achievement id when absent', () => {
        const result = ensureObv3RequiredFields(baseCredential()) as any;

        expect(result.credentialSubject.achievement.id).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
    });

    it('satisfies every OBv3 required root property', () => {
        const result = ensureObv3RequiredFields(baseCredential());

        OBV3_REQUIRED_ROOT.forEach(key => expect(result).toHaveProperty(key));
    });

    it('satisfies every OBv3 required achievement property', () => {
        const result = ensureObv3RequiredFields(baseCredential()) as any;

        OBV3_REQUIRED_ACHIEVEMENT.forEach(key =>
            expect(result.credentialSubject.achievement).toHaveProperty(key)
        );
    });

    it('preserves ids that are already present', () => {
        const credential = baseCredential() as any;
        credential.id = 'urn:uuid:11111111-1111-1111-1111-111111111111';
        credential.credentialSubject.achievement.id = 'https://example.org/achievements/1';

        const result = ensureObv3RequiredFields(credential) as any;

        expect(result.id).toBe('urn:uuid:11111111-1111-1111-1111-111111111111');
        expect(result.credentialSubject.achievement.id).toBe('https://example.org/achievements/1');
    });

    it('assigns distinct ids to the credential and the achievement', () => {
        const result = ensureObv3RequiredFields(baseCredential()) as any;

        expect(result.id).not.toBe(result.credentialSubject.achievement.id);
    });

    it('handles an array credentialSubject', () => {
        const credential = baseCredential() as any;
        credential.credentialSubject = [
            credential.credentialSubject,
            JSON.parse(JSON.stringify(credential.credentialSubject)),
        ];

        const result = ensureObv3RequiredFields(credential) as any;

        result.credentialSubject.forEach((subject: any) =>
            expect(subject.achievement.id).toMatch(/^urn:uuid:[0-9a-f-]{36}$/)
        );
        expect(result.credentialSubject[0].achievement.id).not.toBe(
            result.credentialSubject[1].achievement.id
        );
    });

    it('tolerates a subject without an achievement', () => {
        const credential = baseCredential() as any;
        delete credential.credentialSubject.achievement;

        expect(() => ensureObv3RequiredFields(credential)).not.toThrow();
    });
});

import { describe, expect, test } from 'bun:test';
import type { VC, CredentialVerificationMetadata } from '@learncard/types';

import {
    getCredentialProjection,
    getPromptCredentialProjection,
    projectCredential,
    serializeModelSafeCredentialProjection,
    serializeModelSafeCredentialRecords,
} from './projection';
import { fingerprintCredential } from './verification';

const verificationFor = (vc: VC): CredentialVerificationMetadata => ({
    credentialUri: vc.id!,
    contentHash: fingerprintCredential(vc),
    status: 'valid',
    checkedAt: '2026-01-01T00:00:00.000Z',
    verifier: {
        name: 'LearnCard credential verifier',
        version: '@learncard/init-2.3.7',
    },
    verifiedPayload: 'boostCredential' in vc ? 'boostCredential' : 'credential',
    checks: ['proof'],
    errors: [],
    warnings: [],
    provenance: { source: 'wallet', retrievedAt: '2026-01-01T00:00:00.000Z' },
    consent: {
        contractUri: 'test:contract',
        receiptId: 'test:receipt',
        status: 'live',
        updatedAt: '2026-01-01T00:00:00.000Z',
        contractUpdatedAt: '2026-01-01T00:00:00.000Z',
        categories: ['Professional Learning'],
        credentialUris: [vc.id!],
        personalFields: [],
        purpose: 'credential-ingestion',
        revision: 'test-revision',
        guardian: { required: false, approved: false },
    },
});

const credential: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:uuid:359be62b-1d9c-4e21-9932-5b22c2a44080',
    type: ['VerifiableCredential', 'AchievementCredential'],
    issuer: {
        id: 'did:web:private-issuer.example',
        name: 'Private Issuer Name',
        email: 'issuer@private.example',
    },
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: {
        id: 'did:key:private-subject',
        name: 'Private Learner Name',
        email: 'learner@private.example',
        achievement: {
            name: 'Cloud Architecture',
            description:
                'Designed resilient services for did:key:private-subject using https://private.example/evidence',
            skills: ['Kubernetes', 'Distributed Systems'],
            recipientName: 'Private Learner Name',
            mobile: '+1-555-0100',
            accountNumber: 'private-account-42',
            grade: 'A+',
            awardedAt: '2026-01-01T00:00:00.000Z',
        },
        goals: ['Lead a platform engineering team'],
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:web:private-issuer.example#key-1',
        proofValue: 'sensitive-proof-value',
    },
};

describe('model-safe credential projection', () => {
    test('retains explicit learning facts and drops unknown credential claims', () => {
        const projection = projectCredential(
            credential,
            'Professional Learning',
            verificationFor(credential)
        );
        const payload = serializeModelSafeCredentialProjection(projection);

        expect(projection.facts).toEqual(
            expect.arrayContaining([
                { kind: 'achievement', label: 'name', value: 'Cloud Architecture' },
                {
                    kind: 'achievement',
                    label: 'description',
                    value: 'Designed resilient services for [identifier] using [link]',
                },
                {
                    kind: 'goal',
                    label: 'goals',
                    value: 'Lead a platform engineering team',
                },
                { kind: 'skill', label: 'skills', value: 'Distributed Systems' },
                { kind: 'skill', label: 'skills', value: 'Kubernetes' },
                { kind: 'grade', label: 'grade', value: 'A+' },
                { kind: 'date', label: 'awardedat', value: '2026-01-01T00:00:00.000Z' },
            ])
        );
        expect(payload).not.toContain('credentialSubject');
        expect(payload).not.toContain('proof');
        expect(payload).not.toContain('issuer');
        expect(payload).not.toContain('did:');
        expect(payload).not.toContain('private.example');
        expect(payload).not.toContain('Private Learner Name');
        expect(payload).not.toContain('private-account-42');
    });

    test('projects only the verified inner payload for network wrappers', () => {
        const wrapper = {
            ...credential,
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            credentialSubject: {
                achievement: { name: 'Outer unverified claim' },
            },
            boostCredential: credential,
        } satisfies VC;

        const payload = serializeModelSafeCredentialProjection(
            projectCredential(wrapper, 'Professional Learning', verificationFor(wrapper))
        );

        expect(payload).toContain('Cloud Architecture');
        expect(payload).not.toContain('Outer unverified claim');
        expect(payload).not.toContain('CertifiedBoostCredential');
    });

    test('produces the same projection for semantically identical key ordering', () => {
        const reordered = {
            ...credential,
            credentialSubject: {
                goals: ['Lead a platform engineering team'],
                achievement: {
                    skills: ['Kubernetes', 'Distributed Systems'],
                    awardedAt: '2026-01-01T00:00:00.000Z',
                    grade: 'A+',
                    accountNumber: 'private-account-42',
                    mobile: '+1-555-0100',
                    recipientName: 'Private Learner Name',
                    description:
                        'Designed resilient services for did:key:private-subject using https://private.example/evidence',
                    name: 'Cloud Architecture',
                },
                email: 'learner@private.example',
                name: 'Private Learner Name',
                id: 'did:key:private-subject',
            },
        } satisfies VC;

        expect(
            projectCredential(reordered, 'Professional Learning', verificationFor(reordered))
        ).toEqual(
            projectCredential(credential, 'Professional Learning', verificationFor(credential))
        );
    });

    test('preserves assessment bounds and numeric field labels', () => {
        const learningCredential = {
            ...credential,
            credentialSubject: {
                id: 'did:key:private-subject',
                achievement: {
                    name: 'Calculus',
                    credits: 3,
                    result: {
                        value: 90,
                        valueMin: 0,
                        valueMax: 100,
                        resultType: 'Percent',
                    },
                    alignment: {
                        targetName: 'Derivatives',
                        targetFramework: 'Mathematics',
                        targetUrl: 'https://private.example',
                    },
                    criteria: { narrative: 'Solve differentiation problems' },
                    learningPathway: {
                        stepIndex: 2,
                        step: { title: 'Integration', topic: 'Calculus' },
                    },
                },
            },
        } satisfies VC;
        const projection = projectCredential(
            learningCredential,
            'Learning History',
            verificationFor(learningCredential)
        );
        expect(projection.facts).toEqual(
            expect.arrayContaining([
                { kind: 'grade', label: 'credits', value: '3' },
                { kind: 'assessment', label: 'value', value: '90' },
                { kind: 'assessment', label: 'valuemin', value: '0' },
                { kind: 'assessment', label: 'valuemax', value: '100' },
                { kind: 'alignment', label: 'targetname', value: 'Derivatives' },
                {
                    kind: 'criteria',
                    label: 'narrative',
                    value: 'Solve differentiation problems',
                },
                { kind: 'pathway', label: 'stepindex', value: '2' },
                { kind: 'topic', label: 'topic', value: 'Calculus' },
            ])
        );
        expect(JSON.stringify(projection)).not.toContain('private.example');
    });

    test('rejects missing projection and invalid or changed original provenance', () => {
        const verification = verificationFor(credential);
        const projection = projectCredential(credential, 'Learning', verification);
        expect(() =>
            getCredentialProjection({
                category: 'Learning',
                credential,
                verification,
            })
        ).toThrow();
        expect(() =>
            getCredentialProjection({ category: 'Learning', credential, projection })
        ).toThrow();
        expect(() =>
            getCredentialProjection({
                category: 'Learning',
                credential,
                projection,
                verification: { ...verification, checks: [] },
            })
        ).toThrow();
        expect(() =>
            projectCredential(
                {
                    ...credential,
                    credentialSubject: {
                        id: 'did:key:private-subject',
                        skills: ['Altered'],
                    },
                },
                'Learning',
                verification
            )
        ).toThrow();
    });
});

describe('expired credentials', () => {
    const expiredVc = (expirationDate: string): VC => ({
        ...credential,
        id: 'urn:uuid:5f7e8c1a-0000-4000-8000-00000000e001',
        expirationDate,
    });

    test('a verifier expiry warning marks the projection expired with its date', () => {
        const vc = expiredVc('2026-02-01T00:00:00.000Z');
        const verification = {
            ...verificationFor(vc),
            warnings: ['credential_expired'],
        };
        const projection = projectCredential(vc, 'Achievement', verification);
        expect(projection.expired).toBe(true);
        expect(projection.expirationDate).toBe('2026-02-01T00:00:00.000Z');
        const prompt = serializeModelSafeCredentialProjection(projection);
        expect(JSON.parse(prompt)).toMatchObject({
            expired: true,
            expirationDate: '2026-02-01T00:00:00.000Z',
        });
    });

    test('a current credential carries no expiry marker', () => {
        const vc = expiredVc('2999-01-01T00:00:00.000Z');
        const projection = projectCredential(vc, 'Achievement', verificationFor(vc));
        expect(projection).not.toHaveProperty('expired');
        expect(projection).not.toHaveProperty('expirationDate');
    });

    test('a credential that expires after projection is marked in the prompt but its stored projection is unchanged', () => {
        const vc = expiredVc('2026-06-01T00:00:00.000Z');
        const verification = verificationFor(vc);
        const projection = projectCredential(
            vc,
            'Achievement',
            verification,
            new Date('2026-05-01T00:00:00.000Z')
        );
        expect(projection).not.toHaveProperty('expired');
        const record = {
            category: 'Achievement',
            uri: vc.id,
            credential: vc,
            projection,
            verification,
        };
        expect(getCredentialProjection(record)).toEqual(projection);
        expect(
            getPromptCredentialProjection(record, new Date('2026-07-01T00:00:00.000Z'))
        ).toMatchObject({
            expired: true,
            expirationDate: '2026-06-01T00:00:00.000Z',
        });
        expect(JSON.parse(serializeModelSafeCredentialRecords([record]))[0]).toMatchObject({
            expired: true,
            expirationDate: '2026-06-01T00:00:00.000Z',
        });
    });
});

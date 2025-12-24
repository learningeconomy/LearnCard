import { describe, it, expect, beforeEach } from 'vitest';

import { getLearnCardForUser, LearnCard, USERS } from './helpers/learncard.helpers';
import { UnsignedVC } from '@learncard/types';

let a: LearnCard;
let b: LearnCard;

/**
 * Templated boost credential with Mustache variables
 */
const testTemplatedBoost: UnsignedVC = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: 'did:web:localhost%3A3000:users:test',
    validFrom: '2020-08-19T21:41:50Z',
    name: 'Certificate for {{courseName}}',
    credentialSubject: {
        id: 'did:example:placeholder',
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:123',
            type: ['Achievement'],
            achievementType: 'Course',
            name: '{{courseName}} - {{level}}',
            description: 'Awarded to {{studentName}} for completing {{courseName}}',
            image: '',
            criteria: { narrative: 'Complete the {{courseName}} course with grade {{grade}}.' },
        },
    },
};

/**
 * Non-templated boost for backwards compatibility testing
 */
const testStaticBoost: UnsignedVC = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: 'did:web:localhost%3A3000:users:test',
    validFrom: '2020-08-19T21:41:50Z',
    name: 'Static Badge',
    credentialSubject: {
        id: 'did:example:placeholder',
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:456',
            type: ['Achievement'],
            achievementType: 'Badge',
            name: 'Static Achievement',
            description: 'A static badge with no template variables',
            image: '',
            criteria: { narrative: 'Earned by completing the static task.' },
        },
    },
};

const setupSigningAuthority = async (lc: LearnCard, name: string) => {
    const sa = await lc.invoke.createSigningAuthority(name);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
    await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);

    return sa;
};

describe('Boost Templating E2E Tests', () => {
    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');

        await setupSigningAuthority(a, 'template-sa');
    });

    describe('Basic Template Substitution', () => {
        it('should substitute templateData variables when sending a boost', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Web Development 101',
                    level: 'Beginner',
                    studentName: 'Test Student',
                    grade: 'A',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);

            // Verify the credential was received
            const incoming = await b.invoke.getIncomingCredentials();
            const received = incoming.find((c: { uri: string }) => c.uri === result.credentialUri);
            expect(received).toBeDefined();
        });

        it('should render missing variables as empty strings', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Partial Data Course',
                    // Missing: level, studentName, grade
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should handle empty templateData object', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {},
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('Backwards Compatibility', () => {
        it('should work without templateData on non-templated boosts', async () => {
            const boostUri = await a.invoke.createBoost(testStaticBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should ignore templateData if boost has no Mustache variables', async () => {
            const boostUri = await a.invoke.createBoost(testStaticBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    ignoredVariable: 'This should be ignored',
                    anotherIgnored: 'Also ignored',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('Special Characters in Template Values', () => {
        it('should handle values with quotes', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Course with "quoted" text',
                    level: 'Advanced',
                    studentName: 'John "Johnny" Doe',
                    grade: 'A+',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should handle values with newlines', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Multi-line\nCourse Name',
                    level: 'Beginner',
                    studentName: 'Test Student',
                    grade: 'B',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should handle values with backslashes', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Path\\To\\Course',
                    level: 'Intermediate',
                    studentName: 'Test\\Student',
                    grade: 'A',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should handle unicode characters', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Cours de Français 🇫🇷',
                    level: 'Avancé',
                    studentName: 'José García',
                    grade: '优秀',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('Template with DID Recipient', () => {
        it('should work with templateData using DID instead of profileId', async () => {
            const bProfile = await b.invoke.getProfile();
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const result = await a.invoke.send({
                type: 'boost',
                recipient: bProfile!.did,
                templateUri: boostUri,
                templateData: {
                    courseName: 'DID-based Course',
                    level: 'Expert',
                    studentName: 'DID Student',
                    grade: 'A+',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('Credential Content Verification', () => {
        it('should correctly substitute values in the issued credential', async () => {
            const boostUri = await a.invoke.createBoost(testTemplatedBoost);

            const templateData = {
                courseName: 'JavaScript Fundamentals',
                level: 'Beginner',
                studentName: 'Alice Smith',
                grade: 'A+',
            };

            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                templateData,
            });

            expect(result.credentialUri).toBeDefined();

            // Accept the credential and verify its contents
            await b.invoke.acceptCredential(result.credentialUri);

            const credential = await b.invoke.resolveFromLCN(result.credentialUri);
            expect(credential).toBeDefined();

            // Verify the template values were substituted
            // The credential may be wrapped, so we need to handle both cases
            const vc = (credential as any)?.boostCredential ?? credential;
            expect(vc?.name).toBe('Certificate for JavaScript Fundamentals');

            const subject = Array.isArray(vc?.credentialSubject)
                ? vc?.credentialSubject[0]
                : vc?.credentialSubject;

            expect(subject?.achievement?.name).toBe('JavaScript Fundamentals - Beginner');
            expect(subject?.achievement?.description).toContain('Alice Smith');
            expect(subject?.achievement?.description).toContain('JavaScript Fundamentals');
            expect(subject?.achievement?.criteria?.narrative).toContain('A+');
        });
    });
});

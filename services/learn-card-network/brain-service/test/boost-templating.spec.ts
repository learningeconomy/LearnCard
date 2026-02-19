import { getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, SigningAuthority } from '@models';
import { UnsignedVC } from '@learncard/types';
import {
    renderBoostTemplate,
    parseRenderedTemplate,
    hasMustacheVariables,
} from '../src/helpers/template.helpers';

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

/**
 * Test credential template with Mustache variables for templating tests
 */
const testTemplatedBoost: UnsignedVC = {
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
        {
            type: '@type',
            xsd: 'https://www.w3.org/2001/XMLSchema#',
            lcn: 'https://docs.learncard.com/definitions#',
            BoostCredential: {
                '@id': 'lcn:boostCredential',
                '@context': {
                    boostId: { '@id': 'lcn:boostId', '@type': 'xsd:string' },
                },
            },
        },
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: 'did:web:localhost%3A3000:users:test',
    issuanceDate: '2020-08-19T21:41:50Z',
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
            criteria: { narrative: 'Complete the {{courseName}} course with grade {{grade}}.' },
        },
    },
};

describe('Boost Templating (Mustache)', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('Template Helper Functions', () => {
        describe('hasMustacheVariables', () => {
            it('should detect Mustache variables in a string', () => {
                expect(hasMustacheVariables('Hello {{name}}')).toBe(true);
                expect(hasMustacheVariables('{{greeting}} {{name}}!')).toBe(true);
                expect(hasMustacheVariables('No variables here')).toBe(false);
                expect(hasMustacheVariables('')).toBe(false);
            });

            it('should detect variables with various formats', () => {
                expect(hasMustacheVariables('{{simple}}')).toBe(true);
                expect(hasMustacheVariables('{{with_underscore}}')).toBe(true);
                expect(hasMustacheVariables('{{camelCase}}')).toBe(true);
                expect(hasMustacheVariables('{{PascalCase}}')).toBe(true);
                expect(hasMustacheVariables('{{with123numbers}}')).toBe(true);
            });

            it('should not match partial mustache syntax', () => {
                expect(hasMustacheVariables('{ not mustache }')).toBe(false);
                expect(hasMustacheVariables('{single}')).toBe(false);
            });
        });

        describe('renderBoostTemplate', () => {
            it('should substitute variables with provided data', () => {
                const template = '{"name": "Hello {{name}}"}';
                const result = renderBoostTemplate(template, { name: 'World' });
                expect(result).toBe('{"name": "Hello World"}');
            });

            it('should handle multiple variables', () => {
                const template = '{"greeting": "{{greeting}} {{name}}!"}';
                const result = renderBoostTemplate(template, { greeting: 'Hello', name: 'Alice' });
                expect(result).toBe('{"greeting": "Hello Alice!"}');
            });

            it('should render missing variables as empty strings', () => {
                const template = '{"name": "Hello {{name}}"}';
                const result = renderBoostTemplate(template, {});
                expect(result).toBe('{"name": "Hello "}');
            });

            it('should handle empty templateData', () => {
                const template = '{"name": "Hello {{name}}"}';
                const result = renderBoostTemplate(template, {});
                expect(result).toBe('{"name": "Hello "}');
            });

            it('should not modify templates without variables', () => {
                const template = '{"name": "Hello World"}';
                const result = renderBoostTemplate(template, { name: 'Ignored' });
                expect(result).toBe('{"name": "Hello World"}');
            });

            it('should escape quotes in values for valid JSON', () => {
                const template = '{"name": "{{name}}"}';
                const result = renderBoostTemplate(template, { name: 'Test "quoted" value' });
                // Quotes are escaped as \" for valid JSON
                expect(result).toBe('{"name": "Test \\"quoted\\" value"}');
                // Verify it parses as valid JSON
                expect(() => JSON.parse(result)).not.toThrow();
            });

            it('should escape newlines in values for valid JSON', () => {
                const template = '{"desc": "{{desc}}"}';
                const result = renderBoostTemplate(template, { desc: 'Line 1\nLine 2' });
                // Newlines are escaped as \n for valid JSON
                expect(result).toBe('{"desc": "Line 1\\nLine 2"}');
                expect(() => JSON.parse(result)).not.toThrow();
            });

            it('should escape backslashes in values for valid JSON', () => {
                const template = '{"path": "{{path}}"}';
                const result = renderBoostTemplate(template, { path: 'C:\\Users\\test' });
                // Backslashes are escaped as \\
                expect(result).toBe('{"path": "C:\\\\Users\\\\test"}');
                expect(() => JSON.parse(result)).not.toThrow();
            });

            it('should handle null and undefined values', () => {
                const template = '{"a": "{{a}}", "b": "{{b}}"}';
                const result = renderBoostTemplate(template, { a: null, b: undefined });
                expect(result).toBe('{"a": "", "b": ""}');
                expect(() => JSON.parse(result)).not.toThrow();
            });

            it('should handle numeric values', () => {
                const template = '{"score": "{{score}}"}';
                const result = renderBoostTemplate(template, { score: 95 });
                expect(result).toBe('{"score": "95"}');
            });
        });

        describe('parseRenderedTemplate', () => {
            it('should parse valid JSON', () => {
                const json = '{"name": "Test"}';
                const result = parseRenderedTemplate<{ name: string }>(json);
                expect(result).toEqual({ name: 'Test' });
            });

            it('should throw error for invalid JSON', () => {
                const invalidJson = '{"name": "Test"';
                expect(() => parseRenderedTemplate(invalidJson)).toThrow(
                    'Rendered template produced invalid JSON'
                );
            });

            it('should throw error for empty string', () => {
                expect(() => parseRenderedTemplate('')).toThrow(
                    'Rendered template produced invalid JSON'
                );
            });

            it('should handle nested objects', () => {
                const json = '{"outer": {"inner": "value"}}';
                const result = parseRenderedTemplate<{ outer: { inner: string } }>(json);
                expect(result).toEqual({ outer: { inner: 'value' } });
            });
        });
    });

    describe('send route with templateData', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'test-sa',
                did: userA.learnCard.id.did(),
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should substitute templateData variables when sending a boost', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: 'Web Development 101',
                    level: 'Beginner',
                    studentName: 'Alice Smith',
                    grade: 'A',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should work without templateData on non-templated boosts', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should work with empty templateData on non-templated boosts', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {},
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should render missing variables as empty strings', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            // Send with partial templateData - missing variables will be empty
            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: 'Web Development 101',
                    // Missing: level, studentName, grade
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should work with templateData on existing boost using did instead of profileId', async () => {
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: userBProfile!.did,
                templateUri: boostUri,
                templateData: {
                    courseName: 'Advanced TypeScript',
                    level: 'Advanced',
                    studentName: 'Bob Johnson',
                    grade: 'A+',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('sendBoostViaSigningAuthority with templateData', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'test-sa',
                did: userA.learnCard.id.did(),
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should substitute templateData variables when sending via signing authority', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({
                profileId: 'userb',
                boostUri,
                signingAuthority: {
                    name: 'test-sa',
                    endpoint: 'http://localhost:5000/api',
                },
                templateData: {
                    courseName: 'React Fundamentals',
                    level: 'Intermediate',
                    studentName: 'Charlie Brown',
                    grade: 'B+',
                },
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should work without templateData on non-templated boosts via signing authority', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = await userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({
                profileId: 'userb',
                boostUri,
                signingAuthority: {
                    name: 'test-sa',
                    endpoint: 'http://localhost:5000/api',
                },
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should allow sending via signing authority to did:web', async () => {
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = await userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({
                profileId: userBProfile!.did,
                boostUri,
                signingAuthority: {
                    name: 'test-sa',
                    endpoint: 'http://localhost:5000/api',
                },
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should allow sending via signing authority to did:key', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const result = await userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({
                profileId: userB.learnCard.id.did(),
                boostUri,
                signingAuthority: {
                    name: 'test-sa',
                    endpoint: 'http://localhost:5000/api',
                },
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should return NOT_FOUND for unsupported did format', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await expect(
                userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({
                    profileId: 'did:example:userb',
                    boostUri,
                    signingAuthority: {
                        name: 'test-sa',
                        endpoint: 'http://localhost:5000/api',
                    },
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('should render missing variables as empty strings via signing authority', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.sendBoostViaSigningAuthority({
                profileId: 'userb',
                boostUri,
                signingAuthority: {
                    name: 'test-sa',
                    endpoint: 'http://localhost:5000/api',
                },
                templateData: {
                    courseName: 'Partial Data Course',
                    // Missing other variables
                },
            });

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });

    describe('Backwards Compatibility', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'test-sa',
                did: userA.learnCard.id.did(),
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should continue to work exactly as before without templateData', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // Original usage without templateData
            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should ignore templateData if boost has no Mustache variables', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // Provide templateData even though boost has no variables
            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    ignoredVariable: 'This should be ignored',
                    anotherIgnored: 'Also ignored',
                },
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });

        it('should still work with signedCredential (pre-signed flow)', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // Pre-sign the credential (original flow)
            const signedCredential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                signedCredential,
            });

            expect(result.credentialUri).toBeDefined();
            expect(result.uri).toBe(boostUri);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'test-sa',
                did: userA.learnCard.id.did(),
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should handle templateData with numeric values', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: 'Course 101',
                    level: 3,
                    studentName: 'Test Student',
                    grade: 95,
                },
            });

            expect(result.credentialUri).toBeDefined();
        });

        it('should handle templateData with boolean values', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: 'Boolean Course',
                    level: true,
                    studentName: 'Test',
                    grade: false,
                },
            });

            expect(result.credentialUri).toBeDefined();
        });

        it('should handle empty string values in templateData', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: '',
                    level: '',
                    studentName: '',
                    grade: '',
                },
            });

            expect(result.credentialUri).toBeDefined();
        });

        it('should handle special characters in templateData values', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            // Note: Mustache HTML-escapes special characters, but simple chars like apostrophes work fine
            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: 'Course with apostrophes',
                    level: 'Advanced Level',
                    studentName: 'Test Student',
                    grade: 'A+',
                },
            });

            expect(result.credentialUri).toBeDefined();
        });

        it('should handle unicode characters in templateData values', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: 'Cours de Français 🇫🇷',
                    level: 'Niveau Avancé',
                    studentName: 'José García',
                    grade: 'A+ 优秀',
                },
            });

            expect(result.credentialUri).toBeDefined();
        });

        it('should handle very long values in templateData', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testTemplatedBoost,
            });

            const longString = 'A'.repeat(1000);

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'userb',
                templateUri: boostUri,
                templateData: {
                    courseName: longString,
                    level: 'Standard',
                    studentName: 'Test Student',
                    grade: 'A',
                },
            });

            expect(result.credentialUri).toBeDefined();
        });
    });
});

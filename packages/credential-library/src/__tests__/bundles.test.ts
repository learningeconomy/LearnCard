import { describe, expect, it } from 'vitest';

import { getBundle, getFixture, isCredentialFixture, prepareFixture } from '../index';

const STANDARD_CONTEXTS = new Set([
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
]);

const collectContexts = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collectContexts);
    if (!value || typeof value !== 'object') return [];

    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
        key === '@context' && Array.isArray(nested)
            ? nested.filter((context): context is string => typeof context === 'string')
            : collectContexts(nested)
    );
};

describe('student credential bundle', () => {
    it('prepares every manifest entry as a standards-pure credential', () => {
        const bundle = getBundle('student');
        const fixtureIds = bundle.entries.map(entry => entry.fixtureId);

        expect(new Set(fixtureIds).size).toBe(fixtureIds.length);
        expect(bundle.entries.some(entry => entry.fixtureId.startsWith('clr/'))).toBe(true);
        expect(new Set(bundle.entries.map(entry => entry.issuer.profileId)).size).toBeGreaterThan(
            1
        );

        for (const entry of bundle.entries) {
            expect(entry.issuer.profileId).toMatch(/^sample-/);

            const fixture = getFixture(entry.fixtureId);
            expect(isCredentialFixture(fixture)).toBe(true);
            if (!isCredentialFixture(fixture)) {
                throw new Error(`${entry.fixtureId} is not a credential fixture`);
            }

            const sourceCredential = fixture.credential as Record<string, unknown>;
            expect(sourceCredential).not.toHaveProperty('id');
            expect(sourceCredential).not.toHaveProperty('proof');
            expect(sourceCredential).not.toHaveProperty('credentialStatus');
            expect(sourceCredential).not.toHaveProperty('boostId');
            expect(sourceCredential).not.toHaveProperty('display');
            expect(sourceCredential).not.toHaveProperty('groupID');
            expect(sourceCredential).not.toHaveProperty('skills');
            expect(sourceCredential).not.toHaveProperty('boostID');

            const serializedCredential = JSON.stringify(sourceCredential);
            expect(serializedCredential).not.toContain('ctx.learncard.com');
            expect(serializedCredential).not.toContain('BoostCredential');
            expect(serializedCredential).not.toContain('"BoostID"');

            const contexts = collectContexts(sourceCredential);
            expect(contexts.length).toBeGreaterThan(0);
            expect(contexts.every(context => STANDARD_CONTEXTS.has(context))).toBe(true);

            const issuerDid = `did:web:demo.example:users:${entry.issuer.profileId}`;
            const credential = prepareFixture(fixture, {
                issuerDid,
                subjectDid: 'did:example:prepared-student',
                freshIds: false,
            });

            expect(fixture.validity).toBe('valid');
            expect(fixture.validator?.safeParse(credential).success ?? true).toBe(true);
            expect(credential.name).toBe(entry.name ?? sourceCredential.name);
            expect(credential.issuer).toMatchObject({ id: issuerDid });
            expect(credential.credentialSubject).toMatchObject({
                id: 'did:example:prepared-student',
            });
        }
    });
});

import { describe, expect, it } from 'vitest';
import { ServiceAccountValidator, ServiceAccountGrantValidator } from '../src/education-os';

const grant = {
    id: 'grant',
    serviceAccountId: 'account',
    installId: 'install',
    resource: 'group',
    action: 'sync',
    selectorKind: 'tree',
    selectorValue: 'ecosystem',
};

describe('EducationOS ServiceAccount validators', () => {
    it('round-trips a provisioned account and resolved grant', () => {
        const account = {
            id: 'account',
            installId: 'install',
            ecosystemId: 'ecosystem',
            status: 'PROVISIONED',
            credentialGeneration: 0,
            createdAt: new Date().toISOString(),
        };
        expect(ServiceAccountValidator.parse(account)).toEqual(account);
        expect(ServiceAccountGrantValidator.parse(grant)).toEqual(grant);
    });
    it.each(['*', '$installEcosystemId', '$other', 'eco*'])(
        'rejects unresolved selector %s',
        selectorValue => {
            expect(
                ServiceAccountGrantValidator.safeParse({ ...grant, selectorValue }).success
            ).toBe(false);
        }
    );
    it.each([{ resource: '*' }, { action: '*' }, { selectorKind: 'path' }])(
        'rejects wildcard/unsupported fields %j',
        fields => {
            expect(ServiceAccountGrantValidator.safeParse({ ...grant, ...fields }).success).toBe(
                false
            );
        }
    );
    it('rejects negative or fractional credential generations', () => {
        for (const credentialGeneration of [-1, 0.5]) {
            expect(
                ServiceAccountValidator.safeParse({
                    id: 'a',
                    installId: 'i',
                    ecosystemId: 'e',
                    status: 'REVOKED',
                    credentialGeneration,
                    createdAt: new Date().toISOString(),
                }).success
            ).toBe(false);
        }
    });
});

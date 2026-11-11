import { describe, expect, it } from 'vitest';

import {
    buildConsentFlowContractFromScopes,
    computeConsentScopeHash,
    normalizeConsentScopes,
} from '../src/helpers/consent-scopes.helpers';

describe('consent-scopes.helpers', () => {
    it('maps normalized consent scopes to immutable contract terms', () => {
        const scopes = normalizeConsentScopes({
            read: {
                credentialCategories: ['Skill', 'Achievement'],
                personalFields: ['email', 'name'],
            },
            write: {
                credentialCategories: ['Achievement'],
            },
            reason: 'ignored for mapping',
        });

        expect(buildConsentFlowContractFromScopes(scopes)).toEqual({
            read: {
                credentials: {
                    categories: {
                        Achievement: { required: false, defaultEnabled: true },
                        Skill: { required: false, defaultEnabled: true },
                    },
                },
                personal: {
                    email: { required: false, defaultEnabled: true },
                    name: { required: false, defaultEnabled: true },
                },
            },
            write: {
                credentials: {
                    categories: {
                        Achievement: { required: false, defaultEnabled: true },
                    },
                },
                personal: {},
            },
        });
    });

    it('hashes scope sets deterministically and ignores reason/order/duplicates', () => {
        const first = normalizeConsentScopes({
            read: {
                credentialCategories: ['Skill', 'Achievement', 'Skill'],
                personalFields: ['name'],
            },
            write: { credentialCategories: ['Achievement'] },
            reason: 'First reason',
        });

        const second = normalizeConsentScopes({
            read: {
                credentialCategories: ['Achievement', 'Skill'],
                personalFields: ['name'],
            },
            write: { credentialCategories: ['Achievement'] },
            reason: 'Different reason',
        });

        expect(computeConsentScopeHash(first)).toBe(computeConsentScopeHash(second));
    });
});

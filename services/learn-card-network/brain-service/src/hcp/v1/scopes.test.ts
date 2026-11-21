import { describe, expect, it } from 'vitest';

import { CONTEXT_ACCESS_DETAIL_TYPE } from './schemas';
import { accessForScopes, scopesForAccess } from './scopes';

const purpose = { code: 'https://learncard.com/hcp/purposes/app-access', description: 'Use' };

describe('accessForScopes (inverse of scopesForAccess)', () => {
    it('groups categories by action set, all under the purpose', () => {
        expect(
            accessForScopes(
                [
                    'hcp:health_context:read',
                    'hcp:general_preferences:write',
                    'hcp:general_preferences:read',
                    'hcp:education_learner_profile:read',
                ],
                purpose
            )
        ).toEqual([
            {
                type: CONTEXT_ACCESS_DETAIL_TYPE,
                actions: ['read', 'write'],
                categories: ['general_preferences'],
                purposes: [purpose],
            },
            {
                type: CONTEXT_ACCESS_DETAIL_TYPE,
                actions: ['read'],
                categories: expect.arrayContaining(['health_context', 'education_learner_profile']),
                purposes: [purpose],
            },
        ]);
    });

    it('round-trips through scopesForAccess', () => {
        const scopes = [
            'hcp:education_learner_profile:read',
            'hcp:general_preferences:read',
            'hcp:general_preferences:write',
            'hcp:health_context:read',
        ];
        expect(scopesForAccess(accessForScopes(scopes, purpose)!)).toEqual(scopes);
        expect(scopesForAccess(accessForScopes(['hcp:health_context:write'], purpose)!)).toEqual([
            'hcp:health_context:write',
        ]);
    });

    it('refuses empty, malformed and unregistered scopes', () => {
        expect(accessForScopes([], purpose)).toBeNull();
        expect(accessForScopes(['openid'], purpose)).toBeNull();
        expect(accessForScopes(['hcp:general_preferences:delete'], purpose)).toBeNull();
        expect(accessForScopes(['hcp:not_a_category:read'], purpose)).toBeNull();
        expect(
            accessForScopes(['hcp:general_preferences:read', 'hcp:nope:read'], purpose)
        ).toBeNull();
    });
});

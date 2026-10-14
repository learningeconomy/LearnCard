import { describe, expect, it } from 'vitest';

import { credentialPredicateValidator, parseInAppMessagesFlagWithErrors } from './inAppMessages';

describe('in-app message credential schema', () => {
    it('rejects unknown credential keys and empty matches', () => {
        expect(
            credentialPredicateValidator.safeParse({
                credential: { issuers: ['did:example:pilot'], typo: true },
            }).success
        ).toBe(false);
        expect(
            credentialPredicateValidator.safeParse({ credential: { minCount: 1 } }).success
        ).toBe(false);
    });

    it('keeps valid messages when a sibling is invalid', () => {
        const result = parseInAppMessagesFlagWithErrors({
            messages: [
                { id: 'valid', title: 'Valid' },
                {
                    id: 'invalid',
                    title: 'Invalid',
                    targeting: { credential: { issuers: [] } },
                },
            ],
        });

        expect(result.flag.messages.map(message => message.id)).toEqual(['valid']);
        expect(result.invalid).toEqual([
            expect.objectContaining({ id: 'invalid', error: expect.any(String) }),
        ]);
    });
});

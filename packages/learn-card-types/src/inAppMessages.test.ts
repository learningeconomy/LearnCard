import { describe, expect, it } from 'vitest';

import {
    credentialPredicateValidator,
    credentialMatchValidator,
    parseInAppMessagesFlag,
    parseInAppMessagesFlagWithErrors,
} from './inAppMessages';

describe('in-app message credential schema', () => {
    it('defaults new settings without changing legacy flag parsing', () => {
        const raw = {
            messages: [
                {
                    id: 'claim',
                    title: 'Claimed',
                    targeting: { credential: { vcTypes: ['ClrCredential'] } },
                    trigger: { event: 'credential.claimed' },
                },
            ],
        };
        const parsed = parseInAppMessagesFlagWithErrors(raw);
        expect(parsed.invalid).toEqual([]);
        expect(parsed.flag.settings).toEqual({
            maxBlockingPerSession: 1,
            blockingCooldownHours: 48,
        });
        expect(parsed.flag.messages[0]).toMatchObject({
            bypassFatigue: false,
            targeting: { credential: { minCount: 1 } },
            trigger: { windowMinutes: 10 },
        });
        expect(parseInAppMessagesFlag(raw)).toEqual(parsed.flag);
    });

    it.each([null, 'bad', [], { maxBlockingPerSession: -1 }, { blockingCooldownHours: 'bad' }])(
        'defaults malformed settings while preserving required updates: %j',
        settings => {
            const result = parseInAppMessagesFlagWithErrors({
                settings,
                messages: [
                    {
                        id: 'update',
                        title: 'Update required',
                        dismissible: false,
                        actions: [{ label: 'Update', action: { type: 'appStore' } }],
                    },
                    { id: 'invalid', title: 'Invalid', targeting: { credential: { issuers: [] } } },
                ],
            });
            expect(result.flag.messages.map(message => message.id)).toEqual(['update']);
            expect(result.flag.settings).toEqual({
                maxBlockingPerSession: 1,
                blockingCooldownHours: 48,
            });
            expect(result.invalid).toEqual([
                { error: expect.stringMatching(/^settings:/) },
                expect.objectContaining({ id: 'invalid' }),
            ]);
        }
    );

    it('rejects trigger matches with unknown fields, empty lists, or no conditions', () => {
        for (const raw of [
            {},
            { issuers: [] },
            { vcTypes: ['ClrCredential'], minCount: 1 },
            { issuers: ['pilot'], typo: true },
            { issuedWithinDays: 0 },
        ]) {
            expect(credentialMatchValidator.safeParse(raw).success).toBe(false);
        }
        expect(parseInAppMessagesFlag(null).messages).toEqual([]);
    });

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

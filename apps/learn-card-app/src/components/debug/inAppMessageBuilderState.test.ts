import { inAppMessageValidator } from '@learncard/types';
import { buildDraftJson, messageToBuilderState } from './inAppMessageBuilderState';
import { IN_APP_MESSAGE_TEMPLATES } from './inAppMessageTemplates';

describe('message builder credential round-trip', () => {
    it.each(IN_APP_MESSAGE_TEMPLATES.filter(template => template.key.startsWith('clr-')))(
        '$key',
        template => {
            const message = inAppMessageValidator.parse(template.json);
            const restored = inAppMessageValidator.parse(
                buildDraftJson(messageToBuilderState(message))
            );
            expect(restored.targeting).toEqual(message.targeting);
            expect(restored.trigger).toEqual(message.trigger);
            expect(restored.bypassFatigue).toEqual(message.bypassFatigue);
        }
    );

    it('preserves negation, all credential fields, minCount, and trigger filters', () => {
        const match = {
            issuers: ['pilot'],
            nestedIssuers: ['school'],
            vcTypes: ['ClrCredential'],
            categories: ['Learning History'],
            achievementTypes: ['Course'],
            issuedWithinDays: 14,
        };
        const message = inAppMessageValidator.parse({
            id: 'round-trip',
            title: 'Test',
            bypassFatigue: true,
            targeting: { not: { credential: { ...match, minCount: 2 } } },
            trigger: { event: 'credential.claimed', where: match, windowMinutes: 4 },
        });
        const restored = inAppMessageValidator.parse(
            buildDraftJson(messageToBuilderState(message))
        );
        expect(restored.targeting).toEqual(message.targeting);
        expect(restored.trigger).toEqual(message.trigger);
        expect(restored.bypassFatigue).toBe(true);
    });

    it('retains nested predicate trees instead of dropping unsupported branches', () => {
        const message = inAppMessageValidator.parse({
            id: 'nested',
            title: 'Nested',
            targeting: {
                not: {
                    any: [{ credential: { vcTypes: ['ClrCredential'] } }, { role: ['learner'] }],
                },
            },
        });
        expect(
            inAppMessageValidator.parse(buildDraftJson(messageToBuilderState(message))).targeting
        ).toEqual(message.targeting);
    });
});

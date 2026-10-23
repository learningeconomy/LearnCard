import { describe, expect, it } from 'vitest';
import { readInAppMessagesFlags } from '../flagDelivery';

const update = {
    id: 'update',
    title: 'Update required',
    dismissible: false,
    actions: [{ label: 'Update', action: { type: 'appStore' } }],
};
const credential = {
    id: 'credential',
    title: 'Credential',
    targeting: {
        any: [{ role: ['learner'] }, { not: { credential: { vcTypes: ['ClrCredential'] } } }],
    },
};
const triggered = { id: 'triggered', title: 'Triggered', trigger: { event: 'app.opened' } };

describe('versioned targeting delivery', () => {
    it('preserves legacy update campaigns when V2 is absent', () => {
        expect(
            readInAppMessagesFlags({ inAppMessages: { messages: [update] } }).flag.messages.map(
                m => m.id
            )
        ).toEqual(['update']);
    });
    it('uses V2 exclusively with targeting, triggers and settings', () => {
        const result = readInAppMessagesFlags({
            inAppMessages: { messages: [update] },
            inAppMessagesV2: {
                messages: [credential, triggered],
                settings: { maxBlockingPerSession: 2 },
            },
        });
        expect(result.flag.messages.map(m => m.id)).toEqual(['credential', 'triggered']);
        expect(result.flag.settings.maxBlockingPerSession).toBe(2);
    });
    it.each([null, false, {}, { messages: [] }, { messages: 'bad' }])(
        'does not resurrect legacy campaigns when V2 is explicitly empty/off/malformed: %j',
        value => {
            expect(
                readInAppMessagesFlags({
                    inAppMessages: { messages: [update] },
                    inAppMessagesV2: value,
                }).flag.messages
            ).toEqual([]);
        }
    );
    it('diagnoses new rules in the legacy feed without dropping its update campaign', () => {
        for (const key of [undefined, 'inAppMessages']) {
            const result = readInAppMessagesFlags(
                { inAppMessages: { messages: [update, credential, triggered] } },
                key
            );
            expect(result.flag.messages.map(m => m.id)).toEqual(['update']);
            expect(result.invalid.map(m => m.id)).toEqual(['credential', 'triggered']);
            expect(result.invalid.every(m => m.error.includes('inAppMessagesV2'))).toBe(true);
        }
    });
    it('supports explicit custom keys without legacy fallback', () => {
        expect(
            readInAppMessagesFlags({ inAppMessages: { messages: [update] } }, 'custom').flag
                .messages
        ).toEqual([]);
        expect(
            readInAppMessagesFlags({ custom: { messages: [credential] } }, 'custom').flag
                .messages[0]?.id
        ).toBe('credential');
    });
});

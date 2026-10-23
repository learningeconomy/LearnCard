import { describe, expect, it } from 'vitest';
import { inspectInAppMessagesFlagDelivery, readInAppMessagesFlags } from '../flagDelivery';

const legacy = { id: 'legacy', title: 'Legacy modal' };
const story = { id: 'story', title: 'Story', presentation: 'story', steps: [{ title: 'First' }] };

describe('versioned campaign delivery', () => {
    it('requires V2 for new action types even in a legacy modal presentation', () => {
        const message = {
            ...legacy,
            actions: [{ label: 'Next', action: { type: 'openMessage', messageId: 'next' } }],
        };
        expect(
            readInAppMessagesFlags({ inAppMessages: { messages: [message] } }).flag.messages
        ).toEqual([]);
        expect(
            readInAppMessagesFlags({ inAppMessagesV2: { messages: [message] } }).flag.messages
        ).toHaveLength(1);
    });
    it('preserves legacy campaigns when the V2 flag is absent', () => {
        expect(
            readInAppMessagesFlags({ inAppMessages: { messages: [legacy] } }).flag.messages.map(
                m => m.id
            )
        ).toEqual(['legacy']);
    });
    it('uses only V2 when present, including its settings, without merging duplicate campaigns', () => {
        const result = readInAppMessagesFlags({
            inAppMessages: { messages: [legacy] },
            inAppMessagesV2: { messages: [legacy, story], settings: { maxBlockingPerSession: 2 } },
        });
        expect(result.flag.messages.map(m => m.id)).toEqual(['legacy', 'story']);
        expect(result.flag.settings.maxBlockingPerSession).toBe(2);
    });
    it.each([null, false, {}, { messages: [] }, { messages: 'bad' }])(
        'does not resurrect legacy campaigns when V2 is explicitly empty/off/malformed: %j',
        value => {
            expect(
                readInAppMessagesFlags({
                    inAppMessages: { messages: [legacy] },
                    inAppMessagesV2: value,
                }).flag.messages
            ).toEqual([]);
        }
    );
    it('rejects rich entries in the legacy feed without discarding supported siblings', () => {
        const result = readInAppMessagesFlags({ inAppMessages: { messages: [legacy, story] } });
        expect(result.flag.messages.map(m => m.id)).toEqual(['legacy']);
        expect(result.invalid).toEqual([
            { id: 'story', error: expect.stringContaining('inAppMessagesV2') },
        ]);
    });
    it('supports an explicit custom key without falling back to the legacy feed', () => {
        expect(
            readInAppMessagesFlags({ inAppMessages: { messages: [legacy] } }, 'custom').flag
                .messages
        ).toEqual([]);
        expect(
            readInAppMessagesFlags({ custom: { messages: [story] } }, 'custom').flag.messages[0]?.id
        ).toBe('story');
    });

    it('reports why an authoritative empty V2 value prevents the legacy fallback', () => {
        const flags = {
            inAppMessages: { messages: [legacy] },
            inAppMessagesV2: false,
        };
        const parsed = readInAppMessagesFlags(flags);

        expect(inspectInAppMessagesFlagDelivery(flags, parsed)).toEqual({
            requestedKey: 'inAppMessagesV2',
            selectedKey: 'inAppMessagesV2',
            usedLegacyFallback: false,
            requestedValueState: 'boolean',
            legacyValueState: 'object',
            rawMessageCount: null,
            acceptedMessageIds: [],
            invalidMessages: [{ error: 'Invalid input: expected object, received boolean' }],
        });
    });

    it('reports accepted IDs and parse errors from the legacy fallback without flag contents', () => {
        const flags = {
            inAppMessages: {
                messages: [legacy, story, { id: 'broken', title: 42 }],
            },
        };
        const parsed = readInAppMessagesFlags(flags);
        const debug = inspectInAppMessagesFlagDelivery(flags, parsed);

        expect(debug).toMatchObject({
            requestedKey: 'inAppMessagesV2',
            selectedKey: 'inAppMessages',
            usedLegacyFallback: true,
            requestedValueState: 'missing',
            legacyValueState: 'object',
            rawMessageCount: 3,
            acceptedMessageIds: ['legacy'],
        });
        expect(debug.invalidMessages).toEqual([
            { id: 'broken', error: expect.any(String) },
            { id: 'story', error: expect.stringContaining('inAppMessagesV2') },
        ]);
    });
});

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

import { describe, expect, it } from 'vitest';
import { readInAppMessagesFlags } from '../flagDelivery';

const legacy = { id: 'legacy', title: 'Legacy modal' };
const story = { id: 'story', title: 'Story', presentation: 'story', steps: [{ title: 'First' }] };

describe('versioned campaign delivery', () => {
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
});

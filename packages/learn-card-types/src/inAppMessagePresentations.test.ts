import { describe, expect, it } from 'vitest';
import { inAppMessageValidator, parseInAppMessagesFlagWithErrors } from './inAppMessages';

describe('rich message schema', () => {
    it('keeps legacy defaults', () => {
        expect(inAppMessageValidator.parse({ id: 'old', title: 'Hello' })).toMatchObject({
            presentation: 'modal',
            dismissible: true,
            actions: [],
        });
    });
    it.each([undefined, []])('requires story screens: %s', steps => {
        expect(
            inAppMessageValidator.safeParse({
                id: 'story',
                title: 'Hello',
                presentation: 'story',
                steps,
            }).success
        ).toBe(false);
    });
    it('requires iframe configuration and defaults its timeout', () => {
        expect(
            inAppMessageValidator.safeParse({ id: 'frame', title: 'Hello', presentation: 'iframe' })
                .success
        ).toBe(false);
        expect(
            inAppMessageValidator.parse({
                id: 'frame',
                title: 'Hello',
                presentation: 'iframe',
                iframe: { url: 'https://example.com' },
            }).iframe?.loadTimeoutMs
        ).toBe(10000);
    });
    it.each([
        'http://example.com',
        '/page',
        'javascript:alert(1)',
        'bad',
        'https://user:pass@example.com',
    ])('rejects unsafe base and translated URLs: %s', url => {
        expect(
            inAppMessageValidator.safeParse({
                id: 'frame',
                title: 'Hello',
                presentation: 'iframe',
                iframe: { url },
            }).success
        ).toBe(false);
        expect(
            inAppMessageValidator.safeParse({
                id: 'frame',
                title: 'Hello',
                locales: { es: { iframeUrl: url } },
            }).success
        ).toBe(false);
    });
    it('isolates invalid siblings', () => {
        const result = parseInAppMessagesFlagWithErrors({
            messages: [
                { id: 'bad', title: 'Bad', presentation: 'story' },
                { id: 'good', title: 'Good', presentation: 'story', steps: [{ title: 'First' }] },
            ],
        });
        expect(result.flag.messages.map(message => message.id)).toEqual(['good']);
        expect(result.invalid).toHaveLength(1);
    });
});

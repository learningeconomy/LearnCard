import { describe, expect, it } from 'vitest';
import { isSafeInAppMessagePath } from './inAppMessagePath';
import {
    inAppMessageActionTargetValidator,
    parseInAppMessagesFlagWithErrors,
} from './inAppMessages';

describe('message destinations', () => {
    it.each(['/', '/courses/123?tab=details#lesson', '/café'])('allows %s', path => {
        expect(isSafeInAppMessagePath(path)).toBe(true);
        expect(
            inAppMessageActionTargetValidator.safeParse({
                type: 'openApp',
                listingId: 'example',
                path,
            }).success
        ).toBe(true);
    });
    it.each([
        'https://evil.test',
        '//evil.test',
        '/\\evil',
        '/%2fhost',
        '/%252fhost',
        '/a/../b',
        '/%2e%2e/x',
        '/a%00',
        ' /x',
        '/a\nb',
        '/%zz',
        'javascript:alert(1)',
    ])('rejects %s', path => {
        expect(isSafeInAppMessagePath(path)).toBe(false);
        expect(
            inAppMessageActionTargetValidator.safeParse({
                type: 'openApp',
                listingId: 'example',
                path,
            }).success
        ).toBe(false);
    });
    it('requires IDs and isolates invalid action siblings', () => {
        expect(
            inAppMessageActionTargetValidator.safeParse({ type: 'openMessage', messageId: ' ' })
                .success
        ).toBe(false);
        expect(
            inAppMessageActionTargetValidator.safeParse({ type: 'openApp', listingId: '' }).success
        ).toBe(false);
        const { flag, invalid } = parseInAppMessagesFlagWithErrors({
            messages: [
                {
                    id: 'bad',
                    title: 'Bad',
                    actions: [
                        {
                            label: 'Go',
                            action: { type: 'openApp', listingId: 'a', path: '//evil.test' },
                        },
                    ],
                },
                {
                    id: 'good',
                    title: 'Good',
                    actions: [{ label: 'Go', action: { type: 'openMessage', messageId: 'next' } }],
                },
            ],
        });
        expect(flag.messages.map(message => message.id)).toEqual(['good']);
        expect(invalid).toHaveLength(1);
    });
});

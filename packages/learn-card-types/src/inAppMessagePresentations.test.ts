import { describe, expect, it } from 'vitest';
import { inAppMessageValidator, parseInAppMessagesFlagWithErrors } from './inAppMessages';

describe('rich message schema', () => {
    it('defaults iframe internal navigation to denied and preserves explicit destinations', () => {
        const draft = {
            id: 'frame',
            title: 'Guide',
            presentation: 'iframe',
            iframe: { url: 'https://example.com' },
        };
        expect(inAppMessageValidator.parse(draft).iframe?.allowedInternalPaths).toEqual([]);
        const paths = ['/passport', '/passport?tab=skills#recent'];
        expect(
            inAppMessageValidator.parse({
                ...draft,
                iframe: { ...draft.iframe, allowedInternalPaths: paths },
            }).iframe?.allowedInternalPaths
        ).toEqual(paths);
        for (const path of [
            'https://example.com',
            '//example.com',
            '/\\example.com',
            '/passport\n',
        ]) {
            expect(
                inAppMessageValidator.safeParse({
                    ...draft,
                    iframe: { ...draft.iframe, allowedInternalPaths: [path] },
                }).success
            ).toBe(false);
        }
    });
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
        { actions: [] },
        { actions: [{ label: 'Open', action: { type: 'internalLink', path: '/home' } }] },
    ])(
        'rejects non-final action overrides without discarding other campaigns: %j',
        ({ actions }) => {
            const result = parseInAppMessagesFlagWithErrors({
                messages: [
                    {
                        id: 'bad-actions',
                        title: 'Story',
                        presentation: 'story',
                        steps: [{ title: 'First', actions }, { title: 'Last' }],
                    },
                    {
                        id: 'valid-actions',
                        title: 'Story',
                        presentation: 'story',
                        steps: [{ title: 'First' }, { title: 'Last', actions }],
                    },
                ],
            });
            expect(result.flag.messages.map(message => message.id)).toEqual(['valid-actions']);
            expect(result.invalid).toHaveLength(1);
            expect(result.invalid[0]?.error).toContain('Only the final story screen');
        }
    );
    it('validates positional step action translations', () => {
        const draft = {
            id: 'localized',
            title: 'Story',
            locales: {
                es: { steps: [null, { actionLabels: ['Listo', null, ''] }] },
            },
        };
        expect(inAppMessageValidator.parse(draft).locales?.es?.steps?.[1]?.actionLabels).toEqual([
            'Listo',
            null,
            '',
        ]);
        expect(
            inAppMessageValidator.safeParse({
                ...draft,
                locales: {
                    es: { steps: [{ actionLabels: [42] }] },
                },
            }).success
        ).toBe(false);
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

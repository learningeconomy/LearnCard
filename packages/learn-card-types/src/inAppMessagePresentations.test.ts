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
    it('requires iframe configuration and bounds its timeout', () => {
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

        expect(
            inAppMessageValidator.parse({
                id: 'frame',
                title: 'Hello',
                presentation: 'iframe',
                iframe: { url: 'https://example.com', loadTimeoutMs: 30000 },
            }).iframe?.loadTimeoutMs
        ).toBe(30000);

        for (const loadTimeoutMs of [0, -1, 1.5, 30001, Number.NaN, Number.POSITIVE_INFINITY]) {
            expect(
                inAppMessageValidator.safeParse({
                    id: 'frame',
                    title: 'Hello',
                    presentation: 'iframe',
                    iframe: { url: 'https://example.com', loadTimeoutMs },
                }).success
            ).toBe(false);
        }
    });
    it.each([
        ['modal', { steps: [{ title: 'Unused' }] }],
        ['modal', { iframe: { url: 'https://example.com' } }],
        ['banner', { steps: [] }],
        ['toast', { iframe: { url: 'https://example.com' } }],
        ['story', { steps: [{ title: 'Story' }], iframe: { url: 'https://example.com' } }],
        ['iframe', { iframe: { url: 'https://example.com' }, steps: [] }],
    ])('rejects %s messages with incompatible presentation fields', (presentation, fields) => {
        expect(
            inAppMessageValidator.safeParse({
                id: 'mixed',
                title: 'Mixed',
                presentation,
                ...fields,
            }).success
        ).toBe(false);
    });
    it('preserves modal defaults while rejecting mixed default-modal fields', () => {
        expect(inAppMessageValidator.parse({ id: 'old', title: 'Hello' }).presentation).toBe(
            'modal'
        );
        expect(
            inAppMessageValidator.safeParse({
                id: 'mixed-default',
                title: 'Hello',
                steps: [{ title: 'Unused' }],
                iframe: { url: 'https://example.com' },
            }).success
        ).toBe(false);
    });
    it.each([
        ['missing message actions', {}],
        ['empty message actions', { actions: [] }],
        [
            'closeOnComplete false',
            {
                actions: [
                    {
                        label: 'Stay here',
                        action: { type: 'dismiss' },
                        closeOnComplete: false,
                    },
                ],
            },
        ],
        ['a Capgo action', { actions: [{ label: 'Update', action: { type: 'capgoUpdate' } }] }],
        [
            'an app-store action that can no-op',
            { actions: [{ label: 'Store', action: { type: 'appStore' } }] },
        ],
    ])('preserves legacy required modals with %s', (_label, fields) => {
        expect(
            inAppMessageValidator.safeParse({
                id: 'required-modal',
                title: 'Required',
                dismissible: false,
                ...fields,
            }).success
        ).toBe(true);
    });
    it.each([
        { label: 'Done', action: { type: 'dismiss' } },
        { label: 'Continue', action: { type: 'internalLink', path: '/wallet' } },
        { label: 'Learn more', action: { type: 'externalLink', url: 'https://example.com' } },
    ])('accepts required modals with a guaranteed closing action: $action.type', action => {
        expect(
            inAppMessageValidator.safeParse({
                id: 'required-modal',
                title: 'Required',
                dismissible: false,
                actions: [action],
            }).success
        ).toBe(true);
    });
    it.each(['appStore', 'capgoUpdate'])('retains legacy force-update campaigns: %s', type => {
        const result = parseInAppMessagesFlagWithErrors({
            messages: [
                {
                    id: 'force-update',
                    title: 'Update required',
                    presentation: 'modal',
                    dismissible: false,
                    actions: [{ label: 'Update', action: { type } }],
                },
            ],
        });
        expect(result.invalid).toEqual([]);
        expect(result.flag.messages).toHaveLength(1);
        expect(result.flag.messages[0]?.actions[0]?.action.type).toBe(type);
    });
    it('validates the effective final-screen actions for required stories', () => {
        const requiredStory = {
            id: 'required-story',
            title: 'Required',
            presentation: 'story',
            dismissible: false,
        } as const;

        for (const draft of [
            { ...requiredStory, steps: [{ title: 'Final' }] },
            { ...requiredStory, actions: [], steps: [{ title: 'Final' }] },
            {
                ...requiredStory,
                actions: [{ label: 'Fallback', action: { type: 'dismiss' } }],
                steps: [{ title: 'Final', actions: [] }],
            },
            {
                ...requiredStory,
                steps: [
                    {
                        title: 'Final',
                        actions: [
                            {
                                label: 'Stay here',
                                action: { type: 'dismiss' },
                                closeOnComplete: false,
                            },
                        ],
                    },
                ],
            },
            {
                ...requiredStory,
                steps: [
                    {
                        title: 'Final',
                        actions: [{ label: 'Update', action: { type: 'capgoUpdate' } }],
                    },
                ],
            },
        ]) {
            expect(inAppMessageValidator.safeParse(draft).success).toBe(false);
        }

        expect(
            inAppMessageValidator.safeParse({
                ...requiredStory,
                actions: [{ label: 'Done', action: { type: 'dismiss' } }],
                steps: [{ title: 'Final' }],
            }).success
        ).toBe(true);
        expect(
            inAppMessageValidator.safeParse({
                ...requiredStory,
                actions: [],
                steps: [
                    {
                        title: 'Final',
                        actions: [
                            {
                                label: 'Continue',
                                action: { type: 'internalLink', path: '/wallet' },
                            },
                        ],
                    },
                ],
            }).success
        ).toBe(true);
    });
    it('requires a closing navigation action for required stories', () => {
        const draft = {
            id: 'required-navigation',
            title: 'Continue',
            presentation: 'story',
            dismissible: false,
            steps: [{ title: 'Final' }],
        };
        for (const [action, closeOnComplete, expected] of [
            [{ type: 'openMessage', messageId: 'next' }, true, true],
            [{ type: 'openMessage', messageId: 'next' }, false, false],
            [{ type: 'openApp', listingId: 'app' }, true, false],
        ] as const) {
            expect(
                inAppMessageValidator.safeParse({
                    ...draft,
                    actions: [{ label: 'Continue', action, closeOnComplete }],
                }).success
            ).toBe(expected);
        }
    });
    it.each(['modal', 'story'] as const)(
        'allows dismissible %s messages without closing actions',
        presentation => {
            expect(
                inAppMessageValidator.safeParse({
                    id: `optional-${presentation}`,
                    title: 'Optional',
                    presentation,
                    actions: [
                        {
                            label: 'Stay here',
                            action: { type: 'dismiss' },
                            closeOnComplete: false,
                        },
                    ],
                    ...(presentation === 'story' ? { steps: [{ title: 'Final' }] } : {}),
                }).success
            ).toBe(true);
        }
    );
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

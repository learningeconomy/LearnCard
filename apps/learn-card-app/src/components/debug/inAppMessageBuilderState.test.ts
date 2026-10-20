import { inAppMessageValidator } from '@learncard/types';
import {
    buildDraftJson,
    emptyCondition,
    initialState,
    messageToBuilderState,
    remapStoryScreens,
} from './inAppMessageBuilderState';
import { IN_APP_MESSAGE_TEMPLATES } from './inAppMessageTemplates';

describe('message builder raw targeting validation', () => {
    describe.each([false, true])('negate: %s', negate => {
        it.each(['null', 'false', '0', '""', 'true', '1', '"learner"', '[]', '{}', '{'])(
            'keeps invalid raw predicate %s from becoming absent targeting',
            value => {
                const draft = buildDraftJson({
                    ...initialState,
                    title: 'Invalid raw targeting',
                    conditions: [{ ...emptyCondition(), kind: 'raw', value, negate }],
                });

                expect(draft).toHaveProperty('targeting');
                expect(inAppMessageValidator.safeParse(draft).success).toBe(false);
            }
        );

        it.each(['all', 'any'] as const)(
            'keeps an invalid raw predicate in a combined %s condition',
            combinator => {
                const draft = buildDraftJson({
                    ...initialState,
                    title: 'Combined invalid raw targeting',
                    combinator,
                    conditions: [
                        { ...emptyCondition(), kind: 'raw', value: 'null', negate },
                        { ...emptyCondition(), kind: 'role', roles: 'learner' },
                    ],
                });

                expect(draft.targeting).toEqual({
                    [combinator]: [
                        negate
                            ? { not: { invalid: 'Invalid targeting JSON' } }
                            : { invalid: 'Invalid targeting JSON' },
                        { role: ['learner'] },
                    ],
                });
                expect(inAppMessageValidator.safeParse(draft).success).toBe(false);
            }
        );
    });

    it('leaves targeting absent when no conditions are configured', () => {
        const draft = buildDraftJson({ ...initialState, title: 'Untargeted message' });

        expect(draft).not.toHaveProperty('targeting');
        expect(inAppMessageValidator.safeParse(draft).success).toBe(true);
    });
});

describe('message builder credential round-trip', () => {
    it('keeps translations attached when removing or reordering screens', () => {
        const state = {
            ...initialState,
            steps: [{ title: 'One' }, { title: 'Two' }],
            localesJson: JSON.stringify({ es: { steps: [{ title: 'Uno' }, { title: 'Dos' }] } }),
        };
        const reordered = remapStoryScreens(state, [1, 0]);
        expect(reordered.steps.map(step => step.title)).toEqual(['Two', 'One']);
        expect(
            JSON.parse(reordered.localesJson).es.steps.map((step: { title: string }) => step.title)
        ).toEqual(['Dos', 'Uno']);
        expect(JSON.parse(remapStoryScreens(state, [1]).localesJson).es.steps).toEqual([
            { title: 'Dos' },
        ]);
    });
    it('preserves action completion policy and store overrides on import/export', () => {
        const message = inAppMessageValidator.parse({
            id: 'action',
            title: 'Store',
            actions: [
                {
                    label: 'Open',
                    closeOnComplete: false,
                    action: { type: 'appStore', iosUrl: 'https://example.com/ios' },
                },
            ],
        });
        expect(
            inAppMessageValidator.parse(buildDraftJson(messageToBuilderState(message))).actions
        ).toEqual(message.actions);
    });
    it.each(
        IN_APP_MESSAGE_TEMPLATES.filter(template =>
            ['story-test', 'iframe-test'].includes(template.key)
        )
    )('round-trips rich template $key', template => {
        const message = inAppMessageValidator.parse(template.json);
        const restored = inAppMessageValidator.parse(
            buildDraftJson(messageToBuilderState(message))
        );
        expect(restored.steps).toEqual(message.steps);
        expect(restored.iframe).toEqual(message.iframe);
        expect(restored.locales).toEqual(message.locales);
    });
    it('keeps invalid locale JSON invalid rather than silently dropping it', () => {
        expect(
            inAppMessageValidator.safeParse(buildDraftJson({ ...initialState, localesJson: '{' }))
                .success
        ).toBe(false);
    });
    it('round-trips exact iframe navigation destinations without broadening them', () => {
        const message = inAppMessageValidator.parse({
            id: 'allowed-paths',
            title: 'Guide',
            presentation: 'iframe',
            iframe: {
                url: 'https://example.com',
                allowedInternalPaths: ['/passport', '/passport?tab=skills#recent'],
            },
        });
        const state = messageToBuilderState(message);
        expect(state.iframeAllowedInternalPaths).toBe('/passport\n/passport?tab=skills#recent');
        expect(inAppMessageValidator.parse(buildDraftJson(state)).iframe).toEqual(message.iframe);
        expect(
            inAppMessageValidator.safeParse(
                buildDraftJson({ ...state, iframeAllowedInternalPaths: ' /passport' })
            ).success
        ).toBe(false);
    });
    it('keeps final-screen action translations on builder import/export', () => {
        const message = inAppMessageValidator.parse({
            id: 'localized-step',
            title: 'Story',
            presentation: 'story',
            steps: [
                { title: 'First' },
                { title: 'Final', actions: [{ label: 'Done', action: { type: 'dismiss' } }] },
            ],
            locales: { es: { steps: [null, { actionLabels: ['Listo', null] }] } },
        });
        const restored = inAppMessageValidator.parse(
            buildDraftJson(messageToBuilderState(message))
        );
        expect(restored.locales).toEqual(message.locales);
        expect(restored.steps).toEqual(message.steps);
        const state = messageToBuilderState(message);
        const reordered = { ...state, ...remapStoryScreens(state, [1, 0]) };
        expect(JSON.parse(reordered.localesJson).es.steps[0].actionLabels).toEqual(['Listo', null]);
        expect(inAppMessageValidator.safeParse(buildDraftJson(reordered)).success).toBe(false);
    });
    it('omits claim filters after changing a claim template to app.opened', () => {
        const template = IN_APP_MESSAGE_TEMPLATES.find(
            candidate => candidate.key === 'clr-claim-celebration-example'
        );
        const message = inAppMessageValidator.parse(template?.json);
        const state = messageToBuilderState(message);
        state.triggerEvent = 'app.opened';

        const draft = buildDraftJson(state);
        expect(draft.trigger).toEqual({
            event: 'app.opened',
            windowMinutes: message.trigger?.windowMinutes,
        });
        expect(inAppMessageValidator.safeParse(draft).success).toBe(true);

        state.triggerEvent = 'credential.claimed';
        expect(buildDraftJson(state).trigger).toEqual(message.trigger);
    });

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

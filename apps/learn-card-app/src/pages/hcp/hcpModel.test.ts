import { describe, expect, it } from 'vitest';
import type { HcpEntry, HcpEvent } from 'learn-card-base/hcp/useHcp';

import {
    activitySentence,
    appNames,
    categoryName,
    groupEntries,
    READ_DENIED_EVENT,
} from './hcpModel';

const entry = (id: string, categories: string[]): HcpEntry =>
    ({
        id,
        classification: { categories, dimension: null },
        content: { profile: 'p', value: id },
        record: { status: 'active', version: 1 },
    }) as unknown as HcpEntry;

const event = (overrides: Partial<HcpEvent>): HcpEvent => ({
    eventId: 'urn:uuid:1',
    eventType: 'grant.issued',
    timestamp: '2026-11-17T20:00:00.000Z',
    participants: {
        initiator: { role: 'management-client', id: 'did:key:me' },
        authorizingPrincipal: { id: 'did:key:me' },
        provider: { id: 'did:web:brain' },
    },
    entryId: null,
    categories: [],
    purpose: null,
    purposeDescription: null,
    grantId: 'grant-1',
    data: {},
    ...overrides,
});

describe('HCP entry grouping', () => {
    it('groups registered categories in registry order and custom ones by plain name', () => {
        const groups = groupEntries([
            entry('custom-z', ['https://tutor.example/categories/zebra-facts']),
            entry('goal', ['goals_and_constraints']),
            entry('pref-1', ['general_preferences']),
            entry('custom-a', ['https://tutor.example/categories/study_habits']),
            entry('pref-2', ['general_preferences', 'work_context']),
        ]);

        expect(groups.map(group => [group.name, group.entries.map(item => item.id)])).toEqual([
            ['Preferences', ['pref-1', 'pref-2']],
            ['Goals', ['goal']],
            ['Study habits', ['custom-a']],
            ['Zebra facts', ['custom-z']],
        ]);
    });

    it('names custom categories by their last path segment', () => {
        expect(categoryName('https://tutor.example/categories/readingLevel')).toBe('Reading level');
        expect(categoryName('https://tutor.example')).toBe('Tutor.example');
    });
});

describe('HCP activity sentences', () => {
    const names = new Map([['grant-1', 'Demo Tutor']]);

    it('says what the person did', () => {
        expect(
            activitySentence(
                event({ categories: ['goals_and_constraints', 'education_learner_profile'] }),
                names
            )
        ).toBe('You let Demo Tutor see your Goals and Learning');
        expect(activitySentence(event({ eventType: 'grant.revoked' }), names)).toBe(
            'You stopped sharing with Demo Tutor'
        );
        expect(
            activitySentence(
                event({
                    eventType: 'context.created',
                    grantId: null,
                    categories: ['work_context'],
                }),
                names
            )
        ).toBe('You added info to Work');
    });

    it('says what an app did, and when access ended', () => {
        const byApp = {
            participants: {
                initiator: { role: 'context-client' as const, id: 'did:key:tutor' },
                authorizingPrincipal: { id: 'did:key:me' },
                provider: { id: 'did:web:brain' },
            },
        };
        expect(
            activitySentence(
                event({
                    ...byApp,
                    eventType: 'context.revised',
                    categories: ['general_preferences'],
                }),
                names
            )
        ).toBe('Demo Tutor updated your Preferences');
        expect(activitySentence(event({ ...byApp, eventType: 'grant.revoked' }), names)).toBe(
            'Demo Tutor stopped using your info'
        );
        expect(
            activitySentence(event({ eventType: 'grant.expired', grantId: 'gone' }), names)
        ).toBe('Sharing with An app ended');
    });

    it('says what an app saw, where it found nothing, and when it was refused (LC-2422)', () => {
        const byApp = {
            participants: {
                initiator: { role: 'context-client' as const, id: 'did:key:tutor' },
                authorizingPrincipal: { id: 'did:key:me' },
                provider: { id: 'did:web:brain' },
                retrievalId: 'urn:uuid:r1',
            },
        };
        expect(
            activitySentence(
                event({
                    ...byApp,
                    eventType: 'context.read',
                    categories: ['goals_and_constraints', 'education_learner_profile'],
                    disclosed: [{ entryId: 'urn:uuid:e1', version: 1 }],
                }),
                names
            )
        ).toBe('Demo Tutor saw your Goals and Learning');
        expect(
            activitySentence(
                event({
                    ...byApp,
                    eventType: 'context.read',
                    categories: [],
                    disclosed: [],
                    data: { categoriesSearched: ['goals_and_constraints'] },
                }),
                names
            )
        ).toBe('Demo Tutor looked in your Goals and found nothing');
        expect(activitySentence(event({ ...byApp, eventType: READ_DENIED_EVENT }), names)).toBe(
            "Demo Tutor asked for info it isn't allowed to see and got nothing"
        );
        expect(
            activitySentence(
                event({
                    ...byApp,
                    eventType: READ_DENIED_EVENT,
                    data: { reason: 'outside-grant' },
                }),
                names
            )
        ).toBe("Demo Tutor asked for info it isn't allowed to see and got nothing");
        expect(
            activitySentence(
                event({
                    ...byApp,
                    eventType: READ_DENIED_EVENT,
                    data: { reason: 'not-grant-client' },
                }),
                names
            )
        ).toBe("An app you haven't shared with tried to use Demo Tutor's access and got nothing");
        expect(
            activitySentence(
                event({ eventType: 'context.read', grantId: null, categories: ['work_context'] }),
                names
            )
        ).toBe('You looked up your info');
    });

    it('learns app names from grant.issued events', () => {
        const issuedNames = appNames(
            [],
            [event({ grantId: 'g2', data: { client: { name: 'Coach' } } })]
        );
        expect(issuedNames.get('g2')).toBe('Coach');
    });
});

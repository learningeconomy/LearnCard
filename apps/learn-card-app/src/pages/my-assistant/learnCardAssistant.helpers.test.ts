import { describe, expect, it } from 'vitest';

import type { LearnCardAssistantCard } from './learnCardAssistant.api';
import {
    getActivityCards,
    formatLearnCardAssistantNextRun,
    getInboxCards,
    getLearnCardAssistantCardTypeClasses,
    getLearnCardAssistantCardTypeLabel,
    getLearnCardAssistantCtaAction,
    getLearnCardAssistantDaysSummary,
    getLearnCardAssistantTimezoneOptions,
    LEARNCARD_ASSISTANT_DAY_LABELS,
    isLearnCardAssistantCardNew,
} from './learnCardAssistant.helpers';

const createCard = (overrides: Partial<LearnCardAssistantCard>): LearnCardAssistantCard => ({
    id: overrides.id ?? 'card-1',
    ownerDid: 'did:key:user',
    origin: 'interactive',
    type: overrides.type ?? 'message',
    title: 'Title',
    description: 'Description',
    priority: 'normal',
    createdAt: overrides.createdAt ?? '2026-06-18T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-06-18T12:00:00.000Z',
    ...overrides,
});

describe('learnCardAssistant helpers', () => {
    it('maps card type labels', () => {
        expect(getLearnCardAssistantCardTypeLabel('message')).toBe('Message');
        expect(getLearnCardAssistantCardTypeLabel('job-suggestion')).toBe('Job suggestion');
        expect(getLearnCardAssistantCardTypeLabel('pathway-update')).toBe('Pathway update');
        expect(getLearnCardAssistantCardTypeLabel('action-item')).toBe('Action item');
    });

    it('uses allowed token classes only', () => {
        const classes = [
            getLearnCardAssistantCardTypeClasses('message'),
            getLearnCardAssistantCardTypeClasses('job-suggestion'),
            getLearnCardAssistantCardTypeClasses('pathway-update'),
            getLearnCardAssistantCardTypeClasses('action-item'),
        ].join(' ');

        expect(classes).not.toContain('gray-');
        expect(classes).not.toContain('blue-');
        expect(classes).not.toContain('purple-');
    });

    it('detects CTA action kinds', () => {
        expect(getLearnCardAssistantCtaAction('/chats')).toEqual({
            kind: 'internal',
            href: '/chats',
        });
        expect(getLearnCardAssistantCtaAction('https://example.com')).toEqual({
            kind: 'external',
            href: 'https://example.com',
        });
    });

    it('filters unread inbox cards newest first', () => {
        const cards = [
            createCard({ id: 'old-unread', createdAt: '2026-06-18T10:00:00.000Z' }),
            createCard({
                id: 'read',
                createdAt: '2026-06-18T12:00:00.000Z',
                readAt: '2026-06-18T12:05:00.000Z',
            }),
            createCard({ id: 'new-unread', createdAt: '2026-06-18T13:00:00.000Z' }),
        ];

        expect(getInboxCards(cards).map(card => card.id)).toEqual(['new-unread', 'old-unread']);
    });

    it('returns all activity cards newest first', () => {
        const cards = [
            createCard({ id: 'older', createdAt: '2026-06-18T10:00:00.000Z' }),
            createCard({ id: 'newer', createdAt: '2026-06-18T13:00:00.000Z' }),
        ];

        expect(getActivityCards(cards).map(card => card.id)).toEqual(['newer', 'older']);
    });

    it('detects newness by readAt', () => {
        expect(isLearnCardAssistantCardNew(createCard({ readAt: undefined }))).toBe(true);
        expect(
            isLearnCardAssistantCardNew(createCard({ readAt: '2026-06-18T12:05:00.000Z' }))
        ).toBe(false);
    });
    it('labels and summarizes schedule days', () => {
        expect(LEARNCARD_ASSISTANT_DAY_LABELS[0]).toEqual({
            short: 'Sun',
            long: 'Sunday',
        });
        expect(getLearnCardAssistantDaysSummary([6, 0, 1, 2, 3, 4, 5])).toBe('Every day');
        expect(getLearnCardAssistantDaysSummary([5, 1, 4, 2, 3])).toBe('Weekdays');
        expect(getLearnCardAssistantDaysSummary([6, 0])).toBe('Weekends');
        expect(getLearnCardAssistantDaysSummary([1, 3, 5])).toBe('Mon, Wed, Fri');
    });

    it('falls back to only the resolved browser timezone', () => {
        expect(getLearnCardAssistantTimezoneOptions('America/Los_Angeles', null)).toEqual([
            'America/Los_Angeles',
        ]);
        expect(
            getLearnCardAssistantTimezoneOptions('America/Los_Angeles', () => ['America/New_York'])
        ).toEqual(['America/Los_Angeles', 'America/New_York']);
    });

    it('formats the next run in the schedule timezone', () => {
        expect(formatLearnCardAssistantNextRun('2026-07-16T14:30:00.000Z', 'UTC')).toBe(
            'Next run Thu, Jul 16, 2:30 PM'
        );
        expect(formatLearnCardAssistantNextRun('not-a-date', 'UTC')).toBe('Next run unavailable');
    });
});

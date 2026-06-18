import { describe, expect, it } from 'vitest';

import type { LearnCardAssistantCard } from './learnCardAssistant.api';
import {
    getActivityCards,
    getInboxCards,
    getLearnCardAssistantCardTypeClasses,
    getLearnCardAssistantCardTypeLabel,
    getLearnCardAssistantCtaAction,
    isLearnCardAssistantCardNew,
} from './learnCardAssistant.helpers';

const createCard = (overrides: Partial<LearnCardAssistantCard>): LearnCardAssistantCard => ({
    id: overrides.id ?? 'card-1',
    ownerDid: 'did:key:user',
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
});

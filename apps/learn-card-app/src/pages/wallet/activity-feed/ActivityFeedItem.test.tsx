vi.mock('learn-card-base', async () =>
    (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()
);
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { ActivityFeedItem } from './ActivityFeedItem';
import type { ActivityFeedItemVM } from './activityFeed.helpers';

const vm = (over: Partial<ActivityFeedItemVM> = {}): ActivityFeedItemVM => ({
    id: 'a1',
    direction: 'sent',
    actorName: 'You',
    counterpartyName: 'Justin Smith',
    category: CredentialCategoryEnum.socialBadge,
    title: 'You sent a Badge to Justin Smith',
    credentialType: 'Coding 101',
    timestamp: '2026-06-23T10:00:00Z',
    unread: false,
    ...over,
});

describe('ActivityFeedItem', () => {
    it('renders the title and credential type', () => {
        const { getByText } = render(<ActivityFeedItem item={vm()} />);
        expect(getByText('You sent a Badge to Justin Smith')).toBeTruthy();
        expect(getByText(/Coding 101/)).toBeTruthy();
    });
    it('renders a formatted short date', () => {
        const { getByText } = render(<ActivityFeedItem item={vm()} />);
        expect(getByText('Jun 23')).toBeTruthy();
    });
    it('applies the unread background when unread', () => {
        const { container } = render(<ActivityFeedItem item={vm({ unread: true })} />);
        expect(container.querySelector('[data-unread="true"]')).toBeTruthy();
    });
});

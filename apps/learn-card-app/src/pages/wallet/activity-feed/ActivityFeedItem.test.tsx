vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    UserProfilePicture: () => null,
}));
// Category icon comes from the theme store; stub it so the row renders without a
// ThemeProvider (this test only cares about the title/date/unread rendering).
vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({ getThemedCategory: () => ({ icons: {} }) }),
}));
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CredentialCategoryEnum } from 'learn-card-base';
import { ActivityFeedItem } from './ActivityFeedItem';
import type { ActivityFeedItemVM } from './activityFeed.helpers';

const vm = (over: Partial<ActivityFeedItemVM> = {}): ActivityFeedItemVM => ({
    id: 'a1',
    direction: 'sent',
    actorName: 'You',
    counterpartyName: 'Justin Smith',
    category: CredentialCategoryEnum.socialBadge,
    categoryLabel: 'Badge',
    isGenericCredential: false,
    isSelf: false,
    statusLabel: 'Sent',
    statusTone: 'neutral',
    lifecycleStatus: 'active',
    title: 'You sent a Badge to Justin Smith',
    titleLead: 'You sent a Badge to',
    titleSubject: 'Justin Smith',
    credentialType: 'Coding 101',
    timestamp: '2026-06-23T10:00:00Z',
    unread: false,
    avatar: { displayName: 'Justin Smith', profileId: 'justin' },
    ...over,
});

describe('ActivityFeedItem', () => {
    it('renders the title (lead + de-emphasized recipient) and credential type', () => {
        const { getByText } = render(<ActivityFeedItem item={vm()} />);
        expect(getByText('You sent a Badge to')).toBeTruthy();
        expect(getByText('Justin Smith')).toBeTruthy();
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
    it('calls onSelect with the item when the row is clicked', () => {
        const onSelect = vi.fn();
        const item = vm();
        const { getByRole } = render(<ActivityFeedItem item={item} onSelect={onSelect} />);
        fireEvent.click(getByRole('button', { name: item.title }));
        expect(onSelect).toHaveBeenCalledWith(item);
    });
});

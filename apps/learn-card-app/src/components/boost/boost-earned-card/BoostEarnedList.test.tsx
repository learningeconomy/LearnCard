import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const host = vi.hoisted(() => ({
    search: 'first aid',
    collection: {
        records: [] as { uri: string; title: string }[],
        matches: [] as { uri: string; title: string }[],
        isComplete: false,
        isPending: false,
        isFetching: false,
        isError: false,
        hasNextPage: true,
        fetchNextPage: vi.fn(),
        retry: vi.fn(),
    },
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        learningHistory: 'Learning History',
        socialBadge: 'Social Badge',
        achievement: 'Achievement',
        qualifications: 'Qualifications',
        accomplishment: 'Accomplishment',
        workHistory: 'Work History',
        accommodation: 'Accommodation',
        id: 'ID',
        membership: 'Membership',
    },
    BoostPageViewMode: { Card: 'card' },
    CredentialListSkeleton: () => <div>Loading cards</div>,
    useCredentialCollection: () => host.collection,
}));
vi.mock('learn-card-base/stores/credentialSearchStore', () => ({
    default: { use: { isSearchActive: () => true, searchString: () => host.search } },
}));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => false }));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../main-subheader/MainSubHeader.types', () => ({
    credentialCategoryToSubheaderType: () => 'badge',
    SubheaderContentType: { badge: { bgColor: '' } },
}));
vi.mock('../../empty-placeholder/CategoryEmptyPlaceHolder', () => ({ default: () => null }));
vi.mock('./BoostEarnedCard', () => ({
    default: ({ record }: { record: { title: string } }) => <article>{record.title}</article>,
}));
import BoostEarnedList from './BoostEarnedList';

const List = () => (
    <BoostEarnedList
        category="Social Badge"
        viewMode={'list' as never}
        defaultImg=""
        title="Badges"
    />
);
beforeEach(() => {
    host.search = 'first aid';
    Object.assign(host.collection, {
        records: [],
        matches: [],
        isComplete: false,
        isPending: false,
        isFetching: false,
        isError: false,
        hasNextPage: true,
    });
});
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('earned collection search states', () => {
    it('does not claim absence while later pages or legacy content remain unchecked', () => {
        const { rerender } = render(<List />);
        expect(screen.queryByText(/No results titled/)).toBeNull();
        expect(screen.getByRole('status').textContent).toContain('Searching');
        host.collection.hasNextPage = false;
        rerender(<List />);
        expect(screen.queryByText(/No results titled/)).toBeNull();
        host.collection.isComplete = true;
        rerender(<List />);
        expect(screen.getByRole('status').textContent).toContain('No results titled');
    });
    it('retains found matches while searching and after a failure, with accessible recovery', () => {
        const match = { uri: 'first-aid', title: 'First aid training' };
        Object.assign(host.collection, { records: [match], matches: [match], isFetching: true });
        const { rerender } = render(<List />);
        expect(screen.getByRole('article').textContent).toBe('First aid training');
        Object.assign(host.collection, { isError: true, isFetching: false });
        rerender(<List />);
        expect(screen.getByRole('article').textContent).toBe('First aid training');
        expect(screen.getByRole('status').textContent).toContain('incomplete');
        const retry = screen.getByRole('button', { name: 'Retry loading credentials' });
        retry.focus();
        fireEvent.click(retry);
        expect(host.collection.retry).toHaveBeenCalledTimes(1);
        host.collection.isFetching = true;
        rerender(<List />);
        expect(document.activeElement).toBe(retry);
        fireEvent.click(retry);
        expect(host.collection.retry).toHaveBeenCalledTimes(1);
    });
    it('does not show an empty category for internal-only partial pages', () => {
        host.search = '';
        render(<List />);
        expect(screen.queryByText('No Badges yet.')).toBeNull();
        expect(screen.getByRole('button', { name: 'Continue loading' })).toBeTruthy();
    });
});

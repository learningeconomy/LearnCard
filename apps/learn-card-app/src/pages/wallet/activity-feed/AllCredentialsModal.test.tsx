import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const host = vi.hoisted(() => ({
    collection: {
        records: [] as { uri: string; title?: string; date?: string }[],
        isPending: false,
        isFetching: false,
        isComplete: false,
        isError: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
        retry: vi.fn(),
    },
}));
vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    useCredentialCollection: () => host.collection,
}));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => false }));
vi.mock('./PassportCredentialCard', () => ({
    default: ({ record }: { record: { title?: string } }) => <article>{record.title}</article>,
}));
import { AllCredentialsModal } from './AllCredentialsModal';

beforeEach(() =>
    Object.assign(host.collection, {
        records: [],
        isPending: false,
        isFetching: false,
        isComplete: false,
        isError: false,
        hasNextPage: false,
    })
);
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('All credentials states', () => {
    it('does not claim the collection is empty while an internal-only page is incomplete', () => {
        host.collection.hasNextPage = true;
        render(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.queryByText('Nothing in your passport yet.')).toBeNull();
        expect(screen.getByRole('status').textContent).toContain('More credentials are available');
        const continuation = screen.getByRole('button', { name: 'Load more credentials' });
        continuation.focus();
        fireEvent.click(continuation);
        expect(host.collection.fetchNextPage).toHaveBeenCalledTimes(1);
    });
    it('preserves cards and exposes a keyboard-reachable retry after later-page failure', () => {
        host.collection.records = [{ uri: 'a', title: 'First aid' }];
        host.collection.isError = true;
        const { rerender } = render(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.getByText('First aid')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toContain('incomplete');
        const retry = screen.getByRole('button', { name: 'Retry loading credentials' });
        retry.focus();
        fireEvent.click(retry);
        expect(host.collection.retry).toHaveBeenCalledTimes(1);
        Object.assign(host.collection, { isError: false, isComplete: true });
        rerender(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.getByText('First aid')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toContain('Collection complete');
        expect(screen.queryByRole('button', { name: 'Retry loading credentials' })).toBeNull();
    });
    it('distinguishes initial failure, initial loading and a truly empty completed collection', () => {
        host.collection.isPending = true;
        const { rerender } = render(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.getByRole('status').textContent).toContain('Loading credentials');
        Object.assign(host.collection, { isPending: false, isError: true });
        rerender(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.getByRole('status').textContent).toContain('could not be loaded');
        expect(screen.queryByText('Nothing in your passport yet.')).toBeNull();
        Object.assign(host.collection, { isError: false, isComplete: true });
        rerender(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.getByRole('status').textContent).toBe('Nothing in your passport yet.');
    });
    it('groups recent and historical records by their relative time', () => {
        host.collection.records = [
            { uri: 'a', title: 'Fresh', date: new Date().toISOString() },
            { uri: 'b', title: 'Old', date: '2019-06-15T12:00:00Z' },
        ];
        host.collection.isComplete = true;
        render(<AllCredentialsModal onClose={vi.fn()} />);
        expect(screen.getByText('Today')).toBeTruthy();
        expect(screen.getByText('2019')).toBeTruthy();
        expect(screen.getByText('Fresh')).toBeTruthy();
        expect(screen.getByText('Old')).toBeTruthy();
    });
});

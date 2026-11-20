import React from 'react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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

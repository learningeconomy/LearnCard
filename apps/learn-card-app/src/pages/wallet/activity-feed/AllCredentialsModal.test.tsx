import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const { credentialList } = vi.hoisted(() => ({ credentialList: { value: undefined as any } }));

vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    useGetCredentialList: () => ({
        data: credentialList.value,
        isPending: false,
        isFetching: false,
        hasNextPage: false,
        fetchNextPage: vi.fn(),
    }),
    categoryMetadata: {},
}));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => false }));
vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: ({ record }: { record: { title?: string } }) => (
        <div data-testid="card">{record.title}</div>
    ),
}));

import { AllCredentialsModal } from './AllCredentialsModal';

const isoDaysAgo = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

describe('AllCredentialsModal', () => {
    it('sections credentials by relative time and hides internal categories', () => {
        credentialList.value = {
            pages: [
                {
                    records: [
                        { uri: 'a', title: 'Fresh', category: 'Achievement', date: isoDaysAgo(0) },
                        {
                            uri: 'b',
                            title: 'Old',
                            category: 'Achievement',
                            date: '2019-06-15T12:00:00Z',
                        },
                        {
                            uri: 'h',
                            title: 'Hidden',
                            category: 'VerifiableData',
                            date: isoDaysAgo(0),
                        },
                    ],
                },
            ],
        };
        const { getByText, queryByText, getAllByTestId } = render(
            <AllCredentialsModal onClose={vi.fn()} />
        );
        expect(getByText('Today')).toBeTruthy();
        expect(getByText('2019')).toBeTruthy();
        expect(getByText('Fresh')).toBeTruthy();
        expect(getByText('Old')).toBeTruthy();
        expect(queryByText('Hidden')).toBeNull();
        expect(getAllByTestId('card').length).toBe(2);
    });

    it('shows an empty state when there are no credentials', () => {
        credentialList.value = { pages: [{ records: [] }] };
        const { getByText } = render(<AllCredentialsModal onClose={vi.fn()} />);
        expect(getByText('Nothing in your passport yet.')).toBeTruthy();
    });
});

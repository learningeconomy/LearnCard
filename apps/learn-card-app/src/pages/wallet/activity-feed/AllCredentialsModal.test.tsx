import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

const { credentialList, openOptions } = vi.hoisted(() => ({
    credentialList: { value: undefined as unknown },
    openOptions: vi.fn(),
}));

// Dynamic import avoids resolving the heavy learn-card-base barrel in this unit test.
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
    default: ({
        record,
        hideOptionsMenu,
    }: {
        record: { uri: string; title?: string };
        hideOptionsMenu?: boolean;
    }) => (
        <div data-testid="card">
            {record.title}
            {!hideOptionsMenu && (
                <button
                    type="button"
                    aria-label={`More options for ${record.title}`}
                    onClick={() => openOptions(record.uri)}
                />
            )}
        </div>
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

    it('opens credential options from the all credentials view', () => {
        credentialList.value = {
            pages: [
                {
                    records: [
                        {
                            uri: 'a',
                            title: 'Diploma',
                            category: 'Achievement',
                            date: isoDaysAgo(0),
                        },
                    ],
                },
            ],
        };

        const { getByRole } = render(<AllCredentialsModal onClose={vi.fn()} />);
        fireEvent.click(getByRole('button', { name: 'More options for Diploma' }));

        expect(openOptions).toHaveBeenCalledWith('a');
    });

    it('shows an empty state when there are no credentials', () => {
        credentialList.value = { pages: [{ records: [] }] };
        const { getByText } = render(<AllCredentialsModal onClose={vi.fn()} />);
        expect(getByText('Nothing in your passport yet.')).toBeTruthy();
    });
});

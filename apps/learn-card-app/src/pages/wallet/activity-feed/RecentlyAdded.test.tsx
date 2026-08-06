import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

type TestRecord = {
    uri: string;
    title?: string;
    category?: string;
    date?: string;
};

const { credentialList, openOptions } = vi.hoisted(() => ({
    credentialList: { value: undefined as unknown },
    openOptions: vi.fn(),
}));

// Dynamic import avoids resolving the heavy learn-card-base barrel in this unit test.
vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    useGetCredentialList: () => ({ data: credentialList.value }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: { FullScreen: 'full-screen' },
    categoryMetadata: {},
}));
// BoostEarnedCard and AllCredentialsModal are heavy (modal system, previews);
// stub them so this test stays focused on the strip's behavior.
vi.mock('../../../components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: ({
        record,
        hideOptionsMenu,
    }: {
        record: { uri: string; title?: string };
        hideOptionsMenu?: boolean;
    }) => (
        <div data-testid="recent-tile">
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
vi.mock('./AllCredentialsModal', () => ({ AllCredentialsModal: () => null }));

import { RecentlyAdded } from './RecentlyAdded';

const withRecords = (records: TestRecord[]) => {
    credentialList.value = { pages: [{ records }] };
};

describe('RecentlyAdded', () => {
    it('renders nothing when there are no records', () => {
        credentialList.value = undefined;
        const { container } = render(<RecentlyAdded />);
        expect(container.firstChild).toBeNull();
    });

    it('hides internal/system categories and renders the rest', () => {
        withRecords([
            { uri: 'a', title: 'Diploma', category: 'Achievement', date: '2026-06-10' },
            { uri: 'b', title: 'Hidden Data', category: 'VerifiableData', date: '2026-06-11' },
        ]);
        const { getByText, queryByText } = render(<RecentlyAdded />);
        expect(getByText('Diploma')).toBeTruthy();
        expect(queryByText('Hidden Data')).toBeNull();
    });

    it('opens credential options from the passport overview', () => {
        withRecords([{ uri: 'a', title: 'Diploma', category: 'Achievement', date: '2026-06-10' }]);

        const { getByRole } = render(<RecentlyAdded />);
        fireEvent.click(getByRole('button', { name: 'More options for Diploma' }));

        expect(openOptions).toHaveBeenCalledWith('a');
    });

    it('sorts newest-first and caps at five tiles', () => {
        withRecords(
            Array.from({ length: 7 }, (_, i) => ({
                uri: `u${i}`,
                title: `Cred ${i}`,
                category: 'Achievement',
                date: `2026-06-0${i}`,
            }))
        );
        const { getAllByTestId, getByText } = render(<RecentlyAdded />);
        expect(getAllByTestId('recent-tile').length).toBe(5);
        expect(getByText('Cred 6')).toBeTruthy();
        expect(() => getByText('Cred 0')).toThrow();
    });
});

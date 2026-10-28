import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const { credentialList } = vi.hoisted(() => ({ credentialList: { value: undefined as unknown } }));

vi.mock('learn-card-base', async () => ({
    ...(await (await import('../../../test-utils/mockLearnCardBase')).learnCardBaseEnumMock()),
    useGetCredentialList: () => ({ data: credentialList.value }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    ModalTypes: { FullScreen: 'full-screen' },
    categoryMetadata: {},
    UploadTypesEnum: {
        Resume: 'resume',
        Certificate: 'certificate',
        Transcript: 'transcript',
        Diploma: 'diploma',
    },
}));
// PassportCredentialCard includes query-backed title resolution and previews;
// stub it so this test stays focused on the strip's filter/sort/cap behavior.
vi.mock('./PassportCredentialCard', () => ({
    default: ({ record }: { record: { title?: string } }) => (
        <div data-testid="recent-tile">{record.title}</div>
    ),
}));
vi.mock('./AllCredentialsModal', () => ({ AllCredentialsModal: () => null }));

type TestRecord = {
    uri: string;
    title?: string;
    category?: string;
    date?: string;
};

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

    it('hides uploaded originals without filtering earned credentials by their title', () => {
        withRecords([
            { uri: 'original-resume', title: 'Uploaded résumé', category: 'resume' },
            { uri: 'original-certificate', title: 'Uploaded certificate', category: 'certificate' },
            { uri: 'original-transcript', title: 'Uploaded transcript', category: 'transcript' },
            { uri: 'original-diploma', title: 'Uploaded diploma', category: 'diploma' },
            { uri: 'earned', title: 'Raw Artifact', category: 'Achievement' },
            { uri: 'published-resume', title: 'Published résumé', category: 'Resume' },
        ]);
        const { getAllByTestId } = render(<RecentlyAdded />);
        expect(getAllByTestId('recent-tile').map(tile => tile.textContent)).toEqual([
            'Raw Artifact',
        ]);
    });

    it('renders nothing when every record is an uploaded original', () => {
        withRecords([{ uri: 'original', title: 'Raw Artifact', category: 'resume' }]);
        const { container } = render(<RecentlyAdded />);
        expect(container.firstChild).toBeNull();
    });

    it('filters originals across loaded pages before sorting and filling the five tiles', () => {
        credentialList.value = {
            pages: [
                {
                    records: [
                        {
                            uri: 'original',
                            title: 'Raw Artifact',
                            category: 'resume',
                            date: '2026-06-20',
                        },
                    ],
                },
                {
                    records: Array.from({ length: 7 }, (_, i) => ({
                        uri: `u${i}`,
                        title: `Cred ${i}`,
                        category: 'Achievement',
                        date: `2026-06-0${i + 1}`,
                    })),
                },
            ],
        };
        const { getAllByTestId } = render(<RecentlyAdded />);
        expect(getAllByTestId('recent-tile').map(tile => tile.textContent)).toEqual([
            'Cred 6',
            'Cred 5',
            'Cred 4',
            'Cred 3',
            'Cred 2',
        ]);
    });
});

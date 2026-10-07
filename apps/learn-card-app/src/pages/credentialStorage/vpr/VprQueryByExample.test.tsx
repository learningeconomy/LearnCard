import React from 'react';
import type { VC } from '@learncard/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    records: [] as { id: string; uri: string; category: string; title?: string }[],
    credentials: [] as { data?: VC; isLoading: boolean }[],
    hasNextPage: false,
    fetching: false,
    loading: false,
    fetch: vi.fn(),
    modal: vi.fn(),
    query: vi.fn(),
    reset: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
    ModalTypes: { FullScreen: 'fullscreen', Center: 'center' },
    useModal: () => ({ newModal: mocks.modal, closeModal: vi.fn() }),
    isVerifiableDataRecord: (record: { id: string }) => record.id.startsWith('__verifiable_data_'),
    useGetCredentialList: () => ({
        data: { pages: [{ records: mocks.records }] },
        isLoading: mocks.loading,
        error: null,
        hasNextPage: mocks.hasNextPage,
        isFetchingNextPage: mocks.fetching,
        fetchNextPage: mocks.fetch,
    }),
    useGetResolvedCredentials: () => mocks.credentials,
    chapiStore: { set: { isChapiInteraction: mocks.reset } },
    redirectStore: { set: { authRedirect: vi.fn() } },
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonIcon: () => null,
}));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ getThemedCategory: () => undefined }),
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('learn-card-base/helpers/credentials/ids', () => ({ getUniqueId: (vc: VC) => vc.id }));
vi.mock('learn-card-base/helpers/credentials/queries', () => ({
    queryListOfCredentials: mocks.query,
}));
vi.mock('../../../helpers/contract.helpers', () => ({
    isAiContractCategory: (category: string) => category === 'AiSession',
    isVerifiableDataContractCategory: (category: string) => category === 'PrivateData',
}));
vi.mock('../../../components/share-links/ShareCredentialThumbnail', () => ({
    ShareCredentialThumbnail: () => null,
}));
vi.mock('../../../components/share-links/ShareCredentialMetadata', () => ({
    ShareCredentialMetadata: () => null,
}));
vi.mock('../../../components/share-links/ShareCategoryFilter', () => ({
    ShareCategoryFilter: ({
        value,
        categories,
        onChange,
    }: {
        value: string;
        categories: string[];
        onChange: (value: string) => void;
    }) => (
        <select aria-label="Filter" value={value} onChange={event => onChange(event.target.value)}>
            <option value="">All</option>
            {categories.map(category => (
                <option key={category}>{category}</option>
            ))}
        </select>
    ),
}));
vi.mock('../VCToShare', () => ({ default: () => null }));
import VprQueryByExample from './VprQueryByExample';
const add = (id: string, name: string, category = 'Achievement') => {
    mocks.records.push({ id, uri: `credential:${id}`, category, title: name });
    mocks.credentials.push({ data: { id, name } as VC, isLoading: false });
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.records = [];
    mocks.credentials = [];
    mocks.hasNextPage = false;
    mocks.fetching = false;
    mocks.loading = false;
    mocks.query.mockImplementation((credentials: VC[]) => credentials.slice(0, 1));
    add('degree', 'University Diploma');
    add('badge', 'Leadership Badge', 'Social Badge');
});
describe('shared verifier credential picker', () => {
    it('keeps the selected batch across search and category filters and passes the original credentials to review', async () => {
        const onSubmit = vi.fn();
        render(<VprQueryByExample currentUser={null} onSubmit={onSubmit} />);
        fireEvent.click(screen.getByRole('checkbox', { name: 'University Diploma' }));
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'LEADERSHIP' } });
        expect(
            screen.queryByRole('checkbox', { name: 'University Diploma' })
        ).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('checkbox', { name: 'Leadership Badge' }));
        fireEvent.change(screen.getByRole('combobox', { name: 'Filter' }), {
            target: { value: 'Achievement' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'View selected' }));
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
        fireEvent.click(screen.getByRole('button', { name: 'Review' }));
        const review = mocks.modal.mock.calls[0][0] as React.ReactElement;
        expect(review.props.vcsToShare).toEqual(mocks.credentials.map(result => result.data));
        expect(review.props.onSubmit).toBe(onSubmit);
        expect(review.props.categoriesById).toEqual({
            degree: 'Achievement',
            badge: 'Social Badge',
        });
        fireEvent.click(screen.getByRole('button', { name: 'Deselect all' }));
        expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled();
    });
    it('suggests matching credentials once without including private/internal records', async () => {
        add('__verifiable_data_profile', 'Private salary');
        add('hidden', 'Hidden record', 'Hidden');
        add('ai', 'AI session', 'AiSession');
        add('contract', 'Private preferences', 'PrivateData');
        render(
            <VprQueryByExample
                currentUser={null}
                verifiablePresentationRequest={{ query: [{ type: 'QueryByExample' }] }}
            />
        );
        await waitFor(() =>
            expect(screen.getByRole('checkbox', { name: 'University Diploma' })).toBeChecked()
        );
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
        expect(mocks.query.mock.calls[0][0]).toEqual(
            mocks.credentials.slice(0, 2).map(result => result.data)
        );
        fireEvent.click(screen.getByRole('checkbox', { name: 'University Diploma' }));
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'diploma' } });
        expect(screen.getByRole('checkbox', { name: 'University Diploma' })).not.toBeChecked();
        expect(mocks.query).toHaveBeenCalledTimes(1);
    });
    it('fetches subsequent index pages during search without importing the link publication limit', async () => {
        mocks.records = [];
        mocks.credentials = [];
        for (let i = 0; i < 51; i++) add(`credential-${i}`, `Credential ${i}`);
        mocks.hasNextPage = true;
        mocks.query.mockImplementation((credentials: VC[]) => credentials);
        render(
            <VprQueryByExample
                currentUser={null}
                verifiablePresentationRequest={{ query: [{ type: 'QueryByExample' }] }}
            />
        );
        await waitFor(() =>
            expect(
                screen.getAllByRole('checkbox').every(input => (input as HTMLInputElement).checked)
            ).toBe(true)
        );
        expect(
            screen.getAllByRole('checkbox').every(input => !(input as HTMLInputElement).disabled)
        ).toBe(true);
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Credential 50' } });
        await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByRole('button', { name: 'Review' }));
        expect(mocks.modal.mock.calls[0][0].props.vcsToShare).toHaveLength(51);
    });
    it('keeps cancel available when there are no credentials', async () => {
        mocks.records = [];
        mocks.credentials = [];
        const respondWith = vi.fn();
        const onReject = vi.fn();
        render(
            <VprQueryByExample
                currentUser={null}
                event={{ respondWith } as never}
                onReject={onReject}
            />
        );
        expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(respondWith).toHaveBeenCalledTimes(1);
        await expect(respondWith.mock.calls[0][0]).resolves.toBeNull();
        expect(onReject).toHaveBeenCalledTimes(1);
    });
});

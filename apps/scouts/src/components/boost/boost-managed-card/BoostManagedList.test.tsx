// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    query: {
        data: undefined as
            { pages: Array<{ records: Array<{ uri: string; name: string }> }> } | undefined,
        isLoading: true,
        isFetching: false,
        refetch: vi.fn(),
        error: undefined as unknown,
    },
    searchActive: true,
    searchString: 'patch',
    onScreen: false,
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn() }) }));
vi.mock('@ionic/react', () => ({
    IonCol: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
        <div {...props}>{children}</div>
    ),
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonGrid: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => <div role="status" />,
}));
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => state.onScreen }));
vi.mock('learn-card-base/stores/credentialSearchStore', () => ({
    default: {
        use: { isSearchActive: () => state.searchActive, searchString: () => state.searchString },
    },
}));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../hooks/useBoostModal', () => ({
    default: () => ({ handlePresentBoostModal: vi.fn() }),
}));
vi.mock('learn-card-base/react-query/queries/queries', () => ({
    useResolveBoosts: (uris: string[] = []) =>
        [
            { uri: 'urn:patch', data: { name: 'Patch Trading Pro' } },
            { uri: 'urn:other', data: { name: 'Unmatched Credential' } },
            { uri: 'urn:page-two', data: { name: 'Patch Wilderness Guide' } },
        ].filter(boost => uris.includes(boost.uri)),
}));
// vi.mock factories are hoisted, so load React inside the factory for its state hook.
vi.mock('learn-card-base', async () => {
    const actual = (await vi.importActual('learn-card-base')) as Record<string, unknown>;
    const ReactRuntime = await import('react');
    return {
        ...actual,
        useGetPaginatedManagedBoosts: () => {
            const [pageIndex, setPageIndex] = ReactRuntime.useState(0);
            const pages = state.query.data?.pages ?? [];
            return {
                ...state.query,
                data: state.query.data
                    ? { ...state.query.data, pages: pages.slice(0, pageIndex + 1) }
                    : undefined,
                hasNextPage: pageIndex + 1 < pages.length,
                fetchNextPage: () => setPageIndex(index => index + 1),
            };
        },
        useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    };
});
vi.mock('./BoostManagedCard', () => ({
    default: ({ boost }: { boost: { name: string } }) => <article>{boost.name}</article>,
    BoostManagedCardSkeleton: () => <div data-testid="managed-card-skeleton" />,
}));
vi.mock('../../../components/boost/boostErrors/BoostErrorsDisplay', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/NewBoostButton', () => ({ default: () => null }));
vi.mock('../boost-select-menu/NewBoostSelectMenuOld', () => ({ default: () => null }));
vi.mock('../../main-subheader/MainSubHeader.types', () => ({
    credentialCategoryToSubheaderType: () => 'achievement',
    SubheaderContentType: { achievement: { bgColor: 'bg-blue' } },
}));

import { LocaleProvider, useChangeLocale } from '../../../i18n';
import * as m from '../../../paraglide/messages.js';
import { setLocale } from '../../../paraglide/runtime.js';
import { BoostPageViewMode, CredentialCategoryEnum } from 'learn-card-base';
import BoostManagedList from './BoostManagedList';

const LocaleSwitcher: React.FC = () => {
    const changeLocale = useChangeLocale();
    return <button onClick={() => changeLocale('fr')}>Switch to French</button>;
};

const renderList = () =>
    render(
        <LocaleProvider>
            <LocaleSwitcher />
            <BoostManagedList
                category={CredentialCategoryEnum.achievement}
                viewMode={BoostPageViewMode.Card}
                defaultImg=""
            />
        </LocaleProvider>
    );

describe('BoostManagedList localization runtime', () => {
    beforeEach(() => {
        localStorage.removeItem('i18n.language');
        setLocale('en', { reload: false });
        state.query = {
            data: undefined,
            isLoading: true,
            isFetching: false,
            refetch: vi.fn(),
            error: undefined,
        };
        state.searchActive = true;
        state.searchString = 'patch';
        state.onScreen = false;
    });

    afterEach(() => {
        cleanup();
    });

    it('updates the loaded managed-search status when the locale changes', () => {
        state.query = {
            ...state.query,
            data: {
                pages: [
                    {
                        records: [
                            { uri: 'urn:patch', name: 'Patch Trading Pro' },
                            { uri: 'urn:other', name: 'Unmatched Credential' },
                        ],
                    },
                ],
            },
            isLoading: false,
        };

        renderList();
        expect(
            screen.getByText(m['common.searchResults.foundOne']({ count: 1, query: 'patch' }))
        ).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Switch to French' }));

        expect(screen.getByText('Patch Trading Pro', { exact: true })).toBeTruthy();
        expect(screen.queryByText('Unmatched Credential', { exact: true })).toBeNull();
        expect(
            screen.getByText(m['common.searchResults.foundOne']({ count: 1, query: 'patch' }))
        ).toBeTruthy();
    });

    it('exposes the managed loading state through its translated accessible name', () => {
        renderList();

        expect(
            screen.getByRole('status', { name: m['common.searchResults.loadingManaged']() })
        ).toBeTruthy();
    });

    it('renders the next page when the managed-list sentinel is visible', () => {
        state.query = {
            ...state.query,
            data: {
                pages: [
                    { records: [{ uri: 'urn:patch', name: 'Patch Trading Pro' }] },
                    { records: [{ uri: 'urn:page-two', name: 'Patch Wilderness Guide' }] },
                ],
            },
            isLoading: false,
        };
        state.onScreen = true;

        renderList();

        expect(screen.getByText('Patch Trading Pro', { exact: true })).toBeTruthy();
        expect(screen.getByText('Patch Wilderness Guide', { exact: true })).toBeTruthy();
    });

    it('updates the empty managed-search status when the locale changes', () => {
        state.query = {
            ...state.query,
            data: { pages: [{ records: [] }] },
            isLoading: false,
        };

        renderList();
        fireEvent.click(screen.getByRole('button', { name: 'Switch to French' }));

        expect(
            screen.getByText(m['common.searchResults.noManaged']({ query: 'patch' }))
        ).toBeTruthy();
    });
});

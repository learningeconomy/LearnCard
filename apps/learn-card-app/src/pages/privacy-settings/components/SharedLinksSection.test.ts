import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ShareLink, VP } from '@learncard/types';

import type { DataSharingSharedLinksViewModel } from '../DataSharingCenter.types';
import SharedLinksSection, {
    getSharedLinkViewStatus,
    localDateValue,
    minimumExpiryDateValue,
} from './SharedLinksSection';
import { useSharedLinksStore } from './shared-links/sharedLinksStore';

const { modals, closeModalById } = vi.hoisted(() => ({
    modals: [] as React.ReactNode[],
    closeModalById: vi.fn(),
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon, ...rest }: Record<string, unknown>) => React.createElement('span', rest),
}));
vi.mock('qrcode.react', () => ({
    QRCodeSVG: ({ role, 'aria-label': ariaLabel }: { role?: string; 'aria-label'?: string }) =>
        React.createElement('img', { role, 'aria-label': ariaLabel }),
}));
vi.mock('learn-card-base', () => ({
    ModalTypes: { Center: 'center', BottomSheet: 'bottom-sheet', FullScreen: 'full-screen' },
    useModal: () => ({
        newModal: (node: React.ReactNode) => {
            modals.push(node);
            return modals.length - 1;
        },
        closeModal: vi.fn(),
        closeModalById,
    }),
}));

beforeEach(() => {
    modals.length = 0;
    closeModalById.mockClear();
});
afterEach(() => {
    cleanup();
    useSharedLinksStore.setState({ vm: null });
});

const share = {
    id: 'AAAAAAAAAAAAAAAAAAAAAA',
    title: 'Career highlights',
    selectedCount: 4,
    version: 1,
    contentVersion: 1,
    status: 'active',
    contentState: 'finalized',
    createdAt: '2026-09-12T14:30:00.000Z',
    updatedAt: '2026-09-12T14:30:00.000Z',
    expiresAt: null,
    stoppedAt: null,
    viewCount: 12,
    lastViewedAt: '2026-09-21T18:15:00.000Z',
    passcodeProtected: true,
    notifyOnView: false,
} as ShareLink;

const savedCollection = {
    uri: 'lc:network:localhost%3A4000:pres:one',
    shareId: 'AAAAAAAAAAAAAAAAAAAAAA',
    title: 'Career highlights',
    note: 'Selected credentials for applications',
    sharer: { profileId: 'sender', displayName: 'Alex Rivera' },
    receivedAt: '2026-09-24T16:00:00.000Z',
    credentialCount: 2,
    presentation: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [{}, {}],
        proof: { type: 'Ed25519Signature2020' },
    } as unknown as VP,
};

const viewModel = (overrides: Partial<DataSharingSharedLinksViewModel> = {}) => ({
    records: [share],
    filter: 'active' as const,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: false,
    busyId: null,
    pendingActions: {},
    showViewStats: true,
    savedCollections: {
        records: [savedCollection],
        isLoading: false,
        error: false,
        onRefresh: vi.fn(async () => undefined),
        onPreview: vi.fn(),
    },
    onFilterChange: vi.fn(),
    onRefresh: vi.fn(async () => undefined),
    onLoadMore: vi.fn(async () => undefined),
    onCopy: vi.fn(async () => true),
    onGetPrivateUrl: vi.fn(async () => 'https://example.com'),
    onChangeExpiry: vi.fn(async () => undefined),
    onStop: vi.fn(async () => undefined),
    onCheckPending: vi.fn(async () => undefined),
    onPreview: vi.fn(),
    onUpdate: vi.fn(),
    onCreateShare: vi.fn(),
    ...overrides,
});

const renderSection = (vm: DataSharingSharedLinksViewModel) => {
    const utils = render(React.createElement(SharedLinksSection, { vm }));
    return {
        ...utils,
        rerenderWith: (next: DataSharingSharedLinksViewModel) =>
            utils.rerender(React.createElement(SharedLinksSection, { vm: next })),
    };
};

/** Renders the most recently opened modal and scopes queries to it. */
const openTopSheet = () => {
    const { container } = render(React.createElement(React.Fragment, null, modals.at(-1)));
    return within(container);
};

/** The owner row button (not the copy button, not the received row with the same title). */
const linkRow = (title = 'Career highlights') =>
    within(screen.getByRole('list', { name: 'Your shared links' })).getByRole('button', {
        name: new RegExp(`^${title}`),
    });

const openDetail = (title = 'Career highlights') => {
    fireEvent.click(linkRow(title));
    return openTopSheet();
};

const many = (count: number, overrides: Partial<ShareLink> = {}) =>
    Array.from(
        { length: count },
        (_, index) =>
            ({
                ...share,
                id: `ID${String(index).padStart(20, '0')}`,
                title: `Link ${index}`,
                createdAt: new Date(2026, 8, index + 1).toISOString(),
                ...overrides,
            }) as ShareLink
    );

describe('store publishing', () => {
    it('publishes the live view model and clears it on unmount', () => {
        const vm = viewModel();
        const { rerenderWith, unmount } = renderSection(vm);
        expect(useSharedLinksStore.getState().vm).toBe(vm);

        const next = { ...vm, busyId: share.id };
        rerenderWith(next);
        expect(useSharedLinksStore.getState().vm).toBe(next);

        unmount();
        expect(useSharedLinksStore.getState().vm).toBeNull();
    });
});

describe('main list', () => {
    it('shows at most five active links, newest first, with View all', () => {
        renderSection(viewModel({ records: many(7) }));

        const list = screen.getByRole('list', { name: 'Your shared links' });
        const titles = within(list)
            .getAllByRole('button', { name: /^Link \d/ })
            .map(button => button.textContent?.match(/Link \d/)?.[0]);
        expect(titles).toEqual(['Link 6', 'Link 5', 'Link 4', 'Link 3', 'Link 2']);
        expect(screen.getByRole('button', { name: /View all 7/ })).toBeTruthy();
    });

    it('puts the sections under visible headings with a singular or plural active count', () => {
        const { rerenderWith } = renderSection(viewModel());
        expect(screen.getByRole('heading', { level: 3, name: 'Your shared links' })).toBeTruthy();
        expect(screen.getByRole('heading', { level: 3, name: 'Shared with you' })).toBeTruthy();
        expect(screen.getByText('1 active')).toBeTruthy();

        rerenderWith(viewModel({ records: many(3) }));
        expect(screen.getByText('3 active')).toBeTruthy();

        rerenderWith(viewModel({ records: [{ ...share, status: 'stopped' } as ShareLink] }));
        expect(screen.queryByText(/\d+ active/)).toBeNull();
    });

    it('keeps expired and stopped links reachable when nothing is active', () => {
        renderSection(viewModel({ records: [{ ...share, status: 'stopped' } as ShareLink] }));

        expect(screen.getByText(/All quiet/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /View all 1/ }));
        const sheet = openTopSheet();
        expect(sheet.getByRole('tablist', { name: 'Filter links' })).toBeTruthy();
    });

    it('opens View all on the first status with links instead of an empty Active tab', () => {
        const expired = { ...share, id: 'EXP', expiresAt: '2026-01-01T00:00:00.000Z' };
        const stopped = { ...share, id: 'STP', status: 'stopped' } as ShareLink;

        const first = viewModel({ records: [stopped, expired] });
        const { unmount } = renderSection(first);
        fireEvent.click(screen.getByRole('button', { name: /View all 2/ }));
        expect(first.onFilterChange).toHaveBeenCalledWith('expired');
        unmount();

        const second = viewModel({ records: [stopped] });
        renderSection(second);
        fireEvent.click(screen.getByRole('button', { name: /View all 1/ }));
        expect(second.onFilterChange).toHaveBeenCalledWith('stopped');
    });

    it('leaves the filter alone when it already fits', () => {
        const withActive = viewModel({ records: [...many(6)] });
        const { unmount } = renderSection(withActive);
        fireEvent.click(screen.getByRole('button', { name: /View all 6/ }));
        expect(withActive.onFilterChange).not.toHaveBeenCalled();
        unmount();

        const chosen = viewModel({
            records: [{ ...share, status: 'stopped' } as ShareLink],
            filter: 'expired',
        });
        renderSection(chosen);
        fireEvent.click(screen.getByRole('button', { name: /View all 1/ }));
        expect(chosen.onFilterChange).not.toHaveBeenCalled();
    });

    it('returns View all to Active once active links exist again', () => {
        const vm = viewModel({
            records: [...many(6), { ...share, id: 'STP', status: 'stopped' } as ShareLink],
            filter: 'expired',
        });
        renderSection(vm);
        fireEvent.click(screen.getByRole('button', { name: /View all 7/ }));
        expect(vm.onFilterChange).toHaveBeenCalledWith('active');
        expect(vm.onFilterChange).toHaveBeenCalledOnce();
    });

    it('adds a plus to View all when more pages exist', () => {
        renderSection(viewModel({ hasMore: true }));
        expect(screen.getByRole('button', { name: /View all 1\+/ })).toBeTruthy();
    });

    it('opens the share creator from New link', () => {
        const vm = viewModel();
        renderSection(vm);
        fireEvent.click(screen.getByRole('button', { name: 'New link' }));
        expect(vm.onCreateShare).toHaveBeenCalledOnce();
    });

    it('copies from the row without opening the sheet', async () => {
        const vm = viewModel();
        renderSection(vm);
        await act(async () => {
            fireEvent.click(
                screen.getByRole('button', { name: 'Copy link for Career highlights' })
            );
        });
        expect(vm.onCopy).toHaveBeenCalledWith(share);
        expect(modals).toHaveLength(0);
    });

    it('marks a passcode-protected link and summarizes it on one line', () => {
        renderSection(viewModel());
        const row = linkRow();
        expect(within(row).getByRole('img', { name: 'Passcode protected' })).toBeTruthy();
        expect(row.textContent).toContain('4 credentials');
        expect(row.textContent).toContain('Opened 12 times');
    });

    it('shows a pending change on the row', () => {
        renderSection(viewModel({ pendingActions: { [share.id]: 'stop' } }));
        expect(screen.getByText('Update in progress')).toBeTruthy();
    });

    it('keeps loaded rows and View all on a background error, with an inline retry', () => {
        const vm = viewModel({ records: many(7), error: true });
        renderSection(vm);

        const list = screen.getByRole('list', { name: 'Your shared links' });
        expect(within(list).getAllByRole('button', { name: /^Link \d/ })).toHaveLength(5);
        expect(within(list).getByRole('button', { name: /View all 7/ })).toBeTruthy();
        expect(within(list).getByRole('alert').textContent).toMatch(/couldn't load your links/);
        fireEvent.click(within(list).getByRole('button', { name: 'Try again' }));
        expect(vm.onRefresh).toHaveBeenCalledOnce();
    });

    it('shows the full error only when nothing is loaded', () => {
        renderSection(viewModel({ records: [], error: true }));
        const list = screen.getByRole('list', { name: 'Your shared links' });
        expect(within(list).getByRole('alert')).toBeTruthy();
        expect(within(list).queryByRole('button', { name: /View all/ })).toBeNull();
    });

    it('does not show a refresh button on the main page', () => {
        renderSection(viewModel());
        expect(screen.queryByRole('button', { name: 'Refresh' })).toBeNull();
    });
});

describe('row animation', () => {
    const rowItem = (button: HTMLElement) => button.closest('li') as HTMLElement;

    it('animates each list the first time it shows rows, and keeps that batch stable', () => {
        const base = viewModel().savedCollections;
        const loading = viewModel({
            savedCollections: { ...base, records: [], isLoading: true },
        });
        const { rerenderWith } = renderSection(loading);

        const firstLink = () => rowItem(linkRow());
        expect(firstLink().className).toContain('sl-row-in');

        // Received rows arrive later: they still get their own first reveal.
        rerenderWith({ ...loading, savedCollections: base });
        const received = () =>
            rowItem(
                within(screen.getByRole('list', { name: 'Shared with you' })).getByRole('button', {
                    name: /^Career highlights/,
                })
            );
        expect(received().className).toContain('sl-row-in');
        // The links batch keeps its animation class while its stagger runs.
        expect(firstLink().className).toContain('sl-row-in');

        // A link added after the first reveal does not animate.
        const added = {
            ...share,
            id: 'NEWNEWNEWNEWNEWNEWNEWN',
            title: 'Fresh link',
            createdAt: '2026-09-20T00:00:00.000Z',
        } as ShareLink;
        rerenderWith({ ...loading, savedCollections: base, records: [added, share] });
        expect(rowItem(linkRow('Fresh link')).className).not.toContain('sl-row-in');
        expect(firstLink().className).toContain('sl-row-in');
    });
});

describe('shared with you', () => {
    it('lists received collections without a tab and previews one', () => {
        const vm = viewModel();
        renderSection(vm);

        const list = screen.getByRole('list', { name: 'Shared with you' });
        const row = within(list).getByRole('button', { name: /^Career highlights/ });
        expect(row.textContent).toContain('From Alex Rivera');
        expect(row.textContent).toContain('2 credentials');
        fireEvent.click(row);
        expect(vm.savedCollections.onPreview).toHaveBeenCalledWith(savedCollection);
    });

    it('keeps received rows on a background error, with an inline retry', () => {
        const base = viewModel().savedCollections;
        const records = Array.from({ length: 6 }, (_, index) => ({
            ...savedCollection,
            uri: `lc:network:localhost%3A4000:pres:${index}`,
            title: `Collection ${index}`,
        }));
        const vm = viewModel({ savedCollections: { ...base, records, error: true } });
        renderSection(vm);

        const list = screen.getByRole('list', { name: 'Shared with you' });
        expect(within(list).getAllByRole('button', { name: /^Collection \d/ })).toHaveLength(5);
        expect(within(list).getByRole('button', { name: /View all 6/ })).toBeTruthy();
        expect(within(list).getByRole('alert').textContent).toMatch(/saved collections/);
        fireEvent.click(within(list).getByRole('button', { name: 'Try again' }));
        expect(base.onRefresh).toHaveBeenCalledOnce();
    });

    it('shows the full received error only when nothing is loaded', () => {
        const base = viewModel().savedCollections;
        renderSection(viewModel({ savedCollections: { ...base, records: [], error: true } }));
        const list = screen.getByRole('list', { name: 'Shared with you' });
        expect(within(list).getByRole('alert').textContent).toMatch(/saved collections/);
    });

    it('invites instead of apologizing when nothing has been received', () => {
        renderSection(
            viewModel({ savedCollections: { ...viewModel().savedCollections, records: [] } })
        );
        expect(screen.getByText(/they'll land here/)).toBeTruthy();
    });
});

describe('detail sheet', () => {
    it('shows the note and opens the credential preview', () => {
        const described = { ...share, note: 'For the fall internship application.' };
        const vm = viewModel({ records: [described] });
        renderSection(vm);
        const sheet = openDetail();

        expect(sheet.getByText('For the fall internship application.')).toBeTruthy();
        fireEvent.click(sheet.getByRole('button', { name: 'View 4 credentials' }));
        expect(vm.onPreview).toHaveBeenCalledWith(described);
    });

    it('closes only its own modal', () => {
        renderSection(viewModel());
        const sheet = openDetail();
        fireEvent.click(sheet.getByRole('button', { name: 'Close' }));
        expect(closeModalById).toHaveBeenCalledWith(0);
    });

    it('surfaces passcode state and view statistics', () => {
        renderSection(viewModel());
        const sheet = openDetail();
        expect(sheet.getByText('Passcode').nextElementSibling?.textContent).toBe('On');
        expect(sheet.getByText(/Opened 12 times/)).toBeTruthy();
    });

    it('does not render view statistics for a protected minor account', () => {
        renderSection(viewModel({ showViewStats: false }));
        const sheet = openDetail();
        expect(sheet.queryByText(/Opened 12 times/)).toBeNull();
    });

    it('does not invent view statistics when the server omits them', () => {
        const withoutViews = { ...share, viewCount: undefined, lastViewedAt: null } as ShareLink;
        renderSection(viewModel({ records: [withoutViews] }));
        const sheet = openDetail();
        expect(sheet.queryByText(/Opened/)).toBeNull();
        expect(sheet.queryByText('Not opened yet')).toBeNull();
    });

    it('confirms that an update keeps the same link before opening the editor', () => {
        const vm = viewModel();
        renderSection(vm);
        const sheet = openDetail();

        fireEvent.click(sheet.getByRole('button', { name: 'Update contents' }));
        expect(vm.onUpdate).not.toHaveBeenCalled();
        expect(sheet.getByText(/same private link/i)).toBeTruthy();
        fireEvent.click(sheet.getByRole('button', { name: 'Choose credentials' }));
        expect(vm.onUpdate).toHaveBeenCalledWith(share);
    });

    it('warns that stopping cannot be reversed', () => {
        renderSection(viewModel());
        const sheet = openDetail();
        fireEvent.click(sheet.getByRole('button', { name: 'Stop sharing' }));
        expect(sheet.getByText(/cannot be reactivated/i)).toBeTruthy();
    });

    it('reopens an expiry on the local day selected before UTC conversion', async () => {
        const expired = { ...share, expiresAt: '2026-09-01T00:00:00.000Z' } as ShareLink;
        const vm = viewModel({ records: [expired], filter: 'expired' });
        renderSection(vm);
        fireEvent.click(screen.getByRole('button', { name: /View all/ }));
        fireEvent.click(openTopSheet().getByRole('button', { name: /^Career highlights/ }));
        const sheet = openTopSheet();

        fireEvent.click(sheet.getByRole('button', { name: 'Change expiry' }));
        const future = new Date();
        future.setDate(future.getDate() + 10);
        const value = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
        fireEvent.change(sheet.getByLabelText('Expiry date'), { target: { value } });
        await act(async () => {
            fireEvent.click(sheet.getByRole('button', { name: 'Save expiry' }));
        });
        expect(vm.onChangeExpiry).toHaveBeenCalledWith(
            expired,
            new Date(`${value}T23:59:59.999`).toISOString()
        );
    });

    it('offers a fresh share instead of implying a stopped link can be reactivated', () => {
        const stopped = {
            ...share,
            status: 'stopped',
            stoppedAt: '2026-09-22T12:00:00.000Z',
        } as ShareLink;
        const vm = viewModel({ records: [stopped], filter: 'stopped' });
        renderSection(vm);
        fireEvent.click(screen.getByRole('button', { name: /View all/ }));
        fireEvent.click(openTopSheet().getByRole('button', { name: /^Career highlights/ }));
        const sheet = openTopSheet();

        expect(sheet.getByText(/cannot be reactivated/i)).toBeTruthy();
        expect(sheet.queryByRole('button', { name: 'Copy link' })).toBeNull();
        fireEvent.click(sheet.getByRole('button', { name: 'Share again' }));
        expect(vm.onCreateShare).toHaveBeenCalledOnce();
    });

    it('keeps a pending change visible, lets the owner retry, and blocks mutations', () => {
        const vm = viewModel({ pendingActions: { [share.id]: 'stop' } });
        renderSection(vm);
        const sheet = openDetail();

        expect(sheet.getByText(/still processing/i)).toBeTruthy();
        fireEvent.click(sheet.getByRole('button', { name: 'Check again' }));
        expect(vm.onCheckPending).toHaveBeenCalledWith(share);
        expect(sheet.getByRole('button', { name: 'Stop sharing' })).toBeDisabled();
    });

    it('checks the right share when two changes are pending', () => {
        const second = {
            ...share,
            id: 'BBBBBBBBBBBBBBBBBBBBBB',
            title: 'Second share',
            createdAt: '2026-09-01T00:00:00.000Z',
        } as ShareLink;
        const vm = viewModel({
            records: [share, second],
            pendingActions: { [share.id]: 'stop', [second.id]: 'expiry' },
        });
        renderSection(vm);
        const sheet = openDetail('Second share');

        fireEvent.click(sheet.getByRole('button', { name: 'Check again' }));
        expect(vm.onCheckPending).toHaveBeenCalledOnce();
        expect(vm.onCheckPending).toHaveBeenCalledWith(second);
    });

    it('stays live after it opens: a pending change that clears re-enables actions', () => {
        const vm = viewModel({ pendingActions: { [share.id]: 'stop' } });
        const { rerenderWith } = renderSection(vm);
        const sheet = openDetail();
        expect(sheet.getByRole('button', { name: 'Stop sharing' })).toBeDisabled();

        act(() => rerenderWith({ ...vm, pendingActions: {} }));
        expect(sheet.getByRole('button', { name: 'Stop sharing' })).not.toBeDisabled();
    });
});

describe('view all', () => {
    it('explains that more pages may contain links for the selected filter', () => {
        renderSection(
            viewModel({ records: [{ ...share, status: 'stopped' } as ShareLink], hasMore: true })
        );
        fireEvent.click(screen.getByRole('button', { name: /View all/ }));
        expect(openTopSheet().getByText(/Load more to keep looking/i)).toBeTruthy();
    });

    it('filters with counts and refreshes from a small icon', () => {
        const vm = viewModel({
            records: [
                share,
                { ...share, id: 'BBBBBBBBBBBBBBBBBBBBBB', status: 'stopped' } as ShareLink,
            ],
            hasMore: true,
        });
        renderSection(vm);
        fireEvent.click(screen.getByRole('button', { name: /View all/ }));
        const sheet = openTopSheet();

        expect(sheet.getByRole('tab', { name: /Active\s*1/ })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        fireEvent.click(sheet.getByRole('tab', { name: /Stopped\s*1/ }));
        expect(vm.onFilterChange).toHaveBeenCalledWith('stopped');
        fireEvent.click(sheet.getByRole('button', { name: 'Refresh' }));
        expect(vm.onRefresh).toHaveBeenCalledOnce();
    });
});

describe('shared link filters', () => {
    const now = new Date('2026-09-22T12:00:00.000Z').getTime();

    it('keeps stopped links in Stopped even when their expiry is past', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'stopped', expiresAt: '2026-09-20T00:00:00.000Z' },
                now
            )
        ).toBe('stopped');
    });

    it('classifies elapsed active links as Expired', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'active', expiresAt: '2026-09-22T11:59:59.000Z' },
                now
            )
        ).toBe('expired');
    });

    it('keeps future and non-expiring links Active', () => {
        expect(
            getSharedLinkViewStatus(
                { status: 'active', expiresAt: '2026-09-23T00:00:00.000Z' },
                now
            )
        ).toBe('active');
        expect(getSharedLinkViewStatus({ status: 'active', expiresAt: null }, now)).toBe('active');
    });

    it('formats date inputs in local time', () => {
        expect(localDateValue(new Date(2026, 8, 25, 0, 30))).toBe('2026-09-25');
        expect(minimumExpiryDateValue(new Date(2026, 8, 25, 23, 30))).toBe('2026-09-26');
    });
});

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ShareLink, VP } from '@learncard/types';

import type {
    DataSharingSharedLinksViewModel,
    SharedLinkFilter,
} from '../../DataSharingCenter.types';
import { useSharedLinksStore } from './sharedLinksStore';
import SharedLinksAllSheet from './SharedLinksAllSheet';
import SharedWithYouAllSheet from './SharedWithYouAllSheet';

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon, ...rest }: Record<string, unknown>) => <span {...rest} />,
}));

afterEach(() => {
    cleanup();
    useSharedLinksStore.setState({ vm: null });
});

const buildShare = (overrides: Partial<ShareLink> = {}): ShareLink =>
    ({
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
        ...overrides,
    }) as ShareLink;

const activeShareOlder = buildShare({
    id: 'active-older',
    title: 'Older active link',
    createdAt: '2026-09-10T00:00:00.000Z',
});
const activeShareNewer = buildShare({
    id: 'active-newer',
    title: 'Newer active link',
    createdAt: '2026-09-20T00:00:00.000Z',
});
const expiredShare = buildShare({
    id: 'expired-1',
    title: 'Expired link',
    status: 'active',
    expiresAt: '2020-01-01T00:00:00.000Z',
    createdAt: '2026-09-05T00:00:00.000Z',
});
const stoppedShare = buildShare({
    id: 'stopped-1',
    title: 'Stopped link',
    status: 'stopped',
    stoppedAt: '2026-09-11T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
});

const savedCollection = (overrides: Record<string, unknown> = {}) => ({
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
    ...overrides,
});

const buildVm = (
    overrides: Partial<DataSharingSharedLinksViewModel> = {}
): DataSharingSharedLinksViewModel =>
    ({
        records: [activeShareNewer, expiredShare, stoppedShare],
        filter: 'active' as const,
        isLoading: false,
        isLoadingMore: false,
        hasMore: false,
        error: false,
        busyId: null,
        pendingActions: {},
        showViewStats: true,
        savedCollections: {
            records: [savedCollection()],
            isLoading: false,
            error: false,
            onOpen: vi.fn(async () => undefined),
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
    }) as DataSharingSharedLinksViewModel;

const seed = (vm: DataSharingSharedLinksViewModel) => useSharedLinksStore.setState({ vm });

/** Seeds a vm whose onFilterChange writes the new filter back to the store, so the
 *  roving tabIndex/aria-selected actually move like they would with the real store. */
const seedRoving = (overrides: Partial<DataSharingSharedLinksViewModel> = {}) => {
    const onFilterChange = vi.fn((filter: SharedLinkFilter) => {
        const current = useSharedLinksStore.getState().vm as DataSharingSharedLinksViewModel;
        seed({ ...current, filter });
    });
    seed(buildVm({ onFilterChange, ...overrides }));
    return onFilterChange;
};

describe('SharedLinksAllSheet', () => {
    it('closes itself when the store vm transitions to null', () => {
        seed(buildVm());
        const onClose = vi.fn();
        render(<SharedLinksAllSheet onClose={onClose} onOpenShare={vi.fn()} />);
        expect(onClose).not.toHaveBeenCalled();

        act(() => useSharedLinksStore.setState({ vm: null }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not close when it mounts before any vm is published', () => {
        const onClose = vi.fn();
        render(<SharedLinksAllSheet onClose={onClose} onOpenShare={vi.fn()} />);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('shows loaded counts on the filter tabs', () => {
        seed(buildVm());
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        expect(screen.getByRole('tab', { name: /Active 1/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Expired 1/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Stopped 1/ })).toBeInTheDocument();
    });

    it('calls onFilterChange when a tab is clicked', () => {
        const vm = buildVm();
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        fireEvent.click(screen.getByRole('tab', { name: /Stopped/ }));
        expect(vm.onFilterChange).toHaveBeenCalledWith('stopped');
    });

    it('lists only records for vm.filter, newest first', () => {
        seed(
            buildVm({
                records: [activeShareOlder, activeShareNewer, expiredShare, stoppedShare],
                filter: 'active',
            })
        );
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        const titles = screen.getAllByText(/active link/).map(node => node.textContent);
        expect(titles).toEqual(['Newer active link', 'Older active link']);
        expect(screen.queryByText('Expired link')).not.toBeInTheDocument();
        expect(screen.queryByText('Stopped link')).not.toBeInTheDocument();
    });

    it('disables the refresh button while loading', () => {
        seed(buildVm({ isLoading: true }));
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    });

    it('calls onRefresh when the refresh button is clicked', () => {
        const vm = buildVm({ isLoading: false });
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(vm.onRefresh).toHaveBeenCalled();
    });

    it('calls onCreateShare when New link is clicked', () => {
        const vm = buildVm();
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        fireEvent.click(screen.getByText('New link'));
        expect(vm.onCreateShare).toHaveBeenCalled();
    });

    it('shows Load more when hasMore and calls onLoadMore', () => {
        const vm = buildVm({ hasMore: true });
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        fireEvent.click(screen.getByText('Load more'));
        expect(vm.onLoadMore).toHaveBeenCalled();
    });

    it('shows "keep looking" copy when the filter is empty but more may load', () => {
        seed(
            buildVm({
                records: [expiredShare, stoppedShare],
                filter: 'active',
                hasMore: true,
            })
        );
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        expect(screen.getByText(/Load more to keep looking/)).toBeInTheDocument();
    });

    it('calls onOpenShare when a row is clicked', () => {
        const onOpenShare = vi.fn();
        seed(buildVm({ records: [activeShareNewer], filter: 'active' }));
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={onOpenShare} />);

        fireEvent.click(screen.getByText('Newer active link'));
        expect(onOpenShare).toHaveBeenCalledWith(activeShareNewer);
    });

    it('calls onClose when Back is clicked', () => {
        const onClose = vi.fn();
        seed(buildVm());
        render(<SharedLinksAllSheet onClose={onClose} onOpenShare={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('shows a full-list retry action on error when nothing is loaded yet', () => {
        const vm = buildVm({ records: [], error: true });
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        fireEvent.click(screen.getByText('Try again'));
        expect(vm.onRefresh).toHaveBeenCalled();
    });

    it('keeps rendering loaded rows on a background error, retrying via onLoadMore when more can load', () => {
        const vm = buildVm({
            records: [activeShareNewer],
            filter: 'active',
            error: true,
            hasMore: true,
        });
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        expect(screen.getByText('Newer active link')).toBeInTheDocument();
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent("We couldn't load your links. Please try again.");

        fireEvent.click(screen.getByText('Try again'));
        expect(vm.onLoadMore).toHaveBeenCalled();
        expect(vm.onRefresh).not.toHaveBeenCalled();
    });

    it('keeps rendering loaded rows on a background error, retrying via onRefresh when nothing more can load', () => {
        const vm = buildVm({
            records: [activeShareNewer],
            filter: 'active',
            error: true,
            hasMore: false,
        });
        seed(vm);
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        expect(screen.getByText('Newer active link')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Try again'));
        expect(vm.onRefresh).toHaveBeenCalled();
    });

    it('moves focus between tabs with arrow keys and updates the roving tabIndex', () => {
        const onFilterChange = seedRoving();
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        const activeTab = screen.getByRole('tab', { name: /Active/ });
        const expiredTab = screen.getByRole('tab', { name: /Expired/ });
        const stoppedTab = screen.getByRole('tab', { name: /Stopped/ });

        activeTab.focus();
        fireEvent.keyDown(activeTab, { key: 'ArrowRight' });
        expect(onFilterChange).toHaveBeenCalledWith('expired');
        expect(expiredTab).toHaveFocus();
        expect(expiredTab).toHaveAttribute('tabIndex', '0');
        expect(activeTab).toHaveAttribute('tabIndex', '-1');

        fireEvent.keyDown(expiredTab, { key: 'ArrowRight' });
        expect(onFilterChange).toHaveBeenCalledWith('stopped');
        expect(stoppedTab).toHaveFocus();

        fireEvent.keyDown(stoppedTab, { key: 'ArrowRight' });
        expect(onFilterChange).toHaveBeenCalledWith('active');
        expect(activeTab).toHaveFocus();

        fireEvent.keyDown(activeTab, { key: 'ArrowLeft' });
        expect(onFilterChange).toHaveBeenCalledWith('stopped');
        expect(stoppedTab).toHaveFocus();
    });

    it('jumps to the first and last tabs with Home and End', () => {
        const onFilterChange = seedRoving();
        render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

        const activeTab = screen.getByRole('tab', { name: /Active/ });
        const stoppedTab = screen.getByRole('tab', { name: /Stopped/ });

        activeTab.focus();
        fireEvent.keyDown(activeTab, { key: 'End' });
        expect(onFilterChange).toHaveBeenCalledWith('stopped');
        expect(stoppedTab).toHaveFocus();

        fireEvent.keyDown(stoppedTab, { key: 'Home' });
        expect(onFilterChange).toHaveBeenCalledWith('active');
        expect(activeTab).toHaveFocus();
    });

    it('inverts arrow-key direction when the document direction is rtl', () => {
        document.documentElement.dir = 'rtl';
        try {
            const onFilterChange = seedRoving();
            render(<SharedLinksAllSheet onClose={vi.fn()} onOpenShare={vi.fn()} />);

            const activeTab = screen.getByRole('tab', { name: /Active/ });
            const stoppedTab = screen.getByRole('tab', { name: /Stopped/ });

            activeTab.focus();
            fireEvent.keyDown(activeTab, { key: 'ArrowRight' });
            expect(onFilterChange).toHaveBeenCalledWith('stopped');
            expect(stoppedTab).toHaveFocus();
        } finally {
            document.documentElement.dir = '';
        }
    });
});

describe('SharedWithYouAllSheet', () => {
    it('closes itself when the store vm transitions to null', () => {
        seed(buildVm());
        const onClose = vi.fn();
        render(<SharedWithYouAllSheet onClose={onClose} />);
        expect(onClose).not.toHaveBeenCalled();

        act(() => useSharedLinksStore.setState({ vm: null }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not close when it mounts before any vm is published', () => {
        const onClose = vi.fn();
        render(<SharedWithYouAllSheet onClose={onClose} />);
        expect(onClose).not.toHaveBeenCalled();
    });

    it('lists all records, including more than 5', () => {
        const records = Array.from({ length: 7 }, (_, index) =>
            savedCollection({
                uri: `lc:network:localhost%3A4000:pres:${index}`,
                title: `Collection ${index}`,
            })
        );
        seed(buildVm({ savedCollections: { ...buildVm().savedCollections, records } }));
        render(<SharedWithYouAllSheet onClose={vi.fn()} />);

        records.forEach(record => {
            expect(screen.getByText(record.title as string)).toBeInTheDocument();
        });
    });

    it('shows the receivedEmpty copy in the empty state', () => {
        seed(buildVm({ savedCollections: { ...buildVm().savedCollections, records: [] } }));
        render(<SharedWithYouAllSheet onClose={vi.fn()} />);

        expect(
            screen.getByText("When someone shares credentials with you, they'll land here.")
        ).toBeInTheDocument();
    });

    it('shows a retry action on error', () => {
        const onRefresh = vi.fn(async () => undefined);
        seed(
            buildVm({
                savedCollections: { ...buildVm().savedCollections, error: true, onRefresh },
            })
        );
        render(<SharedWithYouAllSheet onClose={vi.fn()} />);

        fireEvent.click(screen.getByText('Try again'));
        expect(onRefresh).toHaveBeenCalled();
    });

    it('calls saved.onPreview when a row is clicked', () => {
        const onPreview = vi.fn();
        const collection = savedCollection();
        seed(
            buildVm({
                savedCollections: {
                    ...buildVm().savedCollections,
                    records: [collection],
                    onPreview,
                },
            })
        );
        render(<SharedWithYouAllSheet onClose={vi.fn()} />);

        fireEvent.click(screen.getByText('Career highlights'));
        expect(onPreview).toHaveBeenCalledWith(collection);
    });

    it('calls saved.onRefresh when refresh is clicked', () => {
        const onRefresh = vi.fn(async () => undefined);
        seed(buildVm({ savedCollections: { ...buildVm().savedCollections, onRefresh } }));
        render(<SharedWithYouAllSheet onClose={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(onRefresh).toHaveBeenCalled();
    });
});

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ShareLink } from '@learncard/types';

import type { DataSharingSharedLinksViewModel } from '../../DataSharingCenter.types';
import ShareLinkDetailSheet from './ShareLinkDetailSheet';
import { useSharedLinksStore } from './sharedLinksStore';

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon, ...rest }: { icon?: string } & React.HTMLAttributes<HTMLSpanElement>) => (
        <span {...rest} />
    ),
}));

vi.mock('qrcode.react', () => ({
    QRCodeSVG: ({ role, 'aria-label': ariaLabel }: { role?: string; 'aria-label'?: string }) => (
        <img role={role} aria-label={ariaLabel} />
    ),
}));

afterEach(() => {
    cleanup();
    useSharedLinksStore.setState({ vm: null });
});

const share = (overrides: Partial<ShareLink> = {}): ShareLink =>
    ({
        id: 'AAAAAAAAAAAAAAAAAAAAAA',
        title: 'Career highlights',
        note: 'Selected credentials for applications',
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

const viewModel = (overrides: Partial<DataSharingSharedLinksViewModel> = {}) => ({
    records: [share()],
    filter: 'active' as const,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: false,
    busyId: null,
    pendingActions: {},
    showViewStats: true,
    savedCollections: {
        records: [],
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
    onGetPrivateUrl: vi.fn(async () => 'https://example.com/private'),
    onChangeExpiry: vi.fn(async () => undefined),
    onStop: vi.fn(async () => undefined),
    onCheckPending: vi.fn(async () => undefined),
    onPreview: vi.fn(),
    onUpdate: vi.fn(),
    onCreateShare: vi.fn(),
    ...overrides,
});

const seed = (vm: ReturnType<typeof viewModel>) => useSharedLinksStore.setState({ vm });

describe('ShareLinkDetailSheet', () => {
    it('shows the note and calls onPreview from the credential count', () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('Selected credentials for applications')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'View 4 credentials' }));
        expect(vm.onPreview).toHaveBeenCalledWith(vm.records[0]);
    });

    it('shows passcode and view stats, hiding stats when disabled or undefined', () => {
        const vm = viewModel();
        seed(vm);
        const { rerender } = render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('Passcode required')).toBeTruthy();
        expect(screen.getByText('Views')).toBeTruthy();

        const noStatsVm = viewModel({ showViewStats: false });
        seed(noStatsVm);
        rerender(
            <ShareLinkDetailSheet
                shareId={noStatsVm.records[0].id}
                fallback={noStatsVm.records[0]}
                onClose={vi.fn()}
            />
        );
        expect(screen.queryByText('Views')).toBeNull();

        const noViewCountVm = viewModel({
            records: [share({ viewCount: undefined })],
        });
        seed(noViewCountVm);
        rerender(
            <ShareLinkDetailSheet
                shareId={noViewCountVm.records[0].id}
                fallback={noViewCountVm.records[0]}
                onClose={vi.fn()}
            />
        );
        expect(screen.queryByText('Views')).toBeNull();
    });

    it('reveals the same-link update warning and calls onUpdate from Choose credentials', () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Update contents' }));
        expect(
            screen.getByText(
                'The same private link will show the new credential set as soon as you finish.'
            )
        ).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Choose credentials' }));
        expect(vm.onUpdate).toHaveBeenCalledWith(vm.records[0]);
    });

    it('reveals the stop warning and calls onStop when confirmed', async () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));
        expect(screen.getByText(/cannot be reactivated/)).toBeTruthy();

        const stopButtons = screen.getAllByRole('button', { name: 'Stop sharing' });
        await act(async () => {
            fireEvent.click(stopButtons[stopButtons.length - 1]);
        });
        expect(vm.onStop).toHaveBeenCalledWith(vm.records[0]);
    });

    it('changes expiry to the local end-of-day ISO, and rejects a too-early date', async () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));

        const future = new Date();
        future.setDate(future.getDate() + 10);
        const pad = (n: number) => String(n).padStart(2, '0');
        const futureValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;

        const input = screen.getByLabelText('Expiry date') as HTMLInputElement;
        fireEvent.change(input, { target: { value: futureValue } });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Save expiry' }));
        });

        expect(vm.onChangeExpiry).toHaveBeenCalledWith(
            vm.records[0],
            new Date(`${futureValue}T23:59:59.999`).toISOString()
        );

        const past = '2000-01-01';
        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        const input2 = screen.getByLabelText('Expiry date') as HTMLInputElement;
        fireEvent.change(input2, { target: { value: past } });
        fireEvent.click(screen.getByRole('button', { name: 'Save expiry' }));

        expect(screen.getByRole('alert')).toBeTruthy();
        expect(vm.onChangeExpiry).toHaveBeenCalledTimes(1);
    });

    it('shows the stopped explanation with no Copy link, and Share again calls onCreateShare', () => {
        const vm = viewModel({ records: [share({ status: 'stopped' })] });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(
            screen.getByText(
                'This link cannot be reactivated because its content was removed. Share again to create a new private link.'
            )
        ).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Copy link' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Share again' }));
        expect(vm.onCreateShare).toHaveBeenCalled();
    });

    it('shows the pending banner, allows checking again, and disables Stop sharing', () => {
        const vm = viewModel({ pendingActions: { AAAAAAAAAAAAAAAAAAAAAA: 'stop' } });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText(/still processing/)).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
        expect(vm.onCheckPending).toHaveBeenCalledWith(vm.records[0]);

        expect(screen.getByRole('button', { name: 'Stop sharing' })).toBeDisabled();
    });

    it('reflects a live store update without remounting', () => {
        const vm = viewModel({ pendingActions: { AAAAAAAAAAAAAAAAAAAAAA: 'stop' } });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Stop sharing' })).toBeDisabled();

        act(() => {
            useSharedLinksStore.setState({ vm: viewModel({ pendingActions: {} }) });
        });

        expect(screen.getByRole('button', { name: 'Stop sharing' })).not.toBeDisabled();
    });

    it('renders the fallback when the record is missing from the store', () => {
        const vm = viewModel({ records: [] });
        seed(vm);
        const fallback = share({ id: 'missing-id', title: 'Fallback title' });
        render(<ShareLinkDetailSheet shareId="missing-id" fallback={fallback} onClose={vi.fn()} />);

        expect(screen.getByText('Fallback title')).toBeTruthy();
    });

    it('loads the private URL lazily and renders the QR code', async () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(vm.onGetPrivateUrl).not.toHaveBeenCalled();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Show QR code' }));
        });

        expect(vm.onGetPrivateUrl).toHaveBeenCalledWith(vm.records[0]);
        expect(screen.getByRole('img', { name: 'Private link QR code' })).toBeTruthy();
    });
});

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

/** Scopes into the "Stop sharing" confirmation panel, disambiguating the
 * confirm button from the row toggle button of the same name. */
const stopPanel = () => screen.getByTestId('stop-sharing-panel');

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

    it('shows passcode (On/Off) and view stats, hiding stats when disabled or undefined', () => {
        const vm = viewModel();
        seed(vm);
        const { rerender } = render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByText('On')).toBeTruthy();
        expect(screen.getByText('Views')).toBeTruthy();

        const noPasscodeVm = viewModel({ records: [share({ passcodeProtected: false })] });
        seed(noPasscodeVm);
        rerender(
            <ShareLinkDetailSheet
                shareId={noPasscodeVm.records[0].id}
                fallback={noPasscodeVm.records[0]}
                onClose={vi.fn()}
            />
        );
        expect(screen.getByText('Off')).toBeTruthy();

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

    it('reveals the stop warning, focuses the title, and calls onStop when confirmed', async () => {
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
        const panel = stopPanel();
        expect(within(panel).getByText(/cannot be reactivated/)).toBeTruthy();

        const confirmButton = within(panel).getByRole('button', { name: 'Stop sharing' });
        await act(async () => {
            fireEvent.click(confirmButton);
        });
        expect(vm.onStop).toHaveBeenCalledWith(vm.records[0]);

        expect(screen.getByRole('heading', { name: 'Career highlights' })).toHaveFocus();
    });

    it('shows the busy "Stopping…" label on the confirm button while busy', () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        // Open the panel first (the toggle is disabled once busy).
        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));

        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({ busyId: 'AAAAAAAAAAAAAAAAAAAAAA' }),
            });
        });

        const panel = stopPanel();
        expect(within(panel).getByRole('button', { name: 'Stopping…' })).toBeTruthy();
        expect(within(panel).getByRole('button', { name: 'Stopping…' })).toBeDisabled();
    });

    it('changes expiry to the local end-of-day ISO, focuses the Change button, and rejects a too-early date', async () => {
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
        expect(screen.getByRole('button', { name: 'Change expiry' })).toHaveFocus();

        const past = '2000-01-01';
        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        const input2 = screen.getByLabelText('Expiry date') as HTMLInputElement;
        fireEvent.change(input2, { target: { value: past } });
        fireEvent.click(screen.getByRole('button', { name: 'Save expiry' }));

        expect(screen.getByRole('alert')).toBeTruthy();
        expect(vm.onChangeExpiry).toHaveBeenCalledTimes(1);
    });

    it('defers focus to the Change button until busyId clears after saving expiry', async () => {
        let resolveChange: () => void = () => undefined;
        const onChangeExpiry = vi.fn(
            () =>
                new Promise<void>(resolve => {
                    resolveChange = resolve;
                })
        );
        const vm = viewModel({ onChangeExpiry });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save expiry' }));

        // The section marks the share busy while the mutation is in flight.
        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({ onChangeExpiry, busyId: 'AAAAAAAAAAAAAAAAAAAAAA' }),
            });
        });

        await act(async () => {
            resolveChange();
        });

        // Still busy (the section hasn't cleared it yet): the Change button
        // stays disabled, so focus must not have moved there yet.
        expect(screen.getByRole('button', { name: 'Change expiry' })).not.toHaveFocus();

        // The section clears busyId in a later store update.
        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({ onChangeExpiry, busyId: null }),
            });
        });

        expect(screen.getByRole('button', { name: 'Change expiry' })).toHaveFocus();
    });

    it('falls back to focusing the heading if the expiry change ends up pending', async () => {
        let resolveChange: () => void = () => undefined;
        const onChangeExpiry = vi.fn(
            () =>
                new Promise<void>(resolve => {
                    resolveChange = resolve;
                })
        );
        const vm = viewModel({ onChangeExpiry });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save expiry' }));

        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({ onChangeExpiry, busyId: 'AAAAAAAAAAAAAAAAAAAAAA' }),
            });
        });

        await act(async () => {
            resolveChange();
        });

        // busyId clears, but the change is now pending confirmation — the
        // Change button stays disabled, so focus falls back to the heading.
        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({
                    onChangeExpiry,
                    busyId: null,
                    pendingActions: { AAAAAAAAAAAAAAAAAAAAAA: 'expiry' },
                }),
            });
        });

        expect(screen.getByRole('heading', { name: 'Career highlights' })).toHaveFocus();
    });

    it('shows the busy "Saving…" label on Save expiry while busy', () => {
        const vm = viewModel();
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        // Open the panel first (the toggle is disabled once busy).
        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));

        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({ busyId: 'AAAAAAAAAAAAAAAAAAAAAA' }),
            });
        });

        expect(screen.getByRole('button', { name: 'Saving…' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    });

    it('resets the expiry input to the real expiry after editing, collapsing, and reopening', () => {
        const vm = viewModel({
            records: [share({ expiresAt: '2026-10-01T12:00:00.000Z' })],
        });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        const input = screen.getByLabelText('Expiry date') as HTMLInputElement;
        expect(input.value).toBe('2026-10-01');

        fireEvent.change(input, { target: { value: '2026-11-15' } });
        expect(input.value).toBe('2026-11-15');

        // Collapse without saving.
        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        expect(screen.queryByLabelText('Expiry date')).toBeNull();

        // Reopen: the edit should not have persisted.
        fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));
        expect((screen.getByLabelText('Expiry date') as HTMLInputElement).value).toBe('2026-10-01');
    });

    it('shows the stopped explanation with no Copy link, and Share again closes the sheet before calling onCreateShare', () => {
        const vm = viewModel({ records: [share({ status: 'stopped' })] });
        seed(vm);
        const onClose = vi.fn();
        const calls: string[] = [];
        vm.onCreateShare = vi.fn(() => calls.push('onCreateShare'));
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={() => {
                    calls.push('onClose');
                    onClose();
                }}
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
        expect(onClose).toHaveBeenCalled();
        expect(calls).toEqual(['onClose', 'onCreateShare']);
    });

    it('renders no Update contents or Stop sharing rows for a stopped link', () => {
        const vm = viewModel({ records: [share({ status: 'stopped' })] });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: 'Update contents' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Stop sharing' })).toBeNull();
    });

    it('shows the expired chip and keeps Change enabled', () => {
        const vm = viewModel({
            records: [share({ expiresAt: '2000-01-01T00:00:00.000Z' })],
        });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Change expiry' })).not.toBeDisabled();
    });

    it('disables Copy, QR, and View for a non-finalized (staging) share', () => {
        const vm = viewModel({ records: [share({ contentState: 'staging' })] });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Copy link' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Show QR code' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'View 4 credentials' })).toBeDisabled();
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

    it('closes an open panel and blocks further mutation when the record becomes stopped mid-edit', () => {
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
        expect(screen.getByLabelText('Expiry date')).toBeInTheDocument();

        act(() => {
            useSharedLinksStore.setState({
                vm: viewModel({ records: [share({ status: 'stopped' })] }),
            });
        });

        expect(screen.queryByLabelText('Expiry date')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save expiry' })).toBeNull();
    });

    it('renders the fallback when the record is missing from the store', () => {
        const vm = viewModel({ records: [] });
        seed(vm);
        const fallback = share({ id: 'missing-id', title: 'Fallback title' });
        render(<ShareLinkDetailSheet shareId="missing-id" fallback={fallback} onClose={vi.fn()} />);

        expect(screen.getByText('Fallback title')).toBeTruthy();
    });

    it('calls onClose when the vm transitions to null (section unmounted)', () => {
        const vm = viewModel();
        seed(vm);
        const onClose = vi.fn();
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={onClose}
            />
        );

        expect(onClose).not.toHaveBeenCalled();

        act(() => {
            useSharedLinksStore.setState({ vm: null });
        });

        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when the close button is clicked', () => {
        const vm = viewModel();
        seed(vm);
        const onClose = vi.fn();
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={onClose}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalled();
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

    it('shows an inline error inside the QR box when loading the private URL fails, without the bottom alert', async () => {
        const vm = viewModel({
            onGetPrivateUrl: vi.fn(async () => Promise.reject(new Error('boom'))),
        });
        seed(vm);
        render(
            <ShareLinkDetailSheet
                shareId={vm.records[0].id}
                fallback={vm.records[0]}
                onClose={vi.fn()}
            />
        );

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Show QR code' }));
        });

        expect(screen.queryByRole('img', { name: 'Private link QR code' })).toBeNull();
        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(1);
        expect(alerts[0].textContent).toMatch(/something went wrong/i);
    });
});

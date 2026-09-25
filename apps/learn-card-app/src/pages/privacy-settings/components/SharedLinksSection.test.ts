import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ShareLink, VP } from '@learncard/types';

import type { DataSharingSharedLinksViewModel } from '../DataSharingCenter.types';
import SharedLinksSection, {
    getSharedLinkViewStatus,
    localDateValue,
    minimumExpiryDateValue,
} from './SharedLinksSection';

vi.mock('@ionic/react', () => ({ IonIcon: () => null }));

afterEach(cleanup);

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
        onOpen: vi.fn(async () => undefined),
        onRefresh: vi.fn(async () => undefined),
        onPreview: vi.fn(),
    },
    onFilterChange: vi.fn(),
    onRefresh: vi.fn(async () => undefined),
    onLoadMore: vi.fn(async () => undefined),
    onCopy: vi.fn(async () => undefined),
    onGetPrivateUrl: vi.fn(async () => 'https://example.com'),
    onChangeExpiry: vi.fn(async () => undefined),
    onStop: vi.fn(async () => undefined),
    onCheckPending: vi.fn(async () => undefined),
    onPreview: vi.fn(),
    onUpdate: vi.fn(),
    onCreateShare: vi.fn(),
    ...overrides,
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

describe('shared link actions', () => {
    it('reopens an expiry on the local day selected before UTC conversion', () => {
        const previousTimezone = process.env.TZ;
        process.env.TZ = 'America/New_York';
        try {
            const vm = viewModel({
                records: [{ ...share, expiresAt: '2026-09-26T03:59:59.999Z' }],
            });
            render(React.createElement(SharedLinksSection, { vm }));

            fireEvent.click(screen.getByRole('button', { name: 'Change expiry' }));

            expect(screen.getByLabelText('Expiry date')).toHaveValue('2026-09-25');
        } finally {
            if (previousTimezone === undefined) delete process.env.TZ;
            else process.env.TZ = previousTimezone;
        }
    });

    it('opens the share creator from New share', () => {
        const vm = viewModel();
        render(React.createElement(SharedLinksSection, { vm }));

        fireEvent.click(screen.getByRole('button', { name: 'New share' }));

        expect(vm.onCreateShare).toHaveBeenCalledOnce();
    });

    it('surfaces passcode protection on every shared-link card', () => {
        const vm = viewModel({
            records: [share, { ...share, id: 'BBBBBBBBBBBBBBBBBBBBBB', passcodeProtected: false }],
        });
        render(React.createElement(SharedLinksSection, { vm }));

        expect(screen.getByText('Passcode required')).toBeTruthy();
        expect(screen.getByText('Passcode off')).toBeTruthy();
    });

    it('shows the description and opens the credential preview from the count', () => {
        const describedShare = { ...share, note: 'For the fall internship application.' };
        const vm = viewModel({ records: [describedShare] });
        render(React.createElement(SharedLinksSection, { vm }));

        expect(screen.getByText('For the fall internship application.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'View 4 credentials' }));

        expect(vm.onPreview).toHaveBeenCalledWith(describedShare);
    });

    it('opens saved collections and previews a received presentation', () => {
        const vm = viewModel();
        render(React.createElement(SharedLinksSection, { vm }));

        fireEvent.click(screen.getByRole('tab', { name: 'Saved collections' }));

        expect(vm.savedCollections.onOpen).toHaveBeenCalledOnce();
        expect(screen.getByText('Career highlights')).toBeTruthy();
        expect(screen.getByText('Selected credentials for applications')).toBeTruthy();
        expect(screen.getByText('Shared by Alex Rivera')).toBeTruthy();
        expect(screen.getByText('2 credentials')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'View collection' }));
        expect(vm.savedCollections.onPreview).toHaveBeenCalledWith(savedCollection);
    });

    it('confirms that an update keeps the same link before opening the editor', () => {
        const vm = viewModel();
        render(React.createElement(SharedLinksSection, { vm }));

        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        expect(vm.onUpdate).not.toHaveBeenCalled();
        expect(screen.getByText(/same private link/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Choose credentials' }));
        expect(vm.onUpdate).toHaveBeenCalledWith(share);
    });

    it('offers a fresh share instead of implying a stopped link can be reactivated', () => {
        const stoppedShare = {
            ...share,
            status: 'stopped',
            stoppedAt: '2026-09-22T12:00:00.000Z',
        } as ShareLink;
        const vm = viewModel({ records: [stoppedShare], filter: 'stopped' });
        render(React.createElement(SharedLinksSection, { vm }));

        expect(screen.getByText(/cannot be reactivated/i)).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Copy link' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'View 4 credentials' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Share again' }));

        expect(vm.onCreateShare).toHaveBeenCalledOnce();
    });

    it('warns that stopping cannot be reversed', () => {
        const vm = viewModel();
        render(React.createElement(SharedLinksSection, { vm }));

        fireEvent.click(screen.getByRole('button', { name: 'Stop sharing' }));

        expect(screen.getByText(/cannot be reactivated/i)).toBeTruthy();
    });

    it('does not render view statistics for a protected minor account', () => {
        render(
            React.createElement(SharedLinksSection, {
                vm: viewModel({ showViewStats: false }),
            })
        );
        expect(screen.queryByText(/Viewed 12 times/)).toBeNull();
    });

    it('does not invent view statistics when the server omits them', () => {
        const withoutViewData = { ...share, viewCount: undefined, lastViewedAt: null } as ShareLink;
        render(
            React.createElement(SharedLinksSection, {
                vm: viewModel({ records: [withoutViewData], showViewStats: true }),
            })
        );

        expect(screen.queryByText(/Viewed/)).toBeNull();
        expect(screen.queryByText('Not viewed yet')).toBeNull();
    });

    it('keeps a pending change visible and lets the owner retry it', () => {
        const vm = viewModel({ pendingActions: { [share.id]: 'stop' } });
        render(React.createElement(SharedLinksSection, { vm }));

        expect(screen.getByText(/still processing/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
        expect(vm.onCheckPending).toHaveBeenCalledWith(share);
        expect(screen.getByRole('button', { name: 'Stop sharing' })).toBeDisabled();
    });

    it('keeps separate recovery controls for two pending shares', () => {
        const second = { ...share, id: 'BBBBBBBBBBBBBBBBBBBBBB', title: 'Second share' };
        const vm = viewModel({
            records: [share, second],
            pendingActions: { [share.id]: 'stop', [second.id]: 'expiry' },
        });
        render(React.createElement(SharedLinksSection, { vm }));

        expect(screen.getAllByRole('button', { name: 'Check again' })).toHaveLength(2);
        fireEvent.click(screen.getAllByRole('button', { name: 'Check again' })[1]);
        expect(vm.onCheckPending).toHaveBeenCalledWith(second);
        fireEvent.click(screen.getAllByRole('button', { name: 'Check again' })[0]);
        expect(vm.onCheckPending).toHaveBeenCalledWith(share);
    });

    it('explains that more pages may contain links for the selected filter', () => {
        render(
            React.createElement(SharedLinksSection, {
                vm: viewModel({
                    records: [{ ...share, status: 'stopped' } as ShareLink],
                    hasMore: true,
                }),
            })
        );

        expect(screen.getByText(/Load more to keep looking/i)).toBeTruthy();
    });
});

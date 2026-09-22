import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ShareLink } from '@learncard/types';

import type { DataSharingSharedLinksViewModel } from '../DataSharingCenter.types';
import SharedLinksSection, { getSharedLinkViewStatus } from './SharedLinksSection';

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
} as ShareLink;

const viewModel = (overrides: Partial<DataSharingSharedLinksViewModel> = {}) => ({
    records: [share],
    filter: 'active' as const,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: false,
    busyId: null,
    showViewStats: true,
    onFilterChange: vi.fn(),
    onRefresh: vi.fn(async () => undefined),
    onLoadMore: vi.fn(async () => undefined),
    onCopy: vi.fn(async () => undefined),
    onGetPrivateUrl: vi.fn(async () => 'https://example.com'),
    onChangeExpiry: vi.fn(async () => undefined),
    onStop: vi.fn(async () => undefined),
    onUpdate: vi.fn(),
    onOpenPassport: vi.fn(),
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
});

describe('shared link actions', () => {
    it('confirms that an update keeps the same link before opening the editor', () => {
        const vm = viewModel();
        render(React.createElement(SharedLinksSection, { vm }));

        fireEvent.click(screen.getByRole('button', { name: 'Update' }));

        expect(vm.onUpdate).not.toHaveBeenCalled();
        expect(screen.getByText(/same private link/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Choose credentials' }));
        expect(vm.onUpdate).toHaveBeenCalledWith(share);
    });

    it('does not render view statistics for a protected minor account', () => {
        render(
            React.createElement(SharedLinksSection, {
                vm: viewModel({ showViewStats: false }),
            })
        );
        expect(screen.queryByText(/Viewed 12 times/)).toBeNull();
    });
});

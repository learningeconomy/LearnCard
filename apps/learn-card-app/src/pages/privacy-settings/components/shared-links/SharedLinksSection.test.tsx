import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ShareLink } from '@learncard/types';

import type { DataSharingSharedLinksViewModel } from '../../DataSharingCenter.types';
import { useSharedLinksStore } from './sharedLinksStore';
import SharedLinksSection from './SharedLinksSection';

vi.mock('@ionic/react', () => ({
    IonIcon: ({ icon, ...rest }: Record<string, unknown>) => <span {...rest} />,
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { Center: 'center', BottomSheet: 'bottom', FullScreen: 'full' },
    useModal: () => ({ newModal: vi.fn(() => 1), closeModalById: vi.fn() }),
}));

vi.mock('../../../../components/share-links/ShareCredentialsIllustration', () => ({
    ShareCredentialsIllustration: () => <span />,
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

const buildVm = (
    overrides: Partial<DataSharingSharedLinksViewModel> = {}
): DataSharingSharedLinksViewModel =>
    ({
        records: [buildShare()],
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

const expiredShare = buildShare({
    id: 'expired-1',
    title: 'Expired link',
    expiresAt: '2020-01-01T00:00:00.000Z',
});

describe('SharedLinksSection loaded-only counts', () => {
    it('shows an exact active count when everything is loaded', () => {
        render(<SharedLinksSection vm={buildVm()} />);
        expect(screen.getByText('1 active')).toBeTruthy();
    });

    it('shows "N+ active" when more links remain unloaded', () => {
        render(<SharedLinksSection vm={buildVm({ hasMore: true })} />);
        expect(screen.getByText('1+ active')).toBeTruthy();
    });

    it('says none of the recent links are active when more remain and none loaded are active', () => {
        render(<SharedLinksSection vm={buildVm({ records: [expiredShare], hasMore: true })} />);
        expect(screen.getByText(/None of your most recent links are active/)).toBeTruthy();
        expect(screen.queryByText(/All quiet/)).toBeNull();
    });

    it('keeps the "all quiet" message when everything is loaded and none are active', () => {
        render(<SharedLinksSection vm={buildVm({ records: [expiredShare], hasMore: false })} />);
        expect(screen.getByText(/All quiet/)).toBeTruthy();
        expect(screen.queryByText(/None of your most recent links/)).toBeNull();
    });
});

describe('SharedLinksSection retry', () => {
    it('renders a shared Retry button that triggers a refresh', () => {
        const vm = buildVm({ records: [], error: true });
        render(<SharedLinksSection vm={vm} />);
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(vm.onRefresh).toHaveBeenCalledOnce();
    });
});

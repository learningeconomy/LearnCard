import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import ConsentFlowHeader from './ConsentFlowHeader';

const state = vi.hoisted(() => ({
    currentUser: { name: 'cybOrg', profileImage: '' },
    currentLCNUser: null as { displayName: string; image: string; profileId?: string } | null,
    switchedDid: undefined as string | undefined,
    getAvailableProfiles: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useCurrentUser: () => state.currentUser,
    useGetCurrentLCNUser: () => ({ currentLCNUser: state.currentLCNUser }),
    UserProfilePicture,
    useWallet: () => ({
        initWallet: async () => ({ invoke: { getAvailableProfiles: state.getAvailableProfiles } }),
    }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => state.currentUser,
}));
vi.mock('learn-card-base/hooks/useGetCurrentLCNUser', () => ({
    default: () => ({ currentLCNUser: state.currentLCNUser, currentLCNUserLoading: false }),
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: { use: { switchedDid: () => state.switchedDid } },
}));
vi.mock('learn-card-base/helpers/web3AuthHelpers', () => ({
    transformWeb3AuthProfileImage: (image: string) => image,
}));
vi.mock('learn-card-base/helpers/colorHelpers', () => ({
    ensureVisibleBaseColor: (color: string) => color,
    getRandomBaseColor: () => 'bg-grayscale-900',
}));
vi.mock('../../config/brandingAssets', () => ({
    useTenantBrandingAssets: () => ({ appIcon: '/app-icon.png' }),
}));

describe('consent account avatar', () => {
    let queryClient: QueryClient;
    const renderHeader = () =>
        render(<ConsentFlowHeader showCurrentUserPic />, {
            wrapper: ({ children }) => (
                <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            ),
        });
    beforeEach(() => {
        state.currentUser = { name: 'cybOrg', profileImage: '' };
        state.currentLCNUser = null;
        state.switchedDid = undefined;
        currentUserStore.set.parentUserDid(null);
        queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        state.getAvailableProfiles.mockResolvedValue({ records: [], hasMore: false });
    });
    afterEach(() => {
        cleanup();
        queryClient.clear();
        currentUserStore.set.parentUserDid(null);
    });

    it('shows the selected organization image instead of a stale local-account image', () => {
        state.currentUser.profileImage = 'https://example.com/parent.png';
        state.currentLCNUser = {
            displayName: 'cybOrg',
            image: 'https://example.com/organization.png',
        };
        renderHeader();
        const avatar = screen.getByRole('img', { name: 'user' });
        expect(avatar.getAttribute('src')).toContain('/organization.png');
        fireEvent.load(avatar);
        expect(avatar.classList.contains('opacity-100')).toBe(true);
    });

    it('replaces the initial fallback when the active network profile arrives', () => {
        const view = renderHeader();
        expect(screen.queryByRole('img', { name: 'user' })).toBeNull();
        state.currentLCNUser = {
            displayName: 'cybOrg',
            image: 'https://example.com/organization.png',
        };
        view.rerender(<ConsentFlowHeader showCurrentUserPic />);
        expect(screen.getByRole('img', { name: 'user' }).getAttribute('src')).toContain(
            '/organization.png'
        );
    });

    it('keeps the local avatar when the network profile is unavailable', () => {
        state.currentUser.profileImage = 'https://example.com/local.png';
        renderHeader();
        expect(screen.getByRole('img', { name: 'user' }).getAttribute('src')).toContain(
            '/local.png'
        );
    });

    it('shows the child’s family photo after guardian verification when its public profile is blank', async () => {
        state.currentUser = { name: '', profileImage: '' };
        state.currentLCNUser = { displayName: '', image: '', profileId: 'child-id' };
        state.switchedDid = 'did:web:localhost%3A4000:users:child-id';
        state.getAvailableProfiles.mockResolvedValue({
            records: [
                {
                    profile: { profileId: 'child-id' },
                    manager: { displayName: 'Lil Demo', image: 'https://example.com/child.png' },
                },
            ],
            hasMore: false,
        });

        renderHeader();

        const avatar = await screen.findByRole('img', { name: 'user' });
        expect(avatar.getAttribute('src')).toContain('/child.png');
        fireEvent.load(avatar);
        expect(avatar.classList.contains('opacity-100')).toBe(true);
    });

    it('loads the child avatar independently of cached available-profile lists', async () => {
        state.currentUser = { name: '', profileImage: '' };
        state.currentLCNUser = { displayName: '', image: '', profileId: 'child-id' };
        state.switchedDid = 'did:web:localhost%3A4000:users:child-id';
        queryClient.setQueryData(['getAvailableProfiles', '', { profileId: 'child-id' }], {
            records: [{ profile: { profileId: 'child-id' } }],
            hasMore: false,
        });
        state.getAvailableProfiles.mockResolvedValue({
            records: [
                {
                    profile: { profileId: 'child-id' },
                    manager: { displayName: 'Lil Demo', image: 'https://example.com/child.png' },
                },
            ],
            hasMore: false,
        });

        renderHeader();

        expect((await screen.findByRole('img', { name: 'user' })).getAttribute('src')).toContain(
            '/child.png'
        );
    });

    it('refreshes the child avatar when the parent account changes', async () => {
        state.currentUser = { name: '', profileImage: '' };
        state.currentLCNUser = { displayName: '', image: '', profileId: 'child-id' };
        state.switchedDid = 'did:web:localhost%3A4000:users:child-id';
        currentUserStore.set.parentUserDid('did:web:localhost%3A4000:users:first-parent');
        state.getAvailableProfiles.mockResolvedValue({
            records: [
                {
                    profile: { profileId: 'child-id' },
                    manager: { displayName: 'Lil Demo', image: 'https://example.com/first.png' },
                },
            ],
            hasMore: false,
        });
        renderHeader();
        expect((await screen.findByRole('img', { name: 'user' })).getAttribute('src')).toContain(
            '/first.png'
        );

        state.getAvailableProfiles.mockResolvedValue({
            records: [
                {
                    profile: { profileId: 'child-id' },
                    manager: { displayName: 'Lil Demo', image: 'https://example.com/second.png' },
                },
            ],
            hasMore: false,
        });
        act(() => {
            currentUserStore.set.parentUserDid('did:web:localhost%3A4000:users:second-parent');
        });

        await waitFor(() => {
            expect(screen.getByRole('img', { name: 'user' }).getAttribute('src')).toContain(
                '/second.png'
            );
        });
    });
});

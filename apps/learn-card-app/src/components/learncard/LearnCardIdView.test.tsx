import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import LearnCardIdView from './LearnCardIdView';

const state = vi.hoisted(() => ({
    currentUser: { name: 'Lil Demo', profileImage: 'https://example.com/local-child.png' },
    currentLCNUser: { profileId: 'child', displayName: '', image: '' },
}));
vi.mock('learn-card-base', () => ({
    useCurrentUser: () => state.currentUser,
    useGetCurrentLCNUser: () => ({ currentLCNUser: state.currentLCNUser }),
    switchedProfileStore: { use: { isSwitchedProfile: () => true } },
    UserProfilePicture,
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({ default: () => state.currentUser }));
vi.mock('learn-card-base/helpers/web3AuthHelpers', () => ({
    transformWeb3AuthProfileImage: (image: string) => image,
}));
vi.mock('learn-card-base/helpers/colorHelpers', () => ({
    ensureVisibleBaseColor: (color: string) => color,
    getRandomBaseColor: () => 'bg-grayscale-900',
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('../../config/brandingAssets', () => ({
    useTenantBrandingAssets: () => ({ brandMark: '/logo.png' }),
    DEFAULT_BRAND_MARK: '/logo.png',
}));

describe('sidebar profile identity', () => {
    beforeEach(() => {
        state.currentUser = {
            name: 'Lil Demo',
            profileImage: 'https://example.com/local-child.png',
        };
        state.currentLCNUser = { profileId: 'child', displayName: '', image: '' };
    });
    afterEach(cleanup);

    it('uses the switched account image when its network record has no image', () => {
        render(<LearnCardIdView />);
        expect(screen.getByText('Lil Demo')).toBeTruthy();
        const avatar = screen.getByRole('img', { name: 'user' });
        expect(avatar.getAttribute('src')).toContain('/local-child.png');
        fireEvent.load(avatar);
        expect(avatar.classList.contains('opacity-100')).toBe(true);
    });

    it('prefers the current network profile image over a stale local image', () => {
        state.currentUser = { name: 'Parent', profileImage: 'https://example.com/parent.png' };
        state.currentLCNUser = {
            profileId: 'child',
            displayName: 'Lil Demo',
            image: 'https://example.com/network-child.png',
        };
        render(<LearnCardIdView />);
        expect(screen.getByText('Lil Demo')).toBeTruthy();
        expect(screen.getByRole('img', { name: 'user' }).getAttribute('src')).toContain(
            '/network-child.png'
        );
    });

    it('does not use the signed-in account image when viewing another explicit profile', () => {
        render(
            <LearnCardIdView
                user={{ profileId: 'bea', displayName: 'Bea', did: 'did:example:bea', image: '' }}
            />
        );
        expect(screen.getByText('Bea')).toBeTruthy();
        expect(screen.queryByRole('img', { name: 'user' })).toBeNull();
    });
});

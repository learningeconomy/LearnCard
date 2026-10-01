import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import ConsentFlowHeader from './ConsentFlowHeader';

const state = vi.hoisted(() => ({
    currentUser: { name: 'cybOrg', profileImage: '' },
    currentLCNUser: null as { displayName: string; image: string } | null,
}));

vi.mock('learn-card-base', () => ({
    useCurrentUser: () => state.currentUser,
    useGetCurrentLCNUser: () => ({ currentLCNUser: state.currentLCNUser }),
    UserProfilePicture,
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => state.currentUser,
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
    beforeEach(() => {
        state.currentUser = { name: 'cybOrg', profileImage: '' };
        state.currentLCNUser = null;
    });
    afterEach(cleanup);

    it('shows the selected organization image instead of a stale local-account image', () => {
        state.currentUser.profileImage = 'https://example.com/parent.png';
        state.currentLCNUser = {
            displayName: 'cybOrg',
            image: 'https://example.com/organization.png',
        };
        render(<ConsentFlowHeader showCurrentUserPic />);
        const avatar = screen.getByRole('img', { name: 'user' });
        expect(avatar.getAttribute('src')).toContain('/organization.png');
        fireEvent.load(avatar);
        expect(avatar.classList.contains('opacity-100')).toBe(true);
    });

    it('replaces the initial fallback when the active network profile arrives', () => {
        const view = render(<ConsentFlowHeader showCurrentUserPic />);
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
        render(<ConsentFlowHeader showCurrentUserPic />);
        expect(screen.getByRole('img', { name: 'user' }).getAttribute('src')).toContain(
            '/local.png'
        );
    });
});

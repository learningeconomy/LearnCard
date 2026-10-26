import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UserProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import LearnCardIdView from './LearnCardIdView';

type TestLCNUser = {
    profileId: string;
    displayName: string;
    image: string;
    highlightedCredentials?: string[];
};

const state = vi.hoisted(() => ({
    currentUser: { name: 'Lil Demo', profileImage: 'https://example.com/local-child.png' },
    currentLCNUser: { profileId: 'child', displayName: '', image: '' } as TestLCNUser,
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
vi.mock('../featured-credentials/FeaturedCredentialBubbles', () => ({
    default: ({ uris, owner }: { uris?: readonly string[]; owner?: { profileId: string } }) => (
        <div
            data-testid="featured-credentials"
            data-uris={JSON.stringify(uris ?? null)}
            data-owner={owner?.profileId}
        />
    ),
}));

describe('sidebar profile identity', () => {
    beforeEach(() => {
        state.currentUser = {
            name: 'Lil Demo',
            profileImage: 'https://example.com/local-child.png',
        };
        state.currentLCNUser = { profileId: 'child', displayName: '', image: '' };
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

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

    it('shows a cached parent avatar after returning from a loaded child avatar', () => {
        const { rerender } = render(<LearnCardIdView />);
        fireEvent.load(screen.getByRole('img', { name: 'user' }));

        // A browser can finish a cached image before the source-change effect runs.
        vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
        vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(120);
        state.currentLCNUser = {
            profileId: 'demo',
            displayName: 'Demo',
            image: 'https://example.com/demo.png',
        };
        rerender(<LearnCardIdView />);

        const avatar = screen.getByRole('img', { name: 'user' });
        expect(avatar.getAttribute('src')).toBe('https://example.com/demo.png');
        expect(avatar.classList.contains('opacity-100')).toBe(true);
    });

    it('does not use the signed-in account image when viewing another explicit profile', () => {
        render(
            <LearnCardIdView
                user={{
                    profileId: 'bea',
                    displayName: 'Bea',
                    did: 'did:example:bea',
                    image: '',
                    shortBio: '',
                    bio: '',
                }}
            />
        );
        expect(screen.getByText('Bea')).toBeTruthy();
        expect(screen.queryByRole('img', { name: 'user' })).toBeNull();
    });

    it('features the signed-in network profile selection on the own identity card', () => {
        state.currentLCNUser = {
            profileId: 'child',
            displayName: 'Lil Demo',
            image: '',
            highlightedCredentials: ['lc:boost:first', 'lc:boost:second'],
        };
        render(<LearnCardIdView />);

        const bubbles = screen.getByTestId('featured-credentials');
        expect(bubbles.getAttribute('data-uris')).toBe(
            JSON.stringify(['lc:boost:first', 'lc:boost:second'])
        );
        expect(bubbles.getAttribute('data-owner')).toBe('child');
    });

    it('features only the explicit profile selection when viewing another profile', () => {
        state.currentLCNUser = {
            profileId: 'parent',
            displayName: 'Parent',
            image: '',
            highlightedCredentials: ['lc:boost:parent-only'],
        };
        render(
            <LearnCardIdView
                user={{
                    profileId: 'bea',
                    displayName: 'Bea',
                    did: 'did:example:bea',
                    image: '',
                    shortBio: '',
                    bio: '',
                    highlightedCredentials: ['lc:boost:bea'],
                }}
            />
        );

        const bubbles = screen.getByTestId('featured-credentials');
        expect(bubbles.getAttribute('data-uris')).toBe(JSON.stringify(['lc:boost:bea']));
        expect(bubbles.getAttribute('data-owner')).toBe('bea');
    });
});

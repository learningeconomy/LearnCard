// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    user: { name: '', profileImage: '' },
    profile: {
        did: 'did:key:organization',
        displayName: 'Demo Organization',
        image: 'https://example.com/organization.png',
    },
}));

vi.mock('learn-card-base', () => ({
    useCurrentUser: () => state.user,
    useIsLoggedIn: () => true,
    useGetProfile: () => ({ data: state.profile, error: null, isLoading: false, refetch: vi.fn() }),
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    default: {
        set: {
            updateCurrentUserNameAndImage: (name: string, profileImage: string) => {
                state.user = { name, profileImage };
            },
        },
    },
}));
vi.mock('../stores/nanoStores/authStore', () => ({ auth: { set: vi.fn() } }));

import { useGetCurrentLCNUser } from './useGetCurrentLCNUser';

describe('useGetCurrentLCNUser', () => {
    beforeEach(() => {
        state.user = { name: '', profileImage: '' };
    });

    it('restores the selected organization name and image after wallet initialization', () => {
        const { result } = renderHook(() => useGetCurrentLCNUser());

        expect(result.current.currentLCNUser?.displayName).toBe('Demo Organization');
        expect(state.user).toEqual({
            name: 'Demo Organization',
            profileImage: 'https://example.com/organization.png',
        });
    });
});

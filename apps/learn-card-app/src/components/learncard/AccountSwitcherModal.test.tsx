import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LCNProfile } from '@learncard/types';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';
import { useSwitchProfile } from 'learn-card-base/hooks/useSwitchAccount';
import useGetCurrentLCNUser from 'learn-card-base/hooks/useGetCurrentLCNUser';

const state = vi.hoisted(() => ({ records: [] as { profile: LCNProfile; manager: LCNProfile }[] }));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    switchProfile: async (did?: string) => switchedProfileStore.set.switchedDid(did),
}));
vi.mock('learn-card-base/hooks/useGetCurrentLCNUser', () => ({
    default: () => ({
        currentLCNUser: {
            did: 'did:example:parent',
            profileId: 'parent',
            displayName: 'Parent',
            shortBio: '',
            bio: '',
        },
    }),
}));
vi.mock('learn-card-base', () => ({
    useSwitchProfile,
    useGetCurrentLCNUser,
    useCurrentUser: () => currentUserStore.use.currentUser(),
    useGetAvailableProfiles: () => ({ data: { records: state.records }, isLoading: false }),
    switchedProfileStore,
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn(), closeAllModals: vi.fn() }),
    ModalTypes: { FullScreen: 'fullscreen' },
    UserProfilePicture: () => null,
}));
vi.mock('../../hooks/useCreateChildAccount', () => ({
    useCreateChildAccount: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../hooks/useGetFamilyCredential', () => ({
    default: () => ({ familyCredential: null }),
}));
vi.mock('./ParentSwitcherButton', () => ({ default: () => null }));
vi.mock('./ActiveChildAccountButton', () => ({ default: () => null }));
vi.mock('./NewProfileButton', () => ({ default: () => null }));
vi.mock('./NewProfileTypeSelector', () => ({ default: () => null }));
vi.mock('../familyCMS/FamilyCMSInviteModal/ChildInviteModal/ChildInviteModal', () => ({
    default: () => null,
}));
vi.mock(
    '../../pages/adminToolsPage/AdminToolsAccountSwitcher/AdminToolsCreateProfileSimple',
    () => ({ default: () => null })
);
import AccountSwitcherModal from './AccountSwitcherModal';

const profile = (
    profileId: string,
    displayName: string,
    type: string,
    isServiceProfile: boolean
): LCNProfile => ({
    did: `did:example:${profileId}`,
    profileId,
    displayName,
    type,
    isServiceProfile,
    shortBio: '',
    bio: '',
});
const legacyChild = profile('legacy-child', '', 'child', true);
const organization = profile('org', 'Organization fixture', 'organization', true);
const manager = profile('manager', 'Legacy learner', 'organization', false);
let client: QueryClient;
const mount = (props: React.ComponentProps<typeof AccountSwitcherModal> = {}) =>
    render(
        <QueryClientProvider client={client}>
            <AccountSwitcherModal {...props} />
        </QueryClientProvider>
    );

describe('account picker child classification', () => {
    beforeEach(() => {
        client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        state.records = [
            { profile: legacyChild, manager },
            { profile: organization, manager },
        ];
        switchedProfileStore.set.switchedDid(undefined);
        switchedProfileStore.set.profileType('parent');
        currentUserStore.set.parentUser(null);
        currentUserStore.set.parentUserDid(null);
        currentUserStore.set.currentUser({
            uid: 'parent',
            email: '',
            phoneNumber: '',
            name: 'Parent',
            profileImage: '',
            privateKey: 'test-key',
            baseColor: '',
        });
    });
    afterEach(() => {
        cleanup();
        client.clear();
        currentUserStore.set.currentUser(null);
        currentUserStore.set.parentUser(null);
        currentUserStore.set.parentUserDid(null);
        currentUserStore.set.parentLDFlags(undefined);
        switchedProfileStore.set.switchedDid(undefined);
        switchedProfileStore.set.profileType(null);
    });

    it('keeps legacy children visible in the default child picker', () => {
        mount();
        expect(screen.queryByRole('button', { name: /Organization fixture/ })).toBeNull();
        expect(screen.getByRole('button', { name: /Legacy learner/ })).toBeTruthy();
    });

    it('excludes explicit children from the organization-only picker', () => {
        mount({ showServiceProfilesOnly: true });
        expect(screen.queryByRole('button', { name: /Legacy learner/ })).toBeNull();
        expect(screen.getByRole('button', { name: /Organization fixture/ })).toBeTruthy();
    });

    it('preserves the persisted child type instead of manager metadata in the combined picker', async () => {
        mount({ showServiceProfiles: true });
        fireEvent.click(screen.getByRole('button', { name: /Legacy learner/ }));
        await waitFor(() => expect(switchedProfileStore.get.profileType()).toBe('child'));
        expect(switchedProfileStore.get.switchedDid()).toBe(legacyChild.did);
    });
});

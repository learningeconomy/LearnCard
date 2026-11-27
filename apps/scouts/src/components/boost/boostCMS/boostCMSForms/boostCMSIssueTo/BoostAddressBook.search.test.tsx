// @vitest-environment happy-dom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    BoostAddressBook,
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './BoostAddressBook';

const { networkProfile, scoutProfile, roleState, scoutRecipients, searchProfiles } = vi.hoisted(
    () => ({
        networkProfile: {
            profileId: 'network-user',
            displayName: 'Network Result',
            did: 'did:example:network-user',
        },
        scoutProfile: {
            profileId: 'troop-user',
            displayName: 'Troop Member',
            did: 'did:example:troop-user',
        },
        roleState: { current: undefined as string | undefined },
        scoutRecipients: {
            current: [] as Array<{ to: { profileId: string; displayName: string; did: string } }>,
        },
        searchProfiles: vi.fn((query: string, options: { enabled?: boolean } = {}) => ({
            data:
                (options.enabled ?? true) && query === 'network-user'
                    ? [
                          {
                              profileId: 'network-user',
                              displayName: 'Network Result',
                              did: 'did:example:network-user',
                          },
                      ]
                    : [],
            isLoading: false,
        })),
    })
);

vi.mock('learn-card-base', () => ({
    BoostUserTypeEnum: { someone: 'someone' },
    ModalTypes: { Cancel: 'cancel', FullScreen: 'full-screen' },
    UserProfilePicture: () => null,
    getLogger: () => ({ debug: vi.fn() }),
    useGetBoostParents: () => ({ data: { records: [] } }),
    useGetCurrentLCNUser: () => ({
        currentLCNUser: undefined,
        currentLCNUserLoading: false,
    }),
    useGetSearchProfiles: searchProfiles,
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    useResolveBoost: () => ({ data: undefined }),
    useWallet: () => ({ initWallet: () => new Promise(() => {}) }),
}));

vi.mock('learn-card-base/svgs/CaretLeft', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/Plus', () => ({ default: () => null }));
vi.mock('react-lottie-player', () => ({ default: () => null }));

vi.mock('../../../../../hooks/useTroopMembers', () => ({
    default: () => ({ scoutRecipients: scoutRecipients.current, isLoading: false }),
}));
vi.mock('../../../../../hooks/useNetworkMembers', () => ({
    default: () => ({ data: { pages: [] }, isLoading: false }),
}));
vi.mock('../../../../../stores/boostSearchStore', () => ({
    default: {
        use: {
            contextCredential: () => undefined,
            boostUri: () => undefined,
            role: () => roleState.current,
        },
        set: {
            boostUri: vi.fn(),
            contextCredential: vi.fn(),
        },
    },
}));
vi.mock('../../../../../stores/troopPageStore', () => ({
    ScoutsRoleEnum: { leader: 'leader', national: 'national' },
}));
vi.mock('../../../../../pages/troop/TroopPageMembersBox', () => ({
    MemberTabsEnum: { Scouts: 'scouts' },
}));
vi.mock('./BoostAddressBookContactOptions', () => ({ default: () => null }));
vi.mock('./BoostShareableCode', () => ({ default: () => null }));
vi.mock('./BoostAddressBookContactList', () => ({
    default: ({ contacts }: { contacts: Array<{ profileId: string; displayName?: string }> }) => (
        <div>
            {contacts.map(contact => (
                <p key={contact.profileId}>{contact.displayName ?? contact.profileId}</p>
            ))}
        </div>
    ),
}));

describe('BoostAddressBook network search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        roleState.current = undefined;
        scoutRecipients.current = [];
    });

    it('shows Scout network results when the user has no contacts', async () => {
        render(
            <BoostAddressBook
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                state={{ issueTo: [] } as any}
                setState={vi.fn()}
                viewMode={BoostAddressBookViewMode.full}
                mode={BoostAddressBookEditMode.edit}
                _issueTo={[]}
                _setIssueTo={vi.fn()}
                search=""
                setSearch={vi.fn()}
                searchResults={[]}
                isLoading={false}
                recipients={[]}
                recipientsLoading={false}
                boostUri="boost:example"
            />
        );

        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: networkProfile.profileId },
        });

        expect(await screen.findByText(networkProfile.displayName)).toBeTruthy();
    });

    it('does not enable global profile search before the user types', () => {
        render(
            <BoostAddressBook
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                state={{ issueTo: [] } as any}
                setState={vi.fn()}
                viewMode={BoostAddressBookViewMode.full}
                mode={BoostAddressBookEditMode.edit}
                _issueTo={[]}
                _setIssueTo={vi.fn()}
                search=""
                setSearch={vi.fn()}
                searchResults={[]}
                isLoading={false}
                recipients={[]}
                recipientsLoading={false}
                boostUri="boost:example"
            />
        );

        expect(searchProfiles).toHaveBeenCalledWith('', { enabled: false });
    });

    it('keeps troop-leader search scoped to troop members', async () => {
        roleState.current = 'leader';
        scoutRecipients.current = [{ to: scoutProfile }];

        render(
            <BoostAddressBook
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                state={{ issueTo: [] } as any}
                setState={vi.fn()}
                viewMode={BoostAddressBookViewMode.full}
                mode={BoostAddressBookEditMode.edit}
                _issueTo={[]}
                _setIssueTo={vi.fn()}
                search=""
                setSearch={vi.fn()}
                searchResults={[networkProfile]}
                isLoading={false}
                recipients={[]}
                recipientsLoading={false}
                boostUri="boost:example"
            />
        );

        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: scoutProfile.profileId },
        });

        expect(await screen.findByText(scoutProfile.displayName)).toBeTruthy();
        expect(screen.queryByText(networkProfile.displayName)).toBeNull();
        await waitFor(() =>
            expect(searchProfiles).toHaveBeenLastCalledWith(scoutProfile.profileId, {
                enabled: false,
            })
        );
    });
});

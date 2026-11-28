// @vitest-environment happy-dom

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BoostSearch from './BoostSearch';

const { roleState, searchProfiles, emptyScoutRecipients, emptyNetworkPages } = vi.hoisted(() => ({
    roleState: { current: undefined as string | undefined },
    searchProfiles: vi.fn(() => ({ data: [], isLoading: false })),
    emptyScoutRecipients: [] as never[],
    emptyNetworkPages: [] as never[],
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn() }),
    useGetSearchProfiles: searchProfiles,
    useWallet: () => ({
        initWallet: () => new Promise(() => {}),
    }),
}));
vi.mock('learn-card-base/components/loaders/LoadingSpinner', () => ({
    LoadingSpinner: () => null,
}));
vi.mock('learn-card-base/svgs/CaretLeft', () => ({ default: () => null }));
vi.mock('react-lottie-player', () => ({ default: () => null }));
vi.mock('../../../hooks/useTroopMembers', () => ({
    default: () => ({ scoutRecipients: emptyScoutRecipients, isLoading: false }),
}));
vi.mock('../../../hooks/useNetworkMembers', () => ({
    default: () => ({ data: { pages: emptyNetworkPages }, isLoading: false }),
}));
vi.mock('../../../stores/boostSearchStore', () => ({
    default: {
        use: {
            contextCredential: () => undefined,
            boostUri: () => undefined,
            role: () => roleState.current,
        },
    },
}));
vi.mock('../../../stores/troopPageStore', () => ({
    ScoutsRoleEnum: { leader: 'leader', national: 'national' },
}));
vi.mock('../../../pages/troop/TroopPageMembersBox', () => ({
    MemberTabsEnum: { Scouts: 'scouts' },
}));
vi.mock('../../../i18n/formatters', () => ({
    formatLocaleCount: (count: number) => `${count} contacts`,
}));
vi.mock('../../../paraglide/messages.js', () => ({
    'boost.contactOne': () => 'contact',
    'boost.contactOther': () => 'contacts',
    'boost.networkMemberLabelOne': () => 'member',
    'boost.networkMemberLabelOther': () => 'members',
    'boost.noConnectionsYet': () => 'No connections',
    'boost.noNetworkMembers': () => 'No network members',
    'boost.noSearchResults': () => 'No results',
    'boost.noTroopMembers': () => 'No troop members',
    'boost.scoutMemberOne': () => 'scout',
    'boost.scoutMemberOther': () => 'scouts',
    'boost.searchNetwork': () => 'Search network',
    'boost.searchScoutPass': () => 'Search ScoutPass',
    'boost.searchTroop': () => 'Search troop',
    'boost.troop': () => 'Troop',
    'common.save': () => 'Save',
}));
vi.mock('../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook', () => ({
    BoostAddressBookEditMode: { edit: 'edit' },
    BoostAddressBookViewMode: { full: 'full' },
}));
vi.mock('../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactList', () => ({
    default: () => null,
}));

const renderSearch = (ignoreBoostSearchRestriction = false) =>
    render(
        <BoostSearch
            handleCloseModal={vi.fn()}
            boostCredential={{} as never}
            boostUri="boost:example"
            profileId="issuer"
            state={{ issueTo: [] }}
            setState={vi.fn()}
            history={{}}
            ignoreBoostSearchRestriction={ignoreBoostSearchRestriction}
        />
    );

describe('BoostSearch global profile query scope', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        roleState.current = undefined;
    });

    it('does not enable global search for a scoped troop leader', async () => {
        roleState.current = 'leader';
        renderSearch();

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'scout' } });

        await waitFor(() =>
            expect(searchProfiles).toHaveBeenLastCalledWith('scout', { enabled: false })
        );
    });

    it('allows global search when restrictions are explicitly ignored', async () => {
        roleState.current = 'leader';
        renderSearch(true);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'scout' } });

        await waitFor(() =>
            expect(searchProfiles).toHaveBeenLastCalledWith('scout', { enabled: true })
        );
    });
});

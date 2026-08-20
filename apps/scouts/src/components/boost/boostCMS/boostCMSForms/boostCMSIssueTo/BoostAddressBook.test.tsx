// @vitest-environment happy-dom

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    BoostAddressBook,
    BoostAddressBookEditMode,
    BoostAddressBookViewMode,
} from './BoostAddressBook';

const { contact, emptyPages, emptyScouts } = vi.hoisted(() => ({
    contact: {
        profileId: 'test-contact',
        displayName: 'Test Contact',
        did: 'did:example:test-contact',
    },
    emptyPages: [] as never[],
    emptyScouts: [] as never[],
}));

vi.mock('@ionic/react', () => {
    const Container = ({ children }: React.PropsWithChildren) => <div>{children}</div>;

    return {
        IonCol: Container,
        IonContent: Container,
        IonFooter: Container,
        IonGrid: Container,
        IonHeader: Container,
        IonInput: ({ placeholder }: { placeholder?: string }) => (
            <input placeholder={placeholder} />
        ),
        IonItem: Container,
        IonList: Container,
        IonPage: Container,
        IonRow: Container,
        IonSpinner: () => null,
        IonToolbar: Container,
    };
});

vi.mock('learn-card-base', () => ({
    BoostUserTypeEnum: { someone: 'someone' },
    ModalTypes: { Cancel: 'cancel', FullScreen: 'full-screen' },
    UserProfilePicture: () => null,
    getLogger: () => ({ debug: vi.fn() }),
    useGetBoostParents: () => ({ data: { records: [] } }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: undefined, currentLCNUserLoading: false }),
    useModal: () => ({ newModal: vi.fn(), closeModal: vi.fn() }),
    useResolveBoost: () => ({ data: undefined }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: { getConnections: async () => [contact] },
        }),
    }),
}));

vi.mock('learn-card-base/svgs/CaretLeft', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/Checkmark', () => ({
    default: () => <span>Selected contact</span>,
}));
vi.mock('learn-card-base/svgs/Plus', () => ({ default: () => <span>Add contact</span> }));

vi.mock('react-lottie-player', () => ({ default: () => null }));
vi.mock('../../../../../hooks/useTroopMembers', () => ({
    default: () => ({ scoutRecipients: emptyScouts, isLoading: false }),
}));
vi.mock('../../../../../hooks/useNetworkMembers', () => ({
    default: () => ({ data: { pages: emptyPages }, isLoading: false }),
}));
vi.mock('../../../../../stores/boostSearchStore', () => ({
    default: {
        set: { boostUri: vi.fn(), contextCredential: vi.fn() },
        use: {
            boostUri: () => undefined,
            contextCredential: () => undefined,
            role: () => undefined,
        },
    },
}));
vi.mock('../../../../../stores/troopPageStore', () => ({
    ScoutsRoleEnum: { leader: 'leader', national: 'national' },
}));
vi.mock('../../../../../pages/troop/TroopPageMembersBox', () => ({
    MemberTabsEnum: { Scouts: 'scouts' },
}));
vi.mock('../../../../../i18n/formatters', () => ({
    formatLocaleCount: (count: number) => `${count} Contacts`,
    formatLocaleDate: vi.fn(),
    formatLocaleTime: vi.fn(),
}));
vi.mock('./BoostAddressBookContactOptions', () => ({ default: () => null }));
vi.mock('./BoostShareableCode', () => ({ default: () => null }));

describe('BoostAddressBook contact selection', () => {
    afterEach(cleanup);

    it('keeps a selected contact live until the selection is saved', async () => {
        let cmsState = { issueTo: [] as (typeof contact)[] };
        const setState = vi.fn((update: React.SetStateAction<typeof cmsState>) => {
            cmsState = typeof update === 'function' ? update(cmsState) : update;
        });

        render(
            <BoostAddressBook
                state={cmsState as never}
                setState={setState as never}
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
                boostUri="urn:boost:test"
            />
        );

        expect(await screen.findByText('Test Contact')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Add contact' }));

        expect(screen.getByRole('button', { name: 'Selected contact' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(cmsState.issueTo).toEqual([contact]);
    });

    it('does not restore contacts after deselecting all, saving, and reopening', async () => {
        let cmsState = { issueTo: [contact] };
        let openerIssueTo = [contact];
        const setState = vi.fn((update: React.SetStateAction<typeof cmsState>) => {
            cmsState = typeof update === 'function' ? update(cmsState) : update;
        });
        const setOpenerIssueTo = vi.fn((contacts: typeof openerIssueTo) => {
            openerIssueTo = contacts;
        });

        const renderPicker = () =>
            render(
                <BoostAddressBook
                    state={cmsState as never}
                    setState={setState as never}
                    viewMode={BoostAddressBookViewMode.full}
                    mode={BoostAddressBookEditMode.edit}
                    _issueTo={openerIssueTo}
                    _setIssueTo={setOpenerIssueTo as never}
                    search=""
                    setSearch={vi.fn()}
                    searchResults={[]}
                    isLoading={false}
                    recipients={[]}
                    recipientsLoading={false}
                    boostUri="urn:boost:test"
                />
            );

        renderPicker();
        expect(await screen.findByRole('button', { name: 'Selected contact' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Selected contact' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        cleanup();
        renderPicker();

        expect(await screen.findByRole('button', { name: 'Add contact' })).toBeTruthy();
    });

    it('syncs committed empty selections without discarding a supplied modal selection', async () => {
        const renderPicker = (pickerState: Record<string, unknown>) => (
            <BoostAddressBook
                state={pickerState as never}
                setState={vi.fn()}
                viewMode={BoostAddressBookViewMode.full}
                mode={BoostAddressBookEditMode.edit}
                _issueTo={[contact]}
                _setIssueTo={vi.fn()}
                search=""
                setSearch={vi.fn()}
                searchResults={[]}
                isLoading={false}
                recipients={[]}
                recipientsLoading={false}
                boostUri="urn:boost:test"
            />
        );

        const { rerender } = render(renderPicker({ issueTo: [contact] }));
        expect(await screen.findByRole('button', { name: 'Selected contact' })).toBeTruthy();

        rerender(renderPicker({ issueTo: [] }));
        expect(await screen.findByRole('button', { name: 'Add contact' })).toBeTruthy();

        cleanup();
        render(renderPicker({}));

        expect(await screen.findByRole('button', { name: 'Selected contact' })).toBeTruthy();
    });
});

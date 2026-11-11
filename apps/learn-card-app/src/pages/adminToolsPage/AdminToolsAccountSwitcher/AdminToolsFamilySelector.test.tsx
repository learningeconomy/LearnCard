import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

const state = vi.hoisted(() => ({
    families: [] as VC[],
    createChild: vi.fn(),
    newModal: (_content: React.ReactNode) => {},
    closeModal: () => {},
}));

vi.mock('learn-card-base', () => {
    return {
        getLogger: () => ({ error: vi.fn() }),
        ProfilePicture: ({ overrideSrcURL }: { overrideSrcURL?: string }) => (
            <img alt="Family photo" src={overrideSrcURL} />
        ),
        UserProfilePicture: () => null,
        useModal: () => ({ newModal: state.newModal, closeModal: state.closeModal }),
        useGetCredentials: () => ({ data: state.families }),
        useWallet: () => ({ initWallet: vi.fn() }),
        useToast: () => ({ presentToast: vi.fn() }),
        useImageUpload: () => ({ handleFileSelect: vi.fn(), isLoading: false }),
        useCreateBoost: () => ({ mutateAsync: vi.fn() }),
        useCurrentUser: () => ({}),
        useGetCurrentLCNUser: () => ({ currentLCNUser: {} }),
        useGetProfile: () => ({ data: null, isLoading: false, isFetching: false }),
        switchedProfileStore: { get: { isSwitchedProfile: () => false } },
        currentUserStore: {},
        toKebabCase: (value: string) => value,
        initialBoostCMSState: {},
        getNotificationsEndpoint: vi.fn(),
        constructCustomBoostType: vi.fn(),
        BoostCategoryOptionsEnum: {},
        boostCategoryMetadata: {},
        CredentialCategoryEnum: { family: 'family' },
        ToastTypeEnum: { Error: 'error' },
        ModalTypes: { Cancel: 'cancel', FullScreen: 'fullscreen' },
    };
});
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({ getBespokeLearnCard: vi.fn() }));
vi.mock('../../../components/boost/mutations', () => ({
    useAddCredentialToWallet: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('../../../components/boost/boostHelpers', () => ({ sendBoostCredential: vi.fn() }));
vi.mock('../../../components/boost/boost', () => ({ LCNBoostStatusEnum: {} }));
vi.mock('../../../hooks/useCreateChildAccount', () => ({
    useCreateChildAccount: () => ({ mutate: state.createChild }),
}));
vi.mock('../../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: vi.fn() }),
}));
vi.mock('../../../components/learncardID-CMS/LearnCardIDCMS', () => ({ default: () => null }));
vi.mock('../../../components/learncardID-CMS/LearnCardIDCMSTabs', () => ({
    LearnCardIDCMSTabsEnum: { dark: 'dark' },
}));
vi.mock('../../../components/learncardID-CMS/learncard-cms.helpers', () => ({
    DEFAULT_COLOR_LIGHT: '',
    DEFAULT_LEARNCARD_ID_WALLPAPER: '',
    DEFAULT_LEARNCARD_WALLPAPER: '',
    getLearnCardIDStyleDefaults: () => ({}),
}));
vi.mock('@learncard/react', () => ({ Checkmark: () => null }));
vi.mock('@ionic/react', () => ({
    IonSpinner: () => null,
    IonInput: ({
        label,
        value,
        onIonInput,
    }: {
        label?: string;
        value?: string;
        onIonInput: (event: { detail: { value: string } }) => void;
    }) => (
        <label>
            {label}
            <input
                value={value ?? ''}
                onChange={event => onIonInput({ detail: { value: event.target.value } })}
            />
        </label>
    ),
}));

import AdminToolsCreateProfileSimple from './AdminToolsCreateProfileSimple';
import * as m from '../../../paraglide/messages.js';

const directFamily = (name: string, image: string, boostId: string): VC =>
    ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:parent',
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: {},
        proof: {
            type: 'Ed25519Signature2020',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:example:parent#key-1',
            jws: 'fixture-proof',
        },
        name,
        image,
        boostId,
    }) as VC;

const wrappedFamily = (name: string, image: string, boostId: string): VC =>
    ({
        ...directFamily('Outer label', 'outer-photo.png', boostId),
        type: ['VerifiableCredential', 'CertifiedBoostCredential'],
        boostCredential: directFamily(name, image, 'inner:never-use-for-selection'),
    }) as VC;

const mount = () => {
    const Host = () => {
        const [modal, setModal] = useState<React.ReactNode>(null);
        state.newModal = setModal;
        state.closeModal = () => setModal(null);
        return (
            <QueryClientProvider client={new QueryClient()}>
                <AdminToolsCreateProfileSimple profileType="child" />
                {modal && <div role="dialog">{modal}</div>}
            </QueryClientProvider>
        );
    };
    return render(<Host />);
};

const createChild = async () => {
    const nameInput = screen.getByLabelText(m['family.childInvite.nameLabel']());
    fireEvent.change(nameInput, { target: { value: 'Avery' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(state.createChild).toHaveBeenCalledTimes(1));
};

describe('Family identity in child creation', () => {
    beforeEach(() => state.createChild.mockReset().mockResolvedValue(undefined));
    afterEach(cleanup);

    it.each([
        {
            format: 'direct',
            family: directFamily('Direct Family', 'direct-photo.png', 'outer:direct'),
        },
        {
            format: 'wrapped',
            family: wrappedFamily('Legacy Family', 'legacy-photo.png', 'outer:legacy'),
        },
    ])(
        'displays the $format default and creates the child under its outer URI',
        async ({ family }) => {
            state.families = [family];
            mount();
            const display = family.boostCredential ?? family;
            const selected = await screen.findByRole('button', {
                name: `Family photo ${display.name} Family`,
            });
            expect(within(selected).getByRole('img').getAttribute('src')).toBe(display.image);
            await createChild();
            expect(state.createChild.mock.calls[0]?.[0]).toMatchObject({
                boostUri: family.boostId,
            });
        }
    );

    it('shows distinct wrapped choices and uses the second Family identity and outer URI', async () => {
        state.families = [
            wrappedFamily('River Family', 'river-photo.png', 'outer:river'),
            wrappedFamily('Forest Family', 'forest-photo.png', 'outer:forest'),
        ];
        mount();
        fireEvent.click(
            await screen.findByRole('button', { name: 'Family photo River Family Family' })
        );
        const chooser = screen.getByRole('dialog');
        const river = within(chooser).getByRole('button', { name: /^Family photo River Family/ });
        const forest = within(chooser).getByRole('button', { name: 'Family photo Forest Family' });
        expect(within(river).getByRole('img').getAttribute('src')).toBe('river-photo.png');
        expect(within(forest).getByRole('img').getAttribute('src')).toBe('forest-photo.png');
        fireEvent.click(forest);
        expect(screen.queryByRole('dialog')).toBeNull();
        const selected = screen.getByRole('button', { name: 'Family photo Forest Family Family' });
        expect(within(selected).getByRole('img').getAttribute('src')).toBe('forest-photo.png');
        await createChild();
        expect(state.createChild.mock.calls[0]?.[0]).toMatchObject({ boostUri: 'outer:forest' });
    });
});

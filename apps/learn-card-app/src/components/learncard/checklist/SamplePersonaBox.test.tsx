import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentContractUri = 'lc:network:example:contract:student';
const legacyContractUri = 'lc:network:example:contract:legacy';
const currentTermsUri = 'lc:network:example:terms:student';
const currentCredentialUri = 'lc:network:example:credential:student';
const legacyTermsUri = 'lc:network:example:terms:legacy';
const legacyCredentialUri = 'lc:network:example:credential:legacy';

const mocks = vi.hoisted(() => ({
    closeAllModals: vi.fn(),
    closeModal: vi.fn(),
    confirm: vi.fn(),
    consentToContract: vi.fn(),
    deleteCredentialFromAllContracts: vi.fn(),
    deleteCredentialRecord: vi.fn(),
    fetchNewContractCredentials: vi.fn(),
    initWallet: vi.fn(),
    invalidateQueries: vi.fn(),
    newModal: vi.fn(),
    presentToast: vi.fn(),
    queueAiInsightCredentialRefresh: vi.fn(),
    refetchQueries: vi.fn(),
    removeCreds: vi.fn(),
    useConsentedContracts: vi.fn(),
    useContract: vi.fn(),
    useFeatureConfig: vi.fn(),
    useGetCredentialsFromContracts: vi.fn(),
    useWithdrawConsent: vi.fn(),
    withdrawConsent: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: mocks.invalidateQueries,
        refetchQueries: mocks.refetchQueries,
    }),
}));

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useFeatureConfig: () => mocks.useFeatureConfig(),
}));

vi.mock('../../../helpers/contract.helpers', () => ({
    getMinimumTermsForContract: () => ({ write: { credentials: true } }),
}));

vi.mock('../../svgs/TrashBin', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('learn-card-base/svgs/CircleCheckmark', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('../../../paraglide/messages.js', () => ({
    'common.cancel': () => 'Cancel',
    'passport.buildMyLearnCard.samplePersona.title': () => 'See an example LearnCard',
    'passport.buildMyLearnCard.samplePersona.sampleTitle': () => 'Sample LearnCard',
    'passport.buildMyLearnCard.samplePersona.description': () => 'Sample description',
    'passport.buildMyLearnCard.samplePersona.removeDescription': () => 'Remove description',
    'passport.buildMyLearnCard.samplePersona.addAction': () => 'See an example LearnCard',
    'passport.buildMyLearnCard.samplePersona.addPersonaAction': ({
        persona,
    }: {
        persona: string;
    }) => `Add ${persona} example`,
    'passport.buildMyLearnCard.samplePersona.addSuccess': () => 'Sample credentials added.',
    'passport.buildMyLearnCard.samplePersona.addError': () => 'Add failed',
    'passport.buildMyLearnCard.samplePersona.connecting': () => 'Setting up...',
    'passport.buildMyLearnCard.samplePersona.adding': () => 'Adding sample credentials...',
    'passport.buildMyLearnCard.samplePersona.checking': () => 'Checking sample credentials...',
    'passport.buildMyLearnCard.samplePersona.removeAction': () => 'Remove sample credentials',
    'passport.buildMyLearnCard.samplePersona.removeConfirmation': () => 'Remove all?',
    'passport.buildMyLearnCard.samplePersona.removeSuccess': ({ count }: { count: number }) =>
        `Removed ${count} sample credentials.`,
    'passport.buildMyLearnCard.samplePersona.removeError': () => 'Remove failed',
    'passport.buildMyLearnCard.samplePersona.disconnecting': () => 'Disconnecting...',
    'passport.buildMyLearnCard.samplePersona.deleting': () => 'Removing...',
    'passport.buildMyLearnCard.samplePersona.chooseAction': () => 'Choose an example',
    'passport.buildMyLearnCard.samplePersona.pickerTitle': () => 'Choose an example LearnCard',
    'passport.buildMyLearnCard.samplePersona.pickerDescription': () => 'Pick one',
}));

vi.mock('learn-card-base', () => ({
    ModalTypes: { Center: 'center' },
    ToastTypeEnum: { Error: 'error' },
    deleteCredentialFromAllContracts: (...args: unknown[]) =>
        mocks.deleteCredentialFromAllContracts(...args),
    getLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    newCredsStore: { set: { removeCreds: mocks.removeCreds } },
    queueAiInsightCredentialRefresh: (...args: unknown[]) =>
        mocks.queueAiInsightCredentialRefresh(...args),
    switchedProfileStore: { get: { switchedDid: () => 'did:web:learner.example' } },
    useConfirmation: () => mocks.confirm,
    useConsentedContracts: () => mocks.useConsentedContracts(),
    useConsentToContract: () => ({ mutateAsync: mocks.consentToContract, isPending: false }),
    useContract: (...args: unknown[]) => mocks.useContract(...args),
    useCurrentUser: () => ({ id: 'learner-1' }),
    useDeleteCredentialRecord: () => ({ mutateAsync: mocks.deleteCredentialRecord }),
    useGetCredentialsFromContracts: (...args: unknown[]) =>
        mocks.useGetCredentialsFromContracts(...args),
    useModal: () => ({
        newModal: mocks.newModal,
        closeModal: mocks.closeModal,
        closeAllModals: mocks.closeAllModals,
    }),
    useSyncConsentFlow: () => ({ refetch: mocks.fetchNewContractCredentials }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useWithdrawConsent: () => ({
        mutateAsync: mocks.withdrawConsent,
        isPending: false,
    }),
}));

import SamplePersonaBox from './SamplePersonaBox';

const studentPersona = { id: 'student', contractUri: currentContractUri };
const currentConsent = {
    uri: currentTermsUri,
    status: 'active',
    contract: { uri: currentContractUri },
};
const legacyConsent = {
    uri: legacyTermsUri,
    status: 'active',
    contract: { uri: legacyContractUri },
};
const legacyCredential = { uri: legacyCredentialUri, title: 'Legacy Sample Credential' };
const currentCredential = { uri: currentCredentialUri, title: 'Current Sample Credential' };

describe('SamplePersonaBox', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.useFeatureConfig.mockReturnValue({
            samplePersonas: [studentPersona],
            legacySamplePersonaContractUris: [legacyContractUri],
        });
        mocks.useContract.mockReturnValue({
            data: { contract: {}, owner: { did: 'did:example:demo-school' } },
            isLoading: false,
        });
        mocks.useConsentedContracts.mockReturnValue({ data: [], isLoading: false });
        mocks.useGetCredentialsFromContracts.mockReturnValue({ data: [], isLoading: false });
        mocks.confirm.mockResolvedValue(true);
        mocks.consentToContract.mockResolvedValue(undefined);
        mocks.deleteCredentialRecord.mockResolvedValue(undefined);
        mocks.deleteCredentialFromAllContracts.mockResolvedValue({
            contractsUpdated: 0,
            removedSharedUris: [],
        });
        mocks.refetchQueries.mockResolvedValue(undefined);
        mocks.fetchNewContractCredentials.mockResolvedValue({ isError: false });
        mocks.initWallet.mockResolvedValue({});
        mocks.queueAiInsightCredentialRefresh.mockResolvedValue(undefined);
    });

    it('adds the configured persona without a confirmation step', async () => {
        render(<SamplePersonaBox />);

        expect(mocks.useContract).toHaveBeenCalledWith(currentContractUri);
        expect(mocks.useGetCredentialsFromContracts).toHaveBeenCalledWith([
            currentContractUri,
            legacyContractUri,
        ]);

        fireEvent.click(screen.getByRole('button', { name: 'See an example LearnCard' }));

        await waitFor(() => expect(mocks.fetchNewContractCredentials).toHaveBeenCalledOnce());
        expect(mocks.confirm).not.toHaveBeenCalled();
        expect(mocks.consentToContract).toHaveBeenCalledOnce();
        expect(mocks.presentToast).toHaveBeenCalledWith('Sample credentials added.', {
            hasDismissButton: true,
        });
    });

    it('reports an error when credential sync fails after consent', async () => {
        mocks.fetchNewContractCredentials.mockResolvedValueOnce({
            isError: true,
            error: new Error('sync failed'),
        });

        render(<SamplePersonaBox />);
        fireEvent.click(screen.getByRole('button', { name: 'See an example LearnCard' }));

        await waitFor(() =>
            expect(mocks.presentToast).toHaveBeenCalledWith('Add failed', {
                type: 'error',
                hasDismissButton: true,
            })
        );
        expect(mocks.presentToast).not.toHaveBeenCalledWith(
            'Sample credentials added.',
            expect.anything()
        );
        expect(mocks.closeAllModals).not.toHaveBeenCalled();
    });

    it('removes credentials and consent from legacy and current config sources', async () => {
        mocks.useConsentedContracts.mockReturnValue({
            data: [currentConsent, legacyConsent],
            isLoading: false,
        });
        mocks.useGetCredentialsFromContracts.mockReturnValue({
            data: [currentCredential, legacyCredential],
            isLoading: false,
        });

        render(<SamplePersonaBox />);
        fireEvent.click(screen.getByRole('button', { name: 'Remove sample credentials' }));

        await waitFor(() => expect(mocks.withdrawConsent).toHaveBeenCalledTimes(2));
        expect(mocks.withdrawConsent).toHaveBeenCalledWith(currentTermsUri);
        expect(mocks.withdrawConsent).toHaveBeenCalledWith(legacyTermsUri);
        expect(mocks.deleteCredentialRecord).toHaveBeenCalledTimes(2);
        expect(mocks.deleteCredentialRecord).toHaveBeenCalledWith({
            ...currentCredential,
            skipPostDeleteCleanup: true,
            ignoreMissingRemoteRecord: true,
        });
        expect(mocks.deleteCredentialRecord).toHaveBeenCalledWith({
            ...legacyCredential,
            skipPostDeleteCleanup: true,
            ignoreMissingRemoteRecord: true,
        });
        expect(mocks.removeCreds).toHaveBeenCalledWith([currentCredentialUri, legacyCredentialUri]);
        expect(mocks.deleteCredentialFromAllContracts).toHaveBeenCalledWith(
            expect.objectContaining({
                deletedUris: [currentCredentialUri, legacyCredentialUri],
            })
        );
        expect(mocks.presentToast).toHaveBeenCalledWith('Removed 2 sample credentials.', {
            hasDismissButton: true,
        });
    });

    it('keeps removal successful when AI insight refresh fails afterward', async () => {
        mocks.useConsentedContracts.mockReturnValue({
            data: [currentConsent],
            isLoading: false,
        });
        mocks.useGetCredentialsFromContracts.mockReturnValue({
            data: [currentCredential],
            isLoading: false,
        });
        mocks.queueAiInsightCredentialRefresh.mockRejectedValueOnce(new Error('refresh failed'));

        render(<SamplePersonaBox />);
        fireEvent.click(screen.getByRole('button', { name: 'Remove sample credentials' }));

        await waitFor(() =>
            expect(mocks.presentToast).toHaveBeenCalledWith('Removed 1 sample credentials.', {
                hasDismissButton: true,
            })
        );
        expect(mocks.presentToast).not.toHaveBeenCalledWith('Remove failed', expect.anything());
    });

    it('shows a picker only when the tenant config has multiple personas', () => {
        mocks.useFeatureConfig.mockReturnValue({
            samplePersonas: [
                studentPersona,
                { id: 'worker', contractUri: 'lc:network:example:contract:worker' },
            ],
            legacySamplePersonaContractUris: [],
        });

        render(<SamplePersonaBox />);
        fireEvent.click(screen.getByRole('button', { name: 'Choose an example' }));

        expect(mocks.newModal).toHaveBeenCalledOnce();
        expect(mocks.useContract).not.toHaveBeenCalled();
    });

    it('blocks actions while contract-indexed credentials are loading', () => {
        mocks.useGetCredentialsFromContracts.mockReturnValue({ data: undefined, isLoading: true });

        render(<SamplePersonaBox />);

        expect(
            screen.getByRole('button', { name: 'Checking sample credentials...' })
        ).toBeDisabled();
        expect(mocks.confirm).not.toHaveBeenCalled();
    });

    it('shows the removable sample state while indexed credentials are still loading', () => {
        mocks.useConsentedContracts.mockReturnValue({
            data: [currentConsent],
            isLoading: false,
        });
        mocks.useGetCredentialsFromContracts.mockReturnValue({ data: undefined, isLoading: true });

        render(<SamplePersonaBox />);

        expect(screen.getByRole('heading', { name: 'Sample LearnCard' })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Checking sample credentials...' })
        ).toBeDisabled();
    });
});

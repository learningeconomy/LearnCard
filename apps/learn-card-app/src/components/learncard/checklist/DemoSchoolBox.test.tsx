import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentDemoContractUri = 'lc:network:production:contract:current-demo-school';
const legacyDemoContractUri = 'lc:network:production:contract:legacy-demo-school';
const legacyTermsUri = 'lc:network:production:terms:legacy-demo-school';
const legacyCredentialUri = 'lc:network:production:credential:legacy-demo-credential';

const mocks = vi.hoisted(() => ({
    closeAllModals: vi.fn(),
    confirm: vi.fn(),
    consentToContract: vi.fn(),
    deleteCredentialFromAllContracts: vi.fn(),
    deleteCredentialRecord: vi.fn(),
    fetchNewContractCredentials: vi.fn(),
    initWallet: vi.fn(),
    isProductionNetwork: vi.fn(),
    invalidateQueries: vi.fn(),
    presentToast: vi.fn(),
    queueAiInsightCredentialRefresh: vi.fn(),
    removeCreds: vi.fn(),
    useConsentedContracts: vi.fn(),
    useContract: vi.fn(),
    useFlags: vi.fn(),
    useGetCredentialsFromContracts: vi.fn(),
    useWithdrawConsent: vi.fn(),
    withdrawConsent: vi.fn(),
}));

vi.mock('launchdarkly-react-client-sdk', () => ({
    useFlags: () => mocks.useFlags(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({ colors: { defaults: { primaryColor: 'emerald-700' } } }),
}));

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));

vi.mock('learn-card-base/helpers/networkHelpers', () => ({
    isProductionNetwork: () => mocks.isProductionNetwork(),
}));

vi.mock('apps/learn-card-app/src/helpers/contract.helpers', () => ({
    getMinimumTermsForContract: () => ({}),
}));

vi.mock('../../svgs/SyncCircleArrows', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('../../svgs/TrashBin', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('learn-card-base/svgs/CircleCheckmark', () => ({
    __esModule: true,
    default: () => null,
}));

vi.mock('learn-card-base', () => ({
    ToastTypeEnum: { Error: 'error' },
    deleteCredentialFromAllContracts: (...args: unknown[]) =>
        mocks.deleteCredentialFromAllContracts(...args),
    getLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
    newCredsStore: { set: { removeCreds: mocks.removeCreds } },
    queueAiInsightCredentialRefresh: (...args: unknown[]) =>
        mocks.queueAiInsightCredentialRefresh(...args),
    switchedProfileStore: {
        get: { switchedDid: () => 'did:web:learner.example' },
        use: { switchedDid: () => 'did:web:learner.example' },
    },
    useConfirmation: () => mocks.confirm,
    useConsentedContracts: () => mocks.useConsentedContracts(),
    useConsentToContract: () => ({ mutateAsync: mocks.consentToContract, isPending: false }),
    useContract: (...args: unknown[]) => mocks.useContract(...args),
    useCurrentUser: () => ({ id: 'learner-1' }),
    useDeleteCredentialRecord: () => ({ mutateAsync: mocks.deleteCredentialRecord }),
    useGetCredentialsFromContracts: (...args: unknown[]) =>
        mocks.useGetCredentialsFromContracts(...args),
    useModal: () => ({ closeAllModals: mocks.closeAllModals }),
    useSyncConsentFlow: () => ({ refetch: mocks.fetchNewContractCredentials }),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useWithdrawConsent: (...args: unknown[]) => mocks.useWithdrawConsent(...args),
}));

import DemoSchoolBox from './DemoSchoolBox';

const legacyConsent = {
    uri: legacyTermsUri,
    status: 'active',
    contract: { uri: legacyDemoContractUri, owner: { did: 'did:example:legacy-school' } },
};

const legacyCredential = {
    uri: legacyCredentialUri,
    title: 'Legacy Demo Credential',
};

describe('DemoSchoolBox legacy demo contract cleanup', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.useFlags.mockReturnValue({
            demoContractUri: currentDemoContractUri,
            legacyDemoContractUris: [legacyDemoContractUri],
        });

        mocks.useContract.mockReturnValue({
            data: { contract: {}, owner: { did: 'did:example:current-school' } },
        });

        mocks.useConsentedContracts.mockReturnValue({ data: [], isLoading: false });
        mocks.isProductionNetwork.mockReturnValue(true);
        mocks.useGetCredentialsFromContracts.mockReturnValue({ data: [], isLoading: false });
        mocks.confirm.mockResolvedValue(true);
        mocks.consentToContract.mockResolvedValue(undefined);
        mocks.deleteCredentialRecord.mockResolvedValue(undefined);
        mocks.deleteCredentialFromAllContracts.mockResolvedValue({
            contractsUpdated: 0,
            removedSharedUris: [],
        });
        mocks.fetchNewContractCredentials.mockResolvedValue(undefined);
        mocks.initWallet.mockResolvedValue({});
        mocks.queueAiInsightCredentialRefresh.mockResolvedValue(undefined);
        mocks.useWithdrawConsent.mockReturnValue({
            mutateAsync: mocks.withdrawConsent,
            isPending: false,
        });
    });

    it('deletes credentials and consent from a legacy demo contract after the current flag URI changes', async () => {
        mocks.useConsentedContracts.mockReturnValue({ data: [legacyConsent], isLoading: false });

        mocks.useGetCredentialsFromContracts.mockImplementation((uris: unknown) => ({
            data:
                Array.isArray(uris) && uris.includes(legacyDemoContractUri)
                    ? [legacyCredential]
                    : [],
            isLoading: false,
        }));

        render(<DemoSchoolBox />);

        expect(screen.getByRole('button', { name: /delete demo school/i })).toBeEnabled();
        expect(mocks.useContract).toHaveBeenCalledWith(currentDemoContractUri);
        expect(mocks.useGetCredentialsFromContracts).toHaveBeenCalledWith([
            currentDemoContractUri,
            legacyDemoContractUri,
        ]);

        expect(mocks.useWithdrawConsent).toHaveBeenCalledWith();

        fireEvent.click(screen.getByRole('button', { name: /delete demo school/i }));

        await waitFor(() => {
            expect(mocks.closeAllModals).toHaveBeenCalledOnce();
        });

        expect(mocks.withdrawConsent).toHaveBeenCalledWith(legacyTermsUri);

        expect(mocks.withdrawConsent).toHaveBeenCalledTimes(1);
        expect(mocks.deleteCredentialRecord).toHaveBeenCalledWith({
            ...legacyCredential,
            skipPostDeleteCleanup: true,
            ignoreMissingRemoteRecord: true,
        });
        expect(mocks.deleteCredentialRecord).toHaveBeenCalledTimes(1);
        expect(mocks.removeCreds).toHaveBeenCalledWith([legacyCredentialUri]);
        expect(mocks.deleteCredentialFromAllContracts).toHaveBeenCalledWith(
            expect.objectContaining({ deletedUris: [legacyCredentialUri] })
        );
        expect(mocks.presentToast).toHaveBeenCalledWith('Deleted 1 Demo credentials', {
            hasDismissButton: true,
        });
        expect(mocks.invalidateQueries).toHaveBeenCalledWith({
            queryKey: [
                'useGetCredentialsFromContract',
                currentDemoContractUri,
                'did:web:learner.example',
            ],
        });
        expect(mocks.invalidateQueries).toHaveBeenCalledWith({
            queryKey: [
                'useGetCredentialsFromContract',
                legacyDemoContractUri,
                'did:web:learner.example',
            ],
        });
    });

    it('keeps deletion blocked while legacy credential lookup is loading', () => {
        mocks.useConsentedContracts.mockReturnValue({ data: [legacyConsent], isLoading: false });
        mocks.useGetCredentialsFromContracts.mockReturnValue({ data: undefined, isLoading: true });

        render(<DemoSchoolBox />);

        const button = screen.getByRole('button', { name: /checking demo school/i });

        expect(button).toBeDisabled();
        expect(mocks.useGetCredentialsFromContracts).toHaveBeenCalledWith([
            currentDemoContractUri,
            legacyDemoContractUri,
        ]);

        fireEvent.click(button);

        expect(mocks.confirm).not.toHaveBeenCalled();
        expect(mocks.withdrawConsent).not.toHaveBeenCalled();
        expect(mocks.deleteCredentialRecord).not.toHaveBeenCalled();
    });

    it('looks up legacy demo contracts outside production without syncing the current contract', () => {
        mocks.isProductionNetwork.mockReturnValue(false);
        mocks.useFlags.mockReturnValue({
            demoContractUri: currentDemoContractUri,
            legacyDemoContractUris: [legacyDemoContractUri],
        });

        render(<DemoSchoolBox />);

        expect(mocks.useContract).toHaveBeenCalledWith(undefined);
        expect(mocks.useGetCredentialsFromContracts).toHaveBeenCalledWith([legacyDemoContractUri]);
    });
});

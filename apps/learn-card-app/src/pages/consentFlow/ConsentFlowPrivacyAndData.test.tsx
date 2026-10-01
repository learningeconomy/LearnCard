import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';
import ConsentFlowPrivacyAndData from './ConsentFlowPrivacyAndData';

const state = vi.hoisted(() => ({
    updateTerms: vi.fn(),
    directUpdateTerms: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useModal: () => ({ closeModal: vi.fn() }),
    useToast: () => ({ presentToast: vi.fn() }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useWallet: () => ({ initWallet: vi.fn() }),
    useCurrentUser: () => ({}),
    useUpdateTerms: () => ({ mutateAsync: state.directUpdateTerms, isPending: false }),
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));
vi.mock('./useConsentFlow', () => ({
    default: () => ({ updateTerms: state.updateTerms, updatingTerms: false }),
}));
vi.mock('../../hooks/useGuardianGate', () => ({
    default: () => ({ guardedAction: async (action: () => unknown) => action() }),
}));
vi.mock('@ionic/react', () => ({
    IonToggle: ({ checked, onClick }: { checked: boolean; onClick: () => void }) => (
        <button role="switch" aria-checked={checked} onClick={onClick} />
    ),
}));
vi.mock('../../helpers/contract.helpers', () => ({
    getPrivacyAndDataInfo: () => ({ name: 'Learning Economy' }),
    isVerifiableDataContractCategory: () => false,
    VERIFIABLE_DATA_CONTRACT_CATEGORIES: [],
}));
vi.mock('../../i18n/TransP', () => ({ default: () => null }));
vi.mock('./PrivacyAndDataHeader', () => ({ default: () => null }));
vi.mock('./ContractPermissionsAndDetailsText', () => ({ default: () => null }));
vi.mock('./ConsentFlowReadSharing', () => ({ default: () => null }));
vi.mock('./ConsentFlowWriteSharing', () => ({ default: () => null }));
vi.mock('./ConsentFlowVerifiableDataSharingItem', () => ({ default: () => null }));
vi.mock('./ConsentFlowFooter', () => ({
    default: ({
        actionButtonText,
        actionButtonDisabled,
        onActionButtonClick,
    }: {
        actionButtonText: string;
        actionButtonDisabled: boolean;
        onActionButtonClick: () => void;
    }) => (
        <button disabled={actionButtonDisabled} onClick={onActionButtonClick}>
            {actionButtonText}
        </button>
    ),
}));

const contractDetails = {
    uri: 'lc:contract:insights',
    name: 'Learning Economy',
    owner: { did: 'did:example:owner' },
    contract: {
        read: { credentials: { categories: {} }, personal: {} },
        write: {
            credentials: {
                categories: {
                    Achievement: { required: false },
                    'AI Insight': { required: true },
                },
            },
            personal: {},
        },
    },
} as ConsentFlowContractDetails;

const showPrivacyAndData = (categories: Record<string, boolean>, direct = false) => {
    const terms: ConsentFlowTerms = {
        read: { credentials: { categories: {} }, personal: {} },
        write: { credentials: { categories }, personal: {} },
    };

    return render(
        <ConsentFlowPrivacyAndData
            contractDetails={contractDetails}
            terms={terms}
            setTerms={vi.fn()}
            isPostConsent
            termsUri={direct ? 'lc:terms:insights' : undefined}
        />
    );
};

describe('ConsentFlowPrivacyAndData write permissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.updateTerms.mockResolvedValue(undefined);
        state.directUpdateTerms.mockResolvedValue(undefined);
    });

    afterEach(cleanup);

    it.each([
        { categories: { Achievement: true, 'AI Insight': true }, checked: true },
        { categories: { Achievement: false, 'AI Insight': false }, checked: false },
        { categories: { Achievement: false, 'AI Insight': true }, checked: false },
    ])('opens with Allow All checked=$checked', ({ categories, checked }) => {
        showPrivacyAndData(categories);

        expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', String(checked));
        const toggleRow = screen.getByRole('switch').parentElement!;
        expect(within(toggleRow).getByText(checked ? 'Active' : 'Off')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it.each([
        { direct: false, enabled: false },
        { direct: false, enabled: true },
        { direct: true, enabled: false },
        { direct: true, enabled: true },
    ])(
        'toggles Allow All from $enabled and saves required access (direct update=$direct)',
        async ({ direct, enabled }) => {
            showPrivacyAndData({ Achievement: enabled, 'AI Insight': true }, direct);

            fireEvent.click(screen.getByRole('switch'));
            expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', String(!enabled));
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            const update = direct ? state.directUpdateTerms : state.updateTerms;
            await waitFor(() => expect(update).toHaveBeenCalledOnce());
            const savedTerms = direct ? update.mock.calls[0][0].terms : update.mock.calls[0][0];
            expect(savedTerms.write.credentials.categories).toEqual({
                Achievement: !enabled,
                'AI Insight': true,
            });
        }
    );
});

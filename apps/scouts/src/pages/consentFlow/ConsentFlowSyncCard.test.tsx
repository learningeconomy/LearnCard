// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConsentFlowSyncCard from './ConsentFlowSyncCard';

const state = vi.hoisted(() => ({
    consent: vi.fn(),
    refetch: vi.fn(),
    modal: vi.fn(),
    toast: vi.fn(),
    push: vi.fn(),
    user: { profileId: 'synthetic-learner' },
    contract: {
        uri: 'lc:synthetic',
        name: 'Synthetic app',
        redirectUrl: '/success',
        owner: { did: 'did:example:owner' },
        contract: {},
    },
}));
vi.mock('learn-card-base', async () => ({
    ...(await import('../../../../../packages/learn-card-base/src/helpers/consentErrors')),
    useContract: () => ({ data: state.contract, refetch: state.refetch }),
    useConsentToContract: () => ({ mutateAsync: state.consent }),
    useSyncConsentFlow: () => ({ refetch: vi.fn() }),
    useCurrentUser: () => state.user,
    useWallet: () => ({ initWallet: vi.fn() }),
    useToast: () => ({ presentToast: state.toast }),
    useModal: () => ({ newModal: state.modal, closeAllModals: vi.fn() }),
    getLogger: () => ({ error: vi.fn() }),
    BoostCategoryOptionsEnum: {},
    ModalTypes: {},
    ToastTypeEnum: { Error: 'error', Success: 'success' },
}));
vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'ScoutPass' }),
}));
vi.mock('learn-card-base/svgs/RightArrow', () => ({ default: () => null }));
vi.mock('../../helpers/contract.helpers', () => ({
    getMinimumTermsForContract: () => ({
        read: { credentials: { categories: {} }, personal: {} },
        write: { credentials: { categories: {} }, personal: {} },
    }),
}));
vi.mock('./ConsentFlowEditAccess', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({
    IonCol: () => null,
    IonRow: () => null,
    IonLoading: () => null,
    IonSkeletonText: () => null,
}));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: state.push }),
    useLocation: () => ({ search: '' }),
}));
beforeEach(() => {
    vi.clearAllMocks();
    state.refetch.mockResolvedValue({ data: { ...state.contract, audienceVersion: 2 } });
});
afterEach(cleanup);
it('does not show the success redirect or navigate after an audience conflict', async () => {
    state.consent.mockRejectedValueOnce(
        Object.assign(new Error('Sharing audience changed'), { data: { httpStatus: 409 } })
    );
    render(<ConsentFlowSyncCard contractUri="lc:synthetic" />);
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(state.toast).toHaveBeenCalledOnce());
    expect(state.refetch).toHaveBeenCalledOnce();
    expect(state.modal).not.toHaveBeenCalled();
    expect(state.push).not.toHaveBeenCalled();
});
it('keeps the existing-consent redirect available for the explicit message', async () => {
    state.consent.mockRejectedValueOnce(
        Object.assign(new Error("You've already consented to this contract!"), {
            data: { httpStatus: 409 },
        })
    );
    render(<ConsentFlowSyncCard contractUri="lc:synthetic" />);
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }));
    await waitFor(() => expect(state.modal).toHaveBeenCalledOnce());
    expect(state.refetch).not.toHaveBeenCalled();
    expect(state.push).not.toHaveBeenCalled();
});

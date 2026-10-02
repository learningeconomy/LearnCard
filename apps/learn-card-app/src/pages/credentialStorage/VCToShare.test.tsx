import React from 'react';
import type { VC } from '@learncard/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    begin: vi.fn(),
    finish: vi.fn(),
    current: true,
    initWallet: vi.fn(),
    sign: vi.fn(),
    create: vi.fn(),
    toast: vi.fn(),
    log: { info: vi.fn(), error: vi.fn() },
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => mocks.log,
    useWallet: () => ({ initWallet: mocks.initWallet }),
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Error: 'error' },
    categoryMetadata: { Achievement: { defaultImageSrc: '' } },
    chapiStore: { set: { isChapiInteraction: vi.fn() } },
    redirectStore: { set: { authRedirect: vi.fn() } },
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    IonRow: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getDefaultCategoryForCredential: () => 'Achievement',
}));
vi.mock('apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard', () => ({
    default: () => <div>Credential preview</div>,
}));
vi.mock('../../helpers/verifier-history/history', () => ({
    beginVerifierDisclosure: mocks.begin,
    visibleCredentialTitles: () => ['Diploma'],
}));
vi.mock('../../helpers/verifier-history/account', () => ({
    captureHistoryAccount: () => () => mocks.current,
    captureHistoryContext: (wallet: unknown) => ({ wallet, isCurrent: () => mocks.current }),
}));
import VCToShare from './VCToShare';
const props = {
    vcsToShare: [{ name: 'Diploma' } as VC],
    handleCloseModal: vi.fn(),
    handleVcSelection: vi.fn(),
    isVcSelected: () => true,
    currentUser: null,
    getUniqueId: () => 'id',
};
beforeEach(() => {
    vi.clearAllMocks();
    mocks.current = true;
    mocks.sign.mockResolvedValue({ verifiableCredential: [{ secret: 'VP_CANARY' }] });
    mocks.create.mockResolvedValue({});
    mocks.initWallet.mockResolvedValue({
        invoke: { newPresentation: mocks.create, issuePresentation: mocks.sign },
    });
    mocks.finish.mockResolvedValue('saved');
    mocks.begin.mockResolvedValue({ finish: mocks.finish, isCurrent: () => mocks.current });
});
describe('credential disclosure recording', () => {
    it('records CHAPI handoff only after respondWith, with no presentation diagnostics', async () => {
        const respondWith = vi.fn();
        render(<VCToShare {...props} event={{ respondWith }} />);
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        await waitFor(() => expect(mocks.finish).toHaveBeenCalledWith('handed-off'));
        expect(respondWith.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.finish.mock.invocationCallOrder[0]
        );
        expect(JSON.stringify(mocks.log.info.mock.calls)).not.toContain('VP_CANARY');
    });
    it('does not record signing or handoff failure', async () => {
        mocks.sign.mockRejectedValue(new Error('VP_CANARY'));
        render(<VCToShare {...props} event={{ respondWith: vi.fn() }} />);
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        await screen.findByText(/Error sharing/);
        expect(mocks.finish).not.toHaveBeenCalled();
        expect(JSON.stringify(mocks.log.error.mock.calls)).not.toContain('VP_CANARY');
    });
    it('passes the local attempt separately to VC-API without prematurely recording success', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<VCToShare {...props} onSubmit={onSubmit} />);
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
        expect(Object.keys(onSubmit.mock.calls[0][0])).toEqual(['verifiablePresentation']);
        expect(onSubmit.mock.calls[0][1]).toMatchObject({ finish: mocks.finish });
        expect(mocks.finish).not.toHaveBeenCalled();
    });
    it('does not repeat handoff when persistence fails', async () => {
        mocks.finish.mockResolvedValue('unavailable');
        const respondWith = vi.fn();
        render(<VCToShare {...props} event={{ respondWith }} />);
        fireEvent.click(screen.getByRole('button', { name: 'Share' }));
        await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(1));
        expect(respondWith).toHaveBeenCalledTimes(1);
        expect(mocks.sign).toHaveBeenCalledTimes(1);
    });
});

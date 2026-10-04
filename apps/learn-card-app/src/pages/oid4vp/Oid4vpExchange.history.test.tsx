import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
    current: true,
    init: vi.fn(),
    begin: vi.fn(),
    finish: vi.fn(),
    send: vi.fn(),
    resilience: { resetRun: vi.fn(), callbacks: {}, pendingPrompt: null, resolvePrompt: vi.fn() },
}));
vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: vi.fn() }),
    useLocation: () => ({ search: '?request=https://verifier.example/request' }),
}));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    useIsLoggedIn: () => true,
    useWallet: () => ({ initWallet: mocks.init }),
    useToast: () => ({ presentToast: vi.fn() }),
    ToastTypeEnum: { Error: 'error' },
    getFriendlyOpenID4VCError: () => ({ kind: 'unknown' }),
    ExchangeErrorDisplay: ({ onRetry }: { onRetry?: () => void }) => (
        <div role="alert">
            Submission error{onRetry && <button onClick={onRetry}>Retry</button>}
        </div>
    ),
}));
vi.mock('@learncard/openid4vc-plugin', () => ({ inferCredentialFormat: () => 'ldp_vc' }));
vi.mock('../../hooks/useExchangeErrorReporting', () => ({
    sanitizeCounterparty: () => undefined,
    useExchangeErrorReporting: () => vi.fn(),
}));
vi.mock('../../hooks/useResilientExchange', () => ({
    useResilientExchange: () => mocks.resilience,
}));
vi.mock('../../components/oid4vc-recovery/RecoveryPromptModal', () => ({
    RecoveryPromptModal: () => null,
}));
vi.mock('./candidatePool', () => ({ loadCandidatePool: async () => [] }));
vi.mock('./LoggedOutOid4vp', () => ({ default: () => null }));
vi.mock('./components/RequestLoading', () => ({ default: () => <div>Loading request</div> }));
vi.mock('./components/RequestSubmitting', () => ({ default: () => <div>Submitting</div> }));
vi.mock('./components/RequestFinished', () => ({ default: () => <div>Finished</div> }));
vi.mock('./components/RequestCannotSatisfy', () => ({ default: () => null }));
vi.mock('./components/RequestConsent', () => ({
    default: ({ onApprove }: { onApprove: (picks: unknown) => Promise<void> }) => (
        <button onClick={() => void onApprove({ row: {}, disclose: {} })}>Approve</button>
    ),
}));
vi.mock('../../helpers/oid4vc-resilience/resilientVp', () => ({
    resilientPresentCredentials: mocks.send,
}));
vi.mock('../../helpers/verifier-history/history', () => ({
    beginVerifierDisclosure: mocks.begin,
    historyOrigin: () => undefined,
    visibleCredentialTitles: () => ['Diploma'],
}));
vi.mock('../../helpers/verifier-history/account', () => ({
    captureHistoryAccount: () => () => mocks.current,
    captureHistoryContext: () => ({ isCurrent: () => mocks.current, eligible: true }),
}));
vi.mock('../../helpers/verifier-history/useEligibility', () => ({
    useVerifierHistoryEligibility: () => () => true,
}));
import Oid4vpExchange from './Oid4vpExchange';
beforeEach(() => {
    vi.clearAllMocks();
    mocks.current = true;
    mocks.init.mockResolvedValue({
        invoke: {
            prepareVerifiablePresentation: async () => ({
                request: { client_id: 'https://verifier.example' },
                selection: {
                    canSatisfy: true,
                    descriptors: [
                        {
                            descriptorId: 'd',
                            candidates: [
                                {
                                    candidate: {
                                        id: 'c',
                                        format: 'ldp_vc',
                                        credential: { name: 'Diploma' },
                                    },
                                },
                            ],
                        },
                    ],
                },
            }),
        },
    });
    mocks.begin.mockResolvedValue({ finish: mocks.finish, isCurrent: () => mocks.current });
    mocks.finish.mockResolvedValue('saved');
    mocks.send.mockResolvedValue({ submitted: {} });
});
const approve = async () => {
    render(<Oid4vpExchange />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
};
describe('OID4VP disclosure account cancellation', () => {
    it('leaves submitting and disables old-account retry before transport', async () => {
        mocks.begin.mockImplementationOnce(async () => {
            mocks.current = false;
            return { finish: mocks.finish };
        });
        await approve();
        await screen.findByRole('alert');
        expect(screen.queryByText('Submitting')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        expect(mocks.send).not.toHaveBeenCalled();
        expect(mocks.finish).not.toHaveBeenCalled();
    });
    it('leaves submitting without offering old credentials after transport', async () => {
        mocks.send.mockImplementationOnce(async () => {
            mocks.current = false;
            return { submitted: {} };
        });
        await approve();
        await screen.findByRole('alert');
        expect(screen.queryByText('Submitting')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        expect(mocks.send).toHaveBeenCalledTimes(1);
    });
    it('retains success behavior and records only after one transport', async () => {
        await approve();
        await screen.findByText('Finished');
        await waitFor(() => expect(mocks.finish).toHaveBeenCalledWith('sent'));
        expect(mocks.send).toHaveBeenCalledTimes(1);
    });
});

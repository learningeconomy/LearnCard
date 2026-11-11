import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';
import { createHash, randomBytes } from 'crypto';

import ClaimBoost from './ClaimBoost';

const mocks = vi.hoisted(() => ({
    did: 'did:key:learner',
    networkUrl: 'http://network.example.test/trpc',
    cloudUrl: 'http://cloud.example.test/trpc',
    switchedDid: '',
    flowCount: 0,
    addVCtoWallet: vi.fn(),
    claimBoostWithLink: vi.fn(),
    getClaimBoostWithLinkStatus: vi.fn(),
    getIndex: vi.fn(),
    syncCredentialToContracts: vi.fn(),
    push: vi.fn(),
    initWallet: vi.fn(),
    presentClaimSuccessToast: vi.fn(),
    presentToast: vi.fn(),
    replace: vi.fn(),
    requestDuplicateResolution: vi.fn(),
    track: vi.fn(),
    verifyCredential: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@learncard/react', () => ({ getVCDisplayCardVariant: () => 'default' }));
vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonSpinner: () => <div role="status">Loading</div>,
    useIonAlert: () => [vi.fn(), vi.fn()],
    useIonModal: () => [vi.fn(), vi.fn()],
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { achievement: 'Achievement', family: 'Family' },
    ModalTypes: { Right: 'right', Center: 'center' },
    ProfilePicture: () => null,
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    boostPreviewStore: {
        set: { updateSelectedDisplayView: vi.fn() },
        useTracked: { selectedDisplayView: () => 'default' },
    },
    connectionPromptKeys: {
        all: ['connectionPrompts'],
        pending: (did: string) => ['connectionPrompts', 'pending', did],
    },
    switchedProfileStore: { get: { switchedDid: () => mocks.switchedDid } },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
    redirectStore: { set: { lcnRedirect: vi.fn() } },
    useDeviceTypeByWidth: () => ({ isMobile: true }),
    useGetCredentialWithEdits: () => ({ credentialWithEdits: undefined }),
    useGetVCInfo: () => ({ issuerName: 'Issuer', issuerProfileImageElement: null }),
    useIsLoggedIn: () => true,
    useModal: () => ({ closeModal: vi.fn(), newModal: vi.fn() }),
    usePathQuery: () => new URLSearchParams('boostUri=lc%3Aboost%3Aone&challenge=challenge'),
    useToast: () => ({ presentToast: mocks.presentToast }),
    useWallet: () => ({
        addVCtoWallet: mocks.addVCtoWallet,
        initWallet: mocks.initWallet,
        syncCredentialToContracts: mocks.syncCredentialToContracts,
    }),
}));
vi.mock('@analytics', () => ({
    ACCOUNT_CREATED_AT_KEY: 'account-created-at',
    AnalyticsEvents: {
        CLAIM_BOOST: 'claim_boost',
        CREDENTIAL_CLAIM_CANCELLED: 'credential_claim_cancelled',
        CREDENTIAL_CLAIM_FAILED: 'credential_claim_failed',
        CREDENTIAL_CLAIM_PRESENTED: 'credential_claim_presented',
        CREDENTIAL_CLAIM_STARTED: 'credential_claim_started',
        CREDENTIAL_CLAIM_SUCCEEDED: 'credential_claim_succeeded',
        PROFILE_ITEM_ADDED: 'profile_item_added',
    },
    ProfileBuildMethod: { ClaimLink: 'claim_link' },
    SESSION_START_KEY: 'session-start',
    createFlowLifecycle: () => {
        let terminated = false;
        return {
            durationMs: () => 10,
            id: `flow-${++mocks.flowCount}`,
            terminate: () => {
                if (terminated) return false;
                terminated = true;
                return true;
            },
        };
    },
    newFlowId: () => 'presented-flow-id',
    useAnalytics: () => ({ track: mocks.track }),
    useProfileSnapshotCapture: () => ({
        capture: vi.fn(),
        snapshotRef: { current: { credentialCount: 0 } },
    }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({ name: 'Learner' }),
}));
vi.mock('../../components/network-prompts/hooks/useLCNGatedAction', () => ({
    default: () => ({ gate: vi.fn().mockResolvedValue({ prompted: false }) }),
}));
vi.mock('../../hooks/useUploadVcFromText', () => ({
    useUploadVcFromText: () => ({ uploadVcFromTextAndAddToWallet: vi.fn() }),
}));
vi.mock('../../feedback/useClaimSuccessToast', () => ({
    useClaimSuccessToast: () => mocks.presentClaimSuccessToast,
}));
vi.mock('../../components/credentials/duplicate-credential/useDuplicateCredentialGuard', () => ({
    useDuplicateCredentialGuard: () => ({
        duplicateCredentialPrompt: null,
        isCheckingDuplicate: false,
        requestDuplicateResolution: mocks.requestDuplicateResolution,
    }),
}));
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getEmojiFromDidString: () => 'I',
    getUserHandleFromDid: () => undefined,
}));
vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getAchievementType: () => 'Achievement',
    getCredentialName: (credential: VC) => credential.name,
    getDefaultCategoryForCredential: () => 'Achievement',
    unwrapBoostCredential: (credential: VC) => credential,
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: {
        get: {
            networkApiUrl: () => 'https://network.example',
            networkUrl: () => mocks.networkUrl,
            cloudUrl: () => mocks.cloudUrl,
        },
    },
}));
vi.mock('@learncard/render-method-plugin', () => ({
    getSvgMustacheRenderMethod: () => null,
}));
vi.mock('learn-card-base/stores/boostPreviewStore', () => ({
    BoostPreviewDisplayViewEnum: { Default: 'default', Issuer: 'issuer' },
}));
vi.mock('../../paraglide/messages.js', () => ({
    'claim.boost.accepted': () => 'Accepted',
    'claim.recovery.checking': () => 'Checking your claim',
    'claim.recovery.claiming': () => 'Claiming your credential',
    'claim.recovery.saving': () => 'Saving your credential',
    'claim.recovery.refreshing': () => 'Refreshing your collection',
    'claim.recovery.checkFailed': () => 'Could not confirm your claim',
    'claim.recovery.claimUncertain': () => 'Your claim may have completed',
    'claim.recovery.saveFailed': () => 'Claimed but saving was not confirmed',
    'claim.recovery.refreshFailed': () => 'Your credential is saved',
    'claim.recovery.pending': () => 'Your claim is still being resolved',
    'claim.recovery.expired': () => 'This claim link has expired',
    'claim.recovery.exhausted': () => 'This claim link has reached its claim limit',
    'claim.recovery.unavailable': () => 'This claim link is not available',
    'claim.recovery.contextChanged': () =>
        'Account or connection changed; close and reopen the link',
    'claim.recovery.savedToOriginalAccount': () =>
        'Your credential was saved to your original account.',
    'claim.recovery.tryAgain': () => 'Try again',
    'claim.recovery.check': () => 'Check for my credential',
    'claim.recovery.save': () => 'Save my credential',
    'claim.recovery.refresh': () => 'Refresh my collection',
    'claim.by': () => 'By',
    'claim.duplicate.skippedToast': () => 'Skipped',
    'claim.modal.credentialFallback': () => 'Credential',
    'claim.notFound.message': () => 'Not found',
    'claim.notFound.title': () => 'Not found',
    'common.accept': () => 'Accept',
    'common.loading': () => 'Loading',
    'contacts.joinBoost': () => 'Join',
    'contacts.joined': () => 'Joined',
    'contacts.joining': () => 'Joining',
    'contacts.okay': () => 'Okay',
    'toasts.credentialClaimFailed': () => 'Claim failed',
}));
vi.mock('../../components/accessibility/AccessibleBoostFooterLayout', () => ({
    default: ({
        children,
        footerProps,
    }: React.PropsWithChildren<{
        footerProps: {
            claimBtnText: string;
            disableClaimButton: boolean;
            handleClaim: () => void;
            handleClose?: () => void;
        };
    }>) => (
        <div>
            {children}
            {footerProps.handleClose && <button onClick={footerProps.handleClose}>Close</button>}
            <button onClick={footerProps.handleClaim} disabled={footerProps.disableClaimButton}>
                {footerProps.claimBtnText}
            </button>
        </div>
    ),
}));
vi.mock('../../components/accessibility/AccessibleCredentialCard', () => ({
    default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('learn-card-base/components/vcmodal/VCDisplayCardWrapper2', () => ({
    default: () => <div>Credential preview</div>,
}));
vi.mock('../../components/render-method/RenderMethodDisplay', () => ({ default: () => null }));
vi.mock(
    'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt',
    () => ({ default: () => null })
);
vi.mock('../../components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu', () => ({
    default: () => null,
}));
vi.mock('../../components/boost/boostCMS/BoostPreview/BoostDetailsSideBar', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    default: () => null,
    getInfoFromCredential: () => ({}),
}));

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};

const boost = {
    id: 'urn:uuid:boost',
    issuer: 'did:key:issuer',
    name: 'Safety Training',
    issuanceDate: '2026-08-20T00:00:00.000Z',
    type: ['VerifiableCredential'],
    credentialSubject: { id: 'did:key:viewer' },
} as VC;

describe('ClaimBoost recovery', () => {
    let records: { id?: string; uri: string; category: string }[];
    const renderClaim = async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        render(
            <QueryClientProvider client={queryClient}>
                <ClaimBoost />
            </QueryClientProvider>
        );
        await screen.findByText('Credential preview');
        return queryClient;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.did = 'did:key:learner';
        mocks.networkUrl = 'http://network.example.test/trpc';
        mocks.cloudUrl = 'http://cloud.example.test/trpc';
        mocks.switchedDid = '';
        mocks.flowCount = 0;
        sessionStorage.clear();
        vi.stubGlobal('crypto', {
            randomUUID: () => randomBytes(16).toString('hex'),
            subtle: {
                digest: async (_algorithm: string, value: Uint8Array) =>
                    new Uint8Array(createHash('sha256').update(value).digest()).buffer,
            },
        });
        records = [];
        mocks.requestDuplicateResolution.mockResolvedValue({ action: 'save', isDuplicate: false });
        mocks.verifyCredential.mockResolvedValue([]);
        mocks.getClaimBoostWithLinkStatus.mockResolvedValue({ status: 'absent' });
        mocks.claimBoostWithLink.mockResolvedValue('lc:credential:claimed');
        mocks.getIndex.mockImplementation(async (query: { id?: string; uri?: string }) =>
            records.filter(record => (query.id ? query.id === record.id : query.uri === record.uri))
        );
        mocks.addVCtoWallet.mockImplementation(async input => {
            records.push({ ...input, category: 'Achievement' });
            return true;
        });
        mocks.syncCredentialToContracts.mockResolvedValue(true);
        mocks.initWallet.mockResolvedValue({
            id: { did: () => mocks.did },
            index: { LearnCloud: { get: mocks.getIndex } },
            invoke: {
                claimBoostWithLink: mocks.claimBoostWithLink,
                getClaimBoostWithLinkStatus: mocks.getClaimBoostWithLinkStatus,
                verifyCredential: mocks.verifyCredential,
            },
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, json: async () => boost }));
    });

    it('does not turn unused count cache entries into a failed claim', async () => {
        const queryClient = await renderClaim();
        queryClient.setQueryData(['useGetCredentialCount', '', 'ID', mocks.did], 0);

        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

        await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
        expect(records.map(record => record.uri)).toEqual(['lc:credential:claimed']);
        expect(screen.queryByRole('button', { name: 'Refresh my collection' })).toBeNull();
    });

    it('retains the claim on a network failure, announces it, and restores meaningful focus', async () => {
        mocks.getClaimBoostWithLinkStatus.mockRejectedValueOnce(new TypeError('offline'));
        await renderClaim();
        const accept = screen.getByRole('button', { name: 'Accept' });
        accept.focus();
        fireEvent.click(accept);
        const status = await screen.findByText('Could not confirm your claim');
        await waitFor(() => expect(status).toHaveFocus());
        expect(status).toHaveAttribute('role', 'status');
        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(screen.getByText('Credential preview')).toBeVisible();
        expect(mocks.push).not.toHaveBeenCalled();
        expect(mocks.replace).not.toHaveBeenCalled();
        expect(mocks.track).toHaveBeenCalledWith(
            'credential_claim_failed',
            expect.objectContaining({ error_code: 'TypeError' })
        );
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
        expect(records.map(record => record.uri)).toEqual(['lc:credential:claimed']);
        const failed = mocks.track.mock.calls.filter(
            ([event]) => event === 'credential_claim_failed'
        );
        const succeeded = mocks.track.mock.calls.filter(
            ([event]) => event === 'credential_claim_succeeded'
        );
        expect(failed).toHaveLength(1);
        expect(succeeded).toHaveLength(1);
        expect(succeeded[0][1].flow_id).not.toBe(failed[0][1].flow_id);
    });

    it.each(['expired', 'exhausted', 'unavailable'] as const)(
        'stops a confirmed %s claim, reports its reason and allows close',
        async reason => {
            mocks.getClaimBoostWithLinkStatus.mockResolvedValue({ status: 'terminal', reason });
            await renderClaim();
            fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
            await waitFor(() =>
                expect(mocks.track).toHaveBeenCalledWith(
                    'credential_claim_failed',
                    expect.objectContaining({ error_code: `claim_link_${reason}` })
                )
            );
            expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
            expect(mocks.claimBoostWithLink).not.toHaveBeenCalled();
            fireEvent.click(screen.getByRole('button', { name: 'Close' }));
            expect(mocks.push).toHaveBeenCalledWith('/');
        }
    );

    it('saves an already-claimed credential after a failed save without issuing again', async () => {
        mocks.addVCtoWallet.mockRejectedValueOnce(new TypeError('offline'));
        await renderClaim();
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Save my credential' }));
        await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
        expect(mocks.claimBoostWithLink).toHaveBeenCalledTimes(1);
        expect(records.map(record => record.uri)).toEqual(['lc:credential:claimed']);
    });

    it('checks an uncertain result and saves the committed claim without another issuance', async () => {
        mocks.claimBoostWithLink.mockRejectedValueOnce(new TypeError('lost response'));
        await renderClaim();
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        const check = await screen.findByRole('button', { name: 'Check for my credential' });
        mocks.getClaimBoostWithLinkStatus.mockResolvedValue({
            status: 'complete',
            credentialUri: 'lc:credential:committed',
        });
        fireEvent.click(check);
        await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
        expect(mocks.claimBoostWithLink).toHaveBeenCalledTimes(1);
        expect(records.map(record => record.uri)).toEqual(['lc:credential:committed']);
    });

    it('retains saved success after the relevant active category fails, then retries only refresh', async () => {
        const queryClient = await renderClaim();
        const fetchRecords = vi
            .fn()
            .mockRejectedValueOnce(new Error('collection unavailable'))
            .mockImplementation(async () => records.map(record => record.uri));
        const observer = new QueryObserver(queryClient, {
            queryKey: ['useGetCredentialList', '', 'Achievement', mocks.did],
            queryFn: fetchRecords,
            initialData: [] as string[],
            staleTime: Infinity,
            retry: false,
        });
        const unsubscribe = observer.subscribe(() => {});
        try {
            fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
            const refresh = await screen.findByRole('button', { name: 'Refresh my collection' });
            expect(records.map(record => record.uri)).toEqual(['lc:credential:claimed']);
            expect(mocks.presentClaimSuccessToast).not.toHaveBeenCalled();
            fireEvent.click(refresh);
            await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
            expect(observer.getCurrentResult().data).toEqual(['lc:credential:claimed']);
            expect(mocks.syncCredentialToContracts).toHaveBeenCalledTimes(1);
            expect(mocks.claimBoostWithLink).toHaveBeenCalledTimes(1);
            expect(mocks.addVCtoWallet).toHaveBeenCalledTimes(1);
        } finally {
            unsubscribe();
            queryClient.clear();
        }
    });

    it('retains per-contract progress through a partial sync failure', async () => {
        await renderClaim();
        mocks.syncCredentialToContracts.mockImplementationOnce(
            async (_input, _wallet, completed) => {
                completed.add('successful-terms');
                throw new Error('Another contract failed');
            }
        );
        mocks.syncCredentialToContracts.mockImplementationOnce(
            async (_input, _wallet, completed) => {
                expect(completed).toEqual(new Set(['successful-terms']));
                completed.add('retried-terms');
                return true;
            }
        );
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        const refresh = await screen.findByRole('button', { name: 'Refresh my collection' });
        expect(mocks.presentClaimSuccessToast).not.toHaveBeenCalled();
        fireEvent.click(refresh);
        await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
        expect(mocks.syncCredentialToContracts).toHaveBeenCalledTimes(2);
        expect(mocks.addVCtoWallet).toHaveBeenCalledTimes(1);
        expect(mocks.claimBoostWithLink).toHaveBeenCalledTimes(1);
    });

    it('prevents double clicks and cancellation while the claim is in flight', async () => {
        const claim = deferred<string>();
        mocks.claimBoostWithLink.mockReturnValue(claim.promise);
        await renderClaim();
        const accept = screen.getByRole('button', { name: 'Accept' });
        fireEvent.click(accept);
        fireEvent.click(accept);
        await waitFor(() => expect(mocks.claimBoostWithLink).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
        expect(mocks.push).not.toHaveBeenCalled();
        await act(async () => claim.resolve('lc:credential:claimed'));
        await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledTimes(1));
        expect(records).toHaveLength(1);
    });
    it('does not steal focus when the user moves elsewhere during a failed claim', async () => {
        const claim = deferred<string>();
        mocks.claimBoostWithLink.mockReturnValue(claim.promise);
        await renderClaim();
        render(<button>Another task</button>);
        const accept = screen.getByRole('button', { name: 'Accept' });
        accept.focus();
        fireEvent.click(accept);
        await waitFor(() => expect(mocks.claimBoostWithLink).toHaveBeenCalled());
        const other = screen.getByRole('button', { name: 'Another task' });
        other.focus();
        await act(async () => claim.reject(new TypeError('response lost')));
        await screen.findByRole('button', { name: 'Check for my credential' });
        expect(other).toHaveFocus();
    });

    it.each(['account', 'network'] as const)(
        'closes recovery if the %s changes while confirmation is in flight',
        async changed => {
            const confirmation = deferred<{ status: 'complete'; credentialUri: string }>();
            mocks.getClaimBoostWithLinkStatus.mockReturnValue(confirmation.promise);
            await renderClaim();
            fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
            await waitFor(() => expect(mocks.getClaimBoostWithLinkStatus).toHaveBeenCalledOnce());
            if (changed === 'account') mocks.did = 'did:key:another-account';
            else {
                mocks.networkUrl = 'http://another-network.example.test/trpc';
                mocks.initWallet.mockRejectedValue(new Error('new network unavailable'));
            }
            await act(async () =>
                confirmation.resolve({
                    status: 'complete',
                    credentialUri: 'lc:credential:prior-account',
                })
            );
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled()
            );
            expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
            expect(screen.getByRole('status')).toHaveFocus();
            expect(mocks.claimBoostWithLink).not.toHaveBeenCalled();
            expect(records).toEqual([]);
            expect(mocks.presentClaimSuccessToast).not.toHaveBeenCalled();
            expect(mocks.track).toHaveBeenCalledWith(
                'credential_claim_failed',
                expect.objectContaining({ error_code: 'claim_context_changed' })
            );
            fireEvent.click(screen.getByRole('button', { name: 'Close' }));
            expect(mocks.push).toHaveBeenCalledWith('/');
        }
    );

    it('does not announce success or refresh another context when settings change during saving', async () => {
        const save = deferred<boolean>();
        mocks.addVCtoWallet.mockReturnValue(save.promise);
        await renderClaim();
        fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
        await waitFor(() => expect(mocks.addVCtoWallet).toHaveBeenCalledOnce());
        mocks.cloudUrl = 'http://another-cloud.example.test/trpc';
        await act(async () => save.resolve(true));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled());
        expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
        expect(mocks.syncCredentialToContracts).not.toHaveBeenCalled();
        expect(mocks.presentClaimSuccessToast).not.toHaveBeenCalled();
        expect(
            mocks.track.mock.calls.filter(([event]) => event === 'credential_claim_succeeded')
        ).toEqual([]);
    });

    it('keeps completed success and skips stale-context navigation without clearing recovery identity', async () => {
        mocks.track.mockImplementation(event => {
            if (event === 'credential_claim_succeeded') {
                mocks.networkUrl = 'http://changed-network.example.test/trpc';
            }
        });
        try {
            await renderClaim();
            const accept = screen.getByRole('button', { name: 'Accept' });
            fireEvent.click(accept);
            await waitFor(() =>
                expect(mocks.track).toHaveBeenCalledWith(
                    'credential_claim_succeeded',
                    expect.any(Object)
                )
            );
            await waitFor(() => expect(screen.getByRole('status')).toHaveFocus());
            expect(accept).toBeDisabled();
            expect(records.map(record => record.uri)).toEqual(['lc:credential:claimed']);
            expect(
                mocks.track.mock.calls.filter(([event]) => event === 'credential_claim_failed')
            ).toEqual([]);
            expect(mocks.push).not.toHaveBeenCalled();
            expect(mocks.replace).not.toHaveBeenCalled();
            expect(mocks.presentClaimSuccessToast).not.toHaveBeenCalled();
            expect(Object.values(sessionStorage)).toContain(
                mocks.claimBoostWithLink.mock.calls[0][2]
            );
            fireEvent.click(screen.getByRole('button', { name: 'Close' }));
            expect(mocks.push).toHaveBeenCalledWith('/');
        } finally {
            mocks.track.mockReset();
        }
    });

    it.each(['status', 'claim-conflict'] as const)(
        'ends a %s pending activation once, then reconciles the same operation without issuing again',
        async source => {
            if (source === 'status') {
                mocks.getClaimBoostWithLinkStatus.mockResolvedValueOnce({ status: 'pending' });
            } else {
                mocks.claimBoostWithLink.mockRejectedValueOnce(
                    Object.assign(new Error('another tab reserved the request'), {
                        data: { code: 'CONFLICT' },
                    })
                );
                mocks.getClaimBoostWithLinkStatus.mockResolvedValueOnce({ status: 'absent' });
            }
            mocks.getClaimBoostWithLinkStatus.mockResolvedValue({
                status: 'complete',
                credentialUri: 'lc:credential:reserved',
            });
            await renderClaim();
            fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
            const check = await screen.findByRole('button', { name: 'Check for my credential' });
            const failed = mocks.track.mock.calls.filter(
                ([event]) => event === 'credential_claim_failed'
            );
            expect(failed).toHaveLength(1);
            expect(failed[0][1].error_code).toBe('claim_pending');
            fireEvent.click(check);
            await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledOnce());
            const started = mocks.track.mock.calls.filter(
                ([event]) => event === 'credential_claim_started'
            );
            const succeeded = mocks.track.mock.calls.filter(
                ([event]) => event === 'credential_claim_succeeded'
            );
            expect(started).toHaveLength(2);
            expect(succeeded).toHaveLength(1);
            expect(failed[0][1].flow_id).toBe(started[0][1].flow_id);
            expect(succeeded[0][1].flow_id).toBe(started[1][1].flow_id);
            expect(succeeded[0][1].flow_id).not.toBe(failed[0][1].flow_id);
            expect(mocks.claimBoostWithLink).toHaveBeenCalledTimes(source === 'status' ? 0 : 1);
            expect(records.map(record => record.uri)).toEqual(['lc:credential:reserved']);
        }
    );

    it('refreshes the original actor and category without fetching unrelated active failures', async () => {
        mocks.switchedDid = 'did:web:test:child';
        const queryClient = await renderClaim();
        const unrelated = vi.fn().mockRejectedValue(new Error('unrelated category unavailable'));
        const otherActor = vi.fn().mockRejectedValue(new Error('another account unavailable'));
        const otherReader = vi.fn().mockRejectedValue(new Error('another reader unavailable'));
        const relevant = new QueryObserver(queryClient, {
            queryKey: ['useGetCredentialList', mocks.switchedDid, 'Achievement', mocks.did],
            queryFn: async () => records.map(record => record.uri),
            initialData: [] as string[],
            staleTime: Infinity,
        });
        const unrelatedObserver = new QueryObserver(queryClient, {
            queryKey: ['useGetCredentialList', mocks.switchedDid, 'ID', mocks.did],
            queryFn: unrelated,
            initialData: [] as string[],
            staleTime: Infinity,
        });
        const otherActorObserver = new QueryObserver(queryClient, {
            queryKey: ['useGetCredentialCount', 'did:web:test:another', 'Achievement', mocks.did],
            queryFn: otherActor,
            initialData: 0,
            staleTime: Infinity,
        });
        const otherReaderObserver = new QueryObserver(queryClient, {
            queryKey: [
                'useGetCredentialCount',
                mocks.switchedDid,
                'Achievement',
                'did:key:another-reader',
            ],
            queryFn: otherReader,
            initialData: 0,
            staleTime: Infinity,
        });
        const unsubscribe = [
            relevant.subscribe(() => {}),
            unrelatedObserver.subscribe(() => {}),
            otherActorObserver.subscribe(() => {}),
            otherReaderObserver.subscribe(() => {}),
        ];
        try {
            fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
            await waitFor(() => expect(mocks.presentClaimSuccessToast).toHaveBeenCalledOnce());
            expect(relevant.getCurrentResult().data).toEqual(['lc:credential:claimed']);
            expect(unrelated).not.toHaveBeenCalled();
            expect(otherActor).not.toHaveBeenCalled();
            expect(otherReader).not.toHaveBeenCalled();
            expect(mocks.claimBoostWithLink).toHaveBeenCalledOnce();
        } finally {
            unsubscribe.forEach(stop => stop());
            queryClient.clear();
        }
    });

    it.each(['cancel', 'skip'])(
        'preserves duplicate %s without claiming another credential',
        async action => {
            mocks.requestDuplicateResolution.mockResolvedValue({ action, isDuplicate: true });
            await renderClaim();
            fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
            await waitFor(() => expect(mocks.requestDuplicateResolution).toHaveBeenCalled());
            await act(async () => {});
            expect(mocks.claimBoostWithLink).not.toHaveBeenCalled();
            expect(records).toEqual([]);
            if (action === 'skip') expect(mocks.replace).toHaveBeenCalledWith('/');
            else expect(mocks.replace).not.toHaveBeenCalled();
        }
    );
});

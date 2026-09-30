import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, alertCircleOutline } from 'ionicons/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    useWallet,
    useGetCurrentLCNUser,
    useModal,
    ModalTypes,
    useGetProfile,
    useAllContractRequestsForProfile,
    useConfirmation,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import type { ConsentFlowContractDetails } from '@learncard/types';
import FullScreenConsentFlow from '../../pages/consentFlow/FullScreenConsentFlow';
import { useContractRequestsEnabled } from '../../hooks/useContractRequestsEnabled';
import * as m from '../../paraglide/messages.js';

const primary =
    'py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';
const secondary =
    'py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40';

type RequestProps = {
    contractUri: string;
    requestId: string;
    onDismiss?: () => Promise<void>;
    details?: boolean;
};

/** Always read the target's current request; notification payloads are historical delivery data. */
export const ContractRequest: React.FC<RequestProps> = ({
    contractUri,
    requestId,
    onDismiss,
    details = false,
}) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileId = currentLCNUser?.profileId ?? '';
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.FullScreen,
    });
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const branding = useBrandingConfig();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const request = useQuery({
        queryKey: ['genericContractRequest', profileId, contractUri, requestId],
        enabled: Boolean(profileId),
        refetchInterval: 30_000,
        queryFn: async () => {
            const wallet = await initWallet();
            const status = await wallet.invoke.getRequestStatusForProfile(
                profileId,
                undefined,
                contractUri
            );
            if (!status || status.requestId !== requestId) return null;
            const contract = await wallet.invoke.getContract(contractUri);
            return { status, contract };
        },
    });
    const { data: referrer } = useGetProfile(
        request.data?.status.requestedBy,
        Boolean(request.data?.status.requestedBy)
    );
    const contract = request.data?.contract;
    const status = request.data?.status;
    const expires = contract?.expiresAt;
    const expired = Boolean(
        expires && (!Number.isFinite(Date.parse(expires)) || Date.parse(expires) <= Date.now())
    );
    const pending = status?.status === 'pending' && !expired && !request.isError;

    const refresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['genericContractRequest', profileId] }),
            queryClient.invalidateQueries({
                queryKey: ['useAllContractRequestsForProfile', profileId],
            }),
        ]);
    };

    useEffect(() => {
        if (!pending || status?.readStatus === 'seen') return;
        let active = true;
        const markSeen = async () => {
            try {
                const wallet = await initWallet();
                await wallet.invoke.markContractRequestAsSeen(contractUri, profileId);
                if (active) await refresh();
            } catch {
                // Reading is retried on the next refresh; it never changes the decision.
            }
        };
        void markSeen();
        return () => {
            active = false;
        };
    }, [pending, status?.readStatus, contractUri, profileId, initWallet]);

    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        setError(false);
        try {
            await action();
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    };

    const requirePending = async (): Promise<ConsentFlowContractDetails> => {
        const wallet = await initWallet();
        const current = await wallet.invoke.getRequestStatusForProfile(
            profileId,
            undefined,
            contractUri
        );
        if (current?.requestId !== requestId || current.status !== 'pending') {
            await refresh();
            throw new Error('Request is no longer pending');
        }
        const fresh = await wallet.invoke.getContract(contractUri);
        if (
            fresh.expiresAt &&
            (!Number.isFinite(Date.parse(fresh.expiresAt)) ||
                Date.parse(fresh.expiresAt) <= Date.now())
        ) {
            await refresh();
            throw new Error('Request has expired');
        }
        return fresh;
    };

    const accept = () =>
        run(async () => {
            const fresh = await requirePending();
            // The existing flow owns data selection, fresh audience acknowledgment, and guardian approval.
            const flow = (
                <FullScreenConsentFlow
                    contractDetails={fresh}
                    disableRedirect
                    beforeSubmit={async () => {
                        await requirePending();
                    }}
                    successCallback={() => {
                        void refresh();
                    }}
                />
            );
            newModal(flow, {}, { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen });
        });

    const decline = () =>
        run(async () => {
            if (
                !(await confirm({
                    text: m['contractRequests.declineConfirm'](),
                    confirmText: m['contractRequests.decline'](),
                    cancelText: m['common.cancel'](),
                }))
            )
                return;
            await requirePending();
            const wallet = await initWallet();
            await wallet.invoke.denyContractRequest(contractUri);
            await refresh();
            presentToast(m['contractRequests.declined'](), { type: ToastTypeEnum.Success });
        });

    const unavailable = !request.isPending && (!request.data || expired);
    const owner =
        contract?.owner?.displayName || contract?.owner?.profileId || contract?.name || '';
    const title =
        status?.requestedBy && status.requestedBy !== contract?.owner.profileId
            ? m['contractRequests.referred']({
                  referrer: referrer?.displayName || status.requestedBy,
                  owner,
              })
            : m['contractRequests.invitation']({ owner });
    const audience = contract ? [contract.owner, ...(contract.recipients ?? [])] : [];

    return (
        <article
            data-testid={details ? 'contract-request-details' : 'contract-request-card'}
            className="font-poppins p-6 bg-white border border-grayscale-200 rounded-[20px] space-y-4 text-grayscale-900"
        >
            <div className="flex justify-between items-start gap-3">
                <p className="text-xs font-medium text-grayscale-700">
                    {branding.contractRequestLabel || m['contractRequests.label']()}
                </p>
                {onDismiss && (
                    <button
                        aria-label={m['contractRequests.dismiss']()}
                        disabled={busy}
                        onClick={() => void run(onDismiss)}
                        className="p-2 rounded-[20px] text-grayscale-700"
                    >
                        <IonIcon icon={closeOutline} />
                    </button>
                )}
            </div>
            {request.isPending ? (
                <p role="status">{m['contractRequests.loading']()}</p>
            ) : (
                <>
                    {contract?.image && (
                        <img
                            src={contract.image}
                            alt=""
                            className="w-16 h-16 object-cover rounded-full"
                        />
                    )}
                    <h3 className="text-xl font-semibold">
                        {unavailable ? m['contractRequests.unavailable']() : title}
                    </h3>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {contract?.description}
                    </p>
                    {details && contract && (
                        <>
                            <p className="text-sm text-grayscale-600">
                                {contract.reasonForAccessing}
                            </p>
                            {status?.message && (
                                <p className="text-sm text-grayscale-600">{status.message}</p>
                            )}
                            <div data-testid="contract-request-shared-with">
                                <h4 className="text-sm font-medium">
                                    {m['contractRequests.sharedWith']()}
                                </h4>
                                <ul className="text-sm text-grayscale-600">
                                    {audience.map(profile => (
                                        <li key={profile.did}>
                                            {profile.displayName || profile.profileId}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="text-sm text-grayscale-600">
                                <h4 className="font-medium text-grayscale-900">
                                    {m['contractRequests.dataRequested']()}
                                </h4>
                                <p>
                                    {Object.keys(contract.contract.read.personal)
                                        .concat(
                                            Object.keys(
                                                contract.contract.read.credentials.categories
                                            )
                                        )
                                        .join(', ') || m['contractRequests.none']()}
                                </p>
                                <h4 className="font-medium text-grayscale-900 mt-3">
                                    {m['contractRequests.outcomes']()}
                                </h4>
                                <p>
                                    {Object.keys(
                                        contract.contract.write.credentials.categories
                                    ).join(', ') || m['contractRequests.none']()}
                                </p>
                            </div>
                            <p className="text-sm text-grayscale-600">
                                {m['contractRequests.reviewFirst']()}
                            </p>
                        </>
                    )}
                    {status && status.status !== 'pending' && (
                        <p role="status" className="text-sm font-medium text-grayscale-700">
                            {status.status === 'accepted'
                                ? m['contractRequests.connected']()
                                : status.status === 'denied'
                                  ? m['contractRequests.declined']()
                                  : m['contractRequests.cancelled']()}
                        </p>
                    )}
                    {pending && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={primary}
                                disabled={busy}
                                onClick={() => void accept()}
                            >
                                {busy ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span
                                            aria-hidden="true"
                                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                        />
                                        {m['contractRequests.working']()}
                                    </span>
                                ) : (
                                    m['contractRequests.accept']()
                                )}
                            </button>
                            {!details && (
                                <button
                                    className={secondary}
                                    disabled={busy}
                                    onClick={() =>
                                        newModal(
                                            <ContractRequest
                                                contractUri={contractUri}
                                                requestId={requestId}
                                                details
                                            />
                                        )
                                    }
                                >
                                    {m['contractRequests.details']()}
                                </button>
                            )}
                            {details && (
                                <button
                                    className={secondary}
                                    disabled={busy}
                                    onClick={() => void decline()}
                                >
                                    {m['contractRequests.decline']()}
                                </button>
                            )}
                        </div>
                    )}
                    {details && (
                        <button className={secondary} disabled={busy} onClick={closeModal}>
                            {m['contractRequests.notNow']()}
                        </button>
                    )}
                </>
            )}
            {(error || request.isError) && (
                <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-100 rounded-2xl flex gap-2.5"
                >
                    <IonIcon icon={alertCircleOutline} className="text-red-400" />
                    <span className="text-sm text-red-700">{m['contractRequests.error']()}</span>
                    <button
                        disabled={busy || request.isFetching}
                        className="text-sm underline"
                        onClick={() =>
                            void run(async () => {
                                await request.refetch({ throwOnError: true });
                            })
                        }
                    >
                        {m['common.tryAgain']()}
                    </button>
                </div>
            )}
        </article>
    );
};

const PendingRequests: React.FC = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const requests = useAllContractRequestsForProfile(currentLCNUser?.profileId ?? '');
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen });
    const pending =
        requests.data?.filter(request => request.requestId && request.status === 'pending') ?? [];
    return (
        <section
            data-testid="pending-contract-requests"
            className="font-poppins p-4 space-y-3 shrink-0 max-h-[40vh] overflow-y-auto"
        >
            <h3 className="text-sm font-semibold text-grayscale-900">
                {m['contractRequests.pending']()}
            </h3>
            {requests.isPending && (
                <p role="status" className="text-sm text-grayscale-600">
                    {m['contractRequests.loading']()}
                </p>
            )}
            {requests.isError && (
                <div role="alert" className="text-sm text-red-700">
                    {m['contractRequests.error']()}{' '}
                    <button
                        className={secondary}
                        disabled={requests.isFetching}
                        onClick={() => void requests.refetch()}
                    >
                        {m['common.tryAgain']()}
                    </button>
                </div>
            )}
            {!requests.isPending && !requests.isError && pending.length === 0 && (
                <p className="text-sm text-grayscale-600">{m['contractRequests.empty']()}</p>
            )}
            {pending.map(request => (
                <button
                    key={request.requestId}
                    className={`${secondary} w-full text-start`}
                    onClick={() =>
                        newModal(
                            <ContractRequest
                                contractUri={request.contract.uri}
                                requestId={request.requestId!}
                                details
                            />
                        )
                    }
                >
                    {request.contract.name ||
                        request.profile.displayName ||
                        request.profile.profileId}
                </button>
            ))}
        </section>
    );
};

/** Mount only behind the gate so disabled tenants do not fetch generic requests. */
export const PendingContractRequests: React.FC = () =>
    useContractRequestsEnabled() ? <PendingRequests /> : null;

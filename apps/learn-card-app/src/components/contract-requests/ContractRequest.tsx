import React, { useCallback, useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    closeOutline,
    alertCircleOutline,
    peopleOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';
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
    contractCategoryNameToCategoryMetadata,
} from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { ReferralConsentReview, useReferralGate, useReferralModal } from './ReferralModal';
import { useContractRequestsEnabled } from '../../hooks/useContractRequestsEnabled';
import * as m from '../../paraglide/messages.js';
import { getLocale } from '../../paraglide/runtime.js';
import { localizeCategoryTitle } from '../../i18n/categoryTitle';
import { localizeContractPersonalField } from '../../i18n/contractPersonalField';
import { ContractAudience } from './ContractAudience';

const isExpired = (expiresAt?: string): boolean =>
    Boolean(
        expiresAt?.trim() &&
        (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.now())
    );
const categoryLabel = (category: string): string =>
    localizeCategoryTitle(contractCategoryNameToCategoryMetadata(category)?.title ?? category);
const formatLabels = (labels: string[]): string =>
    labels.length
        ? new Intl.ListFormat(getLocale(), { style: 'long', type: 'conjunction' }).format(labels)
        : m['contractRequests.none']();

const primary =
    'min-h-11 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm leading-5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2';
const secondary =
    'min-h-11 py-3 px-4 rounded-[20px] border border-solid border-grayscale-300 bg-white text-grayscale-700 font-medium text-sm leading-5 hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2';

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
    const { enabled, requireEnabled } = useReferralGate();
    const openReferralModal = useReferralModal();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileId = currentLCNUser?.profileId ?? '';
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const { closeModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.FullScreen,
    });
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const branding = useBrandingConfig();
    const [busyAction, setBusyAction] = useState<'accept' | 'decline' | 'dismiss' | 'retry' | null>(
        null
    );
    const busy = busyAction !== null;
    const [retryAction, setRetryAction] = useState<(() => Promise<void>) | null>(null);
    const [error, setError] = useState(false);
    const request = useQuery({
        queryKey: ['genericContractRequest', profileId, contractUri, requestId],
        enabled: enabled && Boolean(profileId),
        refetchInterval: query =>
            enabled &&
            query.state.status === 'success' &&
            query.state.data?.status.status === 'pending' &&
            !isExpired(query.state.data.contract.expiresAt)
                ? 30_000
                : false,
        queryFn: async () => {
            requireEnabled();
            const wallet = await initWallet();
            requireEnabled();
            const status = await wallet.invoke.getRequestStatusForProfile(
                profileId,
                undefined,
                contractUri
            );
            requireEnabled();
            if (!status || status.requestId !== requestId) return null;
            const contract = await wallet.invoke.getContract(contractUri);
            requireEnabled();
            return { status, contract };
        },
    });
    const { data: referrer } = useGetProfile(
        request.data?.status.requestedBy,
        enabled && Boolean(request.data?.status.requestedBy)
    );
    const contract = request.data?.contract;
    const status = request.data?.status;
    const expired = isExpired(contract?.expiresAt);
    const pending = enabled && status?.status === 'pending' && !expired && !request.isError;

    const refresh = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['genericContractRequest', profileId] }),
            queryClient.invalidateQueries({
                queryKey: ['useAllContractRequestsForProfile', profileId],
            }),
        ]);
    }, [queryClient, profileId]);

    useEffect(() => {
        if (!pending || status?.readStatus === 'seen') return;
        let active = true;
        const markSeen = async () => {
            try {
                requireEnabled();
                const wallet = await initWallet();
                requireEnabled();
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
    }, [pending, status?.readStatus, contractUri, profileId, initWallet, refresh, requireEnabled]);

    const run = async (
        action: () => Promise<void>,
        actionName: NonNullable<typeof busyAction> = 'retry'
    ) => {
        setBusyAction(actionName);
        setRetryAction(null);
        setError(false);
        try {
            requireEnabled();
            await action();
        } catch {
            setError(true);
            setRetryAction(() => action);
        } finally {
            setBusyAction(null);
        }
    };

    const readRequest = async (
        expectedStatus: 'pending' | 'accepted'
    ): Promise<ConsentFlowContractDetails> => {
        const wallet = await initWallet();
        const current = await wallet.invoke.getRequestStatusForProfile(
            profileId,
            undefined,
            contractUri
        );
        if (current?.requestId !== requestId || current.status !== expectedStatus) {
            await refresh();
            throw new Error(`Request is no longer ${expectedStatus}`);
        }
        const fresh = await wallet.invoke.getContract(contractUri);
        if (isExpired(fresh.expiresAt)) {
            await refresh();
            throw new Error('Request has expired');
        }
        return fresh;
    };

    const requirePending = async () => {
        requireEnabled();
        const fresh = await readRequest('pending');
        requireEnabled();
        return fresh;
    };

    const accept = () =>
        run(async () => {
            const fresh = await requirePending();
            // The existing flow owns data selection, fresh audience acknowledgment, and guardian approval.
            const flow = (
                <ReferralConsentReview
                    contractDetails={fresh}
                    disableRedirect
                    expectedRequestId={requestId}
                    beforeSubmit={async () => {
                        await readRequest('pending');
                    }}
                    beforePublicationRetry={async () => {
                        await readRequest('accepted');
                    }}
                    successCallback={() => {
                        void refresh();
                    }}
                />
            );
            openReferralModal(flow, true);
        }, 'accept');

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
            requireEnabled();
            await wallet.invoke.denyContractRequest(contractUri);
            await refresh();
            presentToast(m['contractRequests.declined'](), { type: ToastTypeEnum.Success });
        }, 'decline');

    const unavailable = !request.isPending && !request.isError && (!request.data || expired);
    const owner =
        contract?.owner?.displayName || contract?.owner?.profileId || contract?.name || '';
    const title =
        status?.requestedBy && status.requestedBy !== contract?.owner.profileId
            ? m['contractRequests.referred']({
                  referrer: referrer?.displayName || status.requestedBy,
                  owner,
              })
            : m['contractRequests.invitation']({ owner });

    if (!enabled) return null;

    return (
        <article
            data-testid={details ? 'contract-request-details' : 'contract-request-card'}
            aria-busy={busy || request.isPending}
            className={`font-poppins text-grayscale-900 min-w-0 bg-white ${
                details
                    ? 'flex h-full min-h-0 flex-col'
                    : 'p-5 sm:p-6 border border-solid border-grayscale-200 rounded-[20px]'
            }`}
        >
            <header
                className={`flex items-center gap-3 ${details ? 'shrink-0 px-6 py-5 border-b border-grayscale-200' : 'mb-4'}`}
            >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-700">
                    {contract?.image ? (
                        <img src={contract.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <IonIcon icon={peopleOutline} aria-hidden="true" className="text-xl" />
                    )}
                </div>
                <p className="flex-1 text-xs font-medium text-grayscale-700">
                    {branding.contractRequestLabel || m['contractRequests.label']()}
                </p>
                {(onDismiss || details) && (
                    <button
                        type="button"
                        aria-label={details ? m['common.close']() : m['contractRequests.dismiss']()}
                        disabled={busy}
                        onClick={() => (details ? closeModal() : void run(onDismiss!, 'dismiss'))}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] text-grayscale-600 hover:bg-grayscale-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40"
                    >
                        {busyAction === 'dismiss' ? (
                            <span
                                role="status"
                                aria-label={m['contractRequests.working']()}
                                className="block w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-900 rounded-full animate-spin"
                            />
                        ) : (
                            <IonIcon icon={closeOutline} aria-hidden="true" className="text-xl" />
                        )}
                    </button>
                )}
            </header>
            <div
                className={
                    details ? 'min-h-0 flex-1 overflow-y-auto px-6 py-6 space-y-5' : 'space-y-3'
                }
            >
                {request.isPending ? (
                    <div
                        role="status"
                        className="flex items-center gap-3 py-2 text-sm text-grayscale-600"
                    >
                        <span
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 rounded-full border-2 border-grayscale-200 border-t-emerald-600 animate-spin"
                        />
                        {m['contractRequests.loading']()}
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold leading-snug text-grayscale-900 break-words">
                            {unavailable
                                ? m['contractRequests.unavailable']()
                                : request.isError && !contract
                                  ? m['error.generic']()
                                  : title}
                        </h3>
                        {contract?.description && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {contract.description}
                            </p>
                        )}
                        {details && contract && (
                            <>
                                {(contract.reasonForAccessing || status?.message) && (
                                    <div className="space-y-3 border-s-2 border-emerald-200 ps-4 text-sm text-grayscale-600 leading-relaxed">
                                        {contract.reasonForAccessing && (
                                            <p>{contract.reasonForAccessing}</p>
                                        )}
                                        {status?.message && <p>{status.message}</p>}
                                    </div>
                                )}
                                <ContractAudience
                                    contract={contract}
                                    testId="contract-request-shared-with"
                                    alwaysShowOwner
                                />
                                <dl className="space-y-4 rounded-2xl border border-grayscale-200 p-4 text-sm leading-relaxed">
                                    <div>
                                        <dt className="font-medium text-grayscale-900">
                                            {m['contractRequests.dataRequested']()}
                                        </dt>
                                        <dd className="mt-1 text-grayscale-600">
                                            {formatLabels(
                                                Object.keys(contract.contract.read.personal)
                                                    .map(localizeContractPersonalField)
                                                    .concat(
                                                        Object.keys(
                                                            contract.contract.read.credentials
                                                                .categories
                                                        ).map(categoryLabel)
                                                    )
                                            )}
                                        </dd>
                                    </div>
                                    <div className="border-t border-grayscale-100 pt-4">
                                        <dt className="font-medium text-grayscale-900">
                                            {m['contractRequests.outcomes']()}
                                        </dt>
                                        <dd className="mt-1 text-grayscale-600">
                                            {formatLabels(
                                                Object.keys(
                                                    contract.contract.write.credentials.categories
                                                ).map(categoryLabel)
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </>
                        )}
                        {status && status.status !== 'pending' && (
                            <p
                                role="status"
                                className="text-xs font-medium text-grayscale-700 rounded-full bg-grayscale-100 px-3 py-1.5 w-fit"
                            >
                                {status.status === 'accepted'
                                    ? m['contractRequests.connected']()
                                    : status.status === 'denied'
                                      ? m['contractRequests.declined']()
                                      : m['contractRequests.cancelled']()}
                            </p>
                        )}
                    </>
                )}
                {(error || request.isError) && (
                    <div
                        role="alert"
                        className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
                    >
                        <IonIcon
                            icon={alertCircleOutline}
                            aria-hidden="true"
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <div className="text-sm text-red-700 leading-relaxed">
                            <p>{m['contractRequests.error']()}</p>
                            <button
                                type="button"
                                disabled={busy || request.isFetching}
                                className="mt-2 font-medium underline underline-offset-4 disabled:opacity-40"
                                onClick={() =>
                                    void run(
                                        retryAction ??
                                            (async () => {
                                                await request.refetch({ throwOnError: true });
                                            })
                                    )
                                }
                            >
                                {busyAction === 'retry'
                                    ? m['contractRequests.working']()
                                    : m['common.tryAgain']()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {(pending || details) && !request.isPending && (
                <footer
                    className={
                        details
                            ? 'shrink-0 border-t border-grayscale-200 bg-white px-6 py-4 space-y-3'
                            : 'mt-5'
                    }
                >
                    {details && pending && (
                        <p className="flex items-start gap-2 text-xs text-grayscale-600 leading-relaxed">
                            <IonIcon
                                icon={shieldCheckmarkOutline}
                                aria-hidden="true"
                                className="text-emerald-700 text-base shrink-0"
                            />
                            {m['contractRequests.reviewFirst']()}
                        </p>
                    )}
                    {pending && (
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                                type="button"
                                className={`${primary} ${details ? 'flex-1' : ''}`}
                                disabled={busy}
                                onClick={() => void accept()}
                            >
                                {busyAction === 'accept' ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span
                                            aria-hidden="true"
                                            className="w-4 h-4 shrink-0 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                        />
                                        {m['contractRequests.working']()}
                                    </span>
                                ) : (
                                    m['contractRequests.accept']()
                                )}
                            </button>
                            {!details ? (
                                <button
                                    type="button"
                                    className={secondary}
                                    disabled={busy}
                                    onClick={() =>
                                        openReferralModal(
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
                            ) : (
                                <button
                                    type="button"
                                    className={`${secondary} flex-1`}
                                    disabled={busy}
                                    onClick={() => void decline()}
                                >
                                    {busyAction === 'decline'
                                        ? m['contractRequests.working']()
                                        : m['contractRequests.decline']()}
                                </button>
                            )}
                        </div>
                    )}
                    {details && (
                        <button
                            type="button"
                            className="w-full py-2 text-sm font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40"
                            disabled={busy}
                            onClick={closeModal}
                        >
                            {m['contractRequests.notNow']()}
                        </button>
                    )}
                </footer>
            )}
        </article>
    );
};

const PendingRequests: React.FC = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const requests = useAllContractRequestsForProfile(currentLCNUser?.profileId ?? '');
    const openReferralModal = useReferralModal();
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
                        openReferralModal(
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

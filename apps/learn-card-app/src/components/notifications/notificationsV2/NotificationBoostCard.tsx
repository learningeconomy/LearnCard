import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { capitalize } from 'lodash-es';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

import X from 'learn-card-base/svgs/X';
import { IDsIconSolid } from 'learn-card-base/svgs/wallet/IDsIcon';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import ArrowArcLeft from '../../../assets/images/ArrowArcLeft.svg';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';
import BoostClaimCard from '../../boost/claim-boost-card/BoostClaimCard';
import NotificationSkeleton from './NotificationSkeleton';

import {
    unwrapBoostCredential,
    getDefaultCategoryForCredential,
    getImageUrlFromCredential,
    isEndorsementCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { formatDid } from 'learn-card-base/helpers/didHelpers';

import {
    useGetClaimCredential,
    useAcceptCredentialMutation,
    useUpdateNotification,
    usePathQuery,
    useModal,
    ModalTypes,
    CredentialCategoryEnum,
    BoostCategoryOptionsEnum,
    getBoostMetadata,
    useGetCredentialWithEdits,
    useGetBoost,
    useWallet,
    contractCategoryNameToCategoryMetadata,
} from 'learn-card-base';

import { ErrorBoundary } from 'react-error-boundary';
import {
    NotificationTypeStyles,
    CATEGORY_TO_NOTIFICATION_ENUM,
    notificationCardStyles,
} from './types';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { NOTIFICATION_TYPES } from './NotificationCardContainer';
import { useGetVCInfo } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
import { getNotificationDuplicateLookup } from './notificationDuplicateLookup';
import {
    getTranscriptPendingReceivedKey,
    isMatchingTranscript,
} from '../../../hooks/useTranscriptArrival';
import { claimTranscriptOnce } from '../../../hooks/transcriptClaim';
import { ensureTranscriptInWallet } from '../../../hooks/ensureTranscriptInWallet';
import {
    useTranscriptStatus,
    claimIncomingCredential,
    useFeatureConfig,
    useToast,
    ToastTypeEnum,
    getLogger,
} from 'learn-card-base';
import { useQueryClient } from '@tanstack/react-query';

const log = getLogger('notification-boost-card');

/** Upper bound on waiting for transcript status/credential before opening the claim modal. */
const TRANSCRIPT_CLAIM_DECISION_TIMEOUT_MS = 5_000;

type NotificationBoostCardProps = {
    notification: NotificationType;
    className?: string;
    claimStatus?: boolean;
    handleArchive?: () => void;
    handleRead?: () => void;
    issueDate?: string;
    cardLoading?: boolean;
};

const NotificationBoostCard: React.FC<NotificationBoostCardProps> = ({
    notification,
    className,
    claimStatus = false,
    handleArchive,
    handleRead,
    issueDate,
    cardLoading,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [isClaimed, setIsClaimed] = useState<boolean>(claimStatus || false);
    const [isRead, setIsRead] = useState<boolean>(notification?.read || false);
    const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);

    // Ref for the element that we want to detect whether on screen
    const ref = useRef<HTMLDivElement>(null);
    // Call the hook passing in ref and root margin
    // In this case it would only be considered onScreen if more ...
    // ... than 300px of element is visible.
    const onScreen: boolean = useOnScreen<HTMLDivElement>(ref, '-130px');

    const credentialUri = notification?.data?.vcUris?.[0];
    const history = useHistory();
    const query = usePathQuery();
    const _uri = query.get('uri') ?? '';
    const _claim = query.get('claim') ?? '';

    //for now assume the first uri is what we need...
    // unsure what the situation is when there are multiple uris to resolved
    // eg current component is not built to handle displaying multiple resolved vcs as such....
    // so it seeems like some kind of future use case
    const { data, isLoading, isError } = useGetClaimCredential(notification?.data?.vcUris?.[0]);
    const { mutate, isLoading: acceptCredentialLoading } = useAcceptCredentialMutation();
    const { mutate: updateNotification } = useUpdateNotification();

    const boostVc = data;
    const duplicateLookup = getNotificationDuplicateLookup(boostVc, notification?.data);

    let unwrappedCred = data && unwrapBoostCredential(boostVc);

    const { issuerProfileImageElement } = useGetVCInfo(unwrappedCred);

    if (Array.isArray(unwrappedCred) && unwrappedCred.length === 1) {
        unwrappedCred = unwrappedCred[0];
    }
    const { credentialWithEdits } = useGetCredentialWithEdits(unwrappedCred);
    unwrappedCred = credentialWithEdits ?? unwrappedCred;

    const boostUri = boostVc?.boostId ?? unwrappedCred?.boostId;
    const { data: boost } = useGetBoost(boostUri ?? '');
    const credCategory =
        boostVc &&
        ((boost?.category
            ? ((contractCategoryNameToCategoryMetadata(boost.category)?.credentialType ??
                  boost.category) as CredentialCategoryEnum)
            : undefined) ??
            getDefaultCategoryForCredential(unwrappedCred));
    const isEndorsementCredentialType = isEndorsementCredential(unwrappedCred);

    const credImgUrl = boostVc && getImageUrlFromCredential(unwrappedCred, credCategory);
    let notificationCategoryFromCredCategory =
        credCategory && CATEGORY_TO_NOTIFICATION_ENUM[credCategory];

    if (isEndorsementCredentialType) notificationCategoryFromCredCategory = 'endorsement';

    let modalDisplayType = {
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    };

    if (isEndorsementCredentialType) {
        modalDisplayType = {
            mobile: ModalTypes.Right,
            desktop: ModalTypes.Right,
        };
    }

    const displayType = unwrappedCred?.display?.displayType;
    const isCertDisplayType = displayType === 'certificate';
    const isAwardDisplayType = displayType === 'award';
    const isID =
        displayType === 'id' ||
        credCategory === CredentialCategoryEnum.id ||
        unwrappedCred?.hasOwnProperty('boostID') ||
        false;
    const isFamily = credCategory === CredentialCategoryEnum.family;

    const isMediaDisplayType = displayType === 'media';

    // CredentialBadgeNew's certificate art renders at ~120px and the merit/award
    // ribbon SVG at a fixed 138x110, so both need scaling down to sit in the
    // uniform 90px notification badge slot alongside the default badge type.
    // The wrapper keeps the art's natural width (shrink-0) so fixed-size circles
    // aren't flex-squeezed into ovals before the transform scales them.
    const isMeritStyleBadge =
        isAwardDisplayType || credCategory === BoostCategoryOptionsEnum.meritBadge;
    const badgeScaleClass = isCertDisplayType
        ? 'w-[120px] min-w-[120px] scale-[0.7]'
        : isMeritStyleBadge
          ? 'w-[138px] min-w-[138px] scale-[0.8]'
          : 'w-full';

    // Compact circular fallback (matching the ID treatment) for display types
    // whose full art can't fit the notification slot, e.g. media/portfolio.
    const categoryMeta = getBoostMetadata(
        (credCategory as unknown as BoostCategoryOptionsEnum) ??
            BoostCategoryOptionsEnum.socialBadge
    );
    const CategoryIcon = categoryMeta?.SolidIconComponent ?? categoryMeta?.IconComponent;
    const categoryCircleColor = categoryMeta?.badgeBackgroundColor ?? 'gray-500';

    const handleReadStatus = async () => {
        setIsRead(true);
        await updateNotification({
            notificationId: notification?._id,
            payload: { read: true },
        });
    };

    const {
        iconCircleStyles,
        textStyles,
        viewButtonStyles,
        claimedButtonStyles,
        unclaimedButtonStyles,
        typeText,
    } = NotificationTypeStyles[notificationCategoryFromCredCategory ?? 'loading'];

    const claimButtonStyles = isClaimed ? claimedButtonStyles : unclaimedButtonStyles;

    const handleClaimOnClick = async () => {
        await updateNotification({
            notificationId: notification?._id,
            payload: { actionStatus: 'COMPLETED', read: true },
        });
    };

    const handleSuccess = async () => {
        const res = await updateNotification({
            notificationId: notification?._id,
            payload: { actionStatus: 'COMPLETED', read: true },
        });

        setIsClaimed(true);
    };

    // ── Claim deep link (`?uri=…&claim=true`, e.g. from a push tap) ─────────────
    // Without the ClassLink transcript feature this behaves exactly as before: the
    // generic claim modal opens once, on mount. With it, the decision waits (bounded)
    // for the transcript status so a requested transcript is auto-accepted instead.
    const features = useFeatureConfig();
    const isTranscriptFeatureOn = Boolean(features.classlinkTranscriptOptIn);
    const isClaimDeepLink = Boolean(_uri && _uri === credentialUri && _claim);
    const transcriptStatusQuery = useTranscriptStatus(isTranscriptFeatureOn && isClaimDeepLink);
    const queryClient = useQueryClient();
    const { addVCtoWallet, initWallet } = useWallet();
    const { presentToast } = useToast();
    const claimDecisionMadeRef = useRef(false);
    const [claimDecisionTimedOut, setClaimDecisionTimedOut] = useState(false);

    const openClaimModalFromDeepLink = (): void => {
        if (claimModalOpen || isClaimed) return;
        setClaimModalOpen(true);
        const claimModalEl = document.querySelector('.notification-claim-boost-modal-open');
        if (!claimModalEl) {
            newModal(
                <BoostClaimCard
                    credential={unwrappedCred}
                    credentialUri={credentialUri}
                    duplicateLookup={duplicateLookup}
                    showFooter={false}
                    showBoostFooter={true}
                    handleClaimBoostCredential={handleClaimOnClick}
                    isLoading={isLoading}
                    acceptCredentialLoading={acceptCredentialLoading}
                    acceptCredentialCompleted={isClaimed}
                    successCallback={async () => {
                        await handleSuccess();
                        setClaimModalOpen(false);
                        history.replace('/notifications');
                    }}
                    onDismiss={async () => {
                        handleReadStatus();
                        setClaimModalOpen(false);
                        history.replace('/notifications');
                    }}
                    notification={notification}
                    hideEndorsementRequestCard
                />,
                {
                    className: 'notification-claim-boost-modal-open',
                    backgroundImage:
                        isCertDisplayType || isID || isAwardDisplayType || isFamily
                            ? unwrappedCred?.display?.backgroundImage
                            : undefined,
                },
                modalDisplayType
            );
        }
    };
    const openClaimModalRef = useRef(openClaimModalFromDeepLink);
    openClaimModalRef.current = openClaimModalFromDeepLink;

    // Generic path — same as without the transcript feature: open once the credential has
    // resolved and verified (a managed delivery that fails verification never opens it).
    useEffect(() => {
        if (isTranscriptFeatureOn || claimDecisionMadeRef.current) return;
        if (data && !isError && _uri === credentialUri && _claim && !claimModalOpen && !isClaimed) {
            claimDecisionMadeRef.current = true;
            openClaimModalRef.current();
        }
    }, [
        isTranscriptFeatureOn,
        data,
        isError,
        _uri,
        _claim,
        credentialUri,
        claimModalOpen,
        isClaimed,
    ]);

    // Transcript path: never wait forever for the status or the credential.
    useEffect(() => {
        if (!isTranscriptFeatureOn || !isClaimDeepLink) return;
        const timer = setTimeout(
            () => setClaimDecisionTimedOut(true),
            TRANSCRIPT_CLAIM_DECISION_TIMEOUT_MS
        );
        return () => clearTimeout(timer);
    }, [isTranscriptFeatureOn, isClaimDeepLink]);

    const transcriptStatus = transcriptStatusQuery.data;
    const isTranscriptStatusSettled =
        transcriptStatusQuery.isFetched || transcriptStatusQuery.isError;
    const resolvedCred = unwrappedCred && !Array.isArray(unwrappedCred) ? unwrappedCred : undefined;

    useEffect(() => {
        if (!isTranscriptFeatureOn || !isClaimDeepLink || claimDecisionMadeRef.current) return;
        if (claimModalOpen || isClaimed) return;
        // Never decide on an unverified credential: wait for it to resolve and verify. A
        // failed verification renders the error state instead of any claim path.
        if (isError) {
            claimDecisionMadeRef.current = true;
            return;
        }
        if (!data) return;
        if (!isTranscriptStatusSettled && !claimDecisionTimedOut) return;

        const issuerDid = transcriptStatus?.issuerDid;
        const issuerProfileId = transcriptStatus?.issuerProfileId;
        const latest = transcriptStatus?.latest;
        const hasOutstandingRequest = Boolean(
            issuerDid &&
            issuerProfileId &&
            latest?.requestId &&
            latest.requestedAt &&
            latest.status === 'requested' &&
            !latest.receivedAt
        );
        // `from.profileId` is set by the network from the authenticated sender. Its
        // `from.did` is always rewritten to the network's own did:web for that profile,
        // so it can never equal the issuer's signing DID and is not compared.
        const senderProfileId = notification?.from?.profileId;

        if (
            !hasOutstandingRequest ||
            !issuerDid ||
            !issuerProfileId ||
            !latest ||
            senderProfileId !== issuerProfileId
        ) {
            claimDecisionMadeRef.current = true;
            openClaimModalRef.current();
            return;
        }

        if (!resolvedCred) {
            if (!claimDecisionTimedOut && isLoading) return;
            claimDecisionMadeRef.current = true;
            openClaimModalRef.current();
            return;
        }

        claimDecisionMadeRef.current = true;
        const requestId = latest.requestId;

        const autoClaimTranscript = async (): Promise<void> => {
            let claimed = false;
            try {
                const wallet = await initWallet();
                const userDid = wallet.id.did();
                const isMatch = await isMatchingTranscript({
                    vc: resolvedCred,
                    senderProfileId,
                    expectedSenderProfileId: issuerProfileId,
                    expectedIssuerDid: issuerDid,
                    userDid,
                    requestedAt: latest.requestedAt,
                    expectedRequestId: requestId,
                    wallet,
                });
                if (!isMatch) {
                    openClaimModalRef.current();
                    return;
                }

                // Shared with useTranscriptArrival so a mounted card polling the same
                // request can never claim it a second time.
                const claimedHere = await claimTranscriptOnce(requestId, async () => {
                    const { added } = await claimIncomingCredential({
                        uri: credentialUri,
                        wallet,
                        addVCtoWallet,
                        queryClient,
                    });
                    // The network may have accepted it while the wallet write resolved false.
                    // Restore the entry before anything is acknowledged; a failure throws, so
                    // the request is not marked received and useTranscriptArrival recovers it.
                    if (!added)
                        await ensureTranscriptInWallet(wallet, credentialUri, addVCtoWallet);
                });
                claimed = true;
                setIsClaimed(true);

                if (claimedHere) {
                    try {
                        await wallet.invoke.transcriptsMarkReceived({ requestId });
                    } catch (error) {
                        // Claimed but not acknowledged: let useTranscriptArrival retry it.
                        log.warn('transcript.mark-received.deferred', error);
                        try {
                            localStorage.setItem(
                                getTranscriptPendingReceivedKey(userDid, requestId),
                                'true'
                            );
                        } catch (storageError) {
                            log.warn('transcript.pending-storage.failed', storageError);
                        }
                    }
                }
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['incomingCredentials'] }),
                    queryClient.invalidateQueries({ queryKey: ['transcriptStatus'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
                ]);
                history.replace('/school-connect?view=transcript');
            } catch (error) {
                log.error('transcript.auto-claim.failed', error);
                presentToast(m['transcriptOptIn.autoAcceptFailed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                // Leave a recoverable path: the user can still claim it by hand.
                if (!claimed) openClaimModalRef.current();
            }
        };
        void autoClaimTranscript();
    }, [
        isTranscriptFeatureOn,
        isClaimDeepLink,
        claimModalOpen,
        isClaimed,
        isTranscriptStatusSettled,
        claimDecisionTimedOut,
        transcriptStatus,
        resolvedCred,
        isLoading,
        data,
        isError,
        notification,
        credentialUri,
        initWallet,
        addVCtoWallet,
        queryClient,
        history,
        presentToast,
    ]);
    let buttonText: string = '';

    if (isClaimed) {
        buttonText = m['alerts.claimed']();
    } else if (!isClaimed) {
        buttonText = m['common.claim']();
    }

    const handleMarkRead = () => {
        if (!isRead) {
            setIsRead(true);
            handleReadStatus?.();
        }
    };

    const handleCardClick = () => {
        if (!data || isError || isLoading) return;
        handleMarkRead();
        newModal(
            <BoostClaimCard
                credential={unwrappedCred}
                credentialUri={credentialUri}
                duplicateLookup={duplicateLookup}
                showFooter={false}
                showBoostFooter={true}
                handleClaimBoostCredential={handleClaimOnClick}
                isLoading={isLoading}
                acceptCredentialLoading={acceptCredentialLoading}
                acceptCredentialCompleted={isClaimed}
                successCallback={handleSuccess}
                notification={notification}
                onDismiss={async () => {
                    handleReadStatus();
                    setClaimModalOpen(false);
                }}
                hideEndorsementRequestCard
            />,
            {
                backgroundImage:
                    isCertDisplayType || isID || isAwardDisplayType || isFamily
                        ? unwrappedCred?.display?.backgroundImage
                        : undefined,
            },
            modalDisplayType
        );
    };

    const isArchived = false;
    let title = notification?.message?.body || notification?.message?.title;

    // bandaid for boosts from users with no display name
    if (
        notification.type === NOTIFICATION_TYPES.BOOST_RECEIVED &&
        notification.message?.body === ' has boosted you!'
    ) {
        const fromName = notification.from.profileId || formatDid(notification.from.did);
        title = `${fromName} has boosted you!`;
    }

    // override text when endorsement
    if (
        isEndorsementCredentialType &&
        notification.type === NOTIFICATION_TYPES.BOOST_ACCEPTED &&
        notification.message?.body?.includes('has accepted your boost!')
    ) {
        const fromName = notification.from.profileId || formatDid(notification.from.did);
        title = `${fromName} has accepted your endorsement!`;
    }

    const handleArchiveAction = () => {
        handleArchive?.();
    };

    const handleButtonClick = () => {
        handleMarkRead();
        newModal(
            <BoostClaimCard
                credential={unwrappedCred}
                credentialUri={credentialUri}
                duplicateLookup={duplicateLookup}
                showFooter={false}
                showBoostFooter={true}
                handleClaimBoostCredential={handleClaimOnClick}
                isLoading={isLoading}
                acceptCredentialLoading={acceptCredentialLoading}
                acceptCredentialCompleted={isClaimed}
                successCallback={handleSuccess}
                notification={notification}
                onDismiss={async () => {
                    handleReadStatus();
                    setClaimModalOpen(false);
                }}
                hideEndorsementRequestCard
            />,

            {
                backgroundImage:
                    isCertDisplayType || isID || isAwardDisplayType
                        ? unwrappedCred?.display?.backgroundImage
                        : undefined,
            },
            modalDisplayType
        );
    };

    if (cardLoading || isLoading) {
        return <NotificationSkeleton />;
    }

    const credentialBadgeAchievementType =
        unwrappedCred?.type.includes('ClrCredential') &&
        Array.isArray(unwrappedCred?.credentialSubject?.verifiableCredential)
            ? unwrappedCred.credentialSubject.verifiableCredential[0]?.credentialSubject
                  ?.achievement?.achievementType
            : unwrappedCred?.credentialSubject?.achievement?.achievementType;

    if (isError) {
        return (
            <div role="alert" className="p-4 text-sm text-red-700">
                {m['claim.modal.verificationFailed']()}
            </div>
        );
    }

    return (
        <>
            <ErrorBoundary
                fallback={
                    <div className={`${notificationCardStyles.fallbackShell} ${className}`}>
                        Unable to load notification
                    </div>
                }
            >
                <div
                    ref={ref}
                    className={`${notificationCardStyles.shell} min-h-[120px] ${className}`}
                >
                    {!isRead && !isLoading && (
                        <div
                            aria-hidden="true"
                            className="notification-count-mobile unread-indicator-dot"
                        />
                    )}
                    <button
                        type="button"
                        aria-label={`View ${capitalize(title)}`}
                        className="notification-card-left-side px-[0px] flex cursor-pointer"
                        onClick={handleCardClick}
                    >
                        {isEndorsementCredentialType && !isLoading && (
                            <div className="w-[90px] h-[90px] min-w-[90px] min-h-[90px] overflow-hidden rounded-full">
                                {issuerProfileImageElement}
                            </div>
                        )}

                        {/* IDs get a compact circular badge: the full ID-card art
                            CredentialBadgeNew renders can't shrink into the 90px slot */}
                        {!isLoading && !isEndorsementCredentialType && isID && (
                            <div className="w-[90px] h-[90px] min-w-[90px] min-h-[90px] rounded-full bg-blue-400 border-4 border-solid border-white flex items-center justify-center overflow-hidden">
                                {credImgUrl ? (
                                    <img
                                        src={credImgUrl}
                                        alt=""
                                        className="w-[70%] h-[70%] rounded-full object-cover border-4 border-solid border-white"
                                    />
                                ) : (
                                    <span aria-hidden="true">
                                        <IDsIconSolid className="w-[36px] h-[36px] text-white" />
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Media/portfolio art can't fit the slot either: use the
                            category icon in a circle, mirroring the ID treatment */}
                        {!isLoading &&
                            !isEndorsementCredentialType &&
                            !isID &&
                            isMediaDisplayType && (
                                <div
                                    className={`w-[90px] h-[90px] min-w-[90px] min-h-[90px] rounded-full border-4 border-solid border-white flex items-center justify-center overflow-hidden bg-${categoryCircleColor}`}
                                >
                                    <div className="w-[70%] h-[70%] rounded-full border-4 border-solid border-white flex items-center justify-center">
                                        {CategoryIcon && (
                                            <CategoryIcon className="w-[32px] h-[32px] text-white" />
                                        )}
                                    </div>
                                </div>
                            )}

                        {!isLoading &&
                            !isEndorsementCredentialType &&
                            !isID &&
                            !isMediaDisplayType && (
                                <div className="w-[90px] h-[90px] min-w-[90px] min-h-[90px] flex items-center justify-center">
                                    <div
                                        className={`flex flex-col items-center justify-center shrink-0 ${badgeScaleClass}`}
                                    >
                                        <CredentialBadgeNew
                                            // Deliberately not passing the resolved credential:
                                            // it would route CLR credentials (e.g. learning
                                            // history) into the unsized CLR badge; notifications
                                            // use the compact default badge instead.
                                            credential={undefined as never}
                                            achievementType={credentialBadgeAchievementType}
                                            // boostType accepts CredentialCategoryEnum values at runtime (see getBoostMetadata)
                                            boostType={
                                                credCategory as unknown as BoostCategoryOptionsEnum
                                            }
                                            badgeThumbnail={credImgUrl || ''}
                                            showBackgroundImage={false}
                                            backgroundImage=""
                                            backgroundColor=""
                                            badgeCircleCustomClass="w-[90px]! h-[90px]"
                                            badgeContainerCustomClass="notification-cred-badge mt-[0px] mb-[0px]"
                                            badgeRibbonContainerCustomClass="notification-cred-badge-ribbon my-[0px]"
                                            displayType={displayType}
                                        />
                                    </div>
                                </div>
                            )}

                        {isLoading && (
                            <div className="w-[90px] h-[90px] rounded-full bg-grayscale-50" />
                        )}
                    </button>
                    <div className="flex flex-col justify-center items-start relative w-full">
                        <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                            <h3
                                className={notificationCardStyles.title}
                                data-testid="notification-title"
                            >
                                <button
                                    type="button"
                                    className="cursor-pointer text-left"
                                    onClick={handleCardClick}
                                >
                                    {capitalize(title)}
                                </button>
                            </h3>
                            <p
                                className={`${notificationCardStyles.meta} mt-[10px] ${textStyles}`}
                                data-testid="notification-type"
                            >
                                {typeText}{' '}
                                {issueDate && (
                                    <span
                                        className={notificationCardStyles.date}
                                        data-testid="notification-cred-issue-date"
                                    >
                                        • {issueDate}
                                    </span>
                                )}
                            </p>

                            <div className="flex relative items-center justify-between mt-3 w-full">
                                <button
                                    type="button"
                                    className={`cursor-pointer ${notificationCardStyles.primaryButton} mr-[15px] w-[143px] ${claimButtonStyles}`}
                                    onClick={handleButtonClick}
                                    name="notification-claim-button"
                                >
                                    {isLoading ? m['common.loading']() : buttonText}
                                    {isClaimed && (
                                        <span aria-hidden="true">
                                            <Checkmark className="h-[24px] p-0 m-0" />
                                        </span>
                                    )}{' '}
                                </button>

                                <button
                                    type="button"
                                    aria-label={
                                        isArchived ? 'Restore notification' : 'Dismiss notification'
                                    }
                                    onClick={handleArchiveAction}
                                    className={`${notificationCardStyles.iconButton} mr-2`}
                                    name="notification-view-button"
                                >
                                    {!isArchived && (
                                        <span aria-hidden="true">
                                            <X className="text-grayscale-700 w-[20px] h-[20px] notification-card-x" />
                                        </span>
                                    )}

                                    {isArchived && (
                                        <img
                                            src={ArrowArcLeft ?? ''}
                                            alt=""
                                            className="notification-card-x"
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </>
    );
};

export default NotificationBoostCard;

import React, { useState } from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import {
    getLogger,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
    useWallet,
} from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { LCR } from 'learn-card-base/types/credential-records';
import BoostClaimCard from '../../boost/claim-boost-card/BoostClaimCard';
import { useForceRefreshLearnCloudCredential } from '../../credential-refresh-listener/CredentialRefreshListener';

import { VC, type LCNNotification } from '@learncard/types';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import * as m from '../../../paraglide/messages.js';
import { notificationCardStyles } from './types';

const log = getLogger('notification-credential-refreshed-card');

type NotificationCredentialRefreshedCardProps = {
    notification: NotificationType;
    onRead?: () => void | Promise<void>;
    className?: string;
};

/**
 * Extracts the opaque managed refreshId from a CREDENTIAL_REFRESHED notification.
 * The payload carries routing metadata only (refreshId, version, routeKey,
 * deliveryKey) — never subject or body data. Anything else is malformed and the
 * caller falls back safely.
 */
export const getRefreshIdFromNotification = (
    notification: NotificationType
): string | undefined => {
    const metadata = notification?.data?.metadata as Record<string, unknown> | undefined;
    const refreshId = metadata?.refreshId;

    return typeof refreshId === 'string' && refreshId.length > 0 ? refreshId : undefined;
};

/** A managed refresh service id is `<base>/refresh/<refreshId>`; match the tail exactly */
const serviceIdMatchesRefreshId = (serviceId: unknown, refreshId: string): boolean => {
    if (typeof serviceId !== 'string' || serviceId.length === 0) return false;

    const tail = serviceId.split('/').filter(Boolean).pop();

    return tail === refreshId;
};

/**
 * Locates the holder's LearnCloud index record for a refresh notification by its
 * encrypted refresh metadata. Records whose refresh metadata has not been written
 * yet are discovered lazily by resolving the credential and inspecting its
 * `refreshService` — the same discovery rule the foreground scan uses.
 */
export const locateCredentialRefreshRecord = async (
    wallet: BespokeLearnCard,
    refreshId: string
): Promise<LCR | undefined> => {
    const records = ((await wallet.index.LearnCloud.get({})) ?? []) as LCR[];

    const withMetadata = records.find(record =>
        serviceIdMatchesRefreshId(record.refresh?.serviceId, refreshId)
    );

    if (withMetadata) return withMetadata;

    for (const record of records) {
        if (record.refresh) continue;

        try {
            const vc = (await wallet.read.get(record.uri)) as VC | undefined;
            const services = Array.isArray(vc?.refreshService)
                ? vc.refreshService
                : [vc?.refreshService];

            if (
                services.some(service =>
                    serviceIdMatchesRefreshId(
                        (service as { id?: unknown } | undefined)?.id,
                        refreshId
                    )
                )
            ) {
                return record;
            }
        } catch (error) {
            // An unreadable credential is skipped without failing the lookup.
            log.warn('refresh.notification.locate.read-failed', error);
        }
    }

    return undefined;
};

/**
 * Notification card for CREDENTIAL_REFRESHED (LC-2117, LC-2135, LC-2136).
 *
 * Renders only the server's generic translated copy — a credential was updated,
 * without identifying it before authenticated retrieval. Tapping it:
 *
 * 1. Marks the notification read.
 * 2. Locates the wallet index record by the encrypted refresh metadata.
 * 3. Forces a targeted refresh, bypassing the 24-hour staleness guard.
 * 4. Opens the newest current URI on success; on failure opens the existing
 *    current URI with friendly connection feedback. When no local record exists
 *    yet, shows friendly retry copy instead of opening a broken detail route.
 */
const NotificationCredentialRefreshedCard: React.FC<NotificationCredentialRefreshedCardProps> = ({
    notification,
    onRead,
    className,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { forceRefresh } = useForceRefreshLearnCloudCredential();

    const [isChecking, setIsChecking] = useState(false);

    const formattedDate = notification.sent
        ? moment(notification.sent).format('MMM D, YYYY h:mma')
        : undefined;

    const title =
        notification.message?.body ||
        notification.message?.title ||
        m['alerts.credentialUpdated']();

    const openCredential = async (wallet: BespokeLearnCard, uri: string) => {
        const resolved = (await wallet.read.get(uri)) as VC | undefined;

        const unwrapped = resolved && unwrapBoostCredential(resolved);
        const credential = (Array.isArray(unwrapped) ? unwrapped[0] : unwrapped) as VC | undefined;

        if (!credential) {
            // The credential cannot be resolved locally; never open a broken detail route.
            presentToast(m['alerts.updatedCredentialUnavailable'](), {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
            return;
        }

        newModal(
            <BoostClaimCard
                credential={credential}
                credentialUri={uri}
                showFooter={false}
                showBoostFooter
                acceptCredentialCompleted
                notification={notification as unknown as LCNNotification}
                onDismiss={() => closeModal()}
                hideEndorsementRequestCard
                lifecycleStatus="active"
            />
        );
    };

    const handleClick = async () => {
        if (isChecking) return;

        await onRead?.();

        const refreshId = getRefreshIdFromNotification(notification);

        if (!refreshId) {
            presentToast(m['alerts.updatedCredentialUnavailable'](), {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
            return;
        }

        setIsChecking(true);

        try {
            const wallet = await initWallet();
            const record = await locateCredentialRefreshRecord(wallet, refreshId);

            if (!record) {
                presentToast(m['alerts.updatedCredentialUnavailable'](), {
                    duration: 3000,
                    type: ToastTypeEnum.Error,
                });
                return;
            }

            const result = await forceRefresh(record, wallet);

            if (result.status === 'updated' || result.status === 'unchanged') {
                await openCredential(wallet, result.record.uri);
            } else if (result.status === 'superseded') {
                // Another device/process already advanced the record; its current URI is
                // the newest one.
                await openCredential(wallet, result.record.uri);
            } else if (result.status === 'failed') {
                presentToast(m['alerts.updateCheckFailed'](), {
                    duration: 3000,
                    type: ToastTypeEnum.Error,
                });

                // The current credential is retained on failure — still open it.
                await openCredential(wallet, record.uri);
            } else {
                // 'unsupported' or 'skipped': open the credential as-is.
                await openCredential(wallet, record.uri);
            }
        } catch (error) {
            log.error('refresh.notification.tap-failed', error);
            presentToast(m['alerts.updateCheckFailed'](), {
                duration: 3000,
                type: ToastTypeEnum.Error,
            });
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <ErrorBoundary
            fallback={
                <div className={notificationCardStyles.fallbackShell}>
                    {m['alerts.unableToLoad']()}
                </div>
            }
        >
            <div
                onClick={handleClick}
                className={`${notificationCardStyles.shell} min-h-[120px] cursor-pointer ${
                    className ?? ''
                }`}
                data-testid="notification-credential-refreshed"
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center bg-emerald-50">
                        <div className="w-[52px] h-[52px] rounded-full bg-emerald-600 flex items-center justify-center">
                            <Checkmark className="h-[28px] w-[28px] text-white" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-start relative w-full">
                    <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                        <h4
                            className={`cursor-pointer ${notificationCardStyles.title}`}
                            data-testid="notification-title"
                        >
                            {title}
                        </h4>
                        <p
                            className={`${notificationCardStyles.meta} mt-[10px] text-emerald-600`}
                            data-testid="notification-type"
                        >
                            {m['alerts.updated']()}{' '}
                            {formattedDate && (
                                <span className={notificationCardStyles.date}>
                                    • {formattedDate}
                                </span>
                            )}
                        </p>

                        <div className="relative flex items-center mt-3 w-full">
                            <div
                                className={`${
                                    notificationCardStyles.primaryButton
                                } bg-white text-emerald-600 border-emerald-600 ${
                                    isChecking ? 'opacity-60 pointer-events-none' : ''
                                }`}
                            >
                                {isChecking ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                        {m['alerts.checkingForUpdate']()}
                                    </span>
                                ) : (
                                    m['alerts.viewCredential']()
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationCredentialRefreshedCard;

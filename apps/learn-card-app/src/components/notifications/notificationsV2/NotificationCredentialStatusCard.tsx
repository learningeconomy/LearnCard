import React from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import { useModal, useGetResolvedCredential, CredentialCategoryEnum } from 'learn-card-base';
import {
    unwrapBoostCredential,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { CredentialStatusSealIcon } from 'learn-card-base/components/CredentialBadge/CredentialStatusSealIcon';

import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { notificationCardStyles } from './types';
import { CATEGORY_TO_ROUTE } from '../../../helpers/categoryRoutes';

export type CredentialStatusVariant = 'revoked' | 'suspended' | 'unsuspended';

const VARIANT_STYLES: Record<
    CredentialStatusVariant,
    { accent: string; border: string; tint: string; statusText: string }
> = {
    revoked: {
        accent: 'text-red-600',
        border: 'border-red-600',
        tint: 'bg-red-50',
        statusText: 'Revoked',
    },
    suspended: {
        accent: 'text-orange-600',
        border: 'border-orange-600',
        tint: 'bg-orange-50',
        statusText: 'Suspended',
    },
    unsuspended: {
        accent: 'text-emerald-600',
        border: 'border-emerald-600',
        tint: 'bg-emerald-50',
        statusText: 'Restored',
    },
};

type NotificationCredentialStatusCardProps = {
    notification: NotificationType;
    variant: CredentialStatusVariant;
    onRead?: () => void;
    className?: string;
};

/**
 * Notification card for credential lifecycle changes
 * (CREDENTIAL_REVOKED / CREDENTIAL_SUSPENDED / CREDENTIAL_UNSUSPENDED).
 *
 * Renders the server-provided title/body with a state-appropriate seal icon and
 * accent color. Tapping resolves the affected credential (from data.vcUris) and
 * navigates to its category page so the holder sees it in-context (revoked and
 * suspended credentials render desaturated with a status pill).
 */
const NotificationCredentialStatusCard: React.FC<NotificationCredentialStatusCardProps> = ({
    notification,
    variant,
    onRead,
    className,
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();

    const uri = notification?.data?.vcUris?.[0];
    const { data: resolved } = useGetResolvedCredential(uri);

    const { accent, border, tint, statusText } = VARIANT_STYLES[variant];

    const formattedDate = notification.sent
        ? moment(notification.sent).format('MMM D, YYYY h:mma')
        : undefined;

    const title = notification.message?.body || notification.message?.title;

    const handleClick = async () => {
        await onRead?.();

        // Route to the affected credential's category page; fall back to the wallet
        // home if the credential can't be resolved (e.g. a revoked cred removed from storage).
        let route = '/wallet';
        try {
            const unwrapped = resolved && unwrapBoostCredential(resolved);
            const cred = Array.isArray(unwrapped) ? unwrapped[0] : unwrapped;
            const category = cred && getDefaultCategoryForCredential(cred);
            const categoryRoute =
                category && CATEGORY_TO_ROUTE[category as unknown as CredentialCategoryEnum];
            if (categoryRoute) route = categoryRoute;
        } catch {
            /* keep /wallet fallback */
        }

        closeAllModals();
        history.push(route);
    };

    return (
        <ErrorBoundary
            fallback={
                <div className={notificationCardStyles.fallbackShell}>
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleClick}
                className={`${notificationCardStyles.shell} min-h-[120px] cursor-pointer ${
                    className ?? ''
                }`}
                data-testid={`notification-credential-${variant}`}
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <div
                        className={`w-[90px] h-[90px] rounded-full flex items-center justify-center ${tint}`}
                    >
                        {variant === 'unsuspended' ? (
                            <div className="w-[52px] h-[52px] rounded-full bg-emerald-600 flex items-center justify-center">
                                <Checkmark className="h-[28px] w-[28px] text-white" />
                            </div>
                        ) : (
                            <CredentialStatusSealIcon
                                status={variant}
                                className="w-[52px] h-[52px]"
                            />
                        )}
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
                            className={`${notificationCardStyles.meta} mt-[10px] ${accent}`}
                            data-testid="notification-type"
                        >
                            {statusText}{' '}
                            {formattedDate && (
                                <span className={notificationCardStyles.date}>
                                    • {formattedDate}
                                </span>
                            )}
                        </p>

                        <div className="relative flex items-center mt-3 w-full">
                            <div
                                className={`${notificationCardStyles.primaryButton} bg-white ${accent} ${border}`}
                            >
                                View Credential
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationCredentialStatusCard;

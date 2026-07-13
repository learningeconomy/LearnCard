import React, { useState } from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import { useModal, ModalTypes, useGetResolvedCredential } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { CredentialStatusSealIcon } from 'learn-card-base/components/CredentialBadge/CredentialStatusSealIcon';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';

import { VC } from '@learncard/types';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { notificationCardStyles } from './types';

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

/**
 * Full credential view shown when "View Credential" is tapped. Renders the same
 * flippable card used across the app (VCDisplayCardWrapper2) with a BoostFooter for
 * Details/Close, so the holder sees the credential in full (with its revoked/suspended
 * treatment) rather than being routed away to a list page.
 */
const CredentialViewModalContent: React.FC<{ credential: VC; onClose: () => void }> = ({
    credential,
    onClose,
}) => {
    const [isFront, setIsFront] = useState(true);

    return (
        <div className="relative w-full h-full flex flex-col">
            <section className="h-full w-full overflow-y-auto disable-scrollbars pt-6 pb-32 flex flex-col items-center">
                <VCDisplayCardWrapper2
                    credential={credential}
                    checkProof={false}
                    hideNavButtons
                    hideQRCode
                    isFrontOverride={isFront}
                    setIsFrontOverride={setIsFront}
                />
            </section>
            <footer className="absolute bottom-0 left-0 w-full z-[9999]">
                <BoostFooter
                    handleClose={onClose}
                    handleDetails={isFront ? () => setIsFront(false) : undefined}
                    handleBack={isFront ? undefined : () => setIsFront(true)}
                />
            </footer>
        </div>
    );
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
 * opens the full credential view in a modal (revoked/suspended credentials render
 * desaturated with a status pill there).
 */
const NotificationCredentialStatusCard: React.FC<NotificationCredentialStatusCardProps> = ({
    notification,
    variant,
    onRead,
    className,
}) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const uri = notification?.data?.vcUris?.[0];
    const { data: resolved } = useGetResolvedCredential(uri);

    const { accent, border, tint, statusText } = VARIANT_STYLES[variant];

    const formattedDate = notification.sent
        ? moment(notification.sent).format('MMM D, YYYY h:mma')
        : undefined;

    const title = notification.message?.body || notification.message?.title;

    const handleClick = async () => {
        await onRead?.();

        const unwrapped = resolved && unwrapBoostCredential(resolved);
        const credential = (Array.isArray(unwrapped) ? unwrapped[0] : unwrapped) as VC | undefined;
        if (!credential) return; // resolution failed (e.g. cred removed from storage); no-op

        newModal(
            <CredentialViewModalContent credential={credential} onClose={() => closeModal()} />
        );
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

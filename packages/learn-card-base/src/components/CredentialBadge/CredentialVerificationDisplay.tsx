import React, { useId } from 'react';
import moment from 'moment';
import type {
    AchievementCredential,
    CredentialInfo,
    IssuerContext,
    IssuerTrustProfile,
    VC,
} from '@learncard/types';
import { IssuerLabelText } from '@learncard/react';

import TrustedCertIcon from 'learn-card-base/svgs/TrustedCertIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';
import UnknownCertIcon from 'learn-card-base/svgs/UnknownCertIcon';
import UntrustedCertIcon from 'learn-card-base/svgs/UntrustedCertIcon';
import { useT } from 'learn-card-base/i18n';
import {
    getIssuerContextLabel,
    getIssuerContextName,
    useIssuerContext,
} from 'learn-card-base/hooks/useIssuerContext';
import CredentialIssuerPopover from './CredentialIssuerPopover';
import { CredentialStatusSealIcon, CredentialLifecycleStatus } from './CredentialStatusSealIcon';

export const getInfoFromCredential = (
    credential: VC | AchievementCredential,
    dateFormat: string = 'dd MMM, yyyy',
    options: { uppercaseDate?: boolean } = { uppercaseDate: true }
): CredentialInfo => {
    const credentialSubject = Array.isArray(credential?.credentialSubject)
        ? credential?.credentialSubject?.[0]
        : credential?.credentialSubject;
    const title = credentialSubject?.achievement?.name;
    const issuee = credentialSubject?.id;
    const imageUrl = credentialSubject?.achievement?.image;
    const dateValue = credential?.issuanceDate || credential?.validFrom;
    let createdAt = moment(dateValue).format(dateFormat);

    if (options.uppercaseDate) createdAt = createdAt.toUpperCase();

    return { title, createdAt, issuer: credential?.issuer, issuee, credentialSubject, imageUrl };
};

type CredentialVerificationDisplayProps = {
    credential: VC;
    className?: string;
    iconClassName?: string;
    showText?: boolean;
    managedBoost?: boolean;
    verifierLabelOverride?: string;
    issuerDisplayName?: string;
    issuerPopoverEnabled?: boolean;
    issuerTrustProfile?: IssuerTrustProfile;
    lifecycleStatus?: CredentialLifecycleStatus;
    trustedOnly?: boolean;
    issuerContextOverride?: IssuerContext;
};

const IssuerAvatar: React.FC<{
    issuerContext: IssuerContext;
    className?: string;
}> = ({ issuerContext, className = '' }) => {
    const profile = issuerContext.profile;
    const initial = profile?.displayName?.trim()[0] ?? profile?.profileId?.trim()[0] ?? '?';

    if (profile?.image) {
        return (
            <img
                src={profile.image}
                alt=""
                className={`w-[22px] h-[22px] rounded-full object-cover bg-grayscale-100 ${className}`}
                referrerPolicy="no-referrer"
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`w-[22px] h-[22px] rounded-full bg-grayscale-200 text-grayscale-700 flex items-center justify-center text-[10px] font-semibold uppercase ${className}`}
        >
            {initial}
        </span>
    );
};

const getStateColor = (issuerContext: IssuerContext): string => {
    switch (issuerContext.state) {
        case 'denied':
            return 'text-red-600';
        case 'trusted':
        case 'app':
        case 'connection':
            return 'text-emerald-600';
        case 'unresolvable':
            return issuerContext.trustProfile === 'social' ? 'text-amber-600' : 'text-amber-700';
        case 'self':
        case 'mutuals':
        case 'identified':
            return 'text-grayscale-700';
        case 'unclaimed':
            return 'text-grayscale-500';
    }
};

const IssuerStateIcon: React.FC<{
    issuerContext: IssuerContext;
    className?: string;
}> = ({ issuerContext, className = '' }) => {
    if (
        issuerContext.state === 'connection' ||
        issuerContext.state === 'mutuals' ||
        issuerContext.state === 'identified' ||
        issuerContext.state === 'unclaimed'
    ) {
        return <IssuerAvatar issuerContext={issuerContext} className={className} />;
    }
    if (issuerContext.state === 'denied') {
        return <UntrustedCertIcon className={`w-[22px] h-[22px] ${className}`} />;
    }
    if (issuerContext.state === 'self') {
        return <SelfVerifiedCertIcon className={`w-[22px] h-[22px] ${className}`} />;
    }
    if (issuerContext.state === 'trusted' || issuerContext.state === 'app') {
        return <TrustedCertIcon className={`w-[22px] h-[22px] ${className}`} />;
    }

    return <UnknownCertIcon className={`w-[22px] h-[22px] ${className}`} />;
};

export const CredentialVerificationDisplay: React.FC<CredentialVerificationDisplayProps> = ({
    credential,
    className = '',
    iconClassName = '',
    showText = false,
    managedBoost = false,
    verifierLabelOverride,
    issuerDisplayName,
    issuerTrustProfile,
    issuerPopoverEnabled = true,
    lifecycleStatus = 'active',
    trustedOnly = false,
    issuerContextOverride,
}) => {
    const t = useT();
    const popoverId = useId().replace(/:/g, '');
    const { issuerContext: resolvedIssuerContext, registryIssuerName } = useIssuerContext(
        credential,
        {
            managedBoost,
            trustProfile: issuerTrustProfile,
        }
    );
    const issuerContext = issuerContextOverride ?? resolvedIssuerContext;
    const resolvedIssuerName = issuerContext
        ? getIssuerContextName(issuerContext, issuerDisplayName ?? registryIssuerName)
        : undefined;
    const label = issuerContext
        ? getIssuerContextLabel(issuerContext, t, resolvedIssuerName, verifierLabelOverride)
        : '';
    const popoverTriggerId = `credential-issuer-trigger-${popoverId}`;
    const renderLifecycleBadge = (): React.ReactNode => {
        if (lifecycleStatus !== 'revoked' && lifecycleStatus !== 'suspended') return null;
        const stateColor = lifecycleStatus === 'revoked' ? 'text-red-600' : 'text-amber-600';

        return (
            <div
                className={`flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight ${stateColor} ${className}`}
            >
                <CredentialStatusSealIcon
                    status={lifecycleStatus}
                    className={`w-[22px] h-[22px] ${iconClassName}`}
                />
                {showText && (
                    <span className="whitespace-nowrap uppercase tracking-wide">
                        {t(`credential.lifecycle.${lifecycleStatus}`)}
                    </span>
                )}
            </div>
        );
    };
    const lifecycleBadge = renderLifecycleBadge();

    if (lifecycleBadge) return lifecycleBadge;
    if (!issuerContext) return null;
    if (trustedOnly && issuerContext.state !== 'trusted' && issuerContext.state !== 'app') {
        return null;
    }
    if (!showText && issuerContext.state === 'unresolvable') return null;

    const badge = (
        <div
            className={`flex items-center gap-1 font-poppins font-[500] text-[12px] leading-tight ${getStateColor(
                issuerContext
            )} ${className}`}
        >
            <IssuerStateIcon issuerContext={issuerContext} className={iconClassName} />
            {showText && (
                <span className="whitespace-nowrap tracking-wide">
                    <IssuerLabelText label={label} issuerName={resolvedIssuerName} />
                </span>
            )}
        </div>
    );
    if (!issuerPopoverEnabled) {
        return badge;
    }

    return (
        <>
            <button
                id={popoverTriggerId}
                type="button"
                onClick={event => event.stopPropagation()}
                className="appearance-none bg-transparent p-0 inline-flex"
                aria-haspopup="dialog"
                aria-label={`Open issuer details for ${label}`}
            >
                {badge}
            </button>
            <CredentialIssuerPopover
                enabled
                triggerId={popoverTriggerId}
                issuerContext={issuerContext}
            />
        </>
    );
};

export default CredentialVerificationDisplay;

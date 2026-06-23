import React, { useId } from 'react';

import moment from 'moment';
import TrustedCertIcon from 'learn-card-base/svgs/TrustedCertIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';
import UnknownCertIcon from 'learn-card-base/svgs/UnknownCertIcon';
import UntrustedCertIcon from 'learn-card-base/svgs/UntrustedCertIcon';
import { AchievementCredential, VC, CredentialInfo } from '@learncard/types';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import { isAppDidWeb } from '@learncard/helpers';
import { useT } from 'learn-card-base/i18n';
import CredentialIssuerPopover from './CredentialIssuerPopover';
import { VERIFIER_STATES, VerifierState } from './credentialVerificationTypes';

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
    if (options.uppercaseDate) {
        createdAt = createdAt.toUpperCase();
    }

    return { title, createdAt, issuer: credential?.issuer, issuee, credentialSubject, imageUrl };
};

type CredentialVerificationDisplayProps = {
    credential: VC;
    className?: string;
    iconClassName?: string;
    showText?: boolean;
    managedBoost?: boolean;
    unknownVerifierTitle?: string;
    issuerDisplayName?: string;
    issuerPopoverEnabled?: boolean;
};

export const CredentialVerificationDisplay: React.FC<CredentialVerificationDisplayProps> = ({
    credential,
    className = '',
    iconClassName = '',
    showText = false,
    managedBoost = false,
    unknownVerifierTitle,
    issuerDisplayName,
    issuerPopoverEnabled = true,
}) => {
    const t = useT();
    const popoverId = useId().replace(/:/g, '');
    const profileID =
        typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id;
    const { data: knownDIDRegistry } = useKnownDIDRegistry(profileID);
    const {
        title = '',
        createdAt,
        issuer: _issuer = '',
        issuee: _issuee = '',
        credentialSubject,
    } = getInfoFromCredential(credential, 'MMM dd, yyyy', { uppercaseDate: false });
    const issuerDid =
        typeof credential?.issuer === 'string' ? credential?.issuer : credential?.issuer?.id;
    const isAppIssuer = isAppDidWeb(issuerDid);
    const registryIssuerName = (knownDIDRegistry as any)?.results?.matchingIssuers?.[0]?.issuer
        ?.federation_entity?.organization_name;
    const resolvedIssuerName =
        issuerDisplayName ?? registryIssuerName ?? unknownVerifierTitle ?? 'Unknown issuer';

    let verifierState: VerifierState;

    // For Scouts: if we have a role-based title (e.g., "Verified Scout"), treat as trusted
    const hasRoleBasedTitle = !!unknownVerifierTitle;

    const registrySourceAsState =
        knownDIDRegistry?.source === 'trusted'
            ? VERIFIER_STATES.trustedVerifier
            : knownDIDRegistry?.source === 'untrusted'
            ? VERIFIER_STATES.untrustedVerifier
            : VERIFIER_STATES.unknownVerifier;

    if (
        ((managedBoost && credential?.issuer === issuerDid) ||
            (!managedBoost && credentialSubject?.id === issuerDid)) &&
        issuerDid &&
        issuerDid !== 'did:example:123'
    ) {
        // the extra "&& issuerDid" is so that the credential preview doesn't say "Self Verified"
        // the did:example:123 condition is so that we don't show this status from the Manage Boosts tab
        verifierState = VERIFIER_STATES.selfVerified;
    } else if (registrySourceAsState === VERIFIER_STATES.untrustedVerifier) {
        verifierState = VERIFIER_STATES.untrustedVerifier;
    } else if (hasRoleBasedTitle || registrySourceAsState === VERIFIER_STATES.trustedVerifier) {
        // If we have a role-based title OR we are already trusted in the registry, treat as trusted verifier
        verifierState = VERIFIER_STATES.trustedVerifier;
    } else {
        verifierState = isAppIssuer ? VERIFIER_STATES.appIssuer : VERIFIER_STATES.unknownVerifier;
    }
    const popoverTriggerId = `credential-issuer-trigger-${popoverId}`;
    const verifierStateLabel = unknownVerifierTitle ?? verifierState;
    const renderBadge = (badgeClassName = className, badgeIconClassName = iconClassName) => {
        if (verifierState === VERIFIER_STATES.selfVerified) {
            return (
                <div
                    className={`text-green-dark flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight ${badgeClassName}`}
                >
                    <SelfVerifiedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />
                    <span className="whitespace-nowrap uppercase tracking-wide">
                        {t('verification.selfIssued')}
                    </span>
                </div>
            );
        }

        if (verifierState === VERIFIER_STATES.trustedVerifier) {
            return (
                <div
                    className={`text-green-600 flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight ${badgeClassName}`}
                >
                    <TrustedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />
                    <span className="whitespace-nowrap uppercase tracking-wide">
                        {unknownVerifierTitle ?? t('verification.trustedIssuer')}
                    </span>
                </div>
            );
        }

        if (verifierState === VERIFIER_STATES.unknownVerifier) {
            return (
                <div
                    className={`text-orange-500 flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight ${badgeClassName}`}
                >
                    <UnknownCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />
                    <span className="whitespace-nowrap uppercase tracking-wide">
                        {unknownVerifierTitle ?? t('verification.unknownIssuer')}
                    </span>
                </div>
            );
        }

        if (verifierState === VERIFIER_STATES.appIssuer) {
            return (
                <div
                    className={`text-cyan-600 flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight ${badgeClassName}`}
                >
                    <TrustedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />
                    <span className="whitespace-nowrap uppercase tracking-wide">
                        {t('verification.appIssuer')}
                    </span>
                </div>
            );
        }

        return (
            <div
                className={`text-red-mastercard flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight ${badgeClassName}`}
            >
                <UntrustedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />
                <span className="whitespace-nowrap uppercase tracking-wide">
                    {t('verification.untrustedIssuer')}
                </span>
            </div>
        );
    };
    const renderIconOnlyBadge = (badgeIconClassName = iconClassName) => {
        if (verifierState === VERIFIER_STATES.selfVerified) {
            return <SelfVerifiedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />;
        }

        if (verifierState === VERIFIER_STATES.trustedVerifier) {
            return <TrustedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />;
        }

        if (verifierState === VERIFIER_STATES.unknownVerifier) {
            return <UnknownCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />;
        }

        if (verifierState === VERIFIER_STATES.appIssuer) {
            return <TrustedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />;
        }

        return <UntrustedCertIcon className={`w-[22px] h-[22px] ${badgeIconClassName}`} />;
    };
    const renderPopover = () => (
        <CredentialIssuerPopover
            enabled={issuerPopoverEnabled}
            triggerId={popoverTriggerId}
            verifierState={verifierState}
            issuerDid={issuerDid}
        />
    );
    const renderInteractiveBadge = (badge: React.ReactNode) => (
        <>
            <button
                id={popoverTriggerId}
                type="button"
                onClick={e => e.stopPropagation()}
                className="appearance-none bg-transparent p-0 inline-flex"
                aria-haspopup={issuerPopoverEnabled ? 'dialog' : undefined}
                aria-label={
                    issuerPopoverEnabled
                        ? `Open issuer details for ${verifierStateLabel}`
                        : `Issuer verification: ${verifierStateLabel}`
                }
            >
                {badge}
            </button>
            {renderPopover()}
        </>
    );

    if (showText) return renderInteractiveBadge(renderBadge());
    if (issuerPopoverEnabled) return renderInteractiveBadge(renderIconOnlyBadge());

    if (verifierState === VERIFIER_STATES.unknownVerifier) {
        // Icon-only mode intentionally renders nothing for unknown issuers: a bare "?"
        // badge with no context reads as an error. Context is only shown via the labeled
        // showText=true variant above (e.g. when a credential is opened).
        return <></>;
    }

    return renderIconOnlyBadge();
};

export default CredentialVerificationDisplay;

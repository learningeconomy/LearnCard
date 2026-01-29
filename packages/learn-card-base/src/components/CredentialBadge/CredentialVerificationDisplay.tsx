import React from 'react';

import moment from 'moment';
import TrustedCertIcon from 'learn-card-base/svgs/TrustedCertIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';
import UnknownCertIcon from 'learn-card-base/svgs/UnknownCertIcon';
import UntrustedCertIcon from 'learn-card-base/svgs/UntrustedCertIcon';
import { AchievementCredential, VC, CredentialInfo } from '@learncard/types';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import { isAppDidWeb } from 'learn-card-base/helpers/credentialHelpers';

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

const VERIFIER_STATES = {
    selfVerified: 'Self Issued',
    trustedVerifier: 'Trusted Issuer',
    unknownVerifier: 'Unknown Issuer',
    appIssuer: 'Trusted App',
    untrustedVerifier: 'Untrusted Issuer',
} as const;
type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

type CredentialVerificationDisplayProps = {
    credential: VC;
    className?: string;
    iconClassName?: string;
    showText?: boolean;
    managedBoost?: boolean;
};

export const CredentialVerificationDisplay: React.FC<CredentialVerificationDisplayProps> = ({
    credential,
    className = '',
    iconClassName = '',
    showText = false,
    managedBoost = false,
}) => {
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

    let verifierState: VerifierState;
    if (
        ((managedBoost && credential?.issuer === issuerDid) ||
            (!managedBoost && credentialSubject?.id === issuerDid)) &&
        issuerDid &&
        issuerDid !== 'did:example:123'
    ) {
        // the extra "&& issuerDid" is so that the credential preview doesn't say "Self Verified"
        // the did:example:123 condition is so that we don't show this status from the Manage Boosts tab
        verifierState = VERIFIER_STATES.selfVerified;
    } else {
        if (knownDIDRegistry?.source === 'trusted') {
            verifierState = VERIFIER_STATES.trustedVerifier;
        } else if (knownDIDRegistry?.source === 'untrusted') {
            verifierState = VERIFIER_STATES.untrustedVerifier;
        } else if (knownDIDRegistry?.source === 'unknown') {
            verifierState = isAppIssuer
                ? VERIFIER_STATES.appIssuer
                : VERIFIER_STATES.unknownVerifier;
        } else {
            verifierState = isAppIssuer
                ? VERIFIER_STATES.appIssuer
                : VERIFIER_STATES.unknownVerifier;
        }
    }
    const isSelfVerified = verifierState === VERIFIER_STATES.selfVerified;

    if (isSelfVerified) {
        if (showText) {
            return (
                <p
                    className={`text-green-dark flex items-center font-poppins font-[500] text-base uppercase ${className}`}
                >
                    <SelfVerifiedCertIcon className={`w-[22px] h-[22px] mr-1 ${iconClassName}`} />{' '}
                    Self Issued
                </p>
            );
        }
        return <SelfVerifiedCertIcon className={`w-[22px] h-[22px] ${iconClassName}`} />;
    }

    if (verifierState === VERIFIER_STATES.trustedVerifier) {
        if (showText) {
            return (
                <p
                    className={`text-blue-light flex items-center font-poppins font-[500] text-base uppercase ${className}`}
                >
                    <TrustedCertIcon className={`w-[22px] h-[22px] mr-1 ${iconClassName}`} />{' '}
                    Trusted Issuer
                </p>
            );
        }
        return <TrustedCertIcon className={`w-[22px] h-[22px] ${iconClassName}`} />;
    }
    if (verifierState === VERIFIER_STATES.unknownVerifier) {
        // https://welibrary.atlassian.net/browse/LC-704
        // https://welibrary.atlassian.net/browse/LC-694
        // removes question mark when credential is unknown
        // leaving this comment here incase we want to bring it back

        // Hiding verifier badges for troops everywhere per https://welibrary.atlassian.net/browse/LC-741
        //   Adding back the orange question mark icon since we do/will want it everywhere we're using this component

        if (showText) {
            return (
                <p
                    className={`text-orange-500 flex items-center font-poppins font-[500] text-base uppercase ${className}`}
                >
                    <UnknownCertIcon className={`w-[22px] h-[22px] mr-1 ${iconClassName}`} />{' '}
                    Unknown Issuer
                </p>
            );
        }

        return <UnknownCertIcon className={`w-[22px] h-[22px] ${iconClassName}`} />;
    }
    if (verifierState === VERIFIER_STATES.appIssuer) {
        if (showText) {
            return (
                <p
                    className={`text-cyan-600 flex items-center font-poppins font-[500] text-base uppercase ${className}`}
                >
                    <TrustedCertIcon className={`w-[22px] h-[22px] mr-1 ${iconClassName}`} /> App
                    Issuer
                </p>
            );
        }

        return <TrustedCertIcon className={`w-[22px] h-[22px] ${iconClassName}`} />;
    }
    if (verifierState === VERIFIER_STATES.untrustedVerifier) {
        if (showText) {
            return (
                <p
                    className={`text-red-mastercard flex items-center font-poppins font-[500] text-base uppercase ${className}`}
                >
                    <UntrustedCertIcon className={`w-[22px] h-[22px] mr-1 ${iconClassName}`} />{' '}
                    Untrusted Issuer
                </p>
            );
        }
        return <UntrustedCertIcon className={`w-[22px] h-[22px] ${iconClassName}`} />;
    }

    return <></>;
};

export default CredentialVerificationDisplay;

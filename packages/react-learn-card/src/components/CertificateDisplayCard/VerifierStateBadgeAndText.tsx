import React, { forwardRef } from 'react';
import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';
import { useT } from '../../i18n';

export const VERIFIER_STATES = {
    selfVerified: 'Self Issued',
    trustedVerifier: 'Trusted Issuer',
    unknownVerifier: 'Unknown Issuer',
    appIssuer: 'App Issuer',
    untrustedVerifier: 'Untrusted Issuer',
} as const;
export type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

export type VerifierStateBadgeAndTextProps = {
    verifierState: VerifierState;
    className?: string;
    unknownVerifierTitle?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const VerifierStateBadgeAndText = forwardRef<HTMLButtonElement, VerifierStateBadgeAndTextProps>(
    ({ verifierState, className = '', unknownVerifierTitle, onClick }, ref) => {
        const t = useT();
        // For Scouts: if we have a role-based title, show it with trusted styling
        // BUT don't overwrite self-issued or untrusted status
        const effectiveState =
            unknownVerifierTitle &&
            verifierState !== VERIFIER_STATES.selfVerified &&
            verifierState !== VERIFIER_STATES.untrustedVerifier &&
            verifierState !== VERIFIER_STATES.appIssuer
                ? VERIFIER_STATES.trustedVerifier
                : verifierState;

        const content = (
            <>
                {effectiveState === VERIFIER_STATES.selfVerified && (
                    <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-green-dark">
                        <PersonBadge />
                        <span className="whitespace-nowrap">{t('verification.selfIssued')}</span>
                    </div>
                )}
                {effectiveState === VERIFIER_STATES.trustedVerifier && (
                    <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-green-600">
                        <VerifiedBadge />
                        <span className="whitespace-nowrap">
                            {unknownVerifierTitle ?? t('verification.trustedIssuer')}
                        </span>
                    </div>
                )}
                {effectiveState === VERIFIER_STATES.unknownVerifier && (
                    <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-orange-500">
                        <UnknownVerifierBadge />
                        <span className="whitespace-nowrap">
                            {unknownVerifierTitle ?? t('verification.unknownIssuer')}
                        </span>
                    </div>
                )}
                {effectiveState === VERIFIER_STATES.appIssuer && (
                    <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-cyan-600">
                        <VerifiedBadge />
                        <span className="whitespace-nowrap">{t('verification.appIssuer')}</span>
                    </div>
                )}
                {effectiveState === VERIFIER_STATES.untrustedVerifier && (
                    <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-red-mastercard">
                        <RedFlag />
                        <span className="whitespace-nowrap">
                            {t('verification.untrustedIssuer')}
                        </span>
                    </div>
                )}
            </>
        );

        return (
            <div className={`flex justify-center ${className}`}>
                {onClick ? (
                    <button
                        ref={ref}
                        type="button"
                        className="appearance-none bg-transparent p-0 text-left"
                        onClick={event => {
                            event.stopPropagation();
                            onClick(event);
                        }}
                        onMouseDown={event => event.stopPropagation()}
                        aria-haspopup="dialog"
                    >
                        {content}
                    </button>
                ) : (
                    <div>{content}</div>
                )}
            </div>
        );
    }
);

VerifierStateBadgeAndText.displayName = 'VerifierStateBadgeAndText';

export default VerifierStateBadgeAndText;

import React from 'react';
import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';

export const VERIFIER_STATES = {
    selfVerified: 'Self Issued',
    trustedVerifier: 'Trusted Issuer',
    unknownVerifier: 'Unknown Issuer',
    untrustedVerifier: 'Untrusted Issuer',
} as const;
export type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

export type VerifierStateBadgeAndTextProps = {
    verifierState: VerifierState;
    className?: string;
    unknownVerifierTitle?: string;
};

export const VerifierStateBadgeAndText: React.FC<VerifierStateBadgeAndTextProps> = ({
    verifierState,
    className = '',
    unknownVerifierTitle,
}) => {
    // For Scouts: if we have a role-based title, show it with trusted styling
    const displayAsTrusted = !!unknownVerifierTitle;
    const effectiveState = displayAsTrusted ? VERIFIER_STATES.trustedVerifier : verifierState;
    
    return (
        <div className={`flex justify-center ${className}`}>
            {effectiveState === VERIFIER_STATES.selfVerified && (
                <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-green-dark">
                    <PersonBadge />
                    <span className="whitespace-nowrap">Self Issued</span>
                </div>
            )}
            {effectiveState === VERIFIER_STATES.trustedVerifier && (
                <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-green-600">
                    <VerifiedBadge />
                    <span className="whitespace-nowrap">{unknownVerifierTitle ?? 'Trusted Issuer'}</span>
                </div>
            )}
            {effectiveState === VERIFIER_STATES.unknownVerifier && (
                <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-orange-500">
                    <UnknownVerifierBadge />
                    <span className="whitespace-nowrap">{unknownVerifierTitle ?? VERIFIER_STATES.unknownVerifier}</span>
                </div>
            )}
            {effectiveState === VERIFIER_STATES.untrustedVerifier && (
                <div className="flex items-center gap-0.5 font-poppins font-[500] text-[12px] leading-tight text-red-mastercard">
                    <RedFlag />
                    <span className="whitespace-nowrap">Untrusted Issuer</span>
                </div>
            )}
        </div>
    );
};

export default VerifierStateBadgeAndText;

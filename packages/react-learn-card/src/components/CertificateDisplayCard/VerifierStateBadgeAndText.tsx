import React from 'react';
import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';

export const VERIFIER_STATES = {
    selfVerified: 'Self Verified',
    trustedVerifier: 'Trusted Verifier',
    unknownVerifier: 'Unknown Verifier',
    untrustedVerifier: 'Untrusted Verifier',
} as const;
export type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

type VerifierStateBadgeAndTextProps = {
    verifierState: VerifierState;
    className?: string;
};

export const VerifierStateBadgeAndText: React.FC<VerifierStateBadgeAndTextProps> = ({
    verifierState,
    className = '',
}) => {
    return (
        <div className={`flex justify-center ${className}`}>
            {verifierState === VERIFIER_STATES.selfVerified && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-green-dark flex gap-[3px] items-center">
                    <PersonBadge />
                    Self Verified
                </span>
            )}
            {verifierState === VERIFIER_STATES.trustedVerifier && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-blue-light flex gap-[3px] items-center">
                    <VerifiedBadge />
                    Trusted Verifier
                </span>
            )}
            {verifierState === VERIFIER_STATES.unknownVerifier && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-orange-500 flex gap-[3px] items-center">
                    <UnknownVerifierBadge />
                    Unknown Verifier
                </span>
            )}
            {verifierState === VERIFIER_STATES.untrustedVerifier && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-red-mastercard flex gap-[3px] items-center">
                    <RedFlag />
                    Untrusted Verifier
                </span>
            )}
        </div>
    );
};

export default VerifierStateBadgeAndText;

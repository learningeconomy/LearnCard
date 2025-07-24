import React from 'react';
import UnknownVerifierBadge from '../svgs/UnknownVerifierBadge';
import VerifiedBadge from '../svgs/VerifiedBadge';
import PersonBadge from '../svgs/PersonBadge';
import RedFlag from '../svgs/RedFlag';

const VERIFIER_STATES = {
    selfVerified: 'Self Issued',
    trustedVerifier: 'Trusted Issuer',
    unknownVerifier: 'Unknown Issuer',
    untrustedVerifier: 'Untrusted Issuer',
} as const;
type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];

type VerifierStateBadgeAndTextProps = {
    verifierState: VerifierState;
};

const VerifierStateBadgeAndText: React.FC<VerifierStateBadgeAndTextProps> = ({ verifierState }) => {
    return (
        <div className="flex justify-center">
            {verifierState === VERIFIER_STATES.selfVerified && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-green-dark flex gap-[3px] items-center">
                    <PersonBadge />
                    Self Issued
                </span>
            )}
            {verifierState === VERIFIER_STATES.trustedVerifier && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-blue-light flex gap-[3px] items-center">
                    <VerifiedBadge />
                    Trusted Issuer
                </span>
            )}
            {verifierState === VERIFIER_STATES.unknownVerifier && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-orange-500 flex gap-[3px] items-center">
                    <UnknownVerifierBadge />
                    Unknown Issuer
                </span>
            )}
            {verifierState === VERIFIER_STATES.untrustedVerifier && (
                <span className="uppercase font-poppins text-[12px] font-[500] text-red-mastercard flex gap-[3px] items-center">
                    <RedFlag />
                    Untrusted Issuer
                </span>
            )}
        </div>
    );
};

export default VerifierStateBadgeAndText;

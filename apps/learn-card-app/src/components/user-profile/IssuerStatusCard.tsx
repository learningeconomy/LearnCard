import React from 'react';

import TrustedCertIcon from 'learn-card-base/svgs/TrustedCertIcon';
import UnknownCertIcon from 'learn-card-base/svgs/UnknownCertIcon';
import BecomeTrustedIssuerForm from 'learn-card-base/components/CredentialBadge/BecomeTrustedIssuerForm';

import { useModal, ModalTypes } from 'learn-card-base';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';

type IssuerStatusCardProps = {
    walletDid: string;
};

const IssuerStatusCard: React.FC<IssuerStatusCardProps> = ({ walletDid }) => {
    const { newModal, closeAllModals } = useModal();
    const { data: knownDIDRegistry } = useKnownDIDRegistry(walletDid || undefined);

    const isTrustedIssuer = knownDIDRegistry?.source === 'trusted';

    return (
        <div className="bg-white rounded-[20px] shadow-lg border border-grayscale-100 px-5 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h4 className="font-poppins font-semibold text-grayscale-800 text-base">
                    Issuer Status
                </h4>
                {isTrustedIssuer ? (
                    <div className="flex items-center gap-1.5 text-green-600 font-poppins font-medium text-xs uppercase tracking-wide">
                        <span aria-hidden="true">
                            <TrustedCertIcon className="w-[22px] h-[22px]" />
                        </span>
                        Trusted Issuer
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-orange-500 font-poppins font-medium text-xs uppercase tracking-wide">
                        <span aria-hidden="true">
                            <UnknownCertIcon className="w-[22px] h-[22px]" />
                        </span>
                        Unknown Issuer
                    </div>
                )}
            </div>
            <p className="text-grayscale-600 text-sm">
                {isTrustedIssuer
                    ? 'Your account is recognized as a trusted issuer in the LearnCard network.'
                    : 'Apply to become a trusted issuer and unlock verified credential issuance for your account.'}
            </p>
            {!isTrustedIssuer && (
                <button
                    type="button"
                    onClick={() => {
                        closeAllModals();
                        setTimeout(() => {
                            newModal(
                                <BecomeTrustedIssuerForm />,
                                { hideButton: true },
                                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                            );
                        }, 300);
                    }}
                    className="w-full flex items-center justify-center bg-indigo-600 text-white font-poppins font-semibold text-base rounded-full py-[10px] shadow-md"
                >
                    Become a Trusted Issuer
                </button>
            )}
        </div>
    );
};

export default IssuerStatusCard;

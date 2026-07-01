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
        <div className="bg-white rounded-[20px] border border-grayscale-200 px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
                <span className="font-poppins font-semibold text-grayscale-800 text-sm">
                    Issuer Status
                </span>
                {isTrustedIssuer ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-poppins font-medium text-xs uppercase tracking-wide">
                        <TrustedCertIcon className="w-[18px] h-[18px]" />
                        Trusted Issuer
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 font-poppins font-medium text-xs uppercase tracking-wide">
                        <UnknownCertIcon className="w-[18px] h-[18px]" />
                        Unknown Issuer
                    </div>
                )}
            </div>
            {isTrustedIssuer ? (
                <p className="text-grayscale-600 text-xs leading-relaxed">
                    Your account is recognized as a trusted issuer in the LearnCard network.
                </p>
            ) : (
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
                    className="w-full flex items-center justify-center bg-grayscale-900 text-white font-poppins font-medium text-sm rounded-[20px] py-2.5 hover:opacity-90 transition-opacity"
                >
                    Become a Trusted Issuer
                </button>
            )}
        </div>
    );
};

export default IssuerStatusCard;

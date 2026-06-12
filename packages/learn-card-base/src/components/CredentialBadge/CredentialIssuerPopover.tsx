import React from 'react';

import { IonPopover } from '@ionic/react';

import { VERIFIER_STATES, VerifierState } from './credentialVerificationTypes';

type CredentialIssuerPopoverProps = {
    enabled: boolean;
    triggerId: string;
    verifierState: VerifierState;
};

const CredentialIssuerPopover: React.FC<CredentialIssuerPopoverProps> = ({
    enabled,
    triggerId,
    verifierState,
}) => {
    if (!enabled) return null;

    const isTrustedIssuer = verifierState === VERIFIER_STATES.trustedVerifier;

    const getIssuerPopoverDescription = (verifierState: VerifierState): React.ReactNode => {
        if (verifierState === VERIFIER_STATES.trustedVerifier) {
            return (
                <>
                    A <span className="font-semibold text-grayscale-800">Trusted Issuer</span> has
                    been reviewed by a trusted community so you can better understand who issued
                    this credential.
                </>
            );
        }
        if (verifierState === VERIFIER_STATES.selfVerified) {
            return (
                <>
                    <span className="font-semibold text-grayscale-800">Self Issued</span> means this
                    credential was created by the same account it belongs to.
                </>
            );
        }
        if (verifierState === VERIFIER_STATES.appIssuer) {
            return (
                <>
                    An <span className="font-semibold text-grayscale-800">App Issuer</span> is a
                    LearnCard app or service that issued this credential through LearnCard.
                </>
            );
        }
        if (verifierState === VERIFIER_STATES.untrustedVerifier) {
            return (
                <>
                    An <span className="font-semibold text-grayscale-800">Untrusted Issuer</span>{' '}
                    has been flagged by a registry LearnCard checks. Review the issuer before
                    relying on this credential.
                </>
            );
        }

        return (
            <>
                An <span className="font-semibold text-grayscale-800">Unknown Issuer</span> is not
                currently verified by LearnCard. This does not mean your credential is invalid; it
                just means we have not verified who issued it.
            </>
        );
    };

    const popoverDescription = getIssuerPopoverDescription(verifierState);

    return (
        <IonPopover
            trigger={triggerId}
            triggerAction="click"
            reference="trigger"
            side="bottom"
            alignment="center"
            className="[--background:transparent] [--box-shadow:none] [--width:auto] rounded-[100px]"
        >
            <div
                className="bg-white rounded-[10px] border border-grayscale-200 p-4 shadow-2xl font-poppins"
                style={{ width: 'min(320px, calc(100vw - 32px))' }}
            >
                <div className="space-y-2">
                    {/* {statusBadge} */}

                    <div className="space-y-2">
                        <p className="text-xs text-grayscale-600 leading-relaxed">
                            {popoverDescription}
                            {isTrustedIssuer && (
                                <>
                                    {' '}
                                    <a
                                        href="https://docs.learncard.com/core-concepts/identities-and-keys/trust-registries"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-emerald-600 underline underline-offset-2"
                                    >
                                        Learn More
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </IonPopover>
    );
};

export default CredentialIssuerPopover;

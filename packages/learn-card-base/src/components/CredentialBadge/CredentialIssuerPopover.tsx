import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import { IonPopover } from '@ionic/react';

import { VERIFIER_STATES, VerifierState } from './credentialVerificationTypes';

type CredentialIssuerPopoverProps = {
    enabled: boolean;
    triggerId?: string;
    verifierState: VerifierState;
    isOpen?: boolean;
    event?: Event;
    onDidDismiss?: () => void;
};

type CredentialIssuerPopoverState = {
    isOpen: boolean;
    event?: Event;
    verifierState: VerifierState;
};

const TRUST_REGISTRIES_DOCS_URL =
    'https://docs.learncard.com/core-concepts/identities-and-keys/trust-registries';

export const normalizeCredentialIssuerVerifierState = (
    verifierState: string | undefined
): VerifierState => {
    if (verifierState === VERIFIER_STATES.selfVerified) return VERIFIER_STATES.selfVerified;
    if (verifierState === VERIFIER_STATES.trustedVerifier) return VERIFIER_STATES.trustedVerifier;
    // Legacy react-learn-card ID cards previously emitted "Trusted App" for app-issued creds.
    if (verifierState === VERIFIER_STATES.appIssuer || verifierState === 'Trusted App') {
        return VERIFIER_STATES.appIssuer;
    }
    if (verifierState === VERIFIER_STATES.untrustedVerifier)
        return VERIFIER_STATES.untrustedVerifier;

    return VERIFIER_STATES.unknownVerifier;
};

export const useCredentialIssuerPopover = () => {
    const [popoverState, setPopoverState] = useState<CredentialIssuerPopoverState>({
        isOpen: false,
        verifierState: VERIFIER_STATES.unknownVerifier,
    });

    const openCredentialIssuerPopover = (
        event: React.MouseEvent<HTMLElement>,
        verifierState: string
    ): void => {
        event.stopPropagation();
        setPopoverState({
            isOpen: true,
            event: event.nativeEvent,
            verifierState: normalizeCredentialIssuerVerifierState(verifierState),
        });
    };

    const closeCredentialIssuerPopover = (): void => {
        setPopoverState(previousState => ({ ...previousState, isOpen: false }));
    };

    return {
        credentialIssuerPopoverProps: {
            enabled: true,
            isOpen: popoverState.isOpen,
            event: popoverState.event,
            verifierState: popoverState.verifierState,
            onDidDismiss: closeCredentialIssuerPopover,
        },
        openCredentialIssuerPopover,
        closeCredentialIssuerPopover,
    };
};

const CredentialIssuerPopover: React.FC<CredentialIssuerPopoverProps> = ({
    enabled,
    triggerId,
    verifierState,
    isOpen,
    event,
    onDidDismiss,
}) => {
    if (!enabled) return null;

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
                    <span className="font-semibold text-grayscale-800">Self Issued</span>{' '}
                    credentials are issued by the holder to themselves.
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
    const popoverTriggerProps = triggerId
        ? {
              trigger: triggerId,
              triggerAction: 'click' as const,
              reference: 'trigger' as const,
          }
        : {
              isOpen,
              event,
              onDidDismiss,
              reference: 'event' as const,
          };

    return (
        <IonPopover
            {...popoverTriggerProps}
            side="bottom"
            alignment="center"
            className="[--background:transparent] [--box-shadow:none] [--width:auto] rounded-[100px]"
        >
            <div
                className="bg-white rounded-[10px] border border-grayscale-200 p-4 shadow-2xl font-poppins"
                style={{ width: 'min(320px, calc(100vw - 32px))' }}
            >
                <p className="text-xs text-grayscale-600 leading-relaxed">
                    {popoverDescription}

                    <span>
                        {' '}
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                if (Capacitor?.isNativePlatform()) {
                                    Browser?.open({
                                        url: TRUST_REGISTRIES_DOCS_URL,
                                    });
                                } else {
                                    window?.open(
                                        TRUST_REGISTRIES_DOCS_URL,
                                        '_blank',
                                        'noopener,noreferrer'
                                    );
                                }
                            }}
                            className="font-semibold text-indigo-600 underline underline-offset-2"
                        >
                            Learn More
                        </button>
                    </span>
                </p>
            </div>
        </IonPopover>
    );
};

export default CredentialIssuerPopover;

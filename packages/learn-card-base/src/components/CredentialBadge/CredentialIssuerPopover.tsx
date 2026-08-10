import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { IonPopover } from '@ionic/react';
import type { IssuerContext } from '@learncard/types';
import { useT } from 'learn-card-base/i18n';

import BecomeTrustedIssuerForm from './BecomeTrustedIssuerForm';
import useModal from '../modals/useModal';
import { ModalTypes } from '../modals/types/Modals';

const TRUST_REGISTRIES_DOCS_URL =
    'https://docs.learncard.com/core-concepts/identities-and-keys/trust-registries';

type CredentialIssuerPopoverProps = {
    enabled: boolean;
    triggerId?: string;
    issuerContext?: IssuerContext;
    isOpen?: boolean;
    event?: Event;
    onDidDismiss?: () => void;
};

type CredentialIssuerPopoverState = {
    isOpen: boolean;
    event?: Event;
    issuerContext?: IssuerContext;
};

const stopPopoverInteraction = (event: React.SyntheticEvent): void => {
    event.stopPropagation();
};

export const useCredentialIssuerPopover = () => {
    const [popoverState, setPopoverState] = useState<CredentialIssuerPopoverState>({
        isOpen: false,
    });

    const openCredentialIssuerPopover = (
        event: React.MouseEvent<HTMLElement>,
        issuerContext: IssuerContext
    ): void => {
        event.stopPropagation();
        setPopoverState({
            isOpen: true,
            event: event.nativeEvent,
            issuerContext,
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
            issuerContext: popoverState.issuerContext,
            onDidDismiss: closeCredentialIssuerPopover,
        },
        openCredentialIssuerPopover,
        closeCredentialIssuerPopover,
    };
};
export const getIssuerPopoverDescription = (
    issuerContext: IssuerContext,
    t: (key: string, params?: Record<string, unknown>) => string
): string => {
    const issuerName =
        issuerContext.profile?.displayName ?? issuerContext.profile?.profileId ?? 'This issuer';

    switch (issuerContext.state) {
        case 'trusted':
            return t('verification.trustedIssuerDescription');
        case 'self':
            return t('verification.selfIssuedDescription');
        case 'app':
            return t('verification.appIssuerDescription');
        case 'denied':
            return t('verification.untrustedIssuerDescription');
        case 'connection':
            return t('verification.connectionDescription', { name: issuerName });
        case 'mutuals':
            return t('verification.mutualsDescription', {
                name: issuerName,
                count: issuerContext.mutualConnectionCount,
            });
        case 'identified':
            return t('verification.identifiedDescription', { name: issuerName });
        case 'unclaimed':
            return t('verification.unclaimedDescription', { name: issuerName });
        case 'unresolvable':
            return issuerContext.trustProfile === 'social'
                ? t('verification.unresolvableSocialDescription')
                : t('verification.unresolvableCredentialDescription');
    }
};

const CredentialIssuerPopover: React.FC<CredentialIssuerPopoverProps> = ({
    enabled,
    triggerId,
    issuerContext,
    isOpen,
    event,
    onDidDismiss,
}) => {
    const t = useT();
    const { newModal } = useModal();

    if (!enabled || !issuerContext) return null;

    const openBecomeTrustedIssuerForm = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        stopPopoverInteraction(e);
        const popover = e.currentTarget.closest('ion-popover') as
            | (HTMLElement & { dismiss?: () => Promise<void> })
            | null;
        const open = (): void => {
            newModal(
                <BecomeTrustedIssuerForm issuerDid={issuerContext.issuerDid} />,
                { hideButton: true },
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        };

        if (popover?.dismiss) {
            popover.dismiss().then(() => {
                onDidDismiss?.();
                open();
            });
        } else {
            onDidDismiss?.();
            open();
        }
    };

    const openTrustRegistriesDocs = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        stopPopoverInteraction(e);
        if (Capacitor.isNativePlatform()) {
            Browser.open({ url: TRUST_REGISTRIES_DOCS_URL });
        } else {
            window.open(TRUST_REGISTRIES_DOCS_URL, '_blank', 'noopener,noreferrer');
        }
    };
    const showRegistryActions =
        issuerContext.state === 'trusted' ||
        issuerContext.state === 'denied' ||
        (issuerContext.state === 'unresolvable' && issuerContext.trustProfile === 'credential');
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
            onClick={stopPopoverInteraction}
            onPointerDown={stopPopoverInteraction}
            onTouchStart={stopPopoverInteraction}
        >
            <div
                className="bg-white rounded-[10px] border border-grayscale-200 p-4 shadow-2xl font-poppins pointer-events-auto"
                style={{ width: 'min(320px, calc(100vw - 32px))' }}
                onClick={stopPopoverInteraction}
                onPointerDown={stopPopoverInteraction}
                onTouchStart={stopPopoverInteraction}
            >
                <p className="text-xs text-grayscale-600 leading-relaxed">
                    {getIssuerPopoverDescription(issuerContext, t)}
                </p>

                {showRegistryActions && (
                    <div className="mt-2 flex flex-row items-center gap-2">
                        <button
                            onClick={openTrustRegistriesDocs}
                            className="font-semibold text-grayscale-700 hover:text-grayscale-900 underline underline-offset-2 text-xs transition-colors"
                        >
                            Learn More
                        </button>
                        <button
                            onClick={openBecomeTrustedIssuerForm}
                            className="font-semibold text-grayscale-700 hover:text-grayscale-900 underline underline-offset-2 text-xs transition-colors"
                        >
                            Become a Trusted Issuer
                        </button>
                    </div>
                )}
            </div>
        </IonPopover>
    );
};

export default CredentialIssuerPopover;

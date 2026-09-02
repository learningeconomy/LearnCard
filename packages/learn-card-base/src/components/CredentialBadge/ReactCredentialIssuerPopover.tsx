import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

import BecomeTrustedIssuerForm from './BecomeTrustedIssuerForm';

import useModal from '../modals/useModal';

import { ModalTypes } from '../modals/types/Modals';
import { VERIFIER_STATES, VerifierState } from './credentialVerificationTypes';
import { normalizeCredentialIssuerVerifierState } from './CredentialIssuerPopover';

const TRUST_REGISTRIES_DOCS_URL =
    'https://docs.learncard.com/core-concepts/identities-and-keys/trust-registries';

const POPOVER_WIDTH = 320;
const VIEWPORT_MARGIN = 16;
const ANCHOR_GAP = 8;

type ReactCredentialIssuerPopoverAnchor = {
    x: number;
    y: number;
};

type ReactCredentialIssuerPopoverProps = {
    isOpen: boolean;
    verifierState: VerifierState;
    anchor?: ReactCredentialIssuerPopoverAnchor;
    issuerDid?: string;
    onDidDismiss?: () => void;
};

type ReactCredentialIssuerPopoverState = {
    isOpen: boolean;
    anchor?: ReactCredentialIssuerPopoverAnchor;
    verifierState: VerifierState;
};

const getIssuerPopoverDescription = (verifierState: VerifierState): React.ReactNode => {
    if (verifierState === VERIFIER_STATES.trustedVerifier) {
        return (
            <>
                A <span className="font-semibold text-grayscale-800">Trusted Issuer</span> has been
                reviewed by a trusted community so you can better understand who issued this
                credential.
            </>
        );
    }
    if (verifierState === VERIFIER_STATES.selfVerified) {
        return (
            <>
                <span className="font-semibold text-grayscale-800">Self Issued</span> credentials
                are issued by the holder to themselves.
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
                An <span className="font-semibold text-grayscale-800">Untrusted Issuer</span> has
                been flagged by a registry LearnCard checks. Review the issuer before relying on
                this credential.
            </>
        );
    }

    return (
        <>
            An <span className="font-semibold text-grayscale-800">Unknown Issuer</span> is not
            currently verified by LearnCard. This does not mean your credential is invalid; it just
            means we have not verified who issued it.
        </>
    );
};

/**
 * React-native (non-Ionic) hook mirroring `useCredentialIssuerPopover`, but
 * capturing click coordinates so the popover can be positioned without relying
 * on Ionic's portal/gesture system. Built specifically for the BoostPreview,
 * where the Ionic popover's buttons were not clickable.
 */
export const useReactCredentialIssuerPopover = () => {
    const [popoverState, setPopoverState] = useState<ReactCredentialIssuerPopoverState>({
        isOpen: false,
        verifierState: VERIFIER_STATES.unknownVerifier,
    });

    const openCredentialIssuerPopover = (
        event: React.MouseEvent<HTMLElement>,
        verifierState: string
    ): void => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setPopoverState({
            isOpen: true,
            anchor: { x: rect.left + rect.width / 2, y: rect.bottom },
            verifierState: normalizeCredentialIssuerVerifierState(verifierState),
        });
    };

    const closeCredentialIssuerPopover = (): void => {
        setPopoverState(previousState => ({ ...previousState, isOpen: false }));
    };

    return {
        credentialIssuerPopoverProps: {
            isOpen: popoverState.isOpen,
            anchor: popoverState.anchor,
            verifierState: popoverState.verifierState,
            onDidDismiss: closeCredentialIssuerPopover,
        },
        openCredentialIssuerPopover,
        closeCredentialIssuerPopover,
    };
};

const ReactCredentialIssuerPopover: React.FC<ReactCredentialIssuerPopoverProps> = ({
    isOpen,
    verifierState,
    anchor,
    issuerDid,
    onDidDismiss,
}) => {
    const { newModal } = useModal();
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    // Position the popover relative to the anchor once it (and its measured
    // size) are available, clamping it within the viewport.
    useLayoutEffect(() => {
        if (!isOpen || !anchor) return;

        const width = popoverRef.current?.offsetWidth ?? POPOVER_WIDTH;
        const height = popoverRef.current?.offsetHeight ?? 0;

        let left = anchor.x - width / 2;
        left = Math.max(
            VIEWPORT_MARGIN,
            Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN)
        );

        let top = anchor.y + ANCHOR_GAP;
        if (height && top + height > window.innerHeight - VIEWPORT_MARGIN) {
            top = Math.max(VIEWPORT_MARGIN, anchor.y - ANCHOR_GAP - height);
        }

        setPosition({ top, left });
    }, [isOpen, anchor?.x, anchor?.y]);

    // Dismiss on outside click / escape.
    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent): void => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onDidDismiss?.();
            }
        };
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') onDidDismiss?.();
        };

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onDidDismiss]);

    if (!isOpen || !anchor) return null;

    const openBecomeTrustedIssuerForm = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        onDidDismiss?.();
        newModal(
            <BecomeTrustedIssuerForm issuerDid={issuerDid} />,
            { hideButton: true },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const openTrustRegistriesDocs = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        if (Capacitor?.isNativePlatform()) {
            Browser?.open({ url: TRUST_REGISTRIES_DOCS_URL });
        } else {
            window?.open(TRUST_REGISTRIES_DOCS_URL, '_blank', 'noopener,noreferrer');
        }
    };

    return createPortal(
        <div
            ref={popoverRef}
            role="dialog"
            className="fixed z-[100000] bg-white rounded-[10px] border border-grayscale-200 p-4 shadow-2xl font-poppins"
            style={{
                top: position.top,
                left: position.left,
                width: `min(${POPOVER_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
            }}
            onClick={e => e.stopPropagation()}
        >
            <p className="text-xs text-grayscale-600 leading-relaxed">
                {getIssuerPopoverDescription(verifierState)}
            </p>

            <div className="mt-2 flex flex-row items-center gap-2">
                <button
                    onClick={openTrustRegistriesDocs}
                    className="font-semibold text-indigo-600 underline underline-offset-2 text-xs"
                >
                    Learn More
                </button>
                <button
                    onClick={openBecomeTrustedIssuerForm}
                    className="font-semibold text-indigo-600 underline underline-offset-2 text-xs"
                >
                    Become a Trusted Issuer
                </button>
            </div>
        </div>,
        document.body
    );
};

export default ReactCredentialIssuerPopover;

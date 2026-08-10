import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import type { IssuerContext } from '@learncard/types';
import { useT } from 'learn-card-base/i18n';

import BecomeTrustedIssuerForm from './BecomeTrustedIssuerForm';
import { getIssuerPopoverDescription } from './CredentialIssuerPopover';
import useModal from '../modals/useModal';
import { ModalTypes } from '../modals/types/Modals';

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
    issuerContext?: IssuerContext;
    anchor?: ReactCredentialIssuerPopoverAnchor;
    onDidDismiss?: () => void;
};

type ReactCredentialIssuerPopoverState = {
    isOpen: boolean;
    anchor?: ReactCredentialIssuerPopoverAnchor;
    issuerContext?: IssuerContext;
};

export const useReactCredentialIssuerPopover = () => {
    const [popoverState, setPopoverState] = useState<ReactCredentialIssuerPopoverState>({
        isOpen: false,
    });

    const openCredentialIssuerPopover = (
        event: React.MouseEvent<HTMLElement>,
        issuerContext: IssuerContext
    ): void => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setPopoverState({
            isOpen: true,
            anchor: { x: rect.left + rect.width / 2, y: rect.bottom },
            issuerContext,
        });
    };

    const closeCredentialIssuerPopover = (): void => {
        setPopoverState(previousState => ({ ...previousState, isOpen: false }));
    };

    return {
        credentialIssuerPopoverProps: {
            isOpen: popoverState.isOpen,
            anchor: popoverState.anchor,
            issuerContext: popoverState.issuerContext,
            onDidDismiss: closeCredentialIssuerPopover,
        },
        openCredentialIssuerPopover,
        closeCredentialIssuerPopover,
    };
};

const ReactCredentialIssuerPopover: React.FC<ReactCredentialIssuerPopoverProps> = ({
    isOpen,
    issuerContext,
    anchor,
    onDidDismiss,
}) => {
    const t = useT();
    const { newModal } = useModal();
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

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

    if (!isOpen || !anchor || !issuerContext) return null;

    const openBecomeTrustedIssuerForm = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        onDidDismiss?.();
        newModal(
            <BecomeTrustedIssuerForm issuerDid={issuerContext.issuerDid} />,
            { hideButton: true },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };
    const openTrustRegistriesDocs = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
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
            onClick={event => event.stopPropagation()}
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
        </div>,
        document.body
    );
};

export default ReactCredentialIssuerPopover;

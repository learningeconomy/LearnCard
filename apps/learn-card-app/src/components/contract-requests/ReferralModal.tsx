import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { ModalTypes, useModal } from 'learn-card-base';
import type { ModalInstanceToken } from 'learn-card-base/components/modals/types/Modals';
import { useContractRequestsEnabled } from '../../hooks/useContractRequestsEnabled';
import FullScreenConsentFlow from '../../pages/consentFlow/FullScreenConsentFlow';

/** Async actions must consult the latest gate, including after their surface unmounts. */
export const useReferralGate = () => {
    const enabled = useContractRequestsEnabled();
    const live = useRef(enabled);
    useLayoutEffect(() => {
        live.current = enabled;
        return () => {
            live.current = false;
        };
    }, [enabled]);
    const requireEnabled = useCallback(() => {
        if (!live.current) throw new Error('Referrals are disabled');
    }, []);
    return { enabled, requireEnabled };
};

/** The subscription lives in the saved modal, independently of its launching card. */
const ReferralModal: React.FC<{ children: React.ReactNode; onDisabled: () => void }> = ({
    children,
    onDisabled,
}) => {
    const enabled = useContractRequestsEnabled();
    useEffect(() => {
        if (!enabled) onDisabled();
    }, [enabled, onDisabled]);
    return enabled ? <>{children}</> : null;
};

/** Close only this referral instance; other consent screens may be in the same stack. */
export const useReferralModal = () => {
    const { newModalWithToken, forceCloseModalByToken } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.FullScreen,
    });
    return (content: React.ReactNode, fullScreen = false) => {
        const token: ModalInstanceToken = newModalWithToken(
            <ReferralModal
                onDisabled={() => {
                    forceCloseModalByToken(token);
                }}
            >
                {content}
            </ReferralModal>,
            {},
            fullScreen
                ? { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                : undefined
        );
        return token;
    };
};

/** Guard the final submission after guardian, audience and credential preparation. */
export const ReferralConsentReview: React.FC<
    React.ComponentProps<typeof FullScreenConsentFlow>
> = props => {
    const { enabled, requireEnabled } = useReferralGate();
    if (!enabled) return null;
    return (
        <FullScreenConsentFlow
            {...props}
            beforeSubmit={async () => {
                requireEnabled();
                await props.beforeSubmit?.();
                requireEnabled();
            }}
        />
    );
};

import React, { useEffect, useId, useRef } from 'react';
import { useModal, ModalTypes, type ModalInstanceToken } from 'learn-card-base';
import {
    captureHistoryAccount,
    getHistoryAccountRevision,
    useHistoryAccountRevision,
} from '../../../helpers/verifier-history/account';
import { useVerifierHistoryEligibility } from '../../../helpers/verifier-history/useEligibility';
import { enterSharePrivacy } from '../../../components/share-links/sharePrivacy';
import { historyButton } from './VerifierHistoryList';
import * as m from '../../../paraglide/messages.js';

const ClearConfirmation: React.FC<{
    recovery: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ recovery, onCancel, onConfirm }) => {
    const titleId = useId();
    return (
        <div
            data-testid="verifier-history-clear-confirmation"
            aria-labelledby={titleId}
            className="sentry-block ph-no-capture bg-white p-6 space-y-5 font-poppins animate-fade-in-up"
            data-html2canvas-ignore
            data-feedback-exclude
        >
            <h2 id={titleId} className="text-xl font-semibold text-grayscale-900">
                {m['verifierHistory.clearTitle']()}
            </h2>
            <p className="text-sm text-grayscale-600 leading-relaxed">
                {m['verifierHistory.clearBody']()}
            </p>
            <p className="text-sm text-grayscale-600 leading-relaxed">
                {m['verifierHistory.clearConsent']()}
            </p>
            {recovery && (
                <p className="text-sm text-amber-700 leading-relaxed">
                    {m['verifierHistory.clearRecovery']()}
                </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className={historyButton} onClick={onCancel}>
                    {m['common.cancel']()}
                </button>
                <button
                    type="button"
                    className="min-h-[44px] py-3 px-4 rounded-[20px] bg-red-700 text-white font-medium text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    onClick={onConfirm}
                >
                    {m['verifierHistory.clear']()}
                </button>
            </div>
        </div>
    );
};

/** Confirm locally before any destructive I/O; discard approvals after an account change. */
export const useConfirmClearVerifierHistory = (allowed: boolean) => {
    const { newModalWithToken, forceCloseModalByToken } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });
    const revision = useHistoryAccountRevision();
    const eligible = useVerifierHistoryEligibility();
    const modal = useRef<{
        token: ModalInstanceToken;
        revision: number;
        cancel: () => void;
    } | null>(null);
    useEffect(() => {
        if (modal.current && (!allowed || modal.current.revision !== revision)) {
            modal.current.cancel();
        }
    }, [allowed, revision, forceCloseModalByToken]);
    useEffect(
        () => () => {
            modal.current?.cancel();
        },
        [forceCloseModalByToken]
    );
    return (onConfirm: () => void, recovery: boolean) => {
        if (!allowed || !eligible() || modal.current) return;
        enterSharePrivacy();
        const isSelectedAccount = captureHistoryAccount();
        const capturedRevision = getHistoryAccountRevision();
        const instance: { token?: ModalInstanceToken } = {};
        let settled = false;
        const close = () => {
            if (instance.token) forceCloseModalByToken(instance.token);
            if (modal.current?.token === instance.token) modal.current = null;
        };
        instance.token = newModalWithToken(
            <ClearConfirmation
                recovery={recovery}
                onCancel={() => {
                    settled = true;
                    close();
                }}
                onConfirm={() => {
                    if (settled) return;
                    settled = true;
                    close();
                    if (
                        isSelectedAccount() &&
                        getHistoryAccountRevision() === capturedRevision &&
                        eligible()
                    )
                        onConfirm();
                }}
            />,
            {
                sectionClassName: '!max-w-[480px]',
                onClose: () => {
                    settled = true;
                    if (modal.current?.token === instance.token) modal.current = null;
                },
            }
        );
        modal.current = {
            token: instance.token,
            revision: capturedRevision,
            cancel: () => {
                settled = true;
                close();
            },
        };
    };
};

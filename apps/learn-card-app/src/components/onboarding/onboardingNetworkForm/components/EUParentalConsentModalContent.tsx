import React, { useEffect, useRef, useState } from 'react';
import * as m from '../../../../paraglide/messages.js';
import { TransP } from '../../../../i18n/TransP';
import { useLocale } from '../../../../i18n';
import WarningCircle from '../../../svgs/WarningCircle';
import { getLogger } from 'learn-card-base';
import GuardianEmailStatusMessage from '../../../pending-approval-banner/GuardianEmailStatusMessage';
import {
    getGuardianSendErrorKind,
    useGuardianApprovalStatus,
    useSendGuardianApprovalEmail,
} from '../../../../hooks/useGuardianApprovalStatus';
import { isValidGuardianEmail } from '../helpers/validators';
const log = getLogger('e-u-parental-consent-modal-content');

const normalizeEmail = (value?: string): string => (value ?? '').trim().toLowerCase();

export type EUParentalConsentModalContentProps = {
    name?: string | null;
    dob?: string | null | undefined;
    country?: string | undefined;
    onClose: () => void;
    onComplete?: () => void;
    /**
     * Optional override for how the guardian email is submitted. When provided, the modal
     * calls this instead of sending the approval email directly. The onboarding age-gate flow
     * uses it to *defer* the send, since the user's network profile (which the approval is
     * keyed to) doesn't exist yet — the email is sent later, after createProfile.
     */
    onSubmit?: (guardianEmail: string) => void | Promise<void>;
};

const EUParentalConsentModalContent: React.FC<EUParentalConsentModalContentProps> = ({
    onClose,
    onComplete,
    onSubmit,
}) => {
    const locale = useLocale();
    const { data: status, refetch: refetchStatus } = useGuardianApprovalStatus(!onSubmit);
    const { mutateAsync: sendApprovalEmail } = useSendGuardianApprovalEmail();

    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [sent, setSent] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [now, setNow] = useState<number>(() => Date.now());

    const approvedWhileOpen = !onSubmit && status?.pendingApproval === false;
    const closedForApprovalRef = useRef(false);
    useEffect(() => {
        if (!approvedWhileOpen || closedForApprovalRef.current) return;
        closedForApprovalRef.current = true;
        onClose();
    }, [approvedWhileOpen, onClose]);

    const resendAvailableAt = status?.resendAvailableAt ? Date.parse(status.resendAvailableAt) : 0;
    const isCoolingDown =
        resendAvailableAt > now &&
        (status?.attemptsRemaining === 0 ||
            normalizeEmail(email) === normalizeEmail(status?.guardianEmail));

    // Re-enable the send button as soon as the server-side cooldown ends.
    useEffect(() => {
        const remaining = resendAvailableAt - Date.now();
        if (remaining <= 0) return;
        const timeout = window.setTimeout(() => setNow(Date.now()), remaining + 250);
        return () => window.clearTimeout(timeout);
    }, [resendAvailableAt]);

    const formatTime = (iso: string): string =>
        new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
            new Date(iso)
        );

    const hasPreviousRequest = status?.status === 'accepted' || status?.status === 'failed';

    const handleSend = async () => {
        if (!isValidGuardianEmail(email)) {
            setError(m['onboarding.consent.eu.error.invalidEmail']());
            return;
        }

        setError('');
        setLoading(true);
        try {
            if (onSubmit) {
                await onSubmit(email.trim());
            } else {
                await sendApprovalEmail(email.trim());
            }

            setSent(true);
        } catch (e) {
            log.error('Failed to send guardian approval email:', e);
            const kind = getGuardianSendErrorKind(e);

            if (kind === 'cooldown') {
                const fresh = (await refetchStatus()).data;
                setNow(Date.now());
                setError(
                    fresh?.resendAvailableAt
                        ? m['onboarding.consent.eu.error.cooldown']({
                              time: formatTime(fresh.resendAvailableAt),
                          })
                        : m['onboarding.consent.eu.error.sendFailed']()
                );
            } else if (kind === 'inProgress') {
                setError(m['onboarding.consent.eu.error.inProgress']());
            } else {
                setError(m['onboarding.consent.eu.error.sendFailed']());
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-[10px] items-center w-full h-full justify-center px-[20px]">
            <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center max-w-[600px]">
                <div className="mx-auto mb-4 h-[60px] w-[60px] flex items-center justify-center">
                    <div className="flex items-center justify-center h-[60px] w-[60px]">
                        <WarningCircle className="h-full w-full" />
                    </div>
                </div>
                {!sent ? (
                    <>
                        <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                            {m['onboarding.consent.eu.heading']()}
                        </h2>
                        <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                            {m['onboarding.consent.eu.description']()}
                        </p>
                        {status && status.status !== 'not_requested' && (
                            <p
                                role="status"
                                className="mt-3 text-sm text-grayscale-600 leading-relaxed px-[10px]"
                            >
                                <GuardianEmailStatusMessage status={status} />
                            </p>
                        )}
                        <div className="mt-3">
                            <label htmlFor="eu-guardian-email" className="sr-only">
                                {m['onboarding.consent.eu.placeholder']()}
                            </label>
                            <input
                                id="eu-guardian-email"
                                type="email"
                                placeholder={m['onboarding.consent.eu.placeholder']()}
                                value={email}
                                onChange={event => {
                                    setError('');
                                    setEmail(event.target.value);
                                }}
                                onKeyDown={event => {
                                    if (event.key === 'Enter' && !loading && !isCoolingDown) {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                autoComplete="email"
                                aria-invalid={Boolean(error)}
                                aria-describedby={
                                    error
                                        ? 'eu-guardian-email-error'
                                        : isCoolingDown
                                          ? 'eu-guardian-email-cooldown'
                                          : undefined
                                }
                                className={`w-full bg-grayscale-100 text-grayscale-900 placeholder:text-grayscale-400 rounded-[12px] ion-padding font-medium tracking-wider text-base focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent ${
                                    error ? 'login-input-email-error' : ''
                                }`}
                            />
                            {error && (
                                <p
                                    id="eu-guardian-email-error"
                                    role="alert"
                                    className="p-0 m-0 w-full text-left mt-1 text-red-700 text-xs"
                                >
                                    {error}
                                </p>
                            )}
                            {!error && isCoolingDown && status?.resendAvailableAt && (
                                <p
                                    id="eu-guardian-email-cooldown"
                                    role="status"
                                    className="p-0 m-0 w-full text-left mt-1 text-grayscale-600 text-xs"
                                >
                                    {m['onboarding.consent.eu.error.cooldown']({
                                        time: formatTime(status.resendAvailableAt),
                                    })}
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                            {m['onboarding.consent.eu.sent.heading']()}
                        </h2>
                        <p
                            role="status"
                            className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]"
                        >
                            <TransP
                                m={m['onboarding.consent.eu.status.accepted']}
                                values={{ email: email.trim() }}
                                components={[<span className="font-semibold" key="e" />]}
                            />
                        </p>
                    </>
                )}
            </div>
            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border  backdrop-blur-[10px] py-4 absolute bottom-0 bg-white/60 max-h-[100px]! safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className=" shadow-button-bottom flex-1 py-[10px] text-[17px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                    >
                        {m['onboarding.back']()}
                    </button>
                    {!sent ? (
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={loading || isCoolingDown}
                            aria-busy={loading}
                            className=" shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? m['onboarding.consent.eu.sending']()
                                : hasPreviousRequest
                                  ? m['onboarding.consent.eu.resendRequest']()
                                  : m['onboarding.consent.eu.sendRequest']()}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                // onComplete (age-gate flow) closes the modal itself and then
                                // advances onboarding. Only fall back to onClose when there's no
                                // onComplete (re-prompt callers) — calling both closes one modal
                                // too many and tears down the underlying onboarding modal.
                                if (onComplete) onComplete();
                                else onClose();
                            }}
                            className=" shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                        >
                            {m['common.done']()}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EUParentalConsentModalContent;

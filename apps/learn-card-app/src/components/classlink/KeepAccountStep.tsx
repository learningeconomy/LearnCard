import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    checkmarkCircleOutline,
    informationCircleOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { isWebAuthnSupported } from '@learncard/sss-key-manager';
import type {
    ClassLinkAccountContinuity,
    ClassLinkAccountContinuityReason,
} from '@learncard/lca-api-plugin';
import { useQueryClient } from '@tanstack/react-query';
import { useClassLinkAccountContinuity, useRemovePersonalEmail } from 'learn-card-base';

import {
    useAnalytics,
    AnalyticsEvents,
    type KeepAccountSource,
    type KeepAccountAnalyticsStep,
} from '@analytics';
import * as m from '../../paraglide/messages.js';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { PersonalEmailForm } from './PersonalEmailForm';

export type KeepAccountStepProps = {
    /** `inline` sits in a page section, `sheet` in a modal, `onboarding` fills the step. */
    variant: 'inline' | 'sheet' | 'onboarding';
    /** Where the step is shown, for analytics only. */
    source: KeepAccountSource;
    /** The user finished (the server reports nothing left to do) and pressed Continue. */
    onComplete?: () => void;
    /** The user chose "Not now". The parent decides what happens next. */
    onDismiss?: () => void;
    /**
     * Called right before the passkey / recovery phrase overlay opens. That overlay sits
     * below the app's modal stack, so a host sheet must close itself here.
     */
    onBeforeMethod?: () => void;
    /**
     * Call `onComplete` once the email is verified instead of offering the method step, for
     * hosts that cannot close first (onboarding). The dashboard banner offers it later.
     */
    emailOnly?: boolean;
};

const primaryButton =
    'w-full min-h-[48px] py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed';
const quietButton =
    'w-full min-h-[48px] py-3 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:bg-grayscale-10 hover:text-grayscale-900 transition-colors disabled:opacity-40';

const REASON_MESSAGES: Record<ClassLinkAccountContinuityReason, () => string> = {
    disabled: () => m['classlinkKeepAccount.reason.disabled'](),
    district_off: () => m['classlinkKeepAccount.reason.districtOff'](),
    students_excluded: () => m['classlinkKeepAccount.reason.studentsExcluded'](),
    status_unknown: () => m['classlinkKeepAccount.reason.statusUnknown'](),
    below_minimum_age: () => m['classlinkKeepAccount.reason.belowMinimumAge'](),
    age_unknown: () => m['classlinkKeepAccount.reason.ageUnknown'](),
    approval_required: () => m['classlinkKeepAccount.reason.approvalRequired'](),
};

/** Copy for a server refusal reason; generic when the server sent none. */
export const keepAccountReasonMessage = (reason?: ClassLinkAccountContinuityReason): string =>
    reason ? REASON_MESSAGES[reason]() : m['classlinkKeepAccount.notAllowed']();

/** Passkey where this device can make one; otherwise the recovery phrase. */
const getRecommendedMethod = (): 'passkey' | 'phrase' =>
    !Capacitor.isNativePlatform() && isWebAuthnSupported() ? 'passkey' : 'phrase';

/** Which screen the server state puts the user on. */
const getView = (
    data: ClassLinkAccountContinuity
): 'email' | 'method' | 'done' | 'blocked' | 'hidden' => {
    if (data.nextStep !== 'email') return data.nextStep;
    if (data.personalEmail.allowed) return 'email';
    // The master switch is off: there is nothing to explain.
    return data.personalEmail.reason === 'disabled' ? 'hidden' : 'blocked';
};

const StoredNote: React.FC = () => (
    <p className="flex items-start gap-2 text-xs text-grayscale-500 leading-relaxed text-start">
        <IonIcon
            icon={informationCircleOutline}
            className="text-base shrink-0 mt-px"
            aria-hidden="true"
        />
        {m['classlinkKeepAccount.storedNote']()}
    </p>
);

const RemoveEmail: React.FC<{ onRemoved: () => void }> = ({ onRemoved }) => {
    const remove = useRemovePersonalEmail();
    const [confirming, setConfirming] = useState(false);
    const [failed, setFailed] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const wasConfirmingRef = useRef(false);

    // Each control replaces the other, so carry keyboard focus across the swap.
    useEffect(() => {
        if (confirming) confirmRef.current?.focus();
        else if (wasConfirmingRef.current) triggerRef.current?.focus();
        wasConfirmingRef.current = confirming;
    }, [confirming]);

    const confirm = async (): Promise<void> => {
        setFailed(false);
        try {
            await remove.mutateAsync();
            onRemoved();
        } catch {
            setFailed(true);
        }
    };

    if (!confirming) {
        return (
            <button
                ref={triggerRef}
                type="button"
                data-testid="keep-account-remove"
                onClick={() => setConfirming(true)}
                className="text-xs font-medium text-grayscale-600 underline hover:text-grayscale-900"
            >
                {m['classlinkKeepAccount.remove']()}
            </button>
        );
    }

    return (
        <div className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-3 text-start space-y-2">
            <p className="text-xs text-grayscale-700 leading-relaxed">
                {m['classlinkKeepAccount.removeConfirm']()}
            </p>
            {failed && (
                <p role="alert" className="text-xs text-red-700">
                    {m['classlinkPersonalEmail.error']()}
                </p>
            )}
            <div className="flex gap-3">
                <button
                    ref={confirmRef}
                    type="button"
                    data-testid="keep-account-remove-confirm"
                    disabled={remove.isPending}
                    onClick={() => void confirm()}
                    className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-40"
                >
                    {remove.isPending
                        ? m['classlinkKeepAccount.removing']()
                        : m['classlinkKeepAccount.removeAction']()}
                </button>
                <button
                    type="button"
                    disabled={remove.isPending}
                    onClick={() => setConfirming(false)}
                    className="text-xs font-medium text-grayscale-600 hover:underline disabled:opacity-40"
                >
                    {m['common.cancel']()}
                </button>
            </div>
        </div>
    );
};

/**
 * "Keep your account after school" for ClassLink users: add a personal email (one code
 * proves it and makes it the recovery email), then add a passkey or recovery phrase, then
 * done. Every screen follows the server's `getAccountContinuity` answer, so the step
 * resumes where the account is and never offers what the district does not allow.
 * The personal email is a recovery path ("I lost access to my school email or login"),
 * not a sign-in method, until the Keycloak cutover.
 */
export const KeepAccountStep: React.FC<KeepAccountStepProps> = ({
    variant,
    source,
    onComplete,
    onDismiss,
    onBeforeMethod,
    emailOnly = false,
}) => {
    const { track } = useAnalytics();
    const { openRecoverySetup } = useAppAuth();
    const queryClient = useQueryClient();
    const continuity = useClassLinkAccountContinuity({ enabled: true });
    const [notice, setNotice] = useState('');
    const [formKey, setFormKey] = useState(0);
    const [methodOpen, setMethodOpen] = useState(false);
    const shownRef = useRef(false);
    const handedOffRef = useRef(false);
    const leftRef = useRef(false);
    const data = continuity.data;
    const view = data ? getView(data) : undefined;
    // Email-only hosts are done once nothing is left for the email step.
    const handOff = emailOnly && (view === 'method' || view === 'done');
    const analyticsStep: KeepAccountAnalyticsStep | undefined =
        view === 'hidden' || handOff ? undefined : view;

    useEffect(() => {
        if (!analyticsStep || shownRef.current) return;
        shownRef.current = true;
        track(AnalyticsEvents.KEEP_ACCOUNT_SHOWN, { source, step: analyticsStep });
    }, [analyticsStep, source, track]);

    useEffect(() => {
        if (!handOff || handedOffRef.current) return;
        handedOffRef.current = true;
        onComplete?.();
    }, [handOff, onComplete]);

    // A sheet or onboarding step must not sit empty (no ClassLink identity, a failed check,
    // or the master switch turned off mid-flow): leave. The inline section just hides.
    const nothingToShow = !continuity.isLoading && (!data || view === 'hidden');
    useEffect(() => {
        if (variant === 'inline' || !nothingToShow || leftRef.current) return;
        leftRef.current = true;
        onDismiss?.();
    }, [variant, nothingToShow, onDismiss]);

    if (continuity.isLoading) {
        return variant === 'inline' ? null : (
            <div
                className="flex justify-center py-10"
                role="status"
                aria-label={m['common.loading']()}
            >
                <span
                    aria-hidden="true"
                    className="w-6 h-6 border-2 border-grayscale-200 border-t-grayscale-600 rounded-full animate-spin"
                />
            </div>
        );
    }
    // No ClassLink identity, or the check failed: there is nothing to offer.
    if (!data || !view || view === 'hidden' || handOff) return null;

    // Inside School Connect's "Your account" section (an h2), the step's title is an h3.
    const Heading = variant === 'inline' ? 'h3' : 'h2';

    // Invalidate rather than refetch: the method overlay can outlive a host sheet.
    const refresh = (): void => {
        void queryClient.invalidateQueries({ queryKey: ['classlinkAccountContinuity'] });
    };

    const dismiss = (): void => {
        track(AnalyticsEvents.KEEP_ACCOUNT_DISMISSED, { source, step: view });
        onDismiss?.();
    };

    const notNow = onDismiss && (
        <button
            type="button"
            data-testid="keep-account-not-now"
            className={quietButton}
            onClick={dismiss}
        >
            {m['classlinkKeepAccount.notNow']()}
        </button>
    );

    const startMethod = (): void => {
        if (methodOpen) return;
        const initialMethod = getRecommendedMethod();
        setMethodOpen(true);
        onBeforeMethod?.();
        openRecoverySetup({
            initialMethod,
            onCompleted: () => {
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'method' });
                refresh();
            },
            onClosed: () => setMethodOpen(false),
        });
    };

    let content: React.ReactNode;
    if (view === 'email') {
        content = (
            <>
                <Heading className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['classlinkKeepAccount.title']()}
                </Heading>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
                    {m['classlinkKeepAccount.body']()}
                </p>
                {notice && (
                    <p
                        role="status"
                        className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-800 leading-relaxed text-start"
                    >
                        {notice}
                    </p>
                )}
                <div className="text-start">
                    <PersonalEmailForm
                        key={formKey}
                        onCodeSent={() =>
                            track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, {
                                source,
                                step: 'email',
                            })
                        }
                        onVerified={result => {
                            track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, {
                                source,
                                step: 'code',
                            });
                            // Linked, but another account already recovers with this address.
                            if (result.recoveryEmailSkipped === 'shared') {
                                setNotice(m['classlinkKeepAccount.sharedEmail']());
                                setFormKey(key => key + 1);
                            } else {
                                setNotice('');
                            }
                        }}
                        onForbidden={refresh}
                    />
                </div>
                <div className="mt-4">
                    <StoredNote />
                </div>
                {notNow && <div className="mt-3">{notNow}</div>}
            </>
        );
    } else if (view === 'method') {
        const method = getRecommendedMethod();
        content = (
            <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <IonIcon
                        icon={shieldCheckmarkOutline}
                        className="text-2xl"
                        aria-hidden="true"
                    />
                </div>
                <Heading className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['classlinkKeepAccount.methodTitle']()}
                </Heading>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
                    {m['classlinkKeepAccount.methodBody']()}
                </p>
                <div className="space-y-2">
                    <button
                        type="button"
                        data-testid="keep-account-method"
                        className={primaryButton}
                        disabled={methodOpen}
                        onClick={startMethod}
                    >
                        {method === 'passkey'
                            ? m['classlinkKeepAccount.addPasskey']()
                            : m['classlinkKeepAccount.addPhrase']()}
                    </button>
                    {notNow}
                </div>
                <div className="mt-4 space-y-3">
                    <StoredNote />
                    <RemoveEmail onRemoved={refresh} />
                </div>
            </>
        );
    } else if (view === 'done') {
        content = (
            <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-2xl"
                        aria-hidden="true"
                    />
                </div>
                <Heading className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['classlinkKeepAccount.doneTitle']()}
                </Heading>
                <p className="text-sm text-grayscale-600 leading-relaxed mb-5">
                    {m['classlinkKeepAccount.doneBody']({
                        option: m['recovery.identity.lostSchoolLogin'](),
                    })}
                </p>
                {onComplete && (
                    <button
                        type="button"
                        data-testid="keep-account-continue"
                        className={primaryButton}
                        onClick={onComplete}
                    >
                        {m['common.continue']()}
                    </button>
                )}
                <div className="mt-4 space-y-3">
                    <StoredNote />
                    <RemoveEmail onRemoved={refresh} />
                </div>
            </>
        );
    } else {
        content = (
            <>
                <Heading className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['classlinkKeepAccount.title']()}
                </Heading>
                <p
                    data-testid="keep-account-blocked"
                    className="text-sm text-grayscale-600 leading-relaxed mb-5"
                >
                    {keepAccountReasonMessage(data.personalEmail.reason)}
                </p>
                {onDismiss && (
                    <button type="button" className={primaryButton} onClick={dismiss}>
                        {m['common.continue']()}
                    </button>
                )}
            </>
        );
    }

    return (
        <section
            data-testid="keep-account-step"
            data-step={view}
            aria-live="polite"
            className={`w-full font-poppins text-center ${
                variant === 'inline'
                    ? 'rounded-[20px] bg-white border border-grayscale-200 shadow-sm p-5'
                    : variant === 'onboarding'
                      ? 'max-w-[420px] mx-auto'
                      : 'max-w-[480px] mx-auto py-2'
            }`}
        >
            {content}
        </section>
    );
};

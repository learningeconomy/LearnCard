import React, { useEffect, useRef, useState } from 'react';
import { useIonAlert } from '@ionic/react';
import { CheckCircle2, Info, Lock, Mail, ShieldCheck } from 'lucide-react';
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
import useLogout from '../../hooks/useLogout';
import { RecoveryPinStep, type RecoveryPinStepState } from '../onboarding/v2/RecoveryPinStep';
import { writeRecoveryPinPromptFlag } from '../recovery/recoveryPinPromptFlag';
import { ConfirmEmailForm } from './ConfirmEmailForm';
import { ConfirmPinForm } from './ConfirmPinForm';
import { PersonalEmailForm, isolateLtr } from './PersonalEmailForm';
import {
    ONBOARDING_PRIMARY_BUTTON_CLASS,
    PRIMARY_BUTTON_CLASS,
    QUIET_BUTTON_CLASS,
} from './keepAccountStyles';
import { useKeepAccountTitle } from './useKeepAccountTitle';
import {
    resolveKeepAccountStep,
    useKeepAccountSessionContext,
    type KeepAccountSessionContext,
} from './keepAccountContext';

export type KeepAccountStepProps = {
    /**
     * `inline` is a compact row in a page section (School Connect), `sheet` fills a
     * modal, `onboarding` is a full onboarding step (frosted card, sticky bottom button).
     */
    variant: 'inline' | 'sheet' | 'onboarding';
    /** Where the step is shown, for analytics only. */
    source: KeepAccountSource;
    /**
     * Replaces the email step's headline (e.g. onboarding). By default it is "Keep your
     * account after school" for a student and "Keep your account" for anyone else.
     */
    title?: string;
    /**
     * The user finished: they pressed Done once the server reported nothing left to do,
     * or (`emailOnly`) the email step is behind them. Receives the server's last answer.
     */
    onComplete?: (continuity: ClassLinkAccountContinuity) => void;
    /** The user chose "Not now" (or "OK" on a refusal). The parent decides what's next. */
    onDismiss?: () => void;
    /**
     * Called right before a provider overlay opens: passkey / recovery phrase setup (no
     * escrow), or a new PIN for a locked one. That overlay sits below the app's modal
     * stack, so a host sheet must close itself here.
     */
    onBeforeOverlay?: () => void;
    /**
     * Called once that overlay saved what it was opened for, so a host that closed
     * itself can reopen the step, which then shows the done confirmation.
     */
    onOverlayComplete?: () => void;
    /**
     * Opens the profile where the date of birth is set. When given, a refusal for a
     * missing date of birth offers "Add date of birth".
     */
    onAddBirthDate?: () => void;
    /**
     * Call `onComplete` once the email is verified and this device is signed back in
     * (after "Finishing…" and a brief "Saved") instead of continuing, for a host that asks
     * what comes next itself (onboarding: the PIN step follows; the dashboard asks for
     * whatever is still missing in a later session).
     */
    emailOnly?: boolean;
};

/**
 * How long "Saved" shows after the code is accepted, before the onboarding step hands back
 * or School Connect's form folds into its row (as long as the PIN step's "PIN saved").
 */
export const KEEP_ACCOUNT_SAVED_MS = 900;

// Same pill as School Connect's "Refresh Connection".
const ROW_ACTION_CLASS =
    'shrink-0 min-h-[36px] rounded-full bg-grayscale-100 px-3.5 text-xs font-medium text-grayscale-700 transition-colors hover:bg-grayscale-200 disabled:opacity-40';

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

type KeepAccountView =
    | 'email'
    | 'pin'
    | 'confirmPin'
    | 'confirmEmail'
    | 'otherUid'
    | 'method'
    | 'done'
    | 'blocked'
    | 'hidden';

/** Which screen the server state puts this session on (see `resolveKeepAccountStep`). */
const getView = (
    data: ClassLinkAccountContinuity,
    context: KeepAccountSessionContext
): KeepAccountView => {
    const step = resolveKeepAccountStep(data, context);
    if (step !== 'email') return step;
    if (data.personalEmail.allowed) return 'email';
    // The master switch is off: there is nothing to explain.
    return data.personalEmail.reason === 'disabled' ? 'hidden' : 'blocked';
};

/**
 * Silent no-PIN re-seals already tried in this app session, per account (DID) and sign-in
 * email: each runs at most once, so a failing re-seal never retries on every render, and
 * a later change of the sign-in email gets its own try.
 */
const silentResealTried = new Set<string>();

/** Test helper: forget which accounts were re-sealed this session. */
export const resetKeepAccountSilentReseal = (): void => silentResealTried.clear();

/** The stable refusal reason lca-api sends as `error.data.reason`, if any. */
const getRefusalReason = (error: unknown): string | undefined =>
    (error as { data?: { reason?: unknown } } | null)?.data?.reason as string | undefined;

const StoredNote: React.FC = () => (
    <p className="mt-1 flex items-start gap-2 text-xs text-grayscale-500 leading-relaxed text-start">
        <Info className="w-4 h-4 shrink-0 mt-px" strokeWidth={1.75} aria-hidden="true" />
        {m['classlinkKeepAccount.storedNote']()}
    </p>
);

type IconKind = 'mail' | 'check' | 'lock' | 'shield' | 'info' | 'busy';
const ICONS: Record<Exclude<IconKind, 'busy'>, typeof Mail> = {
    mail: Mail,
    check: CheckCircle2,
    lock: Lock,
    shield: ShieldCheck,
    info: Info,
};

/** The round icon above a title, at the onboarding PIN step's size or the sheet's. */
const StepIcon: React.FC<{ kind: IconKind; large: boolean }> = ({ kind, large }) => {
    const neutral = kind === 'info' || kind === 'busy';
    if (kind === 'busy') {
        // Work in progress: a spinner, never a check before the work is done.
        return (
            <div
                data-testid="keep-account-busy-icon"
                className={`mx-auto rounded-full flex items-center justify-center shadow-xs border bg-grayscale-100 border-grayscale-200 ${
                    large ? 'w-16 h-16 mb-6' : 'w-12 h-12 mb-4'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`border-2 border-grayscale-200 border-t-grayscale-600 rounded-full animate-spin ${
                        large ? 'w-8 h-8' : 'w-6 h-6'
                    }`}
                />
            </div>
        );
    }
    const Icon = ICONS[kind];
    return (
        <div
            className={`mx-auto rounded-full flex items-center justify-center shadow-xs border ${
                large ? 'w-16 h-16 mb-6' : 'w-12 h-12 mb-4'
            } ${
                neutral
                    ? 'bg-grayscale-100 border-grayscale-200 text-grayscale-500'
                    : 'bg-emerald-50 border-emerald-100/50 text-emerald-600'
            }`}
        >
            <Icon className={large ? 'w-8 h-8' : 'w-6 h-6'} strokeWidth={1.5} aria-hidden="true" />
        </div>
    );
};

type ShellProps = {
    variant: 'sheet' | 'onboarding';
    heading: 'h1' | 'h2';
    /** Takes the title, so the step can move focus to it when the screen changes. */
    headingRef?: React.RefObject<HTMLElement>;
    icon?: IconKind;
    title?: string;
    body?: React.ReactNode;
    children?: React.ReactNode;
    /** Full-width buttons: below the content in a sheet, in the sticky bar in onboarding. */
    actions?: React.ReactNode;
};

/**
 * One screen of the step in a sheet (centered stack) or in onboarding (the frosted card
 * of the PIN step, with the actions in a sticky bottom bar like the profile step). In
 * onboarding the card's top edge stays put and the bar keeps its height from screen to
 * screen, so moving from email to code to "Saved" never makes the card jump.
 */
const StepShell: React.FC<ShellProps> = ({
    variant,
    heading: Heading,
    headingRef,
    icon,
    title,
    body,
    children,
    actions,
}) => {
    const large = variant === 'onboarding';
    const header = (
        <>
            {icon && <StepIcon kind={icon} large={large} />}
            {(title || body) && (
                // Space below only when something follows inside the card.
                <div className={`w-full text-center ${children ? (large ? 'mb-8' : 'mb-5') : ''}`}>
                    {title && (
                        <Heading
                            ref={headingRef as React.RefObject<HTMLHeadingElement>}
                            tabIndex={-1}
                            className={`font-semibold text-grayscale-900 text-balance focus:outline-hidden ${
                                large ? 'text-3xl mb-3' : 'text-xl mb-1'
                            }`}
                        >
                            {title}
                        </Heading>
                    )}
                    {body && (
                        <p
                            className={`text-grayscale-600 leading-relaxed ${
                                large ? 'text-base' : 'text-sm'
                            }`}
                        >
                            {body}
                        </p>
                    )}
                </div>
            )}
        </>
    );

    if (!large) {
        return (
            <>
                {header}
                {children}
                {actions && <div className="mt-5 space-y-2">{actions}</div>}
            </>
        );
    }

    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 pt-[calc(var(--ion-safe-area-top,0px)+2.5rem)] md:pt-[calc(var(--ion-safe-area-top,0px)+12vh)] pb-8">
                <div className="w-full max-w-[360px] md:max-w-[440px] bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 p-8 md:px-12 md:py-10 flex flex-col items-center">
                    {header}
                    {children}
                </div>
            </div>
            {/* Always there, at the height of its two buttons, so nothing above reflows. */}
            <div
                className={`w-full border-t px-4 pt-4 pb-[calc(var(--ion-safe-area-bottom,0px)+1.5rem)] ${
                    actions
                        ? 'bg-white/70 backdrop-blur-xl border-grayscale-200/60'
                        : 'border-transparent'
                }`}
            >
                <div className="max-w-[420px] mx-auto min-h-[108px] flex flex-col justify-end gap-2">
                    {actions}
                </div>
            </div>
        </>
    );
};

/** A compact row of School Connect's "Your account" card, like its privacy rows. */
const Row: React.FC<{
    icon: Exclude<IconKind, 'busy'>;
    title: string;
    titleRef?: React.RefObject<HTMLElement>;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
}> = ({ icon, title, titleRef, subtitle, action }) => {
    const Icon = ICONS[icon];
    return (
        <div className="flex items-center gap-3 p-4 text-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-600">
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
                <h3
                    ref={titleRef as React.RefObject<HTMLHeadingElement>}
                    tabIndex={titleRef ? -1 : undefined}
                    className="text-sm font-medium text-grayscale-900 focus:outline-hidden"
                >
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs leading-relaxed text-grayscale-500">{subtitle}</p>
                )}
            </div>
            {action}
        </div>
    );
};

type RemoveResult = Awaited<ReturnType<ReturnType<typeof useRemovePersonalEmail>['mutateAsync']>>;

/**
 * Remove the sign-in email after a system-style confirm that names the address.
 * Returns the trigger's handler, whether it is running, and why it failed: `placeholder`
 * when it is the only way this account signs in (a placeholder account with escrow).
 */
const useRemoveEmail = (
    maskedEmail: string,
    onRemoved: (result: RemoveResult) => void
): { ask: () => void; removing: boolean; failed?: 'error' | 'placeholder' } => {
    const remove = useRemovePersonalEmail();
    const [presentAlert] = useIonAlert();
    const [failed, setFailed] = useState<'error' | 'placeholder'>();

    const run = async (): Promise<void> => {
        setFailed(undefined);
        try {
            onRemoved(await remove.mutateAsync());
        } catch (error) {
            setFailed(getRefusalReason(error) === 'placeholder_escrow' ? 'placeholder' : 'error');
        }
    };

    const ask = (): void => {
        void presentAlert({
            message: m['classlinkKeepAccount.removeConfirm']({ email: isolateLtr(maskedEmail) }),
            buttons: [
                {
                    text: m['classlinkKeepAccount.removeCancel'](),
                    role: 'cancel',
                    htmlAttributes: { 'data-testid': 'keep-account-remove-cancel' },
                },
                {
                    text: m['classlinkKeepAccount.removeAction'](),
                    role: 'destructive',
                    cssClass: 'text-red-600!',
                    htmlAttributes: { 'data-testid': 'keep-account-remove-confirm' },
                    handler: () => {
                        void run();
                    },
                },
            ],
        });
    };

    return { ask, removing: remove.isPending, failed };
};

const RemoveFailed: React.FC<{ reason: 'error' | 'placeholder' }> = ({ reason }) => (
    <div className="px-4 py-3">
        <p role="alert" className="text-xs text-red-600 text-start">
            {reason === 'placeholder'
                ? m['classlinkKeepAccount.cannotRemovePlaceholder']()
                : m['classlinkPersonalEmail.error']()}
        </p>
    </div>
);

/**
 * "Sign out" on the screen where signing this device back in failed: its own component, so
 * the app's logout (and what it needs) only loads there.
 */
const FinishSignOutButton: React.FC = () => {
    const { handleLogout } = useLogout();
    return (
        <button
            type="button"
            data-testid="keep-account-finish-sign-out"
            className={QUIET_BUTTON_CLASS}
            onClick={() => void handleLogout()}
        >
            {m['classlinkKeepAccount.signOut']()}
        </button>
    );
};

/** What the step does right after lca-api changed the sign-in email (verify or remove). */
type FinishParams = {
    kind: 'verify' | 'remove';
    /** Verify: the address the user typed and proved by code on this device. */
    email?: string;
    customToken?: string;
    primaryUid?: string;
};

/**
 * "Keep your account after school" for ClassLink users: add a personal email (one code
 * proves it and makes it the account's sign-in email), then, only if the account still
 * needs it, create a PIN (escrow accounts), enter the current PIN once so the backup's
 * contact follows the new sign-in email (`confirmPin`), or add a passkey / recovery phrase
 * (accounts without escrow), then done. Every screen follows the server's
 * `getAccountContinuity` answer, so the step resumes where the account is and never
 * offers what the district does not allow.
 *
 * Changing the sign-in email signs this login out everywhere (lca-api returns a custom
 * token): right after verify or remove the step shows "Finishing…" and signs this device
 * back in (`refreshAccountContact`) before anything else; a failure offers "Try again".
 * Only the login that holds the sign-in email (`primaryUid`) re-signs in or confirms the
 * PIN; another login of the account is told to sign in with the sign-in email. Focus
 * moves to each new screen's title (or the PIN boxes).
 */
export const KeepAccountStep: React.FC<KeepAccountStepProps> = ({
    variant,
    source,
    title,
    onComplete,
    onDismiss,
    onBeforeOverlay,
    onOverlayComplete,
    onAddBirthDate,
    emailOnly = false,
}) => {
    const { track } = useAnalytics();
    const {
        state,
        openRecoverySetup,
        openPinSetup,
        setEscrowPin,
        refreshAccountContact,
        resealEscrowContact,
        rememberConfirmedContact,
        getConfirmedContact,
        getPendingAccountContact,
    } = useAppAuth();
    const sessionContext = useKeepAccountSessionContext();
    const sessionUid = sessionContext.sessionUid;
    const did = state.status === 'ready' ? state.did : undefined;
    // The sign-in email as this device's session knows it (never a server value).
    const sessionEmail =
        state.status === 'ready' ? (state.authUser?.email ?? undefined) : undefined;
    const queryClient = useQueryClient();
    const continuity = useClassLinkAccountContinuity({ enabled: true });
    const defaultTitle = useKeepAccountTitle(variant !== 'inline' && !title).title;
    const [overlayOpen, setOverlayOpen] = useState(false);
    // Inline: the email form opens from its row.
    const [expanded, setExpanded] = useState(false);
    // Inline: the PIN confirm opens from its row.
    const [confirmExpanded, setConfirmExpanded] = useState(false);
    // The PIN confirm moved on to "choose a new PIN" (which shows its own title).
    const [confirmMode, setConfirmMode] = useState<'confirm' | 'new'>('confirm');
    // "Saved" after the code is accepted: held briefly (onboarding, School Connect), or
    // only until the server's next answer is in (sheet).
    const [saved, setSaved] = useState<'no' | 'showing' | 'shown'>('no');
    const [savedEmail, setSavedEmail] = useState('');
    // A sign-in email change this device has not applied yet (its token is kept by the
    // coordinator, so a remount, a reopened sheet or another surface can still retry it).
    const [pendingFinish] = useState<FinishParams | undefined>(() => {
        const pending = getPendingAccountContact?.();
        return pending
            ? {
                  kind: pending.expectedEmail ? 'verify' : 'remove',
                  email: pending.expectedEmail,
                  customToken: pending.customToken,
                  primaryUid: pending.primaryUid,
              }
            : undefined;
    });
    // Signing this device back in after the sign-in email changed.
    const [finish, setFinish] = useState<'idle' | 'running' | 'failed'>(
        pendingFinish ? 'failed' : 'idle'
    );
    const finishParamsRef = useRef<FinishParams | undefined>(pendingFinish);
    // The PIN confirm asks the user to type the sign-in email (so the body must not show it).
    const [confirmRetype, setConfirmRetype] = useState(false);
    // "Choose a new PIN" on the confirm: its own step ("Not now" only before typing).
    const [confirmPinStep, setConfirmPinStep] = useState<RecoveryPinStepState>('enter');
    // Inline: a brief "Saved" after the PIN confirm (or the email re-type) re-sealed.
    const [resealSaved, setResealSaved] = useState(false);
    // The embedded PIN step's own step: "Not now" shows only before the PIN is typed.
    const [pinStep, setPinStep] = useState<RecoveryPinStepState>('enter');
    const headingRef = useRef<HTMLElement>(null);
    const shownRef = useRef(false);
    const handedOffRef = useRef(false);
    const leftRef = useRef(false);
    const data = continuity.data;
    const view = data ? getView(data, sessionContext) : undefined;
    const onPrimarySession = !!data?.primaryUid && sessionUid === data.primaryUid;
    const pastEmail =
        view === 'pin' ||
        view === 'confirmPin' ||
        view === 'confirmEmail' ||
        view === 'otherUid' ||
        view === 'method' ||
        view === 'done';
    // Email-only hosts are done once the email step is behind the user: at once when it
    // already was, or after "Saved" once the server's new answer is in.
    const handOff =
        finish === 'idle' &&
        emailOnly &&
        (saved === 'no' ? pastEmail : saved === 'shown' && !continuity.isFetching);
    const awaitingNext = saved === 'shown' && view === 'email' && continuity.isFetching;
    const savedView = emailOnly ? saved !== 'no' && !handOff : variant === 'sheet' && awaitingNext;
    const inlineSaved =
        variant === 'inline' && (saved === 'showing' || awaitingNext || resealSaved);
    const screen =
        finish === 'running'
            ? 'finishing'
            : finish === 'failed'
              ? 'finishFailed'
              : savedView || inlineSaved
                ? 'saved'
                : view;
    const pinLocked = data?.pinState === 'locked';
    const analyticsStep: KeepAccountAnalyticsStep | undefined =
        view === 'hidden' || handOff || screen !== view ? undefined : view;

    // Invalidate rather than refetch: the method overlay can outlive a host sheet.
    const refresh = (): void => {
        void queryClient.invalidateQueries({ queryKey: ['classlinkAccountContinuity'] });
    };

    /**
     * After an overlay saved a PIN, passkey or phrase: wait for the server's new answer
     * (even with no step mounted to watch it) before reopening, so the reopened step
     * never shows, and never lets the user tap, the screen they just finished.
     */
    const refetchThen = (next?: () => void): void => {
        void queryClient
            .refetchQueries({ queryKey: ['classlinkAccountContinuity'] })
            .catch(() => undefined)
            .then(() => next?.());
    };

    /**
     * Right after lca-api changed the sign-in email: remember a typed address as confirmed
     * on this device, sign this login back in with the custom token (only the login that
     * holds the sign-in email was signed out) before any other call, then re-read what is
     * left. Resolves false (and shows "Try again") when that failed.
     */
    const runFinish = async (params: FinishParams): Promise<boolean> => {
        finishParamsRef.current = params;
        setFinish('running');
        try {
            if (params.kind === 'verify' && params.email) rememberConfirmedContact(params.email);
            if (params.customToken && params.primaryUid && sessionUid === params.primaryUid) {
                const result = await refreshAccountContact({
                    // A removal restores an address this device never typed; it stays
                    // unconfirmed, so a PIN confirm asks the user to type it.
                    ...(params.kind === 'verify' ? { expectedEmail: params.email } : {}),
                    customToken: params.customToken,
                    primaryUid: params.primaryUid,
                });
                if (result === 'mismatch') throw new Error('The sign-in email did not match.');
            }
            await queryClient.refetchQueries({ queryKey: ['classlinkAccountContinuity'] });
            setFinish('idle');
            return true;
        } catch {
            setFinish('failed');
            return false;
        }
    };

    const emailSaved = (email: string): void => {
        setSavedEmail(email);
        setExpanded(false);
        setSaved(emailOnly || variant === 'inline' ? 'showing' : 'shown');
    };

    const retryFinish = (): void => {
        const params = finishParamsRef.current;
        if (!params) return;
        void runFinish(params).then(ok => {
            if (ok && params.kind === 'verify' && params.email) emailSaved(params.email);
        });
    };

    const removeEmail = useRemoveEmail(data?.maskedEmail ?? '', result => {
        setExpanded(false);
        setConfirmExpanded(false);
        track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'remove' });
        void runFinish({
            kind: 'remove',
            customToken: result.customToken,
            primaryUid: data?.primaryUid,
        });
    });

    useEffect(() => {
        if (!analyticsStep || shownRef.current) return;
        shownRef.current = true;
        track(AnalyticsEvents.KEEP_ACCOUNT_SHOWN, { source, step: analyticsStep });
    }, [analyticsStep, source, track]);

    useEffect(() => {
        if (saved !== 'showing') return;
        const timer = setTimeout(() => setSaved('shown'), KEEP_ACCOUNT_SAVED_MS);
        return () => clearTimeout(timer);
    }, [saved]);

    useEffect(() => {
        if (!resealSaved) return;
        const timer = setTimeout(() => setResealSaved(false), KEEP_ACCOUNT_SAVED_MS);
        return () => clearTimeout(timer);
    }, [resealSaved]);

    // Once past the email, "Saved" is spent (a later removal starts over).
    useEffect(() => {
        if (!emailOnly && saved === 'shown' && view !== 'email') setSaved('no');
    }, [emailOnly, saved, view]);

    useEffect(() => {
        if (!handOff || !data || handedOffRef.current) return;
        handedOffRef.current = true;
        onComplete?.(data);
    }, [handOff, data, onComplete]);

    // An account without a PIN whose backup still names the old contact: re-seal it to the
    // sign-in email silently, from the login that holds it, once per app session and
    // sign-in email. Only when this device confirmed that address: otherwise the step asks
    // the user to type it (`confirmEmail`) instead of failing silently.
    const confirmedContact = did ? getConfirmedContact?.(did) : undefined;
    const normalizedSessionEmail = sessionEmail?.trim().toLowerCase();
    const needsSilentReseal =
        finish === 'idle' &&
        !!data &&
        data.contactStale &&
        data.pinState === 'none' &&
        onPrimarySession &&
        !!did &&
        !!normalizedSessionEmail &&
        confirmedContact === normalizedSessionEmail;
    const silentResealKey = `${did ?? ''}\u0000${normalizedSessionEmail ?? ''}`;
    useEffect(() => {
        if (!needsSilentReseal || !data?.primaryUid || silentResealTried.has(silentResealKey))
            return;
        silentResealTried.add(silentResealKey);
        void resealEscrowContact({ primaryUid: data.primaryUid })
            .then(refresh)
            .catch(() => undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [needsSilentReseal, silentResealKey, data?.primaryUid]);

    // Move focus to each new screen's title, so keyboard and screen-reader users land on
    // it instead of the page. Not on the first screen (the host placed focus), and not on
    // the embedded PIN step, which focuses its first box.
    const screenRef = useRef(screen);
    useEffect(() => {
        const previous = screenRef.current;
        screenRef.current = screen;
        if (previous === screen || previous === undefined || previous === 'hidden') return;
        if (screen === 'pin' && variant !== 'inline' && !pinLocked) return;
        // The PIN confirm and the email re-type focus their own first field.
        if ((screen === 'confirmPin' || screen === 'confirmEmail') && variant !== 'inline') return;
        headingRef.current?.focus();
    }, [screen, variant, pinLocked]);

    // A sheet or onboarding step must not sit empty (no ClassLink identity, a failed check,
    // or the master switch turned off mid-flow): leave. The inline section just hides.
    const nothingToShow =
        !continuity.isLoading && finish === 'idle' && (!data || view === 'hidden');
    useEffect(() => {
        if (variant === 'inline' || !nothingToShow || leftRef.current) return;
        leftRef.current = true;
        onDismiss?.();
    }, [variant, nothingToShow, onDismiss]);

    const sectionClass =
        variant === 'inline'
            ? 'w-full font-poppins rounded-[20px] bg-white border border-grayscale-200 shadow-sm divide-y divide-grayscale-100'
            : variant === 'onboarding'
              ? // Pops in once; later screens (code, "Saved") change in place.
                'w-full h-full flex flex-col font-poppins text-center animate-pop-in'
              : 'w-full max-w-[480px] mx-auto py-2 font-poppins text-center';

    if (continuity.isLoading) {
        return variant === 'inline' ? null : (
            <div
                className={`flex justify-center items-center py-10 ${
                    variant === 'onboarding' ? 'flex-1' : ''
                }`}
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
    // No ClassLink identity, or the check failed: there is nothing to offer. Inline, a
    // stored address stays listed (with Remove) even when the step is switched off.
    const storedEmail = Boolean(data?.maskedEmail);
    if (!data || !view || handOff) return null;
    if (view === 'hidden' && finish === 'idle' && !(variant === 'inline' && storedEmail))
        return null;

    const heading = variant === 'onboarding' ? 'h1' : 'h2';
    const shellVariant = variant === 'onboarding' ? 'onboarding' : 'sheet';
    const maskedEmail = isolateLtr(data.maskedEmail ?? '');
    const stepTitle = title ?? defaultTitle;
    const emailBody = m['classlinkKeepAccount.body']();
    // The PIN confirm names the address the backup will be sealed to: this session's own
    // sign-in email (the server's masked one only if the session has none).
    const confirmEmail = isolateLtr(sessionEmail ?? data.maskedEmail ?? '');

    const dismiss = (): void => {
        if (view !== 'hidden')
            track(AnalyticsEvents.KEEP_ACCOUNT_DISMISSED, { source, step: view });
        onDismiss?.();
    };

    const notNow = onDismiss && (
        <button
            type="button"
            data-testid="keep-account-not-now"
            className={QUIET_BUTTON_CLASS}
            onClick={dismiss}
        >
            {m['classlinkKeepAccount.notNow']()}
        </button>
    );

    // The overlay already asked; its own first button would only ask again.
    const startMethod = (): void => {
        if (overlayOpen) return;
        const initialMethod = getRecommendedMethod();
        setOverlayOpen(true);
        onBeforeOverlay?.();
        openRecoverySetup({
            initialMethod,
            autoStart: true,
            onCompleted: () => {
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'method' });
                refetchThen(onOverlayComplete);
            },
            onClosed: () => setOverlayOpen(false),
        });
    };

    const pinSaved = (): void => {
        if (state.status === 'ready') writeRecoveryPinPromptFlag(state.did, 'set');
        track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'pin' });
        refresh();
    };

    const pinConfirmed = (how: 'confirmed' | 'newPin'): void => {
        if (how === 'newPin' && state.status === 'ready')
            writeRecoveryPinPromptFlag(state.did, 'set');
        track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'confirmPin' });
        // Inline, say so before the row folds away (the sheet moves on to "You're all set").
        if (variant === 'inline') setResealSaved(true);
        // The form stays disabled until the server's next answer is in.
        refetchThen(() => {
            setConfirmExpanded(false);
            setConfirmMode('confirm');
        });
    };

    const emailConfirmed = (): void => {
        // Just re-sealed to this address: the silent re-seal (now unblocked, since the
        // address is confirmed) must not rotate again before the server's answer is in.
        silentResealTried.add(silentResealKey);
        track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'confirmEmail' });
        if (variant === 'inline') setResealSaved(true);
        refetchThen(() => setConfirmExpanded(false));
    };

    // The PIN overlay: a new PIN for a locked one, or (inline, where there is no sheet to
    // hold the step) the same "create a PIN" prompt the dashboard opens.
    const openPinOverlay = (): void => {
        if (overlayOpen) return;
        setOverlayOpen(true);
        onBeforeOverlay?.();
        openPinSetup({
            reason: pinLocked ? 'pin-locked' : 'first-time',
            onComplete: () => {
                setOverlayOpen(false);
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'pin' });
                refetchThen(onOverlayComplete);
            },
            onSkip: () => setOverlayOpen(false),
        });
    };

    const confirmForm = (
        <ConfirmPinForm
            primaryUid={data.primaryUid ?? ''}
            pinChangeRequired={data.pinChangeRequired}
            autoFocus
            headingLevel={variant === 'inline' ? 'h3' : heading}
            onModeChange={setConfirmMode}
            onRetypeChange={setConfirmRetype}
            onNewPinStepChange={setConfirmPinStep}
            onDone={pinConfirmed}
        />
    );
    // Names the address the backup will be sealed to, unless the user must type it.
    const confirmBody = confirmRetype
        ? m['classlinkKeepAccount.confirmPinBodyRetype']()
        : m['classlinkKeepAccount.confirmPinBody']({ email: confirmEmail });

    const confirmEmailForm = (
        <ConfirmEmailForm
            primaryUid={data.primaryUid ?? ''}
            autoFocus
            submitClassName={
                variant === 'onboarding' ? ONBOARDING_PRIMARY_BUTTON_CLASS : PRIMARY_BUTTON_CLASS
            }
            onDone={emailConfirmed}
        />
    );

    const emailForm = (layout: 'shell' | 'inline'): React.ReactNode => (
        <PersonalEmailForm
            autoFocus={layout === 'inline'}
            // The row above already says "Sign-in email".
            hideEmailLabel={layout === 'inline'}
            submitClassName={
                variant === 'onboarding' ? ONBOARDING_PRIMARY_BUTTON_CLASS : PRIMARY_BUTTON_CLASS
            }
            // What the address is for, right where it is typed.
            emailNote={<StoredNote />}
            onCodeSent={() =>
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'email' })
            }
            onVerified={(result, email) => {
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'code' });
                void runFinish({
                    kind: 'verify',
                    email,
                    customToken: result.customToken,
                    primaryUid: result.primaryUid,
                }).then(ok => {
                    if (ok) emailSaved(email);
                });
            }}
            onForbidden={refresh}
            secondaryAction={
                layout === 'inline'
                    ? busy => (
                          <button
                              type="button"
                              className={QUIET_BUTTON_CLASS}
                              disabled={busy}
                              onClick={() => setExpanded(false)}
                          >
                              {m['common.cancel']()}
                          </button>
                      )
                    : () => notNow
            }
            layout={
                layout === 'inline'
                    ? undefined
                    : ({ form, actions, step, sentTo }) => (
                          <StepShell
                              variant={shellVariant}
                              heading={heading}
                              headingRef={headingRef}
                              icon="mail"
                              title={
                                  step === 'code'
                                      ? m['classlinkPersonalEmail.checkEmail']()
                                      : stepTitle
                              }
                              body={step === 'email' ? emailBody : sentTo}
                              actions={actions}
                          >
                              {form}
                          </StepShell>
                      )
            }
        />
    );

    const signOutButton = <FinishSignOutButton />;

    const retryButton = (className: string): React.ReactNode => (
        <button
            type="button"
            data-testid="keep-account-finish-retry"
            className={className}
            onClick={retryFinish}
        >
            {m['common.tryAgain']()}
        </button>
    );

    const canAddBirthDate = data.personalEmail.reason === 'age_unknown' && !!onAddBirthDate;

    const methodLabel =
        getRecommendedMethod() === 'passkey'
            ? m['classlinkKeepAccount.addPasskey']()
            : m['classlinkKeepAccount.addPhrase']();
    const methodBody =
        getRecommendedMethod() === 'passkey'
            ? m['classlinkKeepAccount.methodBody']()
            : m['classlinkKeepAccount.methodBodyPhrase']();
    // The full address when this device typed or proved it; else the server's masked one.
    const finishOnSignInEmail = m['classlinkKeepAccount.finishOnSignInEmail']({
        email: confirmedContact ? isolateLtr(confirmedContact) : maskedEmail,
    });
    const lockedBody = m['classlinkKeepAccount.banner.pinLockedBody']();

    let content: React.ReactNode;
    if (variant === 'inline') {
        const removeButton = data.canRemove ? (
            <button
                type="button"
                data-testid="keep-account-remove"
                disabled={removeEmail.removing}
                onClick={removeEmail.ask}
                className={ROW_ACTION_CLASS}
            >
                {removeEmail.removing
                    ? m['classlinkKeepAccount.removing']()
                    : m['classlinkKeepAccount.remove']()}
            </button>
        ) : (
            // The only way this account signs in: it can be changed, not removed.
            !expanded && (
                <button
                    type="button"
                    data-testid="keep-account-change"
                    className={ROW_ACTION_CLASS}
                    onClick={() => setExpanded(true)}
                >
                    {m['classlinkKeepAccount.rowDifferent']()}
                </button>
            )
        );
        // The "Use a different email" pill already says it can only be changed.
        const subtitleParts = [
            maskedEmail,
            ...(data.hasSchoolEmail ? [m['classlinkKeepAccount.rowSchoolAlsoWorks']()] : []),
        ];
        // The sign-in address, and whether the school email still signs in too.
        const emailRow = (
            <Row
                icon="mail"
                title={m['classlinkKeepAccount.rowLabel']()}
                titleRef={headingRef}
                subtitle={subtitleParts.join(' · ')}
                action={removeButton}
            />
        );
        const changeForm = expanded && view !== 'email' && (
            <div className="p-4">{emailForm('inline')}</div>
        );
        const removeFailed = removeEmail.failed && <RemoveFailed reason={removeEmail.failed} />;
        // A stored address the step cannot finish with (the policy now refuses it) stays
        // removable.
        const storedRow = storedEmail && (
            <>
                {emailRow}
                {removeFailed}
            </>
        );
        if (screen === 'finishing' || screen === 'finishFailed') {
            content = (
                <>
                    {(savedEmail || storedEmail) && (
                        <Row
                            icon="mail"
                            title={m['classlinkKeepAccount.rowLabel']()}
                            subtitle={savedEmail ? isolateLtr(savedEmail) : maskedEmail}
                        />
                    )}
                    <div className="p-4 flex items-center gap-3">
                        <p
                            ref={headingRef as React.RefObject<HTMLParagraphElement>}
                            tabIndex={-1}
                            role={screen === 'finishing' ? 'status' : 'alert'}
                            data-testid={
                                screen === 'finishing'
                                    ? 'keep-account-finishing'
                                    : 'keep-account-finish-failed'
                            }
                            className={`flex-1 text-sm focus:outline-hidden text-start ${
                                screen === 'finishing' ? 'text-grayscale-600' : 'text-red-600'
                            }`}
                        >
                            {screen === 'finishing'
                                ? m['classlinkKeepAccount.finishing']()
                                : m['classlinkKeepAccount.finishFailed']()}
                        </p>
                        {screen === 'finishFailed' && retryButton(ROW_ACTION_CLASS)}
                    </div>
                </>
            );
        } else if (inlineSaved) {
            // A beat to confirm, then the form folds into the address row.
            content = (
                <>
                    <Row
                        icon="mail"
                        title={m['classlinkKeepAccount.rowLabel']()}
                        subtitle={resealSaved ? maskedEmail : isolateLtr(savedEmail)}
                    />
                    <div className="p-4 animate-fade-in-up">
                        <p
                            ref={headingRef as React.RefObject<HTMLParagraphElement>}
                            tabIndex={-1}
                            role="status"
                            data-testid="keep-account-saved"
                            className="flex items-center gap-2 text-sm font-medium text-emerald-700 focus:outline-hidden"
                        >
                            <CheckCircle2
                                className="w-5 h-5"
                                strokeWidth={1.75}
                                aria-hidden="true"
                            />
                            {m['classlinkKeepAccount.saved']()}
                        </p>
                    </div>
                </>
            );
        } else if (view === 'email') {
            content = (
                <>
                    {storedRow}
                    <Row
                        icon="mail"
                        title={
                            storedEmail
                                ? m['classlinkKeepAccount.rowDifferent']()
                                : m['classlinkKeepAccount.rowLabel']()
                        }
                        titleRef={storedEmail ? undefined : headingRef}
                        subtitle={m['classlinkKeepAccount.banner.emailBody']()}
                        action={
                            !expanded && (
                                <button
                                    type="button"
                                    data-testid="keep-account-add"
                                    className={ROW_ACTION_CLASS}
                                    onClick={() => setExpanded(true)}
                                >
                                    {m['classlinkKeepAccount.rowAdd']()}
                                </button>
                            )
                        }
                    />
                    {expanded && <div className="p-4">{emailForm('inline')}</div>}
                </>
            );
        } else if (view === 'confirmPin') {
            content = (
                <>
                    {emailRow}
                    {changeForm}
                    <Row
                        icon="lock"
                        title={m['classlinkKeepAccount.finishRowTitle']()}
                        action={
                            !confirmExpanded && (
                                <button
                                    type="button"
                                    data-testid="keep-account-confirm"
                                    className={ROW_ACTION_CLASS}
                                    onClick={() => setConfirmExpanded(true)}
                                >
                                    {m['classlinkKeepAccount.banner.confirmPinAction']()}
                                </button>
                            )
                        }
                    />
                    {confirmExpanded && (
                        <div className="p-4 space-y-3">
                            {confirmMode === 'confirm' && (
                                <p className="text-sm text-grayscale-600 text-start">
                                    {confirmBody}
                                </p>
                            )}
                            {confirmForm}
                            <button
                                type="button"
                                className={QUIET_BUTTON_CLASS}
                                onClick={() => {
                                    setConfirmExpanded(false);
                                    setConfirmMode('confirm');
                                }}
                            >
                                {m['common.cancel']()}
                            </button>
                        </div>
                    )}
                    {removeFailed}
                </>
            );
        } else if (view === 'confirmEmail') {
            // After a removal there is no personal address left to list.
            content = (
                <>
                    {storedEmail && emailRow}
                    {storedEmail && changeForm}
                    <Row
                        icon="mail"
                        title={m['classlinkKeepAccount.finishRowTitle']()}
                        titleRef={storedEmail ? undefined : headingRef}
                        subtitle={m['classlinkKeepAccount.confirmEmailBody']()}
                        action={
                            !confirmExpanded && (
                                <button
                                    type="button"
                                    data-testid="keep-account-confirm-email-open"
                                    className={ROW_ACTION_CLASS}
                                    onClick={() => setConfirmExpanded(true)}
                                >
                                    {m['classlinkKeepAccount.confirmEmailAction']()}
                                </button>
                            )
                        }
                    />
                    {confirmExpanded && (
                        <div className="p-4 space-y-3">
                            {confirmEmailForm}
                            <button
                                type="button"
                                className={QUIET_BUTTON_CLASS}
                                onClick={() => setConfirmExpanded(false)}
                            >
                                {m['common.cancel']()}
                            </button>
                        </div>
                    )}
                    {removeFailed}
                </>
            );
        } else if (view === 'otherUid') {
            content = (
                <>
                    {emailRow}
                    {changeForm}
                    <Row
                        icon="info"
                        title={m['classlinkKeepAccount.finishRowTitle']()}
                        subtitle={
                            <span data-testid="keep-account-other-uid">{finishOnSignInEmail}</span>
                        }
                    />
                    {removeFailed}
                </>
            );
        } else if (view === 'pin' || view === 'method') {
            const pinTitle = pinLocked
                ? m['recovery.pin.pinLocked.title']()
                : m['classlinkKeepAccount.pinTitle']();
            const pinBody = pinLocked ? lockedBody : m['classlinkKeepAccount.pinBody']();
            content = (
                <>
                    {emailRow}
                    {changeForm}
                    <Row
                        icon={view === 'pin' ? 'lock' : 'shield'}
                        title={view === 'pin' ? pinTitle : methodLabel}
                        subtitle={view === 'pin' ? pinBody : methodBody}
                        action={
                            <button
                                type="button"
                                data-testid={
                                    view === 'pin' ? 'keep-account-pin' : 'keep-account-method'
                                }
                                className={ROW_ACTION_CLASS}
                                disabled={overlayOpen}
                                onClick={view === 'pin' ? openPinOverlay : startMethod}
                            >
                                {view === 'method'
                                    ? m['classlinkKeepAccount.rowAdd']()
                                    : pinLocked
                                      ? m['recovery.pin.pinLocked.action']()
                                      : m['classlinkKeepAccount.banner.pinAction']()}
                            </button>
                        }
                    />
                    {removeFailed}
                </>
            );
        } else if (view === 'done') {
            content = (
                <>
                    {emailRow}
                    {changeForm}
                    {removeFailed}
                </>
            );
        } else if (view === 'hidden') {
            content = storedRow;
        } else {
            // The row is short: the pill says what to add, the subtitle why.
            content = (
                <>
                    {storedRow}
                    <Row
                        icon="info"
                        title={m['classlinkKeepAccount.rowLabel']()}
                        titleRef={storedEmail ? undefined : headingRef}
                        subtitle={
                            <span data-testid="keep-account-blocked">
                                {canAddBirthDate
                                    ? m['classlinkKeepAccount.rowNeedsBirthDate']()
                                    : keepAccountReasonMessage(data.personalEmail.reason)}
                            </span>
                        }
                        action={
                            canAddBirthDate && (
                                <button
                                    type="button"
                                    data-testid="keep-account-add-birth-date"
                                    aria-label={m['classlinkKeepAccount.addBirthDate']()}
                                    className={ROW_ACTION_CLASS}
                                    onClick={onAddBirthDate}
                                >
                                    {m['classlinkKeepAccount.rowAdd']()}
                                </button>
                            )
                        }
                    />
                </>
            );
        }
    } else if (screen === 'finishing') {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="busy"
                title={m['classlinkKeepAccount.finishing']()}
                body={
                    <span role="status" data-testid="keep-account-finishing">
                        {savedEmail ? isolateLtr(savedEmail) : null}
                    </span>
                }
            />
        );
    } else if (screen === 'finishFailed') {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="info"
                title={stepTitle}
                body={
                    <span role="alert" data-testid="keep-account-finish-failed">
                        {m['classlinkKeepAccount.finishFailed']()}
                    </span>
                }
                // No "Not now": this login was signed out by the change, so nothing else
                // (a PIN, escrow) can work until it signs back in.
                actions={
                    <>
                        {retryButton(PRIMARY_BUTTON_CLASS)}
                        {signOutButton}
                    </>
                }
            />
        );
    } else if (savedView) {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="check"
                title={m['classlinkKeepAccount.saved']()}
                body={savedEmail ? isolateLtr(savedEmail) : undefined}
            />
        );
    } else if (view === 'email') {
        content = emailForm('shell');
    } else if (view === 'confirmPin') {
        // "Choose a new PIN" shows its own title; the confirm names the sealed address.
        content =
            confirmMode === 'new' ? (
                // One way out at a time: once the new PIN is typed, "Start over" is the only one.
                <StepShell
                    variant={shellVariant}
                    heading={heading}
                    actions={(confirmPinStep === 'enter' && notNow) || undefined}
                >
                    {confirmForm}
                </StepShell>
            ) : (
                <StepShell
                    variant={shellVariant}
                    heading={heading}
                    headingRef={headingRef}
                    icon="lock"
                    title={m['classlinkKeepAccount.confirmPinTitle']()}
                    body={confirmBody}
                    actions={notNow || undefined}
                >
                    {confirmForm}
                </StepShell>
            );
    } else if (view === 'confirmEmail') {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="mail"
                title={m['classlinkKeepAccount.confirmEmailTitle']()}
                body={m['classlinkKeepAccount.confirmEmailBody']()}
                actions={notNow || undefined}
            >
                {confirmEmailForm}
            </StepShell>
        );
    } else if (view === 'otherUid') {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="info"
                title={stepTitle}
                body={<span data-testid="keep-account-other-uid">{finishOnSignInEmail}</span>}
                actions={
                    onDismiss && (
                        <button
                            type="button"
                            data-testid="keep-account-blocked-ok"
                            className={PRIMARY_BUTTON_CLASS}
                            onClick={dismiss}
                        >
                            {m['classlinkKeepAccount.blockedOk']()}
                        </button>
                    )
                }
            />
        );
    } else if (view === 'pin' && !pinLocked) {
        content = (
            // One way out at a time: once the PIN is typed, "Start over" is the only one.
            <StepShell
                variant={shellVariant}
                heading={heading}
                actions={(pinStep === 'enter' && notNow) || undefined}
            >
                <RecoveryPinStep
                    embedded
                    autoFocus
                    headingLevel={heading}
                    title={m['classlinkKeepAccount.pinTitle']()}
                    body={m['classlinkKeepAccount.pinBody']()}
                    setPin={setEscrowPin}
                    onComplete={pinSaved}
                    onStepChange={setPinStep}
                    // Offered only after repeated save failures.
                    onSkip={dismiss}
                />
            </StepShell>
        );
    } else if (view === 'pin') {
        // Same words as the overlay the button opens.
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="lock"
                title={m['recovery.pin.pinLocked.title']()}
                body={lockedBody}
                actions={
                    <>
                        <button
                            type="button"
                            data-testid="keep-account-pin-reset"
                            className={PRIMARY_BUTTON_CLASS}
                            disabled={overlayOpen}
                            onClick={openPinOverlay}
                        >
                            {m['recovery.pin.pinLocked.action']()}
                        </button>
                        {notNow}
                    </>
                }
            />
        );
    } else if (view === 'method') {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="shield"
                title={m['classlinkKeepAccount.methodTitle']()}
                body={methodBody}
                actions={
                    <>
                        <button
                            type="button"
                            data-testid="keep-account-method"
                            className={PRIMARY_BUTTON_CLASS}
                            disabled={overlayOpen}
                            onClick={startMethod}
                        >
                            {methodLabel}
                        </button>
                        {notNow}
                    </>
                }
            />
        );
    } else if (view === 'done') {
        // Removing the address lives in School Connect, next to the address it removes.
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="check"
                title={m['classlinkKeepAccount.doneTitle']()}
                body={(data.pinRecoverable
                    ? m['classlinkKeepAccount.doneBody']
                    : m['classlinkKeepAccount.doneBodyMethod'])({ email: maskedEmail })}
                actions={
                    onComplete && (
                        <button
                            type="button"
                            data-testid="keep-account-continue"
                            className={PRIMARY_BUTTON_CLASS}
                            onClick={() => onComplete(data)}
                        >
                            {m['classlinkKeepAccount.done']()}
                        </button>
                    )
                }
            />
        );
    } else {
        content = (
            <StepShell
                variant={shellVariant}
                heading={heading}
                headingRef={headingRef}
                icon="info"
                title={stepTitle}
                body={
                    <span data-testid="keep-account-blocked">
                        {keepAccountReasonMessage(data.personalEmail.reason)}
                    </span>
                }
                actions={
                    (canAddBirthDate || onDismiss) && (
                        <>
                            {canAddBirthDate && (
                                <button
                                    type="button"
                                    data-testid="keep-account-add-birth-date"
                                    className={PRIMARY_BUTTON_CLASS}
                                    onClick={onAddBirthDate}
                                >
                                    {m['classlinkKeepAccount.addBirthDate']()}
                                </button>
                            )}
                            {onDismiss && (
                                <button
                                    type="button"
                                    data-testid="keep-account-blocked-ok"
                                    className={
                                        canAddBirthDate ? QUIET_BUTTON_CLASS : PRIMARY_BUTTON_CLASS
                                    }
                                    onClick={dismiss}
                                >
                                    {m['classlinkKeepAccount.blockedOk']()}
                                </button>
                            )}
                        </>
                    )
                }
            />
        );
    }

    // Not a live region: each screen's title takes focus instead, and the countdown to
    // "Resend code" must not be read out every second.
    return (
        <section data-testid="keep-account-step" data-step={screen} className={sectionClass}>
            {content}
        </section>
    );
};

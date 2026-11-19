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
import { RecoveryPinStep, type RecoveryPinStepState } from '../onboarding/v2/RecoveryPinStep';
import { writeRecoveryPinPromptFlag } from '../recovery/recoveryPinPromptFlag';
import { PersonalEmailForm, isolateLtr } from './PersonalEmailForm';
import {
    ONBOARDING_PRIMARY_BUTTON_CLASS,
    PRIMARY_BUTTON_CLASS,
    QUIET_BUTTON_CLASS,
} from './keepAccountStyles';
import { useKeepAccountTitle } from './useKeepAccountTitle';

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
     * Call `onComplete` once the email is verified (after a brief "Saved" check) instead
     * of continuing, for a host that cannot show what may come next (onboarding: it asked
     * for the PIN just before, and a passkey or phrase overlay cannot sit above it; the
     * dashboard asks for whatever is still missing in a later session).
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

/** Which screen the server state puts the user on. */
const getView = (
    data: ClassLinkAccountContinuity
): 'email' | 'pin' | 'method' | 'done' | 'blocked' | 'hidden' => {
    if (data.nextStep !== 'email') return data.nextStep;
    if (data.personalEmail.allowed) return 'email';
    // The master switch is off: there is nothing to explain.
    return data.personalEmail.reason === 'disabled' ? 'hidden' : 'blocked';
};

const StoredNote: React.FC = () => (
    <p className="mt-1 flex items-start gap-2 text-xs text-grayscale-500 leading-relaxed text-start">
        <Info className="w-4 h-4 shrink-0 mt-px" strokeWidth={1.75} aria-hidden="true" />
        {m['classlinkKeepAccount.storedNote']()}
    </p>
);

type IconKind = 'mail' | 'check' | 'lock' | 'shield' | 'info';
const ICONS: Record<IconKind, typeof Mail> = {
    mail: Mail,
    check: CheckCircle2,
    lock: Lock,
    shield: ShieldCheck,
    info: Info,
};

/** The round icon above a title, at the onboarding PIN step's size or the sheet's. */
const StepIcon: React.FC<{ kind: IconKind; large: boolean }> = ({ kind, large }) => {
    const Icon = ICONS[kind];
    const neutral = kind === 'info';
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
    icon: IconKind;
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

/**
 * Remove the personal email after a system-style confirm that names the address.
 * Returns the trigger's handler, whether it is running, and whether it failed.
 */
const useRemoveEmail = (
    maskedEmail: string,
    onRemoved: () => void
): { ask: () => void; removing: boolean; failed: boolean } => {
    const remove = useRemovePersonalEmail();
    const [presentAlert] = useIonAlert();
    const [failed, setFailed] = useState(false);

    const run = async (): Promise<void> => {
        setFailed(false);
        try {
            await remove.mutateAsync();
            onRemoved();
        } catch {
            setFailed(true);
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

const RemoveFailed: React.FC = () => (
    <div className="px-4 py-3">
        <p role="alert" className="text-xs text-red-600 text-start">
            {m['classlinkPersonalEmail.error']()}
        </p>
    </div>
);

/**
 * "Keep your account after school" for ClassLink users: add a personal email (one code
 * proves it and makes it the recovery email), then, only if the account still needs it,
 * create a PIN (escrow accounts) or add a passkey / recovery phrase (accounts without
 * escrow), then done. Email code + PIN recovers an escrow account, so a PIN account is
 * never asked for a passkey or phrase. Every screen follows the server's
 * `getAccountContinuity` answer, so the step resumes where the account is and never
 * offers what the district does not allow. The personal email is a recovery path
 * ("I lost access to my school email or login"), not a sign-in method, until the
 * Keycloak cutover. Focus moves to each new screen's title (or the PIN boxes).
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
    const { state, openRecoverySetup, openPinSetup, setEscrowPin } = useAppAuth();
    const queryClient = useQueryClient();
    const continuity = useClassLinkAccountContinuity({ enabled: true });
    const defaultTitle = useKeepAccountTitle(variant !== 'inline' && !title).title;
    const [overlayOpen, setOverlayOpen] = useState(false);
    // Inline: the email form opens from its row.
    const [expanded, setExpanded] = useState(false);
    // "Saved" after the code is accepted: held briefly (onboarding, School Connect), or
    // only until the server's next answer is in (sheet).
    const [saved, setSaved] = useState<'no' | 'showing' | 'shown'>('no');
    const [savedEmail, setSavedEmail] = useState('');
    // The embedded PIN step's own step: "Not now" shows only before the PIN is typed.
    const [pinStep, setPinStep] = useState<RecoveryPinStepState>('enter');
    const headingRef = useRef<HTMLElement>(null);
    const shownRef = useRef(false);
    const handedOffRef = useRef(false);
    const leftRef = useRef(false);
    const data = continuity.data;
    const view = data ? getView(data) : undefined;
    const pastEmail = view === 'pin' || view === 'method' || view === 'done';
    // Email-only hosts are done once the email step is behind the user: at once when it
    // already was, or after "Saved" once the server's new answer is in.
    const handOff =
        emailOnly && (saved === 'no' ? pastEmail : saved === 'shown' && !continuity.isFetching);
    const awaitingNext = saved === 'shown' && view === 'email' && continuity.isFetching;
    const savedView = emailOnly ? saved !== 'no' && !handOff : variant === 'sheet' && awaitingNext;
    const inlineSaved = variant === 'inline' && (saved === 'showing' || awaitingNext);
    const screen = savedView || inlineSaved ? 'saved' : view;
    const pinLocked = data?.pinState === 'locked';
    const analyticsStep: KeepAccountAnalyticsStep | undefined =
        view === 'hidden' || handOff || screen === 'saved' ? undefined : view;

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

    const removeEmail = useRemoveEmail(data?.maskedEmail ?? '', () => {
        setExpanded(false);
        refresh();
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

    // Once past the email, "Saved" is spent (a later removal starts over).
    useEffect(() => {
        if (!emailOnly && saved === 'shown' && view !== 'email') setSaved('no');
    }, [emailOnly, saved, view]);

    useEffect(() => {
        if (!handOff || !data || handedOffRef.current) return;
        handedOffRef.current = true;
        onComplete?.(data);
    }, [handOff, data, onComplete]);

    // Move focus to each new screen's title, so keyboard and screen-reader users land on
    // it instead of the page. Not on the first screen (the host placed focus), and not on
    // the embedded PIN step, which focuses its first box.
    const screenRef = useRef(screen);
    useEffect(() => {
        const previous = screenRef.current;
        screenRef.current = screen;
        if (previous === screen || previous === undefined || previous === 'hidden') return;
        if (screen === 'pin' && variant !== 'inline' && !pinLocked) return;
        headingRef.current?.focus();
    }, [screen, variant, pinLocked]);

    // A sheet or onboarding step must not sit empty (no ClassLink identity, a failed check,
    // or the master switch turned off mid-flow): leave. The inline section just hides.
    const nothingToShow = !continuity.isLoading && (!data || view === 'hidden');
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
    if (view === 'hidden' && !(variant === 'inline' && storedEmail)) return null;

    const heading = variant === 'onboarding' ? 'h1' : 'h2';
    const shellVariant = variant === 'onboarding' ? 'onboarding' : 'sheet';
    const maskedEmail = isolateLtr(data.maskedEmail ?? '');
    // Where recovery codes actually go: a recovery email the user verified earlier is
    // never replaced, so it can differ from the personal email.
    const otherRecoveryEmail = data.maskedRecoveryEmail
        ? isolateLtr(data.maskedRecoveryEmail)
        : undefined;
    const codesTo = otherRecoveryEmail ?? maskedEmail;
    const stepTitle = title ?? defaultTitle;
    // A PIN (or one still to create) is what gets an escrow account back in. Without
    // one yet, the copy promises nothing the email cannot do on its own.
    const emailBody =
        data.pinRecoverable || data.pinState !== 'none'
            ? m['classlinkKeepAccount.body']()
            : m['classlinkKeepAccount.bodyNoPin']();

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

    const emailForm = (layout: 'shell' | 'inline'): React.ReactNode => (
        <PersonalEmailForm
            autoFocus={layout === 'inline'}
            // The row above already says "Personal email".
            hideEmailLabel={layout === 'inline'}
            submitClassName={
                variant === 'onboarding' ? ONBOARDING_PRIMARY_BUTTON_CLASS : PRIMARY_BUTTON_CLASS
            }
            // What the address is for, right where it is typed.
            emailNote={<StoredNote />}
            // Linked, but another account already recovers with this address.
            verifiedEmailError={result =>
                result.recoveryEmailSkipped === 'shared'
                    ? m['classlinkKeepAccount.sharedEmail']()
                    : undefined
            }
            onCodeSent={() =>
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'email' })
            }
            onVerified={(result, email) => {
                track(AnalyticsEvents.KEEP_ACCOUNT_STEP_COMPLETED, { source, step: 'code' });
                if (result.recoveryEmailSkipped === 'shared') return;
                setSavedEmail(email);
                setExpanded(false);
                setSaved(emailOnly || variant === 'inline' ? 'showing' : 'shown');
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

    const canAddBirthDate = data.personalEmail.reason === 'age_unknown' && !!onAddBirthDate;

    const methodLabel =
        getRecommendedMethod() === 'passkey'
            ? m['classlinkKeepAccount.addPasskey']()
            : m['classlinkKeepAccount.addPhrase']();
    const methodBody =
        getRecommendedMethod() === 'passkey'
            ? m['classlinkKeepAccount.methodBody']()
            : m['classlinkKeepAccount.methodBodyPhrase']();

    let content: React.ReactNode;
    if (variant === 'inline') {
        const removeButton = (
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
        );
        // The saved address, with what it does once nothing else is needed.
        const emailRow = (
            <Row
                icon="mail"
                title={m['classlinkKeepAccount.rowLabel']()}
                titleRef={headingRef}
                subtitle={
                    otherRecoveryEmail && view !== 'email'
                        ? `${maskedEmail} · ${m['classlinkKeepAccount.rowCodesTo']({
                              email: otherRecoveryEmail,
                          })}`
                        : view === 'done'
                          ? `${maskedEmail} · ${m['classlinkKeepAccount.rowStatus']()}`
                          : maskedEmail
                }
                action={removeButton}
            />
        );
        // A stored address the step cannot finish with (shared with another account, or
        // the policy now refuses it) stays removable.
        const storedRow = storedEmail && (
            <>
                {emailRow}
                {removeEmail.failed && <RemoveFailed />}
            </>
        );
        if (inlineSaved) {
            // A beat to confirm, then the form folds into the address row.
            content = (
                <>
                    <Row
                        icon="mail"
                        title={m['classlinkKeepAccount.rowLabel']()}
                        subtitle={isolateLtr(savedEmail)}
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
        } else if (view === 'pin' || view === 'method') {
            const pinTitle = pinLocked
                ? m['recovery.pin.pinLocked.title']()
                : m['classlinkKeepAccount.pinTitle']();
            const pinBody = pinLocked
                ? m['recovery.pin.pinLocked.body']()
                : otherRecoveryEmail
                  ? m['classlinkKeepAccount.pinBodyRecoveryEmail']({ email: otherRecoveryEmail })
                  : m['classlinkKeepAccount.pinBody']();
            content = (
                <>
                    {emailRow}
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
                    {removeEmail.failed && <RemoveFailed />}
                </>
            );
        } else if (view === 'done') {
            content = (
                <>
                    {emailRow}
                    {removeEmail.failed && <RemoveFailed />}
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
                    body={
                        otherRecoveryEmail
                            ? m['classlinkKeepAccount.pinBodyRecoveryEmail']({
                                  email: otherRecoveryEmail,
                              })
                            : m['classlinkKeepAccount.pinBody']()
                    }
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
                body={m['recovery.pin.pinLocked.body']()}
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
                    : m['classlinkKeepAccount.doneBodyMethod'])({
                    option: m['recovery.identity.lostSchoolLogin'](),
                    // The address recovery codes go to (the personal email unless the
                    // user verified a different recovery email earlier).
                    email: codesTo,
                })}
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

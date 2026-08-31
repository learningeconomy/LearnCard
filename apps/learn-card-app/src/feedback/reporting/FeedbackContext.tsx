/**
 * Root feedback coordinator (LC-2086 Task 8).
 *
 * `FeedbackProvider` sits near the app root (inside the analytics, router,
 * auth, and modal providers) and owns the whole report lifecycle:
 *
 *   1. **Privacy gating** — destination eligibility (`bug` / `idea`) is
 *      consulted before anything is captured; ineligible users never trigger
 *      a screenshot, context collection, or UI.
 *   2. **Capture** — screenshot and privacy-safe context are collected before
 *      any feedback UI opens, so the composer and prompt toast never appear
 *      in their own attachment.
 *   3. **Presentation** — explicit entry points (Settings, error boundary)
 *      always open the composer, stacking above whatever is on screen.
 *      Automatic triggers (shake, iOS screenshot) open immediately when the
 *      app is idle; while busy they park the draft in a single in-memory
 *      pending slot (newest wins) and offer it through an actionable toast
 *      once the app goes idle again. Pending drafts expire after exactly
 *      300,000 ms and are never persisted.
 *   4. **Submission** — the composer submits through the provider-independent
 *      `FeedbackTransport` boundary. Failures keep the composer open with its
 *      draft and friendly retry state; the `submitImmediately` path (existing
 *      micro-feedback follow-up) bypasses the composer and propagates
 *      transport failures to the caller.
 *
 * The existing micro-feedback frequency governor is deliberately NOT applied
 * here — explicit and automatic reports are never rate-limited by it.
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { getLogger, useModal, ModalTypes, resolveTenantConfig } from 'learn-card-base';
import { toastStore } from 'learn-card-base/stores/toastStore';
import { useAnalytics } from '@analytics';
import * as m from '../../paraglide/messages.js';

import { FeedbackComposer } from './FeedbackComposer';
import { FeedbackPromptToast } from './FeedbackPromptToast';
import {
    captureFeedbackScreenshot,
    type CaptureFeedbackScreenshotOptions,
} from './captureScreenshot';
import { collectFeedbackContext } from './collectFeedbackContext';
import { createFeedbackTransport, type FeedbackAnalyticsAdapter } from './createFeedbackTransport';
import { useFeedbackReportingEligibility } from './eligibility';
import { getRecentFeedbackRoutes, normalizeFeedbackRoute } from './routeHistory';
import {
    isAutomaticFeedbackSource,
    isPendingFeedbackExpired,
    isShakeInCooldown,
} from './triggerPolicy';
import { useAutomaticFeedbackTriggers } from './useAutomaticFeedbackTriggers';
import { useFeedbackBusyState } from './useFeedbackBusyState';
import type {
    FeedbackContext as FeedbackContextData,
    FeedbackDraft,
    FeedbackKind,
    FeedbackReport,
    FeedbackScreenshot,
    FeedbackTransport,
    ReportProblemOptions,
    ShareIdeaOptions,
} from './types';

const log = getLogger('feedback');

/** Entry points exposed to Settings, error boundaries, and native listeners. */
export interface FeedbackController {
    /**
     * Capture and present a bug report.
     *
     * Checks bug eligibility, then captures privacy-safe context before
     * deciding whether to open the composer, defer behind a pending toast, or
     * (for `submitImmediately`) submit without UI. A screenshot attachment is
     * captured for native screenshot and shake triggers. Shake capture is
     * attached lazily after the pre-composer source DOM is frozen.
     */
    reportProblem(options?: ReportProblemOptions): Promise<void>;

    /**
     * Capture and present an idea. Collects idea context (route, tenant, app
     * version — no screenshot, device details, or logs) and opens the
     * composer.
     */
    shareIdea(options?: ShareIdeaOptions): Promise<void>;
}

/** Kind-only context collection input shared with the default collector. */
export interface CollectFeedbackContextForKind {
    kind: FeedbackKind;
}

/** Injectable provider dependencies (tests inject `now`, capture, transport). */
export interface FeedbackProviderDeps {
    /** Epoch-ms clock; defaults to `Date.now`. */
    now?: () => number;
    /** Screenshot capture; defaults to `captureFeedbackScreenshot`. */
    captureScreenshot?: (
        options?: CaptureFeedbackScreenshotOptions
    ) => Promise<FeedbackScreenshot | undefined>;
    /** Context collector; defaults to `collectFeedbackContext` over the
     * bounded route history and offline-resolved tenant config. */
    collectContext?: (input: CollectFeedbackContextForKind) => Promise<FeedbackContextData>;
    /** Submission transport; defaults to `createFeedbackTransport` over the
     * central analytics provider abstraction. */
    transport?: FeedbackTransport;
    /** Browser paint boundary used before shake screenshot capture. */
    waitForPaint?: () => Promise<void>;
}

const FeedbackControllerContext = createContext<FeedbackController | null>(null);
FeedbackControllerContext.displayName = 'Feedback';

/**
 * Wait until the browser has completed at least one paint. Resolving from a
 * second animation frame prevents html2canvas's synchronous DOM clone from
 * blocking the first frame that contains the shake acknowledgement.
 */
const waitForFeedbackIndicatorPaint = (): Promise<void> => {
    if (typeof requestAnimationFrame !== 'function') return Promise.resolve();

    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });
};

/**
 * Access the feedback controller. Must be used inside `FeedbackProvider`.
 */
export const useFeedback = (): FeedbackController => {
    const controller = useContext(FeedbackControllerContext);

    if (!controller) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }

    return controller;
};

/** Wallet display version used when the app/plugin calls cannot resolve one. */
const FALLBACK_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'unknown';
/**
 * Default context collector. The tenant id resolves offline-only: by capture
 * time the config is always bootstrapped (baked, cached, or defaults), so
 * this never blocks on the network.
 */
const defaultCollectContext = async ({
    kind,
}: CollectFeedbackContextForKind): Promise<FeedbackContextData> => {
    let tenantId: string | undefined;
    try {
        ({ tenantId } = await resolveTenantConfig({ offlineOnly: true }));
    } catch {
        tenantId = undefined;
    }

    return collectFeedbackContext(
        { kind, fallbackVersion: FALLBACK_VERSION, tenantId },
        { getRoutes: getRecentFeedbackRoutes }
    );
};

/**
 * Collect only metadata approved for immediate micro-feedback. This must stay
 * independent from `collectFeedbackContext`, which reads native device/network
 * details and diagnostic logs even for its otherwise-minimal idea profile.
 */
const defaultCollectMinimalContext = async (): Promise<FeedbackContextData> => {
    let tenantId: string | undefined;
    try {
        ({ tenantId } = await resolveTenantConfig({ offlineOnly: true }));
    } catch {
        tenantId = undefined;
    }

    const recentRoutes = getRecentFeedbackRoutes();
    return {
        currentRoute: recentRoutes.at(-1) ?? normalizeFeedbackRoute(window.location.pathname),
        recentRoutes,
        ...(tenantId ? { tenantId } : {}),
        app: { platform: 'web', displayVersion: FALLBACK_VERSION },
    };
};

export const FeedbackProvider: React.FC<{
    children: React.ReactNode;
    deps?: FeedbackProviderDeps;
}> = ({ children, deps }) => {
    const eligibility = useFeedbackReportingEligibility();
    const isBusy = useFeedbackBusyState();
    const { newModal, closeModalById } = useModal();
    const analytics = useAnalytics();
    const openingShakeFeedbackTokenRef = useRef<symbol | undefined>(undefined);
    const [openingShakeFeedbackToken, setOpeningShakeFeedbackToken] = useState<symbol | undefined>(
        undefined
    );

    const showOpeningShakeFeedback = useCallback((): symbol => {
        const token = Symbol('opening-shake-feedback');
        openingShakeFeedbackTokenRef.current = token;
        setOpeningShakeFeedbackToken(token);
        return token;
    }, []);

    const hideOpeningShakeFeedback = useCallback((token?: symbol) => {
        if (token !== undefined && openingShakeFeedbackTokenRef.current !== token) return;

        openingShakeFeedbackTokenRef.current = undefined;
        setOpeningShakeFeedbackToken(current => {
            if (token !== undefined && current !== token) return current;
            return undefined;
        });
    }, []);

    // Read dependencies and reactive values at call time through refs so the
    // controller identity stays stable across re-renders.
    const depsRef = useRef<FeedbackProviderDeps>({});
    depsRef.current = deps ?? {};

    const eligibilityRef = useRef(eligibility);
    eligibilityRef.current = eligibility;

    const isBusyRef = useRef(isBusy);
    isBusyRef.current = isBusy;

    const defaultTransport = useMemo<FeedbackTransport>(() => {
        const adapter: FeedbackAnalyticsAdapter = {
            submitFeedbackIdea: analytics.submitFeedbackIdea,
            isReady: analytics.isReady,
            providerName: analytics.providerName,
        };
        return createFeedbackTransport(adapter);
    }, [analytics.submitFeedbackIdea, analytics.isReady, analytics.providerName]);

    const transportRef = useRef<FeedbackTransport>(defaultTransport);
    transportRef.current = depsRef.current.transport ?? defaultTransport;

    /** Last accepted shake (epoch ms) — further shakes inside 10s are ignored. */
    const lastShakeAtRef = useRef<number | undefined>(undefined);

    /** The single deferred automatic draft; newest wins, never persisted. */
    const pendingRef = useRef<FeedbackDraft | undefined>(undefined);

    /**
     * Owns the composer lifecycle from explicit capture start through modal
     * dismissal. The token prevents concurrent captures and stale modal
     * callbacks from replacing or closing another feedback flow.
     */
    const composerFlowOwnerRef = useRef<symbol | undefined>(undefined);

    /** Explicit no-UI submissions temporarily block automatic capture flows. */
    const explicitSubmissionCountRef = useRef(0);

    /** Whether the feedback composer is currently presented. */
    const isComposerOpenRef = useRef(false);
    const composerModalIdRef = useRef<number | undefined>(undefined);

    /** Draft currently represented by the feedback prompt toast, if any. */
    const promptDraftRef = useRef<FeedbackDraft | undefined>(undefined);
    const promptToastRef = useRef<React.ReactNode | undefined>(undefined);

    /** Invalidates asynchronous capture started for an earlier profile/privacy state. */
    const eligibilityGenerationRef = useRef(0);

    /** Newer user intent supersedes any older asynchronous automatic capture. */
    const feedbackIntentGenerationRef = useRef(0);
    const previousEligibilityRef = useRef({
        bug: eligibility.bug,
        idea: eligibility.idea,
        profileId: eligibility.profileId,
    });

    const beginComposerFlow = useCallback((): symbol | undefined => {
        if (composerFlowOwnerRef.current !== undefined) return undefined;

        const owner = Symbol('feedback-composer-flow');
        composerFlowOwnerRef.current = owner;
        return owner;
    }, []);

    const releaseComposerFlow = useCallback((owner: symbol) => {
        if (composerFlowOwnerRef.current === owner) {
            composerFlowOwnerRef.current = undefined;
        }
    }, []);

    const closeFeedbackComposer = useCallback(
        (owner?: symbol) => {
            if (owner !== undefined && composerFlowOwnerRef.current !== owner) return;

            const modalId = composerModalIdRef.current;
            composerModalIdRef.current = undefined;
            isComposerOpenRef.current = false;
            composerFlowOwnerRef.current = undefined;

            if (modalId !== undefined) closeModalById(modalId);
        },
        [closeModalById]
    );

    const dismissFeedbackPrompt = useCallback(() => {
        const prompt = promptToastRef.current;
        promptDraftRef.current = undefined;
        promptToastRef.current = undefined;

        if (prompt && toastStore.get.message() === prompt) {
            toastStore.set.dismissToast();
        }
    }, []);

    // Invalidate only for a destination eligibility transition or actual
    // profile switch; equivalent query-object refreshes preserve valid UI.
    useEffect(() => {
        const nextEligibility = {
            bug: eligibility.bug,
            idea: eligibility.idea,
            profileId: eligibility.profileId,
        };
        const previousEligibility = previousEligibilityRef.current;
        if (
            previousEligibility.bug === nextEligibility.bug &&
            previousEligibility.idea === nextEligibility.idea &&
            previousEligibility.profileId === nextEligibility.profileId
        ) {
            return;
        }

        previousEligibilityRef.current = nextEligibility;
        eligibilityGenerationRef.current += 1;
        hideOpeningShakeFeedback();
        pendingRef.current = undefined;
        dismissFeedbackPrompt();
        closeFeedbackComposer();
    }, [
        closeFeedbackComposer,
        dismissFeedbackPrompt,
        eligibility.bug,
        eligibility.idea,
        eligibility.profileId,
        hideOpeningShakeFeedback,
    ]);

    const submitAndClose = useCallback(
        async (report: FeedbackReport, captureGeneration: number, owner: symbol) => {
            if (
                composerFlowOwnerRef.current !== owner ||
                captureGeneration !== eligibilityGenerationRef.current ||
                !eligibilityRef.current[report.kind]
            ) {
                return;
            }

            try {
                await transportRef.current.submit(report);
            } catch (error) {
                // Swallow nothing: the rejection propagates to FeedbackComposer,
                // which keeps its draft open with the friendly retry banner. The
                // raw error is never user-visible.
                log.error('feedback.submit.failed', error);
                throw error;
            }

            closeFeedbackComposer(owner);
            toastStore.set.presentToast(m['feedback.reporting.thanks']());
        },
        [closeFeedbackComposer]
    );

    /**
     * Surface-close hook for the composer modal. Invoked by the modal system
     * itself (dimmer tap / close button) AND by `closeModalById` via the
     * modal options — it must never close a modal itself, or the modal beneath
     * the composer could be affected.
     */
    const handleComposerClosed = useCallback((owner: symbol) => {
        if (composerFlowOwnerRef.current !== owner) return;

        isComposerOpenRef.current = false;
        composerModalIdRef.current = undefined;
        composerFlowOwnerRef.current = undefined;
    }, []);

    const openComposer = useCallback(
        (
            draft: FeedbackDraft,
            requestedOwner?: symbol,
            pendingScreenshot?: Promise<FeedbackScreenshot | undefined>,
            pendingContext?: Promise<FeedbackContextData>
        ): boolean => {
            const owner = requestedOwner ?? beginComposerFlow();
            if (owner === undefined || composerFlowOwnerRef.current !== owner) return false;

            const captureGeneration = eligibilityGenerationRef.current;
            isComposerOpenRef.current = true;

            const composer = (
                <FeedbackComposer
                    draft={draft}
                    pendingScreenshot={pendingScreenshot}
                    pendingContext={pendingContext}
                    onCancel={() => closeFeedbackComposer(owner)}
                    onSubmit={report => submitAndClose(report, captureGeneration, owner)}
                />
            );

            try {
                composerModalIdRef.current = newModal(
                    composer,
                    {
                        sectionClassName: '!max-w-[480px] !bg-white',
                        onClose: () => handleComposerClosed(owner),
                    },
                    { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
                );
                return true;
            } catch (error) {
                isComposerOpenRef.current = false;
                composerModalIdRef.current = undefined;
                releaseComposerFlow(owner);
                throw error;
            }
        },
        [
            beginComposerFlow,
            closeFeedbackComposer,
            handleComposerClosed,
            newModal,
            releaseComposerFlow,
            submitAndClose,
        ]
    );

    const presentPromptToast = useCallback(
        (draft: FeedbackDraft) => {
            promptDraftRef.current = draft;
            let prompt: React.ReactNode;
            prompt = (
                <FeedbackPromptToast
                    onReport={() => {
                        if (
                            promptDraftRef.current !== draft ||
                            promptToastRef.current !== prompt ||
                            toastStore.get.message() !== prompt ||
                            !eligibilityRef.current.bug
                        ) {
                            return;
                        }

                        // Accepting an earlier prompt is newer explicit intent:
                        // retire any shake still freezing its screenshot so it
                        // cannot leave a cue behind or reopen after this closes.
                        hideOpeningShakeFeedback();
                        feedbackIntentGenerationRef.current += 1;
                        dismissFeedbackPrompt();
                        openComposer(draft);
                    }}
                    onDismiss={dismissFeedbackPrompt}
                />
            );
            promptToastRef.current = prompt;
            toastStore.set.presentToast(prompt, { autoDismiss: false });
        },
        [dismissFeedbackPrompt, hideOpeningShakeFeedback, openComposer]
    );

    // Offer the pending draft when the app transitions busy → idle. Pending
    // is cleared BEFORE presenting its toast so a newer automatic trigger
    // captured in between replaces cleanly, and expired drafts are dropped.
    const wasBusyRef = useRef(isBusy);
    useEffect(() => {
        if (wasBusyRef.current && !isBusy) {
            const pending = pendingRef.current;
            pendingRef.current = undefined;

            if (
                pending &&
                eligibilityRef.current.bug &&
                !isPendingFeedbackExpired(pending.capturedAt, depsRef.current.now?.() ?? Date.now())
            ) {
                presentPromptToast(pending);
            }
        }
        wasBusyRef.current = isBusy;
    }, [isBusy, presentPromptToast]);

    const captureBugDraft = useCallback(
        async (
            source: ReportProblemOptions['source'],
            options: ReportProblemOptions
        ): Promise<{
            draft: FeedbackDraft;
            pendingScreenshot?: Promise<FeedbackScreenshot | undefined>;
            pendingContext?: Promise<FeedbackContextData>;
        }> => {
            const { now, captureScreenshot, collectContext } = {
                now: Date.now,
                captureScreenshot: captureFeedbackScreenshot,
                collectContext: defaultCollectContext,
                ...depsRef.current,
            };

            const contextPromise = collectContext({ kind: 'bug' });

            // A shake begins rendering before the composer opens. As soon as
            // html2canvas owns an isolated clone, the live UI is safe to
            // change and the remaining PNG work can finish in the composer.
            if (source === 'shake') {
                let markSourceFrozen!: () => void;
                const sourceFrozen = new Promise<void>(resolve => {
                    markSourceFrozen = resolve;
                });
                const pendingScreenshot = captureScreenshot({
                    onSourceFrozen: markSourceFrozen,
                });
                // Test doubles and alternate capture implementations may not
                // support the callback; settlement is still a safe fallback.
                void pendingScreenshot.then(markSourceFrozen, markSourceFrozen);

                await sourceFrozen;

                const recentRoutes = getRecentFeedbackRoutes();
                const immediateContext: FeedbackContextData = {
                    currentRoute:
                        recentRoutes.at(-1) ?? normalizeFeedbackRoute(window.location.pathname),
                    recentRoutes,
                };
                const pendingContext = contextPromise.catch(() => immediateContext);

                return {
                    draft: {
                        kind: 'bug',
                        source,
                        capturedAt: new Date(now()).toISOString(),
                        context: immediateContext,
                        ...(options.associatedEventId
                            ? { associatedEventId: options.associatedEventId }
                            : {}),
                        ...(options.initialMessage
                            ? { initialMessage: options.initialMessage }
                            : {}),
                    },
                    pendingScreenshot,
                    pendingContext,
                };
            }

            const [screenshot, context] = await Promise.all([
                source === 'screenshot' ? captureScreenshot() : Promise.resolve(undefined),
                contextPromise,
            ]);

            return {
                draft: {
                    kind: 'bug',
                    source: source ?? 'settings',
                    capturedAt: new Date(now()).toISOString(),
                    ...(screenshot ? { screenshot } : {}),
                    context,
                    ...(options.associatedEventId
                        ? { associatedEventId: options.associatedEventId }
                        : {}),
                    ...(options.initialMessage ? { initialMessage: options.initialMessage } : {}),
                },
            };
        },
        []
    );

    const reportProblem = useCallback(
        async (options: ReportProblemOptions = {}) => {
            const source = options.source ?? 'settings';
            const now = depsRef.current.now ?? Date.now;

            const isAutomatic = isAutomaticFeedbackSource(source);

            if (
                isAutomatic &&
                (composerFlowOwnerRef.current !== undefined ||
                    explicitSubmissionCountRef.current > 0)
            ) {
                // A feedback composer flow is already capturing or presented —
                // never queue another automatic report behind it.
                return;
            }

            // Privacy gate first: ineligible users never capture anything.
            if (!eligibilityRef.current.bug) return;

            const captureGeneration = eligibilityGenerationRef.current;

            if (source === 'shake') {
                const timestamp = now();
                if (isShakeInCooldown(timestamp, lastShakeAtRef.current)) return;
                lastShakeAtRef.current = timestamp;
            }

            let explicitOwner: symbol | undefined;
            let intentGeneration: number;
            if (!isAutomatic && options.submitImmediately !== true) {
                explicitOwner = beginComposerFlow();
                if (explicitOwner === undefined) return;
                intentGeneration = feedbackIntentGenerationRef.current + 1;
                feedbackIntentGenerationRef.current = intentGeneration;
            } else {
                intentGeneration = feedbackIntentGenerationRef.current + 1;
                feedbackIntentGenerationRef.current = intentGeneration;
                if (isAutomatic) pendingRef.current = undefined;
            }

            // Every accepted feedback intent supersedes an older shake cue.
            // Token ownership prevents an older capture's cleanup from hiding
            // a newer shake cue after the cooldown expires.
            hideOpeningShakeFeedback();

            if (!isAutomatic) {
                pendingRef.current = undefined;
                dismissFeedbackPrompt();
            }

            if (source === 'micro-feedback' && options.submitImmediately === true) {
                const message = options.initialMessage?.trim() ?? '';
                if (!message) {
                    throw new Error('submitImmediately requires a non-empty initialMessage');
                }

                explicitSubmissionCountRef.current += 1;
                try {
                    const context = await defaultCollectMinimalContext();

                    if (
                        captureGeneration !== eligibilityGenerationRef.current ||
                        !eligibilityRef.current.bug
                    ) {
                        return;
                    }

                    await transportRef.current.submit({
                        kind: 'bug',
                        source,
                        capturedAt: new Date(now()).toISOString(),
                        context,
                        message,
                    });
                } finally {
                    explicitSubmissionCountRef.current -= 1;
                }
                return;
            }

            let keepExplicitOwnership = false;
            const openingIndicatorToken =
                source === 'shake' && !isBusyRef.current ? showOpeningShakeFeedback() : undefined;
            try {
                if (openingIndicatorToken) {
                    await (depsRef.current.waitForPaint ?? waitForFeedbackIndicatorPaint)();

                    if (
                        captureGeneration !== eligibilityGenerationRef.current ||
                        intentGeneration !== feedbackIntentGenerationRef.current ||
                        !eligibilityRef.current.bug
                    ) {
                        return;
                    }
                }

                let { draft, pendingScreenshot, pendingContext } = await captureBugDraft(
                    source,
                    options
                );
                if (openingIndicatorToken) hideOpeningShakeFeedback(openingIndicatorToken);

                if (
                    captureGeneration !== eligibilityGenerationRef.current ||
                    intentGeneration !== feedbackIntentGenerationRef.current ||
                    !eligibilityRef.current.bug
                ) {
                    return;
                }

                if (options.submitImmediately === true) {
                    // Micro-feedback follow-up compatibility path: submit the same
                    // privacy-safe draft without ever opening a composer.
                    const message = options.initialMessage?.trim() ?? '';
                    if (!message) {
                        throw new Error('submitImmediately requires a non-empty initialMessage');
                    }

                    await transportRef.current.submit({ ...draft, message });
                    return;
                }

                if (!isAutomatic) {
                    // Explicit entry points always open — the feedback modal
                    // stacks above whatever is already on screen (e.g. Settings).
                    keepExplicitOwnership = openComposer(draft, explicitOwner);
                    return;
                }

                if (composerFlowOwnerRef.current !== undefined) return;

                if (isBusyRef.current) {
                    // Capture now, present later. A newer automatic draft simply
                    // replaces this one.
                    if (pendingScreenshot) {
                        const [screenshot, context] = await Promise.all([
                            pendingScreenshot,
                            pendingContext ?? Promise.resolve(draft.context),
                        ]);
                        if (
                            captureGeneration !== eligibilityGenerationRef.current ||
                            intentGeneration !== feedbackIntentGenerationRef.current ||
                            !eligibilityRef.current.bug ||
                            composerFlowOwnerRef.current !== undefined
                        ) {
                            return;
                        }
                        draft = {
                            ...draft,
                            context,
                            ...(screenshot ? { screenshot } : {}),
                        };
                        pendingScreenshot = undefined;
                        pendingContext = undefined;
                    }
                    if (isBusyRef.current) {
                        pendingRef.current = draft;
                    } else {
                        presentPromptToast(draft);
                    }
                    return;
                }

                if (source === 'screenshot') {
                    presentPromptToast(draft);
                    return;
                }

                // Shake while idle opens the composer right away.
                openComposer(draft, undefined, pendingScreenshot, pendingContext);
            } finally {
                if (openingIndicatorToken) hideOpeningShakeFeedback(openingIndicatorToken);
                if (explicitOwner !== undefined && !keepExplicitOwnership) {
                    releaseComposerFlow(explicitOwner);
                }
            }
        },
        [
            beginComposerFlow,
            captureBugDraft,
            dismissFeedbackPrompt,
            hideOpeningShakeFeedback,
            openComposer,
            presentPromptToast,
            releaseComposerFlow,
            showOpeningShakeFeedback,
        ]
    );

    const shareIdea = useCallback(
        async (options: ShareIdeaOptions = {}) => {
            if (!eligibilityRef.current.idea) return;

            const owner = beginComposerFlow();
            if (owner === undefined) return;

            // An explicit idea flow supersedes any automatic bug capture that
            // is still rendering in the background.
            hideOpeningShakeFeedback();
            feedbackIntentGenerationRef.current += 1;
            pendingRef.current = undefined;
            dismissFeedbackPrompt();

            const captureGeneration = eligibilityGenerationRef.current;

            const { now, collectContext } = {
                now: Date.now,
                collectContext: defaultCollectContext,
                ...depsRef.current,
            };

            let keepOwnership = false;
            try {
                const context = await collectContext({ kind: 'idea' });

                if (
                    captureGeneration !== eligibilityGenerationRef.current ||
                    !eligibilityRef.current.idea
                ) {
                    return;
                }

                keepOwnership = openComposer(
                    {
                        kind: 'idea',
                        source: options.source ?? 'settings',
                        capturedAt: new Date(now()).toISOString(),
                        context,
                        ...(options.initialMessage
                            ? { initialMessage: options.initialMessage }
                            : {}),
                    },
                    owner
                );
            } finally {
                if (!keepOwnership) releaseComposerFlow(owner);
            }
        },
        [
            beginComposerFlow,
            dismissFeedbackPrompt,
            hideOpeningShakeFeedback,
            openComposer,
            releaseComposerFlow,
        ]
    );

    const controller = useMemo<FeedbackController>(
        () => ({ reportProblem, shareIdea }),
        [reportProblem, shareIdea]
    );

    // Automatic entry points (shake, iOS screenshot) mount their native
    // listeners here; registration is gated by bug eligibility and, for
    // shakes, the LaunchDarkly `shakeToReportEnabled` flag.
    useAutomaticFeedbackTriggers({
        enabled: eligibility.bug,
        reportProblem: controller.reportProblem,
    });

    return (
        <FeedbackControllerContext.Provider value={controller}>
            {children}
            {openingShakeFeedbackToken && (
                <div
                    role="status"
                    aria-label={m['feedback.reporting.openingFeedbackForm']()}
                    data-feedback-exclude
                    className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+var(--lc-overlay-inset-top,var(--ion-safe-area-top,0px)))] z-[100000] flex justify-center px-4 font-poppins"
                >
                    <div className="w-full max-w-[240px] overflow-hidden rounded-[20px] border border-grayscale-200 bg-white/95 shadow-lg backdrop-blur-sm">
                        <div className="px-4 py-2.5 text-center text-xs font-medium text-grayscale-700">
                            {m['feedback.reporting.openingFeedbackForm']()}
                        </div>
                        <div className="h-0.5 overflow-hidden bg-grayscale-100">
                            <div className="h-full w-full bg-grayscale-600 motion-safe:animate-pulse" />
                        </div>
                    </div>
                </div>
            )}
        </FeedbackControllerContext.Provider>
    );
};

export default FeedbackProvider;

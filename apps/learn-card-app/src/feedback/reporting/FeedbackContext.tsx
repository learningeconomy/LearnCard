/**
 * Root feedback coordinator (LC-2086 Task 8).
 *
 * `FeedbackProvider` sits near the app root (inside the analytics, router,
 * auth, and modal providers) and owns the whole report lifecycle:
 *
 *   1. **Privacy gating** — destination eligibility (`bug` / `idea`) is
 *      consulted before anything is captured; ineligible users never trigger
 *      a screenshot, context collection, or UI.
 *   2. **Capture** — privacy-safe context is collected for every report. The
 *      native screenshot trigger preserves the captured screen, while shake
 *      opens immediately without taking one automatically.
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

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

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
import {
    clearFeedbackRouteHistory,
    getRecentFeedbackRoutes,
    normalizeFeedbackRoute,
} from './routeHistory';
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
    /** Whether the active profile may submit bug reports. */
    bugEligible: boolean;

    /**
     * Capture and present a bug report.
     *
     * Checks bug eligibility, starts privacy-safe context collection, then
     * opens immediately with route-only context or defers behind a pending
     * toast. Native screenshot triggers preserve their captured screen; shake
     * opens immediately and lets the user add an optional library image.
     */
    reportProblem(options?: ReportProblemOptions): Promise<void>;

    /**
     * Capture and present an idea. Collects idea context (route, tenant, app
     * version — no automatic screenshot, device details, or logs) and opens
     * the composer, where the user may attach an image explicitly.
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
}

const FeedbackControllerContext = createContext<FeedbackController | null>(null);
FeedbackControllerContext.displayName = 'Feedback';

/** Access the controller when feedback may not be mounted for this app surface. */
export const useFeedbackOptional = (): FeedbackController | null =>
    useContext(FeedbackControllerContext);

/**
 * Access the feedback controller. Must be used inside `FeedbackProvider`.
 */
export const useFeedback = (): FeedbackController => {
    const controller = useFeedbackOptional();

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

const FEEDBACK_CONTEXT_DEADLINE_MS = 2_000;

/** Route-only context that is safe to construct synchronously before UI opens. */
const collectImmediateContext = (): FeedbackContextData => {
    const recentRoutes = getRecentFeedbackRoutes();
    return {
        currentRoute: recentRoutes.at(-1) ?? normalizeFeedbackRoute(window.location.pathname),
        recentRoutes,
    };
};

/** Rich diagnostics are best-effort and must never hold the feedback UI open. */
const resolveContextByDeadline = (
    contextPromise: Promise<FeedbackContextData>,
    fallback: FeedbackContextData
): Promise<FeedbackContextData> =>
    new Promise(resolve => {
        const timeout = setTimeout(() => resolve(fallback), FEEDBACK_CONTEXT_DEADLINE_MS);
        void contextPromise.then(
            context => {
                clearTimeout(timeout);
                resolve(context);
            },
            () => {
                clearTimeout(timeout);
                resolve(fallback);
            }
        );
    });

export const FeedbackProvider: React.FC<{
    children: React.ReactNode;
    deps?: FeedbackProviderDeps;
}> = ({ children, deps }) => {
    const eligibility = useFeedbackReportingEligibility();
    const isBusy = useFeedbackBusyState();
    const { newModal, closeModalById } = useModal();
    const analytics = useAnalytics();
    // Read dependencies and reactive values at call time through refs so the
    // controller identity stays stable across re-renders.
    const depsRef = useRef<FeedbackProviderDeps>({});
    depsRef.current = deps ?? {};

    const eligibilityRef = useRef(eligibility);
    eligibilityRef.current = eligibility;

    const isBusyRef = useRef(isBusy);
    isBusyRef.current = isBusy;

    // Route history is diagnostic data owned by the active profile. Clear it
    // before a different profile can inherit it and when the provider unmounts.
    useEffect(() => () => clearFeedbackRouteHistory(), [eligibility.profileId]);

    const defaultTransport = useMemo<FeedbackTransport>(() => {
        const adapter: FeedbackAnalyticsAdapter = {
            submitFeedbackIdea: analytics.submitFeedbackIdea,
            isReady: analytics.isReady,
            providerName: analytics.providerName,
            bugEligible: eligibility.bug,
        };
        return createFeedbackTransport(adapter);
    }, [analytics.submitFeedbackIdea, analytics.isReady, analytics.providerName, eligibility.bug]);

    const transportRef = useRef<FeedbackTransport>(defaultTransport);
    transportRef.current = depsRef.current.transport ?? defaultTransport;

    /** Last accepted shake (epoch ms) — further shakes inside 10s are ignored. */
    const lastShakeAtRef = useRef<number | undefined>(undefined);

    /** The single deferred automatic draft; newest wins, never persisted. */
    const pendingRef = useRef<
        | {
              draft: FeedbackDraft;
              pendingContext?: Promise<FeedbackContextData>;
          }
        | undefined
    >(undefined);

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
        pendingRef.current = undefined;
        dismissFeedbackPrompt();
        closeFeedbackComposer();
    }, [
        closeFeedbackComposer,
        dismissFeedbackPrompt,
        eligibility.bug,
        eligibility.idea,
        eligibility.profileId,
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
            pendingContext?: Promise<FeedbackContextData>
        ): boolean => {
            const owner = requestedOwner ?? beginComposerFlow();
            if (owner === undefined || composerFlowOwnerRef.current !== owner) return false;

            const captureGeneration = eligibilityGenerationRef.current;
            isComposerOpenRef.current = true;

            const composer = (
                <FeedbackComposer
                    draft={draft}
                    pendingContext={pendingContext}
                    allowScreenshot={draft.kind === 'bug' || eligibilityRef.current.bug}
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
        (draft: FeedbackDraft, pendingContext?: Promise<FeedbackContextData>) => {
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

                        // Accepting an earlier prompt is newer explicit intent,
                        // so older asynchronous automatic work cannot reopen.
                        feedbackIntentGenerationRef.current += 1;
                        dismissFeedbackPrompt();
                        openComposer(draft, undefined, pendingContext);
                    }}
                    onDismiss={dismissFeedbackPrompt}
                    source={draft.source === 'screenshot' ? 'screenshot' : 'shake'}
                />
            );
            promptToastRef.current = prompt;
            toastStore.set.presentToast(prompt, { autoDismiss: false });
        },
        [dismissFeedbackPrompt, openComposer]
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
                !isPendingFeedbackExpired(
                    pending.draft.capturedAt,
                    depsRef.current.now?.() ?? Date.now()
                )
            ) {
                presentPromptToast(pending.draft, pending.pendingContext);
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
            pendingContext?: Promise<FeedbackContextData>;
        }> => {
            const { now, captureScreenshot, collectContext } = {
                now: Date.now,
                captureScreenshot: captureFeedbackScreenshot,
                collectContext: defaultCollectContext,
                ...depsRef.current,
            };

            const immediateContext = collectImmediateContext();
            const pendingContext = resolveContextByDeadline(
                collectContext({ kind: 'bug' }),
                immediateContext
            );

            // Shake should feel immediate. Start richer diagnostics in the
            // background, but never block the composer on screenshot capture.
            if (source === 'shake') {
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
                    pendingContext,
                };
            }

            const screenshot = source === 'screenshot' ? await captureScreenshot() : undefined;

            return {
                draft: {
                    kind: 'bug',
                    source: source ?? 'settings',
                    capturedAt: new Date(now()).toISOString(),
                    ...(screenshot ? { screenshot } : {}),
                    context: immediateContext,
                    ...(options.associatedEventId
                        ? { associatedEventId: options.associatedEventId }
                        : {}),
                    ...(options.initialMessage ? { initialMessage: options.initialMessage } : {}),
                },
                pendingContext,
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
            try {
                const { draft, pendingContext } = await captureBugDraft(source, options);

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
                    keepExplicitOwnership = openComposer(draft, explicitOwner, pendingContext);
                    return;
                }

                if (composerFlowOwnerRef.current !== undefined) return;

                if (isBusyRef.current) {
                    // Capture now, present later. A newer automatic draft simply
                    // replaces this one.
                    pendingRef.current = { draft, pendingContext };
                    return;
                }

                if (source === 'screenshot') {
                    presentPromptToast(draft, pendingContext);
                    return;
                }

                // Shake while idle opens the composer right away.
                openComposer(draft, undefined, pendingContext);
            } finally {
                if (explicitOwner !== undefined && !keepExplicitOwnership) {
                    releaseComposerFlow(explicitOwner);
                }
            }
        },
        [
            beginComposerFlow,
            captureBugDraft,
            dismissFeedbackPrompt,
            openComposer,
            presentPromptToast,
            releaseComposerFlow,
        ]
    );

    const shareIdea = useCallback(
        async (options: ShareIdeaOptions = {}) => {
            if (!eligibilityRef.current.idea) return;

            const owner = beginComposerFlow();
            if (owner === undefined) return;

            // An explicit idea flow supersedes any older automatic bug work.
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
                const immediateContext = collectImmediateContext();
                const pendingContext = resolveContextByDeadline(
                    collectContext({ kind: 'idea' }),
                    immediateContext
                );

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
                        context: immediateContext,
                        ...(options.initialMessage
                            ? { initialMessage: options.initialMessage }
                            : {}),
                    },
                    owner,
                    pendingContext
                );
            } finally {
                if (!keepOwnership) releaseComposerFlow(owner);
            }
        },
        [beginComposerFlow, dismissFeedbackPrompt, openComposer, releaseComposerFlow]
    );

    const controller = useMemo<FeedbackController>(
        () => ({ reportProblem, shareIdea, bugEligible: eligibility.bug }),
        [reportProblem, shareIdea, eligibility.bug]
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
        </FeedbackControllerContext.Provider>
    );
};

export default FeedbackProvider;

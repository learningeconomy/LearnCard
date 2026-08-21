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

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { getLogger, useModal, ModalTypes, resolveTenantConfig } from 'learn-card-base';
import { toastStore } from 'learn-card-base/stores/toastStore';
import { useAnalytics } from '@analytics';
import * as m from '../../paraglide/messages.js';

import { FeedbackComposer } from './FeedbackComposer';
import { FeedbackPromptToast } from './FeedbackPromptToast';
import { captureFeedbackScreenshot } from './captureScreenshot';
import { collectFeedbackContext } from './collectFeedbackContext';
import { createFeedbackTransport, type FeedbackAnalyticsAdapter } from './createFeedbackTransport';
import { useFeedbackReportingEligibility } from './eligibility';
import { getRecentFeedbackRoutes } from './routeHistory';
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
     * Checks bug eligibility, then captures the screenshot and privacy-safe
     * context before deciding whether to open the composer, defer behind a
     * pending toast, or (for `submitImmediately`) submit without UI.
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
    captureScreenshot?: () => Promise<FeedbackScreenshot | undefined>;
    /** Context collector; defaults to `collectFeedbackContext` over the
     * bounded route history and offline-resolved tenant config. */
    collectContext?: (input: CollectFeedbackContextForKind) => Promise<FeedbackContextData>;
    /** Submission transport; defaults to `createFeedbackTransport` over the
     * central analytics provider abstraction. */
    transport?: FeedbackTransport;
}

const FeedbackControllerContext = createContext<FeedbackController | null>(null);
FeedbackControllerContext.displayName = 'Feedback';

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
const ROUTE_WORD = /^[a-zA-Z][a-zA-Z-]*$/;

/** Mirror the route-history normalization without loading analytics providers. */
const normalizeMinimalRoute = (pathname: string): string => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return '/';

    return `/${segments.map(segment => (ROUTE_WORD.test(segment) ? segment : ':id')).join('/')}`;
};

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
        currentRoute: recentRoutes.at(-1) ?? normalizeMinimalRoute(window.location.pathname),
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
            track: analytics.track,
            trackAnonymous: analytics.trackAnonymous,
            isReady: analytics.isReady,
            providerName: analytics.providerName,
        };
        return createFeedbackTransport(adapter);
    }, [analytics.track, analytics.trackAnonymous, analytics.isReady, analytics.providerName]);

    const transportRef = useRef<FeedbackTransport>(defaultTransport);
    transportRef.current = depsRef.current.transport ?? defaultTransport;

    /** Last accepted shake (epoch ms) — further shakes inside 10s are ignored. */
    const lastShakeAtRef = useRef<number | undefined>(undefined);

    /** The single deferred automatic draft; newest wins, never persisted. */
    const pendingRef = useRef<FeedbackDraft | undefined>(undefined);

    /** Whether the feedback composer is currently presented. */
    const isComposerOpenRef = useRef(false);
    const composerModalIdRef = useRef<number | undefined>(undefined);

    /** Draft currently represented by the feedback prompt toast, if any. */
    const promptDraftRef = useRef<FeedbackDraft | undefined>(undefined);
    const promptToastRef = useRef<React.ReactNode | undefined>(undefined);

    /** Invalidates asynchronous capture started for an earlier profile/privacy state. */
    const eligibilityGenerationRef = useRef(0);
    const previousEligibilityRef = useRef({
        bug: eligibility.bug,
        idea: eligibility.idea,
        profileId: eligibility.profileId,
    });

    const closeFeedbackComposer = useCallback(() => {
        const modalId = composerModalIdRef.current;
        composerModalIdRef.current = undefined;
        isComposerOpenRef.current = false;

        if (modalId !== undefined) closeModalById(modalId);
    }, [closeModalById]);

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
        async (report: FeedbackReport, captureGeneration: number) => {
            if (
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

            isComposerOpenRef.current = false;
            closeFeedbackComposer();
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
    const handleComposerClosed = useCallback(() => {
        isComposerOpenRef.current = false;
        composerModalIdRef.current = undefined;
    }, []);

    const openComposer = useCallback(
        (draft: FeedbackDraft) => {
            const captureGeneration = eligibilityGenerationRef.current;
            isComposerOpenRef.current = true;

            const composer = (
                <FeedbackComposer
                    draft={draft}
                    onCancel={closeFeedbackComposer}
                    onSubmit={report => submitAndClose(report, captureGeneration)}
                />
            );
            composerModalIdRef.current = newModal(
                composer,
                { sectionClassName: '!max-w-[480px]', onClose: handleComposerClosed },
                { desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen }
            );
        },
        [closeFeedbackComposer, handleComposerClosed, newModal, submitAndClose]
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

                        dismissFeedbackPrompt();
                        openComposer(draft);
                    }}
                    onDismiss={dismissFeedbackPrompt}
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
        ): Promise<FeedbackDraft> => {
            const { now, captureScreenshot, collectContext } = {
                now: Date.now,
                captureScreenshot: captureFeedbackScreenshot,
                collectContext: defaultCollectContext,
                ...depsRef.current,
            };

            // Screenshot and context are independent — capture both in
            // parallel before any feedback UI exists.
            const [screenshot, context] = await Promise.all([
                captureScreenshot(),
                collectContext({ kind: 'bug' }),
            ]);

            return {
                kind: 'bug',
                source: source ?? 'settings',
                capturedAt: new Date(now()).toISOString(),
                ...(screenshot ? { screenshot } : {}),
                context,
                ...(options.associatedEventId
                    ? { associatedEventId: options.associatedEventId }
                    : {}),
                ...(options.initialMessage ? { initialMessage: options.initialMessage } : {}),
            };
        },
        []
    );

    const reportProblem = useCallback(
        async (options: ReportProblemOptions = {}) => {
            const source = options.source ?? 'settings';
            const now = depsRef.current.now ?? Date.now;

            if (isAutomaticFeedbackSource(source) && isComposerOpenRef.current) {
                // Feedback UI is already active — never queue a second report
                // behind an open composer.
                return;
            }

            // Privacy gate first: ineligible users never capture anything.
            if (!eligibilityRef.current.bug) return;

            const captureGeneration = eligibilityGenerationRef.current;

            if (source === 'micro-feedback' && options.submitImmediately === true) {
                const message = options.initialMessage?.trim() ?? '';
                if (!message) {
                    throw new Error('submitImmediately requires a non-empty initialMessage');
                }

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
                return;
            }

            if (source === 'shake') {
                const timestamp = now();
                if (isShakeInCooldown(timestamp, lastShakeAtRef.current)) return;
                lastShakeAtRef.current = timestamp;
            }

            const draft = await captureBugDraft(source, options);

            if (
                captureGeneration !== eligibilityGenerationRef.current ||
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

            if (!isAutomaticFeedbackSource(source)) {
                // Explicit entry points always open — the feedback modal
                // stacks above whatever is already on screen (e.g. Settings).
                openComposer(draft);
                return;
            }

            if (isBusyRef.current) {
                // Capture now, present later. A newer automatic draft simply
                // replaces this one.
                pendingRef.current = draft;
                return;
            }

            if (source === 'screenshot') {
                presentPromptToast(draft);
                return;
            }

            // Shake while idle opens the composer right away.
            openComposer(draft);
        },
        [captureBugDraft, openComposer, presentPromptToast]
    );

    const shareIdea = useCallback(
        async (options: ShareIdeaOptions = {}) => {
            if (!eligibilityRef.current.idea) return;

            const captureGeneration = eligibilityGenerationRef.current;

            const { now, collectContext } = {
                now: Date.now,
                collectContext: defaultCollectContext,
                ...depsRef.current,
            };

            const context = await collectContext({ kind: 'idea' });

            if (
                captureGeneration !== eligibilityGenerationRef.current ||
                !eligibilityRef.current.idea
            ) {
                return;
            }

            openComposer({
                kind: 'idea',
                source: options.source ?? 'settings',
                capturedAt: new Date(now()).toISOString(),
                context,
                ...(options.initialMessage ? { initialMessage: options.initialMessage } : {}),
            });
        },
        [openComposer]
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
        </FeedbackControllerContext.Provider>
    );
};

export default FeedbackProvider;

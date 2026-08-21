import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, render } from '@testing-library/react';
import React, { type ReactElement } from 'react';

/**
 * Coordinator behavior tests (LC-2086 Task 8).
 *
 * The provider is rendered with injected `now`, screenshot, context, and
 * transport dependencies. The modal host (`useModal`), toast store, busy
 * state, and eligibility are stubbed through module mocks so every branch —
 * immediate open, deferred toast, pending replacement/expiry, immediate
 * submission, and eligibility failures — is observable in isolation.
 */

const busy = vi.hoisted(() => ({ value: false }));

const eligibility = vi.hoisted(() => ({
    value: { bug: true, idea: true, isLoading: false, profileId: 'adult-a' as string | undefined },
}));

const toastState = vi.hoisted(() => ({ message: undefined as ReactElement | string | undefined }));

const modalHost = vi.hoisted(() => ({
    nextModalId: 0,
    openModal: vi.fn(() => modalHost.nextModalId++),
    closeModal: vi.fn(),
    closeModalById: vi.fn(),
    presentToast: vi.fn(),
    dismissToast: vi.fn(),
}));

vi.mock('./useFeedbackBusyState', () => ({
    useFeedbackBusyState: () => busy.value,
}));

const automaticTriggers = vi.hoisted(() => ({ calls: [] as Array<Record<string, unknown>> }));

vi.mock('./useAutomaticFeedbackTriggers', () => ({
    useAutomaticFeedbackTriggers: (input: Record<string, unknown>) => {
        automaticTriggers.calls.push(input);
    },
}));

vi.mock('./eligibility', () => ({
    useFeedbackReportingEligibility: () => eligibility.value,
}));

// The learn-card-base barrel pulls the web3auth stack and cannot load under
// jsdom; stub the exact surface the provider consumes.
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    ModalTypes: { Center: 'center', FullScreen: 'full-screen' },
    useModal: () => ({
        newModal: modalHost.openModal,
        replaceModal: vi.fn(),
        closeModal: modalHost.closeModal,
        closeModalById: modalHost.closeModalById,
        closeAllModals: vi.fn(),
    }),
}));

vi.mock('learn-card-base/stores/toastStore', () => ({
    toastStore: {
        get: { message: () => toastState.message },
        set: {
            presentToast: (message: ReactElement | string, options?: Record<string, unknown>) => {
                toastState.message = message;
                if (options === undefined) {
                    modalHost.presentToast(message);
                } else {
                    modalHost.presentToast(message, options);
                }
            },
            dismissToast: modalHost.dismissToast,
        },
    },
}));

vi.mock('@analytics', () => ({
    useAnalytics: () => ({
        track: vi.fn(async () => undefined),
        trackAnonymous: vi.fn(async () => undefined),
        isReady: true,
        providerName: 'posthog',
    }),
}));

vi.mock('./captureScreenshot', () => ({
    captureFeedbackScreenshot: vi.fn(),
}));

vi.mock('./collectFeedbackContext', () => ({
    collectFeedbackContext: vi.fn(),
}));

vi.mock('../../paraglide/messages.js', () => ({
    'feedback.reporting.reportProblem': () => 'Report a Problem',
    'feedback.reporting.shareIdea': () => 'Share an Idea',
    'feedback.reporting.whatHappened': () => 'What happened?',
    'feedback.reporting.problemPlaceholder': () => 'Tell us what you expected and what happened.',
    'feedback.reporting.ideaQuestion': () => 'What would make LearnCard better?',
    'feedback.reporting.ideaPlaceholder': () => 'Describe your idea.',
    'feedback.reporting.screenshotAttached': () => 'Screenshot attached',
    'feedback.reporting.removeScreenshot': () => 'Remove Screenshot',
    'feedback.reporting.whatWeSend': () => 'What we’ll send',
    'feedback.reporting.bugDisclosure': () =>
        'Your message, optional screenshot, app and device details, recent screens, and sanitized logs.',
    'feedback.reporting.ideaDisclosure': () =>
        'Your idea, current screen, app version, and tenant.',
    'feedback.reporting.cancel': () => 'Cancel',
    'feedback.reporting.sendReport': () => 'Send Report',
    'feedback.reporting.sendingReport': () => 'Sending Report...',
    'feedback.reporting.shareIdeaAction': () => 'Share Idea',
    'feedback.reporting.sharingIdea': () => 'Sharing Idea...',
    'feedback.reporting.thanks': () => 'Thanks for helping us improve LearnCard.',
    'feedback.reporting.error': () => 'We couldn’t send your feedback. Please try again.',
    'feedback.reporting.tryAgain': () => 'Try Again',
    'feedback.reporting.promptTitle': () => 'Report a problem?',
    'feedback.reporting.promptBody': () =>
        'We captured the current screen to help explain what happened.',
    'feedback.reporting.promptAction': () => 'Report',
    'feedback.reporting.dismiss': () => 'Dismiss',
}));

import { FeedbackComposer } from './FeedbackComposer';
import { FeedbackPromptToast } from './FeedbackPromptToast';
import {
    FeedbackProvider,
    useFeedback,
    type CollectFeedbackContextForKind,
    type FeedbackController,
    type FeedbackProviderDeps,
} from './FeedbackContext';
import { captureFeedbackScreenshot } from './captureScreenshot';
import { collectFeedbackContext } from './collectFeedbackContext';
import type {
    FeedbackContext as FeedbackContextData,
    FeedbackDraft,
    FeedbackReport,
    FeedbackScreenshot,
} from './types';

const captureScreenshot = vi.mocked(captureFeedbackScreenshot);
// The provider injects a kind-only collector; relax the mocked signature so
// the injected deps type-check without the full production input.
const collectContext = vi.mocked(collectFeedbackContext) as unknown as Mock<
    (input: CollectFeedbackContextForKind) => Promise<FeedbackContextData>
>;

const SCREENSHOT: FeedbackScreenshot = {
    dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
    filename: 'feedback-screenshot.png',
    contentType: 'image/png',
};

const CONTEXT: FeedbackContextData = {
    currentRoute: '/wallet',
    recentRoutes: ['/home', '/wallet'],
    tenantId: 'learncard',
};

const submit = vi.fn();
const transport = { submit };
const clock = vi.hoisted(() => ({ nowMs: 1_760_000_000_000 }));

const deps: FeedbackProviderDeps = {
    now: () => clock.nowMs,
    captureScreenshot,
    collectContext,
    transport,
};

let controller: FeedbackController | undefined;

const Consumer: React.FC = () => {
    controller = useFeedback();
    return null;
};

const renderProvider = (providerDeps: FeedbackProviderDeps = deps) => {
    const utils = render(
        <FeedbackProvider deps={providerDeps}>
            <Consumer />
        </FeedbackProvider>
    );

    return {
        ...utils,
        rerenderWithBusy(value: boolean) {
            busy.value = value;
            utils.rerender(
                <FeedbackProvider deps={providerDeps}>
                    <Consumer />
                </FeedbackProvider>
            );
        },
        rerenderWithEligibility(value: typeof eligibility.value) {
            eligibility.value = value;
            utils.rerender(
                <FeedbackProvider deps={providerDeps}>
                    <Consumer />
                </FeedbackProvider>
            );
        },
    };
};

type ComposerElement = ReactElement<{
    draft: FeedbackDraft;
    onCancel: () => void;
    onSubmit: (report: FeedbackReport) => Promise<void>;
}>;

const composerCall = (index = 0) =>
    modalHost.openModal.mock.calls[index] as [
        ComposerElement,
        Record<string, unknown>,
        { desktop: string; mobile: string }
    ];

type PromptToastElement = ReactElement<{ onReport: () => void; onDismiss: () => void }>;

const toastCall = (index = 0) =>
    modalHost.presentToast.mock.calls[index] as [PromptToastElement, Record<string, unknown>];

beforeEach(() => {
    vi.clearAllMocks();
    busy.value = false;
    modalHost.nextModalId = 0;
    eligibility.value = { bug: true, idea: true, isLoading: false, profileId: 'adult-a' };
    toastState.message = undefined;
    clock.nowMs = 1_760_000_000_000;
    captureScreenshot.mockResolvedValue(SCREENSHOT);
    collectContext.mockResolvedValue(CONTEXT);
    submit.mockResolvedValue({ id: 'feedback-1' });
    controller = undefined;
});

describe('FeedbackProvider automatic triggers wiring', () => {
    it('mounts automatic triggers with bug eligibility and reportProblem', () => {
        renderProvider();

        expect(automaticTriggers.calls).toHaveLength(1);
        expect(automaticTriggers.calls[0].enabled).toBe(true);
        expect(automaticTriggers.calls[0].reportProblem).toBe(controller?.reportProblem);
    });

    it('reflects bug ineligibility in the automatic trigger input', () => {
        eligibility.value = { bug: false, idea: true, isLoading: false };
        renderProvider();

        expect(automaticTriggers.calls.at(-1)?.enabled).toBe(false);
    });
});

describe('FeedbackProvider reportProblem', () => {
    it('opens the composer from Settings even while another modal is open', async () => {
        busy.value = true;
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });

        expect(captureScreenshot).toHaveBeenCalledTimes(1);
        expect(collectContext).toHaveBeenCalledWith({ kind: 'bug' });

        const [element, options, type] = composerCall();
        expect(element.type).toBe(FeedbackComposer);
        expect(element.props.draft.kind).toBe('bug');
        expect(element.props.draft.source).toBe('settings');
        expect(element.props.draft.screenshot).toBe(SCREENSHOT);
        expect(element.props.draft.context).toBe(CONTEXT);
        expect(element.props.draft.capturedAt).toBe(new Date(clock.nowMs).toISOString());
        expect(options).toEqual({
            sectionClassName: '!max-w-[480px]',
            onClose: expect.any(Function),
        });
        expect(type).toEqual({ desktop: 'center', mobile: 'full-screen' });
        expect(modalHost.presentToast).not.toHaveBeenCalled();
    });

    it('opens the composer immediately when a shake arrives while idle', async () => {
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        expect(modalHost.openModal).toHaveBeenCalledTimes(1);
        expect(modalHost.presentToast).not.toHaveBeenCalled();
        expect(composerCall()[0].props.draft.source).toBe('shake');
    });

    it('presents an actionable toast when a screenshot arrives while idle', async () => {
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'screenshot' });
        });

        expect(modalHost.openModal).not.toHaveBeenCalled();

        const [message, options] = toastCall();
        expect(message.type).toBe(FeedbackPromptToast);
        expect(options).toEqual(expect.objectContaining({ autoDismiss: false }));
    });

    it('captures while busy but defers presentation until the app is idle', async () => {
        busy.value = true;
        const { rerenderWithBusy } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        expect(captureScreenshot).toHaveBeenCalledTimes(1);
        expect(collectContext).toHaveBeenCalledTimes(1);
        expect(modalHost.openModal).not.toHaveBeenCalled();
        expect(modalHost.presentToast).not.toHaveBeenCalled();

        rerenderWithBusy(false);

        expect(modalHost.presentToast).toHaveBeenCalledTimes(1);
        const [message, options] = toastCall();
        expect(message.type).toBe(FeedbackPromptToast);
        expect(options).toEqual(expect.objectContaining({ autoDismiss: false }));
    });

    it('replaces an older pending draft with a newer automatic draft', async () => {
        busy.value = true;
        const { rerenderWithBusy } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        clock.nowMs += 60_000; // outside the 10s shake cooldown
        captureScreenshot.mockResolvedValue({
            ...SCREENSHOT,
            dataUrl: 'data:image/png;base64,TkVX',
        });

        await act(async () => {
            await controller?.reportProblem({ source: 'screenshot' });
        });

        rerenderWithBusy(false);

        const [message] = toastCall();
        act(() => {
            message.props.onReport();
        });

        expect(modalHost.openModal).toHaveBeenCalledTimes(1);
        const draft = composerCall()[0].props.draft;
        expect(draft.capturedAt).toBe(new Date(clock.nowMs).toISOString());
        expect(draft.source).toBe('screenshot');
        expect(draft.screenshot?.dataUrl).toBe('data:image/png;base64,TkVX');
    });

    it('discards a pending draft at exactly 300,000 ms', async () => {
        busy.value = true;
        const { rerenderWithBusy } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        clock.nowMs += 300_000;

        rerenderWithBusy(false);

        expect(modalHost.presentToast).not.toHaveBeenCalled();
        expect(modalHost.openModal).not.toHaveBeenCalled();
    });

    it('restores the preserved screenshot and context when the prompt is tapped', async () => {
        busy.value = true;
        const { rerenderWithBusy } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        rerenderWithBusy(false);

        const [message] = toastCall();
        act(() => {
            message.props.onReport();
        });

        expect(modalHost.dismissToast).toHaveBeenCalled();
        expect(modalHost.openModal).toHaveBeenCalledTimes(1);
        const draft = composerCall()[0].props.draft;
        expect(draft.screenshot).toBe(SCREENSHOT);
        expect(draft.context).toBe(CONTEXT);
        expect(draft.source).toBe('shake');
    });

    it('keeps the composer open after a transport rejection', async () => {
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });

        submit.mockRejectedValueOnce(new Error('transport down'));

        const [element] = composerCall();
        await expect(
            element.props.onSubmit({ ...element.props.draft, message: 'It broke' })
        ).rejects.toThrow('transport down');

        expect(modalHost.closeModal).not.toHaveBeenCalled();
        expect(modalHost.presentToast).not.toHaveBeenCalled();
    });

    it('closes the composer and confirms after a successful submit', async () => {
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });

        const [element] = composerCall();
        await act(async () => {
            await element.props.onSubmit({ ...element.props.draft, message: 'It broke' });
        });

        expect(submit).toHaveBeenCalledTimes(1);
        expect(submit).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'bug', message: 'It broke' })
        );
        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
        expect(modalHost.presentToast).toHaveBeenCalledWith(
            'Thanks for helping us improve LearnCard.'
        );
    });

    it('never captures when bug eligibility is false', async () => {
        eligibility.value = { bug: false, idea: false, isLoading: false };
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });
        await act(async () => {
            await controller?.reportProblem({ source: 'screenshot' });
        });
        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });

        expect(captureScreenshot).not.toHaveBeenCalled();
        expect(collectContext).not.toHaveBeenCalled();
        expect(modalHost.openModal).not.toHaveBeenCalled();
        expect(modalHost.presentToast).not.toHaveBeenCalled();
    });

    it('ignores a second shake inside the ten-second cooldown', async () => {
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        clock.nowMs += 5_000;

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        expect(captureScreenshot).toHaveBeenCalledTimes(1);
        expect(modalHost.openModal).toHaveBeenCalledTimes(1);
    });

    it('ignores automatic triggers while the feedback composer is open', async () => {
        renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        expect(captureScreenshot).toHaveBeenCalledTimes(1); // only the Settings capture
        expect(modalHost.openModal).toHaveBeenCalledTimes(1);
    });

    it('submits minimal micro-feedback without capturing a screenshot or rich diagnostics', async () => {
        renderProvider({
            now: () => clock.nowMs,
            captureScreenshot,
            transport,
        });

        await act(async () => {
            await controller?.reportProblem({
                source: 'micro-feedback',
                submitImmediately: true,
                initialMessage: '  broken button  ',
            });
        });

        expect(captureScreenshot).not.toHaveBeenCalled();
        expect(collectContext).not.toHaveBeenCalled();
        expect(submit).toHaveBeenCalledWith({
            kind: 'bug',
            source: 'micro-feedback',
            message: 'broken button',
            capturedAt: new Date(clock.nowMs).toISOString(),
            context: {
                currentRoute: '/',
                recentRoutes: [],
                app: { platform: 'web', displayVersion: 'unknown' },
            },
        });
        expect(modalHost.openModal).not.toHaveBeenCalled();
        expect(modalHost.presentToast).not.toHaveBeenCalled();
    });

    it('rejects immediate submission without a non-empty message', async () => {
        renderProvider();

        await expect(
            act(async () => {
                await controller?.reportProblem({
                    source: 'micro-feedback',
                    submitImmediately: true,
                    initialMessage: '   ',
                });
            })
        ).rejects.toThrow();

        expect(submit).not.toHaveBeenCalled();
    });

    it('propagates transport failure to the caller on the immediate path', async () => {
        renderProvider();
        submit.mockRejectedValueOnce(new Error('boom'));

        await expect(
            act(async () => {
                await controller?.reportProblem({
                    source: 'micro-feedback',
                    submitImmediately: true,
                    initialMessage: 'broken',
                });
            })
        ).rejects.toThrow('boom');
    });

    it('drops an in-flight bug capture after eligibility is lost', async () => {
        let resolveScreenshot: (screenshot: FeedbackScreenshot) => void;
        captureScreenshot.mockImplementationOnce(
            () =>
                new Promise<FeedbackScreenshot>(resolve => {
                    resolveScreenshot = resolve;
                })
        );
        const { rerenderWithEligibility } = renderProvider();

        let report: Promise<void> | undefined;
        act(() => {
            report = controller?.reportProblem({ source: 'settings' });
        });

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });

        await act(async () => {
            resolveScreenshot(SCREENSHOT);
            await report;
        });

        expect(modalHost.openModal).not.toHaveBeenCalled();
        expect(modalHost.presentToast).not.toHaveBeenCalled();
        expect(modalHost.dismissToast).not.toHaveBeenCalled();
    });

    it('clears a pending automatic draft when bug eligibility is lost', async () => {
        busy.value = true;
        const { rerenderWithBusy, rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'shake' });
        });

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });
        rerenderWithBusy(false);

        expect(modalHost.presentToast).not.toHaveBeenCalled();
        expect(modalHost.dismissToast).not.toHaveBeenCalled();
    });

    it('dismisses a visible prompt and prevents its stale action after bug eligibility is lost', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'screenshot' });
        });
        const [prompt] = toastCall();

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });
        act(() => {
            prompt.props.onReport();
        });

        expect(modalHost.dismissToast).toHaveBeenCalledTimes(1);
        expect(modalHost.openModal).not.toHaveBeenCalled();
    });

    it('closes an open bug composer when bug eligibility is lost', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });

        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });

    it('closes only its composer when unrelated UI is above it', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });
        const [composer] = composerCall();
        const unrelatedModal = <div>Unrelated modal</div>;
        modalHost.openModal(unrelatedModal);

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });

        expect(modalHost.closeModal).not.toHaveBeenCalled();
        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });

    it('does not dismiss an unrelated toast that replaced the feedback prompt', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'screenshot' });
        });
        const unrelatedToast = <div>Unrelated toast</div>;
        toastState.message = unrelatedToast;
        modalHost.presentToast(unrelatedToast);

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });

        expect(modalHost.dismissToast).not.toHaveBeenCalled();
    });

    it('does not submit from a stale bug composer after eligibility is lost', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });
        const [composer] = composerCall();

        rerenderWithEligibility({ bug: false, idea: true, isLoading: false });
        await act(async () => {
            await composer.props.onSubmit({ ...composer.props.draft, message: 'It broke' });
        });

        expect(submit).not.toHaveBeenCalled();
        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });

    it('keeps valid feedback open across an equivalent eligibility refresh', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });
        const [composer] = composerCall();

        rerenderWithEligibility({ bug: true, idea: true, isLoading: false, profileId: 'adult-a' });
        await act(async () => {
            await composer.props.onSubmit({ ...composer.props.draft, message: 'It broke' });
        });

        expect(submit).toHaveBeenCalledTimes(1);
        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });

    it('does not submit from a composer captured for a previous adult profile', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.reportProblem({ source: 'settings' });
        });
        const [composer] = composerCall();

        rerenderWithEligibility({ bug: true, idea: true, isLoading: false, profileId: 'adult-b' });
        await act(async () => {
            await composer.props.onSubmit({ ...composer.props.draft, message: 'It broke' });
        });

        expect(submit).not.toHaveBeenCalled();
        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });
});

describe('FeedbackProvider shareIdea', () => {
    it('collects idea context without a screenshot and opens the composer while busy', async () => {
        busy.value = true;
        renderProvider();

        await act(async () => {
            await controller?.shareIdea();
        });

        expect(collectContext).toHaveBeenCalledWith({ kind: 'idea' });
        expect(captureScreenshot).not.toHaveBeenCalled();

        const [element] = composerCall();
        expect(element.props.draft.kind).toBe('idea');
        expect(element.props.draft.source).toBe('settings');
        expect(element.props.draft.screenshot).toBeUndefined();
    });

    it('never captures when idea eligibility is false', async () => {
        eligibility.value = { bug: false, idea: false, isLoading: false };
        renderProvider();

        await act(async () => {
            await controller?.shareIdea();
        });

        expect(collectContext).not.toHaveBeenCalled();
        expect(modalHost.openModal).not.toHaveBeenCalled();
    });

    it('forwards the submitted idea report to the transport', async () => {
        renderProvider();

        await act(async () => {
            await controller?.shareIdea({ initialMessage: 'Dark mode' });
        });

        const [element] = composerCall();
        expect(element.props.draft.initialMessage).toBe('Dark mode');

        await act(async () => {
            await element.props.onSubmit({ ...element.props.draft, message: 'Dark mode' });
        });

        expect(submit).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'idea', message: 'Dark mode' })
        );
        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });

    it('closes an open idea composer when idea eligibility is lost', async () => {
        const { rerenderWithEligibility } = renderProvider();

        await act(async () => {
            await controller?.shareIdea({ initialMessage: 'Dark mode' });
        });

        rerenderWithEligibility({ bug: true, idea: false, isLoading: false });

        expect(modalHost.closeModalById).toHaveBeenCalledWith(0);
    });
});

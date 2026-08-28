import React, { useCallback, useEffect, useState } from 'react';

import * as m from '../../paraglide/messages.js';
import type { FeedbackDraft, FeedbackReport, FeedbackScreenshot } from './types';

export interface FeedbackComposerProps {
    draft: FeedbackDraft;
    pendingScreenshot?: Promise<FeedbackScreenshot | undefined>;
    pendingContext?: Promise<FeedbackDraft['context']>;
    onCancel(): void;
    onSubmit(report: FeedbackReport): Promise<void>;
}

/**
 * One-screen feedback composer presented inside a shared modal surface.
 *
 * Renders bug or idea copy based on `draft.kind`, keeps the message and the
 * (removable) screenshot in local state, and emits a complete
 * {@link FeedbackReport} through `onSubmit`. Rejections never surface raw
 * transport errors — only a friendly retry banner — and the typed message is
 * retained so a retry does not require retyping.
 */
export const FeedbackComposer: React.FC<FeedbackComposerProps> = ({
    draft,
    pendingScreenshot,
    pendingContext,
    onCancel,
    onSubmit,
}) => {
    const isBug = draft.kind === 'bug';
    const [message, setMessage] = useState(draft.initialMessage ?? '');
    const [screenshot, setScreenshot] = useState<FeedbackScreenshot | undefined>(draft.screenshot);
    const [context, setContext] = useState(draft.context);
    const [isScreenshotPending, setIsScreenshotPending] = useState(Boolean(pendingScreenshot));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const canSubmit = message.trim().length > 0;

    useEffect(() => {
        if (!pendingScreenshot) return;

        let isMounted = true;
        void pendingScreenshot
            .then(capturedScreenshot => {
                if (isMounted && capturedScreenshot) setScreenshot(capturedScreenshot);
            })
            .finally(() => {
                if (isMounted) setIsScreenshotPending(false);
            });

        return () => {
            isMounted = false;
        };
    }, [pendingScreenshot]);

    useEffect(() => {
        if (!pendingContext) return;

        let isMounted = true;
        void pendingContext.then(
            capturedContext => {
                if (isMounted) setContext(capturedContext);
            },
            () => undefined
        );

        return () => {
            isMounted = false;
        };
    }, [pendingContext]);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || isSubmitting || isDone) return;

        setIsSubmitting(true);
        setHasError(false);
        try {
            const reportContext = pendingContext ? await pendingContext : context;
            const report: FeedbackReport = {
                ...draft,
                context: reportContext,
                message: message.trim(),
                screenshot,
            };
            await onSubmit(report);
            setIsDone(true);
        } catch {
            // Intentionally swallowed: the transport error is never rendered.
            setHasError(true);
        } finally {
            setIsSubmitting(false);
        }
    }, [
        canSubmit,
        context,
        draft,
        isDone,
        isSubmitting,
        message,
        onSubmit,
        pendingContext,
        screenshot,
    ]);

    if (isDone) {
        return (
            <div className="p-6 font-poppins" data-testid="feedback-composer-thanks">
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                    >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="m9 11 3 3L22 4" />
                    </svg>
                    <span className="text-sm leading-relaxed text-emerald-700">
                        {m['feedback.reporting.thanks']()}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 p-6 font-poppins">
            <div>
                <h2 className="mb-1 text-xl font-semibold text-grayscale-900">
                    {isBug
                        ? m['feedback.reporting.reportProblem']()
                        : m['feedback.reporting.shareIdea']()}
                </h2>
            </div>

            {hasError && (
                <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                    <span className="flex-1 text-sm leading-relaxed text-red-700">
                        {m['feedback.reporting.error']()}
                    </span>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="shrink-0 text-sm font-medium text-red-700 underline underline-offset-2 disabled:opacity-40"
                    >
                        {m['feedback.reporting.tryAgain']()}
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-4">
                <div>
                    <label
                        htmlFor="feedback-composer-message"
                        className="mb-1.5 block text-xs font-medium text-grayscale-700"
                    >
                        {isBug
                            ? m['feedback.reporting.whatHappened']()
                            : m['feedback.reporting.ideaQuestion']()}
                    </label>
                    <textarea
                        id="feedback-composer-message"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={
                            isBug
                                ? m['feedback.reporting.problemPlaceholder']()
                                : m['feedback.reporting.ideaPlaceholder']()
                        }
                        rows={5}
                        disabled={isSubmitting}
                        className="w-full rounded-xl border border-grayscale-300 bg-white py-3 px-4 text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                </div>

                {screenshot && (
                    <div className="flex items-center gap-3 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-2.5">
                        <img
                            src={screenshot.dataUrl}
                            alt={m['feedback.reporting.screenshotAttached']()}
                            className="h-14 w-14 rounded-xl border border-grayscale-200 object-cover"
                        />
                        <span className="flex-1 truncate text-xs text-grayscale-600">
                            {screenshot.filename}
                        </span>
                        <button
                            type="button"
                            onClick={() => setScreenshot(undefined)}
                            disabled={isSubmitting}
                            className="shrink-0 rounded-[20px] border border-grayscale-300 px-4 py-2 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {m['feedback.reporting.removeScreenshot']()}
                        </button>
                    </div>
                )}

                {isScreenshotPending && (
                    <div className="flex items-center gap-3 rounded-2xl border border-grayscale-200 bg-grayscale-10 p-3">
                        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-grayscale-300 border-t-grayscale-700" />
                        <span className="text-xs text-grayscale-600">
                            {m['feedback.reporting.capturingScreenshot']()}
                        </span>
                    </div>
                )}

                <details className="rounded-2xl border border-grayscale-200 p-3">
                    <summary className="cursor-pointer text-xs font-medium text-grayscale-700">
                        {m['feedback.reporting.whatWeSend']()}
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-grayscale-500">
                        {isBug
                            ? m['feedback.reporting.bugDisclosure']()
                            : m['feedback.reporting.ideaDisclosure']()}
                    </p>
                </details>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {m['feedback.reporting.cancel']()}
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting || isScreenshotPending}
                    className="flex-1 rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            {isBug
                                ? m['feedback.reporting.sendingReport']()
                                : m['feedback.reporting.sharingIdea']()}
                        </span>
                    ) : isBug ? (
                        m['feedback.reporting.sendReport']()
                    ) : (
                        m['feedback.reporting.shareIdeaAction']()
                    )}
                </button>
            </div>
        </div>
    );
};

export default FeedbackComposer;

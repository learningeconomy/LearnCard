import React, { useCallback, useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { imageOutline } from 'ionicons/icons';

import * as m from '../../paraglide/messages.js';
import type { FeedbackDraft, FeedbackReport, FeedbackScreenshot } from './types';

const CHOOSE_MEDIA_CANCELLED_CODE = 'OS-PLUG-CAMR-0020';
const WEB_GALLERY_CANCELLED_MESSAGE = 'User cancelled photos app';

const isGallerySelectionCancelled = (error: unknown): boolean => {
    const candidate = error as { code?: string; message?: string };
    return (
        candidate?.code === CHOOSE_MEDIA_CANCELLED_CODE ||
        candidate?.message === WEB_GALLERY_CANCELLED_MESSAGE
    );
};

export interface FeedbackComposerProps {
    draft: FeedbackDraft;
    pendingContext?: Promise<FeedbackDraft['context']>;
    /** Idea screenshots require the separate bug-report/Sentry consent gate. */
    allowScreenshot?: boolean;
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
    pendingContext,
    allowScreenshot,
    onCancel,
    onSubmit,
}) => {
    const isBug = draft.kind === 'bug';
    const canAttachScreenshot = isBug || allowScreenshot === true;
    const [message, setMessage] = useState(draft.initialMessage ?? '');
    const [screenshot, setScreenshot] = useState<FeedbackScreenshot | undefined>(
        canAttachScreenshot ? draft.screenshot : undefined
    );
    const [context, setContext] = useState(draft.context);
    const [isAddingScreenshot, setIsAddingScreenshot] = useState(false);
    const [hasScreenshotError, setHasScreenshotError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasError, setHasError] = useState(false);

    const canSubmit = message.trim().length > 0;

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

    const handleAddScreenshot = useCallback(async () => {
        if (!canAttachScreenshot || isAddingScreenshot || isSubmitting) return;

        setIsAddingScreenshot(true);
        setHasScreenshotError(false);
        try {
            const { Camera, MediaTypeSelection } = await import('@capacitor/camera');
            const { results } = await Camera.chooseFromGallery({
                mediaType: MediaTypeSelection.Photo,
                allowMultipleSelection: false,
                includeMetadata: true,
                quality: 80,
                targetWidth: 1600,
                targetHeight: 1600,
            });
            const selected = results[0];
            if (!selected) return;
            if (!selected.thumbnail) throw new Error('Selected image has no preview data');

            // Native thumbnails are JPEG-encoded by the camera plugin even
            // when the source asset is PNG/HEIC. Web returns the original
            // image bytes, so only web results should use metadata.format.
            const rawFormat = selected.uri
                ? 'jpeg'
                : selected.metadata?.format?.toLowerCase() ?? 'jpeg';
            const format = rawFormat === 'jpg' ? 'jpeg' : rawFormat;
            const supportedFormat = ['jpeg', 'png', 'webp', 'gif'].includes(format)
                ? format
                : 'jpeg';
            const contentType = `image/${supportedFormat}` as const;
            const extension = supportedFormat === 'jpeg' ? 'jpg' : supportedFormat;

            setScreenshot({
                dataUrl: `data:${contentType};base64,${selected.thumbnail}`,
                filename: `feedback-screenshot.${extension}`,
                contentType,
            });
        } catch (error) {
            if (!isGallerySelectionCancelled(error)) {
                setHasScreenshotError(true);
            }
        } finally {
            setIsAddingScreenshot(false);
        }
    }, [canAttachScreenshot, isAddingScreenshot, isSubmitting]);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit || isSubmitting) return;

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
        } catch {
            // Intentionally swallowed: the transport error is never rendered.
            setHasError(true);
        } finally {
            setIsSubmitting(false);
        }
    }, [canSubmit, context, draft, isSubmitting, message, onSubmit, pendingContext, screenshot]);

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

                {canAttachScreenshot && screenshot && (
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

                {canAttachScreenshot && !screenshot && (
                    <button
                        type="button"
                        onClick={handleAddScreenshot}
                        disabled={isSubmitting || isAddingScreenshot}
                        className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isAddingScreenshot ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-grayscale-300 border-t-grayscale-700" />
                                {m['feedback.reporting.addingScreenshot']()}
                            </>
                        ) : (
                            <>
                                <IonIcon
                                    icon={imageOutline}
                                    className="text-lg"
                                    aria-hidden="true"
                                />
                                {m['feedback.reporting.addScreenshot']()}
                            </>
                        )}
                    </button>
                )}

                {hasScreenshotError && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm leading-relaxed text-red-700"
                    >
                        {m['feedback.reporting.screenshotError']()}
                    </div>
                )}

                <details className="rounded-2xl border border-grayscale-200 p-3">
                    <summary className="cursor-pointer text-xs font-medium text-grayscale-700">
                        {m['feedback.reporting.whatWeSend']()}
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-grayscale-500">
                        {isBug
                            ? m['feedback.reporting.bugDisclosure']()
                            : canAttachScreenshot
                            ? m['feedback.reporting.ideaDisclosure']()
                            : m['feedback.reporting.ideaDisclosureWithoutScreenshot']()}
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
                    disabled={!canSubmit || isSubmitting || isAddingScreenshot}
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

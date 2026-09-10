/**
 * Non-blocking viewport screenshot capture (LC-2086 Task 5).
 *
 * `captureFeedbackScreenshot` renders the live application document with
 * html2canvas and packages the result as a PNG data URL for a feedback draft.
 * It is deliberately fire-and-forget-friendly: rendering never throws and
 * never blocks longer than the 2,000 ms deadline — timeouts and rendering
 * failures resolve `undefined` so callers can continue without a screenshot.
 *
 * The capture happens before any feedback UI opens, which keeps the composer
 * and prompt toast out of their own attachment. Elements flagged with
 * `data-feedback-exclude` (e.g. on-screen sensitive previews) are skipped.
 */

import html2canvas from 'html2canvas';
import { getLogger } from 'learn-card-base/logging/logger';

import type { FeedbackScreenshot } from './types';

const log = getLogger('feedback');

/** Spec-mandated capture deadline. */
export const SCREENSHOT_CAPTURE_TIMEOUT_MS = 2_000;

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';

const replaceEmbeddedDocumentWithPlaceholder = (element: Element): void => {
    const placeholder = element.ownerDocument.createElement('div');
    const existingClass = element.getAttribute('class')?.trim();
    placeholder.className = [existingClass, 'feedback-frame-placeholder'].filter(Boolean).join(' ');

    const inlineStyle = element.getAttribute('style');
    if (inlineStyle) placeholder.setAttribute('style', inlineStyle);

    const width = Number(element.getAttribute('width'));
    const height = Number(element.getAttribute('height'));
    if (width > 0 && !placeholder.style.width) placeholder.style.width = `${width}px`;
    if (height > 0 && !placeholder.style.height) placeholder.style.height = `${height}px`;

    element.replaceWith(placeholder);
};

const sanitizeCloneForFeedback = (clonedDocument: Document): void => {
    clonedDocument
        .querySelectorAll('[data-feedback-exclude], script')
        .forEach(element => element.remove());

    // Embedded documents have their own DOM and could bypass the form-field
    // sanitization below. Preserve their layout without capturing their data.
    clonedDocument
        .querySelectorAll('iframe, object, embed')
        .forEach(replaceEmbeddedDocumentWithPlaceholder);

    clonedDocument.querySelectorAll('input, textarea, select').forEach(element => {
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'input') {
            const field = element as HTMLInputElement;
            field.value = '';
            field.defaultValue = '';
            field.checked = false;
            field.defaultChecked = false;
            element.setAttribute('value', '');
            element.setAttribute('placeholder', '');
        }
        if (tagName === 'textarea') {
            const field = element as HTMLTextAreaElement;
            field.value = '';
            field.defaultValue = '';
            field.textContent = '';
            element.setAttribute('value', '');
            element.setAttribute('placeholder', '');
        }
        if (tagName === 'select') {
            const field = element as HTMLSelectElement;
            [...field.options].forEach(option => {
                option.selected = false;
                option.defaultSelected = false;
            });
            field.selectedIndex = -1;
        }
    });

    clonedDocument
        .querySelectorAll('[contenteditable]:not([contenteditable="false"])')
        .forEach(element => element.replaceChildren());
};

export interface CaptureFeedbackScreenshotOptions {
    /** Deadline for the render; defaults to {@link SCREENSHOT_CAPTURE_TIMEOUT_MS}. */
    timeoutMs?: number;
    /** Called once html2canvas owns an isolated clone of the pre-feedback UI. */
    onSourceFrozen?: () => void;
}

/**
 * Capture the visible viewport as a PNG screenshot.
 *
 * @returns the screenshot payload, or `undefined` when the render fails,
 * times out, or produces a non-PNG result. Never throws.
 */
export const captureFeedbackScreenshot = async ({
    timeoutMs = SCREENSHOT_CAPTURE_TIMEOUT_MS,
    onSourceFrozen,
}: CaptureFeedbackScreenshotOptions = {}): Promise<FeedbackScreenshot | undefined> => {
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let sourceFrozen = false;
    const notifySourceFrozen = (): void => {
        if (sourceFrozen) return;
        sourceFrozen = true;
        onSourceFrozen?.();
    };

    try {
        const canvas = await Promise.race([
            html2canvas(document.documentElement, {
                width: window.innerWidth,
                height: window.innerHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                useCORS: true,
                logging: false,
                ignoreElements: element => element.hasAttribute('data-feedback-exclude'),
                onclone: clonedDocument => {
                    try {
                        sanitizeCloneForFeedback(clonedDocument);
                    } finally {
                        notifySourceFrozen();
                    }
                },
            }),
            new Promise<never>((_, reject) => {
                deadline = setTimeout(
                    () => reject(new Error('screenshot deadline exceeded')),
                    timeoutMs
                );
            }),
        ]);

        const dataUrl = canvas.toDataURL('image/png');

        if (!dataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
            // Generic message only: canvas errors can embed page content.
            log.warn('feedback.screenshot.capture_failed');
            return undefined;
        }

        return { dataUrl, filename: 'feedback-screenshot.png', contentType: 'image/png' };
    } catch {
        // Generic message only: html2canvas errors can embed page content.
        log.warn('feedback.screenshot.capture_failed');
        return undefined;
    } finally {
        // Rendering can fail before html2canvas produces a clone. Callers
        // waiting to present feedback UI must still be released.
        notifySourceFrozen();
        clearTimeout(deadline);
    }
};

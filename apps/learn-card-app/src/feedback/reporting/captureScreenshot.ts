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
const REDACTED_TEXT = 'Content hidden';
const REDACTION_STYLE_ATTRIBUTE = 'data-feedback-redaction';

const redactCloneForFeedback = (clonedDocument: Document): void => {
    clonedDocument
        .querySelectorAll('[data-feedback-exclude], script, style, link[rel~="stylesheet"]')
        .forEach(element => element.remove());

    clonedDocument
        .querySelectorAll('img, svg, canvas, video, audio, iframe, object, embed, picture, source')
        .forEach(element => element.remove());

    clonedDocument.querySelectorAll('input, textarea, select').forEach(element => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = '';
            element.defaultValue = '';
            element.setAttribute('value', '');
            element.setAttribute('placeholder', '');
        }
        element.textContent = '';
    });

    clonedDocument.querySelectorAll('*').forEach(element => {
        element.removeAttribute('style');
        for (const attribute of [...element.attributes]) {
            if (
                attribute.name.startsWith('data-') ||
                [
                    'alt',
                    'aria-label',
                    'aria-description',
                    'href',
                    'name',
                    'poster',
                    'src',
                    'srcset',
                    'title',
                ].includes(attribute.name)
            ) {
                element.removeAttribute(attribute.name);
            }
        }
    });

    const textNodes = clonedDocument.createTreeWalker(clonedDocument.body, NodeFilter.SHOW_TEXT);
    const nodesToRedact: Text[] = [];
    while (textNodes.nextNode()) nodesToRedact.push(textNodes.currentNode as Text);
    nodesToRedact.forEach(textNode => {
        textNode.nodeValue = REDACTED_TEXT;
    });

    const style = clonedDocument.createElement('style');
    style.setAttribute(REDACTION_STYLE_ATTRIBUTE, '');
    style.textContent = `
        *, *::before, *::after {
            background-image: none !important;
            mask-image: none !important;
            -webkit-mask-image: none !important;
            content: none !important;
        }
        img, svg, canvas, video, audio, iframe, object, embed, picture, source {
            display: none !important;
            visibility: hidden !important;
        }
    `;
    clonedDocument.head.append(style);
};

export interface CaptureFeedbackScreenshotOptions {
    /** Deadline for the render; defaults to {@link SCREENSHOT_CAPTURE_TIMEOUT_MS}. */
    timeoutMs?: number;
}

/**
 * Capture the visible viewport as a PNG screenshot.
 *
 * @returns the screenshot payload, or `undefined` when the render fails,
 * times out, or produces a non-PNG result. Never throws.
 */
export const captureFeedbackScreenshot = async ({
    timeoutMs = SCREENSHOT_CAPTURE_TIMEOUT_MS,
}: CaptureFeedbackScreenshotOptions = {}): Promise<FeedbackScreenshot | undefined> => {
    let deadline: ReturnType<typeof setTimeout> | undefined;

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
                onclone: redactCloneForFeedback,
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
        clearTimeout(deadline);
    }
};

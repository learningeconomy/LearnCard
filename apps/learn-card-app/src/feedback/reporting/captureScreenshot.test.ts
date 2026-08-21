/**
 * Tests for the non-blocking viewport screenshot capture (LC-2086 Task 5).
 *
 * `captureFeedbackScreenshot` renders the current document with html2canvas
 * and returns a PNG data URL payload for a feedback draft. These tests lock
 * in:
 *
 *   - the exact html2canvas call (viewport-bounded, CORS-enabled, quiet),
 *   - the returned `FeedbackScreenshot` shape,
 *   - graceful `undefined` on rendering failure or a non-PNG result,
 *   - the 2,000 ms deadline resolving `undefined` and clearing its timer.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { captureFeedbackScreenshot } from './captureScreenshot';

const html2canvasMock = vi.hoisted(() => vi.fn());

vi.mock('html2canvas', () => ({ default: html2canvasMock }));

describe('captureFeedbackScreenshot', () => {
    beforeEach(() => {
        html2canvasMock.mockReset();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('captures the visible viewport as PNG', async () => {
        html2canvasMock.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,AAAA' });

        await expect(captureFeedbackScreenshot()).resolves.toEqual({
            dataUrl: 'data:image/png;base64,AAAA',
            filename: 'feedback-screenshot.png',
            contentType: 'image/png',
        });
        expect(html2canvasMock).toHaveBeenCalledWith(
            document.documentElement,
            expect.objectContaining({ useCORS: true, logging: false })
        );
    });

    it('bounds the render to the current viewport and scroll position', async () => {
        html2canvasMock.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,AAAA' });

        await captureFeedbackScreenshot();

        expect(html2canvasMock).toHaveBeenCalledWith(document.documentElement, {
            width: window.innerWidth,
            height: window.innerHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            useCORS: true,
            logging: false,
            ignoreElements: expect.any(Function),
            onclone: expect.any(Function),
        });

        const { ignoreElements } = html2canvasMock.mock.calls[0][1];
        expect(ignoreElements(document.createElement('div'))).toBe(false);
        const excluded = document.createElement('div');
        excluded.setAttribute('data-feedback-exclude', '');
        expect(ignoreElements(excluded)).toBe(true);
    });

    it('globally redacts the cloned document before html2canvas renders it', async () => {
        document.body.innerHTML = `
            <main style="background-image: url('https://example.test/private-background.png'); mask-image: url('mask.png')">
                <p>Alex Example has a private credential</p>
                <input value="alex@example.com" placeholder="Type your secret" />
                <textarea placeholder="Private notes">private notes</textarea>
                <select><option value="private-selection">Private selection</option></select>
                <img src="https://example.test/private-avatar.png" alt="Alex Example" />
                <svg><text>QR: private-claim-code</text></svg>
                <canvas data-secret="canvas-private"></canvas>
                <video src="https://example.test/private-video.mp4"></video>
                <iframe src="https://example.test/private-frame"></iframe>
                <div data-feedback-exclude>excluded private content</div>
            </main>
        `;
        const clone = document.implementation.createHTMLDocument('feedback clone');
        clone.documentElement.innerHTML = document.documentElement.innerHTML;
        html2canvasMock.mockImplementation((_element, options) => {
            (options as { onclone?: (clonedDocument: Document) => void }).onclone?.(clone);
            return Promise.resolve({ toDataURL: () => 'data:image/png;base64,AAAA' });
        });

        await captureFeedbackScreenshot();

        const renderedHtml = clone.documentElement.innerHTML;
        for (const sensitiveValue of [
            'Alex Example',
            'alex@example.com',
            'private credential',
            'private notes',
            'private-selection',
            'private-avatar.png',
            'private-claim-code',
            'canvas-private',
            'private-video.mp4',
            'private-frame',
            'private-background.png',
            'excluded private content',
        ]) {
            expect(renderedHtml).not.toContain(sensitiveValue);
        }

        expect(clone.querySelector('input')?.getAttribute('value')).toBe('');
        expect(clone.querySelector('input')?.getAttribute('placeholder')).toBe('');
        expect(clone.querySelector('textarea')?.value).toBe('');
        expect(clone.querySelector('select')?.selectedIndex).toBe(-1);
        expect(clone.querySelectorAll('img, svg, canvas, video, iframe')).toHaveLength(0);
        expect(clone.head.querySelector('style[data-feedback-redaction]')?.textContent).toContain(
            'content: none !important'
        );

        // Redaction only applies to html2canvas's clone, never the live app.
        expect(document.body.textContent).toContain('Alex Example');
        expect(document.querySelector('input')?.value).toBe('alex@example.com');
    });

    it("clears form fields owned by html2canvas's iframe clone realm", async () => {
        const cloneFrame = document.createElement('iframe');
        document.body.append(cloneFrame);
        const clone = cloneFrame.contentDocument!;
        clone.body.innerHTML =
            '<input value="iframe-private@example.com" placeholder="Iframe secret" /><textarea placeholder="Iframe notes">Iframe notes</textarea>';
        const clonedInput = clone.querySelector('input')!;
        expect(clonedInput instanceof HTMLInputElement).toBe(false);

        html2canvasMock.mockImplementation((_element, options) => {
            (options as { onclone?: (clonedDocument: Document) => void }).onclone?.(clone);
            return Promise.resolve({ toDataURL: () => 'data:image/png;base64,AAAA' });
        });

        await captureFeedbackScreenshot();

        expect(clonedInput.value).toBe('');
        expect(clonedInput.getAttribute('value')).toBe('');
        expect(clonedInput.getAttribute('placeholder')).toBe('');
        expect(clone.querySelector('textarea')?.value).toBe('');
        expect(clone.documentElement.innerHTML).not.toContain('iframe-private@example.com');
        expect(clone.documentElement.innerHTML).not.toContain('Iframe secret');
        expect(clone.documentElement.innerHTML).not.toContain('Iframe notes');
    });

    it('returns undefined when rendering rejects', async () => {
        html2canvasMock.mockRejectedValue(new Error('unsupported CSS'));

        await expect(captureFeedbackScreenshot()).resolves.toBeUndefined();
    });

    it('returns undefined when the canvas result is not a PNG data URL', async () => {
        html2canvasMock.mockResolvedValue({ toDataURL: () => 'data:image/jpeg;base64,BBBB' });

        await expect(captureFeedbackScreenshot()).resolves.toBeUndefined();
    });

    it('returns undefined when the render exceeds the 2,000 ms deadline', async () => {
        html2canvasMock.mockImplementation(() => new Promise(() => undefined));
        vi.useFakeTimers();

        const assertion = expect(captureFeedbackScreenshot()).resolves.toBeUndefined();

        await vi.advanceTimersByTimeAsync(2_000);
        await assertion;
    });

    it('clears its deadline timer once the render settles', async () => {
        html2canvasMock.mockResolvedValue({ toDataURL: () => 'data:image/png;base64,AAAA' });
        vi.useFakeTimers();

        await captureFeedbackScreenshot();

        expect(vi.getTimerCount()).toBe(0);
    });
});

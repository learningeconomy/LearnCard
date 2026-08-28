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

    it('preserves visible page content while clearing form values and explicit exclusions', async () => {
        document.body.innerHTML = `
            <style id="app-styles">main { color: rgb(24, 34, 78); }</style>
            <link id="app-stylesheet" rel="stylesheet" href="/assets/app.css" />
            <main class="dashboard-card" style="background-color: white; background-image: url('https://example.test/private-background.png'); border-image-source: URL('https://example.test/private-border.png'); mask-image: url('mask.png')">
                <p>Alex Example has a private credential</p>
                <input value="alex@example.com" placeholder="Type your secret" />
                <textarea placeholder="Private notes">private notes</textarea>
                <select><option value="private-selection">Private selection</option></select>
                <img src="https://example.test/private-avatar.png" alt="Alex Example" />
                <picture><source srcset="https://example.test/private-picture.webp" /><img src="https://example.test/private-picture.png" /></picture>
                <svg><text>QR: private-claim-code</text></svg>
                <canvas data-secret="canvas-private"></canvas>
                <video style="width: 320px; height: 180px" src="https://example.test/private-video.mp4"></video>
                <iframe style="width: 300px; height: 160px" srcdoc="<input value='private-frame-value' />"></iframe>
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
            'alex@example.com',
            'private notes',
            'private-frame-value',
            'excluded private content',
        ]) {
            expect(renderedHtml).not.toContain(sensitiveValue);
        }

        for (const visibleValue of [
            'Alex Example has a private credential',
            'private-avatar.png',
            'private-claim-code',
            'canvas-private',
            'private-video.mp4',
            'private-background.png',
            'private-border.png',
            'private-picture.webp',
            'private-picture.png',
        ]) {
            expect(renderedHtml).toContain(visibleValue);
        }

        expect(clone.querySelector('input')?.getAttribute('value')).toBe('');
        expect(clone.querySelector('input')?.getAttribute('placeholder')).toBe('');
        expect(clone.querySelector('textarea')?.value).toBe('');
        expect(clone.querySelector('select')?.selectedIndex).toBe(-1);
        expect(clone.querySelector('#app-styles')?.textContent).toContain('color: rgb(24, 34, 78)');
        expect(clone.querySelector('#app-stylesheet')?.getAttribute('href')).toBe(
            '/assets/app.css'
        );
        expect(clone.querySelectorAll('img, svg, canvas')).toHaveLength(4);
        expect(clone.querySelector('img')?.getAttribute('src')).toContain('private-avatar.png');
        expect(clone.querySelector('svg')?.textContent).toContain('private-claim-code');
        expect(clone.querySelector('picture')).not.toBeNull();
        expect(clone.querySelectorAll('source')).toHaveLength(1);
        expect(clone.querySelectorAll('video')).toHaveLength(1);
        expect(clone.querySelectorAll('iframe')).toHaveLength(0);
        expect(clone.querySelectorAll('.feedback-frame-placeholder')).toHaveLength(1);
        expect(clone.querySelector<HTMLElement>('.feedback-frame-placeholder')?.style.width).toBe(
            '300px'
        );
        expect(clone.querySelector('#app-styles')).not.toBeNull();
        expect(clone.querySelector('main')?.className).toBe('dashboard-card');
        expect(clone.querySelector('main')?.getAttribute('style')).toContain(
            'background-color: white'
        );
        expect(clone.querySelector('p')?.textContent).toBe('Alex Example has a private credential');
        expect(clone.head.querySelector('style[data-feedback-redaction]')).toBeNull();

        // Redaction only applies to html2canvas's clone, never the live app.
        expect(document.body.textContent).toContain('Alex Example');
        expect(document.querySelector('input')?.value).toBe('alex@example.com');
    });

    it('signals when the source document has been frozen for rendering', async () => {
        const clone = document.implementation.createHTMLDocument('feedback clone');
        const onSourceFrozen = vi.fn();
        html2canvasMock.mockImplementation((_element, options) => {
            (options as { onclone?: (clonedDocument: Document) => void }).onclone?.(clone);
            expect(onSourceFrozen).toHaveBeenCalledTimes(1);
            return Promise.resolve({ toDataURL: () => 'data:image/png;base64,AAAA' });
        });

        await captureFeedbackScreenshot({ onSourceFrozen });

        expect(onSourceFrozen).toHaveBeenCalledTimes(1);
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

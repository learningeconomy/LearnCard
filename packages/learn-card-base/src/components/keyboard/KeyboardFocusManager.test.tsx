// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyboardFocusManager } from './KeyboardFocusManager';

const native = vi.hoisted(() => ({
    callbacks: new Map<string, (info: { keyboardHeight: number }) => void>(),
    remove: vi.fn(),
    platform: 'android',
    resizeMode: 'native',
}));
vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => true, getPlatform: () => native.platform },
}));
vi.mock('@capacitor/keyboard', () => ({
    Keyboard: {
        getResizeMode: vi.fn(async () => ({ mode: native.resizeMode })),
        addListener: vi.fn(async (event, callback) => {
            native.callbacks.set(event, callback);
            return { remove: native.remove };
        }),
    },
}));

describe('KeyboardFocusManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        native.callbacks.clear();
        native.remove.mockClear();
        native.platform = 'android';
        native.resizeMode = 'native';
        vi.stubGlobal('innerHeight', 800);
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
            setTimeout(() => callback(0), 16)
        );
        vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    });
    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    const form = () => {
        const view = render(
            <>
                <KeyboardFocusManager />
                <div style={{ overflowY: 'auto' }}>
                    <input aria-label="First" />
                    <input aria-label="Second" />
                </div>
            </>
        );
        const first = view.getByLabelText('First');
        const second = view.getByLabelText('Second');
        const scroller = first.parentElement!;
        scroller.getBoundingClientRect = () => ({ top: 0, bottom: window.innerHeight }) as DOMRect;
        first.getBoundingClientRect = () =>
            ({ top: 650 - scroller.scrollTop, bottom: 690 - scroller.scrollTop }) as DOMRect;
        second.getBoundingClientRect = () =>
            ({ top: 950 - scroller.scrollTop, bottom: 990 - scroller.scrollTop }) as DOMRect;
        return { ...view, first, second, scroller };
    };
    const settle = async () => {
        await act(async () => {
            await vi.advanceTimersByTimeAsync(50);
        });
    };

    it('reveals a covered field and subsequent focused fields while the keyboard stays open', async () => {
        const { first, second, scroller } = form();
        first.focus({ preventScroll: true });
        native.callbacks.get('keyboardDidShow')!({ keyboardHeight: 300 });
        await settle();
        expect(scroller.scrollTop).toBe(206);
        second.focus({ preventScroll: true });
        await settle();
        expect(scroller.scrollTop).toBe(506);
        expect(
            document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-height')
        ).toBe('500px');
    });

    it('does not inset an already resized WebView twice or move a visible field again', async () => {
        const { first, scroller } = form();
        first.focus({ preventScroll: true });
        vi.stubGlobal('innerHeight', 500);
        native.callbacks.get('keyboardDidShow')!({ keyboardHeight: 300 });
        await settle();
        expect(scroller.scrollTop).toBe(206);
        window.dispatchEvent(new Event('resize'));
        await settle();
        expect(scroller.scrollTop).toBe(206);
    });

    it('restores normal sizing after dismissal and removes native listeners on unmount', async () => {
        const { first, unmount } = form();
        first.focus({ preventScroll: true });
        native.callbacks.get('keyboardDidShow')!({ keyboardHeight: 300 });
        await settle();
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(true);
        native.callbacks.get('keyboardDidHide')!({ keyboardHeight: 0 });
        await settle();
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(false);
        unmount();
        expect(native.remove).toHaveBeenCalledTimes(4);
        expect(
            document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-height')
        ).toBe('');
    });

    it('lets iOS native resizing own host bounds through opening and dismissal', async () => {
        native.platform = 'ios';
        const { first, scroller } = form();
        await settle();
        first.focus({ preventScroll: true });
        native.callbacks.get('keyboardWillShow')!({ keyboardHeight: 300 });
        await settle();
        const root = document.documentElement;
        expect(root.hasAttribute('data-lc-keyboard-overlay')).toBe(false);
        expect(root.style.getPropertyValue('--lc-keyboard-viewport-height')).toBe('');
        expect(scroller.scrollTop).toBe(206);

        vi.stubGlobal('innerHeight', 500);
        native.callbacks.get('keyboardDidShow')!({ keyboardHeight: 300 });
        await settle();
        native.callbacks.get('keyboardWillHide')!({ keyboardHeight: 0 });
        vi.stubGlobal('innerHeight', 800);
        window.dispatchEvent(new Event('resize'));
        await settle();
        // Do not wait for keyboardDidHide to release the app's old height.
        expect(root.hasAttribute('data-lc-keyboard-open')).toBe(false);
        expect(root.style.getPropertyValue('--lc-keyboard-viewport-height')).toBe('');
        expect(document.activeElement).toBe(first);
    });

    it('retains the overlay fallback on iOS when native resizing is disabled', async () => {
        native.platform = 'ios';
        native.resizeMode = 'none';
        const { first, scroller } = form();
        await settle();
        first.focus({ preventScroll: true });
        native.callbacks.get('keyboardWillShow')!({ keyboardHeight: 300 });
        await settle();
        expect(document.documentElement.hasAttribute('data-lc-keyboard-overlay')).toBe(true);
        expect(
            document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-height')
        ).toBe('500px');
        expect(scroller.scrollTop).toBe(206);
        first.blur();
        native.callbacks.get('keyboardWillHide')!({ keyboardHeight: 0 });
        await settle();
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(false);
    });

    it('leaves pinch zoom and panning alone, and resumes reveal when zoom ends', async () => {
        const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
        vi.stubGlobal('visualViewport', viewport);
        const { first, scroller } = form();
        first.focus({ preventScroll: true });
        await settle();

        Object.assign(viewport, { height: 400, offsetTop: 120, scale: 2 });
        viewport.dispatchEvent(new Event('resize'));
        await settle();
        expect(scroller.scrollTop).toBe(0);
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(false);
        expect(
            document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-height')
        ).toBe('');

        viewport.offsetTop = 180;
        viewport.dispatchEvent(new Event('scroll'));
        native.callbacks.get('keyboardDidShow')!({ keyboardHeight: 300 });
        await settle();
        expect(scroller.scrollTop).toBe(0);
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(false);

        Object.assign(viewport, { height: 500, offsetTop: 0, scale: 1 });
        viewport.dispatchEvent(new Event('resize'));
        await settle();
        expect(scroller.scrollTop).toBe(206);
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(true);

        viewport.scale = 2;
        viewport.dispatchEvent(new Event('resize'));
        await settle();
        expect(document.documentElement.hasAttribute('data-lc-keyboard-open')).toBe(false);
    });

    it('updates panning bounds without undoing manual scrolling while a field is focused', async () => {
        const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
        vi.stubGlobal('visualViewport', viewport);
        const { first, scroller } = form();
        first.focus({ preventScroll: true });
        native.callbacks.get('keyboardDidShow')!({ keyboardHeight: 300 });
        await settle();
        expect(scroller.scrollTop).toBe(206);

        scroller.scrollTop = 0;
        viewport.offsetTop = 30;
        viewport.dispatchEvent(new Event('scroll'));
        await settle();
        expect(scroller.scrollTop).toBe(0);
        expect(document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-top')).toBe(
            '30px'
        );

        viewport.dispatchEvent(new Event('resize'));
        await settle();
        expect(scroller.scrollTop).toBe(206);
    });
});

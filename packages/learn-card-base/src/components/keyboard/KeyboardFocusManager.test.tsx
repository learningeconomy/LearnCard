// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyboardFocusManager } from './KeyboardFocusManager';

const native = vi.hoisted(() => ({
    callbacks: new Map<string, (info: { keyboardHeight: number }) => void>(),
    remove: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/keyboard', () => ({
    Keyboard: {
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
        expect(native.remove).toHaveBeenCalledTimes(3);
        expect(
            document.documentElement.style.getPropertyValue('--lc-keyboard-viewport-height')
        ).toBe('');
    });
});

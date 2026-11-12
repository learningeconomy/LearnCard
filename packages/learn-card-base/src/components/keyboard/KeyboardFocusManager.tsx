import { useEffect } from 'react';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard, type KeyboardInfo } from '@capacitor/keyboard';

import { getFocusScrollDelta, getKeyboardViewport, isViewportZoomed } from './keyboardGeometry';
import './keyboard-focus.scss';

const getParent = (element: Element): Element | null =>
    element.assignedSlot ??
    element.parentElement ??
    ((element.getRootNode() as ShadowRoot).host || null);

const getActiveField = (): HTMLElement | null => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    if (!(active instanceof HTMLElement)) return null;
    if (active instanceof HTMLTextAreaElement)
        return active.disabled || active.readOnly ? null : active;
    if (active instanceof HTMLInputElement) {
        return !active.disabled &&
            !active.readOnly &&
            /^(text|search|email|url|tel|password|number)$/.test(active.type)
            ? active
            : null;
    }
    return active.isContentEditable ? active : null;
};

/**
 * Keeps plain HTML form fields visible in routes and custom overlays. Mount once
 * per app. Native keyboard events supply an overlay fallback; VisualViewport
 * supplies browser keyboard/panning bounds. Already-resized views are not inset twice.
 */
export const KeyboardFocusManager = (): null => {
    useEffect(() => {
        const root = document.documentElement;
        const viewport = window.visualViewport;
        let expandedHeight = window.innerHeight;
        let keyboardHeight = 0;
        let nativeResizesViewport = false;
        let frame = 0;
        let revealFrame = 0;
        let revealRequested = false;
        let focusTimer: ReturnType<typeof setTimeout> | undefined;
        let disposed = false;
        const handles: PluginListenerHandle[] = [];

        const revealField = (): void => {
            // Leave zoomed forms and user panning to the browser, even with a native keyboard.
            if (isViewportZoomed(viewport ?? undefined)) return;
            const field = getActiveField();
            if (!field || field.closest('[inert], [aria-hidden="true"]')) return;

            // Ionic manages its own shadow inputs. Avoid competing with its input shims.
            for (let ancestor: Element | null = field; ancestor; ancestor = getParent(ancestor)) {
                if (ancestor.matches('ion-input, ion-textarea')) return;
            }

            const bounds = getKeyboardViewport(
                window.innerHeight,
                expandedHeight,
                keyboardHeight,
                viewport ?? undefined
            );
            const scope = field.closest('[data-lc-surface], .lc-auth-overlay, .ion-page');
            const footers = scope?.querySelectorAll<HTMLElement>(
                '[data-keyboard-footer], ion-footer'
            );

            for (let ancestor = getParent(field); ancestor; ancestor = getParent(ancestor)) {
                if (!(ancestor instanceof HTMLElement)) continue;
                const style = getComputedStyle(ancestor);
                if (!/(auto|scroll)/.test(style.overflowY)) continue;
                const rect = ancestor.getBoundingClientRect();
                const visible = {
                    top: Math.max(bounds.top, rect.top),
                    bottom: Math.min(bounds.bottom, rect.bottom),
                };
                // Forms can identify a docked action bar that overlaps their scroll area.
                footers?.forEach(footer => {
                    const footerRect = footer.getBoundingClientRect();
                    const fieldRect = field.getBoundingClientRect();
                    if (
                        footerRect.height > 0 &&
                        footerRect.left < fieldRect.right &&
                        footerRect.right > fieldRect.left &&
                        footerRect.bottom >= visible.bottom - 1 &&
                        footerRect.top > visible.top
                    ) {
                        visible.bottom = Math.min(visible.bottom, footerRect.top);
                    }
                });
                const delta = getFocusScrollDelta(field.getBoundingClientRect(), visible);
                if (Math.abs(delta) > 1) ancestor.scrollTop += delta;
            }
        };

        const update = (): void => {
            const shouldReveal = revealRequested;
            revealRequested = false;
            cancelAnimationFrame(revealFrame);
            if (isViewportZoomed(viewport ?? undefined)) {
                root.removeAttribute('data-lc-keyboard-open');
                root.removeAttribute('data-lc-keyboard-overlay');
                root.style.removeProperty('--lc-keyboard-viewport-height');
                root.style.removeProperty('--lc-keyboard-viewport-top');
                return;
            }
            const field = getActiveField();
            if (!field && keyboardHeight === 0) expandedHeight = window.innerHeight;
            // Track expansion on keyboard dismissal even if the input retains focus.
            expandedHeight = Math.max(expandedHeight, window.innerHeight);
            const bounds = getKeyboardViewport(
                window.innerHeight,
                expandedHeight,
                keyboardHeight,
                viewport ?? undefined
            );
            const isOpen =
                keyboardHeight > 0 ||
                (!!field && expandedHeight - (bounds.bottom - bounds.top) > 120);
            root.toggleAttribute('data-lc-keyboard-open', isOpen);
            // In native resize mode UIKit owns the WebView's bounds. Applying the
            // final keyboard height here snaps the app ahead of its animation and
            // holds it short during dismissal. Only size hosts for overlay modes.
            root.toggleAttribute('data-lc-keyboard-overlay', !nativeResizesViewport);
            if (nativeResizesViewport) {
                root.style.removeProperty('--lc-keyboard-viewport-height');
                root.style.removeProperty('--lc-keyboard-viewport-top');
            } else {
                root.style.setProperty(
                    '--lc-keyboard-viewport-height',
                    `${bounds.bottom - bounds.top}px`
                );
                root.style.setProperty('--lc-keyboard-viewport-top', `${bounds.top}px`);
            }
            // Surface sizes must settle before measuring their scroll containers.
            if (shouldReveal) revealFrame = requestAnimationFrame(revealField);
        };

        const queueUpdate = (reveal: boolean): void => {
            revealRequested ||= reveal;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        };
        const schedule = (): void => queueUpdate(true);
        // Panning still updates host bounds, but must not snap the user's scroll back.
        const onViewportScroll = (): void => queueUpdate(false);

        const onFocus = (): void => {
            schedule();
            clearTimeout(focusTimer);
            // Also cover focusing into a modal while its entrance animation is running.
            focusTimer = setTimeout(schedule, 350);
        };

        document.addEventListener('focusin', onFocus);
        document.addEventListener('focusout', schedule);
        window.addEventListener('resize', schedule);
        viewport?.addEventListener('resize', schedule);
        viewport?.addEventListener('scroll', onViewportScroll);

        if (Capacitor.isNativePlatform()) {
            if (Capacitor.getPlatform() === 'ios') {
                void Keyboard.getResizeMode()
                    .then(({ mode }) => {
                        if (disposed) return;
                        nativeResizesViewport = mode === 'native';
                        schedule();
                    })
                    .catch(() => undefined);
            }
            const register = (listener: Promise<PluginListenerHandle>): void => {
                listener
                    .then(handle => {
                        if (disposed) void handle.remove();
                        else handles.push(handle);
                    })
                    .catch(() => undefined);
            };
            const onShow = (info: KeyboardInfo): void => {
                keyboardHeight = info.keyboardHeight;
                schedule();
            };
            register(Keyboard.addListener('keyboardWillShow', onShow));
            register(Keyboard.addListener('keyboardDidShow', onShow));
            const onHide = (): void => {
                keyboardHeight = 0;
                schedule();
            };
            register(Keyboard.addListener('keyboardWillHide', onHide));
            register(Keyboard.addListener('keyboardDidHide', onHide));
        }

        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            cancelAnimationFrame(revealFrame);
            clearTimeout(focusTimer);
            document.removeEventListener('focusin', onFocus);
            document.removeEventListener('focusout', schedule);
            window.removeEventListener('resize', schedule);
            viewport?.removeEventListener('resize', schedule);
            viewport?.removeEventListener('scroll', onViewportScroll);
            handles.forEach(handle => void handle.remove());
            root.removeAttribute('data-lc-keyboard-open');
            root.removeAttribute('data-lc-keyboard-overlay');
            root.style.removeProperty('--lc-keyboard-viewport-height');
            root.style.removeProperty('--lc-keyboard-viewport-top');
        };
    }, []);

    return null;
};

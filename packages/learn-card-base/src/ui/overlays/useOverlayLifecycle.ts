import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { blurFocusedTextField, createLock, type OverlayAnimation } from './overlayAnimation';
import {
    didDismissOverlay,
    didPresentOverlay,
    willDismissOverlay,
    willPresentOverlay,
    type OverlayDismissEvent,
    type OverlayEntry,
    type OverlayKind,
    type OverlayRole,
} from './overlayStack';

export const OVERLAY_HIDDEN_CLASS = 'app-overlay-hidden';

export type OverlayLifecycleOptions = {
    kind: OverlayKind;
    backdropDismiss: boolean;
    trap: OverlayEntry['trap'];
    /** Where a `shadow` trap finds focusable elements, read at present (default: the host). */
    trapRoot?: (host: HTMLElement) => HTMLElement | null | undefined;
    /** Ionic's `keyboardClose`: focus the overlay once presented and blur a focused text field. */
    keyboardClose: boolean;
    /** `false` plays no enter / leave animation (Ionic's `animated`). */
    animated?: boolean;
    enter: (host: HTMLElement) => OverlayAnimation;
    leave: (host: HTMLElement) => OverlayAnimation;
    /** After the enter animation (e.g. a toast's `duration` timer). */
    onPresented?: () => void;
    /** At the start of a dismiss, before `onWillDismiss` (e.g. clearing timers). */
    onDismissStart?: () => void;
    /** Return `false` to refuse a dismiss with this role (e.g. while a sheet gesture dismisses). */
    canDismiss?: (role?: OverlayRole) => boolean;
    onWillPresent?: () => void;
    onDidPresent?: () => void;
    onWillDismiss?: (event: OverlayDismissEvent) => void;
    onDidDismiss?: (event: OverlayDismissEvent) => void;
};

const dismissEvent = (name: string, role?: OverlayRole, data?: unknown): OverlayDismissEvent =>
    new CustomEvent(name, { detail: { data, role } });

/** Resolves after two animation frames, like Ionic's `waitForMount`. */
const nextFrames = (): Promise<void> =>
    new Promise(resolve => {
        if (typeof requestAnimationFrame !== 'function') return resolve();
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

/**
 * Mount / present / dismiss for an app overlay, following Ionic's `present()` and `dismiss()` in
 * `utils/overlays.ts`. The overlay's content mounts only while it is presented (as Ionic React's
 * inline overlays did), and `onDidDismiss` fires after the leave animation, just before it unmounts.
 */
export const useOverlayLifecycle = (options: OverlayLifecycleOptions) => {
    const optionsRef = useRef(options);
    useLayoutEffect(() => {
        optionsRef.current = options;
    });
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [mounted, setMounted] = useState(false);
    const [hidden, setHidden] = useState(true);
    const lock = useRef(createLock()).current;
    const state = useRef<{
        presented: boolean;
        entry?: OverlayEntry;
        animations: OverlayAnimation[];
        restoreFocus?: () => void;
        mountWaiter?: () => void;
        unmounted: boolean;
    }>({ presented: false, animations: [], unmounted: false });

    const dismiss = useCallback(
        (role?: OverlayRole, data?: unknown): Promise<boolean> =>
            lock(async () => {
                const s = state.current;
                const host = hostRef.current;
                if (!s.presented || !s.entry || !host) return false;
                const opts = optionsRef.current;
                if (opts.canDismiss && !opts.canDismiss(role)) return false;
                s.presented = false;
                opts.onDismissStart?.();
                willDismissOverlay(s.entry);
                host.style.setProperty('pointer-events', 'none');
                opts.onWillDismiss?.(dismissEvent(`app${opts.kind}WillDismiss`, role, data));
                if (opts.keyboardClose) blurFocusedTextField(document);
                const leave = opts.leave(host);
                if (opts.animated === false) leave.cancel();
                s.animations.push(leave);
                await leave.finished;
                opts.onDidDismiss?.(dismissEvent(`app${opts.kind}DidDismiss`, role, data));
                s.animations.forEach(a => a.cancel());
                s.animations = [];
                host.classList.add(OVERLAY_HIDDEN_CLASS);
                host.style.removeProperty('pointer-events');
                s.entry = undefined;
                if (!s.unmounted) {
                    flushSync(() => {
                        setHidden(true);
                        setMounted(false);
                    });
                }
                didDismissOverlay();
                const restore = s.restoreFocus;
                s.restoreFocus = undefined;
                if (restore) queueMicrotask(restore);
                return true;
            }),
        [lock]
    );

    const present = useCallback(
        (): Promise<void> =>
            lock(async () => {
                const s = state.current;
                if (s.presented || s.unmounted) return;
                if (!hostRef.current) {
                    await new Promise<void>(resolve => {
                        s.mountWaiter = resolve;
                        setMounted(true);
                    });
                }
                await nextFrames();
                const host = hostRef.current;
                if (!host || s.unmounted) return;
                const opts = optionsRef.current;
                const entry: OverlayEntry = {
                    el: host,
                    kind: opts.kind,
                    backdropDismiss: opts.backdropDismiss,
                    trap: opts.trap,
                    trapRoot: opts.trapRoot?.(host) ?? undefined,
                    dismiss: role => dismiss(role),
                };
                s.entry = entry;
                s.presented = true;
                willPresentOverlay(entry);
                opts.onWillPresent?.();
                flushSync(() => setHidden(false));
                host.classList.remove(OVERLAY_HIDDEN_CLASS);
                if (opts.keyboardClose) blurFocusedTextField(document);
                const enter = opts.enter(host);
                if (opts.animated === false) enter.cancel();
                s.animations.push(enter);
                await enter.finished;
                if (!s.presented) return;
                opts.onDidPresent?.();
                s.restoreFocus = didPresentOverlay(entry, opts.keyboardClose);
                opts.onPresented?.();
            }),
        [lock, dismiss]
    );

    // Keep the stack entry's backdropDismiss current.
    useEffect(() => {
        if (state.current.entry) state.current.entry.backdropDismiss = options.backdropDismiss;
    }, [options.backdropDismiss]);

    // Resolve a pending present once the portal has mounted.
    useLayoutEffect(() => {
        if (mounted && hostRef.current && state.current.mountWaiter) {
            const resolve = state.current.mountWaiter;
            state.current.mountWaiter = undefined;
            resolve();
        }
    }, [mounted]);

    // Unmounted while presented: unregister without animating (the content is already gone).
    useEffect(() => {
        const s = state.current;
        s.unmounted = false;
        return () => {
            s.unmounted = true;
            if (s.entry) {
                willDismissOverlay(s.entry);
                s.entry = undefined;
                s.presented = false;
                s.animations.forEach(a => a.cancel());
                s.animations = [];
                optionsRef.current.onDismissStart?.();
                didDismissOverlay();
            }
            s.mountWaiter?.();
        };
    }, []);

    const isPresented = useCallback(() => state.current.presented, []);

    return { hostRef, mounted, hidden, present, dismiss, isPresented };
};

/** Drives `present` / `dismiss` from a controlled `isOpen` prop, as Ionic's `onIsOpenChange`. */
export const useIsOpen = (
    isOpen: boolean | undefined,
    present: () => Promise<void>,
    dismiss: () => Promise<boolean>
): void => {
    const previous = useRef(false);
    useEffect(() => {
        const open = isOpen === true;
        if (open && !previous.current) void present();
        else if (!open && previous.current) void dismiss();
        previous.current = open;
    }, [isOpen, present, dismiss]);
};

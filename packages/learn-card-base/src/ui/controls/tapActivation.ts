import type React from 'react';
import { useEffect, useRef } from 'react';

/** Ionic tap-click timings (ADD_ACTIVATED_DEFERS / CLEAR_STATE_DEFERS) and ripple constants. */
const ADD_ACTIVATED_DEFERS = 100;
const CLEAR_STATE_DEFERS = 150;
const RIPPLE_PADDING = 10;
const RIPPLE_INITIAL_ORIGIN_SCALE = 0.5;
const RIPPLE_MIN_DURATION = 225 + 100;
const RIPPLE_FADE_OUT = 200;

/**
 * Adds one bounded md ripple at (x, y) inside `container`, as `ion-ripple-effect.addRipple` does.
 * Resolves, no earlier than the expand animation, to a function that fades it out and removes it.
 */
export const addRipple = (container: HTMLElement, x: number, y: number): Promise<() => void> => {
    const rect = container.getBoundingClientRect();
    const { width, height } = rect;
    const hypotenuse = Math.sqrt(width * width + height * height);
    const maxDim = Math.max(height, width);
    const maxRadius = hypotenuse + RIPPLE_PADDING;
    const initialSize = Math.floor(maxDim * RIPPLE_INITIAL_ORIGIN_SCALE);
    const finalScale = maxRadius / initialSize;
    const posX = x - rect.left;
    const posY = y - rect.top;

    const ripple = document.createElement('div');
    ripple.className = 'app-ripple';
    ripple.style.top = `${posY - initialSize * 0.5}px`;
    ripple.style.left = `${posX - initialSize * 0.5}px`;
    ripple.style.width = ripple.style.height = `${initialSize}px`;
    ripple.style.setProperty('--final-scale', `${finalScale}`);
    ripple.style.setProperty(
        '--translate-end',
        `${width * 0.5 - posX}px, ${height * 0.5 - posY}px`
    );
    container.appendChild(ripple);

    return new Promise(resolve => {
        setTimeout(
            () =>
                resolve(() => {
                    ripple.classList.add('app-ripple-fade-out');
                    setTimeout(() => ripple.remove(), RIPPLE_FADE_OUT);
                }),
            RIPPLE_MIN_DURATION
        );
    });
};

/**
 * Ionic's tap-click behavior for one activatable control (AppButton, button AppItem): `data-activated` on the host 100ms after pointerdown
 * (or at pointerup if released sooner), cleared on pointerup (kept for at least 150ms), plus the md
 * ripple. Cancelled by pointercancel (scroll gestures), like Ionic.
 */
export const useTapActivation = (
    hostRef: React.RefObject<HTMLElement | null>,
    rippleRef: React.RefObject<HTMLElement | null>
): ((event: React.PointerEvent<HTMLElement>) => void) => {
    const cleanup = useRef<(() => void) | null>(null);
    // The previous press's deferred clear; a new press cancels it (Ionic's `clearDefers`).
    const clearDefer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(
        () => () => {
            cleanup.current?.();
            clearTimeout(clearDefer.current);
        },
        []
    );

    return event => {
        if (event.button === 2 || cleanup.current) return;
        const host = hostRef.current;
        if (!host) return;

        clearTimeout(clearDefer.current);
        host.removeAttribute('data-activated');

        let lastActivated = 0;
        let activated = false;
        let activeRipple: Promise<() => void> | undefined;

        const activate = (x: number, y: number): void => {
            activated = true;
            lastActivated = Date.now();
            host.setAttribute('data-activated', '');
            if (rippleRef.current) activeRipple = addRipple(rippleRef.current, x, y);
        };
        const removeRipple = (): void => {
            void activeRipple?.then(remove => remove());
            activeRipple = undefined;
        };
        const detach = (): void => {
            document.removeEventListener('pointerup', onPointerUp, true);
            document.removeEventListener('pointercancel', onPointerCancel, true);
            cleanup.current = null;
        };
        const onPointerUp = (up: PointerEvent): void => {
            clearTimeout(activeDefer);
            if (!activated) activate(up.clientX, up.clientY);
            removeRipple();
            detach();
            if (CLEAR_STATE_DEFERS - Date.now() + lastActivated > 0) {
                clearDefer.current = setTimeout(
                    () => host.removeAttribute('data-activated'),
                    CLEAR_STATE_DEFERS
                );
            } else {
                host.removeAttribute('data-activated');
            }
        };
        const onPointerCancel = (): void => {
            clearTimeout(activeDefer);
            removeRipple();
            host.removeAttribute('data-activated');
            detach();
        };

        const { clientX, clientY } = event;
        const activeDefer = setTimeout(() => activate(clientX, clientY), ADD_ACTIVATED_DEFERS);
        document.addEventListener('pointerup', onPointerUp, true);
        document.addEventListener('pointercancel', onPointerCancel, true);
        cleanup.current = () => {
            clearTimeout(activeDefer);
            detach();
        };
    };
};

/**
 * Ionic's tap-click ripple for a plain `.ion-activatable` element that holds an ion-ripple-effect
 * (no `data-activated`: the element's own classes and Ionic's `ion-activated` are untouched).
 * Ripple 100ms after pointerdown at the press point, or at pointerup if released sooner; removed
 * on pointerup (after the 325ms minimum) and on pointercancel. Returns a cleanup function.
 */
export const attachActivatableRipple = (
    host: HTMLElement,
    container: HTMLElement
): (() => void) => {
    let pressing = false;
    let activated = false;
    let activeDefer: ReturnType<typeof setTimeout> | undefined;
    let activeRipple: Promise<() => void> | undefined;

    const removeRipple = (): void => {
        void activeRipple?.then(remove => remove());
        activeRipple = undefined;
    };
    const activate = (x: number, y: number): void => {
        activated = true;
        removeRipple();
        activeRipple = addRipple(container, x, y);
    };
    const detach = (): void => {
        document.removeEventListener('pointerup', onPointerUp, true);
        document.removeEventListener('pointercancel', onPointerCancel, true);
        pressing = false;
    };
    const onPointerUp = (up: PointerEvent): void => {
        clearTimeout(activeDefer);
        if (!activated) activate(up.clientX, up.clientY);
        removeRipple();
        detach();
    };
    const onPointerCancel = (): void => {
        clearTimeout(activeDefer);
        removeRipple();
        detach();
    };
    const onPointerDown = (down: PointerEvent): void => {
        if (pressing || down.button === 2) return;
        pressing = true;
        activated = false;
        const { clientX, clientY } = down;
        activeDefer = setTimeout(() => activate(clientX, clientY), ADD_ACTIVATED_DEFERS);
        document.addEventListener('pointerup', onPointerUp, true);
        document.addEventListener('pointercancel', onPointerCancel, true);
    };

    host.addEventListener('pointerdown', onPointerDown);
    return () => {
        host.removeEventListener('pointerdown', onPointerDown);
        clearTimeout(activeDefer);
        removeRipple();
        detach();
    };
};

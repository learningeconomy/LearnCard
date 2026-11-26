import React, { useEffect, useRef } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useInAppButtons } from './AppButtons';
import './controls.css';

export type AppButtonColor = 'primary' | 'light' | 'medium';

export type AppButtonProps = {
    /** Palette color (`--app-color-*`). Omitted: the primary look without color overrides. */
    color?: AppButtonColor;
    /** Defaults to `clear` inside `AppButtons`, `solid` elsewhere (Ionic's rule). */
    fill?: 'solid' | 'outline' | 'clear';
    /** `block`: full width of the parent. */
    expand?: 'block';
    disabled?: boolean;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    'data-testid'?: string;
    children?: React.ReactNode;
};

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
const addRipple = (container: HTMLElement, x: number, y: number): Promise<() => void> => {
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
 * Ionic's tap-click behavior for one button: `data-activated` on the host 100ms after pointerdown
 * (or at pointerup if released sooner), cleared on pointerup (kept for at least 150ms), plus the md
 * ripple. Cancelled by pointercancel (scroll gestures), like Ionic.
 */
const useTapActivation = (
    hostRef: React.RefObject<HTMLSpanElement | null>,
    rippleRef: React.RefObject<HTMLSpanElement | null>
): ((event: React.PointerEvent<HTMLButtonElement>) => void) => {
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
 * App-owned replacement for `IonButton`: a native `<button type="button">` inside a host span
 * that carries the call site's classes, with Ionic's md / ios looks (md: uppercase, 36px,
 * 4px radius, shadow, ink ripple; ios: sentence case, 3.1em, 14px radius, no ripple).
 */
export const AppButton: React.FC<AppButtonProps> = ({
    color,
    fill,
    expand,
    disabled = false,
    mode: modeProp,
    className,
    onClick,
    'data-testid': testId,
    children,
}) => {
    const mode = modeProp ?? getIonMode();
    const inButtons = useInAppButtons();
    const hostRef = useRef<HTMLSpanElement>(null);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const onPointerDown = useTapActivation(hostRef, rippleRef);

    const classes = [
        'app-button',
        mode,
        `app-button-${fill ?? (inButtons ? 'clear' : 'solid')}`,
        expand && `app-button-${expand}`,
        color && `app-color app-color-${color}`,
        disabled && 'app-button-disabled',
        className,
    ];

    return (
        <span
            ref={hostRef}
            className={classes.filter(Boolean).join(' ')}
            aria-disabled={disabled ? 'true' : undefined}
            data-testid={testId}
        >
            <button
                type="button"
                className="app-button-native"
                disabled={disabled}
                onClick={onClick}
                onPointerDown={onPointerDown}
            >
                <span className="app-button-inner">{children}</span>
                {mode === 'md' && (
                    <span ref={rippleRef} className="app-ripple-effect" role="presentation" />
                )}
            </button>
        </span>
    );
};

export default AppButton;

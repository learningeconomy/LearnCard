import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { appMenuController, type AppMenuHandle } from './appMenuController';
import { useAppSplitPane } from './AppSplitPane';
import { getIonMode } from './ionMode';
import { getPresentedOverlay } from '../overlays/overlayStack';
import './app-shell.css';

// Ionic 8.7 ion-menu (overlay type) timings, easings and backdrop opacities.
const MENU_TIMING = {
    md: {
        duration: 300,
        easing: 'cubic-bezier(0.0,0.0,0.2,1)',
        easingReverse: 'cubic-bezier(0.4, 0, 0.6, 1)',
        backdropOpacity: 0.25,
    },
    ios: {
        duration: 400,
        easing: 'cubic-bezier(0.32,0.72,0,1)',
        easingReverse: 'cubic-bezier(1, 0, 0.68, 0.28)',
        backdropOpacity: 0.2,
    },
} as const;
const GESTURE_RELEASE_EASING = 'cubic-bezier(0.4, 0.0, 0.6, 1)';
const GESTURE_RELEASE_DURATION = 300;
const GESTURE_THRESHOLD = 10;
const GESTURE_MAX_ANGLE_RAD = (40 * Math.PI) / 180;
// Ionic ignores emulated mouse events for this long after a touch.
const MOUSE_WAIT_MS = 2000;
const BACKDROP_MIN_OPACITY = 0.01;

const BODY_NO_SCROLL = 'app-menu-no-scroll';
const MENU_CONTENT_OPEN = 'menu-content-open';
const FOCUSABLE =
    '[tabindex]:not([tabindex^="-"]):not([hidden]):not([disabled]), input:not([type=hidden]):not([tabindex^="-"]):not([hidden]):not([disabled]), textarea:not([tabindex^="-"]):not([hidden]):not([disabled]), button:not([tabindex^="-"]):not([hidden]):not([disabled]), select:not([tabindex^="-"]):not([hidden]):not([disabled]), ion-checkbox:not([tabindex^="-"]):not([hidden]):not([disabled]), ion-radio:not([tabindex^="-"]):not([hidden]):not([disabled]), .ion-focusable:not([tabindex^="-"]):not([hidden]):not([disabled]), .ion-focusable[disabled="false"]:not([tabindex^="-"]):not([hidden])';

const isAndroid = (): boolean =>
    typeof navigator !== 'undefined' && /android|sink/i.test(navigator.userAgent);

const isRtl = (): boolean => typeof document !== 'undefined' && document.dir === 'rtl';

const clamp = (min: number, value: number, max: number): number =>
    Math.max(min, Math.min(value, max));

const focusInContext = (target: Element | null, fallback: HTMLElement): void => {
    const shadowTarget = (target as HTMLElement | null)?.shadowRoot?.querySelector(FOCUSABLE);
    const element = (shadowTarget ?? target ?? fallback) as HTMLElement;
    element.focus();
};

type PointerSample = { x: number; t: number };

type DragState = {
    startX: number;
    startY: number;
    started: boolean;
    samples: PointerSample[];
    progress: number;
};

export type AppMenuProps = {
    /** Id of the main content element the menu sits next to (gets `menu-content*` classes). */
    contentId: string;
    /** Id toggles can address via `menu="…"`. */
    menuId?: string;
    /** Edge swipe to open / drag to close, like `IonMenu swipeGesture`. Defaults to `true`. */
    swipeGesture?: boolean;
    disabled?: boolean;
    /** Width of the start-edge strip that can begin a swipe-open. Ionic's default is 50px. */
    maxEdgeStart?: number;
    'aria-label'?: string;
    className?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonMenu` (overlay type, start side). Docked inside `AppSplitPane`
 * when the pane is visible; otherwise an off-canvas drawer with a backdrop, Escape / backdrop
 * click to close, an edge swipe to open and a drag to close. Mirrors ion-menu's DOM classes so
 * the existing styles keep applying.
 */
export const AppMenu: React.FC<AppMenuProps> = ({
    contentId,
    menuId,
    swipeGesture = true,
    disabled = false,
    maxEdgeStart = 50,
    'aria-label': ariaLabel,
    className,
    children,
}) => {
    const splitPane = useAppSplitPane();
    const isPaneVisible = splitPane?.isPaneVisible ?? false;
    const [mode] = useState(getIonMode);
    const [showMenu, setShowMenu] = useState(false);
    const [showBackdrop, setShowBackdrop] = useState(false);

    const hostRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const isOpenRef = useRef(false);
    const isAnimatingRef = useRef(false);
    const operationCancelledRef = useRef(false);
    const lastOnEndRef = useRef(0);
    const lastFocusRef = useRef<EventTarget | null>(null);
    const widthRef = useRef(0);
    const animationsRef = useRef<Animation[]>([]);
    const activeRef = useRef(false);
    const swipeRef = useRef(swipeGesture);
    swipeRef.current = swipeGesture;
    activeRef.current = !disabled && !isPaneVisible;

    const getContent = useCallback(
        (): HTMLElement | null => document.getElementById(contentId),
        [contentId]
    );

    const cancelAnimations = (): void => {
        animationsRef.current.forEach(animation => animation.cancel());
        animationsRef.current = [];
    };

    const applyProgress = (progress: number): void => {
        const inner = innerRef.current;
        const backdrop = backdropRef.current;
        const closedX = (isRtl() ? 1 : -1) * (widthRef.current + 8);
        const { backdropOpacity } = MENU_TIMING[mode];
        if (inner) inner.style.transform = `translateX(${closedX * (1 - progress)}px)`;
        if (backdrop) {
            backdrop.style.opacity = `${
                BACKDROP_MIN_OPACITY + (backdropOpacity - BACKDROP_MIN_OPACITY) * progress
            }`;
        }
    };

    const clearInlineStyles = (): void => {
        innerRef.current?.style.removeProperty('transform');
        backdropRef.current?.style.removeProperty('opacity');
    };

    const handleFocus = useRef((event: FocusEvent): void => {
        const host = hostRef.current;
        const target = event.target as Node | null;
        if (!host || !target) return;
        const overlay = getPresentedOverlay();
        if (overlay && !overlay.contains(host)) return;

        if (host.contains(target)) {
            lastFocusRef.current = target;
            return;
        }
        focusInContext(host.querySelector(FOCUSABLE), host);
        if (lastFocusRef.current === document.activeElement) {
            const all = host.querySelectorAll(FOCUSABLE);
            focusInContext(all.length > 0 ? all[all.length - 1] : null, host);
        }
    }).current;

    const beforeAnimation = (): void => {
        const host = hostRef.current;
        if (isAndroid()) host?.setAttribute('aria-hidden', 'true');
        flushSync(() => {
            setShowMenu(true);
            setShowBackdrop(true);
        });
        host?.setAttribute('tabindex', '0');
        const content = getContent();
        if (content) {
            content.classList.add(MENU_CONTENT_OPEN);
            content.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.add(BODY_NO_SCROLL);
        isAnimatingRef.current = true;
        widthRef.current = innerRef.current?.offsetWidth ?? 0;
    };

    const afterAnimation = (isOpen: boolean): void => {
        const host = hostRef.current;
        isOpenRef.current = isOpen;
        isAnimatingRef.current = false;
        if (!isOpen) document.body.classList.remove(BODY_NO_SCROLL);

        if (isOpen) {
            if (isAndroid()) host?.removeAttribute('aria-hidden');
            applyProgress(1);
            cancelAnimations();
            if (host && document.activeElement?.closest('[data-app-menu]') !== host) {
                host.focus();
            }
            document.addEventListener('focus', handleFocus, true);
        } else {
            host?.removeAttribute('aria-hidden');
            host?.removeAttribute('tabindex');
            const content = getContent();
            if (content) {
                content.classList.remove(MENU_CONTENT_OPEN);
                content.removeAttribute('aria-hidden');
            }
            cancelAnimations();
            clearInlineStyles();
            setShowMenu(false);
            setShowBackdrop(false);
            document.removeEventListener('focus', handleFocus, true);
        }
        appMenuController.update(handleRef.current, { isOpen });
    };

    /** Plays the open/close transition from `fromProgress` to the open (1) or closed (0) end. */
    const playTo = async (
        target: 0 | 1,
        fromProgress: number,
        easing: string,
        duration: number
    ): Promise<void> => {
        const inner = innerRef.current;
        const backdrop = backdropRef.current;
        if (!inner || !backdrop || typeof inner.animate !== 'function') {
            applyProgress(target);
            return;
        }
        const closedX = (isRtl() ? 1 : -1) * (widthRef.current + 8);
        const { backdropOpacity } = MENU_TIMING[mode];
        const xAt = (progress: number): string => `translateX(${closedX * (1 - progress)}px)`;
        const opacityAt = (progress: number): number =>
            BACKDROP_MIN_OPACITY + (backdropOpacity - BACKDROP_MIN_OPACITY) * progress;
        const options: KeyframeAnimationOptions = { duration, easing, fill: 'both' };
        cancelAnimations();
        clearInlineStyles();
        animationsRef.current = [
            inner.animate([{ transform: xAt(fromProgress) }, { transform: xAt(target) }], options),
            backdrop.animate(
                [{ opacity: opacityAt(fromProgress) }, { opacity: opacityAt(target) }],
                options
            ),
        ];
        await Promise.all(
            animationsRef.current.map(animation => animation.finished.catch(() => undefined))
        );
        applyProgress(target);
    };

    const setOpen = async (shouldOpen: boolean): Promise<void> => {
        if (!activeRef.current || isAnimatingRef.current || shouldOpen === isOpenRef.current)
            return;
        beforeAnimation();
        const timing = MENU_TIMING[mode];
        await playTo(
            shouldOpen ? 1 : 0,
            shouldOpen ? 0 : 1,
            shouldOpen ? timing.easing : timing.easingReverse,
            timing.duration
        );
        if (operationCancelledRef.current) {
            operationCancelledRef.current = false;
            return;
        }
        afterAnimation(shouldOpen);
    };
    const setOpenRef = useRef(setOpen);
    setOpenRef.current = setOpen;

    const handleRef = useRef<AppMenuHandle>({
        menuId,
        setOpen: shouldOpen => void setOpenRef.current(shouldOpen),
    });
    handleRef.current.menuId = menuId;

    // Register with the controller for the menu's lifetime; close instantly on unmount.
    useLayoutEffect(() => {
        const menuHandle = handleRef.current;
        appMenuController.register(menuHandle, {
            disabled,
            isPaneVisible,
            isOpen: false,
        });
        return () => {
            if (isOpenRef.current || isAnimatingRef.current) {
                operationCancelledRef.current = isAnimatingRef.current;
                const content = getContent();
                content?.classList.remove(MENU_CONTENT_OPEN);
                content?.removeAttribute('aria-hidden');
                document.body.classList.remove(BODY_NO_SCROLL);
                document.removeEventListener('focus', handleFocus, true);
                cancelAnimations();
                isOpenRef.current = false;
                isAnimatingRef.current = false;
            }
            appMenuController.unregister(menuHandle);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- register once; changes go through update()
    }, []);

    // Ionic adds these on connect and never removes them; `.menu-content` keeps a
    // translate3d on #main, which makes it the containing block for fixed children.
    useEffect(() => {
        getContent()?.classList.add('menu-content', 'menu-content-overlay');
    }, [getContent]);

    // Disabling the menu or docking it in the pane force-closes it (Ionic `updateState`).
    useEffect(() => {
        appMenuController.update(handleRef.current, { disabled, isPaneVisible });
        if (disabled || isPaneVisible) {
            if (isAnimatingRef.current) operationCancelledRef.current = true;
            if (isOpenRef.current || isAnimatingRef.current || showMenu) afterAnimation(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the gating props
    }, [disabled, isPaneVisible]);

    // Host listeners, as ion-menu registers them: Escape closes (keydown on the host — it holds
    // focus while open), and a click in the host outside .menu-inner (the backdrop) closes in
    // the capture phase.
    useEffect(() => {
        const host = hostRef.current;
        if (!host) return undefined;
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') void setOpenRef.current(false);
        };
        const onClick = (event: MouseEvent): void => {
            if (!isOpenRef.current || lastOnEndRef.current >= event.timeStamp - 100) return;
            const inner = innerRef.current;
            if (inner && event.composedPath().includes(inner)) return;
            event.preventDefault();
            event.stopPropagation();
            void setOpenRef.current(false);
        };
        host.addEventListener('keydown', onKeyDown);
        host.addEventListener('click', onClick, true);
        return () => {
            host.removeEventListener('keydown', onKeyDown);
            host.removeEventListener('click', onClick, true);
        };
    }, []);

    // Edge swipe to open / drag to close, on the whole document like Ionic's menu gesture.
    useEffect(() => {
        let drag: DragState | null = null;
        let lastTouch = 0;

        const canStart = (x: number): boolean => {
            if (document.querySelector('ion-modal.show-modal, .app-modal.show-modal')) return false;
            if (!swipeRef.current || isAnimatingRef.current || !activeRef.current) return false;
            if (isOpenRef.current) return true;
            return isRtl() ? x >= window.innerWidth - maxEdgeStart : x <= maxEdgeStart;
        };

        const down = (x: number, y: number, t: number): void => {
            drag = canStart(x)
                ? { startX: x, startY: y, started: false, samples: [{ x, t }], progress: 0 }
                : null;
        };

        const move = (x: number, y: number, t: number): void => {
            if (!drag) return;
            drag.samples.push({ x, t });
            if (drag.samples.length > 20) drag.samples.shift();
            const deltaX = x - drag.startX;
            const deltaY = y - drag.startY;

            if (!drag.started) {
                if (Math.hypot(deltaX, deltaY) <= GESTURE_THRESHOLD) return;
                const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX));
                if (angle > GESTURE_MAX_ANGLE_RAD || !canStart(drag.startX)) {
                    drag = null;
                    return;
                }
                drag.started = true;
                (document.activeElement as HTMLElement | null)?.blur?.();
                beforeAnimation();
                cancelAnimations();
            }

            const isEnd = isRtl();
            const delta = Math.max(0, isOpenRef.current !== isEnd ? -deltaX : deltaX);
            const step = widthRef.current > 0 ? delta / widthRef.current : 0;
            drag.progress = clamp(0, isOpenRef.current ? 1 - step : step, 1);
            applyProgress(drag.progress);
        };

        const end = (x: number, t: number, timeStamp: number): void => {
            const current = drag;
            drag = null;
            if (!current?.started) return;

            const recent = current.samples.filter(sample => t - sample.t <= 100);
            const oldest = recent[0] ?? current.samples[0];
            const velocity = t > oldest.t ? (x - oldest.x) / (t - oldest.t) : 0;
            const deltaX = x - current.startX;
            const isOpen = isOpenRef.current;
            const isEnd = isRtl();
            const half = widthRef.current / 2;
            const completeRight = velocity >= 0 && (velocity > 0.2 || deltaX > half);
            const completeLeft = velocity <= 0 && (velocity < -0.2 || deltaX < -half);
            const shouldComplete = isOpen
                ? isEnd
                    ? completeRight
                    : completeLeft
                : isEnd
                  ? completeLeft
                  : completeRight;
            const shouldOpen = isOpen ? !shouldComplete : shouldComplete;
            lastOnEndRef.current = timeStamp;

            const target: 0 | 1 = shouldOpen ? 1 : 0;
            const remaining = Math.abs(target - current.progress);
            void playTo(
                target,
                current.progress,
                GESTURE_RELEASE_EASING,
                GESTURE_RELEASE_DURATION * remaining
            ).then(() => afterAnimation(shouldOpen));
        };

        const onTouchStart = (event: TouchEvent): void => {
            lastTouch = Date.now();
            const touch = event.touches[0];
            if (touch) down(touch.clientX, touch.clientY, event.timeStamp);
        };
        const onTouchMove = (event: TouchEvent): void => {
            const touch = event.touches[0];
            if (touch) move(touch.clientX, touch.clientY, event.timeStamp);
        };
        const onTouchEnd = (event: TouchEvent): void => {
            const touch = event.changedTouches[0];
            end(touch?.clientX ?? 0, event.timeStamp, event.timeStamp);
        };
        const fromMouse = (): boolean => Date.now() - lastTouch > MOUSE_WAIT_MS;
        const onMouseDown = (event: MouseEvent): void => {
            if (fromMouse()) down(event.clientX, event.clientY, event.timeStamp);
        };
        const onMouseMove = (event: MouseEvent): void => {
            if (fromMouse()) move(event.clientX, event.clientY, event.timeStamp);
        };
        const onMouseUp = (event: MouseEvent): void => {
            if (fromMouse()) end(event.clientX, event.timeStamp, event.timeStamp);
        };

        const passive = { passive: true, capture: true } as const;
        document.addEventListener('touchstart', onTouchStart, passive);
        document.addEventListener('touchmove', onTouchMove, passive);
        document.addEventListener('touchend', onTouchEnd, passive);
        document.addEventListener('touchcancel', onTouchEnd, passive);
        document.addEventListener('mousedown', onMouseDown, passive);
        document.addEventListener('mousemove', onMouseMove, passive);
        document.addEventListener('mouseup', onMouseUp, passive);
        return () => {
            document.removeEventListener('touchstart', onTouchStart, passive);
            document.removeEventListener('touchmove', onTouchMove, passive);
            document.removeEventListener('touchend', onTouchEnd, passive);
            document.removeEventListener('touchcancel', onTouchEnd, passive);
            document.removeEventListener('mousedown', onMouseDown, passive);
            document.removeEventListener('mousemove', onMouseMove, passive);
            document.removeEventListener('mouseup', onMouseUp, passive);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers read live refs
    }, [maxEdgeStart]);

    const classes = [
        'app-menu',
        mode,
        'menu-type-overlay',
        disabled ? '' : 'menu-enabled',
        'menu-side-start',
        isPaneVisible ? 'menu-pane-visible' : '',
        splitPane ? 'split-pane-side' : '',
        showMenu ? 'show-menu' : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            ref={hostRef}
            className={classes}
            role="navigation"
            aria-label={ariaLabel || 'menu'}
            data-app-menu=""
            data-menu-id={menuId}
        >
            <div ref={innerRef} className="app-menu-inner menu-inner">
                {children}
            </div>
            <div
                ref={backdropRef}
                className={`app-menu-backdrop menu-backdrop ${mode}${
                    showBackdrop ? ' show-backdrop' : ''
                }`}
                aria-hidden="true"
            />
        </div>
    );
};

export default AppMenu;

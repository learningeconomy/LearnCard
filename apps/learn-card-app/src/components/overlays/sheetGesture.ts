/**
 * ion-modal's sheet behaviour (@ionic/core 8.7.2 `components/modal/gestures/sheet.ts` plus the
 * vertical pan recognizer from `utils/gesture`), for AppOverlayModal sheets with the defaults
 * the app uses (`expandToScroll: true`, `canDismiss: true`).
 *
 * Like Ionic, the resting sheet is a paused Web Animation on the wrapper and backdrop whose
 * progress is `1 - breakpoint`: a drag steps it, and a release or `moveSheetToBreakpoint` plays it
 * to the snapped breakpoint (500ms, Ionic's iOS modal easing; Ionic used that builder in both
 * modes). Snapping to 0 dismisses the modal with role `gesture`.
 */
const DURATION = 500;
const EASING = 'cubic-bezier(0.32,0.72,0,1)';
const THRESHOLD = 10;
const MAX_ANGLE_COSINE = Math.cos((40 * Math.PI) / 180);
/** Ionic ignores emulated mouse events this long after a touch. */
const MOUSE_WAIT = 2000;

/** `element.animate()` animations carry a KeyframeEffect; swap its keyframes in place. */
const setKeyframes = (animation: Animation, keyframes: Keyframe[]): void => {
    (animation.effect as KeyframeEffect | null)?.setKeyframes(keyframes);
};

/** Backdrop opacity factor for a sheet at `x` (Ionic's `getBackdropValueForSheet`). */
export const getBackdropValueForSheet = (x: number, backdropBreakpoint: number): number => {
    if (backdropBreakpoint === 1) return 0;
    const slope = 1 / (1 - backdropBreakpoint);
    const b = -(backdropBreakpoint * slope);
    return x * slope + b;
};

const clamp = (min: number, n: number, max: number): number => Math.max(min, Math.min(n, max));

type IonContentElement = HTMLElement & { scrollY?: boolean };

const findClosestIonContent = (el: EventTarget | null): IonContentElement | null =>
    el instanceof Element
        ? el.closest<IonContentElement>('ion-content, .ion-content-scroll-host')
        : null;

/** At the top breakpoint a swipe on the content only starts when it is scrolled to its top. */
const canSwipeOnContent = (contentEl: HTMLElement): boolean => {
    const scrollEl =
        contentEl.tagName === 'ION-CONTENT'
            ? (contentEl.shadowRoot?.querySelector<HTMLElement>('.inner-scroll') ?? contentEl)
            : contentEl;
    return !contentEl.querySelector('ion-refresher') && scrollEl.scrollTop === 0;
};

export type SheetGestureOptions = {
    host: HTMLElement;
    wrapper: HTMLElement;
    backdrop: HTMLElement;
    /** Wrapper and (ios) shadow: the elements that slide. */
    sliding: HTMLElement[];
    breakpoints: number[];
    initialBreakpoint: number;
    backdropBreakpoint: number;
    animated: () => boolean;
    /** Toggles a class on the host (the modal keeps it across re-renders). */
    setHostClass: (name: string, on: boolean) => void;
    onBreakpointChange: (breakpoint: number) => void;
    /** Snapped to 0: the leave animation already ran; dismiss with role `gesture`. */
    onDismiss: () => void;
};

export type SheetController = {
    moveSheetToBreakpoint: (breakpoint: number) => Promise<void>;
    getCurrentBreakpoint: () => number;
    /** A snap is playing (Ionic's `sheetTransition`): handle and backdrop taps are ignored. */
    isTransitioning: () => boolean;
    /** Snapping to 0 (Ionic's `gestureAnimationDismissing`): only the gesture dismiss may run. */
    isDismissing: () => boolean;
    destroy: () => void;
};

/** Ionic's GestureDetail, as far as the sheet reads it. */
type Detail = {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    deltaY: number;
    velocityY: number;
    currentTime: number;
    event: Event;
};

export const createSheetGesture = (options: SheetGestureOptions): SheetController => {
    const { host, wrapper, backdrop, sliding, breakpoints, backdropBreakpoint } = options;
    const contentEl = host.querySelector<IonContentElement>('ion-content');
    const height = wrapper.clientHeight;
    const maxBreakpoint = breakpoints[breakpoints.length - 1];
    let currentBreakpoint = options.initialBreakpoint;
    let offset = 0;
    let enabled = true;
    let transitioning = false;
    let dismissing = false;
    let destroyed = false;

    const wrapperFrames = (from: number, to: number): Keyframe[] => [
        { offset: 0, transform: `translateY(${from * 100}%)` },
        { offset: 1, transform: `translateY(${to * 100}%)` },
    ];
    const defaultBackdropFrames = (): Keyframe[] =>
        backdropBreakpoint !== 0
            ? [
                  { offset: 0, opacity: 'var(--backdrop-opacity)' },
                  { offset: 1 - backdropBreakpoint, opacity: 0 },
                  { offset: 1, opacity: 0 },
              ]
            : [
                  { offset: 0, opacity: 'var(--backdrop-opacity)' },
                  { offset: 1, opacity: 0.01 },
              ];

    // One paused animation per element, stepped like Ionic's `progressStep`.
    const timing: KeyframeAnimationOptions = { duration: DURATION, fill: 'both', easing: 'linear' };
    const slides = sliding.map(el => el.animate(wrapperFrames(0, 1), timing));
    const fade = backdrop.animate(defaultBackdropFrames(), timing);
    const all = [...slides, fade];
    // Ionic's sheet animation writes `opacity: 1` on the sliding elements before it runs.
    for (const el of sliding) el.style.setProperty('opacity', '1');

    const progressStep = (step: number): void => {
        const time = clamp(0, step, 0.9999) * DURATION;
        for (const a of all) {
            a.pause();
            a.currentTime = time;
        }
    };
    const progressStart = (step: number): void => {
        for (const a of all) a.effect?.updateTiming({ easing: 'linear', duration: DURATION });
        progressStep(step);
    };

    const setBackdropBlocking = (): void => {
        const blocks = currentBreakpoint > backdropBreakpoint;
        host.style.setProperty('pointer-events', blocks ? 'auto' : 'none');
        backdrop.style.setProperty('pointer-events', blocks ? 'auto' : 'none');
        options.setHostClass('ion-disable-focus-trap', !blocks);
    };

    progressStart(1 - currentBreakpoint);
    setBackdropBlocking();
    if (contentEl && currentBreakpoint !== maxBreakpoint) contentEl.scrollY = false;

    const moveTo = (snapToBreakpoint: number, breakpointOffset: number): Promise<void> => {
        const shouldRemainOpen = snapToBreakpoint !== 0;
        currentBreakpoint = 0;
        transitioning = true;
        if (!shouldRemainOpen) dismissing = true;
        for (const a of slides)
            setKeyframes(a, wrapperFrames(breakpointOffset, 1 - snapToBreakpoint));
        setKeyframes(fade, [
            {
                offset: 0,
                opacity: `calc(var(--backdrop-opacity) * ${getBackdropValueForSheet(1 - breakpointOffset, backdropBreakpoint)})`,
            },
            {
                offset: 1,
                opacity: `calc(var(--backdrop-opacity) * ${getBackdropValueForSheet(snapToBreakpoint, backdropBreakpoint)})`,
            },
        ]);
        enabled = false;
        if (contentEl && snapToBreakpoint === maxBreakpoint) contentEl.scrollY = true;
        const duration = options.animated() ? DURATION : 0;
        for (const a of all) {
            a.effect?.updateTiming({ easing: EASING, duration });
            a.currentTime = 0;
            a.play();
        }
        return Promise.all(all.map(a => a.finished.catch(() => undefined))).then(
            () =>
                new Promise<void>(resolve => {
                    if (destroyed) return resolve();
                    if (!shouldRemainOpen) {
                        options.onDismiss();
                        return resolve();
                    }
                    requestAnimationFrame(() => {
                        if (destroyed) return resolve();
                        for (const a of slides) setKeyframes(a, wrapperFrames(0, 1));
                        setKeyframes(fade, defaultBackdropFrames());
                        progressStart(1 - snapToBreakpoint);
                        currentBreakpoint = snapToBreakpoint;
                        options.onBreakpointChange(currentBreakpoint);
                        setBackdropBlocking();
                        enabled = true;
                        transitioning = false;
                        resolve();
                    });
                })
        );
    };

    // ------------------------------------------------- vertical pan recognizer (utils/gesture)
    let tracking: Detail | null = null;
    let captured = false;
    let moveQueued = false;
    let lastTouch = 0;

    const canStart = (detail: Detail): boolean => {
        const target = findClosestIonContent(detail.event.target);
        if (target && currentBreakpoint === 1) return canSwipeOnContent(target);
        return true;
    };

    const onStart = (detail: Detail): void => {
        if (detail.deltaY > 0 && contentEl) contentEl.scrollY = false;
        requestAnimationFrame(() => host.focus());
        progressStart(1 - currentBreakpoint);
    };

    const onMove = (detail: Detail): void => {
        if (detail.deltaY > 0 && contentEl) contentEl.scrollY = false;
        const step = 1 - currentBreakpoint + detail.deltaY / height;
        offset = clamp(0.0001, step, 0.9999);
        progressStep(offset);
    };

    // Snap to the breakpoint nearest the release point projected 350ms along the drag velocity.
    const onEnd = (detail: Detail): void => {
        const threshold = (detail.deltaY + detail.velocityY * 350) / height;
        const diff = currentBreakpoint - threshold;
        const closest = breakpoints.reduce((a, b) =>
            Math.abs(b - diff) < Math.abs(a - diff) ? b : a
        );
        void moveTo(closest, offset);
    };

    const now = (event: Event): number => event.timeStamp || Date.now();

    // Ionic's `calcGestureData`: deltas from the start and a smoothed velocity in px/ms.
    const update = (detail: Detail, x: number, y: number, event: Event): void => {
        const timestamp = now(event);
        const timeDelta = timestamp - detail.currentTime;
        if (timeDelta > 0 && timeDelta < 100) {
            const velocityY = (y - detail.currentY) / timeDelta;
            detail.velocityY = velocityY * 0.7 + detail.velocityY * 0.3;
        }
        detail.currentX = x;
        detail.currentY = y;
        detail.currentTime = timestamp;
        detail.deltaY = y - detail.startY;
        detail.event = event;
    };

    const pointerDown = (x: number, y: number, event: Event): boolean => {
        if (!enabled || transitioning || tracking) return false;
        const detail: Detail = {
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
            deltaY: 0,
            velocityY: 0,
            currentTime: now(event),
            event,
        };
        if (!canStart(detail)) return false;
        tracking = detail;
        captured = false;
        return true;
    };
    const pointerMove = (x: number, y: number, event: Event): void => {
        const detail = tracking;
        if (!detail) return;
        if (captured) {
            if (!moveQueued) {
                moveQueued = true;
                update(detail, x, y, event);
                requestAnimationFrame(() => {
                    if (!captured) return;
                    moveQueued = false;
                    onMove(detail);
                });
            }
            return;
        }
        update(detail, x, y, event);
        const dx = x - detail.startX;
        const dy = y - detail.startY;
        const distance = dx * dx + dy * dy;
        if (distance < THRESHOLD * THRESHOLD) return;
        if (Math.abs(dy / Math.sqrt(distance)) <= MAX_ANGLE_COSINE) {
            tracking = null;
            return;
        }
        captured = true;
        // Ionic restarts the deltas where the pan is captured.
        detail.startX = detail.currentX;
        detail.startY = detail.currentY;
        detail.deltaY = 0;
        onStart(detail);
    };
    const pointerUp = (x: number, y: number, event: Event): void => {
        const detail = tracking;
        tracking = null;
        moveQueued = false;
        if (!detail || !captured) return;
        captured = false;
        update(detail, x, y, event);
        onEnd(detail);
    };

    const onTouchStart = (ev: TouchEvent): void => {
        lastTouch = Date.now();
        const t = ev.changedTouches[0];
        pointerDown(t.clientX, t.clientY, ev);
    };
    const onTouchMove = (ev: TouchEvent): void => {
        const t = ev.changedTouches[0];
        pointerMove(t.clientX, t.clientY, ev);
    };
    const onTouchEnd = (ev: TouchEvent): void => {
        lastTouch = Date.now();
        const t = ev.changedTouches[0];
        pointerUp(t.clientX, t.clientY, ev);
    };
    const onMouseDown = (ev: MouseEvent): void => {
        if (ev.button !== 0 || Date.now() - lastTouch < MOUSE_WAIT) return;
        if (!pointerDown(ev.clientX, ev.clientY, ev)) return;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
    const onMouseMove = (ev: MouseEvent): void => pointerMove(ev.clientX, ev.clientY, ev);
    const onMouseUp = (ev: MouseEvent): void => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        pointerUp(ev.clientX, ev.clientY, ev);
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: true });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: true });
    wrapper.addEventListener('touchcancel', onTouchEnd, { passive: true });
    wrapper.addEventListener('mousedown', onMouseDown);

    return {
        moveSheetToBreakpoint: async breakpoint => {
            if (transitioning || breakpoint === currentBreakpoint) return;
            await moveTo(breakpoint, 1 - currentBreakpoint);
        },
        getCurrentBreakpoint: () => currentBreakpoint,
        isTransitioning: () => transitioning,
        isDismissing: () => dismissing,
        destroy: () => {
            destroyed = true;
            wrapper.removeEventListener('touchstart', onTouchStart);
            wrapper.removeEventListener('touchmove', onTouchMove);
            wrapper.removeEventListener('touchend', onTouchEnd);
            wrapper.removeEventListener('touchcancel', onTouchEnd);
            wrapper.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            for (const a of all) a.cancel();
        },
    };
};

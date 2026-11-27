import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import type { IonMode } from '../app-shell/ionMode';
import { FULLSCREEN_CONTENT_CLASS } from '../app-shell/AppTabs';
import type { AppToolbarStyle } from './AppToolbar';
import { useChromeMode } from './useChromeMode';
import './content.css';

/** ion-content's `ScrollDetail`. */
export type AppContentScrollDetail = {
    type: 'scroll';
    /** The native scroll event that started this frame's update. */
    event: Event | undefined;
    scrollTop: number;
    scrollLeft: number;
    startX: number;
    startY: number;
    startTime: number;
    currentX: number;
    currentY: number;
    velocityX: number;
    velocityY: number;
    deltaX: number;
    deltaY: number;
    currentTime: number;
    data: undefined;
    isScrolling: true;
};

/** The scroll API ion-content had as element methods. */
export type AppContentHandle = {
    /** The content's root element (the former `ion-content` host). */
    readonly element: HTMLDivElement | null;
    /** The element that scrolls. Use it for `scrollTop` or `scroll` listeners. */
    getScrollElement: () => Promise<HTMLElement>;
    scrollToTop: (duration?: number) => Promise<void>;
    scrollToBottom: (duration?: number) => Promise<void>;
    scrollByPoint: (x: number, y: number, duration: number) => Promise<void>;
    scrollToPoint: (
        x: number | undefined | null,
        y: number | undefined | null,
        duration?: number
    ) => Promise<void>;
};

/** `onIonScroll`'s argument: ion-content's `ionScroll` event, as far as callers read it. */
export type AppContentScrollEvent = { detail: AppContentScrollDetail; target: AppContentHandle };

/** `onIonScrollStart` / `onIonScrollEnd`'s argument. */
export type AppContentScrollStateEvent = {
    detail: { isScrolling: boolean };
    target: AppContentHandle;
};

export type AppContentProps = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'color' | 'style' | 'onScroll'
> & {
    /** Inline styles, plus the content's custom properties (`--background`, `--padding-top`, ...). */
    style?: AppToolbarStyle;
    /**
     * A theme color name. It sets the scroll area's background and text to the color's base and
     * contrast, as ion-content's `color` did. A name the theme doesn't define leaves the scroll
     * area transparent over `--background`, as it did with Ionic.
     */
    color?: string;
    /**
     * Scroll behind the page's header and footer: the content box keeps its place in the page,
     * and the scroll area and background extend over the header / footer, padded by their height.
     */
    fullscreen?: boolean;
    /** Scroll horizontally. Defaults to `false`. */
    scrollX?: boolean;
    /** Scroll vertically. Defaults to `true`. */
    scrollY?: boolean;
    /** Emit `onIonScrollStart` / `onIonScroll` / `onIonScrollEnd`. Off by default, as in Ionic. */
    scrollEvents?: boolean;
    /** Rubber-band overscroll; defaults to on for iOS mode on iOS devices. */
    forceOverscroll?: boolean;
    /** Where `slot="fixed"` children go relative to the scroll area (DOM and tab order). */
    fixedSlotPlacement?: 'before' | 'after';
    /** Platform look. Defaults to the closest `mode`, as Ionic did, else the document's. */
    mode?: IonMode;
    onIonScrollStart?: (event: AppContentScrollStateEvent) => void;
    /** At most once per frame while scrolling (needs `scrollEvents`). */
    onIonScroll?: (event: AppContentScrollEvent) => void;
    onIonScrollEnd?: (event: AppContentScrollStateEvent) => void;
    /** The scroll area's own `scroll` event (it doesn't bubble to the content root). */
    onScroll?: React.UIEventHandler<HTMLDivElement>;
    ref?: React.Ref<AppContentHandle>;
};

type ContentController = { handle: AppContentHandle; setScrollY: (enabled: boolean) => void };

const controllers = new WeakMap<Element, ContentController>();

/** Content roots: AppContent's, plus learn-card-base's remaining `ion-content`s. */
export const CONTENT_SELECTOR = 'ion-content, .app-content';

/** The element that scrolls inside an AppContent / ion-content root (null if none). */
export const getContentScrollElement = (content: Element): HTMLElement | null => {
    if (content.tagName === 'ION-CONTENT') {
        return content.shadowRoot?.querySelector<HTMLElement>('.inner-scroll') ?? null;
    }
    return content.querySelector<HTMLElement>(':scope > .app-content-scroll');
};

/**
 * Turns vertical scrolling on or off from outside React, as setting `ion-content.scrollY` did
 * (the sheet modal gesture locks the content below the top breakpoint). It holds until the
 * content's `scrollY` prop changes.
 */
export const setContentScrollY = (content: Element, enabled: boolean): void => {
    if (content.tagName === 'ION-CONTENT') {
        (content as HTMLElement & { scrollY?: boolean }).scrollY = enabled;
        return;
    }
    controllers.get(content)?.setScrollY(enabled);
};

/** Ionic's `isPlatform('ios')`. */
const isIosPlatform = (): boolean => {
    const ua = navigator.userAgent;
    if (/iPhone|iPod/i.test(ua) || /iPad/i.test(ua)) return true;
    return (
        /Macintosh/i.test(ua) &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(any-pointer:coarse)').matches
    );
};

const isRtl = (dir: string | undefined): boolean =>
    dir
        ? dir.toLowerCase() === 'rtl'
        : typeof document !== 'undefined' && document.dir.toLowerCase() === 'rtl';

/** The box fullscreen offsets are measured against: tabs, else the page, else the parent. */
const getPageElement = (el: HTMLElement): HTMLElement | null =>
    el.closest<HTMLElement>('ion-tabs') ??
    el.closest<HTMLElement>('ion-app, ion-page, .ion-page, page-inner, .popover-content') ??
    el.parentElement;

const newDetail = (): AppContentScrollDetail => ({
    type: 'scroll',
    event: undefined,
    scrollTop: 0,
    scrollLeft: 0,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    velocityX: 0,
    velocityY: 0,
    deltaX: 0,
    deltaY: 0,
    currentTime: 0,
    data: undefined,
    isScrolling: true,
});

const updateScrollDetail = (
    detail: AppContentScrollDetail,
    el: HTMLElement,
    timestamp: number,
    shouldStart: boolean
): void => {
    const prevX = detail.currentX;
    const prevY = detail.currentY;
    const prevT = detail.currentTime;
    const currentX = el.scrollLeft;
    const currentY = el.scrollTop;
    const timeDelta = timestamp - prevT;
    if (shouldStart) {
        detail.startTime = timestamp;
        detail.startX = currentX;
        detail.startY = currentY;
        detail.velocityX = detail.velocityY = 0;
    }
    detail.currentTime = timestamp;
    detail.currentX = detail.scrollLeft = currentX;
    detail.currentY = detail.scrollTop = currentY;
    detail.deltaX = currentX - detail.startX;
    detail.deltaY = currentY - detail.startY;
    if (timeDelta > 0 && timeDelta < 100) {
        const velocityX = (currentX - prevX) / timeDelta;
        const velocityY = (currentY - prevY) / timeDelta;
        detail.velocityX = velocityX * 0.7 + detail.velocityX * 0.3;
        detail.velocityY = velocityY * 0.7 + detail.velocityY * 0.3;
    }
};

/** ion-content's `scrollToPoint`: jump below 32ms, else ease out (cubic) over `duration`. */
const scrollElementToPoint = (
    el: HTMLElement,
    x: number | undefined | null,
    y: number | undefined | null,
    duration: number
): Promise<void> => {
    if (duration < 32) {
        if (y != null) el.scrollTop = y;
        if (x != null) el.scrollLeft = x;
        return Promise.resolve();
    }
    return new Promise(resolve => {
        let startTime = 0;
        const fromY = el.scrollTop;
        const fromX = el.scrollLeft;
        const deltaY = y != null ? y - fromY : 0;
        const deltaX = x != null ? x - fromX : 0;
        const step = (timeStamp: number): void => {
            const linearTime = Math.min(1, (timeStamp - startTime) / duration) - 1;
            const easedT = Math.pow(linearTime, 3) + 1;
            if (deltaY !== 0) el.scrollTop = Math.floor(easedT * deltaY + fromY);
            if (deltaX !== 0) el.scrollLeft = Math.floor(easedT * deltaX + fromX);
            if (easedT < 1) requestAnimationFrame(step);
            else resolve();
        };
        // Like Ionic, wait a frame before starting.
        requestAnimationFrame(ts => {
            startTime = ts;
            step(ts);
        });
    });
};

type Offsets = { top: number; bottom: number };

/**
 * App-owned replacement for `IonContent`: the page's scroll area, filling the rest of the page's
 * flex column. Same DOM as its shadow tree: a background layer and the scroll element (which
 * carries `ion-content-scroll-host`, so Ionic code still in learn-card-base finds it), with
 * `slot="fixed"` children after it (or before, with `fixedSlotPlacement="before"`).
 *
 * The custom properties ion-content read (`--background`, `--color`, `--padding-*`,
 * `--offset-*`, `--keyboard-offset`, `--overflow`) work the same, so call-site
 * `[--background:...]` utilities and `style={{ '--background': ... }}` keep working. The former
 * `::part(scroll)` / `::part(background)` are `> .app-content-scroll` / `> .app-content-background`.
 *
 * Like ion-content it is the `main` landmark unless it is inside a menu, popover or modal, and
 * `fullscreen` measures the header / footer overlap on mount, when its props change and on
 * window resize.
 */
export const AppContent: React.FC<AppContentProps> = ({
    color,
    fullscreen = false,
    scrollX = false,
    scrollY = true,
    scrollEvents = false,
    forceOverscroll,
    fixedSlotPlacement = 'after',
    mode: modeProp,
    onIonScrollStart,
    onIonScroll,
    onIonScrollEnd,
    onScroll,
    className,
    style,
    children,
    ref,
    ...rest
}) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const mode = useChromeMode(hostRef, modeProp);

    const [offsets, setOffsets] = useState<Offsets>({ top: 0, bottom: 0 });
    const [context, setContext] = useState({ isMain: true, inPopover: false, inTabs: false });
    const [scrollYOverride, setScrollYOverride] = useState<{ prop: boolean; value: boolean }>();
    const effectiveScrollY =
        scrollYOverride && scrollYOverride.prop === scrollY ? scrollYOverride.value : scrollY;

    const handle = useRef<AppContentHandle | null>(null);
    if (!handle.current) {
        const getScrollElement = (): Promise<HTMLElement> => {
            const el = scrollRef.current;
            return el
                ? Promise.resolve(el)
                : Promise.reject(new Error('AppContent is not mounted.'));
        };
        const scrollToPoint: AppContentHandle['scrollToPoint'] = async (x, y, duration = 0) =>
            scrollElementToPoint(await getScrollElement(), x, y, duration);
        handle.current = {
            get element() {
                return hostRef.current;
            },
            getScrollElement,
            scrollToPoint,
            scrollToTop: (duration = 0) => scrollToPoint(undefined, 0, duration),
            scrollToBottom: async (duration = 0) => {
                const el = await getScrollElement();
                return scrollToPoint(undefined, el.scrollHeight - el.clientHeight, duration);
            },
            scrollByPoint: async (x, y, duration) => {
                const el = await getScrollElement();
                return scrollToPoint(x + el.scrollLeft, y + el.scrollTop, duration);
            },
        };
    }
    useImperativeHandle(ref, () => handle.current as AppContentHandle, []);

    // The ancestors ion-content looked at when it connected.
    useLayoutEffect(() => {
        const el = hostRef.current;
        if (!el) return;
        setContext({
            // AppOverlayModal stands in for ion-modal (`.app-modal-wrapper`).
            isMain: el.closest('ion-menu, ion-popover, ion-modal, .app-modal-wrapper') === null,
            inPopover: el.closest('ion-popover') !== null,
            inTabs: el.closest('.app-tabs-inner') !== null,
        });
    }, []);

    useLayoutEffect(() => {
        const el = hostRef.current;
        if (!el) return undefined;
        controllers.set(el, {
            handle: handle.current as AppContentHandle,
            setScrollY: value => setScrollYOverride({ prop: scrollY, value }),
        });
        return () => {
            controllers.delete(el);
        };
    }, [scrollY]);

    // Fullscreen offsets: measured whenever ion-content re-rendered (any prop change) and a frame
    // later (Ionic measured in a read task after rendering), and on window resize. Ionic only
    // applied the offsets when fullscreen, so non-fullscreen content just resets them and
    // schedules nothing.
    useLayoutEffect(() => {
        if (!fullscreen) {
            setOffsets(prev =>
                prev.top === 0 && prev.bottom === 0 ? prev : { top: 0, bottom: 0 }
            );
            return;
        }
        const measure = (): void => {
            const el = hostRef.current;
            if (!el) return;
            const page = getPageElement(el);
            const top = Math.max(el.offsetTop, 0);
            const bottom = Math.max((page?.offsetHeight ?? 0) - top - el.offsetHeight, 0);
            setOffsets(prev =>
                prev.top === top && prev.bottom === bottom ? prev : { top, bottom }
            );
        };
        measure();
        const frame = requestAnimationFrame(measure);
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const onResize = (): void => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Hidden content (no offsetParent) isn't measured.
                if (hostRef.current?.offsetParent === null) return;
                measure();
            }, 100);
        };
        window.addEventListener('resize', onResize, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            clearTimeout(timeout);
            window.removeEventListener('resize', onResize);
        };
    }, [fullscreen, color, scrollX, effectiveScrollY, scrollEvents, forceOverscroll, mode]);

    // ionScrollStart / ionScroll / ionScrollEnd.
    const callbacks = useRef({ onIonScrollStart, onIonScroll, onIonScrollEnd });
    callbacks.current = { onIonScrollStart, onIonScroll, onIonScrollEnd };
    const scrollState = useRef({
        isScrolling: false,
        lastScroll: 0,
        queued: false,
        frame: 0,
        watchDog: undefined as ReturnType<typeof setInterval> | undefined,
        detail: newDetail(),
    });

    const onScrollEnd = (): void => {
        const state = scrollState.current;
        clearInterval(state.watchDog);
        state.watchDog = undefined;
        if (state.isScrolling) {
            state.isScrolling = false;
            callbacks.current.onIonScrollEnd?.({
                detail: { isScrolling: false },
                target: handle.current as AppContentHandle,
            });
        }
    };

    const onScrollStart = (): void => {
        const state = scrollState.current;
        state.isScrolling = true;
        callbacks.current.onIonScrollStart?.({
            detail: { isScrolling: true },
            target: handle.current as AppContentHandle,
        });
        clearInterval(state.watchDog);
        state.watchDog = setInterval(() => {
            if (state.lastScroll < Date.now() - 120) onScrollEnd();
        }, 100);
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>): void => {
        onScroll?.(event);
        if (!scrollEvents) return;
        const state = scrollState.current;
        const timeStamp = Date.now();
        const shouldStart = !state.isScrolling;
        state.lastScroll = timeStamp;
        if (shouldStart) onScrollStart();
        if (!state.queued) {
            state.queued = true;
            const nativeEvent = event.nativeEvent;
            state.frame = requestAnimationFrame(ts => {
                state.queued = false;
                const scrollEl = scrollRef.current;
                if (!scrollEl) return;
                state.detail.event = nativeEvent;
                updateScrollDetail(state.detail, scrollEl, ts, shouldStart);
                callbacks.current.onIonScroll?.({
                    detail: { ...state.detail },
                    target: handle.current as AppContentHandle,
                });
            });
        }
    };

    // Like ion-content's disconnectedCallback: end an in-progress scroll on unmount.
    useEffect(
        () => () => {
            cancelAnimationFrame(scrollState.current.frame);
            scrollState.current.queued = false;
            onScrollEnd();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only; reads refs
        []
    );

    const overscroll = forceOverscroll ?? (mode === 'ios' && isIosPlatform());
    const hostClasses = [
        'app-content',
        mode,
        `content-${isRtl(rest.dir) ? 'rtl' : 'ltr'}`,
        overscroll && 'app-content-overscroll',
        context.inPopover && 'app-content-sizing',
        color && `ion-color ion-color-${color}`,
        fullscreen && context.inTabs && FULLSCREEN_CONTENT_CLASS,
        className,
    ];
    const scrollClasses = [
        'app-content-scroll',
        'ion-content-scroll-host',
        scrollX && 'app-content-scroll-x',
        effectiveScrollY && 'app-content-scroll-y',
        (scrollX || effectiveScrollY) && overscroll && 'app-content-overscroll',
    ];

    const fixed: React.ReactNode[] = [];
    const main: React.ReactNode[] = [];
    React.Children.toArray(children).forEach(child => {
        const slot = React.isValidElement<{ slot?: unknown }>(child) ? child.props.slot : undefined;
        if (slot === 'fixed') fixed.push(child);
        // Children with another slot name were never assigned to a shadow <slot>.
        else if (slot === undefined || slot === null || slot === '') main.push(child);
    });

    const hostStyle: React.CSSProperties & {
        [property: `--${string}`]: string | number | undefined;
    } = {
        ...style,
        '--offset-top': `${offsets.top}px`,
        '--offset-bottom': `${offsets.bottom}px`,
    };

    return (
        <div
            role={context.isMain ? 'main' : undefined}
            {...rest}
            {...(modeProp ? { mode: modeProp } : {})}
            ref={hostRef}
            className={hostClasses.filter(Boolean).join(' ')}
            style={hostStyle}
        >
            <div className="app-content-background" />
            {fixedSlotPlacement === 'before' && fixed}
            <div
                ref={scrollRef}
                className={scrollClasses.filter(Boolean).join(' ')}
                onScroll={handleScroll}
            >
                {main}
            </div>
            {fixedSlotPlacement === 'after' && fixed}
        </div>
    );
};

export default AppContent;

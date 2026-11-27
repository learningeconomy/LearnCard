import React, { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './reorder.css';

/** `ionReorderMove` detail. `from` is the index the item was over before this move, as in Ionic. */
export type AppReorderMoveEventDetail = { from: number; to: number };

/** `ionReorderEnd` / `ionItemReorder` detail. Call `complete()` to finish the reorder. */
export type AppReorderEndEventDetail = {
    from: number;
    to: number;
    /**
     * Finishes the reorder. `true` or nothing keeps the item where it was dropped, `false` puts it
     * back, and an array is returned reordered (`from` moved to `to`).
     */
    complete: <T>(listOrReorder?: boolean | T[]) => boolean | T[] | undefined;
};

/** Ionic's names for the same details, so call sites can keep their types. */
export type ItemReorderEventDetail = AppReorderEndEventDetail;
export type ReorderMoveEventDetail = AppReorderMoveEventDetail;
export type ReorderEndEventDetail = AppReorderEndEventDetail;

export type AppReorderStartEvent = CustomEvent<void>;
export type AppReorderMoveEvent = CustomEvent<AppReorderMoveEventDetail>;
export type AppReorderEndEvent = CustomEvent<AppReorderEndEventDetail>;

export type AppReorderGroupHandle = {
    /** The group element. */
    el: HTMLDivElement | null;
    /** `ion-reorder-group`'s `complete()`: the same as the event detail's. */
    complete: <T>(listOrReorder?: boolean | T[]) => Promise<boolean | T[] | undefined>;
};

export type AppReorderGroupProps = {
    /** No dragging, and the handles lose their grab styling. Defaults to `true`, as on ion-reorder-group. */
    disabled?: boolean;
    /** Platform class (`md` / `ios`) on the group. Defaults to the document's Ionic mode. */
    mode?: IonMode;
    className?: string;
    children?: React.ReactNode;
    /** A drag started. */
    onIonReorderStart?: (event: AppReorderStartEvent) => void;
    /** The dragged item moved; fired on every move frame. */
    onIonReorderMove?: (event: AppReorderMoveEvent) => void;
    /** The drag ended, with `from` and `to` (equal if the item didn't move). Call `detail.complete()`. */
    onIonReorderEnd?: (event: AppReorderEndEvent) => void;
    /** Ionic's deprecated event: as `onIonReorderEnd`, but only when `from !== to`. */
    onIonItemReorder?: (event: AppReorderEndEvent) => void;
    ref?: React.Ref<AppReorderGroupHandle>;
};

// ------------------------------------------------------------------ constants (reorder-group.tsx)
const AUTO_SCROLL_MARGIN = 60;
const SCROLL_JUMP = 10;
const ITEM_REORDER_SELECTED = 'reorder-selected';
/** utils/gesture/pointer-events.ts: mouse events are ignored this long after a touch. */
const MOUSE_WAIT = 2000;

const enum ReorderGroupState {
    Idle = 0,
    Active = 1,
    Complete = 2,
}

/** Handles inside a group (AppReorder's class). */
export const REORDER_HANDLE_SELECTOR = '.app-reorder';
export const REORDER_GROUP_SELECTOR = '.app-reorder-group';

// ------------------------------------------------------------- gesture capture (gesture-controller.ts)
/**
 * Ionic's GESTURE_CONTROLLER let one gesture capture the pointer at a time. Nested groups both see a
 * press on an inner handle (the inner one first, as the event bubbles); the first to capture owns
 * the drag until the pointer is released.
 */
let capturedBy: object | undefined;

// ---------------------------------------------------------------------- haptics (utils/native/haptic)
type HapticKind = 'selectionStart' | 'selectionChanged' | 'selectionEnd';
/** Ionic's selection haptics; the Capacitor plugin is only there on native builds. */
const haptic = (kind: HapticKind): void => {
    if (!Capacitor.isNativePlatform()) return;
    import('@capacitor/haptics').then(({ Haptics }) => Haptics[kind]()).catch(() => undefined);
};

const reorderArray = <T,>(array: T[], from: number, to: number): T[] => {
    const element = array[from];
    array.splice(from, 1);
    array.splice(to, 0, element);
    return array.slice();
};

/** The direct child of `container` that holds `node`. */
const findReorderItem = (node: Element, container: Element): HTMLElement | undefined => {
    let current: Element | null = node;
    while (current) {
        const parent: Element | null = current.parentElement;
        if (parent === container) return current as HTMLElement;
        current = parent;
    }
    return undefined;
};

const isScrollable = (el: Element): boolean =>
    /(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY);

/**
 * The element auto-scroll drives: the closest ion-content's scroll element (or an
 * `.ion-content-scroll-host`), as in Ionic, else the closest ancestor that scrolls vertically.
 */
const findScrollElement = (el: HTMLElement): HTMLElement | undefined => {
    const content = el.closest<HTMLElement>('ion-content, .ion-content-scroll-host');
    if (content) {
        if (content.tagName !== 'ION-CONTENT') return content;
        return content.shadowRoot?.querySelector<HTMLElement>('.inner-scroll') ?? undefined;
    }
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
        if (isScrollable(node)) return node;
    }
    return undefined;
};

type GestureDetail = {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    event?: Event;
    data?: HTMLElement;
};

/** The pointer's viewport position (the touch's, or the mouse's). */
const updateDetail = (ev: Event | undefined, detail: GestureDetail) => {
    let x = 0;
    let y = 0;
    if (ev) {
        const changedTouches = (ev as TouchEvent).changedTouches;
        if (changedTouches && changedTouches.length > 0) {
            x = changedTouches[0].clientX;
            y = changedTouches[0].clientY;
        } else if ((ev as MouseEvent).clientX !== undefined) {
            x = (ev as MouseEvent).clientX;
            y = (ev as MouseEvent).clientY;
        }
    }
    detail.currentX = x;
    detail.currentY = y;
};

type Callbacks = Pick<
    AppReorderGroupProps,
    'onIonReorderStart' | 'onIonReorderMove' | 'onIonReorderEnd' | 'onIonItemReorder'
>;

/**
 * App-owned replacement for `IonReorderGroup`, a port of @ionic/core 8.7.2 ion-reorder-group and the
 * y-direction pan gesture it used (threshold 0). Its direct children are the items; pressing an
 * `AppReorder` handle inside one (mouse or touch) drags that item:
 * - the item gets `reorder-selected` and follows the pointer (clamped to the group), the items it
 *   passes slide by its height, and the group gets `reorder-list-active`;
 * - near the top or bottom 60px of the scroll element each move scrolls it by 10px;
 * - on release `onIonReorderEnd` fires with `{ from, to, complete }`. `complete()` clears the
 *   transforms and, unless the app already re-rendered the list in the new order, moves the item's
 *   node like Ionic did.
 *
 * Only handles whose closest group is this one start a drag, so a nested group's items only move
 * within that group. Its events don't bubble, so an outer group's handlers never see them.
 */
export const AppReorderGroup: React.FC<AppReorderGroupProps> = ({
    disabled = true,
    mode: modeProp,
    className,
    children,
    onIonReorderStart,
    onIonReorderMove,
    onIonReorderEnd,
    onIonItemReorder,
    ref,
}) => {
    const mode = modeProp ?? getIonMode();
    const elRef = useRef<HTMLDivElement>(null);
    const callbacks = useRef<Callbacks>({});
    callbacks.current = { onIonReorderStart, onIonReorderMove, onIonReorderEnd, onIonItemReorder };

    // Everything the drag reads and writes, outside React state so a drag never re-renders the list.
    const g = useRef({
        state: ReorderGroupState.Idle as ReorderGroupState,
        listActive: false,
        selectedItemEl: undefined as HTMLElement | undefined,
        indexes: new WeakMap<Element, number>(),
        lastToIndex: -1,
        cachedHeights: [] as number[],
        selectedItemHeight: 0,
        containerTop: 0,
        containerBottom: 0,
        scrollEl: undefined as HTMLElement | undefined,
        scrollElTop: 0,
        scrollElBottom: 0,
        scrollElInitial: 0,
    }).current;

    // Ionic re-rendered its host classes on the frame after a state change, after that frame's
    // transform writes. `listActive` is what the DOM shows, so a React render in between (the
    // app re-rendering the list on drop) doesn't drop the class before the transforms reset.
    const syncListActive = useCallback(() => {
        g.listActive = g.state !== ReorderGroupState.Idle;
        elRef.current?.classList.toggle('reorder-list-active', g.listActive);
    }, [g]);
    const setState = useCallback(
        (state: ReorderGroupState) => {
            g.state = state;
            requestAnimationFrame(syncListActive);
        },
        [g, syncListActive]
    );

    const completeReorder = useCallback(
        <T,>(listOrReorder?: boolean | T[]): boolean | T[] | undefined => {
            const el = elRef.current;
            const selectedItemEl = g.selectedItemEl;
            if (el && selectedItemEl && g.state === ReorderGroupState.Complete) {
                const items = el.children;
                const len = items.length;
                const toIndex = g.lastToIndex;
                const fromIndex = g.indexes.get(selectedItemEl) ?? -1;
                // The node move, the transform reset and the list-active class share a frame, as
                // in Ionic. When the app has already re-rendered the list in the new order, the
                // move leaves the order as it is.
                requestAnimationFrame(() => {
                    if (
                        toIndex !== fromIndex &&
                        (listOrReorder === undefined || listOrReorder === true)
                    ) {
                        const insertRef = fromIndex < toIndex ? items[toIndex + 1] : items[toIndex];
                        el.insertBefore(selectedItemEl, insertRef ?? null);
                    }
                    for (let i = 0; i < len; i++) {
                        (items[i] as HTMLElement | undefined)?.style.setProperty('transform', '');
                    }
                    syncListActive();
                });
                if (Array.isArray(listOrReorder)) {
                    listOrReorder = reorderArray(listOrReorder, fromIndex, toIndex);
                }
                selectedItemEl.style.transition = '';
                selectedItemEl.classList.remove(ITEM_REORDER_SELECTED);
                g.selectedItemEl = undefined;
                g.state = ReorderGroupState.Idle;
            }
            return listOrReorder;
        },
        [g, syncListActive]
    );

    useImperativeHandle(
        ref,
        () => ({
            get el() {
                return elRef.current;
            },
            complete: listOrReorder => Promise.resolve(completeReorder(listOrReorder)),
        }),
        [completeReorder]
    );

    // The drag lifecycle, set up once; `disabled` only turns the press listeners on and off.
    const gesture = useRef<{ enable: (on: boolean) => void; destroy: () => void } | undefined>(
        undefined
    );
    useEffect(() => {
        const el = elRef.current;
        if (!el) return undefined;
        const owner = {};

        // The events are dispatched on the group, as Ionic's were, so a state update in a handler
        // gets React's default priority (a later task) rather than a pointer event's synchronous
        // one: the list re-renders after the drop's own DOM writes, as with Ionic. They don't
        // bubble, so an outer group never sees a nested group's events.
        const handlers: Record<string, (ev: Event) => void> = {
            ionReorderStart: ev =>
                callbacks.current.onIonReorderStart?.(ev as AppReorderStartEvent),
            ionReorderMove: ev => callbacks.current.onIonReorderMove?.(ev as AppReorderMoveEvent),
            ionReorderEnd: ev => callbacks.current.onIonReorderEnd?.(ev as AppReorderEndEvent),
            ionItemReorder: ev => callbacks.current.onIonItemReorder?.(ev as AppReorderEndEvent),
        };
        for (const [type, handler] of Object.entries(handlers)) el.addEventListener(type, handler);
        const emit = (type: keyof typeof handlers, detail: unknown) => {
            el.dispatchEvent(new CustomEvent(type, { detail, cancelable: true }));
        };

        const itemIndexForTop = (deltaY: number): number => {
            const heights = g.cachedHeights;
            for (let i = 0; i < heights.length; i++) {
                if (heights[i] > deltaY) return i;
            }
            return heights.length - 1;
        };

        const reorderMove = (fromIndex: number, toIndex: number) => {
            const itemHeight = g.selectedItemHeight;
            const items = el.children;
            for (let i = 0; i < items.length; i++) {
                let value = '';
                if (i > fromIndex && i <= toIndex) value = `translateY(${-itemHeight}px)`;
                else if (i < fromIndex && i >= toIndex) value = `translateY(${itemHeight}px)`;
                (items[i] as HTMLElement).style.transform = value;
            }
        };

        const autoscroll = (posY: number): number => {
            const scrollEl = g.scrollEl;
            if (!scrollEl) return 0;
            let amount = 0;
            if (posY < g.scrollElTop) amount = -SCROLL_JUMP;
            else if (posY > g.scrollElBottom) amount = SCROLL_JUMP;
            if (amount !== 0) scrollEl.scrollBy(0, amount);
            return scrollEl.scrollTop - g.scrollElInitial;
        };

        const canStart = (detail: GestureDetail): boolean => {
            if (g.selectedItemEl || g.state !== ReorderGroupState.Idle) return false;
            const target = detail.event?.target;
            if (!(target instanceof Element)) return false;
            const handle = target.closest(REORDER_HANDLE_SELECTOR);
            if (!handle || handle.closest(REORDER_GROUP_SELECTOR) !== el) return false;
            const item = findReorderItem(handle, el);
            if (!item) return false;
            detail.data = item;
            return true;
        };

        const onStart = (detail: GestureDetail) => {
            detail.event?.preventDefault();
            const item = detail.data!;
            g.selectedItemEl = item;
            const heights = g.cachedHeights;
            heights.length = 0;
            const items = el.children;
            if (!items || items.length === 0) return;
            let sum = 0;
            for (let i = 0; i < items.length; i++) {
                const child = items[i] as HTMLElement;
                sum += child.offsetHeight;
                heights.push(sum);
                g.indexes.set(child, i);
            }
            const box = el.getBoundingClientRect();
            g.containerTop = box.top;
            g.containerBottom = box.bottom;
            g.scrollEl = findScrollElement(el);
            if (g.scrollEl) {
                const scrollBox = g.scrollEl.getBoundingClientRect();
                g.scrollElInitial = g.scrollEl.scrollTop;
                g.scrollElTop = scrollBox.top + AUTO_SCROLL_MARGIN;
                g.scrollElBottom = scrollBox.bottom - AUTO_SCROLL_MARGIN;
            } else {
                g.scrollElInitial = 0;
                g.scrollElTop = 0;
                g.scrollElBottom = 0;
            }
            g.lastToIndex = g.indexes.get(item) ?? -1;
            g.selectedItemHeight = item.offsetHeight;
            setState(ReorderGroupState.Active);
            item.classList.add(ITEM_REORDER_SELECTED);
            haptic('selectionStart');
            emit('ionReorderStart', undefined);
        };

        const onMove = (detail: GestureDetail) => {
            const selectedItem = g.selectedItemEl;
            if (!selectedItem) return;
            const scroll = autoscroll(detail.currentY);
            const top = g.containerTop - scroll;
            const bottom = g.containerBottom - scroll;
            const currentY = Math.max(top, Math.min(detail.currentY, bottom));
            const deltaY = scroll + currentY - detail.startY;
            const normalizedY = currentY - top;
            const fromIndex = g.lastToIndex;
            const toIndex = itemIndexForTop(normalizedY);
            if (toIndex !== g.lastToIndex) {
                const from = g.indexes.get(selectedItem) ?? -1;
                g.lastToIndex = toIndex;
                haptic('selectionChanged');
                reorderMove(from, toIndex);
            }
            selectedItem.style.transform = `translateY(${deltaY}px)`;
            emit('ionReorderMove', { from: fromIndex, to: toIndex });
        };

        const onEnd = () => {
            const selectedItemEl = g.selectedItemEl;
            g.state = ReorderGroupState.Complete;
            if (!selectedItemEl) {
                setState(ReorderGroupState.Idle);
                return;
            }
            const toIndex = g.lastToIndex;
            const fromIndex = g.indexes.get(selectedItemEl) ?? -1;
            const complete = completeReorder as AppReorderEndEventDetail['complete'];
            if (toIndex === fromIndex) {
                completeReorder();
            } else {
                emit('ionItemReorder', { from: fromIndex, to: toIndex, complete });
            }
            haptic('selectionEnd');
            emit('ionReorderEnd', { from: fromIndex, to: toIndex, complete });
        };

        // ------------------------------------------------ createGesture (utils/gesture/index.ts)
        const detail: GestureDetail = { startX: 0, startY: 0, currentX: 0, currentY: 0 };
        let hasCapturedPan = false;
        let hasStartedPan = false;
        let hasFiredStart = true;
        let isMoveQueued = false;

        const release = () => {
            if (capturedBy === owner) capturedBy = undefined;
        };

        const reset = () => {
            hasCapturedPan = false;
            hasStartedPan = false;
            isMoveQueued = false;
            hasFiredStart = true;
            release();
        };

        const tryToCapturePan = (): boolean => {
            if (capturedBy !== undefined) return false;
            capturedBy = owner;
            hasCapturedPan = true;
            hasFiredStart = false;
            detail.startX = detail.currentX;
            detail.startY = detail.currentY;
            onStart(detail);
            hasFiredStart = true;
            return true;
        };

        const pointerDown = (ev: Event): boolean => {
            if (hasStartedPan || !hasFiredStart) return false;
            updateDetail(ev, detail);
            detail.startX = detail.currentX;
            detail.startY = detail.currentY;
            detail.event = ev;
            if (!canStart(detail)) return false;
            release();
            if (capturedBy !== undefined) return false;
            hasStartedPan = true;
            return tryToCapturePan();
        };

        const fireOnMove = () => {
            // onEnd may have run before this frame.
            if (!hasCapturedPan) return;
            isMoveQueued = false;
            onMove(detail);
        };

        const pointerMove = (ev: Event) => {
            if (!hasCapturedPan) return;
            if (!isMoveQueued && hasFiredStart) {
                isMoveQueued = true;
                updateDetail(ev, detail);
                detail.event = ev;
                requestAnimationFrame(fireOnMove);
            }
        };

        const pointerUp = (ev: Event | undefined) => {
            const wasCaptured = hasCapturedPan;
            const firedStart = hasFiredStart;
            reset();
            if (!firedStart) return;
            if (ev) {
                updateDetail(ev, detail);
                detail.event = ev;
            }
            if (wasCaptured) onEnd();
        };

        // --------------------------------------- createPointerEvents (utils/gesture/pointer-events.ts)
        const options: AddEventListenerOptions = { capture: false, passive: false };
        let lastTouchEvent = 0;
        let stopTouch: (() => void) | undefined;
        let stopMouse: (() => void) | undefined;

        const handleTouchEnd = (ev: Event) => {
            stopTouch?.();
            pointerUp(ev);
        };
        const handleMouseUp = (ev: Event) => {
            stopMouse?.();
            pointerUp(ev);
        };

        const handleTouchStart = (ev: TouchEvent) => {
            lastTouchEvent = Date.now() + MOUSE_WAIT;
            if (!pointerDown(ev)) return;
            if (stopTouch) return;
            const target = ev.target as EventTarget;
            el.addEventListener('touchmove', pointerMove, options);
            target.addEventListener('touchend', handleTouchEnd, options);
            target.addEventListener('touchcancel', handleTouchEnd, options);
            stopTouch = () => {
                el.removeEventListener('touchmove', pointerMove, options);
                target.removeEventListener('touchend', handleTouchEnd, options);
                target.removeEventListener('touchcancel', handleTouchEnd, options);
                stopTouch = undefined;
            };
        };

        const handleMouseDown = (ev: MouseEvent) => {
            if (lastTouchEvent > Date.now()) return;
            if (!pointerDown(ev)) return;
            if (stopMouse) return;
            const doc = el.ownerDocument;
            doc.addEventListener('mousemove', pointerMove, options);
            doc.addEventListener('mouseup', handleMouseUp, options);
            stopMouse = () => {
                doc.removeEventListener('mousemove', pointerMove, options);
                doc.removeEventListener('mouseup', handleMouseUp, options);
                stopMouse = undefined;
            };
        };

        let enabled = false;
        const enable = (on: boolean) => {
            if (!on) {
                if (hasCapturedPan) pointerUp(undefined);
                reset();
                if (enabled) {
                    el.removeEventListener('touchstart', handleTouchStart, options);
                    el.removeEventListener('mousedown', handleMouseDown, options);
                }
                stopTouch?.();
                stopMouse?.();
            } else if (!enabled) {
                el.addEventListener('touchstart', handleTouchStart, options);
                el.addEventListener('mousedown', handleMouseDown, options);
            }
            enabled = on;
        };

        gesture.current = {
            enable,
            destroy: () => {
                onEnd();
                enable(false);
            },
        };
        return () => {
            gesture.current?.destroy();
            gesture.current = undefined;
            for (const [type, handler] of Object.entries(handlers)) {
                el.removeEventListener(type, handler);
            }
        };
    }, [g, completeReorder, setState]);

    useEffect(() => {
        gesture.current?.enable(!disabled);
    }, [disabled]);

    const classes = [
        'app-reorder-group',
        mode,
        !disabled && 'reorder-enabled',
        g.listActive && 'reorder-list-active',
        className,
    ];

    return (
        <div ref={elRef} className={classes.filter(Boolean).join(' ')}>
            {children}
        </div>
    );
};

export default AppReorderGroup;

import React, {
    forwardRef,
    useCallback,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal, flushSync } from 'react-dom';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { modalEnterAnimation, modalLeaveAnimation, type ModalParts } from './modalAnimations';
import {
    getOverlayRoot,
    nextStackZIndex,
    type OverlayDismissEvent,
    type OverlayRole,
} from './overlayStack';
import { createSheetGesture, type SheetController } from './sheetGesture';
import { OVERLAY_HIDDEN_CLASS, useIsOpen, useOverlayLifecycle } from './useOverlayLifecycle';

import './overlays.css';
import './modal.css';

/** Ionic's modal z-index tier (20000 + overlay index). */
const MODAL_TIER = 20000;
const GESTURE = 'gesture';
const FOCUS_TRAP_DISABLE_CLASS = 'ion-disable-focus-trap';
const HANDLE_LABEL = 'Activate to adjust the size of the dialog overlaying the screen';

/** ion-modal's `ionViewWillEnter` / ... events on the presented content (Ionic's LIFECYCLE_MAP). */
const LIFECYCLE = {
    willPresent: 'ionViewWillEnter',
    didPresent: 'ionViewDidEnter',
    willDismiss: 'ionViewWillLeave',
    didDismiss: 'ionViewDidLeave',
} as const;

export type AppOverlayModalProps = {
    isOpen?: boolean;
    children?: React.ReactNode;
    /** Classes for the modal host (Ionic's `cssClass`), e.g. `center-modal user-options-modal`. */
    cssClass?: string | string[];
    className?: string;
    id?: string;
    /** Tapping the backdrop, Escape and the back button dismiss with role `backdrop`. Default true. */
    backdropDismiss?: boolean;
    showBackdrop?: boolean;
    /** Sheet modal: both `breakpoints` and `initialBreakpoint`. */
    breakpoints?: number[];
    initialBreakpoint?: number;
    backdropBreakpoint?: number;
    handle?: boolean;
    handleBehavior?: 'none' | 'cycle';
    keyboardClose?: boolean;
    focusTrap?: boolean;
    animated?: boolean;
    mode?: IonMode;
    /** Moved to the dialog element, as ion-modal did. */
    'aria-label'?: string;
    role?: string;
    onWillPresent?: () => void;
    onDidPresent?: () => void;
    onWillDismiss?: (event: OverlayDismissEvent) => void;
    onDidDismiss?: (event: OverlayDismissEvent) => void;
    onBreakpointDidChange?: (breakpoint: number) => void;
};

export type AppOverlayModalHandle = {
    present: () => Promise<void>;
    dismiss: (data?: unknown, role?: OverlayRole) => Promise<boolean>;
    setCurrentBreakpoint: (breakpoint: number) => Promise<void>;
    getCurrentBreakpoint: () => number | undefined;
};

/** Removes `role="main"` from every ion-content under `root`, now and as content renders. */
const unmarkMainContent = (root: HTMLElement): (() => void) => {
    const unmark = (el: Element): void => {
        if (el.tagName === 'ION-CONTENT' && el.getAttribute('role') === 'main') {
            el.removeAttribute('role');
        }
    };
    const sweep = (): void => root.querySelectorAll('ion-content[role="main"]').forEach(unmark);
    sweep();
    if (typeof MutationObserver === 'undefined') return () => undefined;
    const observer = new MutationObserver(records => {
        for (const record of records) {
            if (record.type === 'attributes') unmark(record.target as Element);
            else sweep();
        }
    });
    observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['role'],
    });
    return () => observer.disconnect();
};

const classList = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value.join(' ') : (value ?? '');

/**
 * App-owned `ion-modal` (@ionic/core 8.7.2, what @ionic/react resolves): a dialog over a backdrop, centered on tablets and
 * full screen on phones, or a bottom sheet with breakpoints, a drag gesture and a cycling handle.
 * Renders into `ion-app` while presented. `useAppOverlayModal` is the `useIonModal` replacement;
 * this component is its declarative form (`isOpen`) and what the hook renders.
 */
export const AppOverlayModal = forwardRef<AppOverlayModalHandle, AppOverlayModalProps>(
    (props, ref) => {
        const {
            isOpen,
            children,
            cssClass,
            className,
            id,
            backdropDismiss = true,
            showBackdrop = true,
            breakpoints,
            initialBreakpoint,
            backdropBreakpoint = 0,
            handle,
            handleBehavior = 'none',
            keyboardClose = true,
            focusTrap = true,
            animated = true,
            mode: modeProp,
            'aria-label': ariaLabel,
            role,
        } = props;
        const propsRef = useRef(props);
        propsRef.current = props;
        const mode = modeProp ?? getIonMode();
        const sortedBreakpoints = useMemo(
            () => (breakpoints ? [...breakpoints].sort((a, b) => a - b) : undefined),
            [breakpoints]
        );
        const isSheet = sortedBreakpoints !== undefined && initialBreakpoint !== undefined;
        const showHandle = handle !== false && isSheet;
        const isCycle = handleBehavior === 'cycle';

        const [shown, setShown] = useState(false);
        const [zIndex, setZIndex] = useState(MODAL_TIER);
        const wrapperRef = useRef<HTMLDivElement | null>(null);
        const backdropRef = useRef<HTMLDivElement | null>(null);
        const shadowRef = useRef<HTMLDivElement | null>(null);
        const handleRef = useRef<HTMLButtonElement | null>(null);
        const sheet = useRef<SheetController | null>(null);
        const runtime = useRef<{
            breakpoint?: number;
            /** Classes the modal toggles itself (the sheet's focus trap); kept across renders. */
            hostClasses: Map<string, boolean>;
        }>({ hostClasses: new Map() });

        const parts = (): ModalParts => ({
            backdrop: backdropRef.current,
            wrapper: wrapperRef.current,
            shadow: shadowRef.current,
        });

        const contentRoots = (): Element[] =>
            Array.from(wrapperRef.current?.children ?? []).filter(el => el !== handleRef.current);

        const dispatchLifecycle = (name: string): void => {
            const target = wrapperRef.current?.querySelector(':scope > .ion-page');
            target?.dispatchEvent(new CustomEvent(name, { bubbles: false, cancelable: false }));
        };

        const setHostClass = (host: HTMLElement, name: string, on: boolean): void => {
            runtime.current.hostClasses.set(name, on);
            host.classList.toggle(name, on);
        };

        const currentBreakpoint = (): number | undefined =>
            sheet.current?.getCurrentBreakpoint() ?? runtime.current.breakpoint;

        const lifecycle = useOverlayLifecycle({
            kind: 'modal',
            backdropDismiss,
            trap: 'shadow',
            // ion-modal's trap only searched its light DOM: the content, not the shadow handle.
            trapRoot: () => {
                const roots = contentRoots();
                return roots.length === 1 ? (roots[0] as HTMLElement) : wrapperRef.current;
            },
            keyboardClose,
            animated,
            canDismiss: dismissRole => !(sheet.current?.isDismissing() && dismissRole !== GESTURE),
            enter: host => {
                const r = runtime.current;
                r.breakpoint = isSheet ? initialBreakpoint : undefined;
                flushSync(() => {
                    setShown(true);
                    setZIndex(nextStackZIndex(MODAL_TIER, host));
                });
                return modalEnterAnimation(mode, parts(), {
                    breakpoint: r.breakpoint,
                    backdropBreakpoint,
                });
            },
            leave: () =>
                modalLeaveAnimation(mode, parts(), {
                    breakpoint: isSheet ? (currentBreakpoint() ?? initialBreakpoint) : undefined,
                    backdropBreakpoint,
                }),
            onPresented: () => {
                const host = lifecycle.hostRef.current;
                const wrapper = wrapperRef.current;
                const backdrop = backdropRef.current;
                if (!host || !wrapper || !backdrop) return;
                const r = runtime.current;
                // The resting sheet is a paused Web Animation (none without the API, e.g. jsdom).
                const canAnimate = typeof wrapper.animate === 'function';
                if (canAnimate && isSheet && sortedBreakpoints && initialBreakpoint !== undefined) {
                    sheet.current = createSheetGesture({
                        host,
                        wrapper,
                        backdrop,
                        sliding: [wrapper, shadowRef.current].filter(
                            (el): el is HTMLDivElement => !!el
                        ),
                        breakpoints: sortedBreakpoints,
                        initialBreakpoint,
                        backdropBreakpoint,
                        animated: () => propsRef.current.animated !== false,
                        setHostClass: (name, on) => setHostClass(host, name, on),
                        onBreakpointChange: breakpoint => {
                            if (r.breakpoint !== breakpoint) {
                                r.breakpoint = breakpoint;
                                propsRef.current.onBreakpointDidChange?.(breakpoint);
                            }
                        },
                        onDismiss: () => {
                            r.breakpoint = 0;
                            propsRef.current.onBreakpointDidChange?.(0);
                            void lifecycle.dismiss(GESTURE);
                        },
                    });
                }
            },
            onDismissStart: () => {
                const host = lifecycle.hostRef.current;
                const r = runtime.current;
                r.breakpoint = currentBreakpoint();
                sheet.current?.destroy();
                sheet.current = null;
                if (host) r.hostClasses.clear();
            },
            onWillPresent: () => {
                dispatchLifecycle(LIFECYCLE.willPresent);
                propsRef.current.onWillPresent?.();
            },
            onDidPresent: () => {
                dispatchLifecycle(LIFECYCLE.didPresent);
                propsRef.current.onDidPresent?.();
            },
            onWillDismiss: event => {
                dispatchLifecycle(LIFECYCLE.willDismiss);
                propsRef.current.onWillDismiss?.(event);
            },
            onDidDismiss: event => {
                dispatchLifecycle(LIFECYCLE.didDismiss);
                runtime.current.breakpoint = undefined;
                propsRef.current.onDidDismiss?.(event);
            },
        });
        const { hostRef, mounted, present, dismiss: lifecycleDismiss } = lifecycle;

        const dismiss = useCallback(
            (data?: unknown, dismissRole?: OverlayRole) => lifecycleDismiss(dismissRole, data),
            [lifecycleDismiss]
        );
        const dismissFromIsOpen = useCallback(() => dismiss(), [dismiss]);

        const setCurrentBreakpoint = useCallback(
            async (breakpoint: number) => {
                if (!isSheet || !sortedBreakpoints?.includes(breakpoint)) return;
                await sheet.current?.moveSheetToBreakpoint(breakpoint);
            },
            [isSheet, sortedBreakpoints]
        );

        const moveToNextBreakpoint = useCallback(async () => {
            const current = currentBreakpoint();
            if (!sortedBreakpoints || current == null) return;
            const allowed = sortedBreakpoints.filter(b => b !== 0);
            const next = allowed[(allowed.indexOf(current) + 1) % allowed.length];
            await setCurrentBreakpoint(next);
        }, [sortedBreakpoints, setCurrentBreakpoint]); // eslint-disable-line react-hooks/exhaustive-deps -- currentBreakpoint reads refs

        useImperativeHandle(
            ref,
            () => ({
                present,
                dismiss,
                setCurrentBreakpoint,
                getCurrentBreakpoint: currentBreakpoint,
            }),
            [present, dismiss, setCurrentBreakpoint] // eslint-disable-line react-hooks/exhaustive-deps -- currentBreakpoint reads refs
        );

        useIsOpen(isOpen, present, dismissFromIsOpen);

        // React rewrites `className` when it changes; keep the classes the modal toggled itself.
        useLayoutEffect(() => {
            const host = hostRef.current;
            if (!host) return;
            runtime.current.hostClasses.forEach((on, name) => host.classList.toggle(name, on));
        });

        // ion-content marks itself `role="main"` unless it is inside ion-menu / ion-popover /
        // ion-modal (`closest()` at connect); inside this modal it was never the main landmark.
        // (AppContent checks for `.app-modal-wrapper` itself; this covers learn-card-base's.)
        useLayoutEffect(() => {
            const wrapper = wrapperRef.current;
            if (!mounted || !wrapper) return undefined;
            return unmarkMainContent(wrapper);
        }, [mounted]);

        const onBackdropClick = useCallback(
            (ev: React.MouseEvent) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (sheet.current?.isTransitioning()) return;
                if (backdropDismiss) void dismiss(undefined, 'backdrop');
            },
            [backdropDismiss, dismiss]
        );

        const onHandleClick = useCallback(() => {
            if (!isCycle || sheet.current?.isTransitioning()) return;
            void moveToNextBreakpoint();
        }, [isCycle, moveToNextBreakpoint]);

        // ion-modal's host focus goes to a cycling handle.
        // Focus on the host itself moves to a focusable handle (ion-modal's onModalFocus), except
        // when a press on the content focused it: ion-modal's handle was in its shadow root, so that
        // redirect never pulled focus out of the content and a mouse drag still selected text.
        const pressing = useRef(false);
        const onHostPress = useCallback(() => {
            pressing.current = true;
            setTimeout(() => {
                pressing.current = false;
            }, 0);
        }, []);
        const onHostFocus = useCallback((ev: React.FocusEvent<HTMLDivElement>) => {
            const handleEl = handleRef.current;
            if (pressing.current) return;
            if (ev.target === ev.currentTarget && handleEl && handleEl.tabIndex !== -1) {
                handleEl.focus();
            }
        }, []);

        if (!mounted) return null;

        const hostClasses = [
            'app-modal',
            mode,
            isSheet ? 'modal-sheet' : 'modal-default',
            !shown && OVERLAY_HIDDEN_CLASS,
            shown && 'show-modal',
            focusTrap === false && FOCUS_TRAP_DISABLE_CLASS,
            classList(cssClass),
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return createPortal(
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- ion-modal's host focus handler (moves focus to the handle)
            <div
                ref={hostRef}
                id={id}
                className={hostClasses}
                data-app-overlay="modal"
                // Ionic components inside take their mode from the closest `[mode]` ancestor, which
                // was ion-modal when it had a mode.
                {...(modeProp ? { mode: modeProp } : {})}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- ion-modal's host is focusable with a cycling handle
                tabIndex={isCycle && showHandle ? 0 : -1}
                style={{ zIndex }}
                onFocus={onHostFocus}
                onMouseDownCapture={onHostPress}
            >
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Escape is the keyboard dismiss (overlayStack); the backdrop is aria-hidden like ion-backdrop */}
                <div
                    ref={backdropRef}
                    className={[
                        'app-backdrop',
                        mode,
                        !showBackdrop && 'app-backdrop-hide',
                        !backdropDismiss && 'app-backdrop-no-tappable',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    aria-hidden="true"
                    onClickCapture={onBackdropClick}
                />
                {mode === 'ios' && <div ref={shadowRef} className="app-modal-shadow" />}
                <div
                    ref={wrapperRef}
                    className="app-modal-wrapper app-overlay-wrapper"
                    role={role ?? 'dialog'}
                    aria-label={ariaLabel}
                    aria-modal="true"
                >
                    {showHandle && (
                        <button
                            ref={handleRef}
                            type="button"
                            className="app-modal-handle"
                            tabIndex={isCycle ? 0 : -1}
                            aria-label={HANDLE_LABEL}
                            onClick={isCycle ? onHandleClick : undefined}
                        />
                    )}
                    {children}
                </div>
            </div>,
            getOverlayRoot()
        );
    }
);

AppOverlayModal.displayName = 'AppOverlayModal';

export default AppOverlayModal;

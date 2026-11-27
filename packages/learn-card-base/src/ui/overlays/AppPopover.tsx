import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { playAnimation, type OverlayAnimation } from './overlayAnimation';
import { getOverlayRoot, nextOverlayIndex, type OverlayDismissEvent } from './overlayStack';
import {
    calculateWindowAdjustment,
    getPopoverPosition,
    shouldShowArrow,
    type PopoverAlign,
    type PopoverReference,
    type PopoverSide,
} from './popoverPosition';
import { OVERLAY_HIDDEN_CLASS, useIsOpen, useOverlayLifecycle } from './useOverlayLifecycle';

import './overlays.css';

export type AppPopoverProps = {
    /** Controlled open state. Omit it for a `trigger` popover, which opens on the trigger's click. */
    isOpen?: boolean;
    /** Id of the element whose clicks open the popover. */
    trigger?: string;
    /** Position against the triggering element (`trigger`) or the pointer position of `event`. */
    reference?: PopoverReference;
    /** The click (or other mouse event) that opened the popover. */
    event?: Event | null;
    side?: PopoverSide;
    /** Default: `center` in ios mode, `start` in md. */
    alignment?: PopoverAlign;
    /** `cover` matches the trigger's width. */
    size?: 'auto' | 'cover';
    /** Dismiss when anything inside the popover is clicked. */
    dismissOnSelect?: boolean;
    backdropDismiss?: boolean;
    showBackdrop?: boolean;
    /** ios mode: draw the arrow pointing at the reference. */
    arrow?: boolean;
    keyboardClose?: boolean;
    animated?: boolean;
    mode?: IonMode;
    className?: string;
    /** Host style, e.g. `--width`, `--min-width`, `--max-width`, `--offset-x`, `--offset-y`. */
    style?: React.CSSProperties;
    onWillPresent?: () => void;
    onDidPresent?: () => void;
    onWillDismiss?: (event: OverlayDismissEvent) => void;
    onDidDismiss?: (event: OverlayDismissEvent) => void;
    /** Host handlers, as on ion-popover (React events still bubble to the popover's React parents). */
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
    onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
    children?: React.ReactNode;
};

const POPOVER_IOS_BODY_PADDING = 5;
const POPOVER_MD_BODY_PADDING = 12;

/** Ionic's `isPlatform('desktop')`: no coarse pointer. */
const isDesktop = (): boolean =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function'
        ? true
        : !window.matchMedia('(any-pointer:coarse)').matches;

type PresentOptions = {
    mode: IonMode;
    event?: Event | null;
    trigger?: Element | null;
    reference: PopoverReference;
    side: PopoverSide;
    align: PopoverAlign;
    size: 'auto' | 'cover';
};

const parts = (host: HTMLElement) => ({
    backdrop: host.querySelector<HTMLElement>(':scope > .app-backdrop'),
    wrapper: host.querySelector<HTMLElement>(':scope > .app-popover-wrapper'),
    arrow: host.querySelector<HTMLElement>(':scope > .app-popover-wrapper > .app-popover-arrow'),
    content: host.querySelector<HTMLElement>(
        ':scope > .app-popover-wrapper > .app-popover-content'
    ),
});

const backdropEnter = (backdrop: HTMLElement | null) => ({
    el: backdrop,
    keyframes: [{ opacity: 0.01 }, { opacity: 'var(--backdrop-opacity)' }],
    beforeStyles: { 'pointer-events': 'none' },
    afterClearStyles: ['pointer-events'],
});

/** ios.enter.ts / md.enter.ts: measure, place, then fade (ios) or fade + scale (md) in. */
const enterAnimation = (host: HTMLElement, opts: PresentOptions): OverlayAnimation => {
    const { mode, event: ev, trigger, reference, side, align, size } = opts;
    const doc = host.ownerDocument;
    const isRTL = doc.dir === 'rtl';
    const bodyWidth = doc.defaultView?.innerWidth ?? 0;
    const bodyHeight = doc.defaultView?.innerHeight ?? 0;
    const { backdrop, wrapper, arrow, content } = parts(host);
    if (!content) return playAnimation([], { duration: 0, easing: 'linear' });
    const contentBox = content.getBoundingClientRect();
    const contentHeight = contentBox.height;
    let contentWidth = contentBox.width;
    const referenceSizeEl = trigger ?? (ev?.target as Element | null | undefined);
    if (size === 'cover' && referenceSizeEl)
        contentWidth = referenceSizeEl.getBoundingClientRect().width;
    const arrowBox = mode === 'ios' && arrow ? arrow.getBoundingClientRect() : undefined;
    const arrowWidth = arrowBox?.width ?? 0;
    const arrowHeight = arrowBox?.height ?? 0;
    const defaultPosition = {
        top: bodyHeight / 2 - contentHeight / 2,
        left: bodyWidth / 2 - contentWidth / 2,
        originX: (isRTL ? 'right' : 'left') as 'left' | 'right',
        originY: 'top' as const,
    };
    const results = getPopoverPosition(
        isRTL,
        contentWidth,
        contentHeight,
        arrowWidth,
        arrowHeight,
        reference,
        side,
        align,
        defaultPosition,
        trigger,
        ev
    );
    const ios = mode === 'ios';
    const padding = size === 'cover' ? 0 : ios ? POPOVER_IOS_BODY_PADDING : POPOVER_MD_BODY_PADDING;
    const margin = size === 'cover' || !ios ? 0 : 25;
    const adjusted = ios
        ? calculateWindowAdjustment(
              side,
              results.top,
              results.left,
              padding,
              bodyWidth,
              bodyHeight,
              contentWidth,
              contentHeight,
              margin,
              results.originX,
              results.originY,
              results.referenceCoordinates,
              results.arrowTop,
              results.arrowLeft,
              arrowHeight
          )
        : calculateWindowAdjustment(
              side,
              results.top,
              results.left,
              padding,
              bodyWidth,
              bodyHeight,
              contentWidth,
              contentHeight,
              0,
              results.originX,
              results.originY,
              results.referenceCoordinates
          );
    const { originX, originY, top, left, bottom } = adjusted;
    if (size === 'cover') host.style.setProperty('--width', `${contentWidth}px`);

    if (ios) {
        if (adjusted.addPopoverBottomClass) host.classList.add('app-popover-bottom');
        if (bottom !== undefined) content.style.setProperty('bottom', `${bottom}px`);
        let leftValue = `${left}px`;
        if (adjusted.checkSafeAreaLeft) leftValue = `${left}px + var(--app-safe-area-left)`;
        if (adjusted.checkSafeAreaRight) leftValue = `${left}px - var(--app-safe-area-right)`;
        content.style.setProperty('top', `calc(${top}px + var(--offset-y, 0))`);
        content.style.setProperty('left', `calc(${leftValue} + var(--offset-x, 0))`);
        content.style.setProperty('transform-origin', `${originY} ${originX}`);
        if (arrow) {
            const didAdjustBounds = results.top !== top || results.left !== left;
            if (shouldShowArrow(side, didAdjustBounds, ev, trigger)) {
                arrow.style.setProperty('top', `calc(${adjusted.arrowTop}px + var(--offset-y, 0))`);
                arrow.style.setProperty(
                    'left',
                    `calc(${adjusted.arrowLeft}px + var(--offset-x, 0))`
                );
            } else {
                arrow.style.setProperty('display', 'none');
            }
        }
        return playAnimation(
            [
                backdropEnter(backdrop),
                { el: arrow, keyframes: [{ opacity: 0.01 }, { opacity: 1 }] },
                { el: content, keyframes: [{ opacity: 0.01 }, { opacity: 1 }] },
            ],
            { duration: 100, easing: 'ease' }
        );
    }

    if (originY === 'bottom') host.classList.add('app-popover-bottom');
    if (bottom !== undefined) content.style.setProperty('bottom', `${bottom}px`);
    return playAnimation(
        [
            backdropEnter(backdrop),
            { el: wrapper, duration: 150, keyframes: [{ opacity: 0.01 }, { opacity: 1 }] },
            {
                el: content,
                beforeStyles: {
                    top: `calc(${top}px + var(--offset-y, 0px))`,
                    left: `calc(${left}px + var(--offset-x, 0px))`,
                    'transform-origin': `${originY} ${originX}`,
                },
                keyframes: [{ transform: 'scale(0.8)' }, { transform: 'scale(1)' }],
            },
        ],
        { duration: 300, easing: 'cubic-bezier(0.36,0.66,0.04,1)' }
    );
};

/** ios.leave.ts / md.leave.ts. */
const leaveAnimation = (host: HTMLElement, mode: IonMode): OverlayAnimation => {
    const { backdrop, wrapper, arrow, content } = parts(host);
    const backdropLeave = {
        el: backdrop,
        keyframes: [{ opacity: 'var(--backdrop-opacity)' }, { opacity: 0 }],
    };
    const animation =
        mode === 'ios'
            ? playAnimation(
                  [
                      backdropLeave,
                      { el: arrow, keyframes: [{ opacity: 0.99 }, { opacity: 0 }] },
                      { el: content, keyframes: [{ opacity: 0.99 }, { opacity: 0 }] },
                  ],
                  { duration: 300, easing: 'ease' }
              )
            : playAnimation(
                  [backdropLeave, { el: wrapper, keyframes: [{ opacity: 0.99 }, { opacity: 0 }] }],
                  {
                      duration: 150,
                      easing: 'ease',
                  }
              );
    const finished = animation.finished.then(() => {
        host.style.removeProperty('--width');
        host.classList.remove('app-popover-bottom');
        for (const prop of ['top', 'left', 'bottom', 'transform-origin'])
            content?.style.removeProperty(prop);
        if (arrow) for (const prop of ['top', 'left', 'display']) arrow.style.removeProperty(prop);
    });
    return { finished, cancel: animation.cancel };
};

/**
 * App-owned `ion-popover` (@ionic/core 8.7.2) for the inline uses in this app: a controlled
 * `isOpen` popover positioned against an `event`, or an uncontrolled one opened by its `trigger`
 * element. Renders into `ion-app` while presented; the content mounts only while open.
 */
export const AppPopover: React.FC<AppPopoverProps> = ({
    isOpen,
    trigger,
    reference = 'trigger',
    event,
    side = 'bottom',
    alignment,
    size = 'auto',
    dismissOnSelect = false,
    backdropDismiss = true,
    showBackdrop = true,
    arrow = true,
    keyboardClose = true,
    animated = true,
    mode: modeProp,
    className,
    style,
    onWillPresent,
    onDidPresent,
    onWillDismiss,
    onDidDismiss,
    onClick,
    onPointerDown,
    onTouchStart,
    children,
}) => {
    const mode = modeProp ?? getIonMode();
    const align = alignment ?? (mode === 'ios' ? 'center' : 'start');
    const [overlayIndex] = useState(nextOverlayIndex);
    const [desktop] = useState(isDesktop);
    const presentOptions = useRef<Partial<PresentOptions> | null>(null);
    const triggerEl = useRef<HTMLElement | null>(null);

    const { hostRef, mounted, present, dismiss } = useOverlayLifecycle({
        kind: 'popover',
        backdropDismiss,
        trap: 'shadow',
        keyboardClose,
        animated,
        enter: host =>
            enterAnimation(host, {
                mode,
                reference,
                side,
                align,
                size,
                trigger: triggerEl.current,
                event,
                ...presentOptions.current,
            }),
        leave: host => leaveAnimation(host, mode),
        onWillPresent,
        onDidPresent,
        onWillDismiss,
        onDidDismiss,
    });

    useIsOpen(isOpen, present, dismiss);

    // `trigger`: the element's clicks present the popover against it.
    useEffect(() => {
        if (trigger === undefined) return undefined;
        const el = document.getElementById(trigger);
        if (!el) {
            console.warn(
                `[AppPopover] - A trigger element with the ID "${trigger}" was not found in the DOM.`
            );
            return undefined;
        }
        triggerEl.current = el;
        const onTriggerClick = (ev: MouseEvent) => {
            presentOptions.current = { event: ev };
            void present().then(() => {
                presentOptions.current = null;
            });
        };
        el.addEventListener('click', onTriggerClick);
        el.setAttribute('data-app-popover-trigger', 'true');
        return () => {
            el.removeEventListener('click', onTriggerClick);
            el.removeAttribute('data-app-popover-trigger');
            if (triggerEl.current === el) triggerEl.current = null;
        };
    }, [trigger, present]);

    const onBackdropClick = useCallback(
        (ev: React.MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (backdropDismiss) void dismiss('backdrop');
        },
        [backdropDismiss, dismiss]
    );

    if (!mounted) return null;

    const hostClasses = [
        'app-popover',
        mode,
        desktop && 'app-popover-desktop',
        `app-popover-side-${side}`,
        OVERLAY_HIDDEN_CLASS,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return createPortal(
        <div
            ref={hostRef}
            className={hostClasses}
            data-app-overlay="popover"
            aria-modal="true"
            tabIndex={-1}
            style={{ ...style, zIndex: 20000 + overlayIndex }}
            onClick={onClick}
            onPointerDown={onPointerDown}
            onTouchStart={onTouchStart}
        >
            {/* ion-backdrop: a click (capture) is swallowed and, when tappable, dismisses. */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Escape is the keyboard dismiss (overlayStack); the backdrop is aria-hidden like ion-backdrop */}
            <div
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
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- dismissOnSelect reacts to clicks on the content's own controls */}
            <div
                className="app-popover-wrapper app-overlay-wrapper"
                onClick={dismissOnSelect ? () => void dismiss() : undefined}
            >
                {arrow && <div className="app-popover-arrow" />}
                <div className="app-popover-content">
                    <div className="app-popover-viewport">{children}</div>
                </div>
            </div>
        </div>,
        getOverlayRoot()
    );
};

export default AppPopover;

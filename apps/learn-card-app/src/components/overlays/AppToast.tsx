import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { playAnimation, type OverlayAnimation } from './overlayAnimation';
import { getOverlayRoot, nextOverlayIndex, type OverlayDismissEvent } from './overlayStack';
import { OVERLAY_HIDDEN_CLASS, useIsOpen, useOverlayLifecycle } from './useOverlayLifecycle';

import './overlays.css';

export type AppToastPosition = 'top' | 'bottom' | 'middle';

/** Palette colors the toast supports (`--app-color-*`). */
export type AppToastColor = 'success' | 'danger';

export type AppToastProps = {
    isOpen?: boolean;
    message?: string;
    header?: string;
    /** Dismiss (role `timeout`) after this many milliseconds (0: never). */
    duration?: number;
    position?: AppToastPosition;
    color?: AppToastColor;
    translucent?: boolean;
    animated?: boolean;
    mode?: IonMode;
    /** Classes for the toast host (Ionic's `cssClass`). */
    cssClass?: string;
    className?: string;
    onWillPresent?: () => void;
    onDidPresent?: () => void;
    onWillDismiss?: (event: OverlayDismissEvent) => void;
    onDidDismiss?: (event: OverlayDismissEvent) => void;
};

type AnimationPosition = { top: string; bottom: string };

/** toast/animations/utils.ts `getAnimationPosition`, without `positionAnchor`. */
const getAnimationPosition = (position: AppToastPosition, mode: IonMode): AnimationPosition => {
    const offset = mode === 'md' ? (position === 'top' ? 8 : -8) : position === 'top' ? 10 : -10;
    return {
        top: `calc(${offset}px + var(--app-safe-area-top))`,
        bottom: `calc(${offset}px - var(--app-safe-area-bottom))`,
    };
};

const wrapperOf = (host: HTMLElement) =>
    host.querySelector<HTMLElement>(':scope > .app-toast-wrapper');

const middleOffset = (host: HTMLElement, wrapper: HTMLElement): number =>
    Math.floor(host.clientHeight / 2 - wrapper.clientHeight / 2);

const enterAnimation = (
    host: HTMLElement,
    mode: IonMode,
    position: AppToastPosition,
    { top, bottom }: AnimationPosition
): OverlayAnimation => {
    const wrapper = wrapperOf(host);
    if (!wrapper) return playAnimation([], { duration: 0, easing: 'linear' });
    if (position === 'middle') wrapper.style.top = `${middleOffset(host, wrapper)}px`;
    if (mode === 'ios') {
        const keyframes =
            position === 'top'
                ? [{ transform: 'translateY(-100%)' }, { transform: `translateY(${top})` }]
                : position === 'middle'
                  ? [{ opacity: 0.01 }, { opacity: 1 }]
                  : [{ transform: 'translateY(100%)' }, { transform: `translateY(${bottom})` }];
        return playAnimation([{ el: wrapper, keyframes }], {
            duration: 400,
            easing: 'cubic-bezier(.155,1.105,.295,1.12)',
        });
    }
    if (position === 'top') wrapper.style.setProperty('transform', `translateY(${top})`);
    else if (position === 'bottom') wrapper.style.setProperty('transform', `translateY(${bottom})`);
    return playAnimation([{ el: wrapper, keyframes: [{ opacity: 0.01 }, { opacity: 1 }] }], {
        duration: 400,
        easing: 'cubic-bezier(.36,.66,.04,1)',
    });
};

const leaveAnimation = (
    host: HTMLElement,
    mode: IonMode,
    position: AppToastPosition,
    { top, bottom }: AnimationPosition
): OverlayAnimation => {
    const wrapper = wrapperOf(host);
    const keyframes =
        mode === 'md' || position === 'middle'
            ? [{ opacity: 0.99 }, { opacity: 0 }]
            : position === 'top'
              ? [{ transform: `translateY(${top})` }, { transform: 'translateY(-100%)' }]
              : [{ transform: `translateY(${bottom})` }, { transform: 'translateY(100%)' }];
    return playAnimation([{ el: wrapper, keyframes }], {
        duration: 300,
        easing: 'cubic-bezier(.36,.66,.04,1)',
    });
};

/**
 * App-owned `ion-toast` (@ionic/core 8.7.2) for the app's uses: a message (and optional header)
 * in a colored, auto-dismissing toast at the top, middle or bottom of the screen. Toasts do not
 * block the page: no backdrop, no focus trap, and the page stays exposed to screen readers.
 */
export const AppToast: React.FC<AppToastProps> = ({
    isOpen,
    message,
    header,
    duration = 0,
    position = 'bottom',
    color,
    translucent = false,
    animated = true,
    mode: modeProp,
    cssClass,
    className,
    onWillPresent,
    onDidPresent,
    onWillDismiss,
    onDidDismiss,
}) => {
    const mode = modeProp ?? getIonMode();
    const [overlayIndex] = useState(nextOverlayIndex);
    const [revealContent, setRevealContent] = useState(false);
    const durationTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastPosition = useRef<AnimationPosition>({ top: '', bottom: '' });

    const lifecycle = useOverlayLifecycle({
        kind: 'toast',
        backdropDismiss: false,
        trap: 'none',
        keyboardClose: false,
        animated,
        enter: host => {
            lastPosition.current = getAnimationPosition(position, mode);
            return enterAnimation(host, mode, position, lastPosition.current);
        },
        leave: host => leaveAnimation(host, mode, position, lastPosition.current),
        onPresented: () => {
            setRevealContent(true);
            if (duration > 0) {
                durationTimeout.current = setTimeout(
                    () => void lifecycle.dismiss('timeout'),
                    duration
                );
            }
        },
        onDismissStart: () => clearTimeout(durationTimeout.current),
        onWillPresent,
        onDidPresent,
        onWillDismiss,
        onDidDismiss: event => {
            setRevealContent(false);
            onDidDismiss?.(event);
        },
    });
    const { hostRef, mounted, present, dismiss } = lifecycle;

    useIsOpen(isOpen, present, dismiss);

    if (!mounted) return null;

    const hostClasses = [
        'app-toast',
        mode,
        color && `app-color app-color-${color}`,
        translucent && 'app-toast-translucent',
        OVERLAY_HIDDEN_CLASS,
        cssClass,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    // Before the enter animation finishes the text is aria-hidden, then re-rendered as new nodes
    // so screen readers announce it from the live region (Ionic's revealContentToScreenReader).
    const hidden = revealContent ? undefined : 'true';
    const key = revealContent ? 'shown' : 'hidden';

    return createPortal(
        <div
            ref={hostRef}
            className={hostClasses}
            data-app-overlay="toast"
            tabIndex={-1}
            style={{ zIndex: 60000 + overlayIndex }}
        >
            <div className={`app-toast-wrapper app-toast-${position} app-toast-layout-baseline`}>
                <div className="app-toast-container">
                    <div
                        className="app-toast-content"
                        role="status"
                        aria-atomic="true"
                        aria-live="polite"
                    >
                        {header !== undefined && (
                            <div
                                key={`header-${key}`}
                                className="app-toast-header"
                                aria-hidden={hidden}
                            >
                                {header}
                            </div>
                        )}
                        {message !== undefined && (
                            <div
                                key={`message-${key}`}
                                className="app-toast-message"
                                aria-hidden={hidden}
                            >
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        getOverlayRoot()
    );
};

export default AppToast;

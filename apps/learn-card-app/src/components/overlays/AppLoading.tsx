import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { AppSpinner, type AppSpinnerName } from '../feedback/AppSpinner';
import { playAnimation } from './overlayAnimation';
import { getOverlayRoot, nextOverlayIndex, type OverlayDismissEvent } from './overlayStack';
import { OVERLAY_HIDDEN_CLASS, useIsOpen, useOverlayLifecycle } from './useOverlayLifecycle';

import './overlays.css';

type SpinnerName = AppSpinnerName;

export type AppLoadingProps = {
    isOpen?: boolean;
    message?: string;
    /** Spinner name, or `null` for none. Default: `lines` in ios mode, `crescent` in md. */
    spinner?: SpinnerName | null;
    /** Dismiss automatically after this many milliseconds (0: never). */
    duration?: number;
    backdropDismiss?: boolean;
    showBackdrop?: boolean;
    keyboardClose?: boolean;
    translucent?: boolean;
    animated?: boolean;
    mode?: IonMode;
    /** Classes for the overlay host (Ionic's `cssClass`), e.g. `[--background:none]`. */
    cssClass?: string;
    className?: string;
    onWillPresent?: () => void;
    onDidPresent?: () => void;
    onWillDismiss?: (event: OverlayDismissEvent) => void;
    onDidDismiss?: (event: OverlayDismissEvent) => void;
};

const parts = (host: HTMLElement) => ({
    backdrop: host.querySelector<HTMLElement>(':scope > .app-backdrop'),
    wrapper: host.querySelector<HTMLElement>(':scope > .app-loading-wrapper'),
});

/**
 * App-owned `ion-loading` (@ionic/core 8.7.2): a modal spinner (`AppSpinner`) + message over a
 * backdrop. Renders into `ion-app` while presented.
 */
export const AppLoading: React.FC<AppLoadingProps> = ({
    isOpen,
    message,
    spinner,
    duration = 0,
    backdropDismiss = false,
    showBackdrop = true,
    keyboardClose = true,
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
    const spinnerName = spinner === undefined ? (mode === 'ios' ? 'lines' : 'crescent') : spinner;
    const [overlayIndex] = useState(nextOverlayIndex);
    const durationTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const lifecycle = useOverlayLifecycle({
        kind: 'loading',
        backdropDismiss,
        trap: 'scoped',
        keyboardClose,
        animated,
        enter: host => {
            const { backdrop, wrapper } = parts(host);
            return playAnimation(
                [
                    {
                        el: backdrop,
                        keyframes: [{ opacity: 0.01 }, { opacity: 'var(--backdrop-opacity)' }],
                        beforeStyles: { 'pointer-events': 'none' },
                        afterClearStyles: ['pointer-events'],
                    },
                    {
                        el: wrapper,
                        keyframes: [
                            { offset: 0, opacity: 0.01, transform: 'scale(1.1)' },
                            { offset: 1, opacity: 1, transform: 'scale(1)' },
                        ],
                    },
                ],
                { duration: 200, easing: 'ease-in-out' }
            );
        },
        leave: host => {
            const { backdrop, wrapper } = parts(host);
            return playAnimation(
                [
                    {
                        el: backdrop,
                        keyframes: [{ opacity: 'var(--backdrop-opacity)' }, { opacity: 0 }],
                    },
                    {
                        el: wrapper,
                        keyframes: [
                            { offset: 0, opacity: 0.99, transform: 'scale(1)' },
                            { offset: 1, opacity: 0, transform: 'scale(0.9)' },
                        ],
                    },
                ],
                { duration: 200, easing: 'ease-in-out' }
            );
        },
        onPresented: () => {
            if (duration > 0) {
                durationTimeout.current = setTimeout(() => void lifecycle.dismiss(), duration + 10);
            }
        },
        onDismissStart: () => clearTimeout(durationTimeout.current),
        onWillPresent,
        onDidPresent,
        onWillDismiss,
        onDidDismiss,
    });
    const { hostRef, mounted, present, dismiss } = lifecycle;

    useIsOpen(isOpen, present, dismiss);

    const onBackdropClick = useCallback(
        (ev: React.MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (backdropDismiss) void dismiss('backdrop');
        },
        [backdropDismiss, dismiss]
    );

    if (!mounted) return null;

    const msgId = `app-loading-${overlayIndex}-msg`;
    const hostClasses = [
        'app-loading',
        mode,
        translucent && 'app-loading-translucent',
        OVERLAY_HIDDEN_CLASS,
        cssClass,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return createPortal(
        <div
            ref={hostRef}
            className={hostClasses}
            data-app-overlay="loading"
            role="dialog"
            aria-modal="true"
            aria-labelledby={message !== undefined ? msgId : undefined}
            tabIndex={-1}
            style={{ zIndex: 40000 + overlayIndex }}
        >
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
            {/* Focus-trap sentinels (overlayStack moves focus back into the wrapper). */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Ionic's tab sentinels */}
            <div tabIndex={0} aria-hidden="true" />
            <div className="app-loading-wrapper app-overlay-wrapper">
                {spinnerName && (
                    <div className="app-loading-spinner">
                        <AppSpinner name={spinnerName} aria-hidden="true" />
                    </div>
                )}
                {message !== undefined && (
                    <div className="app-loading-content" id={msgId}>
                        {message}
                    </div>
                )}
            </div>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Ionic's tab sentinels */}
            <div tabIndex={0} aria-hidden="true" />
        </div>,
        getOverlayRoot()
    );
};

export default AppLoading;

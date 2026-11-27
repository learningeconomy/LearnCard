import React, { useRef } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useTapActivation } from '../controls/tapActivation';
import '../controls/controls.css';
import './widgets.css';

export type AppFabProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Corner or edge to pin to, 10px in (plus the safe area horizontally). */
    vertical?: 'top' | 'center' | 'bottom';
    horizontal?: 'start' | 'center' | 'end';
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonFab`: an absolutely positioned container (z-index 999) for an
 * `AppFabButton`. Pass `slot="fixed"` as a direct child of `AppContent` to keep it out of the
 * scrolling area, as with Ionic.
 */
export const AppFab: React.FC<AppFabProps> = ({ vertical, horizontal, className, ...rest }) => {
    const classes = [
        'app-fab',
        horizontal && `app-fab-horizontal-${horizontal}`,
        vertical && `app-fab-vertical-${vertical}`,
        className,
    ];
    return <div className={classes.filter(Boolean).join(' ')} {...rest} />;
};

export type AppFabButtonColor = 'light' | 'indigo-500';

export type AppFabButtonProps = {
    /** Palette color (`--app-color-*`). Omitted: Ionic's primary look. */
    color?: AppFabButtonColor;
    size?: 'small';
    disabled?: boolean;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    'aria-label'?: string;
    'data-testid'?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonFabButton`: a 56px round native `<button type="button">` with
 * Ionic's md (shadow, ink ripple) and ios (soft shadow, 1.1x press scale) looks.
 */
export const AppFabButton: React.FC<AppFabButtonProps> = ({
    color,
    size,
    disabled = false,
    mode: modeProp,
    className,
    onClick,
    'aria-label': ariaLabel,
    'data-testid': testId,
    children,
}) => {
    const mode = modeProp ?? getIonMode();
    const hostRef = useRef<HTMLDivElement>(null);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const onPointerDown = useTapActivation(hostRef, rippleRef);

    const classes = [
        'app-fab-button',
        `app-fab-button-${mode}`,
        color && `app-color app-color-${color}`,
        size && `app-fab-button-${size}`,
        disabled && 'app-fab-button-disabled',
        className,
    ];

    return (
        // The click handler is on the host, as on ion-fab-button; the native button inside is the
        // focusable, keyboard-operable control.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            ref={hostRef}
            className={classes.filter(Boolean).join(' ')}
            aria-disabled={disabled ? 'true' : undefined}
            onClick={onClick}
            data-testid={testId}
        >
            <button
                type="button"
                className="app-fab-button-native"
                disabled={disabled}
                aria-label={ariaLabel}
                onPointerDown={onPointerDown}
            >
                <span className="app-fab-button-inner">{children}</span>
                {mode === 'md' && (
                    <span ref={rippleRef} className="app-ripple-effect" role="presentation" />
                )}
            </button>
        </div>
    );
};

export default AppFab;

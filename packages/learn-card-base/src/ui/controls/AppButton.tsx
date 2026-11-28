import React, { useRef } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useInAppButtons } from './AppButtons';
import { useTapActivation } from './tapActivation';
import './controls.css';

export type AppButtonColor = 'primary' | 'light' | 'medium';

/**
 * `inherit`: the `--app-color-*` palette entry an ancestor sets (AppDatetime's `color`), as an
 * ion-button given the datetime's `color` inside ion-datetime.
 */
export type AppButtonColorProp = AppButtonColor | 'inherit';

export type AppButtonProps = {
    /** Palette color (`--app-color-*`). Omitted: the primary look without color overrides. */
    color?: AppButtonColorProp;
    /** Host id (ion-button's `id`). */
    id?: string;
    /** Moved onto the native button, as ion-button's inherited aria attributes. */
    'aria-label'?: string;
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

/**
 * App-owned replacement for `IonButton`: a native `<button type="button">` inside a host span
 * that carries the call site's classes, with Ionic's md / ios looks (md: uppercase, 36px,
 * 4px radius, shadow, ink ripple; ios: sentence case, 3.1em, 14px radius, no ripple).
 */
export const AppButton: React.FC<AppButtonProps> = ({
    color,
    id,
    'aria-label': ariaLabel,
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

    // ion-button's `button-has-icon-only`: an icon with `slot="icon-only"` among the children.
    const hasIconOnly = React.Children.toArray(children).some(
        child => React.isValidElement<{ slot?: string }>(child) && child.props.slot === 'icon-only'
    );

    const classes = [
        'app-button',
        mode,
        `app-button-${fill ?? (inButtons ? 'clear' : 'solid')}`,
        expand && `app-button-${expand}`,
        color && 'app-color',
        color && color !== 'inherit' && `app-color-${color}`,
        disabled && 'app-button-disabled',
        hasIconOnly && 'app-button-has-icon-only',
        className,
    ];

    return (
        <span
            ref={hostRef}
            id={id}
            className={classes.filter(Boolean).join(' ')}
            aria-disabled={disabled ? 'true' : undefined}
            data-testid={testId}
        >
            <button
                type="button"
                className="app-button-native"
                disabled={disabled}
                aria-label={ariaLabel}
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

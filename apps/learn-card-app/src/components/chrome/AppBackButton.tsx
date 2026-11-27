import React, { useLayoutEffect, useRef, useState } from 'react';
import { arrowBackSharp, chevronBack } from 'ionicons/icons';

import { useAppGoBack } from '../app-shell/AppShellRouter';
import type { IonMode } from '../app-shell/ionMode';
import { useTapActivation } from '../controls/tapActivation';
import { AppIcon } from '../icon';
import '../controls/controls.css';
import { useChromeMode } from './useChromeMode';
import './chrome.css';

export type AppBackButtonProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'color' | 'children'
> & {
    /**
     * Where to go when there is no in-app page to return to. The button is hidden without it,
     * unless the page's header is in a `can-go-back` page.
     */
    defaultHref?: string;
    /** Label next to the icon. Defaults to "Back" in iOS mode and none in md. `null` hides it. */
    text?: string | null;
    /** An `ionicons/icons` export. Defaults to the platform's back arrow. */
    icon?: string;
    /** A theme color name for the button, as ion-back-button's `color`. */
    color?: string;
    /** Platform look. Defaults to the document's Ionic mode. */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

type BackButtonHostProps = Omit<AppBackButtonProps, 'defaultHref' | 'onClick'> & {
    showBackButton: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
};

const BackButtonHost: React.FC<BackButtonHostProps> = ({
    showBackButton,
    text,
    icon,
    color,
    mode: modeProp,
    disabled = false,
    type = 'button',
    className,
    style,
    ref,
    'aria-label': ariaLabel,
    onClick,
    ...rest
}) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const mode = useChromeMode(hostRef, modeProp);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const onPointerDown = useTapActivation(hostRef, rippleRef);
    const [inToolbar, setInToolbar] = useState({ toolbar: false, colored: false });
    React.useImperativeHandle(ref, () => hostRef.current as HTMLDivElement);

    // Ionic's `hostContext('ion-toolbar')` / `hostContext('ion-toolbar[color]')`.
    useLayoutEffect(() => {
        const toolbar = hostRef.current?.closest('.app-toolbar, ion-toolbar') ?? null;
        const colored = !!toolbar?.matches('.app-toolbar.ion-color, ion-toolbar[color]');
        setInToolbar(prev =>
            prev.toolbar === !!toolbar && prev.colored === colored
                ? prev
                : { toolbar: !!toolbar, colored }
        );
    }, []);

    const backIcon = icon ?? (mode === 'ios' ? chevronBack : arrowBackSharp);
    const backText = text !== undefined ? text : mode === 'ios' ? 'Back' : null;
    const iconOnly = !!backIcon && !backText;

    const classes = [
        'app-back-button',
        mode,
        `app-back-button-${mode}`,
        color && `ion-color ion-color-${color}`,
        disabled && 'app-back-button-disabled',
        iconOnly && 'app-back-button-has-icon-only',
        inToolbar.toolbar && 'app-in-toolbar',
        inToolbar.colored && 'app-in-toolbar-color',
        showBackButton && 'app-show-back-button',
        className,
    ];

    return (
        <div ref={hostRef} className={classes.filter(Boolean).join(' ')} style={style}>
            <button
                {...rest}
                type={type}
                disabled={disabled}
                className="app-back-button-native"
                aria-label={ariaLabel || backText || 'back'}
                onPointerDown={onPointerDown}
                onClick={onClick}
            >
                <span className="app-back-button-inner">
                    {backIcon && <AppIcon icon={backIcon} aria-hidden="true" />}
                    {backText && (
                        <span className="app-back-button-text" aria-hidden="true">
                            {backText}
                        </span>
                    )}
                </span>
                {mode === 'md' && (
                    <span ref={rippleRef} className="app-ripple-effect" role="presentation" />
                )}
            </button>
        </div>
    );
};

const RouterBackButton: React.FC<AppBackButtonProps & { defaultHref: string }> = ({
    defaultHref,
    ...props
}) => {
    const goBack = useAppGoBack(defaultHref);
    return (
        <BackButtonHost
            {...props}
            showBackButton
            onClick={event => {
                event.stopPropagation();
                goBack();
            }}
        />
    );
};

/**
 * App-owned replacement for `IonBackButton`. A click returns to the in-app page that opened this
 * one, otherwise it replaces the page with `defaultHref` (IonReactRouter's back behavior; Ionic's
 * own fallback without that router was a full-page load). An `onClick` prop replaces that, as it
 * did on IonBackButton.
 */
export const AppBackButton: React.FC<AppBackButtonProps> = ({ defaultHref, onClick, ...props }) => {
    if (onClick) {
        return (
            <BackButtonHost
                {...props}
                showBackButton={defaultHref !== undefined}
                onClick={onClick}
            />
        );
    }
    if (defaultHref !== undefined) return <RouterBackButton {...props} defaultHref={defaultHref} />;
    // Ionic's handler without a defaultHref and outside ion-nav did nothing.
    return (
        <BackButtonHost
            {...props}
            showBackButton={false}
            onClick={event => event.preventDefault()}
        />
    );
};

export default AppBackButton;

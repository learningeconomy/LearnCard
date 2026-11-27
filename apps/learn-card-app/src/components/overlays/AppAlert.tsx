import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import AppRippleEffect from '../widgets/AppRippleEffect';
import { playAnimation } from './overlayAnimation';
import {
    getOverlayRoot,
    nextOverlayIndex,
    nextStackZIndex,
    type OverlayDismissEvent,
} from './overlayStack';
import { OVERLAY_HIDDEN_CLASS, useIsOpen, useOverlayLifecycle } from './useOverlayLifecycle';

import './overlays.css';
import './alert.css';

/** Ionic's alert z-index tier (20000 + overlay index, shared with modals). */
const ALERT_TIER = 20000;

/** What a button handler receives / returns, as with ion-alert. */
export type AppAlertValues = Record<string, string> | undefined;
type HandlerResult = boolean | void | Record<string, unknown>;

export type AppAlertButton = {
    text: string;
    /** `cancel` (also run on backdrop / Escape dismiss), `destructive`, or any role to report. */
    role?: string;
    cssClass?: string | string[];
    id?: string;
    htmlAttributes?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    /** Return `false` to keep the alert open; an object is merged into the dismiss data. */
    handler?: (values: AppAlertValues) => HandlerResult | Promise<HandlerResult>;
};

/** Text-style inputs (ion-alert's radio / checkbox groups are not used by the app). */
export type AppAlertInput = {
    type?: 'text' | 'number' | 'password' | 'email' | 'tel' | 'url' | 'search' | 'date';
    name?: string;
    placeholder?: string;
    value?: string | number;
    id?: string;
    min?: string | number;
    max?: string | number;
    disabled?: boolean;
    cssClass?: string | string[];
    /** Set as DOM attributes on the `<input>` (e.g. `{ maxlength: 4 }`), as Ionic did. */
    attributes?: Record<string, unknown>;
};

export type AppAlertProps = {
    isOpen?: boolean;
    header?: string;
    subHeader?: string;
    message?: string;
    buttons?: (AppAlertButton | string)[];
    inputs?: AppAlertInput[];
    backdropDismiss?: boolean;
    keyboardClose?: boolean;
    translucent?: boolean;
    animated?: boolean;
    mode?: IonMode;
    /** Classes for the alert host (Ionic's `cssClass`), e.g. `boost-confirmation-alert`. */
    cssClass?: string | string[];
    onWillPresent?: () => void;
    onDidPresent?: () => void;
    onWillDismiss?: (event: OverlayDismissEvent) => void;
    onDidDismiss?: (event: OverlayDismissEvent) => void;
};

const classList = (value: string | string[] | undefined): string =>
    Array.isArray(value) ? value.join(' ') : (value ?? '');

const isCancel = (role: string | undefined): boolean => role === 'cancel' || role === 'backdrop';

const toButton = (button: AppAlertButton | string): AppAlertButton =>
    typeof button === 'string'
        ? { text: button, role: button.toLowerCase() === 'cancel' ? 'cancel' : undefined }
        : button;

/** Writes `attributes` like Stencil did: DOM attributes, `on*` functions as listeners. */
const applyInputAttributes = (
    input: HTMLInputElement,
    attributes: Record<string, unknown> | undefined
): (() => void) => {
    const cleanups: Array<() => void> = [];
    for (const [key, value] of Object.entries(attributes ?? {})) {
        if (key === 'disabled' || key === 'class') continue;
        if (typeof value === 'function' && key.startsWith('on')) {
            const name = key.slice(2).toLowerCase();
            input.addEventListener(name, value as EventListener);
            cleanups.push(() => input.removeEventListener(name, value as EventListener));
        } else if (value !== undefined && value !== null && value !== false) {
            input.setAttribute(key, value === true ? '' : String(value));
        }
    }
    return () => cleanups.forEach(cleanup => cleanup());
};

const AlertInput: React.FC<{
    input: AppAlertInput;
    id: string;
    onValue: (value: string) => void;
}> = ({ input, id, onValue }) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const el = ref.current;
        return el ? applyInputAttributes(el, input.attributes) : undefined;
    }, [input.attributes]);
    const disabled = (input.attributes?.disabled as boolean | undefined) ?? input.disabled;
    return (
        <div className="alert-input-wrapper">
            <input
                ref={ref}
                className={[
                    'alert-input',
                    disabled && 'alert-input-disabled',
                    classList(input.cssClass),
                    input.attributes?.class ? String(input.attributes.class) : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                placeholder={input.placeholder ?? ''}
                type={input.type ?? 'text'}
                min={input.min}
                max={input.max}
                defaultValue={input.value}
                id={id}
                tabIndex={0}
                disabled={disabled}
                onInput={e => onValue((e.target as HTMLInputElement).value)}
            />
        </div>
    );
};

const parts = (host: HTMLElement) => ({
    backdrop: host.querySelector<HTMLElement>(':scope > .app-backdrop'),
    wrapper: host.querySelector<HTMLElement>(':scope > .alert-wrapper'),
});

/**
 * App-owned `ion-alert` (@ionic/core 8.7.2): a dialog with a header, message, text inputs and
 * buttons. Renders into `ion-app` while presented; `useAppAlert` is the `useIonAlert`
 * replacement. Buttons with role `cancel` (or a backdrop / Escape dismiss) run the cancel
 * button's handler; any other button's handler runs first and can keep the alert open by
 * returning `false`.
 */
export const AppAlert: React.FC<AppAlertProps> = props => {
    const {
        isOpen,
        header,
        subHeader,
        message,
        buttons: rawButtons = [],
        inputs = [],
        backdropDismiss = true,
        keyboardClose = true,
        translucent = false,
        animated = true,
        mode: modeProp,
        cssClass,
    } = props;
    const propsRef = useRef(props);
    propsRef.current = props;
    const mode = modeProp ?? getIonMode();
    const buttons = rawButtons.map(toButton);
    const [overlayIndex] = useState(nextOverlayIndex);
    const [zIndex, setZIndex] = useState(ALERT_TIER);
    const values = useRef<Record<string, string>>({});
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const inputName = (input: AppAlertInput, index: number): string => input.name || `${index}`;
    const getValues = (): AppAlertValues => {
        const current = propsRef.current.inputs ?? [];
        if (current.length === 0) return undefined;
        return Object.fromEntries(
            current.map((input, index) => {
                const name = inputName(input, index);
                const value = values.current[name] ?? input.value;
                return [name, value ? String(value) : ''];
            })
        );
    };

    const callButtonHandler = async (
        button: AppAlertButton | undefined,
        data?: AppAlertValues
    ): Promise<false | Record<string, unknown>> => {
        if (button?.handler) {
            let result: HandlerResult;
            try {
                result = await button.handler(data);
            } catch (error) {
                console.error(error);
                result = undefined;
            }
            if (result === false) return false;
            if (typeof result === 'object' && result !== null) return result;
        }
        return {};
    };

    const lifecycle = useOverlayLifecycle({
        kind: 'alert',
        backdropDismiss,
        trap: 'scoped',
        keyboardClose,
        animated,
        enter: host => {
            flushSync(() => setZIndex(nextStackZIndex(ALERT_TIER, host)));
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
                            {
                                offset: 0,
                                opacity: '0.01',
                                transform: mode === 'ios' ? 'scale(1.1)' : 'scale(0.9)',
                            },
                            { offset: 1, opacity: '1', transform: 'scale(1)' },
                        ],
                    },
                ],
                { duration: mode === 'ios' ? 200 : 150, easing: 'ease-in-out' }
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
                        keyframes:
                            mode === 'ios'
                                ? [
                                      { offset: 0, opacity: 0.99, transform: 'scale(1)' },
                                      { offset: 1, opacity: 0, transform: 'scale(0.9)' },
                                  ]
                                : [{ opacity: 0.99 }, { opacity: 0 }],
                    },
                ],
                { duration: mode === 'ios' ? 200 : 150, easing: 'ease-in-out' }
            );
        },
        onPresented: () => {
            const current = propsRef.current;
            const wrapper = wrapperRef.current;
            if ((current.buttons ?? []).length === 1 && (current.inputs ?? []).length === 0) {
                wrapper?.querySelector<HTMLElement>('.alert-button')?.focus();
            } else {
                wrapper?.focus();
            }
        },
        onWillPresent: () => propsRef.current.onWillPresent?.(),
        onDidPresent: () => propsRef.current.onDidPresent?.(),
        onWillDismiss: event => {
            // ion-alert's own listener ran first: a cancel dismiss runs the cancel button handler.
            if (isCancel(event.detail.role)) {
                const cancel = (propsRef.current.buttons ?? [])
                    .map(toButton)
                    .find(b => b.role === 'cancel');
                void callButtonHandler(cancel);
            }
            propsRef.current.onWillDismiss?.(event);
        },
        onDidDismiss: event => propsRef.current.onDidDismiss?.(event),
    });
    const { hostRef, mounted, present, dismiss } = lifecycle;

    const dismissFromIsOpen = useCallback(() => dismiss(), [dismiss]);
    useIsOpen(isOpen, present, dismissFromIsOpen);

    const buttonClick = async (button: AppAlertButton): Promise<void> => {
        const role = button.role;
        const data = getValues();
        if (isCancel(role)) {
            await dismiss(role, { values: data });
            return;
        }
        const result = await callButtonHandler(button, data);
        if (result !== false) await dismiss(role, { values: data, ...result });
    };

    const onBackdropClick = useCallback(
        (ev: React.MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (backdropDismiss) void dismiss('backdrop');
        },
        [backdropDismiss, dismiss]
    );

    // Shift+Tab from the wrapper goes to the last button (ion-alert's keydown listener).
    const onKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>): void => {
        const target = ev.target as HTMLElement;
        if (ev.key === 'Tab' && ev.shiftKey && target.classList.contains('alert-wrapper')) {
            ev.preventDefault();
            wrapperRef.current?.querySelector<HTMLElement>('.alert-button:last-child')?.focus();
        }
    };

    // ios: the pressed button shows `ion-activated` (ion-alert's button active gesture).
    const pressHandlers =
        mode === 'ios'
            ? {
                  onPointerDown: (ev: React.PointerEvent<HTMLButtonElement>) =>
                      ev.currentTarget.classList.add('ion-activated'),
                  onPointerUp: (ev: React.PointerEvent<HTMLButtonElement>) =>
                      ev.currentTarget.classList.remove('ion-activated'),
                  onPointerLeave: (ev: React.PointerEvent<HTMLButtonElement>) =>
                      ev.currentTarget.classList.remove('ion-activated'),
                  onPointerCancel: (ev: React.PointerEvent<HTMLButtonElement>) =>
                      ev.currentTarget.classList.remove('ion-activated'),
              }
            : {};

    if (!mounted) return null;

    const hdrId = `alert-${overlayIndex}-hdr`;
    const subHdrId = `alert-${overlayIndex}-sub-hdr`;
    const msgId = `alert-${overlayIndex}-msg`;
    const labelledBy =
        header && subHeader
            ? `${hdrId} ${subHdrId}`
            : header
              ? hdrId
              : subHeader
                ? subHdrId
                : undefined;
    const hostClasses = [
        'app-alert',
        classList(cssClass),
        mode,
        OVERLAY_HIDDEN_CLASS,
        translucent && 'alert-translucent',
    ]
        .filter(Boolean)
        .join(' ');

    return createPortal(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- ion-alert's keydown listener (Shift+Tab from the dialog)
        <div
            ref={hostRef}
            className={hostClasses}
            data-app-overlay="alert"
            tabIndex={-1}
            style={{ zIndex }}
            onKeyDown={onKeyDown}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Escape is the keyboard dismiss (overlayStack); the backdrop is aria-hidden like ion-backdrop */}
            <div
                className={['app-backdrop', mode, !backdropDismiss && 'app-backdrop-no-tappable']
                    .filter(Boolean)
                    .join(' ')}
                aria-hidden="true"
                onClickCapture={onBackdropClick}
            />
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Ionic's tab sentinels */}
            <div tabIndex={0} aria-hidden="true" />
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- ion-alert focuses its dialog */}
            <div
                ref={wrapperRef}
                className="alert-wrapper app-overlay-wrapper"
                role={inputs.length > 0 || buttons.length > 0 ? 'alertdialog' : 'alert'}
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-describedby={message !== undefined ? msgId : undefined}
                tabIndex={0}
            >
                <div className="alert-head">
                    {header && (
                        <h2 id={hdrId} className="alert-title">
                            {header}
                        </h2>
                    )}
                    {subHeader && !header && (
                        <h2 id={subHdrId} className="alert-sub-title">
                            {subHeader}
                        </h2>
                    )}
                    {subHeader && header && (
                        <h3 id={subHdrId} className="alert-sub-title">
                            {subHeader}
                        </h3>
                    )}
                </div>
                <div id={msgId} className="alert-message">
                    {message}
                </div>
                {inputs.length > 0 && (
                    <div className="alert-input-group">
                        {inputs.map((input, index) => (
                            <AlertInput
                                key={input.id ?? index}
                                input={input}
                                id={input.id || `alert-input-${overlayIndex}-${index}`}
                                onValue={value => {
                                    values.current[inputName(input, index)] = value;
                                }}
                            />
                        ))}
                    </div>
                )}
                <div
                    className={[
                        'alert-button-group',
                        buttons.length > 2 && 'alert-button-group-vertical',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                >
                    {buttons.map((button, index) => (
                        <button
                            key={button.id ?? index}
                            {...button.htmlAttributes}
                            {...pressHandlers}
                            type="button"
                            id={button.id}
                            className={[
                                'alert-button ion-focusable ion-activatable',
                                button.role !== undefined && `alert-button-role-${button.role}`,
                                classList(button.cssClass),
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            tabIndex={0}
                            onClick={() => void buttonClick(button)}
                        >
                            <span className="alert-button-inner">{button.text}</span>
                            {mode === 'md' && <AppRippleEffect />}
                        </button>
                    ))}
                </div>
            </div>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Ionic's tab sentinels */}
            <div tabIndex={0} aria-hidden="true" />
        </div>,
        getOverlayRoot()
    );
};

export default AppAlert;

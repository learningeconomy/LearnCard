import React, { useRef } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useTapActivation } from '../controls/tapActivation';
import { useInAppList } from './AppList';
import '../controls/controls.css';
import './list.css';

export type AppItemLines = 'full' | 'inset' | 'none';

/** `style` also takes the item's custom properties (`--background`, `--padding-start`, …). */
export type AppItemStyle =
    React.CSSProperties | (React.CSSProperties & { [property: `--${string}`]: string | number });

export type AppItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
    /** Renders the row as a native `<button>` with hover, focus, pressed and (md) ripple states. */
    button?: boolean;
    /** Trailing chevron. Defaults to Ionic's rule: shown on ios button items, hidden otherwise. */
    detail?: boolean;
    disabled?: boolean;
    /** Bottom border. Omitted: the list's `lines`, else an inset border. */
    lines?: AppItemLines;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    /** Native button type when `button` is set. */
    type?: 'button' | 'submit' | 'reset';
    style?: AppItemStyle;
    ref?: React.Ref<HTMLDivElement>;
};

/** Ionicons `chevron-forward`, as `ion-icon` draws it for Ionic's item detail icon. */
const DetailIcon: React.FC = () => (
    <span className="app-item-detail-icon" aria-hidden="true">
        <svg viewBox="0 0 512 512" focusable="false">
            <path
                d="m184 112 144 144-144 144"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="48px"
            />
        </svg>
    </span>
);

/**
 * App-owned replacement for `IonItem`: a host `div` (call-site classes, custom properties and
 * `onClick`) around a native `<button>` (when `button`) or `div` row, with Ionic 8's md / ios
 * padding, min-height, lines, disabled look and hover / focus / pressed / ripple states.
 * Inside an `AppList` the host is a `listitem`.
 */
export const AppItem: React.FC<AppItemProps> = ({
    button = false,
    detail,
    disabled = false,
    lines,
    mode: modeProp,
    type = 'button',
    className,
    ref,
    children,
    ...rest
}) => {
    const mode = modeProp ?? getIonMode();
    const inList = useInAppList();
    const hostRef = useRef<HTMLDivElement | null>(null);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const onPointerDown = useTapActivation(hostRef, rippleRef);

    const setHostRef = (node: HTMLDivElement | null): void => {
        hostRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
    };

    const classes = [
        'app-item',
        `app-item-${mode}`,
        `app-item-lines-${lines ?? 'default'}`,
        disabled && 'app-item-disabled',
        inList && 'app-item-in-list',
        button && 'app-item-activatable',
        className,
    ];
    const content = (
        <div className="app-item-inner">
            <div className="app-item-input-wrapper">{children}</div>
            {(detail ?? (mode === 'ios' && button)) && <DetailIcon />}
        </div>
    );

    return (
        <div
            ref={setHostRef}
            className={classes.filter(Boolean).join(' ')}
            role={inList ? 'listitem' : undefined}
            aria-disabled={disabled ? 'true' : undefined}
            {...rest}
        >
            {button ? (
                <button
                    type={type}
                    className="app-item-native"
                    disabled={disabled}
                    onPointerDown={onPointerDown}
                >
                    {content}
                    {mode === 'md' && (
                        <span ref={rippleRef} className="app-ripple-effect" role="presentation" />
                    )}
                </button>
            ) : (
                <div className="app-item-native">{content}</div>
            )}
        </div>
    );
};

export default AppItem;

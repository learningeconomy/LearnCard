import React, { useEffect, useId, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useParentSyncedState } from './useParentSyncedState';
import './controls.css';

export type AppToggleProps = {
    /** Initial state, re-applied whenever the parent re-renders (Ionic React's model). Omit for an uncontrolled toggle. */
    checked?: boolean;
    /** `pointer-events: none`, no tab stop, and `onClick` never fires, as on `ion-toggle`. */
    disabled?: boolean;
    /**
     * Palette color of the checked track (`--app-color-*`): emerald-700, emerald-500, indigo-700,
     * indigo-500, blue-500, or a theme `primaryColor`. A name without app tokens (vetpass
     * `baltic-blue-500`) paints the checked track transparent, as `ion-toggle` did with no
     * `.ion-color-*` class. Omitted: primary / `--track-background-checked`.
     */
    color?: string;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
    'aria-label'?: string;
    title?: string;
    'data-testid'?: string;
    /** Hidden form input's name and value (`ion-toggle`'s `name` / `value`). */
    name?: string;
    value?: string;
    /** Pointer clicks only (not Space), after the toggle, as on `ion-toggle`. Never fires when disabled. */
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
    /** User toggles (click, Space, drag), like `ionChange`: never fired for `checked` prop updates. */
    onCheckedChange?: (checked: boolean) => void;
};

/** `createGesture` settings from ion-toggle: threshold 5px, `maxAngle` 40°, ±10px to flip. */
const DRAG_THRESHOLD_PX = 5;
const DRAG_MAX_COSINE = Math.cos((40 * Math.PI) / 180);
const DRAG_TOGGLE_PX = 10;
/** A click this soon after a drag ends does not toggle (`lastDrag + 300 < Date.now()`). */
const DRAG_CLICK_SUPPRESS_MS = 300;

const isRtl = (): boolean =>
    typeof document !== 'undefined' && document.dir.toLowerCase() === 'rtl';

/** ion-toggle's `shouldToggle`: delta is measured from where the drag was captured. */
const shouldToggle = (rtl: boolean, checked: boolean, deltaX: number): boolean => {
    if (checked) return rtl ? deltaX > DRAG_TOGGLE_PX : deltaX < -DRAG_TOGGLE_PX;
    return rtl ? deltaX < -DRAG_TOGGLE_PX : deltaX > DRAG_TOGGLE_PX;
};

/**
 * Ionic's `hapticSelection()`: a light Capacitor impact. Only on native builds, so web and tests
 * never load the plugin.
 */
const hapticSelection = (): void => {
    import('@capacitor/haptics')
        .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
        .catch(() => undefined);
};

type Gesture = { end: () => void };

/**
 * App-owned replacement for `IonToggle`, with its behavior:
 * - an element with `role="switch"` (not a native input), `aria-checked`, `aria-disabled`, and a
 *   tab stop unless disabled; a sibling `<label>` never toggles it;
 * - internal checked state that toggles on click, Space and drag, and is re-synced from `checked`
 *   on every parent re-render (see `useParentSyncedState`);
 * - click runs the toggle (with `preventDefault`), then `onClick`; Space toggles without
 *   `onClick`; Enter does nothing; when disabled nothing reacts (`pointer-events: none`);
 * - ion-toggle's swipe: after 5px of mostly horizontal movement on the track the handle widens
 *   (ios `activated`), and each further ±10px past the capture point flips it. A click within
 *   300ms of a drag does not toggle (mouse: `onClick` still fires; touch: Ionic cancelled the
 *   click, so it is swallowed);
 * - Capacitor light haptic on tap (native iOS) and on drag flips (native);
 * - ion-toggle's hidden `aux-input` for form submission;
 * - no focus style of its own (the browser's default focus ring, as before).
 */
export const AppToggle: React.FC<AppToggleProps> = props => {
    const {
        disabled = false,
        color,
        mode: modeProp,
        className,
        'aria-label': ariaLabel,
        title,
        'data-testid': testId,
        name,
        value = 'on',
        onClick,
        onCheckedChange,
    } = props;
    const mode = modeProp ?? getIonMode();
    const rtl = isRtl();
    const [checked, setChecked] = useParentSyncedState(props, 'checked', false);
    const [activated, setActivated] = useState(false);
    const fallbackName = `app-tg-${useId()}`;

    const trackRef = useRef<HTMLSpanElement>(null);
    // Drag moves read and flip the current state between renders.
    const checkedRef = useRef(checked);
    checkedRef.current = checked;
    const lastDragRef = useRef(0);
    const swallowClickRef = useRef(false);
    const gestureRef = useRef<Gesture | undefined>(undefined);
    const callbacksRef = useRef({ onCheckedChange });
    callbacksRef.current = { onCheckedChange };

    const toggle = (): void => {
        const next = !checkedRef.current;
        checkedRef.current = next;
        setChecked(next);
        callbacksRef.current.onCheckedChange?.(next);
    };

    // ion-toggle disables its gesture when `disabled` turns on, and destroys it on unmount.
    useEffect(() => {
        if (disabled) gestureRef.current?.end();
    }, [disabled]);
    useEffect(() => () => gestureRef.current?.end(), []);

    const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>): void => {
        swallowClickRef.current = false;
        if (disabled || gestureRef.current) return;
        if (!trackRef.current?.contains(event.target as Node)) return;

        const { pointerId, pointerType } = event;
        const startX = event.clientX;
        const startY = event.clientY;
        let captureX = startX;
        let captured = false;

        const finish = (): void => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onEnd);
            document.removeEventListener('pointercancel', onEnd);
            gestureRef.current = undefined;
            if (!captured) return;
            setActivated(false);
            lastDragRef.current = Date.now();
            // Ionic preventDefault-ed touchend, so a touch drag produced no click.
            if (pointerType !== 'mouse') swallowClickRef.current = true;
        };

        function onMove(moveEvent: PointerEvent): void {
            if (moveEvent.pointerId !== pointerId) return;
            if (!captured) {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < DRAG_THRESHOLD_PX) return;
                if (Math.abs(dx / distance) <= DRAG_MAX_COSINE) {
                    // Mostly vertical: not a toggle drag (the page scrolls; a mouse still clicks).
                    finish();
                    return;
                }
                captured = true;
                captureX = moveEvent.clientX;
                setActivated(true);
                return;
            }
            if (shouldToggle(isRtl(), checkedRef.current, moveEvent.clientX - captureX)) {
                toggle();
                if (Capacitor.isNativePlatform()) hapticSelection();
            }
        }

        function onEnd(endEvent: PointerEvent): void {
            if (endEvent.pointerId === pointerId) finish();
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
        document.addEventListener('pointercancel', onEnd);
        gestureRef.current = { end: finish };
    };

    const handleClick = (event: React.MouseEvent<HTMLSpanElement>): void => {
        if (disabled) return;
        event.preventDefault();
        if (swallowClickRef.current) {
            swallowClickRef.current = false;
            return;
        }
        if (lastDragRef.current + DRAG_CLICK_SUPPRESS_MS < Date.now()) {
            toggle();
            // ion-toggle's tap haptic is iOS-only.
            if (Capacitor.getPlatform() === 'ios') hapticSelection();
        }
        onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
        if (event.key !== ' ') return;
        event.preventDefault();
        if (!disabled) toggle();
    };

    const classes = [
        'app-toggle',
        mode,
        checked && 'app-toggle-checked',
        disabled && 'app-toggle-disabled',
        activated && 'app-toggle-activated',
        rtl ? 'app-toggle-rtl' : 'app-toggle-ltr',
        color && `app-color app-color-${color}`,
        className,
    ];

    return (
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- tabIndex 0 unless disabled, as on ion-toggle; the rule can't read the conditional.
        <span
            role="switch"
            aria-checked={checked ? 'true' : 'false'}
            aria-label={ariaLabel}
            aria-disabled={disabled ? 'true' : undefined}
            tabIndex={disabled ? undefined : 0}
            title={title}
            data-testid={testId}
            className={classes.filter(Boolean).join(' ')}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
        >
            <span className="app-toggle-wrapper">
                <span className="app-toggle-native-wrapper">
                    <span ref={trackRef} className="app-toggle-icon">
                        <span className="app-toggle-icon-wrapper">
                            <span className="app-toggle-inner" />
                        </span>
                    </span>
                </span>
            </span>
            {/* ion-toggle's renderHiddenInput: submits `value` when checked, "" otherwise. */}
            <input
                type="hidden"
                className="aux-input"
                name={name ?? fallbackName}
                value={checked ? value : ''}
                disabled={disabled}
            />
        </span>
    );
};

export default AppToggle;

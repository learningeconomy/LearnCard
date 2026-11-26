import React, { useId } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useParentSyncedState } from './useParentSyncedState';
import './controls.css';

export type AppCheckboxProps = {
    id?: string;
    /** Palette color (`--app-color-*`) of the checked fill. Omitted: primary. */
    color?: 'emerald-700';
    /** Initial state, re-applied whenever the parent re-renders (Ionic React's model). Omit for an uncontrolled checkbox. */
    checked?: boolean;
    disabled?: boolean;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
    'aria-label'?: string;
    /** Pointer clicks only (not Space), after the toggle, as on `ion-checkbox`. */
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
    /** User toggles (click or Space), like `ionChange`: never fired for `checked` prop updates. */
    onCheckedChange?: (checked: boolean) => void;
};

const CHECKMARK_PATH: Record<IonMode, string> = {
    ios: 'M5.9,12.5l3.8,3.8l8.8-8.8',
    md: 'M1.73,12.91 8.1,19.28 22.79,4.59',
};

/**
 * App-owned replacement for `IonCheckbox`, with its behavior:
 * - an element with `role="checkbox"` (not a native input): a `<label htmlFor>` or wrapping
 *   `<label>` never toggles it or names it, exactly as with the non-labelable `ion-checkbox`;
 * - internal checked state that toggles on click and Space and is re-synced from `checked` on
 *   every parent re-render;
 * - click runs the toggle (with `preventDefault`), then `onClick`; Space toggles without `onClick`;
 * - no focus style of its own (the browser's default focus ring, as before).
 */
export const AppCheckbox: React.FC<AppCheckboxProps> = props => {
    const {
        id,
        color,
        disabled = false,
        mode: modeProp,
        className,
        'aria-label': ariaLabel,
        onClick,
        onCheckedChange,
    } = props;
    const mode = modeProp ?? getIonMode();
    const [checked, setChecked] = useParentSyncedState(props, 'checked', false);
    const name = `app-cb-${useId()}`;

    const toggle = (): void => {
        const next = !checked;
        setChecked(next);
        onCheckedChange?.(next);
    };

    const handleClick = (event: React.MouseEvent<HTMLSpanElement>): void => {
        if (!disabled) {
            event.preventDefault();
            toggle();
        }
        onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>): void => {
        if (event.key !== ' ') return;
        event.preventDefault();
        if (!disabled) toggle();
    };

    const classes = [
        'app-checkbox',
        mode,
        checked && 'app-checkbox-checked',
        disabled && 'app-checkbox-disabled',
        color && `app-color app-color-${color}`,
        className,
    ];

    return (
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- tabIndex 0 unless disabled, as on ion-checkbox; the rule can't read the conditional.
        <span
            id={id}
            role="checkbox"
            aria-checked={checked ? 'true' : 'false'}
            aria-label={ariaLabel}
            aria-disabled={disabled ? 'true' : undefined}
            tabIndex={disabled ? undefined : 0}
            className={classes.filter(Boolean).join(' ')}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <span className="app-checkbox-wrapper">
                <span className="app-checkbox-native-wrapper">
                    <svg className="app-checkbox-icon" viewBox="0 0 24 24">
                        <path d={CHECKMARK_PATH[mode]} />
                    </svg>
                </span>
            </span>
            {/* ion-checkbox's renderHiddenInput: submits "on" when checked, "" otherwise. */}
            <input
                type="hidden"
                className="aux-input"
                name={name}
                value={checked ? 'on' : ''}
                disabled={disabled}
            />
        </span>
    );
};

export default AppCheckbox;

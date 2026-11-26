import React, { useId, useImperativeHandle, useRef, useState } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useParentSyncedState } from './useParentSyncedState';
import './controls.css';
import './AppInput.css';

/**
 * `style` that also accepts the custom properties ion-input read (`--padding-start`,
 * `--placeholder-color`, ...). Unknown ones are harmless no-ops, as they were on ion-input.
 */
export type AppInputStyle = React.CSSProperties & {
    [property: `--${string}`]: string | number | undefined;
};

/** What a `ref` on AppInput receives (the subset of `HTMLIonInputElement` the app used). */
export type AppInputHandle = {
    /** Focus the native input, like ion-input's `setFocus()`. */
    setFocus: () => Promise<void>;
    /** The native `<input>`, like ion-input's `getInputElement()`. */
    getInputElement: () => Promise<HTMLInputElement | null>;
    /** The host element (ion-input itself was the ref target; used for its `offsetWidth`). */
    readonly host: HTMLDivElement | null;
};

export type AppInputType =
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'search'
    | 'url'
    | 'tel'
    | 'date'
    | 'datetime-local'
    | 'month'
    | 'time'
    | 'week';

export type AppInputProps = {
    /**
     * Initial value, re-applied whenever the parent re-renders (Ionic React's model). `null` and
     * `undefined` clear the field, as on ion-input. Omit for an uncontrolled input.
     */
    value?: string | number | null;
    /** ion-input default: `"text"`. */
    type?: AppInputType;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    min?: string | number;
    max?: string | number;
    step?: string;
    minlength?: number;
    maxlength?: number;
    pattern?: string;
    /** ion-input default: `"off"`. */
    autocapitalize?: string;
    /** ion-input default: `"off"`. */
    autocomplete?: string;
    /** ion-input default: `"off"`. */
    autocorrect?: 'on' | 'off';
    autofocus?: boolean;
    /** ion-input default: `false`. */
    spellcheck?: boolean;
    enterkeyhint?: React.InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
    inputmode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    /** Native input id. Defaults to a generated `app-input-…` id. */
    id?: string;
    /** Form field name. Defaults to the id, as on ion-input. */
    name?: string;
    /** Text label rendered inside the field's `<label>`, before the input or stacked above it. */
    label?: string;
    /** ion-input default: `"start"`. */
    labelPlacement?: 'start' | 'stacked';
    /** Show a clear button while the field has a value (not when disabled or readonly). */
    clearInput?: boolean;
    /** Clear the value on the first edit after focus. ion-input default: only for `type="password"`. */
    clearOnEdit?: boolean;
    /** Delay, in ms, before `onValueInput` fires; trailing, like ion-input's `debounce`. */
    debounce?: number;
    /** Show ion-input's `"<length> / <maxlength>"` counter below the field. Needs `maxlength`. */
    counter?: boolean;
    helperText?: string;
    /** Shown instead of `helperText` when `className` has both `ion-touched` and `ion-invalid`. */
    errorText?: string;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
    style?: AppInputStyle;
    /** Moved onto the native input, as ion-input's `inheritAriaAttributes` did. */
    'aria-label'?: string;
    /** Moved onto the native input, as ion-input's `inheritAttributes` did. */
    title?: string;
    'data-testid'?: string;
    /** ion-input's `slot="end"` content: rendered after the input inside the field's `<label>`. */
    end?: React.ReactNode;
    ref?: React.Ref<AppInputHandle>;
    /**
     * Every user edit (typing, the clear button, clear-on-edit), like `ionInput`. Delayed by
     * `debounce` when set. Never fired for `value` prop updates.
     */
    onValueInput?: (value: string, event: React.SyntheticEvent) => void;
    /** On blur, when the value differs from the value at focus, like `ionChange`. */
    onValueChange?: (value: string) => void;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    /** On the host, so it sees keys from the input and slot content, as on ion-input. */
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    /** On the host, as on ion-input. */
    onPaste?: React.ClipboardEventHandler<HTMLDivElement>;
};

/** Keys that do not edit the value, so they never trigger clear-on-edit (ion-input's list). */
const CLEAR_ON_EDIT_IGNORED_KEYS = ['Enter', 'Tab', 'Shift', 'Meta', 'Alt', 'Control'];

/** ionicons 8 `close-circle` (ios) and `close-sharp` (md), ion-input's default clear icons. */
const CLEAR_ICON_PATHS: Record<IonMode, string> = {
    ios: 'M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48m75.31 260.69a16 16 0 1 1-22.62 22.62L256 278.63l-52.69 52.68a16 16 0 0 1-22.62-22.62L233.37 256l-52.68-52.69a16 16 0 0 1 22.62-22.62L256 233.37l52.69-52.68a16 16 0 0 1 22.62 22.62L278.63 256Z',
    md: 'M400 145.49 366.51 112 256 222.51 145.49 112 112 145.49 222.51 256 112 366.51 145.49 400 256 289.49 366.51 400 400 366.51 289.49 256z',
};

const toText = (value: string | number | null | undefined): string =>
    value === null || value === undefined ? '' : String(value);

/**
 * App-owned replacement for `IonInput` (@ionic/core 8.7.2), with its behavior:
 * - ion-input's scoped (light DOM) structure: host > `<label for>` > optional label text, then
 *   the native-wrapper row of `<input>`, clear button and end content; then the helper / error /
 *   counter row when any is set;
 * - internal value that follows typing and is re-synced from `value` on every parent re-render
 *   (see `useParentSyncedState`); input events fire per edit (trailing-debounced with
 *   `debounce`, even `0`), the change event on blur;
 * - the clear button (`clearInput`), which keeps focus in the input, and clear-on-edit (default
 *   for passwords);
 * - ion-input's defaults: `autocapitalize`/`autocomplete`/`autocorrect` `"off"`,
 *   `spellcheck={false}`, an id, `name` = id, and an always-present `placeholder` attribute.
 *
 * Not ported, because no call site uses them: `fill`, `shape`, `color`, floating / fixed / end
 * label placements, the `label` / `start` slots, `counterFormatter`, password toggles, and the md
 * focus highlight bar (variables.css already neutralised it with `--highlight-height: none`).
 */
export const AppInput: React.FC<AppInputProps> = props => {
    const {
        type = 'text',
        placeholder,
        disabled = false,
        readonly = false,
        required,
        min,
        max,
        step,
        minlength,
        maxlength,
        pattern,
        autocapitalize = 'off',
        autocomplete = 'off',
        autocorrect = 'off',
        autofocus,
        spellcheck = false,
        enterkeyhint,
        inputmode,
        id,
        name,
        label,
        labelPlacement = 'start',
        clearInput = false,
        clearOnEdit,
        debounce,
        counter = false,
        helperText,
        errorText,
        mode: modeProp,
        className,
        style,
        'aria-label': ariaLabel,
        title,
        'data-testid': testId,
        end,
        ref,
        onValueInput,
        onValueChange,
        onFocus,
        onBlur,
        onKeyDown,
        onPaste,
    } = props;
    const mode = modeProp ?? getIonMode();
    const [rawValue, setRawValue] = useParentSyncedState(props, 'value', '');
    const value = toText(rawValue);
    const [hasFocus, setHasFocus] = useState(false);
    const generatedId = useId();
    const inputId = id ?? `app-input-${generatedId}`;
    const helperTextId = `${inputId}-helper-text`;
    const errorTextId = `${inputId}-error-text`;

    const hostRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(
        ref,
        () => ({
            setFocus: async () => inputRef.current?.focus(),
            getInputElement: async () => inputRef.current,
            get host() {
                return hostRef.current;
            },
        }),
        []
    );

    // ion-input's `focusedValue`: the value when focus arrived, compared on blur (and reset by
    // every change event). Input is a discrete event, so by blur this render's value is current.
    const focusedValueRef = useRef<string | undefined>(undefined);
    // ion-input's `didInputClearOnEdit`: clear-on-edit runs once per focus.
    const didClearOnEditRef = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    /** ion-input's `emitInputChange`, through its `debounceEvent` wrapper when `debounce` is set. */
    const emitValueInput = (next: string, event: React.SyntheticEvent): void => {
        if (!onValueInput) return;
        if (debounce === undefined) {
            onValueInput(next, event);
            return;
        }
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => onValueInput(next, event), debounce);
    };

    const updateValue = (next: string, event: React.SyntheticEvent): void => {
        setRawValue(next);
        emitValueInput(next, event);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        updateValue(event.target.value || '', event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
        setHasFocus(true);
        focusedValueRef.current = value;
        onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
        setHasFocus(false);
        if (focusedValueRef.current !== value) {
            focusedValueRef.current = value;
            onValueChange?.(value);
        }
        didClearOnEditRef.current = false;
        onBlur?.(event);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (!(clearOnEdit ?? type === 'password')) return;
        const ignored = CLEAR_ON_EDIT_IGNORED_KEYS.includes(event.key);
        if (!didClearOnEditRef.current && value.length > 0 && !ignored) {
            updateValue('', event);
        }
        if (!ignored) didClearOnEditRef.current = true;
    };

    const showClear = clearInput && !readonly && !disabled;

    const handleClear = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.preventDefault();
        event.stopPropagation();
        // Keep the keyboard up: focus returns to the input after clearing.
        inputRef.current?.focus();
        updateValue('', event);
    };

    // ion-input's onLabelClick: a click on the label itself also activates the input (a second
    // click event), so only that one propagates.
    const stopDuplicateClick = (event: React.MouseEvent<HTMLElement>): void => {
        if (event.target === event.currentTarget) event.stopPropagation();
    };

    const classTokens = (className ?? '').split(/\s+/);
    const isInvalid =
        classTokens.includes('ion-touched') && classTokens.includes('ion-invalid') && !!errorText;
    const hintTextId = isInvalid ? errorTextId : helperText ? helperTextId : undefined;
    const showCounter = counter && maxlength !== undefined;
    const hasLabel = label !== undefined;

    const classes = [
        'app-input',
        mode,
        `app-input-label-${labelPlacement}`,
        value.length > 0 && 'app-input-has-value',
        hasFocus && 'app-input-has-focus',
        disabled && 'app-input-disabled',
        className,
    ];

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown / paste are observed on the host (they come from the input inside), as React's handlers on ion-input were.
        <div
            ref={hostRef}
            className={classes.filter(Boolean).join(' ')}
            style={style}
            data-testid={testId}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- ion-input's wrapper label: it only stops a duplicate click from bubbling; the input inside owns keyboard interaction. */}
            <label className="app-input-wrapper" htmlFor={inputId} onClick={stopDuplicateClick}>
                {hasLabel && (
                    <div className="app-input-label-wrapper">
                        <div className="app-input-label-text">{label}</div>
                    </div>
                )}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- same duplicate-click guard as the label. */}
                <div className="app-input-native-wrapper" onClick={stopDuplicateClick}>
                    <input
                        ref={inputRef}
                        className="app-input-native"
                        id={inputId}
                        name={name ?? inputId}
                        type={type}
                        value={value}
                        placeholder={placeholder || ''}
                        disabled={disabled}
                        readOnly={readonly}
                        required={required}
                        min={min}
                        max={max}
                        step={step}
                        minLength={minlength}
                        maxLength={maxlength}
                        pattern={pattern}
                        autoCapitalize={autocapitalize}
                        autoComplete={autocomplete}
                        autoCorrect={autocorrect}
                        // eslint-disable-next-line jsx-a11y/no-autofocus -- passed through only when a call site asks for it, as ion-input did.
                        autoFocus={autofocus}
                        spellCheck={spellcheck}
                        enterKeyHint={enterkeyhint}
                        inputMode={inputmode}
                        aria-label={ariaLabel}
                        aria-describedby={hintTextId}
                        aria-invalid={isInvalid}
                        title={title}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onKeyDown={handleInputKeyDown}
                    />
                    {showClear && (
                        <button
                            type="button"
                            className="app-input-clear"
                            aria-label="reset"
                            // Keep focus (and the mobile keyboard) in the input.
                            onPointerDown={event => event.preventDefault()}
                            onClick={handleClear}
                        >
                            <svg
                                className="app-input-clear-icon"
                                viewBox="0 0 512 512"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path d={CLEAR_ICON_PATHS[mode]} />
                            </svg>
                        </button>
                    )}
                    {end !== undefined && <span className="app-input-end">{end}</span>}
                </div>
            </label>
            {(helperText || errorText || showCounter) && (
                <div className="app-input-bottom">
                    <div id={helperTextId} className="app-input-helper">
                        {helperText}
                    </div>
                    <div id={errorTextId} className="app-input-error">
                        {errorText}
                    </div>
                    {showCounter && (
                        <div className="app-input-counter">{`${value.length} / ${maxlength}`}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppInput;

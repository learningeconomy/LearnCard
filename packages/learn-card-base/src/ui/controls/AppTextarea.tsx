import React, { useId, useRef } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useParentSyncedState } from './useParentSyncedState';
import './controls.css';

/**
 * `style` that also accepts the custom properties ion-textarea read (`--padding-top`,
 * `--placeholder-color`, ...). Unknown ones are harmless no-ops, as they were on ion-textarea.
 */
export type AppTextareaStyle = React.CSSProperties & {
    [property: `--${string}`]: string | number | undefined;
};

export type AppTextareaProps = {
    /**
     * Initial value, re-applied whenever the parent re-renders (Ionic React's model). `null` and
     * `undefined` clear the field, as on ion-textarea. Omit for an uncontrolled textarea.
     */
    value?: string | null;
    placeholder?: string;
    rows?: number;
    maxlength?: number;
    disabled?: boolean;
    readonly?: boolean;
    /** Grow and shrink with the content (ion-textarea's `autoGrow`). */
    autoGrow?: boolean;
    /** Show ion-textarea's `"<length> / <maxlength>"` counter below the field. Needs `maxlength`. */
    counter?: boolean;
    /** ion-textarea default: `"none"`. */
    autocapitalize?: string;
    /** ion-textarea default: `false`. */
    spellcheck?: boolean;
    enterkeyhint?: React.TextareaHTMLAttributes<HTMLTextAreaElement>['enterKeyHint'];
    inputmode?: React.HTMLAttributes<HTMLTextAreaElement>['inputMode'];
    /** Native textarea id. Defaults to a generated `app-textarea-…` id. */
    id?: string;
    /** Form field name. Defaults to the id, as on ion-textarea. */
    name?: string;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
    style?: AppTextareaStyle;
    /** Moved onto the native textarea, as ion-textarea's `inheritAriaAttributes` did. */
    'aria-label'?: string;
    /** Moved onto the native textarea, as ion-textarea's `inheritAttributes` did. */
    title?: string;
    'data-testid'?: string;
    /**
     * ion-textarea's `slot="end"` content: rendered after the textarea inside the wrapping
     * `<label>` (so it is part of the label text, and the label is its containing block).
     */
    end?: React.ReactNode;
    /** Every user edit, like `ionInput` (`detail.value`, `detail.event`). Never fired for `value` prop updates. */
    onValueInput?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    /** On blur, when the value differs from the value at focus, like `ionChange`. */
    onValueChange?: (value: string) => void;
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
    /** On the host, so it sees keys from the textarea and slot content, as on ion-textarea. */
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonTextarea` (@ionic/core 8.7.2), with its behavior:
 * - ion-textarea's scoped (light DOM) structure: host > `<label for>` > inner flex row of start
 *   slot, native-wrapper with the `<textarea>`, end slot; then the counter row when enabled;
 * - internal value that follows typing and is re-synced from `value` on every parent re-render
 *   (see `useParentSyncedState`); input events fire per edit, the change event on blur;
 * - `autoGrow` as in 8.7.2: the native-wrapper is a one-cell grid whose hidden `::after` mirrors
 *   the value (`data-replicated-value`), so the cell, and the textarea in it, grows with content;
 * - ion-textarea's defaults: `autocapitalize="none"`, `spellcheck={false}`, an id, `name` = id,
 *   and an always-present `placeholder` attribute.
 *
 * Not ported, because no call site uses them: `label`/`labelPlacement`, `fill`, `shape`,
 * `helperText`/`errorText`, `debounce`, `clearOnEdit`, `counterFormatter`, `color`, the `start`
 * slot content, `setFocus()`/`getInputElement()`, and the md focus highlight bar (variables.css
 * already neutralised it with `--highlight-height: none !important`).
 */
export const AppTextarea: React.FC<AppTextareaProps> = props => {
    const {
        placeholder,
        rows,
        maxlength,
        disabled = false,
        readonly = false,
        autoGrow = false,
        counter = false,
        autocapitalize = 'none',
        spellcheck = false,
        enterkeyhint,
        inputmode,
        id,
        name,
        mode: modeProp,
        className,
        style,
        'aria-label': ariaLabel,
        title,
        'data-testid': testId,
        end,
        onValueInput,
        onValueChange,
        onFocus,
        onBlur,
        onKeyDown,
    } = props;
    const mode = modeProp ?? getIonMode();
    const [value, setValue] = useParentSyncedState(props, 'value', '');
    const generatedId = useId();
    const inputId = id ?? `app-textarea-${generatedId}`;

    // ion-textarea's `focusedValue`: the value when focus arrived, compared on blur. Input is a
    // discrete event, so by the time blur runs this render's `value` is the current one.
    const focusedValueRef = useRef<string | undefined>(undefined);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        const next = event.target.value || '';
        setValue(next);
        onValueInput?.(next, event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>): void => {
        focusedValueRef.current = value;
        onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>): void => {
        if (focusedValueRef.current !== value) {
            focusedValueRef.current = value;
            onValueChange?.(value);
        }
        onBlur?.(event);
    };

    // ion-textarea's onLabelClick: a click on the label itself also activates the textarea
    // (a second click event), so only that one propagates.
    const handleLabelClick = (event: React.MouseEvent<HTMLLabelElement>): void => {
        if (event.target === event.currentTarget) event.stopPropagation();
    };

    const classes = [
        'app-textarea',
        mode,
        disabled && 'app-textarea-disabled',
        autoGrow && 'app-textarea-auto-grow',
        className,
    ];

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keydown is observed on the host (keys come from the textarea inside), as React's onKeyDown on ion-textarea was.
        <div
            className={classes.filter(Boolean).join(' ')}
            style={style}
            data-testid={testId}
            onKeyDown={onKeyDown}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/label-has-associated-control -- ion-textarea's wrapper label: it only stops a duplicate click from bubbling, the textarea inside owns keyboard interaction, and the textarea's name comes from aria-label or an outer label, as with Ionic (no call site uses label text). */}
            <label className="app-textarea-wrapper" htmlFor={inputId} onClick={handleLabelClick}>
                <div className="app-textarea-wrapper-inner">
                    <div className="app-textarea-start-slot-wrapper" />
                    <div
                        className="app-textarea-native-wrapper"
                        data-replicated-value={autoGrow ? value : undefined}
                    >
                        <textarea
                            className="app-textarea-native"
                            id={inputId}
                            name={name ?? inputId}
                            value={value}
                            placeholder={placeholder || ''}
                            rows={rows}
                            maxLength={maxlength}
                            disabled={disabled}
                            readOnly={readonly}
                            autoCapitalize={autocapitalize}
                            spellCheck={spellcheck}
                            enterKeyHint={enterkeyhint}
                            inputMode={inputmode}
                            aria-label={ariaLabel}
                            title={title}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                    </div>
                    <div className="app-textarea-end-slot-wrapper">{end}</div>
                </div>
            </label>
            {counter && maxlength !== undefined && (
                <div className="app-textarea-bottom">
                    <div className="app-textarea-counter">{`${value.length} / ${maxlength}`}</div>
                </div>
            )}
        </div>
    );
};

export default AppTextarea;

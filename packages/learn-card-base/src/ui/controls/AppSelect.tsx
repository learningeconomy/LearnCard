import React, { useId, useRef, useState } from 'react';

import { caretDownSharp, chevronExpand } from '../../icons/ionicons';
import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { AppIcon } from '../icon';
import { AppPopover } from '../overlays';
import './controls.css';

export type AppSelectOption = { value: string; label: React.ReactNode };

export type AppSelectProps = {
    value?: string;
    options: AppSelectOption[];
    /** A user pick of a different option, like `ionChange`. */
    onValueChange?: (value: string) => void;
    /** Replaces the selected option's text, like ion-select's `selectedText`. */
    selectedText?: string;
    placeholder?: string;
    'aria-label'?: string;
    disabled?: boolean;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
};

/**
 * App-owned replacement for `IonSelect interface="popover"` (@ionic/core 8.7.2) with single
 * selection: a full-width button showing the selected text and Ionic's select icon (md
 * `caret-down-sharp`, ios `chevron-expand`), opening an `AppPopover` of radio rows centred on the
 * text, as ion-select-popover did. Options are data (`options`) rather than IonSelectOption
 * children.
 */
export const AppSelect: React.FC<AppSelectProps> = ({
    value,
    options,
    onValueChange,
    selectedText,
    placeholder,
    'aria-label': ariaLabel,
    disabled = false,
    mode: modeProp,
    className,
}) => {
    const mode = modeProp ?? getIonMode();
    const [openEvent, setOpenEvent] = useState<Event | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const listId = useId();

    const selected = options.find(option => option.value === value);
    const text = selectedText ?? selected?.label;
    const showPlaceholder = text === undefined || text === '';

    const pick = (next: string): void => {
        setOpenEvent(null);
        if (next !== value) onValueChange?.(next);
    };

    const handleListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        const radios = Array.from(
            listRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []
        );
        const index = radios.indexOf(event.target as HTMLButtonElement);
        if (index === -1) return;
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (step === undefined) return;
        event.preventDefault();
        radios[(index + step + radios.length) % radios.length]?.focus();
    };

    return (
        <>
            <button
                type="button"
                className={[
                    'app-select',
                    `app-select-${mode}`,
                    openEvent && 'app-select-expanded',
                    disabled && 'app-select-disabled',
                    className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-label={ariaLabel}
                aria-haspopup="dialog"
                aria-expanded={openEvent !== null}
                aria-controls={openEvent ? listId : undefined}
                disabled={disabled}
                onClick={event => setOpenEvent(event.nativeEvent)}
            >
                <span
                    className={`app-select-text${showPlaceholder ? ' app-select-placeholder' : ''}`}
                >
                    {showPlaceholder ? placeholder : text}
                </span>
                <AppIcon
                    icon={mode === 'ios' ? chevronExpand : caretDownSharp}
                    aria-hidden="true"
                    className="app-select-icon"
                />
            </button>
            <AppPopover
                isOpen={openEvent !== null}
                event={openEvent}
                reference="event"
                alignment="center"
                className="app-select-popover"
                onDidDismiss={() => setOpenEvent(null)}
            >
                {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- focus stays on the radios; the group only moves it between them with the arrow keys. */}
                <div
                    id={listId}
                    ref={listRef}
                    role="radiogroup"
                    aria-label={ariaLabel}
                    className={`app-select-options app-select-options-${mode}`}
                    onKeyDown={handleListKeyDown}
                >
                    {options.map(option => {
                        const checked = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={checked}
                                tabIndex={checked || (!selected && option === options[0]) ? 0 : -1}
                                className={`app-select-option${checked ? ' app-select-option-checked' : ''}`}
                                onClick={() => pick(option.value)}
                            >
                                <span className="app-select-option-radio" aria-hidden="true" />
                                <span className="app-select-option-label">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </AppPopover>
        </>
    );
};

export default AppSelect;

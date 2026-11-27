import React, { createContext, useContext, useId, useLayoutEffect, useRef } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { useParentSyncedState } from './useParentSyncedState';
import './controls.css';

const AppRadioGroupContext = createContext<string | undefined>(undefined);

const RADIO_SELECTOR = '.app-radio[role="radio"]';

export type AppRadioGroupProps = {
    /** Selected value, re-applied whenever the parent re-renders (Ionic React's model). */
    value?: string;
    /** User selection (click, arrow keys, Space), like `ionChange`; not fired for `value` prop updates. */
    onValueChange?: (value: string) => void;
    className?: string;
    children?: React.ReactNode;
};

/**
 * App-owned replacement for `IonRadioGroup` (`role="radiogroup"`), with its behavior:
 * - a click selects only when it lands on an `AppRadio` (label text does not select);
 * - ArrowDown/ArrowRight and ArrowUp/ArrowLeft move focus to the next/previous radio, wrapping,
 *   and select it; Space selects the focused radio;
 * - roving tabindex: the checked radio, or else the first one, is the only tab stop;
 * - `onValueChange` fires on every arrow-key move, and on click/Space only when the value changes.
 */
export const AppRadioGroup: React.FC<AppRadioGroupProps> = props => {
    const { onValueChange, className, children } = props;
    const [value, setValue] = useParentSyncedState(props, 'value', '');
    const groupRef = useRef<HTMLDivElement>(null);
    const name = `app-rg-${useId()}`;

    const getRadios = (): HTMLElement[] => {
        const group = groupRef.current;
        if (!group) return [];
        return Array.from(group.querySelectorAll<HTMLElement>(RADIO_SELECTOR)).filter(
            radio => radio.closest('.app-radio-group') === group
        );
    };

    /** Click and Space emit only on a change; arrow keys always emit, as in ion-radio-group. */
    const select = (next: string, emitUnchanged = false): void => {
        if (next === value && !emitUnchanged) return;
        setValue(next);
        onValueChange?.(next);
    };

    // ion-radio-group's setRadioTabindex: one tab stop, on the checked radio or the first one.
    // Written to the DOM (AppRadio never renders tabIndex) after every render of the group.
    useLayoutEffect(() => {
        const radios = getRadios();
        const focusable =
            radios.find(radio => radio.getAttribute('aria-checked') === 'true') ?? radios[0];
        for (const radio of radios) radio.tabIndex = radio === focusable ? 0 : -1;
    });

    const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const radio = (event.target as Element).closest<HTMLElement>(RADIO_SELECTOR);
        if (radio && getRadios().includes(radio)) select(radio.dataset.value ?? '');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        const radios = getRadios();
        const index = radios.indexOf(event.target as HTMLElement);
        if (index === -1) return;

        let next: HTMLElement | undefined;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            next = radios[(index + 1) % radios.length];
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            next = radios[(index - 1 + radios.length) % radios.length];
        }

        if (next) {
            event.stopPropagation();
            event.preventDefault();
            next.focus();
            select(next.dataset.value ?? '', true);
        } else if (event.key === ' ') {
            select(radios[index].dataset.value ?? '');
            event.preventDefault();
        }
    };

    return (
        <AppRadioGroupContext.Provider value={value}>
            {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the radios are the tab stops (roving tabindex), not the group, as on ion-radio-group. */}
            <div
                ref={groupRef}
                role="radiogroup"
                className={['app-radio-group', className].filter(Boolean).join(' ')}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
            >
                {children}
                {/*
                 * ion-radio-group's renderHiddenInput: a hidden form input appended as the group's
                 * last child. Call sites style their rows with `last:` variants (AdminTools*: the
                 * last row keeps its divider), so it also keeps the rows' :last-child state as before.
                 */}
                <input type="hidden" className="aux-input" name={name} value={value} />
            </div>
        </AppRadioGroupContext.Provider>
    );
};

export type AppRadioProps = {
    value: string;
    /**
     * `white`: the checkmark is painted in `currentColor` (the wrapper's text color). The app never
     * defined `.ion-color-white`, so Ionic's `var(--ion-color-base)` fell back to `currentColor`.
     */
    color?: 'white';
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
};

/** App-owned replacement for `IonRadio` (`role="radio"`); must be inside an `AppRadioGroup`. */
export const AppRadio: React.FC<AppRadioProps> = ({ value, color, mode: modeProp, className }) => {
    const mode = modeProp ?? getIonMode();
    const checked = useContext(AppRadioGroupContext) === value;

    const classes = [
        'app-radio',
        mode,
        checked && 'app-radio-checked',
        color === 'white' && 'app-radio-current-color',
        className,
    ];

    return (
        // eslint-disable-next-line jsx-a11y/control-has-associated-label -- same (unnamed) accessible name as the ion-radio it replaces; naming it is a separate a11y change.
        <span
            role="radio"
            aria-checked={checked ? 'true' : 'false'}
            data-value={value}
            className={classes.filter(Boolean).join(' ')}
        >
            <span className="app-radio-wrapper">
                <span className="app-radio-native-wrapper">
                    <span className="app-radio-icon">
                        <span className="app-radio-inner" />
                    </span>
                </span>
            </span>
        </span>
    );
};

export default AppRadio;

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { Capacitor } from '@capacitor/core';

import type { IonMode } from '../app-shell/ionMode';
import type { PickerColumnItem, PickerValue } from './utils/types';
import '../controls/controls.css';
import './datetime.css';

/**
 * App-owned ports of @ionic/core 8.7.2 `ion-picker`, `ion-picker-column` and
 * `ion-picker-column-option` for AppDatetime's wheels (month / year, hour / minute / day period).
 * The parts are light DOM with Ionic's class names; options come from an `items` array instead of
 * `ion-picker-column-option` children, and each option is a `div.app-picker-column-option` with a
 * `tabindex=-1` button inside, as the option's shadow root had.
 */

const OPTION = 'app-picker-column-option';
const COLUMN = 'app-picker-column';
const PICKER_ITEM_ACTIVE_CLASS = 'option-active';

/** What the picker and the datetime need from a column (Ionic called these on the element). */
export type PickerColumnHandle = {
    el: HTMLDivElement;
    numericInput: boolean;
    setValue: (value: PickerValue | undefined) => void;
    scrollActiveItemIntoView: (smooth?: boolean) => void;
    inputModeChange: (useInputMode: boolean, inputModeColumn: Element | undefined) => void;
};

const columnHandles = new WeakMap<Element, PickerColumnHandle>();

/** The column handle for a `.app-picker-column` element (Ionic: the element's own methods). */
export const getPickerColumnHandle = (el: Element): PickerColumnHandle | undefined =>
    columnHandles.get(el);

type PickerContextValue = {
    exitInputMode: () => void;
    subscribe: (handle: PickerColumnHandle) => () => void;
};

const PickerContext = createContext<PickerContextValue | null>(null);

// ---------------------------------------------------------------- haptics (utils/native/haptic)

type HapticKind = 'selectionStart' | 'selectionChanged' | 'selectionEnd';

/** Ionic enabled these on iOS; the Capacitor plugin is only there on native builds. */
const haptic = (kind: HapticKind): void => {
    if (!Capacitor.isNativePlatform()) return;
    import('@capacitor/haptics').then(({ Haptics }) => Haptics[kind]()).catch(() => undefined);
};

/** Ionic's `isPlatform('mobile')`. */
const isMobile = (): boolean =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(any-pointer:coarse)').matches;

const isOptionDisabled = (el: Element): boolean => el.classList.contains('option-disabled');

// ---------------------------------------------------------------- AppPicker

export type AppPickerProps = {
    mode: IonMode;
    className?: string;
    children?: React.ReactNode;
};

/**
 * Port of `ion-picker`: the highlight / fade chrome around its columns, and numeric input (typing
 * digits on a focused `numericInput` column, or anywhere in the highlight, picks hour / minute).
 */
export const AppPicker: React.FC<AppPickerProps> = ({ mode, className, children }) => {
    const elRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const handles = useRef(new Set<PickerColumnHandle>());
    const state = useRef<{
        useInputMode: boolean;
        inputModeColumn?: Element;
        actionOnClick?: () => void;
        destroyKeypressListener?: () => void;
        singleColumnSearchTimeout?: ReturnType<typeof setTimeout>;
    }>({ useInputMode: false });

    const emitInputModeChange = useCallback(() => {
        const { useInputMode, inputModeColumn } = state.current;
        handles.current.forEach(h => h.inputModeChange(useInputMode, inputModeColumn));
    }, []);

    const numericColumns = (): PickerColumnHandle[] =>
        Array.from(elRef.current?.querySelectorAll(`.${COLUMN}`) ?? [])
            .map(el => columnHandles.get(el))
            .filter((h): h is PickerColumnHandle => !!h && h.numericInput);

    const exitInputMode = useCallback(() => {
        const s = state.current;
        const inputEl = inputRef.current;
        if (!s.useInputMode || !inputEl) return;
        s.useInputMode = false;
        s.inputModeColumn = undefined;
        inputEl.blur();
        inputEl.value = '';
        if (s.destroyKeypressListener) {
            s.destroyKeypressListener();
            s.destroyKeypressListener = undefined;
        }
        emitInputModeChange();
    }, [emitInputModeChange]);

    const optionsOf = (colEl: Element): HTMLElement[] =>
        Array.from(colEl.querySelectorAll<HTMLElement>(`.${OPTION}`)).filter(
            el => !isOptionDisabled(el)
        );

    const selectSingleColumn = (): void => {
        const s = state.current;
        const inputEl = inputRef.current;
        if (!inputEl || !s.inputModeColumn) return;
        const options = optionsOf(s.inputModeColumn);
        if (s.singleColumnSearchTimeout) clearTimeout(s.singleColumnSearchTimeout);
        s.singleColumnSearchTimeout = setTimeout(() => {
            inputEl.value = '';
            s.singleColumnSearchTimeout = undefined;
        }, 1000);
        if (inputEl.value.length >= 3) {
            inputEl.value = inputEl.value.substring(inputEl.value.length - 2);
            selectSingleColumn();
            return;
        }
        const found = options.find(({ textContent }) => {
            const parsedText = (textContent ?? '').replace(/^0+(?=[1-9])|0+(?=0$)/, '');
            return parsedText === inputEl.value;
        });
        if (found) {
            columnHandles.get(s.inputModeColumn)?.setValue(optionValue(found));
            return;
        }
        if (inputEl.value.length === 2) {
            inputEl.value = inputEl.value.substring(inputEl.value.length - 1);
            selectSingleColumn();
        }
    };

    const searchColumn = (
        col: PickerColumnHandle | undefined,
        value: string,
        zeroBehavior: 'start' | 'end' = 'start'
    ): boolean => {
        if (!value || !col) return false;
        const behavior = zeroBehavior === 'start' ? /^0+/ : /0$/;
        value = value.replace(behavior, '');
        const option = optionsOf(col.el).find(
            el => (el.textContent ?? '').replace(behavior, '') === value
        );
        if (option) col.setValue(optionValue(option));
        return !!option;
    };

    const multiColumnSearch = (
        first: PickerColumnHandle | undefined,
        second: PickerColumnHandle | undefined,
        input: string
    ): void => {
        if (input.length === 0) return;
        const inputArray = input.split('');
        const hourValue = inputArray.slice(0, 2).join('');
        const foundHour = searchColumn(first, hourValue);
        if (inputArray.length > 2 && foundHour) {
            searchColumn(second, inputArray.slice(2, 4).join(''));
        } else if (!foundHour && inputArray.length >= 1) {
            let singleDigitHour = inputArray[0];
            let singleDigitFound = searchColumn(first, singleDigitHour);
            if (!singleDigitFound) {
                inputArray.shift();
                singleDigitHour = inputArray[0];
                singleDigitFound = searchColumn(first, singleDigitHour);
            }
            if (singleDigitFound && inputArray.length > 1) {
                searchColumn(second, inputArray.slice(1, 3).join(''));
            }
        }
    };

    const selectMultiColumn = (): void => {
        const inputEl = inputRef.current;
        if (!inputEl) return;
        const [firstColumn, lastColumn] = numericColumns();
        let value = inputEl.value;
        if (value.length > 4) {
            value = inputEl.value.substring(inputEl.value.length - 4);
            inputEl.value = value;
        }
        multiColumnSearch(firstColumn, lastColumn, value);
    };

    const onInputChange = (): void => {
        const { useInputMode, inputModeColumn } = state.current;
        if (!useInputMode || !inputRef.current) return;
        if (inputModeColumn) selectSingleColumn();
        else selectMultiColumn();
    };

    const onKeyPress = (ev: KeyboardEvent): void => {
        const inputEl = inputRef.current;
        if (!inputEl) return;
        if (!Number.isNaN(parseInt(ev.key, 10))) {
            inputEl.value += ev.key;
            onInputChange();
        }
    };

    const enterInputMode = (columnEl?: Element, focusInput = true): void => {
        const s = state.current;
        const inputEl = inputRef.current;
        const el = elRef.current;
        if (!inputEl || !el) return;
        if (numericColumns().length === 0) return;
        s.useInputMode = true;
        s.inputModeColumn = columnEl;
        if (focusInput) {
            if (s.destroyKeypressListener) {
                s.destroyKeypressListener();
                s.destroyKeypressListener = undefined;
            }
            inputEl.focus();
        } else {
            el.addEventListener('keypress', onKeyPress);
            s.destroyKeypressListener = () => el.removeEventListener('keypress', onKeyPress);
        }
        emitInputModeChange();
    };

    const isInHighlightBounds = (ev: React.PointerEvent): boolean => {
        const highlightEl = highlightRef.current;
        if (!highlightEl) return false;
        const bbox = highlightEl.getBoundingClientRect();
        const outsideX = ev.clientX < bbox.left || ev.clientX > bbox.right;
        const outsideY = ev.clientY < bbox.top || ev.clientY > bbox.bottom;
        return !(outsideX || outsideY);
    };

    /**
     * Ionic saw the event target retargeted to the column (or option) host. Here the column is the
     * one whose assistive focusable / scroller / empties were hit, unless an option was.
     */
    const retarget = (target: EventTarget | null): { el?: Element; isColumn: boolean } => {
        if (!(target instanceof Element)) return { isColumn: false };
        const option = target.closest(`.${OPTION}`);
        if (option) return { el: option, isColumn: false };
        const column = target.closest(`.${COLUMN}`);
        if (column) return { el: column, isColumn: true };
        return { el: target, isColumn: false };
    };

    const onPointerDown = (ev: React.PointerEvent): void => {
        const s = state.current;
        if (isInHighlightBounds(ev)) {
            const target = retarget(ev.target);
            if (s.useInputMode) {
                if (target.isColumn) {
                    if (s.inputModeColumn && s.inputModeColumn === target.el) {
                        s.actionOnClick = () => enterInputMode();
                    } else {
                        s.actionOnClick = () => enterInputMode(target.el);
                    }
                } else {
                    s.actionOnClick = () => exitInputMode();
                }
            } else {
                const columnEl = numericColumns().length === 1 ? target.el : undefined;
                s.actionOnClick = () => enterInputMode(columnEl);
            }
            return;
        }
        s.actionOnClick = () => exitInputMode();
    };

    const onClick = (): void => {
        const s = state.current;
        if (s.actionOnClick) {
            s.actionOnClick();
            s.actionOnClick = undefined;
        }
    };

    const onFocus = (ev: React.FocusEvent): void => {
        const target = ev.target as Element;
        if (!target.classList.contains('assistive-focusable')) return;
        if (!state.current.actionOnClick) {
            const columnEl = target.closest(`.${COLUMN}`);
            const handle = columnEl ? columnHandles.get(columnEl) : undefined;
            if (handle?.numericInput) enterInputMode(columnEl ?? undefined, false);
            else exitInputMode();
        }
    };

    const onBlur = (ev: React.FocusEvent): void => {
        const related = ev.relatedTarget as Element | null;
        const relatedIsColumn = !!related?.classList.contains('assistive-focusable');
        if (!related || (!relatedIsColumn && related !== inputRef.current)) exitInputMode();
    };

    // @Listen('touchstart'): keeps sheet / swipe gestures of ancestors from seeing wheel drags.
    useEffect(() => {
        const el = elRef.current;
        if (!el) return undefined;
        const stop = (ev: TouchEvent) => ev.stopPropagation();
        el.addEventListener('touchstart', stop, { passive: true });
        return () => el.removeEventListener('touchstart', stop);
    }, []);

    const subscribe = useCallback((handle: PickerColumnHandle) => {
        handles.current.add(handle);
        return () => {
            handles.current.delete(handle);
        };
    }, []);

    const ctx = useRef<PickerContextValue>({ exitInputMode, subscribe });
    ctx.current.exitInputMode = exitInputMode;

    return (
        <PickerContext.Provider value={ctx.current}>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- ion-picker's pointer handling; the columns are the keyboard targets */}
            <div
                ref={elRef}
                className={['app-picker', mode, className].filter(Boolean).join(' ')}
                onPointerDown={onPointerDown}
                onClick={onClick}
                onFocus={onFocus}
                onBlur={onBlur}
            >
                <input
                    ref={inputRef}
                    aria-hidden="true"
                    tabIndex={-1}
                    inputMode="numeric"
                    type="number"
                    onKeyDown={ev => {
                        if (ev.key === 'Enter') inputRef.current?.blur();
                    }}
                    onInput={onInputChange}
                    onBlur={exitInputMode}
                />
                <div className="picker-before" />
                <div className="picker-after" />
                <div className="picker-highlight" ref={highlightRef} />
                {children}
            </div>
        </PickerContext.Provider>
    );
};

// ---------------------------------------------------------------- AppPickerColumn

const optionValueStore = new WeakMap<Element, PickerValue>();
/** The option's value; `undefined` for the spacer items (Ionic read `.value` off any element). */
const optionValue = (el: Element | null | undefined): PickerValue | undefined =>
    el ? optionValueStore.get(el) : undefined;

export type PickerColumnChangeEvent = {
    detail: { value: PickerValue | undefined };
    stopPropagation: () => void;
};

export type AppPickerColumnProps = {
    items: PickerColumnItem[];
    value?: PickerValue;
    disabled?: boolean;
    numericInput?: boolean;
    mode: IonMode;
    /** Palette entry for the column (`--app-color-*` set by the caller on an ancestor). */
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
    /** `ion-picker-column-option` `part`s (`wheel-item`, `wheel-item active`). */
    getOptionPart?: (item: PickerColumnItem) => string | undefined;
    onIonChange?: (ev: PickerColumnChangeEvent) => void;
};

const SPACERS = [0, 1, 2];

/** Port of `ion-picker-column` (and its options): a scroll-snapping wheel with a slider role. */
export const AppPickerColumn: React.FC<AppPickerColumnProps> = props => {
    const {
        items,
        disabled = false,
        numericInput = false,
        mode,
        className,
        style,
        getOptionPart,
    } = props;
    const picker = useContext(PickerContext);
    const elRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const assistiveRef = useRef<HTMLDivElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [, forceRender] = useState(0);

    const live = useRef({
        value: props.value as PickerValue | undefined,
        lastProps: null as AppPickerColumnProps | null,
        isScrolling: false,
        isColumnVisible: false,
        canExitInputMode: true,
        updateValueTextOnScroll: false,
        scrollEndCallback: undefined as (() => void) | undefined,
        destroyScrollListener: undefined as (() => void) | undefined,
        pendingWatch: false,
        renderedValueText: '',
        props,
    });
    const s = live.current;
    s.props = props;

    // Stencil set the parent's `value` only when the parent re-rendered, and watched it against
    // the column's own (possibly newer) value.
    if (s.lastProps !== props) {
        s.lastProps = props;
        if (props.value !== s.value) {
            s.value = props.value;
            s.pendingWatch = true;
        }
    }

    const ariaLabel = props['aria-label'] ?? 'Select a value';

    const options = (): HTMLElement[] =>
        Array.from(scrollRef.current?.querySelectorAll<HTMLElement>(`:scope > .${OPTION}`) ?? []);

    const activeItem = (): HTMLElement | undefined =>
        options().find(option => {
            if (!s.props.disabled && isOptionDisabled(option)) return false;
            return optionValue(option) === s.value;
        });

    const setPickerItemActiveState = (item: Element, active: boolean): void => {
        if (active) item.classList.add(PICKER_ITEM_ACTIVE_CLASS);
        else item.classList.remove(PICKER_ITEM_ACTIVE_CLASS);
    };

    const centerPickerItemInView = (
        target: HTMLElement,
        smooth = true,
        canExitInputMode = true
    ): void => {
        const scrollEl = scrollRef.current;
        if (s.isColumnVisible && scrollEl) {
            const top = target.offsetTop - 3 * target.clientHeight + target.clientHeight / 2;
            if (scrollEl.scrollTop !== top) {
                s.canExitInputMode = canExitInputMode;
                s.updateValueTextOnScroll = false;
                scrollEl.scroll({ top, left: 0, behavior: smooth ? 'smooth' : undefined });
            }
        }
    };

    const scrollActiveItemIntoView = (smooth = false): void => {
        const activeEl = activeItem();
        if (activeEl) centerPickerItemInView(activeEl, smooth, false);
    };

    const setValue = (value: PickerValue | undefined): void => {
        if (s.props.disabled === true || s.value === value) return;
        s.value = value;
        // @Watch('value'), synchronous on set.
        if (s.isColumnVisible) scrollActiveItemIntoView(true);
        s.props.onIonChange?.({ detail: { value }, stopPropagation: () => undefined });
        forceRender(n => n + 1);
    };

    const exitInputMode = (): void => {
        if (!picker) return;
        picker.exitInputMode();
        elRef.current?.classList.remove('picker-column-active');
    };

    const setInputModeActive = (state: boolean): void => {
        if (s.isScrolling) {
            s.scrollEndCallback = () => setIsActive(state);
            return;
        }
        setIsActive(state);
    };

    const getOptionValueText = (el?: Element | null): string =>
        el
            ? (el.getAttribute('aria-label') ??
              (el as HTMLElement).innerText ??
              el.textContent ??
              '')
            : '';

    const initializeScrollListener = (): void => {
        const enableHaptics = Capacitor.getPlatform() === 'ios';
        const scrollEl = scrollRef.current;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let activeEl: HTMLElement | undefined = activeItem();
        const scrollCallback = () => {
            requestAnimationFrame(() => {
                if (!scrollEl) return;
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
                if (!s.isScrolling) {
                    if (enableHaptics) haptic('selectionStart');
                    s.isScrolling = true;
                }
                const bbox = scrollEl.getBoundingClientRect();
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;
                const elementsAtPoint = document.elementsFromPoint(centerX, centerY);
                const newActiveElement = elementsAtPoint.find(
                    (el): el is HTMLElement =>
                        el.classList.contains(OPTION) && scrollEl.contains(el)
                );
                if (activeEl !== undefined) setPickerItemActiveState(activeEl, false);
                if (newActiveElement === undefined || isOptionDisabled(newActiveElement)) return;
                if (newActiveElement !== activeEl) {
                    if (enableHaptics) haptic('selectionChanged');
                    if (s.canExitInputMode) exitInputMode();
                }
                activeEl = newActiveElement;
                setPickerItemActiveState(newActiveElement, true);
                if (s.updateValueTextOnScroll) {
                    assistiveRef.current?.setAttribute(
                        'aria-valuetext',
                        getOptionValueText(newActiveElement)
                    );
                }
                timeout = setTimeout(() => {
                    s.isScrolling = false;
                    s.updateValueTextOnScroll = true;
                    if (enableHaptics) haptic('selectionEnd');
                    const { scrollEndCallback } = s;
                    if (scrollEndCallback) {
                        scrollEndCallback();
                        s.scrollEndCallback = undefined;
                    }
                    s.canExitInputMode = true;
                    setValue(optionValue(newActiveElement));
                }, 250);
            });
        };
        requestAnimationFrame(() => {
            if (!scrollEl) return;
            scrollEl.addEventListener('scroll', scrollCallback);
            s.destroyScrollListener = () => scrollEl.removeEventListener('scroll', scrollCallback);
        });
    };

    // Handle for the picker (numeric input) and the datetime (popover onWillPresent).
    const handle = useRef<PickerColumnHandle | null>(null);
    if (!handle.current) {
        handle.current = {
            el: null as unknown as HTMLDivElement,
            numericInput,
            setValue: v => setValue(v),
            scrollActiveItemIntoView: smooth => scrollActiveItemIntoView(smooth),
            inputModeChange: (useInputMode, inputModeColumn) => {
                if (!s.props.numericInput) return;
                const isColumnActive =
                    inputModeColumn === undefined || inputModeColumn === elRef.current;
                setInputModeActive(useInputMode && isColumnActive);
            },
        };
    }
    const h = handle.current;
    h.numericInput = numericInput;
    h.setValue = v => setValue(v);
    h.scrollActiveItemIntoView = smooth => scrollActiveItemIntoView(smooth);

    useLayoutEffect(() => {
        const el = elRef.current;
        if (!el) return undefined;
        h.el = el;
        columnHandles.set(el, h);
        const unsubscribe = picker?.subscribe(h);
        const root = el.closest('.app-picker');
        const io = new IntersectionObserver(
            entries => {
                const ev = entries[entries.length - 1];
                if (ev.isIntersecting) {
                    s.isColumnVisible = true;
                    const oldActive = el.querySelector(`.${PICKER_ITEM_ACTIVE_CLASS}`);
                    if (oldActive) setPickerItemActiveState(oldActive, false);
                    scrollActiveItemIntoView();
                    const active = activeItem();
                    if (active) setPickerItemActiveState(active, true);
                    initializeScrollListener();
                    forceRender(n => n + 1);
                } else {
                    s.isColumnVisible = false;
                    if (s.destroyScrollListener) {
                        s.destroyScrollListener();
                        s.destroyScrollListener = undefined;
                    }
                }
            },
            { threshold: 0.001, root }
        );
        io.observe(el);
        return () => {
            io.disconnect();
            unsubscribe?.();
            s.destroyScrollListener?.();
            s.destroyScrollListener = undefined;
            columnHandles.delete(el);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only, like componentWillLoad
    }, []);

    // componentDidRender, plus the value watcher for parent-driven changes.
    useLayoutEffect(() => {
        if (s.pendingWatch) {
            s.pendingWatch = false;
            if (s.isColumnVisible) scrollActiveItemIntoView(true);
        }
        if (s.isColumnVisible && !activeItem()) {
            const firstOption = options()[0];
            if (firstOption && optionValue(firstOption) !== s.value)
                setValue(optionValue(firstOption));
        }
        // Stencil re-rendered the column after its parent had replaced the options, so the active
        // option and value text saw the new elements; React commits both at once. Catch up here
        // when no scroll is under way to do it (new options at the same scroll offset).
        const active = s.isColumnVisible && !s.isScrolling ? activeItem() : undefined;
        if (active && !active.classList.contains(PICKER_ITEM_ACTIVE_CLASS)) {
            for (const option of options()) setPickerItemActiveState(option, option === active);
        }
        if (
            getOptionValueText(s.isColumnVisible ? activeItem() : undefined) !== s.renderedValueText
        ) {
            forceRender(n => n + 1);
        }
    });

    // Ionic walked the column's slotted children, which were all options; here the spacers are
    // siblings too, so the walk visits options only.
    const optionSibling = (
        el: Element,
        dir: 'nextElementSibling' | 'previousElementSibling'
    ): Element | null => {
        let node = el[dir];
        while (node != null && !node.classList.contains(OPTION)) node = node[dir];
        return node;
    };

    const findOption = (
        stride: number,
        dir: 'nextElementSibling' | 'previousElementSibling'
    ): Element | null => {
        const active = activeItem();
        if (!active) return null;
        let lastNode: Element = active;
        let node = optionSibling(active, dir);
        while (node != null) {
            if (stride > 0) stride--;
            if (!isOptionDisabled(node) && stride === 0) return node;
            lastNode = node;
            node = optionSibling(node, dir);
        }
        return lastNode;
    };

    const findNextOption = (stride = 1): Element | null => findOption(stride, 'nextElementSibling');

    const findPreviousOption = (stride = 1): Element | null =>
        findOption(stride, 'previousElementSibling');

    const onKeyDown = (ev: React.KeyboardEvent): void => {
        const mobile = isMobile();
        let newOption: Element | null | undefined = null;
        switch (ev.key) {
            case 'ArrowDown':
                newOption = mobile ? findPreviousOption() : findNextOption();
                break;
            case 'ArrowUp':
                newOption = mobile ? findNextOption() : findPreviousOption();
                break;
            case 'PageUp':
                newOption = mobile ? findNextOption(5) : findPreviousOption(5);
                break;
            case 'PageDown':
                newOption = mobile ? findPreviousOption(5) : findNextOption(5);
                break;
            case 'Home':
                newOption = options()[0] ?? null;
                break;
            case 'End':
                newOption = options().at(-1) ?? null;
                break;
            default:
                break;
        }
        if (newOption !== null && newOption !== undefined) {
            setValue(optionValue(newOption));
            ev.preventDefault();
        }
    };

    const valueText = getOptionValueText(s.isColumnVisible ? activeItem() : undefined);
    s.renderedValueText = valueText;

    const classes = [
        COLUMN,
        mode,
        isActive && 'picker-column-active',
        numericInput && 'picker-column-numeric-input',
        disabled && 'picker-column-disabled',
        className,
    ];

    return (
        // ion-picker-column kept its `aria-label` attribute on the host as well as on the slider.
        <div
            ref={elRef}
            className={classes.filter(Boolean).join(' ')}
            style={style}
            aria-label={props['aria-label']}
        >
            {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- as ion-picker-column: a disabled column leaves the tab order */}
            <div
                ref={assistiveRef}
                className="assistive-focusable"
                role="slider"
                tabIndex={disabled ? undefined : 0}
                aria-label={ariaLabel}
                aria-valuemin={0}
                aria-valuemax={0}
                aria-valuenow={0}
                aria-valuetext={valueText}
                aria-orientation="vertical"
                onKeyDown={onKeyDown}
            />
            <div aria-hidden="true" className="picker-opts" ref={scrollRef} tabIndex={-1}>
                {SPACERS.map(i => (
                    <div key={`before-${i}`} className="picker-item-empty" aria-hidden="true">
                        {'\u00A0'}
                    </div>
                ))}
                {items.map(item => (
                    <div
                        key={String(item.value)}
                        ref={el => {
                            if (el) optionValueStore.set(el, item.value);
                        }}
                        className={[
                            OPTION,
                            mode,
                            'app-color-primary',
                            item.disabled && 'option-disabled',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        data-value={String(item.value)}
                        part={getOptionPart?.(item)}
                    >
                        <button
                            type="button"
                            tabIndex={-1}
                            disabled={item.disabled}
                            onClick={() => setValue(item.value)}
                        >
                            {item.text}
                        </button>
                    </div>
                ))}
                {SPACERS.map(i => (
                    <div key={`after-${i}`} className="picker-item-empty" aria-hidden="true">
                        {'\u00A0'}
                    </div>
                ))}
            </div>
        </div>
    );
};

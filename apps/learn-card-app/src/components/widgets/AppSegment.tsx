import React, {
    createContext,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './widgets.css';

type SegmentContextValue = {
    value: string | undefined;
    /** The button right after the checked one (its separator hides, as Ionic's did). */
    afterChecked: string | undefined;
    /** A press that started on the checked button is sliding the indicator. */
    activated: boolean;
};

const SegmentContext = createContext<SegmentContextValue | null>(null);

const BUTTON = '.app-segment-button';

export type AppSegmentProps<T extends string> = Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onChange' | 'defaultValue'
> & {
    /** The checked button's `value`. */
    value?: T;
    /** A user selection (click, tap, drag, Enter / Space), like `ionChange`. Not called for `value` prop updates. */
    onValueChange?: (value: T) => void;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

const isRTL = (el: HTMLElement): boolean =>
    (el.closest('[dir]')?.getAttribute('dir') ?? document.dir) === 'rtl';

/**
 * App-owned replacement for `IonSegment`: a `tablist` of `AppSegmentButton`s with Ionic's
 * behavior. A click or tap selects; a press on the checked button slides the indicator across the
 * buttons as the pointer moves and selects where it ends; a press elsewhere selects the button
 * under the release point. Arrow keys, Home and End move focus (wrapping), Enter and Space select.
 * `onValueChange` fires once per user selection that changes the value.
 */
export function AppSegment<T extends string>({
    value: valueProp,
    onValueChange,
    mode: modeProp,
    className,
    children,
    onKeyDown,
    onPointerDown,
    ref,
    ...rest
}: AppSegmentProps<T>): React.ReactElement {
    const mode = modeProp ?? getIonMode();
    const hostRef = useRef<HTMLDivElement | null>(null);
    const [value, setValueState] = useState<string | undefined>(valueProp);
    const valueRef = useRef(value);
    const [activated, setActivated] = useState(false);
    const [afterChecked, setAfterChecked] = useState<string | undefined>(undefined);
    const setValue = (next: string | undefined): void => {
        valueRef.current = next;
        setValueState(next);
    };

    // Ionic's @Watch('value'): a new prop value replaces the internal one.
    const lastProp = useRef(valueProp);
    useLayoutEffect(() => {
        if (lastProp.current === valueProp) return;
        lastProp.current = valueProp;
        setValue(valueProp);
    }, [valueProp]);

    const getButtons = (): HTMLElement[] =>
        hostRef.current
            ? [...hostRef.current.querySelectorAll<HTMLElement>(BUTTON)].filter(
                  b => b.parentElement?.closest('.app-segment') === hostRef.current
              )
            : [];
    const valueOf = (button: HTMLElement): string | undefined => button.dataset.value;
    const emit = (next: string | undefined): void => {
        if (next !== undefined) onValueChange?.(next as T);
    };

    // Separator after the checked button, and Ionic's checkButton() indicator slide on a change.
    const previousValue = useRef(value);
    useLayoutEffect(() => {
        const buttons = getButtons();
        const index = buttons.findIndex(b => valueOf(b) === value);
        const next = index >= 0 ? buttons[index + 1] : undefined;
        setAfterChecked(next ? valueOf(next) : undefined);

        const previous = buttons.find(b => valueOf(b) === previousValue.current);
        const current = index >= 0 ? buttons[index] : undefined;
        previousValue.current = value;
        if (!previous || !current || previous === current) return;
        const prevIndicator = previous.querySelector<HTMLElement>('.app-segment-button-indicator');
        const indicator = current.querySelector<HTMLElement>('.app-segment-button-indicator');
        if (!prevIndicator || !indicator) return;
        const from = prevIndicator.getBoundingClientRect();
        const to = indicator.getBoundingClientRect();
        if (!to.width) return;
        indicator.classList.remove('app-segment-button-indicator-animated');
        indicator.style.setProperty(
            'transform',
            `translate3d(${from.left - to.left}px, 0, 0) scaleX(${from.width / to.width})`
        );
        indicator.getBoundingClientRect();
        indicator.classList.add('app-segment-button-indicator-animated');
        indicator.style.setProperty('transform', '');
    });

    // Ionic's segment `onClick` (a native host listener, so a button's React `stopPropagation`
    // does not cancel it): select the clicked button if the press gesture has not already.
    useEffect(() => {
        const host = hostRef.current;
        if (!host) return undefined;
        const onClick = (event: MouseEvent): void => {
            const button = (event.target as HTMLElement).closest<HTMLElement>(BUTTON);
            if (!button || !getButtons().includes(button)) return;
            const next = valueOf(button);
            const changed = next !== valueRef.current;
            setValue(next);
            if (changed) emit(next);
        };
        host.addEventListener('click', onClick);
        return () => host.removeEventListener('click', onClick);
    });

    /** Ionic's setNextIndex(): the drag / release target for a pointer at `x`. */
    const moveTo = (x: number, isEnd: boolean, sliding: boolean): void => {
        const host = hostRef.current;
        if (!host) return;
        const rtl = isRTL(host);
        const buttons = getButtons();
        const index = buttons.findIndex(b => valueOf(b) === valueRef.current);
        if (index === -1) return;
        const rect = buttons[index].getBoundingClientRect();
        let current: HTMLElement | undefined;
        if (sliding && !isEnd) {
            const decrease = rtl ? x > rect.left + rect.width : x < rect.left;
            const increase = rtl ? x < rect.left : x > rect.left + rect.width;
            const nextIndex = decrease ? index - 1 : increase ? index + 1 : undefined;
            if (nextIndex !== undefined && nextIndex >= 0 && nextIndex < buttons.length) {
                current = buttons[nextIndex];
            }
        }
        if (!sliding && isEnd) {
            const hit = document.elementFromPoint(x, rect.top + rect.height / 2);
            const button = hit?.closest<HTMLElement>(BUTTON);
            current = button && buttons.includes(button) ? button : undefined;
        }
        if (current && valueOf(current) !== valueRef.current) setValue(valueOf(current));
    };

    // Ionic's press gesture (threshold 0, so it starts on pointerdown).
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
        onPointerDown?.(event);
        if (event.button === 2) return;
        const buttons = getButtons();
        const pressed = (event.target as HTMLElement).closest<HTMLElement>(BUTTON);
        const valueBefore = valueRef.current;
        let sliding = false;
        if (pressed && buttons.includes(pressed)) {
            if (!buttons.some(b => valueOf(b) === valueRef.current)) setValue(valueOf(pressed));
            if (valueOf(pressed) === valueRef.current) {
                sliding = true;
                setActivated(true);
            }
        }
        const onMove = (move: PointerEvent): void => moveTo(move.clientX, false, sliding);
        const onUp = (up: PointerEvent): void => {
            document.removeEventListener('pointermove', onMove, true);
            document.removeEventListener('pointerup', onUp, true);
            document.removeEventListener('pointercancel', onUp, true);
            setActivated(false);
            moveTo(up.clientX, true, sliding);
            if (valueRef.current !== undefined && valueRef.current !== valueBefore) {
                emit(valueRef.current);
            }
        };
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', onUp, true);
        document.addEventListener('pointercancel', onUp, true);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        onKeyDown?.(event);
        const host = hostRef.current;
        if (!host) return;
        const rtl = isRTL(host);
        const buttons = getButtons();
        const focusedIndex = buttons.findIndex(b => b.contains(document.activeElement));
        // Ionic's getSegmentButton('next' | 'previous'): wraps; nothing focused counts as index -1.
        const next = (): HTMLElement | undefined => buttons[focusedIndex + 1] ?? buttons[0];
        const previous = (): HTMLElement | undefined =>
            buttons[focusedIndex - 1] ?? buttons[buttons.length - 1];
        let current: HTMLElement | undefined;
        let select = false;
        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                current = rtl ? previous() : next();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                current = rtl ? next() : previous();
                break;
            case 'Home':
                event.preventDefault();
                current = buttons[0];
                break;
            case 'End':
                event.preventDefault();
                current = buttons[buttons.length - 1];
                break;
            case ' ':
            case 'Enter':
                event.preventDefault();
                current = focusedIndex >= 0 ? buttons[focusedIndex] : undefined;
                select = true;
                break;
            default:
                break;
        }
        if (!current) return;
        if (select) {
            const selected = valueOf(current);
            const changed = selected !== valueRef.current;
            setValue(selected);
            if (changed) emit(selected);
        }
        current.querySelector<HTMLButtonElement>('.app-segment-button-native')?.focus();
    };

    const setRefs = (el: HTMLDivElement | null): void => {
        hostRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    };

    const classes = [
        'app-segment',
        `app-segment-${mode}`,
        activated && 'app-segment-activated',
        className,
    ];

    return (
        <SegmentContext.Provider value={{ value, afterChecked, activated }}>
            <div
                ref={setRefs}
                role="tablist"
                className={classes.filter(Boolean).join(' ')}
                onPointerDown={handlePointerDown}
                onKeyDown={handleKeyDown}
                {...rest}
            >
                {children}
            </div>
        </SegmentContext.Provider>
    );
}

export type AppSegmentButtonProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> & {
    value: string;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonSegmentButton` (Ionic's ios look, which every call site set with
 * `mode="ios"`): a native `role="tab"` button with `aria-selected`, plus the sliding indicator.
 * Put an `AppLabel` inside for the text.
 */
export const AppSegmentButton: React.FC<AppSegmentButtonProps> = ({
    value,
    className,
    children,
    ...rest
}) => {
    const segment = useContext(SegmentContext);
    const checked = segment?.value === value;
    const classes = [
        'app-segment-button',
        checked && 'app-segment-button-checked',
        segment?.afterChecked === value && 'app-segment-button-after-checked',
        segment?.activated && 'app-segment-button-activated',
        className,
    ];

    return (
        <div className={classes.filter(Boolean).join(' ')} data-value={value} {...rest}>
            <button
                type="button"
                role="tab"
                aria-selected={checked ? 'true' : 'false'}
                className="app-segment-button-native"
            >
                <span className="app-segment-button-inner">{children}</span>
            </button>
            <div className="app-segment-button-indicator app-segment-button-indicator-animated">
                <div className="app-segment-button-indicator-background" />
            </div>
        </div>
    );
};

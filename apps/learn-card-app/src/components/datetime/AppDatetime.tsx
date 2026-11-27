import React, {
    forwardRef,
    useImperativeHandle,
    useLayoutEffect,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    caretDownSharp,
    caretUpSharp,
    chevronBack,
    chevronDown,
    chevronForward,
} from 'learn-card-base/icons/ionicons';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import AppButton from '../controls/AppButton';
import AppButtons from '../controls/AppButtons';
import { attachActivatableRipple } from '../controls/tapActivation';
import AppIcon from '../icon/AppIcon';
import AppPopover from '../overlays/AppPopover';
import { dismissClosestModalOrPopover } from '../overlays/overlayStack';
import { AppPicker, AppPickerColumn, getPickerColumnHandle } from './AppPicker';
import { isBefore, warnIfValueOutOfBounds } from './utils/comparison';
import {
    generateMonths,
    getDaysOfMonth,
    getDaysOfWeek,
    getMonthColumnData,
    getTimeColumnsData,
    getToday,
    getYearColumnData,
} from './utils/data';
import { formatValue, getLocalizedTime, getMonthAndYear } from './utils/format';
import { getHourCycle, isLocaleDayPeriodRTL, isMonthFirstLocale } from './utils/helpers';
import {
    calculateHourFromAMPM,
    convertDataToISO,
    getClosestValidDate,
    getEndOfWeek,
    getNextDay,
    getNextMonth,
    getNextWeek,
    getNextYear,
    getPreviousDay,
    getPreviousMonth,
    getPreviousWeek,
    getPreviousYear,
    getStartOfWeek,
    validateParts,
} from './utils/manipulation';
import {
    clampDate,
    getPartsFromCalendarDay,
    parseAmPm,
    parseDate,
    parseMaxParts,
    parseMinParts,
} from './utils/parse';
import {
    getCalendarDayState,
    isDayDisabled,
    isMonthDisabled,
    isNextMonthDisabled,
    isPrevMonthDisabled,
} from './utils/state';
import type {
    DatetimeChangeEvent,
    DatetimeHourCycle,
    DatetimeParts,
    PickerColumnItem,
    PickerValue,
} from './utils/types';
import './datetime.css';

/** The grid presentations; the wheel-only ones (`time`, `month`, `year`, `month-year`) are not ported. */
export type AppDatetimePresentation = 'date' | 'date-time' | 'time-date';

export type AppDatetimeProps = {
    /** ISO 8601 date (`YYYY-MM-DD`) or date-time (`YYYY-MM-DDTHH:mm[:ss]`), as ion-datetime's. */
    value?: string | null;
    presentation?: AppDatetimePresentation;
    min?: string;
    max?: string;
    /** Theme palette name (`primary`, `indigo-500`, ...): `--ion-color-<name>` in variables.css. */
    color?: string;
    mode?: IonMode;
    disabled?: boolean;
    readonly?: boolean;
    locale?: string;
    firstDayOfWeek?: number;
    hourCycle?: DatetimeHourCycle;
    name?: string;
    showDefaultButtons?: boolean;
    showClearButton?: boolean;
    showDefaultTimeLabel?: boolean;
    cancelText?: string;
    doneText?: string;
    clearText?: string;
    size?: 'fixed' | 'cover';
    /** ion-datetime's `slot="buttons"` content: replaces the default Cancel / Done buttons. */
    buttons?: React.ReactNode;
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    'aria-label'?: string;
    /** ion-datetime's `ionChange` payload: `detail.value` is the ISO string, or undefined when cleared. */
    onIonChange?: (ev: DatetimeChangeEvent) => void;
    onIonCancel?: () => void;
};

/** ion-datetime's methods. */
export type AppDatetimeHandle = {
    confirm: (closeOverlay?: boolean) => Promise<void>;
    reset: (startDate?: string) => Promise<void>;
    cancel: (closeOverlay?: boolean) => Promise<void>;
};

const CANCEL_ROLE = 'cancel';
const CONFIRM_ROLE = 'confirm';
const WHEEL_ITEM_PART = 'wheel-item';
const WHEEL_ITEM_ACTIVE_PART = 'active';

let datetimeIds = 0;

/** ion-datetime's `.ion-color-<name>` host class, as the `--app-color-*` entry its parts read. */
export const datetimeColorStyle = (color: string): React.CSSProperties =>
    ({
        '--app-color-base': `var(--ion-color-${color})`,
        '--app-color-base-rgb': `var(--ion-color-${color}-rgb)`,
        '--app-color-contrast': `var(--ion-color-${color}-contrast)`,
        '--app-color-contrast-rgb': `var(--ion-color-${color}-contrast-rgb)`,
        '--app-color-shade': `var(--ion-color-${color}-shade)`,
        '--app-color-tint': `var(--ion-color-${color}-tint)`,
    }) as React.CSSProperties;

type Props = AppDatetimeProps & { resolvedMode: IonMode };

/** Props Stencil re-rendered on (event handlers, classes and slotted content did not). */
const DATA_PROPS: (keyof Props)[] = [
    'value',
    'presentation',
    'min',
    'max',
    'color',
    'resolvedMode',
    'disabled',
    'readonly',
    'locale',
    'firstDayOfWeek',
    'hourCycle',
    'name',
    'showDefaultButtons',
    'showClearButton',
    'showDefaultTimeLabel',
    'cancelText',
    'doneText',
    'clearText',
    'size',
];

/** Ionic's FOCUS_KEYS (utils/focus-visible). */
const FOCUS_KEYS = [
    'Tab',
    'ArrowDown',
    'Space',
    'Escape',
    ' ',
    'Shift',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'Home',
    'End',
];

/**
 * The state and logic of @ionic/core 8.7.2 `ion-datetime` (datetime.tsx), kept as Ionic's mutable
 * component fields. `update()` is Stencil's re-render on a `@State` change.
 */
class DatetimeController {
    inputId = `app-dt-${datetimeIds++}`;
    props: Props;
    update: () => void;
    el: HTMLDivElement | null = null;
    calendarBodyRef: HTMLDivElement | null = null;
    intersectionTrackerRef: HTMLDivElement | null = null;

    value: string | null | undefined;
    showMonthAndYear = false;
    activeParts: DatetimeParts | DatetimeParts[] = [];
    workingParts: DatetimeParts = {
        month: 5,
        day: 28,
        year: 2021,
        hour: 13,
        minute: 52,
        ampm: 'pm',
        isAdjacentDay: false,
    };
    isTimePopoverOpen = false;
    timePopoverEvent: Event | null = null;
    forceRenderDate?: { month: number; year: number; day: number | null };
    resolveForceDateScrolling?: () => void;
    todayParts!: DatetimeParts;
    defaultParts!: DatetimeParts;
    minParts?: DatetimeParts;
    maxParts?: DatetimeParts;
    ready = false;
    /** Inside the render body: state changes there are already being rendered. */
    rendering = true;
    /** A state or data-prop change since the last commit (Stencil re-rendered only then). */
    dirty = true;
    prevPresentation: string | null = null;
    destroyCalendarListener?: () => void;
    destroyKeyboardMO?: () => void;

    constructor(props: Props, update: () => void) {
        this.props = props;
        this.update = () => {
            this.dirty = true;
            if (!this.rendering) update();
        };
        this.value = props.value;
        // componentWillLoad
        this.todayParts = parseDate(getToday()) as DatetimeParts;
        this.processMinParts();
        this.processMaxParts();
        this.defaultParts = getClosestValidDate(this.todayParts);
        this.processValue(this.value);
    }

    get presentation(): AppDatetimePresentation {
        return this.props.presentation ?? 'date-time';
    }
    get locale(): string {
        return this.props.locale ?? 'default';
    }
    get firstDayOfWeek(): number {
        return this.props.firstDayOfWeek ?? 0;
    }
    get disabled(): boolean {
        return this.props.disabled ?? false;
    }
    get readonly(): boolean {
        return this.props.readonly ?? false;
    }
    get color(): string {
        return this.props.color ?? 'primary';
    }
    get isGridStyle(): boolean {
        return true;
    }
    get isCalendarPicker(): boolean {
        return true;
    }
    get hasSlottedButtons(): boolean {
        return (
            this.props.buttons !== undefined &&
            this.props.buttons !== null &&
            this.props.buttons !== false
        );
    }

    /** A parent re-render: Ionic React set every prop, and Stencil ran the watchers of changed ones. */
    syncProps(next: Props): void {
        const prev = this.props;
        this.props = next;
        if (DATA_PROPS.some(key => prev[key] !== next[key])) this.dirty = true;
        if (next.min !== prev.min) this.processMinParts();
        if (next.max !== prev.max) this.processMaxParts();
        if (next.value !== this.value) {
            this.value = next.value;
            this.valueChanged();
        }
    }

    valueChanged(): void {
        if (this.hasValue()) this.processValue(this.value);
    }

    setValue = (value: string | undefined): void => {
        this.value = value;
        // @Watch('value') fires on internal sets too.
        this.valueChanged();
        this.props.onIonChange?.({ detail: { value } });
        this.update();
    };

    getActivePartsWithFallback = (): DatetimeParts => this.getActivePart() ?? this.defaultParts;

    getActivePart = (): DatetimeParts | undefined => {
        const { activeParts } = this;
        return Array.isArray(activeParts) ? activeParts[0] : activeParts;
    };

    closeParentOverlay = (role: string): void => {
        if (this.el) dismissClosestModalOrPopover(this.el, role);
    };

    setWorkingParts = (parts: DatetimeParts): void => {
        this.workingParts = { ...parts };
        this.update();
    };

    setActiveParts = (parts: DatetimeParts): void => {
        if (this.readonly) return;
        const { minParts, maxParts } = this;
        const validatedParts = validateParts(parts, minParts, maxParts);
        this.setWorkingParts(validatedParts);
        this.activeParts = { ...validatedParts };
        this.update();
        if (this.hasSlottedButtons || this.props.showDefaultButtons) return;
        void this.confirm();
    };

    initializeKeyboardListeners = (): void => {
        const calendarBodyRef = this.calendarBodyRef;
        if (!calendarBodyRef) return;
        const currentMonth = calendarBodyRef.querySelector<HTMLElement>(
            '.calendar-month:nth-of-type(2)'
        );
        if (!currentMonth) return;
        const checkCalendarBodyFocus = (ev: MutationRecord[]) => {
            const record = ev[0];
            if (
                record.oldValue?.includes('ion-focused') ||
                !calendarBodyRef.classList.contains('ion-focused')
            )
                return;
            this.focusWorkingDay(currentMonth);
        };
        const mo = new MutationObserver(checkCalendarBodyFocus);
        mo.observe(calendarBodyRef, { attributeFilter: ['class'], attributeOldValue: true });
        const onKeyDown = (ev: KeyboardEvent) => {
            const activeElement = document.activeElement;
            if (!activeElement || !activeElement.classList.contains('calendar-day')) return;
            const parts = getPartsFromCalendarDay(activeElement as HTMLElement);
            let partsToFocus: { month: number; day: number | null; year: number };
            switch (ev.key) {
                case 'ArrowDown':
                    ev.preventDefault();
                    partsToFocus = getNextWeek(parts);
                    break;
                case 'ArrowUp':
                    ev.preventDefault();
                    partsToFocus = getPreviousWeek(parts);
                    break;
                case 'ArrowRight':
                    ev.preventDefault();
                    partsToFocus = getNextDay(parts);
                    break;
                case 'ArrowLeft':
                    ev.preventDefault();
                    partsToFocus = getPreviousDay(parts);
                    break;
                case 'Home':
                    ev.preventDefault();
                    partsToFocus = getStartOfWeek(parts);
                    break;
                case 'End':
                    ev.preventDefault();
                    partsToFocus = getEndOfWeek(parts);
                    break;
                case 'PageUp':
                    ev.preventDefault();
                    partsToFocus = ev.shiftKey ? getPreviousYear(parts) : getPreviousMonth(parts);
                    break;
                case 'PageDown':
                    ev.preventDefault();
                    partsToFocus = ev.shiftKey ? getNextYear(parts) : getNextMonth(parts);
                    break;
                default:
                    return;
            }
            if (isDayDisabled(partsToFocus, this.minParts, this.maxParts)) return;
            this.setWorkingParts({ ...this.workingParts, ...partsToFocus });
            requestAnimationFrame(() => this.focusWorkingDay(currentMonth));
        };
        calendarBodyRef.addEventListener('keydown', onKeyDown);
        this.destroyKeyboardMO = () => {
            mo.disconnect();
            calendarBodyRef.removeEventListener('keydown', onKeyDown);
        };
    };

    focusWorkingDay = (currentMonth: HTMLElement): void => {
        const { day, month, year } = this.workingParts;
        const firstOfMonth = new Date(`${month}/1/${year}`).getDay();
        const offset =
            firstOfMonth >= this.firstDayOfWeek
                ? firstOfMonth - this.firstDayOfWeek
                : 7 - (this.firstDayOfWeek - firstOfMonth);
        if (day === null) return;
        const dayEl = currentMonth.querySelector<HTMLElement>(
            `.calendar-day-wrapper:nth-of-type(${offset + day}) .calendar-day`
        );
        dayEl?.focus();
    };

    processMinParts = (): void => {
        const { min } = this.props;
        this.minParts = min === undefined ? undefined : parseMinParts(min, this.defaultParts);
    };

    processMaxParts = (): void => {
        const { max } = this.props;
        this.maxParts = max === undefined ? undefined : parseMaxParts(max, this.defaultParts);
    };

    isRTL = (): boolean =>
        (this.el?.closest('[dir]')?.getAttribute('dir') ?? document.dir) === 'rtl';

    initializeCalendarListener = (): void => {
        const calendarBodyRef = this.calendarBodyRef;
        if (!calendarBodyRef) return;
        const months = calendarBodyRef.querySelectorAll<HTMLElement>('.calendar-month');
        const startMonth = months[0];
        const workingMonth = months[1];
        const endMonth = months[2];
        const mode = this.props.resolvedMode;
        const needsiOSRubberBandFix =
            mode === 'ios' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
        requestAnimationFrame(() => {
            calendarBodyRef.scrollLeft = startMonth.clientWidth * (this.isRTL() ? -1 : 1);
            const getChangedMonth = (parts: DatetimeParts) => {
                const box = calendarBodyRef.getBoundingClientRect();
                const condition = this.isRTL()
                    ? calendarBodyRef.scrollLeft >= -2
                    : calendarBodyRef.scrollLeft <= 2;
                const month = condition ? startMonth : endMonth;
                const monthBox = month.getBoundingClientRect();
                if (Math.abs(monthBox.x - box.x) > 2) return undefined;
                const { forceRenderDate } = this;
                if (forceRenderDate !== undefined) {
                    return {
                        month: forceRenderDate.month,
                        year: forceRenderDate.year,
                        day: forceRenderDate.day,
                    };
                }
                if (month === startMonth) return getPreviousMonth(parts);
                if (month === endMonth) return getNextMonth(parts);
                return undefined;
            };
            let appliediOSRubberBandFix = false;
            const updateActiveMonth = () => {
                if (needsiOSRubberBandFix) {
                    calendarBodyRef.style.removeProperty('pointer-events');
                    appliediOSRubberBandFix = false;
                }
                const newDate = getChangedMonth(this.workingParts);
                if (!newDate) return;
                const { month, day, year } = newDate;
                if (
                    isMonthDisabled(
                        { month, year, day: null },
                        {
                            minParts: { ...this.minParts, day: null },
                            maxParts: { ...this.maxParts, day: null },
                        }
                    )
                ) {
                    return;
                }
                calendarBodyRef.style.setProperty('overflow', 'hidden');
                requestAnimationFrame(() => {
                    this.setWorkingParts({ ...this.workingParts, month, day, year });
                    this.afterCommit(() => {
                        calendarBodyRef.scrollLeft =
                            workingMonth.clientWidth * (this.isRTL() ? -1 : 1);
                        calendarBodyRef.style.removeProperty('overflow');
                        this.resolveForceDateScrolling?.();
                    });
                });
            };
            let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
            const scrollCallback = () => {
                if (scrollTimeout) clearTimeout(scrollTimeout);
                if (!appliediOSRubberBandFix && needsiOSRubberBandFix) {
                    calendarBodyRef.style.setProperty('pointer-events', 'none');
                    appliediOSRubberBandFix = true;
                }
                scrollTimeout = setTimeout(updateActiveMonth, 50);
            };
            calendarBodyRef.addEventListener('scroll', scrollCallback);
            this.destroyCalendarListener = () =>
                calendarBodyRef.removeEventListener('scroll', scrollCallback);
        });
    };

    /**
     * Stencil's writeTask ran after the re-render its state change queued. React commits
     * asynchronously, so DOM writes that depend on the new months run after the next commit.
     */
    commitCallbacks: (() => void)[] = [];
    afterCommit = (fn: () => void): void => {
        this.commitCallbacks.push(fn);
    };
    flushCommit = (): void => {
        const fns = this.commitCallbacks;
        this.commitCallbacks = [];
        fns.forEach(fn => fn());
    };

    destroyInteractionListeners = (): void => {
        this.destroyCalendarListener?.();
        this.destroyKeyboardMO?.();
        this.destroyCalendarListener = undefined;
        this.destroyKeyboardMO = undefined;
    };

    processValue = (value: string | null | undefined): void => {
        const hasValue = value !== null && value !== undefined && value !== '';
        const valueToProcess = hasValue ? parseDate(value) : this.defaultParts;
        const { minParts, maxParts, workingParts } = this;
        if (!valueToProcess) return;
        if (hasValue) warnIfValueOutOfBounds(valueToProcess, minParts, maxParts);
        const singleValue = Array.isArray(valueToProcess)
            ? valueToProcess[valueToProcess.length - 1]
            : valueToProcess;
        const targetValue = clampDate(singleValue, minParts, maxParts);
        const { month, day, year, hour, minute } = targetValue;
        const ampm = parseAmPm(hour as number);
        if (hasValue) {
            this.activeParts = Array.isArray(valueToProcess)
                ? [...valueToProcess]
                : { month, day, year, hour, minute, ampm };
        } else {
            this.activeParts = [];
        }
        const didChangeMonth =
            (month !== undefined && month !== workingParts.month) ||
            (year !== undefined && year !== workingParts.year);
        const bodyIsVisible = this.ready;
        if (this.isGridStyle && didChangeMonth && bodyIsVisible && !this.showMonthAndYear) {
            void this.animateToDate(targetValue);
        } else {
            this.setWorkingParts({ month, day, year, hour, minute, ampm });
        }
    };

    animateToDate = async (targetValue: DatetimeParts): Promise<void> => {
        const { workingParts } = this;
        this.forceRenderDate = targetValue;
        this.update();
        const forceDateScrollingPromise = new Promise<void>(resolve => {
            this.resolveForceDateScrolling = resolve;
        });
        const targetMonthIsBefore = isBefore(targetValue, workingParts);
        // The forced month renders first, then the scroll starts (Stencil rendered synchronously).
        this.afterCommit(() => (targetMonthIsBefore ? this.prevMonth() : this.nextMonth()));
        await forceDateScrollingPromise;
        this.resolveForceDateScrolling = undefined;
        this.forceRenderDate = undefined;
        this.update();
    };

    hasValue = (): boolean => this.value != null;

    nextMonth = (): void => {
        const calendarBodyRef = this.calendarBodyRef;
        if (!calendarBodyRef) return;
        const nextMonth = calendarBodyRef.querySelector<HTMLElement>(
            '.calendar-month:last-of-type'
        );
        if (!nextMonth) return;
        const left = nextMonth.offsetWidth * 2;
        calendarBodyRef.scrollTo({
            top: 0,
            left: left * (this.isRTL() ? -1 : 1),
            behavior: 'smooth',
        });
    };

    prevMonth = (): void => {
        const calendarBodyRef = this.calendarBodyRef;
        if (!calendarBodyRef) return;
        const prevMonth = calendarBodyRef.querySelector('.calendar-month:first-of-type');
        if (!prevMonth) return;
        calendarBodyRef.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    };

    toggleMonthAndYearView = (): void => {
        this.showMonthAndYear = !this.showMonthAndYear;
        this.update();
    };

    confirm = async (closeOverlay = false): Promise<void> => {
        const { isCalendarPicker, activeParts } = this;
        if (activeParts !== undefined || !isCalendarPicker) {
            if (Array.isArray(activeParts) && activeParts.length === 0) {
                this.setValue(undefined);
            } else {
                this.setValue(convertDataToISO(activeParts as DatetimeParts) as string);
            }
        }
        if (closeOverlay) this.closeParentOverlay(CONFIRM_ROLE);
    };

    reset = async (startDate?: string): Promise<void> => {
        this.processValue(startDate);
    };

    cancel = async (closeOverlay = false): Promise<void> => {
        this.props.onIonCancel?.();
        if (closeOverlay) this.closeParentOverlay(CANCEL_ROLE);
    };

    initializeListeners = (): void => {
        this.initializeCalendarListener();
        this.initializeKeyboardListeners();
    };
}

/**
 * App-owned replacement for `IonDatetime` (@ionic/core 8.7.2) in its grid presentations (`date`,
 * `date-time`, `time-date`): the same parts, classes, keyboard model, events and methods, in the
 * light DOM. `onIonChange` gets `{ detail: { value } }` as before; a ref exposes `confirm`,
 * `reset` and `cancel`. Done / Cancel close the closest modal or popover, Ionic or app-owned.
 */
export const AppDatetime = forwardRef<AppDatetimeHandle, AppDatetimeProps>((props, ref) => {
    const resolvedMode = props.mode ?? getIonMode();
    const fullProps: Props = { ...props, resolvedMode };
    const [, setTick] = useState(0);
    const ctrlRef = useRef<DatetimeController | null>(null);
    const propsRef = useRef<AppDatetimeProps | null>(null);
    if (!ctrlRef.current) {
        ctrlRef.current = new DatetimeController(fullProps, () => setTick(n => n + 1));
        propsRef.current = props;
    }
    const c = ctrlRef.current;
    c.rendering = true;
    if (propsRef.current !== props) {
        propsRef.current = props;
        c.syncProps(fullProps);
    }
    c.props = fullProps;
    const toggleRef = useRef<HTMLButtonElement>(null);
    const rippleRef = useRef<HTMLSpanElement>(null);
    const [popoverClass] = useState(() => `app-datetime-popover-${c.inputId}`);

    useImperativeHandle(ref, () => ({ confirm: c.confirm, reset: c.reset, cancel: c.cancel }), [c]);

    // componentDidLoad: start / stop the calendar listeners as the datetime shows and hides.
    useEffect(() => {
        const el = c.el;
        const tracker = c.intersectionTrackerRef;
        if (!el || !tracker) return undefined;
        const visibleIO = new IntersectionObserver(
            entries => {
                if (!entries[0].isIntersecting) return;
                c.initializeListeners();
                requestAnimationFrame(() => {
                    c.ready = true;
                    el.classList.add('datetime-ready');
                    c.update();
                });
            },
            { threshold: 0.01, root: el }
        );
        const hiddenIO = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) return;
                c.destroyInteractionListeners();
                c.showMonthAndYear = false;
                requestAnimationFrame(() => {
                    c.ready = false;
                    el.classList.remove('datetime-ready');
                    c.update();
                });
            },
            { threshold: 0, root: el }
        );
        const raf = requestAnimationFrame(() => {
            visibleIO.observe(tracker);
            hiddenIO.observe(tracker);
        });

        // startFocusVisible(el): `ion-focused` on keyboard-focused `.ion-focusable` parts.
        let currentFocus: Element[] = [];
        let keyboardMode = true;
        const setFocus = (elements: Element[]) => {
            currentFocus.forEach(e => e.classList.remove('ion-focused'));
            elements.forEach(e => e.classList.add('ion-focused'));
            currentFocus = elements;
        };
        const pointerDown = () => {
            keyboardMode = false;
            setFocus([]);
        };
        const onKeydown = (ev: KeyboardEvent) => {
            keyboardMode = FOCUS_KEYS.includes(ev.key);
            if (!keyboardMode) setFocus([]);
        };
        const onFocusin = (ev: FocusEvent) => {
            if (keyboardMode) {
                setFocus(
                    ev
                        .composedPath()
                        .filter(
                            (n): n is Element =>
                                n instanceof Element &&
                                n.classList.contains('ion-focusable') &&
                                el.contains(n)
                        )
                );
            }
        };
        el.addEventListener('keydown', onKeydown);
        el.addEventListener('focusin', onFocusin);
        el.addEventListener('touchstart', pointerDown, { passive: true });
        el.addEventListener('mousedown', pointerDown);

        return () => {
            cancelAnimationFrame(raf);
            visibleIO.disconnect();
            hiddenIO.disconnect();
            c.destroyInteractionListeners();
            el.removeEventListener('keydown', onKeydown);
            el.removeEventListener('focusin', onFocusin);
            el.removeEventListener('touchstart', pointerDown);
            el.removeEventListener('mousedown', pointerDown);
        };
    }, [c]);

    // md: the month / year toggle's ion-ripple-effect.
    useEffect(() => {
        if (resolvedMode !== 'md' || !toggleRef.current || !rippleRef.current) return undefined;
        return attachActivatableRipple(toggleRef.current, rippleRef.current);
    }, [resolvedMode]);

    // componentDidRender (only after renders Stencil would have done), plus queued DOM writes.
    useLayoutEffect(() => {
        if (!c.dirty) {
            c.flushCommit();
            return;
        }
        c.dirty = false;
        const { calendarBodyRef, minParts, forceRenderDate } = c;
        if (minParts !== undefined && calendarBodyRef) {
            const workingMonth = calendarBodyRef.querySelector<HTMLElement>(
                '.calendar-month:nth-of-type(1)'
            );
            if (workingMonth && forceRenderDate === undefined) {
                calendarBodyRef.scrollLeft = workingMonth.clientWidth * (c.isRTL() ? -1 : 1);
            }
        }
        if (c.prevPresentation === null) {
            c.prevPresentation = c.presentation;
        } else if (c.presentation !== c.prevPresentation) {
            c.prevPresentation = c.presentation;
            c.destroyInteractionListeners();
            c.initializeListeners();
            c.showMonthAndYear = false;
        }
        c.flushCommit();
    });

    const mode = resolvedMode;
    // Ionic's nested components (ion-buttons, ion-button, ion-picker, ion-popover) took their mode
    // from `closest('[mode]')`, which stops at the datetime's shadow root: a `mode` on ion-datetime
    // styled the datetime itself, while its inner parts kept the app's mode.
    const childMode = getIonMode();
    const { disabled, readonly, presentation, locale, workingParts } = c;
    // The host's color as inline palette variables; the columns carry it too (Ionic passed the
    // datetime's `color` to each ion-picker-column, including the time popover's).
    const colorStyle = datetimeColorStyle(c.color);

    // ------------------------------------------------------------------ render helpers

    const optionPart = (selected: PickerValue | undefined) => (item: PickerColumnItem) =>
        item.value === selected ? `${WHEEL_ITEM_PART} ${WHEEL_ITEM_ACTIVE_PART}` : WHEEL_ITEM_PART;

    const renderFooter = () => {
        const { showDefaultButtons = false, showClearButton = false } = props;
        const isButtonDisabled = disabled || readonly;
        if (!c.hasSlottedButtons && !showDefaultButtons && !showClearButton) return null;
        const clearButtonClick = () => {
            void c.reset();
            c.setValue(undefined);
        };
        return (
            <div className="datetime-footer" key="datetime-footer">
                <div className="datetime-buttons">
                    <div
                        className={[
                            'datetime-action-buttons',
                            showClearButton && 'has-clear-button',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        {c.hasSlottedButtons ? (
                            // ion-datetime's `<slot name="buttons">`: light-DOM content, out of reach of its button rules.
                            <div className="datetime-slot-buttons">{props.buttons}</div>
                        ) : (
                            <AppButtons mode={childMode}>
                                {showDefaultButtons && (
                                    <AppButton
                                        id="cancel-button"
                                        color="inherit"
                                        mode={childMode}
                                        onClick={() => void c.cancel(true)}
                                        disabled={isButtonDisabled}
                                    >
                                        {props.cancelText ?? 'Cancel'}
                                    </AppButton>
                                )}
                                <div className="datetime-action-buttons-container">
                                    {showClearButton && (
                                        <AppButton
                                            id="clear-button"
                                            color="inherit"
                                            mode={childMode}
                                            onClick={clearButtonClick}
                                            disabled={isButtonDisabled}
                                        >
                                            {props.clearText ?? 'Clear'}
                                        </AppButton>
                                    )}
                                    {showDefaultButtons && (
                                        <AppButton
                                            id="confirm-button"
                                            color="inherit"
                                            mode={childMode}
                                            onClick={() => void c.confirm(true)}
                                            disabled={isButtonDisabled}
                                        >
                                            {props.doneText ?? 'Done'}
                                        </AppButton>
                                    )}
                                </div>
                            </AppButtons>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderMonthPickerColumn = (months: PickerColumnItem[]) => {
        if (months.length === 0) return null;
        const activePart = c.getActivePartsWithFallback();
        return (
            <AppPickerColumn
                style={colorStyle}
                key="month"
                aria-label="Select a month"
                className="month-column"
                mode={childMode}
                disabled={disabled}
                value={workingParts.month}
                items={months}
                getOptionPart={optionPart(workingParts.month)}
                onIonChange={ev => {
                    c.setWorkingParts({ ...workingParts, month: ev.detail.value as number });
                    c.setActiveParts({ ...activePart, month: ev.detail.value as number });
                }}
            />
        );
    };

    const renderYearPickerColumn = (years: PickerColumnItem[]) => {
        if (years.length === 0) return null;
        const activePart = c.getActivePartsWithFallback();
        return (
            <AppPickerColumn
                style={colorStyle}
                key="year"
                aria-label="Select a year"
                className="year-column"
                mode={childMode}
                disabled={disabled}
                value={workingParts.year}
                items={years}
                getOptionPart={optionPart(workingParts.year)}
                onIonChange={ev => {
                    c.setWorkingParts({ ...workingParts, year: ev.detail.value as number });
                    c.setActiveParts({ ...activePart, year: ev.detail.value as number });
                }}
            />
        );
    };

    const renderTimePickerColumns = () => {
        const activePart = c.getActivePart();
        const userHasSelectedDate = activePart !== undefined;
        const { hoursData, minutesData, dayPeriodData } = getTimeColumnsData(
            locale,
            workingParts,
            props.hourCycle,
            userHasSelectedDate ? c.minParts : undefined,
            userHasSelectedDate ? c.maxParts : undefined
        );
        const fallback = c.getActivePartsWithFallback();
        const isDayPeriodRTL = isLocaleDayPeriodRTL(locale);
        return [
            hoursData.length > 0 && (
                <AppPickerColumn
                    style={colorStyle}
                    key="hour"
                    aria-label="Select an hour"
                    mode={childMode}
                    disabled={disabled}
                    value={fallback.hour}
                    numericInput
                    items={hoursData}
                    getOptionPart={optionPart(fallback.hour)}
                    onIonChange={ev => {
                        c.setWorkingParts({ ...workingParts, hour: ev.detail.value as number });
                        c.setActiveParts({
                            ...c.getActivePartsWithFallback(),
                            hour: ev.detail.value as number,
                        });
                    }}
                />
            ),
            minutesData.length > 0 && (
                <AppPickerColumn
                    style={colorStyle}
                    key="minute"
                    aria-label="Select a minute"
                    mode={childMode}
                    disabled={disabled}
                    value={fallback.minute}
                    numericInput
                    items={minutesData}
                    getOptionPart={optionPart(fallback.minute)}
                    onIonChange={ev => {
                        c.setWorkingParts({ ...workingParts, minute: ev.detail.value as number });
                        c.setActiveParts({
                            ...c.getActivePartsWithFallback(),
                            minute: ev.detail.value as number,
                        });
                    }}
                />
            ),
            dayPeriodData.length > 0 && (
                <AppPickerColumn
                    key="ampm"
                    aria-label="Select a day period"
                    mode={childMode}
                    style={{ ...colorStyle, ...(isDayPeriodRTL ? { order: '-1' } : {}) }}
                    disabled={disabled}
                    value={fallback.ampm}
                    items={dayPeriodData}
                    getOptionPart={optionPart(fallback.ampm)}
                    onIonChange={ev => {
                        const ampm = ev.detail.value as 'am' | 'pm';
                        const hour = calculateHourFromAMPM(workingParts, ampm);
                        c.setWorkingParts({ ...workingParts, ampm, hour });
                        c.setActiveParts({ ...c.getActivePartsWithFallback(), ampm, hour });
                    }}
                />
            ),
        ];
    };

    const renderCalendarHeader = () => {
        const expandedIcon = mode === 'ios' ? chevronDown : caretUpSharp;
        const collapsedIcon = mode === 'ios' ? chevronForward : caretDownSharp;
        const prevMonthDisabled =
            disabled || isPrevMonthDisabled(workingParts, c.minParts, c.maxParts);
        const nextMonthDisabled = disabled || isNextMonthDisabled(workingParts, c.maxParts);
        return (
            <div className="calendar-header">
                <div className="calendar-action-buttons">
                    <div className="calendar-month-year">
                        <button
                            ref={toggleRef}
                            type="button"
                            className="calendar-month-year-toggle ion-activatable ion-focusable"
                            part="month-year-button"
                            disabled={disabled}
                            aria-label={
                                c.showMonthAndYear ? 'Hide year picker' : 'Show year picker'
                            }
                            onClick={c.toggleMonthAndYearView}
                        >
                            <span className="toggle-wrapper">
                                {getMonthAndYear(locale, workingParts)}
                                <AppIcon
                                    aria-hidden="true"
                                    icon={c.showMonthAndYear ? expandedIcon : collapsedIcon}
                                />
                            </span>
                            {mode === 'md' && (
                                <span
                                    ref={rippleRef}
                                    className="app-ripple-effect"
                                    role="presentation"
                                />
                            )}
                        </button>
                    </div>
                    <div className="calendar-next-prev">
                        <AppButtons mode={childMode}>
                            <AppButton
                                aria-label="Previous month"
                                mode={childMode}
                                disabled={prevMonthDisabled}
                                onClick={c.prevMonth}
                            >
                                <AppIcon aria-hidden="true" slot="icon-only" icon={chevronBack} />
                            </AppButton>
                            <AppButton
                                aria-label="Next month"
                                mode={childMode}
                                disabled={nextMonthDisabled}
                                onClick={c.nextMonth}
                            >
                                <AppIcon
                                    aria-hidden="true"
                                    slot="icon-only"
                                    icon={chevronForward}
                                />
                            </AppButton>
                        </AppButtons>
                    </div>
                </div>
                <div className="calendar-days-of-week" aria-hidden="true">
                    {getDaysOfWeek(locale, mode, c.firstDayOfWeek % 7).map((d, i) => (
                        <div key={i} className="day-of-week">
                            {d}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMonth = (month: number, year: number, index: number) => {
        const isDatetimeDisabled = disabled || readonly;
        const swipeDisabled =
            disabled ||
            isMonthDisabled(
                { month, year, day: null },
                { minParts: { ...c.minParts, day: null }, maxParts: { ...c.maxParts, day: null } }
            );
        const isWorkingMonth = workingParts.month === month && workingParts.year === year;
        const activePart = c.getActivePartsWithFallback();
        return (
            <div
                key={index}
                aria-hidden={!isWorkingMonth ? 'true' : undefined}
                className={[
                    'calendar-month',
                    !isWorkingMonth && swipeDisabled && 'calendar-month-disabled',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <div className="calendar-month-grid">
                    {getDaysOfMonth(month, year, c.firstDayOfWeek % 7).map(
                        (dateObject, dayIndex) => {
                            const { day, dayOfWeek, isAdjacentDay } = dateObject;
                            const referenceParts = { month, day, year, isAdjacentDay };
                            const isCalendarPadding = day === null;
                            const {
                                isActive,
                                isToday,
                                ariaLabel,
                                ariaSelected,
                                disabled: isCalDayDisabled,
                                text,
                            } = getCalendarDayState(
                                locale,
                                referenceParts,
                                c.activeParts,
                                c.todayParts,
                                c.minParts,
                                c.maxParts
                            );
                            const isCalDayConstrained = isCalDayDisabled && isDatetimeDisabled;
                            const isButtonDisabled = isCalDayDisabled || isDatetimeDisabled;
                            const dateParts = !isCalendarPadding
                                ? `calendar-day${isActive ? ' active' : ''}${isToday ? ' today' : ''}${isCalDayDisabled ? ' disabled' : ''}`
                                : undefined;
                            return (
                                <div key={dayIndex} className="calendar-day-wrapper">
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        data-day={day ?? undefined}
                                        data-month={month}
                                        data-year={year}
                                        data-index={dayIndex}
                                        data-day-of-week={dayOfWeek ?? undefined}
                                        disabled={isButtonDisabled}
                                        className={[
                                            isCalendarPadding && 'calendar-day-padding',
                                            'calendar-day',
                                            isActive && 'calendar-day-active',
                                            isCalDayConstrained && 'calendar-day-constrained',
                                            isToday && 'calendar-day-today',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        part={dateParts}
                                        aria-hidden={isCalendarPadding ? 'true' : undefined}
                                        aria-selected={ariaSelected === 'true' ? true : undefined}
                                        aria-label={ariaLabel ?? undefined}
                                        onClick={() => {
                                            if (isCalendarPadding) return;
                                            c.setWorkingParts({
                                                ...c.workingParts,
                                                ...referenceParts,
                                            });
                                            c.setActiveParts({ ...activePart, ...referenceParts });
                                        }}
                                    >
                                        {text}
                                    </button>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        );
    };

    const renderCalendar = () => (
        <div className="datetime-calendar" key="datetime-calendar">
            {renderCalendarHeader()}
            <div
                className="calendar-body ion-focusable"
                ref={el => {
                    c.calendarBodyRef = el;
                }}
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- ion-datetime's calendar body: focusing it moves focus to the working day
                tabIndex={0}
            >
                {generateMonths(workingParts, c.forceRenderDate).map(({ month, year }, i) =>
                    renderMonth(month, year, i)
                )}
            </div>
        </div>
    );

    const renderCalendarViewMonthYearPicker = () => {
        const months = getMonthColumnData(locale, workingParts, c.minParts, c.maxParts);
        const years = getYearColumnData(locale, c.defaultParts, c.minParts, c.maxParts);
        // Ionic orders day / month / year by locale; with no day column, month is always first.
        const columns = [renderMonthPickerColumn(months), renderYearPickerColumn(years)];
        const columnOrder = isMonthFirstLocale(locale) ? 'month-first' : 'year-first';
        return (
            <div className="datetime-year" key="datetime-year">
                <div className={`wheel-order-${columnOrder}`}>
                    <AppPicker mode={childMode}>{columns}</AppPicker>
                </div>
            </div>
        );
    };

    const renderTime = () => {
        const computedHourCycle = getHourCycle(locale, props.hourCycle);
        const activePart = c.getActivePartsWithFallback();
        const hasTimeLabel = props.showDefaultTimeLabel ?? true;
        const { isTimePopoverOpen } = c;
        return (
            <div className="datetime-time" key="datetime-time">
                <div className="time-header">{hasTimeLabel ? 'Time' : null}</div>
                <button
                    type="button"
                    className={['time-body', isTimePopoverOpen && 'time-body-active']
                        .filter(Boolean)
                        .join(' ')}
                    part={`time-button${isTimePopoverOpen ? ' active' : ''}`}
                    aria-expanded="false"
                    aria-haspopup="true"
                    disabled={disabled}
                    onClick={ev => {
                        c.isTimePopoverOpen = true;
                        c.timePopoverEvent = ev.nativeEvent;
                        c.update();
                    }}
                >
                    {getLocalizedTime(locale, activePart, computedHourCycle)}
                </button>
                <AppPopover
                    isOpen={isTimePopoverOpen}
                    event={c.timePopoverEvent}
                    alignment="center"
                    arrow={false}
                    mode={childMode}
                    className={`app-datetime-popover app-datetime-scope app-popover-translucent ${popoverClass}`}
                    style={
                        {
                            '--offset-y': '-10px',
                            '--min-width': 'fit-content',
                        } as React.CSSProperties
                    }
                    onWillPresent={() => {
                        document
                            .querySelectorAll(`.${popoverClass} .app-picker-column`)
                            .forEach(col => getPickerColumnHandle(col)?.scrollActiveItemIntoView());
                    }}
                    onWillDismiss={() => {
                        c.isTimePopoverOpen = false;
                        c.update();
                    }}
                >
                    <AppPicker mode={childMode}>{renderTimePickerColumns()}</AppPicker>
                </AppPopover>
            </div>
        );
    };

    const renderDatetime = () => {
        switch (presentation) {
            case 'date-time':
                return [
                    renderCalendar(),
                    renderCalendarViewMonthYearPicker(),
                    renderTime(),
                    renderFooter(),
                ];
            case 'time-date':
                return [
                    renderTime(),
                    renderCalendar(),
                    renderCalendarViewMonthYearPicker(),
                    renderFooter(),
                ];
            default:
                return [renderCalendar(), renderCalendarViewMonthYearPicker(), renderFooter()];
        }
    };

    c.rendering = false;

    const hostClasses = [
        'app-datetime',
        'app-datetime-scope',
        mode,
        readonly && 'datetime-readonly',
        disabled && 'datetime-disabled',
        c.showMonthAndYear && 'show-month-and-year',
        c.showMonthAndYear && 'month-year-picker-open',
        `datetime-presentation-${presentation}`,
        `datetime-size-${props.size ?? 'fixed'}`,
        'datetime-grid',
        c.ready && 'datetime-ready',
        props.className,
    ];

    return (
        <div
            ref={el => {
                c.el = el;
            }}
            id={props.id}
            className={hostClasses.filter(Boolean).join(' ')}
            style={{ ...colorStyle, ...props.style } as React.CSSProperties}
            aria-disabled={disabled ? 'true' : undefined}
            aria-label={props['aria-label']}
        >
            <div
                className="intersection-tracker"
                ref={el => {
                    c.intersectionTrackerRef = el;
                }}
            />
            {renderDatetime()}
            <input
                type="hidden"
                className="aux-input"
                name={props.name ?? c.inputId}
                value={formatValue(c.value) ?? ''}
                disabled={disabled}
            />
        </div>
    );
});

AppDatetime.displayName = 'AppDatetime';

export default AppDatetime;

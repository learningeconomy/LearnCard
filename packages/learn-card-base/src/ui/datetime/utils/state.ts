/* Port of @ionic/core 8.7.2 components/datetime/utils/state.js (without highlightedDates / dayValues). */
import { isAfter, isBefore, isSameDay } from './comparison';
import { generateDayAriaLabel, getDay } from './format';
import { getNextMonth, getPreviousMonth } from './manipulation';
import type { DatetimeParts } from './types';

type DayParts = { month: number; day: number | null; year: number };
/**
 * Ionic passes `{ ...minParts, day: null }` even when minParts is undefined, so a bound can be an
 * object without year / month; comparisons against its undefined fields are then false.
 */
type Bound = Partial<DatetimeParts> | undefined;

export const isYearDisabled = (refYear: number, minParts?: Bound, maxParts?: Bound): boolean => {
    if (minParts && (minParts.year as number) > refYear) return true;
    if (maxParts && (maxParts.year as number) < refYear) return true;
    return false;
};

export const isDayDisabled = (
    refParts: DayParts,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
): boolean => {
    if (refParts.day === null) return true;
    if (minParts && isBefore(refParts, minParts)) return true;
    if (maxParts && isAfter(refParts, maxParts)) return true;
    return false;
};

export const getCalendarDayState = (
    locale: string,
    refParts: DatetimeParts,
    activeParts: DatetimeParts | DatetimeParts[],
    todayParts: DatetimeParts,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
) => {
    const activePartsArray = Array.isArray(activeParts) ? activeParts : [activeParts];
    const isActive = activePartsArray.find(parts => isSameDay(refParts, parts)) !== undefined;
    const isToday = isSameDay(refParts, todayParts);
    const disabled = isDayDisabled(refParts, minParts, maxParts);
    return {
        disabled,
        isActive,
        isToday,
        ariaSelected: isActive ? 'true' : null,
        ariaLabel: generateDayAriaLabel(locale, isToday, refParts),
        text: refParts.day != null ? getDay(locale, refParts) : null,
    };
};

export const isMonthDisabled = (
    refParts: DayParts,
    { minParts, maxParts }: { minParts?: Bound; maxParts?: Bound }
): boolean => {
    if (isYearDisabled(refParts.year, minParts, maxParts)) return true;
    if (
        (minParts && isBefore(refParts, minParts as DayParts)) ||
        (maxParts && isAfter(refParts, maxParts as DayParts))
    ) {
        return true;
    }
    return false;
};

export const isPrevMonthDisabled = (
    refParts: DayParts,
    minParts?: Bound,
    maxParts?: Bound
): boolean => isMonthDisabled({ ...getPreviousMonth(refParts), day: null }, { minParts, maxParts });

export const isNextMonthDisabled = (refParts: DayParts, maxParts?: Bound): boolean =>
    isMonthDisabled({ ...getNextMonth(refParts), day: null }, { maxParts });

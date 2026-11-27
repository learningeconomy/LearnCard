/* Port of @ionic/core 8.7.2 components/datetime/utils/manipulation.js. */
import { isSameDay } from './comparison';
import { getNumDaysInMonth } from './helpers';
import { clampDate } from './parse';
import type { DatetimeParts } from './types';

type ISOParts = Partial<Omit<DatetimeParts, 'day'>> & { day?: number | null };

const twoDigit = (val?: number | null): string =>
    ('0' + (val !== undefined && val !== null ? Math.abs(val) : '0')).slice(-2);
const fourDigit = (val?: number): string =>
    ('000' + (val !== undefined ? Math.abs(val) : '0')).slice(-4);

export function convertDataToISO(data: ISOParts): string;
export function convertDataToISO(data: ISOParts[]): string[];
export function convertDataToISO(data: ISOParts | ISOParts[]): string | string[];
export function convertDataToISO(data: ISOParts | ISOParts[]): string | string[] {
    if (Array.isArray(data)) return data.map(parts => convertDataToISO(parts));
    let rtn = '';
    if (data.year !== undefined) {
        rtn = fourDigit(data.year);
        if (data.month !== undefined) {
            rtn += '-' + twoDigit(data.month);
            if (data.day !== undefined) {
                rtn += '-' + twoDigit(data.day);
                if (data.hour !== undefined) {
                    rtn += `T${twoDigit(data.hour)}:${twoDigit(data.minute)}:00`;
                }
            }
        }
    } else if (data.hour !== undefined) {
        rtn = twoDigit(data.hour) + ':' + twoDigit(data.minute);
    }
    return rtn;
}

export const convert12HourTo24Hour = (hour: number, ampm?: 'am' | 'pm'): number => {
    if (ampm === undefined) return hour;
    if (ampm === 'am') return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
};

type DayParts = { month: number; day: number | null; year: number; dayOfWeek?: number | null };
type Day = { month: number; day: number; year: number };

export const getStartOfWeek = (refParts: DayParts): Day => {
    const { dayOfWeek } = refParts;
    if (dayOfWeek === null || dayOfWeek === undefined) throw new Error('No day of week provided');
    return subtractDays(refParts, dayOfWeek);
};

export const getEndOfWeek = (refParts: DayParts): Day => {
    const { dayOfWeek } = refParts;
    if (dayOfWeek === null || dayOfWeek === undefined) throw new Error('No day of week provided');
    return addDays(refParts, 6 - dayOfWeek);
};

export const getNextDay = (refParts: DayParts): Day => addDays(refParts, 1);
export const getPreviousDay = (refParts: DayParts): Day => subtractDays(refParts, 1);
export const getPreviousWeek = (refParts: DayParts): Day => subtractDays(refParts, 7);
export const getNextWeek = (refParts: DayParts): Day => addDays(refParts, 7);

export const subtractDays = (refParts: DayParts, numDays: number): Day => {
    const { month, day, year } = refParts;
    if (day === null) throw new Error('No day provided');
    const workingParts = { month, day, year };
    workingParts.day = day - numDays;
    if (workingParts.day < 1) workingParts.month -= 1;
    if (workingParts.month < 1) {
        workingParts.month = 12;
        workingParts.year -= 1;
    }
    if (workingParts.day < 1) {
        const daysInMonth = getNumDaysInMonth(workingParts.month, workingParts.year);
        workingParts.day = daysInMonth + workingParts.day;
    }
    return workingParts;
};

export const addDays = (refParts: DayParts, numDays: number): Day => {
    const { month, day, year } = refParts;
    if (day === null) throw new Error('No day provided');
    const workingParts = { month, day, year };
    const daysInMonth = getNumDaysInMonth(month, year);
    workingParts.day = day + numDays;
    if (workingParts.day > daysInMonth) {
        workingParts.day -= daysInMonth;
        workingParts.month += 1;
    }
    if (workingParts.month > 12) {
        workingParts.month = 1;
        workingParts.year += 1;
    }
    return workingParts;
};

// `day` may be null; like Ionic, `numDaysInMonth < null` is false and the null day is kept.
export const getPreviousMonth = (
    refParts: DayParts
): { month: number; year: number; day: number | null } => {
    const month = refParts.month === 1 ? 12 : refParts.month - 1;
    const year = refParts.month === 1 ? refParts.year - 1 : refParts.year;
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const day = numDaysInMonth < (refParts.day as number) ? numDaysInMonth : refParts.day;
    return { month, year, day };
};

export const getNextMonth = (
    refParts: DayParts
): { month: number; year: number; day: number | null } => {
    const month = refParts.month === 12 ? 1 : refParts.month + 1;
    const year = refParts.month === 12 ? refParts.year + 1 : refParts.year;
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const day = numDaysInMonth < (refParts.day as number) ? numDaysInMonth : refParts.day;
    return { month, year, day };
};

const changeYear = (refParts: DayParts, yearDelta: number) => {
    const month = refParts.month;
    const year = refParts.year + yearDelta;
    const numDaysInMonth = getNumDaysInMonth(month, year);
    const day = numDaysInMonth < (refParts.day as number) ? numDaysInMonth : refParts.day;
    return { month, year, day };
};

export const getPreviousYear = (refParts: DayParts) => changeYear(refParts, -1);
export const getNextYear = (refParts: DayParts) => changeYear(refParts, 1);

export const getInternalHourValue = (
    hour: number,
    use24Hour: boolean,
    ampm?: 'am' | 'pm'
): number => (use24Hour ? hour : convert12HourTo24Hour(hour, ampm));

export const calculateHourFromAMPM = (
    currentParts: DatetimeParts,
    newAMPM: 'am' | 'pm'
): number | undefined => {
    const { ampm: currentAMPM, hour } = currentParts;
    let newHour = hour;
    if (currentAMPM === 'am' && newAMPM === 'pm') {
        newHour = convert12HourTo24Hour(newHour as number, 'pm');
    } else if (currentAMPM === 'pm' && newAMPM === 'am') {
        newHour = Math.abs((newHour as number) - 12);
    }
    return newHour;
};

export const validateParts = (
    parts: DatetimeParts,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
): DatetimeParts => {
    const { month, day, year } = parts;
    const partsCopy = clampDate({ ...parts }, minParts, maxParts);
    const numDays = getNumDaysInMonth(month, year);
    if (day !== null && numDays < day) partsCopy.day = numDays;
    if (minParts !== undefined && isSameDay(partsCopy, minParts)) {
        if (partsCopy.hour !== undefined && minParts.hour !== undefined) {
            if (partsCopy.hour < minParts.hour) {
                partsCopy.hour = minParts.hour;
                partsCopy.minute = minParts.minute;
            } else if (
                partsCopy.hour === minParts.hour &&
                partsCopy.minute !== undefined &&
                minParts.minute !== undefined &&
                partsCopy.minute < minParts.minute
            ) {
                partsCopy.minute = minParts.minute;
            }
        }
    }
    if (maxParts !== undefined && isSameDay(parts, maxParts)) {
        if (partsCopy.hour !== undefined && maxParts.hour !== undefined) {
            if (partsCopy.hour > maxParts.hour) {
                partsCopy.hour = maxParts.hour;
                partsCopy.minute = maxParts.minute;
            } else if (
                partsCopy.hour === maxParts.hour &&
                partsCopy.minute !== undefined &&
                maxParts.minute !== undefined &&
                partsCopy.minute > maxParts.minute
            ) {
                partsCopy.minute = maxParts.minute;
            }
        }
    }
    return partsCopy;
};

/**
 * Ionic's getClosestValidDate without the `yearValues` / `monthValues` / `dayValues` /
 * `hourValues` / `minuteValues` filters, which AppDatetime does not support (no call site set them).
 */
export const getClosestValidDate = (refParts: DatetimeParts): DatetimeParts => ({
    ...refParts,
    dayOfWeek: undefined,
});

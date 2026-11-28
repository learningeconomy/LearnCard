/*
 * Port of @ionic/core 8.7.2 components/datetime/utils/data.js: the parts the grid-style
 * presentations use (calendar, month/year wheel, time wheels). The wheel-only day and combined
 * date columns (`preferWheel`) and the `*Values` filters are not ported: no call site uses them.
 */
import { isAfter, isBefore, isSameDay } from './comparison';
import {
    addTimePadding,
    getFormattedHour,
    getLocalizedDayPeriod,
    getYear,
    removeDateTzOffset,
} from './format';
import { getHourCycle, getNumDaysInMonth, is24Hour } from './helpers';
import { getInternalHourValue, getNextMonth, getPreviousMonth } from './manipulation';
import type { DatetimeHourCycle, DatetimeParts, PickerColumnItem } from './types';

export const getToday = (): string => removeDateTzOffset(new Date()).toISOString();

const minutes = Array.from({ length: 60 }, (_, i) => i);
const hour11 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const hour12 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const hour23 = Array.from({ length: 24 }, (_, i) => i);
const hour24 = [...Array.from({ length: 23 }, (_, i) => i + 1), 0];

export const getDaysOfWeek = (locale: string, mode: 'ios' | 'md', firstDayOfWeek = 0): string[] => {
    const weekdayFormat = mode === 'ios' ? 'short' : 'narrow';
    const intl = new Intl.DateTimeFormat(locale, { weekday: weekdayFormat });
    const startDate = new Date('11/01/2020');
    const daysOfWeek: string[] = [];
    for (let i = firstDayOfWeek; i < firstDayOfWeek + 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        daysOfWeek.push(intl.format(currentDate));
    }
    return daysOfWeek;
};

export type CalendarDay = { day: number | null; dayOfWeek: number | null; isAdjacentDay: boolean };

/** Days of a month with leading padding (Ionic's `showAdjacentDays: false` branch). */
export const getDaysOfMonth = (
    month: number,
    year: number,
    firstDayOfWeek: number
): CalendarDay[] => {
    const numDays = getNumDaysInMonth(month, year);
    const firstOfMonth = new Date(`${month}/1/${year}`).getDay();
    const offset =
        firstOfMonth >= firstDayOfWeek
            ? firstOfMonth - (firstDayOfWeek + 1)
            : 6 - (firstDayOfWeek - firstOfMonth);
    let days: CalendarDay[] = [];
    for (let i = 1; i <= numDays; i++) {
        days.push({ day: i, dayOfWeek: (offset + i) % 7, isAdjacentDay: false });
    }
    for (let i = 0; i <= offset; i++) {
        days = [{ day: null, dayOfWeek: null, isAdjacentDay: false }, ...days];
    }
    return days;
};

const getHourData = (hourCycle: DatetimeHourCycle): number[] => {
    switch (hourCycle) {
        case 'h11':
            return hour11;
        case 'h12':
            return hour12;
        case 'h23':
            return hour23;
        case 'h24':
            return hour24;
        default:
            throw new Error(`Invalid hour cycle "${hourCycle}"`);
    }
};

export const generateTime = (
    locale: string,
    refParts: DatetimeParts,
    hourCycle: DatetimeHourCycle = 'h12',
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
) => {
    const computedHourCycle = getHourCycle(locale, hourCycle);
    const use24Hour = is24Hour(computedHourCycle);
    let processedHours = getHourData(computedHourCycle);
    let processedMinutes = minutes;
    let isAMAllowed = true;
    let isPMAllowed = true;
    if (minParts) {
        if (isSameDay(refParts, minParts)) {
            if (minParts.hour !== undefined) {
                const minHour = minParts.hour;
                processedHours = processedHours.filter(hour => {
                    const convertedHour = refParts.ampm === 'pm' ? (hour + 12) % 24 : hour;
                    return (use24Hour ? hour : convertedHour) >= minHour;
                });
                isAMAllowed = minHour < 13;
            }
            if (minParts.minute !== undefined) {
                const minMinute = minParts.minute;
                let isPastMinHour = false;
                if (minParts.hour !== undefined && refParts.hour !== undefined) {
                    if (refParts.hour > minParts.hour) isPastMinHour = true;
                }
                processedMinutes = processedMinutes.filter(
                    minute => isPastMinHour || minute >= minMinute
                );
            }
        } else if (isBefore(refParts, minParts)) {
            processedHours = [];
            processedMinutes = [];
            isAMAllowed = isPMAllowed = false;
        }
    }
    if (maxParts) {
        if (isSameDay(refParts, maxParts)) {
            if (maxParts.hour !== undefined) {
                const maxHour = maxParts.hour;
                processedHours = processedHours.filter(hour => {
                    const convertedHour = refParts.ampm === 'pm' ? (hour + 12) % 24 : hour;
                    return (use24Hour ? hour : convertedHour) <= maxHour;
                });
                isPMAllowed = maxHour >= 12;
            }
            if (maxParts.minute !== undefined && refParts.hour === maxParts.hour) {
                const maxMinute = maxParts.minute;
                processedMinutes = processedMinutes.filter(minute => minute <= maxMinute);
            }
        } else if (isAfter(refParts, maxParts)) {
            processedHours = [];
            processedMinutes = [];
            isAMAllowed = isPMAllowed = false;
        }
    }
    return { hours: processedHours, minutes: processedMinutes, am: isAMAllowed, pm: isPMAllowed };
};

type MonthRef = { month: number; year: number; day: number | null };

export const generateMonths = (refParts: MonthRef, forcedDate?: MonthRef): MonthRef[] => {
    const current = { month: refParts.month, year: refParts.year, day: refParts.day };
    if (
        forcedDate !== undefined &&
        (refParts.month !== forcedDate.month || refParts.year !== forcedDate.year)
    ) {
        const forced = { month: forcedDate.month, year: forcedDate.year, day: forcedDate.day };
        const forcedMonthIsBefore = isBefore(forced, current);
        return forcedMonthIsBefore
            ? [forced, current, getNextMonth(refParts)]
            : [getPreviousMonth(refParts), current, forced];
    }
    return [getPreviousMonth(refParts), current, getNextMonth(refParts)];
};

export const getMonthColumnData = (
    locale: string,
    refParts: DatetimeParts,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts,
    formatOptions: Intl.DateTimeFormatOptions = { month: 'long' }
): PickerColumnItem[] => {
    const { year } = refParts;
    const months: PickerColumnItem[] = [];
    const maxMonth = maxParts && maxParts.year === year ? maxParts.month : 12;
    const minMonth = minParts && minParts.year === year ? minParts.month : 1;
    for (let i = minMonth; i <= maxMonth; i++) {
        const date = new Date(`${i}/1/${year} GMT+0000`);
        const monthString = new Intl.DateTimeFormat(locale, {
            ...formatOptions,
            timeZone: 'UTC',
        }).format(date);
        months.push({ text: monthString, value: i });
    }
    return months;
};

export const getYearColumnData = (
    locale: string,
    refParts: DatetimeParts,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
): PickerColumnItem[] => {
    const { year } = refParts;
    const maxYear = maxParts?.year ?? year;
    const minYear = minParts?.year ?? year - 100;
    const processedYears: number[] = [];
    for (let i = minYear; i <= maxYear; i++) processedYears.push(i);
    return processedYears.map(y => ({
        text: getYear(locale, { year: y, month: refParts.month, day: refParts.day }),
        value: y,
    }));
};

export const getTimeColumnsData = (
    locale: string,
    refParts: DatetimeParts,
    hourCycle: DatetimeHourCycle | undefined,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
) => {
    const computedHourCycle = getHourCycle(locale, hourCycle);
    const use24Hour = is24Hour(computedHourCycle);
    const {
        hours,
        minutes: mins,
        am,
        pm,
    } = generateTime(locale, refParts, computedHourCycle, minParts, maxParts);
    const hoursData: PickerColumnItem[] = hours.map(hour => ({
        text: getFormattedHour(hour, computedHourCycle),
        value: getInternalHourValue(hour, use24Hour, refParts.ampm),
    }));
    const minutesData: PickerColumnItem[] = mins.map(minute => ({
        text: addTimePadding(minute),
        value: minute,
    }));
    const dayPeriodData: PickerColumnItem[] = [];
    if (am && !use24Hour)
        dayPeriodData.push({ text: getLocalizedDayPeriod(locale, 'am'), value: 'am' });
    if (pm && !use24Hour)
        dayPeriodData.push({ text: getLocalizedDayPeriod(locale, 'pm'), value: 'pm' });
    return { minutesData, hoursData, dayPeriodData };
};

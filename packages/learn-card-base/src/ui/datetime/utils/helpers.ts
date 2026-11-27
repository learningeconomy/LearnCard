/* Port of @ionic/core 8.7.2 components/datetime/utils/helpers.js. */
import type { DatetimeHourCycle } from './types';

export const isLeapYear = (year: number): boolean =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const getHourCycle = (locale: string, hourCycle?: DatetimeHourCycle): DatetimeHourCycle => {
    if (hourCycle !== undefined) return hourCycle;
    const formatted = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
    const options = formatted.resolvedOptions();
    if (options.hourCycle !== undefined) return options.hourCycle;
    const date = new Date('5/18/2021 00:00');
    const parts = formatted.formatToParts(date);
    const hour = parts.find(p => p.type === 'hour');
    if (!hour) throw new Error('Hour value not found from DateTimeFormat');
    switch (hour.value) {
        case '0':
            return 'h11';
        case '12':
            return 'h12';
        case '00':
            return 'h23';
        case '24':
            return 'h24';
        default:
            throw new Error(`Invalid hour cycle "${hourCycle}"`);
    }
};

export const is24Hour = (hourCycle: DatetimeHourCycle): boolean =>
    hourCycle === 'h23' || hourCycle === 'h24';

export const getNumDaysInMonth = (month: number, year: number): number =>
    month === 4 || month === 6 || month === 9 || month === 11
        ? 30
        : month === 2
          ? isLeapYear(year)
              ? 29
              : 28
          : 31;

export const isMonthFirstLocale = (
    locale: string,
    formatOptions: Intl.DateTimeFormatOptions = { month: 'numeric', year: 'numeric' }
): boolean => {
    const parts = new Intl.DateTimeFormat(locale, formatOptions).formatToParts(new Date());
    return parts[0].type === 'month';
};

export const isLocaleDayPeriodRTL = (locale: string): boolean => {
    const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).formatToParts(new Date());
    return parts[0].type === 'dayPeriod';
};

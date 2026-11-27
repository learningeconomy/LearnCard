/* Port of @ionic/core 8.7.2 components/datetime/utils/format.js. */
import { is24Hour } from './helpers';
import { convertDataToISO } from './manipulation';
import type { DatetimeHourCycle, DatetimeParts } from './types';

type RefParts = Partial<DatetimeParts>;

const getFormattedDayPeriod = (dayPeriod?: string): string =>
    dayPeriod === undefined ? '' : dayPeriod.toUpperCase();

export const stripTimeZone = (
    formatOptions: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatOptions => ({
    ...formatOptions,
    timeZone: 'UTC',
    timeZoneName: undefined,
});

export const getLocalizedTime = (
    locale: string,
    refParts: RefParts,
    hourCycle: DatetimeHourCycle,
    formatOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: 'numeric' }
): string => {
    const timeParts = { hour: refParts.hour, minute: refParts.minute };
    if (timeParts.hour === undefined || timeParts.minute === undefined) return 'Invalid Time';
    return new Intl.DateTimeFormat(locale, { ...stripTimeZone(formatOptions), hourCycle }).format(
        new Date(convertDataToISO({ year: 2023, day: 1, month: 1, ...timeParts }) + 'Z')
    );
};

export const addTimePadding = (value: number): string => {
    const valueToString = value.toString();
    return valueToString.length > 1 ? valueToString : `0${valueToString}`;
};

export const getFormattedHour = (hour: number, hourCycle: DatetimeHourCycle): string => {
    if (hour === 0) {
        switch (hourCycle) {
            case 'h11':
                return '0';
            case 'h12':
                return '12';
            case 'h23':
                return '00';
            case 'h24':
                return '24';
            default:
                throw new Error(`Invalid hour cycle "${hourCycle}"`);
        }
    }
    return is24Hour(hourCycle) ? addTimePadding(hour) : hour.toString();
};

export const generateDayAriaLabel = (
    locale: string,
    today: boolean,
    refParts: RefParts
): string | null => {
    if (refParts.day === null) return null;
    const date = getNormalizedDate(refParts);
    const labelString = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(date);
    return today ? `Today, ${labelString}` : labelString;
};

export const getMonthAndYear = (locale: string, refParts: RefParts): string => {
    const date = getNormalizedDate(refParts);
    return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
};

export const getDay = (locale: string, refParts: RefParts): string =>
    getLocalizedDateTimeParts(locale, refParts, { day: 'numeric' }).find(obj => obj.type === 'day')!
        .value;

export const getYear = (locale: string, refParts: RefParts): string =>
    getLocalizedDateTime(locale, refParts, { year: 'numeric' });

export const getNormalizedDate = (refParts: RefParts): Date => {
    const timeString =
        refParts.hour !== undefined && refParts.minute !== undefined
            ? ` ${refParts.hour}:${refParts.minute}`
            : '';
    return new Date(
        `${refParts.month ?? 1}/${refParts.day ?? 1}/${refParts.year ?? 2023}${timeString} GMT+0000`
    );
};

export const getLocalizedDateTime = (
    locale: string,
    refParts: RefParts,
    options: Intl.DateTimeFormatOptions
): string => getDateTimeFormat(locale, stripTimeZone(options)).format(getNormalizedDate(refParts));

export const getLocalizedDateTimeParts = (
    locale: string,
    refParts: RefParts,
    options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatPart[] =>
    getDateTimeFormat(locale, options).formatToParts(getNormalizedDate(refParts));

const getDateTimeFormat = (
    locale: string,
    options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });

export const getTodayLabel = (locale: string): string => {
    if ('RelativeTimeFormat' in Intl) {
        const label = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day');
        return label.charAt(0).toUpperCase() + label.slice(1);
    }
    return 'Today';
};

export const removeDateTzOffset = (date: Date): Date => {
    const tzOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - tzOffset);
    return date;
};

const DATE_AM = removeDateTzOffset(new Date('2022T01:00'));
const DATE_PM = removeDateTzOffset(new Date('2022T13:00'));

export const getLocalizedDayPeriod = (locale: string, dayPeriod?: 'am' | 'pm'): string => {
    const date = dayPeriod === 'am' ? DATE_AM : DATE_PM;
    const localizedDayPeriod = new Intl.DateTimeFormat(locale, { hour: 'numeric', timeZone: 'UTC' })
        .formatToParts(date)
        .find(part => part.type === 'dayPeriod');
    return localizedDayPeriod ? localizedDayPeriod.value : getFormattedDayPeriod(dayPeriod);
};

export const formatValue = (
    value: string | string[] | null | undefined
): string | null | undefined => (Array.isArray(value) ? value.join(',') : value);

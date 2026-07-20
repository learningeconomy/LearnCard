import { getLocale } from '../paraglide/runtime.js';

type DateValue = Date | string | number | null | undefined;

const toValidDate = (value: DateValue): Date | null => {
    if (value === null || value === undefined || value === '') return null;

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatLocaleDate = (
    value: DateValue,
    options?: Intl.DateTimeFormatOptions
): string => {
    const date = toValidDate(value);

    return date ? new Intl.DateTimeFormat(getLocale(), options).format(date) : '';
};

export const formatLocaleTime = (value: DateValue, options?: Intl.DateTimeFormatOptions): string =>
    toValidDate(value)?.toLocaleTimeString(getLocale(), options) ?? '';

export const formatLocaleNumber = (value: number, options?: Intl.NumberFormatOptions): string =>
    new Intl.NumberFormat(getLocale(), options).format(value);

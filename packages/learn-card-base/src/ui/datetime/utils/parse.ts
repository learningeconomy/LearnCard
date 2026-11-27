/* Port of @ionic/core 8.7.2 components/datetime/utils/parse.js. */
import { isAfter, isBefore } from './comparison';
import { getNumDaysInMonth } from './helpers';
import type { DatetimeParts } from './types';
import { printWarning } from './warn';

const ISO_8601_REGEXP =
    /^(\d{4}|[+-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+-])(\d{2})(?::(\d{2}))?)?)?$/;
const TIME_REGEXP =
    /^((\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+-])(\d{2})(?::(\d{2}))?)?)?$/;

export const convertToArrayOfNumbers = (
    input: number[] | number | string | undefined
): number[] | undefined => {
    if (input === undefined) return;
    let processedInput: unknown = input;
    if (typeof input === 'string') processedInput = input.replace(/\[|\]|\s/g, '').split(',');
    let values: number[];
    if (Array.isArray(processedInput)) {
        values = processedInput.map(num => parseInt(String(num), 10)).filter(isFinite);
    } else {
        values = [processedInput as number];
    }
    return values;
};

export const getPartsFromCalendarDay = (el: HTMLElement): DatetimeParts => ({
    month: parseInt(el.getAttribute('data-month') as string, 10),
    day: parseInt(el.getAttribute('data-day') as string, 10),
    year: parseInt(el.getAttribute('data-year') as string, 10),
    dayOfWeek: parseInt(el.getAttribute('data-day-of-week') as string, 10),
});

/**
 * Parses an ISO 8601 date / time string (or an array of them). Time-only strings leave
 * year / month / day undefined, as in Ionic.
 */
export function parseDate(
    val: string | string[] | null | undefined
): DatetimeParts | DatetimeParts[] | undefined {
    if (Array.isArray(val)) {
        const parsedArray: DatetimeParts[] = [];
        for (const valStr of val) {
            const parsedVal = parseDate(valStr);
            if (!parsedVal) return undefined;
            parsedArray.push(parsedVal as DatetimeParts);
        }
        return parsedArray;
    }
    let parse: (string | number | undefined)[] | null = null;
    if (val != null && val !== '') {
        const time = TIME_REGEXP.exec(val);
        if (time) {
            parse = [...time];
            parse.unshift(undefined, undefined);
            parse[2] = parse[3] = undefined;
        } else {
            const iso = ISO_8601_REGEXP.exec(val);
            parse = iso ? [...iso] : null;
        }
    }
    if (parse === null) {
        printWarning(
            `Unable to parse date string: ${val}. Please provide a valid ISO 8601 datetime string.`
        );
        return undefined;
    }
    for (let i = 1; i < 8; i++) {
        parse[i] = parse[i] !== undefined ? parseInt(parse[i] as string, 10) : undefined;
    }
    const n = parse as (number | undefined)[];
    return {
        year: n[1] as number,
        month: n[2] as number,
        day: n[3] as number,
        hour: n[4],
        minute: n[5],
        ampm: (n[4] as number) < 12 ? 'am' : 'pm',
    };
}

export const clampDate = (
    dateParts: DatetimeParts,
    minParts?: DatetimeParts,
    maxParts?: DatetimeParts
): DatetimeParts => {
    if (minParts && isBefore(dateParts, minParts)) return minParts;
    if (maxParts && isAfter(dateParts, maxParts)) return maxParts;
    return dateParts;
};

export const parseAmPm = (hour: number): 'am' | 'pm' => (hour >= 12 ? 'pm' : 'am');

export const parseMaxParts = (
    max: string,
    todayParts: DatetimeParts
): DatetimeParts | undefined => {
    const result = parseDate(max) as DatetimeParts | undefined;
    if (result === undefined) return;
    const { month, day, year, hour, minute } = result;
    const yearValue = year ?? todayParts.year;
    const monthValue = month ?? 12;
    return {
        month: monthValue,
        day: day ?? getNumDaysInMonth(monthValue, yearValue),
        year: yearValue,
        hour: hour ?? 23,
        minute: minute ?? 59,
    };
};

export const parseMinParts = (
    min: string,
    todayParts: DatetimeParts
): DatetimeParts | undefined => {
    const result = parseDate(min) as DatetimeParts | undefined;
    if (result === undefined) return;
    const { month, day, year, hour, minute } = result;
    return {
        month: month ?? 1,
        day: day ?? 1,
        year: year ?? todayParts.year,
        hour: hour ?? 0,
        minute: minute ?? 0,
    };
};
